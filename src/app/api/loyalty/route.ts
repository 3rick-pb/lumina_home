import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface LoyaltyProgramSettingsPayload {
  programName: string;
  issuerName: string;
  tagline: string;
  pointsPerDollar: number;
  welcomeBonusPoints: number;
  rewardThreshold: number;
  rewardDescription: string;
  bgColor: string;
  accentColor: string;
  textColor: string;
  qrFgColor: string;
  qrBgColor: string;
  qrCornerStyle: 'rounded' | 'sharp' | 'dots';
  customLogoDataUrl?: string;
  tierSilverMin: number;
  tierGoldMin: number;
  tierBlackMin: number;
  pushMessage: string;
  autoSyncPurchases: boolean;
  appleTeamId: string;
  applePassTypeId: string;
  googleIssuerId: string;
  googleClassId: string;
}

const DEFAULT_SETTINGS: LoyaltyProgramSettingsPayload = {
  programName: 'Lumina Member Pass',
  issuerName: 'Lumina Home',
  tagline: 'Espacios con Alma y Diseño de Autor',
  pointsPerDollar: 10,
  welcomeBonusPoints: 200,
  rewardThreshold: 1500,
  rewardDescription: '$25 USD de saldo a favor en tu próxima orden + Envío Preferencial',
  bgColor: '#171717',
  accentColor: '#8c9276',
  textColor: '#ffffff',
  qrFgColor: '#171717',
  qrBgColor: '#ffffff',
  qrCornerStyle: 'rounded',
  customLogoDataUrl: '',
  tierSilverMin: 0,
  tierGoldMin: 1200,
  tierBlackMin: 3000,
  pushMessage: 'Tus puntos de lealtad se han actualizado tras tu compra.',
  autoSyncPurchases: true,
  appleTeamId: 'LUMINA99EC',
  applePassTypeId: 'pass.ec.luminahome.member',
  googleIssuerId: '3388000000022194812',
  googleClassId: 'lumina_member_pass_v2',
};

const BANNED_DEMO_EMAILS = new Set([
  'valeria.andrade@gmail.com',
  's.montalvo@outlook.com',
  'camila.cordero@icloud.com',
  'prueba@luminahome.com',
]);

function generateDeterministicCode(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) % 9000;
  }
  const num = 1000 + Math.abs(hash);
  return `LUM-${num}-PRV`;
}

/**
 * GET /api/loyalty
 * Obtiene la configuración del programa desde `loyalty_program_settings` y la lista 100% real
 * de miembros desde `loyalty_members` + sincronización en vivo con `orders` y `user_profiles`.
 */
