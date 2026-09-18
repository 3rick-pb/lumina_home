import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveMultiCountryCoordinates, type RadarCountryCode } from '@/lib/radarCountries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * GET /api/radar/telemetry?country=EC
 * Obtiene las sesiones activas en el radar para un país específico desde `radar_telemetry_sessions`.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = (searchParams.get('country')?.toUpperCase() || 'EC') as RadarCountryCode;

    if (supabase) {
      const { data, error } = await supabase
        .from('radar_telemetry_sessions')
        .select('*')
        .eq('country_code', country)
        .eq('is_online', true)
        .order('last_seen', { ascending: false })
        .limit(100);

      if (!error && data) {
        return NextResponse.json({
          success: true,
          country,
          count: data.length,
          sessions: data,
        });
      }
    }
  } catch (err) {
    console.error('[Radar Telemetry API GET Error]:', err);
  }

  return NextResponse.json({
    success: true,
    country: 'EC',
    count: 0,
    sessions: [],
  });
}

/**
 * POST /api/radar/telemetry
 * Registra o actualiza la telemetría y coordenadas de un cliente/visitante en `radar_telemetry_sessions`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      userId,
      clientName,
      countryCode = 'EC',
      city,
      regionState,
      coordinateX,
      coordinateY,
      deviceType = 'desktop',
      currentSection = 'Explorando Tienda',
      cartAmount = 0,
      purchasesCount = 0,
      isOnline = true,
      isGuest = false,
    } = body;

    if (!sessionId || !city) {
      return NextResponse.json(
        { success: false, error: 'sessionId and city are required' },
        { status: 400 }
      );
    }

    // Resolver coordenadas si no vienen provistas
    let finalX = coordinateX;
    let finalY = coordinateY;
    if (typeof finalX !== 'number' || typeof finalY !== 'number' || finalX < 0 || finalY < 0) {
      const resolved = resolveMultiCountryCoordinates(city, countryCode as RadarCountryCode);
      finalX = resolved.x;
      finalY = resolved.y;
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('radar_telemetry_sessions')
        .upsert(
          {
            session_id: sessionId,
            user_id: userId || null,
            client_name: clientName || 'Visitante',
            country_code: countryCode.toUpperCase(),
            city,
            region_state: regionState || null,
            coordinate_x: finalX,
            coordinate_y: finalY,
            device_type: deviceType,
            current_section: currentSection,
            cart_amount: cartAmount,
            purchases_count: purchasesCount,
            is_online: isOnline,
            is_guest: isGuest,
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'session_id,country_code' }
        )
        .select();

      if (error) {
        console.warn('[Radar Telemetry Upsert Error]:', error.message);
      } else {
        return NextResponse.json({ success: true, telemetry: data?.[0] });
      }
    }

    return NextResponse.json({
      success: true,
      telemetry: {
        sessionId,
        city,
        countryCode,
        coordinateX: finalX,
        coordinateY: finalY,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
