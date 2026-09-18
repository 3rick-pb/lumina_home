import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RADAR_COUNTRIES } from '@/lib/radarCountries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * GET /api/radar/countries
 * Retorna la lista de países configurados para el Radar Satelital.
 * Consulta la tabla dedicada `radar_countries` en Supabase con fallback a `RADAR_COUNTRIES`.
 */
export async function GET() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('radar_countries')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'database',
          countries: data,
        });
      }
    }
  } catch (err) {
    console.warn('[Radar API] Fallback to static country definitions:', err);
  }

  // Fallback seguro a las definiciones estáticas calibradas
  const staticCountries = Object.values(RADAR_COUNTRIES).map((c, idx) => ({
    code: c.code,
    name: c.name,
    flag_emoji: c.flag,
    currency_code: c.currency,
    currency_symbol: c.currencySymbol,
    total_regions: c.totalEntities,
    map_aspect_ratio: `${c.width}/${c.height}`,
    map_webp_url: c.mapWebp,
    map_png_url: c.mapPng,
    is_enabled: true,
    display_order: idx + 1,
  }));

  return NextResponse.json({
    success: true,
    source: 'static_core',
    countries: staticCountries,
  });
}
