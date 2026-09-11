import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const baseSupabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_ALERT_CONFIG = {
  position: 'bottom-right',
  layout: 'flight_route',
  presetId: 'monochrome_dark',
  bgColor: '#111827',
  textColor: '#ffffff',
  subtextColor: '#9ca3af',
  accentColor: '#10b981',
  title: 'NOTIFICACIÓN',
  duration: 6000,
  soundEnabled: true,
  toastType: 'custom_preset',
};

const VALID_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
const VALID_LAYOUTS = ['flight_route', 'stacked_ticket', 'split_capsule', 'bento_grid'] as const;
const VALID_TOAST_TYPES = ['custom_preset', 'monochrome', 'high_contrast'] as const;

// Hex color regex validation to strictly prevent CSS injection or XSS
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function sanitizeColor(val: unknown, fallback: string): string {
  if (typeof val === 'string' && HEX_COLOR_REGEX.test(val.trim())) {
    return val.trim();
  }
  return fallback;
}

function sanitizeText(val: unknown, maxLen = 50, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  // Strip dangerous characters / HTML brackets
  const cleaned = val.replace(/[<>]/g, '').trim();
  return cleaned.slice(0, maxLen) || fallback;
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const cleanEmail = (authUser?.email || '').toLowerCase().trim();
    const isAdmin = cleanEmail ? await verifyIsAdmin(cleanEmail) : false;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requieren permisos de administrador.' },
        { status: 401 }
      );
    }

    // Helper to map typed database columns to frontend config
    const mapRowToConfig = (row: Record<string, unknown>) => ({
      position: (row.position as string) || DEFAULT_ALERT_CONFIG.position,
      layout: (row.layout as string) || DEFAULT_ALERT_CONFIG.layout,
      presetId: (row.preset_id as string) || DEFAULT_ALERT_CONFIG.presetId,
      bgColor: (row.bg_color as string) || DEFAULT_ALERT_CONFIG.bgColor,
      textColor: (row.text_color as string) || DEFAULT_ALERT_CONFIG.textColor,
      subtextColor: (row.subtext_color as string) || DEFAULT_ALERT_CONFIG.subtextColor,
      accentColor: (row.accent_color as string) || DEFAULT_ALERT_CONFIG.accentColor,
      title: (row.title as string) || DEFAULT_ALERT_CONFIG.title,
      duration: typeof row.duration === 'number' ? row.duration : DEFAULT_ALERT_CONFIG.duration,
      soundEnabled: typeof row.sound_enabled === 'boolean' ? row.sound_enabled : DEFAULT_ALERT_CONFIG.soundEnabled,
      toastType: (row.toast_type as string) || DEFAULT_ALERT_CONFIG.toastType,
    });

    // 1. Try to read personal admin configuration from dedicated table
    const { data: userRow, error: userErr } = await baseSupabase
      .from('admin_notification_settings')
      .select('*')
      .eq('id', cleanEmail)
      .maybeSingle();

    if (!userErr && userRow) {
      return NextResponse.json(
        { success: true, config: mapRowToConfig(userRow) },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        }
      );
    }

    // 2. Try to read global fallback configuration from dedicated table
    const { data: globalRow, error: globalErr } = await baseSupabase
      .from('admin_notification_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (!globalErr && globalRow) {
      return NextResponse.json(
        { success: true, config: mapRowToConfig(globalRow) },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            Pragma: 'no-cache',
          },
        }
      );
    }

    return NextResponse.json(
      { success: true, config: DEFAULT_ALERT_CONFIG },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const cleanEmail = (authUser?.email || '').toLowerCase().trim();
    const isAdmin = cleanEmail ? await verifyIsAdmin(cleanEmail) : false;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado. Se requieren permisos de administrador para guardar la configuración.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Payload inválido.' }, { status: 400 });
    }

    // Strict sanitization & validation
    const position = VALID_POSITIONS.includes(body.position) ? body.position : 'bottom-right';
    const layout = VALID_LAYOUTS.includes(body.layout) ? body.layout : 'flight_route';
    const toastType = VALID_TOAST_TYPES.includes(body.toastType) ? body.toastType : 'custom_preset';
    const presetId = sanitizeText(body.presetId, 40, 'custom_preset');

    const bgColor = sanitizeColor(body.bgColor, '#111827');
    const textColor = sanitizeColor(body.textColor, '#ffffff');
    const subtextColor = sanitizeColor(body.subtextColor, '#9ca3af');
    const accentColor = sanitizeColor(body.accentColor, '#10b981');

    const title = sanitizeText(body.title, 50, 'NOTIFICACIÓN');
    const duration = Math.min(30000, Math.max(2000, Number(body.duration) || 6000));
    const soundEnabled = Boolean(body.soundEnabled !== false);

    const validatedConfig = {
      position,
      layout,
      presetId,
      bgColor,
      textColor,
      subtextColor,
      accentColor,
      title,
      duration,
      soundEnabled,
      toastType,
    };

    const rowPayload = {
      position,
      layout,
      preset_id: presetId,
      bg_color: bgColor,
      text_color: textColor,
      subtext_color: subtextColor,
      accent_color: accentColor,
      title,
      duration,
      sound_enabled: soundEnabled,
      toast_type: toastType,
      updated_at: new Date().toISOString(),
    };

    // 1. Save personalized config in dedicated table admin_notification_settings
    await baseSupabase.from('admin_notification_settings').upsert(
      {
        id: cleanEmail,
        admin_email: cleanEmail,
        ...rowPayload,
      },
      { onConflict: 'id' }
    );

    // 2. Also update global store fallback in dedicated table
    await baseSupabase.from('admin_notification_settings').upsert(
      {
        id: 'global',
        admin_email: cleanEmail,
        ...rowPayload,
      },
      { onConflict: 'id' }
    );

    // 3. Proactively clean any legacy garbage rows in active_sessions
    try {
      await baseSupabase
        .from('active_sessions')
        .delete()
        .or(`user_id.like.SYS_ALERT_CFG_%,user_id.eq.SYS_ADMIN_CART_ALERT_CONFIG`);
    } catch {}

    // Broadcast config update in realtime to any active client tabs
    try {
      const alertChannel = baseSupabase.channel('admin:cart_alerts');
      await new Promise<void>((resolve) => {
        alertChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await alertChannel.send({
              type: 'broadcast',
              event: 'config_updated',
              payload: {
                config: validatedConfig,
                updatedBy: cleanEmail,
                timestamp: Date.now(),
              },
            });
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            resolve();
          }
        });
        setTimeout(resolve, 500);
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Configuración de alertas guardada exitosamente en base de datos.',
      config: validatedConfig,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
