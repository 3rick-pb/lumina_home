import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin, getScopedSupabaseClient } from '@/lib/serverAuth';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface DbCoupon {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_percent: number;
  discount_type: 'percent' | 'fixed' | 'free_shipping';
  fixed_amount: number;
  scope: 'all' | 'niche';
  target_niche: string | null;
  min_order_amount: number;
  max_uses: number | null;
  max_uses_per_user: number;
  used_count: number;
  share_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRedemption {
  id: string;
  coupon_id: string;
  coupon_code: string;
  order_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  before_amount: number;
  discount_amount: number;
  after_amount: number;
  items_summary: string | null;
  payment_method: string | null;
  redeemed_at: string;
}

const INITIAL_OFFICIAL_COUPONS = [
  {
    code: 'LUMINA10',
    title: 'Bienvenida Lumina Home',
    description: '10% de descuento directo en tu primera compra en todo el catálogo.',
    discount_percent: 10,
    discount_type: 'percent',
    fixed_amount: 0,
    scope: 'all',
    target_niche: null,
    min_order_amount: 0,
    max_uses: null,
    max_uses_per_user: 1,
    used_count: 0,
    share_count: 42,
    is_active: true,
    expires_at: null,
  },
  {
    code: 'AMIGOS-VIP20',
    title: 'Pase Exclusivo Amigos & Familia',
    description: '20% OFF en toda la tienda para compartir con tus amigos y grupos.',
    discount_percent: 20,
    discount_type: 'percent',
    fixed_amount: 0,
    scope: 'all',
    target_niche: null,
    min_order_amount: 30,
    max_uses: 50,
    max_uses_per_user: 1,
    used_count: 0,
    share_count: 19,
    is_active: true,
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  {
    code: 'LUX-LIGHTS25',
    title: 'Flash Sale Iluminación de Autor',
    description: '25% OFF en lámparas esculturales y luminarias de diseño.',
    discount_percent: 25,
    discount_type: 'percent',
    fixed_amount: 0,
    scope: 'niche',
    target_niche: 'Iluminación',
    min_order_amount: 50,
    max_uses: 30,
    max_uses_per_user: 1,
    used_count: 0,
    share_count: 27,
    is_active: true,
    expires_at: new Date(Date.now() + 15 * 86400000).toISOString(),
  },
  {
    code: 'ENVIOGRATIS',
    title: 'Envío Bonificado 100%',
    description: 'Cubre el costo de despacho garantizado a cualquier ciudad del Ecuador.',
    discount_percent: 0,
    discount_type: 'free_shipping',
    fixed_amount: 0,
    scope: 'all',
    target_niche: null,
    min_order_amount: 40,
    max_uses: null,
    max_uses_per_user: 1,
    used_count: 0,
    share_count: 56,
    is_active: true,
    expires_at: null,
  },
];

/**
 * GET /api/coupons
 * Fetches all coupons with live redemption metrics joined from public.coupon_redemptions.
 */
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'coupons_get',
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse('Demasiadas consultas de cupones.', rateLimit.resetTimeMs);
  }

  try {
    const { searchParams } = new URL(request.url);
    const codeQuery = searchParams.get('code')?.trim().toUpperCase();
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const supabase = getScopedSupabaseClient(request);

    // 1. Fetch coupons from PostgreSQL
    let query = supabase.from('coupons').select('*').order('created_at', { ascending: false });

    if (codeQuery) {
      query = query.eq('code', codeQuery);
    }
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: dbCoupons, error: fetchErr } = await query;
    if (fetchErr) {
      console.warn('[api/coupons] Notice querying coupons table:', fetchErr.message);
    }

    // Handle initialization if table is newly created / empty
    let couponList = (dbCoupons || []) as DbCoupon[];
    if ((!couponList || couponList.length === 0) && !codeQuery) {
      try {
        const { data: seeded, error: seedErr } = await supabase
          .from('coupons')
          .upsert(INITIAL_OFFICIAL_COUPONS, { onConflict: 'code' })
          .select('*');
        if (!seedErr && seeded && seeded.length > 0) {
          couponList = seeded as DbCoupon[];
        }
      } catch (seedEx) {
        console.warn('[api/coupons] Could not auto-seed default coupons:', seedEx);
      }
    }

    // 2. Fetch all real redemptions from public.coupon_redemptions
    const couponCodes = couponList.map((c) => c.code.toUpperCase());
    const redemptionsByCode = new Map<string, DbRedemption[]>();

    if (couponCodes.length > 0) {
      try {
        const { data: dbRedemptions, error: redErr } = await supabase
          .from('coupon_redemptions')
          .select('*')
          .in('coupon_code', couponCodes)
          .order('redeemed_at', { ascending: false });

        if (!redErr && dbRedemptions) {
          for (const r of dbRedemptions as DbRedemption[]) {
            const key = r.coupon_code.toUpperCase();
            if (!redemptionsByCode.has(key)) {
              redemptionsByCode.set(key, []);
            }
            redemptionsByCode.get(key)!.push(r);
          }
        }
      } catch (redEx) {
        console.warn('[api/coupons] Could not load redemptions:', redEx);
      }
    }

    // 3. Format response with unified frontend-compatible camelCase types
    const formatted = couponList.map((c) => {
      const codeKey = c.code.toUpperCase();
      const redList = redemptionsByCode.get(codeKey) || [];

      // Calculate live real aggregates from actual redemptions
      const realUsedCount = Math.max(Number(c.used_count) || 0, redList.length);
      const totalSaved = redList.reduce((sum, r) => sum + (Number(r.discount_amount) || 0), 0);
      const totalSpend = redList.reduce((sum, r) => sum + (Number(r.after_amount) || 0), 0);
      const averageTicket = redList.length > 0 ? totalSpend / redList.length : 0;

      return {
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description || '',
        discountPercent: Number(c.discount_percent) || 0,
        discountType: c.discount_type || 'percent',
        fixedAmount: Number(c.fixed_amount) || 0,
        scope: c.scope || 'all',
        targetNiche: c.target_niche || undefined,
        minOrderAmount: Number(c.min_order_amount) || 0,
        maxUses: c.max_uses !== null && c.max_uses !== undefined ? Number(c.max_uses) : null,
        maxUsesPerUser: Number(c.max_uses_per_user) || 1,
        usedCount: realUsedCount,
        shareCount: Number(c.share_count) || 0,
        expiresAt: c.expires_at || null,
        isActive: c.is_active !== false,
        createdAt: c.created_at || new Date().toISOString(),
        updatedAt: c.updated_at || c.created_at || new Date().toISOString(),
        // Real analytics metrics attached directly to each coupon
        metrics: {
          totalRedemptions: realUsedCount,
          totalSaved,
          averageTicket,
          shareCount: Number(c.share_count) || 0,
        },
        // Real customer redemption history
        redemptions: redList.map((r) => ({
          id: r.id,
          orderId: r.order_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerAvatarSeed: r.customer_email || r.customer_name,
          customerAvatarShape: 'squircle',
          usedAt: r.redeemed_at,
          beforeAmount: Number(r.before_amount) || 0,
          discountAmount: Number(r.discount_amount) || 0,
          afterAmount: Number(r.after_amount) || 0,
          itemsSummary: r.items_summary || 'Piezas Lumina Home',
          paymentMethod: r.payment_method || 'Tarjeta de Crédito',
        })),
      };
    });

    if (codeQuery) {
      if (formatted.length === 0) {
        return NextResponse.json({ success: false, error: 'Cupón no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, coupon: formatted[0] });
    }

    return NextResponse.json({
      success: true,
      coupons: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('[API /api/coupons GET] Error:', error);
    return NextResponse.json({ success: false, error: String(error), coupons: [] }, { status: 500 });
  }
}

/**
 * POST /api/coupons
 * Creates a new discount coupon in public.coupons.
 * Restricted to authenticated administrators.
 */
export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: 'coupons_post',
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse('Límite de solicitudes de creación excedido.', rateLimit.resetTimeMs);
  }

  try {
    const authUser = await getAuthenticatedUser(request);
    const cleanEmail = (authUser?.email || '').toLowerCase().trim();
    const isAdmin = cleanEmail ? await verifyIsAdmin(cleanEmail) : false;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      title,
      description,
      discountPercent,
      discountType,
      fixedAmount,
      scope,
      targetNiche,
      minOrderAmount,
      maxUses,
      maxUsesPerUser,
      expiresAt,
      isActive,
    } = body;

    // Strict validation
    const rawCode = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!rawCode || rawCode.length < 3 || rawCode.length > 30) {
      return NextResponse.json(
        { success: false, error: 'El código de cupón debe tener entre 3 y 30 caracteres alfanuméricos.' },
        { status: 400 }
      );
    }

    const cleanTitle = String(title || `Cupón ${rawCode}`).replace(/<[^>]*>?/gm, '').trim().slice(0, 100);
    const cleanDesc = description ? String(description).replace(/<[^>]*>?/gm, '').trim().slice(0, 300) : null;
    const cleanPercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
    const cleanType = discountType === 'free_shipping' ? 'free_shipping' : discountType === 'fixed' ? 'fixed' : 'percent';
    const cleanFixed = Math.max(0, Number(fixedAmount) || 0);
    const cleanScope = scope === 'niche' ? 'niche' : 'all';
    const cleanNiche = cleanScope === 'niche' && targetNiche ? String(targetNiche).replace(/<[^>]*>?/gm, '').trim().slice(0, 60) : null;
    const cleanMinOrder = Math.max(0, Number(minOrderAmount) || 0);
    const cleanMaxUses = maxUses !== undefined && maxUses !== null ? Math.max(1, parseInt(String(maxUses), 10)) : null;
    const cleanMaxPerUser = Math.max(1, parseInt(String(maxUsesPerUser || 1), 10));
    const cleanExpires = expiresAt && !isNaN(new Date(expiresAt).getTime()) ? new Date(expiresAt).toISOString() : null;
    const cleanActive = isActive !== false;

    const supabase = getScopedSupabaseClient(request);

    // Check for duplicate code
    const { data: existing } = await supabase
      .from('coupons')
      .select('id, code')
      .eq('code', rawCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existe un cupón registrado con el código ${rawCode}.` },
        { status: 409 }
      );
    }

    const newId = crypto.randomUUID();

    const { data: inserted, error: insertErr } = await supabase
      .from('coupons')
      .insert({
        id: newId,
        code: rawCode,
        title: cleanTitle,
        description: cleanDesc,
        discount_percent: cleanPercent,
        discount_type: cleanType,
        fixed_amount: cleanFixed,
        scope: cleanScope,
        target_niche: cleanNiche,
        min_order_amount: cleanMinOrder,
        max_uses: cleanMaxUses,
        max_uses_per_user: cleanMaxPerUser,
        used_count: 0,
        share_count: 0,
        is_active: cleanActive,
        expires_at: cleanExpires,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertErr || !inserted) {
      console.error('[API /api/coupons POST] Error inserting coupon:', insertErr);
      return NextResponse.json(
        { success: false, error: insertErr?.message || 'Error al guardar el cupón en la base de datos.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        coupon: {
          id: inserted.id,
          code: inserted.code,
          title: inserted.title,
          description: inserted.description || '',
          discountPercent: Number(inserted.discount_percent) || 0,
          discountType: inserted.discount_type,
          fixedAmount: Number(inserted.fixed_amount) || 0,
          scope: inserted.scope,
          targetNiche: inserted.target_niche || undefined,
          minOrderAmount: Number(inserted.min_order_amount) || 0,
          maxUses: inserted.max_uses,
          maxUsesPerUser: inserted.max_uses_per_user,
          usedCount: 0,
          shareCount: 0,
          expiresAt: inserted.expires_at,
          isActive: inserted.is_active,
          createdAt: inserted.created_at,
          metrics: {
            totalRedemptions: 0,
            totalSaved: 0,
            averageTicket: 0,
            shareCount: 0,
          },
          redemptions: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/coupons POST] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * PATCH /api/coupons
 * Updates coupon status, increments share counter, or edits properties.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, id, code } = body;
    const supabase = getScopedSupabaseClient(request);

    if (!id && !code) {
      return NextResponse.json({ success: false, error: 'Se requiere id o code del cupón.' }, { status: 400 });
    }

    // 1. Action: Record share (publicly callable from WhatsApp / Copy links)
    if (action === 'record_share') {
      const matchCol = id ? 'id' : 'code';
      const matchVal = id || String(code).toUpperCase();

      const { data: curr } = await supabase
        .from('coupons')
        .select('id, share_count')
        .eq(matchCol, matchVal)
        .maybeSingle();

      if (curr) {
        const nextShare = (Number(curr.share_count) || 0) + 1;
        await supabase
          .from('coupons')
          .update({ share_count: nextShare, updated_at: new Date().toISOString() })
          .eq('id', curr.id);
        return NextResponse.json({ success: true, shareCount: nextShare });
      }
      return NextResponse.json({ success: false, error: 'Cupón no encontrado' }, { status: 404 });
    }

    // 2. Administrative Actions: Require verified admin
    const authUser = await getAuthenticatedUser(request);
    const cleanEmail = (authUser?.email || '').toLowerCase().trim();
    const isAdmin = cleanEmail ? await verifyIsAdmin(cleanEmail) : false;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const matchCol = id ? 'id' : 'code';
    const matchVal = id || String(code).toUpperCase();

    // Toggle active status
    if (action === 'toggle_status') {
      const { data: curr } = await supabase
        .from('coupons')
        .select('id, is_active')
        .eq(matchCol, matchVal)
        .maybeSingle();

      if (!curr) {
        return NextResponse.json({ success: false, error: 'Cupón no encontrado' }, { status: 404 });
      }

      const nextActive = !curr.is_active;
      const { data: updated, error } = await supabase
        .from('coupons')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', curr.id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, isActive: nextActive, coupon: updated });
    }

    // General field update
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = String(body.title).trim().slice(0, 100);
    if (body.description !== undefined) updates.description = String(body.description).trim().slice(0, 300);
    if (body.discountPercent !== undefined) updates.discount_percent = Number(body.discountPercent);
    if (body.discountType !== undefined) updates.discount_type = body.discountType;
    if (body.fixedAmount !== undefined) updates.fixed_amount = Number(body.fixedAmount);
    if (body.scope !== undefined) updates.scope = body.scope;
    if (body.targetNiche !== undefined) updates.target_niche = body.targetNiche;
    if (body.minOrderAmount !== undefined) updates.min_order_amount = Number(body.minOrderAmount);
    if (body.maxUses !== undefined) updates.max_uses = body.maxUses;
    if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;
    if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);

    const { data: updated, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq(matchCol, matchVal)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error) {
    console.error('[API /api/coupons PATCH] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/coupons
 * Deletes a coupon from public.coupons.
 * Restricted to authenticated administrators.
 */
export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const cleanEmail = (authUser?.email || '').toLowerCase().trim();
    const isAdmin = cleanEmail ? await verifyIsAdmin(cleanEmail) : false;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!id && !code) {
      return NextResponse.json({ success: false, error: 'Se requiere id o code para eliminar.' }, { status: 400 });
    }

    const supabase = getScopedSupabaseClient(request);
    const matchCol = id ? 'id' : 'code';
    const matchVal = id || code;

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq(matchCol, matchVal);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Cupón ${matchVal} eliminado correctamente.` });
  } catch (error) {
    console.error('[API /api/coupons DELETE] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
