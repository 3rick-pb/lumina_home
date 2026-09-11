import { NextResponse } from 'next/server';
import { supabaseServer, getAuthenticatedUser } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface UserAvatarSettingsPayload {
  userId: string;
  userEmail?: string;
  showInNavbar?: boolean;
  backgroundShape?: 'squircle' | 'circle';
  animationMode?: 'always' | 'hover' | 'none';
  customSeed?: string | null;
}

const DEFAULT_SETTINGS = {
  showInNavbar: false,
  backgroundShape: 'squircle' as const,
  animationMode: 'always' as const,
  customSeed: null as string | null,
};

/**
 * GET /api/user/avatar-settings?userId=...
 * Obtiene la configuración exclusiva de avatar para una cuenta desde la tabla dedicada `user_avatar_settings`
 */
export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const targetUserId = authUser?.id || queryUserId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'No se especificó un usuario válido', settings: DEFAULT_SETTINGS },
        { status: 400 }
      );
    }

    // Consultar tabla dedicada public.user_avatar_settings
    const { data, error } = await supabaseServer
      .from('user_avatar_settings')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error) {
      // Si la tabla aún no existe en Supabase o error de schema
      const isMissingTable = error.code === '42P01' || error.message?.includes('schema cache');
      return NextResponse.json({
        success: true,
        tableReady: !isMissingTable,
        source: isMissingTable ? 'fallback_default' : 'error_fallback',
        error: isMissingTable ? 'Tabla user_avatar_settings no creada aún en Supabase' : error.message,
        settings: DEFAULT_SETTINGS,
      });
    }

    if (!data) {
      return NextResponse.json({
        success: true,
        tableReady: true,
        source: 'default_empty',
        settings: {
          ...DEFAULT_SETTINGS,
          userEmail: authUser?.email || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      tableReady: true,
      source: 'database',
      settings: {
        userId: data.user_id,
        userEmail: data.user_email,
        showInNavbar: typeof data.show_in_navbar === 'boolean' ? data.show_in_navbar : DEFAULT_SETTINGS.showInNavbar,
        backgroundShape: data.background_shape === 'circle' ? 'circle' : 'squircle',
        animationMode: data.animation_mode || 'always',
        customSeed: data.custom_seed || null,
        updatedAt: data.updated_at,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      settings: DEFAULT_SETTINGS,
    }, { status: 500 });
  }
}

/**
 * POST /api/user/avatar-settings
 * Guarda o actualiza (upsert) la configuración individual en la tabla dedicada `user_avatar_settings`
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const body: Partial<UserAvatarSettingsPayload> = await request.json();

    const targetUserId = authUser?.id || body.userId;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Identificador de usuario no proporcionado' },
        { status: 400 }
      );
    }

    const payload = {
      user_id: targetUserId,
      user_email: authUser?.email || body.userEmail || null,
      show_in_navbar: typeof body.showInNavbar === 'boolean' ? body.showInNavbar : false,
      background_shape: body.backgroundShape === 'circle' ? 'circle' : 'squircle',
      animation_mode: body.animationMode || 'always',
      custom_seed: body.customSeed?.trim() ? body.customSeed.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from('user_avatar_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      const isMissingTable = error.code === '42P01' || error.message?.includes('schema cache');
      return NextResponse.json({
        success: false,
        tableReady: !isMissingTable,
        error: isMissingTable 
          ? 'La tabla "user_avatar_settings" no existe todavía en Supabase. Ejecuta el script supabase_avatar_settings.sql en Supabase SQL Editor.' 
          : error.message,
      }, { status: isMissingTable ? 200 : 500 });
    }

    return NextResponse.json({
      success: true,
      tableReady: true,
      message: 'Configuración de avatar guardada exitosamente en public.user_avatar_settings',
      data,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
