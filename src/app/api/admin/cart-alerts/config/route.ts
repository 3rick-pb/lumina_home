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

    // 1. Try to read personal admin configuration
    const userSessionId = `SYS_ALERT_CFG_${cleanEmail}`;
    const { data: userRow } = await baseSupabase
      .from('active_sessions')
      .select('email')
      .eq('user_id', userSessionId)
      .maybeSingle();

    if (userRow?.email) {
      try {
        const parsed = JSON.parse(userRow.email);
        if (parsed && typeof parsed === 'object') {
          return NextResponse.json(
            { success: true, config: { ...DEFAULT_ALERT_CONFIG, ...parsed } },
            {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                Pragma: 'no-cache',
              },
            }
          );
        }
      } catch {}
    }

    // 2. Try to read global fallback configuration
    const { data: globalRow } = await baseSupabase
      .from('active_sessions')
      .select('email')
      .eq('user_id', 'SYS_ADMIN_CART_ALERT_CONFIG')
      .maybeSingle();

    if (globalRow?.email) {
      try {
        const parsed = JSON.parse(globalRow.email);
        if (parsed && typeof parsed === 'object') {
          return NextResponse.json(
            { success: true, config: { ...DEFAULT_ALERT_CONFIG, ...parsed } },
            {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                Pragma: 'no-cache',
              },
            }
          );
        }
      } catch {}
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

    const serialized = JSON.stringify(validatedConfig);

    // Save personalized config for this admin
    const userSessionId = `SYS_ALERT_CFG_${cleanEmail}`;
    await baseSupabase.from('active_sessions').upsert(
      {
        user_id: userSessionId,
        name: 'SYS_ALERT_CFG',
        email: serialized,
        current_section: 'SYSTEM_CONFIG',
        is_online: false,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    // Also update global store fallback
    await baseSupabase.from('active_sessions').upsert(
      {
        user_id: 'SYS_ADMIN_CART_ALERT_CONFIG',
        name: 'SYS_ALERT_CFG_GLOBAL',
        email: serialized,
        current_section: 'SYSTEM_CONFIG',
        is_online: false,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

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