export async function GET() {
  try {
    let config: LoyaltyProgramSettingsPayload = { ...DEFAULT_SETTINGS };

    // 1. Intentar leer de la tabla dedicada `public.loyalty_program_settings`
    try {
      const { data: cfgRow, error: cfgErr } = await supabaseServer
        .from('loyalty_program_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (!cfgErr && cfgRow) {
        config = {
          programName: cfgRow.program_name || DEFAULT_SETTINGS.programName,
          issuerName: cfgRow.issuer_name || DEFAULT_SETTINGS.issuerName,
          tagline: cfgRow.tagline || DEFAULT_SETTINGS.tagline,
          pointsPerDollar: Number(cfgRow.points_per_dollar ?? DEFAULT_SETTINGS.pointsPerDollar),
          welcomeBonusPoints: Number(cfgRow.welcome_bonus_points ?? DEFAULT_SETTINGS.welcomeBonusPoints),
          rewardThreshold: Number(cfgRow.reward_threshold ?? DEFAULT_SETTINGS.rewardThreshold),
          rewardDescription: cfgRow.reward_description || DEFAULT_SETTINGS.rewardDescription,
          bgColor: cfgRow.bg_color || DEFAULT_SETTINGS.bgColor,
          accentColor: cfgRow.accent_color || DEFAULT_SETTINGS.accentColor,
          textColor: cfgRow.text_color || DEFAULT_SETTINGS.textColor,
          qrFgColor: cfgRow.qr_fg_color || DEFAULT_SETTINGS.qrFgColor,
          qrBgColor: cfgRow.qr_bg_color || DEFAULT_SETTINGS.qrBgColor,
          qrCornerStyle: cfgRow.qr_corner_style || DEFAULT_SETTINGS.qrCornerStyle,
          customLogoDataUrl: cfgRow.custom_logo_data_url || '',
          tierSilverMin: Number(cfgRow.tier_silver_min ?? DEFAULT_SETTINGS.tierSilverMin),
          tierGoldMin: Number(cfgRow.tier_gold_min ?? DEFAULT_SETTINGS.tierGoldMin),
          tierBlackMin: Number(cfgRow.tier_black_min ?? DEFAULT_SETTINGS.tierBlackMin),
          pushMessage: cfgRow.push_message || DEFAULT_SETTINGS.pushMessage,
          autoSyncPurchases: Boolean(cfgRow.auto_sync_purchases ?? true),
          appleTeamId: cfgRow.apple_team_id || DEFAULT_SETTINGS.appleTeamId,
          applePassTypeId: cfgRow.apple_pass_type_id || DEFAULT_SETTINGS.applePassTypeId,
          googleIssuerId: cfgRow.google_issuer_id || DEFAULT_SETTINGS.googleIssuerId,
          googleClassId: cfgRow.google_class_id || DEFAULT_SETTINGS.googleClassId,
        };
      }
    } catch {
      // Si la tabla aún está por crearse en SQL Editor, mantenemos defaults limpios
    }

    // 2. Consultar miembros reales registrados en `public.loyalty_members`
    const memberMap = new Map<
      string,
      {
        id: string;
        memberCode: string;
        customerName: string;
        customerEmail: string;
        pointsBalance: number;
        lifetimePoints: number;
        totalSpent: number;
        purchasesCount: number;
        walletPlatform: 'apple' | 'google' | 'both';
        status: 'active' | 'suspended';
        createdAt: string;
        lastUpdated: string;
      }
    >();

    try {
      const { data: dbMembers, error: memErr } = await supabaseServer
        .from('loyalty_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (!memErr && Array.isArray(dbMembers)) {
        for (const m of dbMembers) {
          const email = String(m.customer_email || '').toLowerCase().trim();
          if (!email || BANNED_DEMO_EMAILS.has(email)) continue;
          memberMap.set(email, {
            id: String(m.id),
            memberCode: String(m.member_code || generateDeterministicCode(email)),
            customerName: String(m.customer_name || email.split('@')[0]),
            customerEmail: email,
            pointsBalance: Number(m.points_balance || 0),
            lifetimePoints: Number(m.lifetime_points || 0),
            totalSpent: Number(m.total_spent || 0),
            purchasesCount: Number(m.purchases_count || 0),
            walletPlatform: (m.wallet_platform as 'apple' | 'google' | 'both') || 'apple',
            status: (m.status as 'active' | 'suspended') || 'active',
            createdAt: m.created_at ? String(m.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
            lastUpdated: 'Sincronizado BD',
          });
        }
      }
    } catch {
      // Continuar con agregación de perfiles y órdenes reales
    }

    // 3. Cruzar en tiempo real con `public.user_profiles` y `public.orders` (100% Datos Reales)
    try {
      const { data: profiles } = await supabaseServer
        .from('user_profiles')
        .select('id, email, full_name, name, created_at');

      if (Array.isArray(profiles)) {
        for (const p of profiles) {
          const email = String(p.email || '').toLowerCase().trim();
          if (!email || BANNED_DEMO_EMAILS.has(email)) continue;
          if (!memberMap.has(email)) {
            const name = String(p.full_name || p.name || email.split('@')[0]);
            memberMap.set(email, {
              id: `loy_${p.id || email.replace(/[^a-z0-9]/g, '_')}`,
              memberCode: generateDeterministicCode(email),
              customerName: name,
              customerEmail: email,
              pointsBalance: config.welcomeBonusPoints,
              lifetimePoints: config.welcomeBonusPoints,
              totalSpent: 0,
              purchasesCount: 0,
              walletPlatform: 'apple',
              status: 'active',
              createdAt: p.created_at ? String(p.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
              lastUpdated: 'Sincronizado BD',
            });
          }
        }
      }
    } catch {}

    try {
      const { data: realOrders } = await supabaseServer
        .from('orders')
        .select('id, user_email, customer_name, total, status, created_at')
        .not('id', 'like', 'SYS_%');

      if (Array.isArray(realOrders)) {
        // Agrupar compras reales por cliente
        const orderStats = new Map<string, { spent: number; count: number; name: string; firstDate: string }>();
        for (const ord of realOrders) {
          if (ord.status === 'cancelled') continue;
          const email = String(ord.user_email || '').toLowerCase().trim();
          if (!email || BANNED_DEMO_EMAILS.has(email)) continue;
          const prev = orderStats.get(email) || {
            spent: 0,
            count: 0,
            name: String(ord.customer_name || email.split('@')[0]),
            firstDate: ord.created_at ? String(ord.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
          };
          prev.spent += Number(ord.total || 0);
          prev.count += 1;
          orderStats.set(email, prev);
        }

        for (const [email, stats] of orderStats.entries()) {
          const earnedPoints = Math.round(stats.spent * config.pointsPerDollar) + config.welcomeBonusPoints;
          const existing = memberMap.get(email);
          if (existing) {
            existing.totalSpent = Math.max(existing.totalSpent, Number(stats.spent.toFixed(2)));
            existing.purchasesCount = Math.max(existing.purchasesCount, stats.count);
            if (config.autoSyncPurchases && earnedPoints > existing.lifetimePoints) {
              const diff = earnedPoints - existing.lifetimePoints;
              existing.pointsBalance += diff;
              existing.lifetimePoints = earnedPoints;
            }
          } else {
            memberMap.set(email, {
              id: `loy_ord_${email.replace(/[^a-z0-9]/g, '_')}`,
              memberCode: generateDeterministicCode(email),
              customerName: stats.name,
              customerEmail: email,
              pointsBalance: earnedPoints,
              lifetimePoints: earnedPoints,
              totalSpent: Number(stats.spent.toFixed(2)),
              purchasesCount: stats.count,
              walletPlatform: 'apple',
              status: 'active',
              createdAt: stats.firstDate,
              lastUpdated: 'Sincronizado BD',
            });
          }
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      config,
      members: Array.from(memberMap.values()),
    });
  } catch (err) {
    console.error('[GET /api/loyalty] Error:', err);
    return NextResponse.json({
      success: true,
      config: DEFAULT_SETTINGS,
      members: [],
    });
  }
}

/**
 * POST /api/loyalty
 * Persiste configuraciones del programa de lealtad o gestiona pases de clientes reales en Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'save_config' && body.config) {
      const c: LoyaltyProgramSettingsPayload = body.config;
      const { error } = await supabaseServer.from('loyalty_program_settings').upsert(
        {
          id: 'global',
          program_name: c.programName,
          issuer_name: c.issuerName,
          tagline: c.tagline,
          points_per_dollar: Number(c.pointsPerDollar),
          welcome_bonus_points: Number(c.welcomeBonusPoints),
          reward_threshold: Number(c.rewardThreshold),
          reward_description: c.rewardDescription,
          bg_color: c.bgColor,
          accent_color: c.accentColor,
          text_color: c.textColor,
          qr_fg_color: c.qrFgColor,
          qr_bg_color: c.qrBgColor,
          qr_corner_style: c.qrCornerStyle,
          custom_logo_data_url: c.customLogoDataUrl || '',
          tier_silver_min: Number(c.tierSilverMin),
          tier_gold_min: Number(c.tierGoldMin),
          tier_black_min: Number(c.tierBlackMin),
          push_message: c.pushMessage,
          auto_sync_purchases: Boolean(c.autoSyncPurchases),
          apple_team_id: c.appleTeamId,
          apple_pass_type_id: c.applePassTypeId,
          google_issuer_id: c.googleIssuerId,
          google_class_id: c.googleClassId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      return NextResponse.json({
        success: true,
        persistedInTable: !error,
      });
    }

    if (action === 'create_member' && body.member) {
      const m = body.member;
      const cleanEmail = String(m.customerEmail || '').toLowerCase().trim();
      if (!cleanEmail) {
        return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 });
      }

      // 1. Insertar en tabla dedicada `public.loyalty_members`
      await supabaseServer.from('loyalty_members').upsert(
        {
          id: String(m.id),
          member_code: String(m.memberCode || generateDeterministicCode(cleanEmail)),
          customer_name: String(m.customerName),
          customer_email: cleanEmail,
          points_balance: Number(m.pointsBalance || 0),
          lifetime_points: Number(m.lifetimePoints || 0),
          total_spent: Number(m.totalSpent || 0),
          purchases_count: Number(m.purchasesCount || 0),
          wallet_platform: m.walletPlatform || 'apple',
          status: m.status || 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'customer_email' }
      );

      // 2. Asegurar perfil real en `public.user_profiles` para trazabilidad completa
      await supabaseServer.from('user_profiles').upsert(
        {
          email: cleanEmail,
          full_name: String(m.customerName),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'adjust_points' && body.memberId) {
      const { memberId, customerEmail, pointsBalance, lifetimePoints, delta, reason } = body;

      await supabaseServer
        .from('loyalty_members')
        .update({
          points_balance: Number(pointsBalance),
          lifetime_points: Number(lifetimePoints),
          updated_at: new Date().toISOString(),
        })
        .eq('id', String(memberId));

      if (customerEmail && typeof delta === 'number') {
        await supabaseServer.from('loyalty_point_ledger').insert({
          member_id: String(memberId),
          customer_email: String(customerEmail).toLowerCase().trim(),
          points_delta: delta,
          reason: reason || 'Ajuste administrativo en Pass Studio',
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete_member' && body.memberId) {
      await supabaseServer
        .from('loyalty_members')
        .delete()
        .eq('id', String(body.memberId));

      if (body.customerEmail) {
        await supabaseServer
          .from('loyalty_members')
          .delete()
          .eq('customer_email', String(body.customerEmail).toLowerCase().trim());
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/loyalty] Error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
