import { NextResponse } from 'next/server';

const headers = {
  'User-Agent': 'LuminaHome-App/1.0 (delivery-routing; contact@luminahome.com)',
  'Accept-Language': 'es'
};

const cleanAdmin = (str?: string) => {
  if (!str) return '';
  return str
    .replace(/^Distrito Metropolitano de\s+/i, '')
    .replace(/^Distrito\s+/i, '')
    .replace(/^Cantón\s+/i, '')
    .replace(/^Municipio de\s+/i, '')
    .replace(/^Comunidad de\s+/i, '')
    .replace(/^Provincia de\s+/i, '')
    .replace(/^Departamento de\s+/i, '')
    .replace(/^Ciudad de\s+/i, '')
    .trim();
};

const polishRoadName = (name?: string | null) => {
  if (!name) return '';
  let n = name.trim();
  n = n.replace(/\bSan Cristobal\b/gi, 'San Cristóbal');
  n = n.replace(/\bSimon Bolivar\b/gi, 'Simón Bolívar');
  n = n.replace(/\bEloy Alfaro\b/gi, 'Eloy Alfaro');
  n = n.replace(/\bGarcia Moreno\b/gi, 'García Moreno');
  n = n.replace(/\b10 de Agosto\b/gi, '10 de Agosto');
  return n;
};

// Provincial / Regional Metropolitan Hubs (seeing from higher level "desde arriba en el mapa")
const ECUADOR_METROPOLITAN_CITIES: Record<string, string> = {
  'pichincha': 'Quito',
  'guayas': 'Guayaquil',
  'azuay': 'Cuenca',
  'tungurahua': 'Ambato',
  'manabi': 'Portoviejo',
  'manabí': 'Portoviejo',
  'el oro': 'Machala',
  'loja': 'Loja',
  'imbabura': 'Ibarra',
  'chimborazo': 'Riobamba',
  'santo domingo de los tsachilas': 'Santo Domingo',
  'santo domingo de los tsáchilas': 'Santo Domingo',
  'esmeraldas': 'Esmeraldas',
  'los rios': 'Babahoyo',
  'los ríos': 'Babahoyo',
  'santa elena': 'Santa Elena',
  'cotopaxi': 'Latacunga',
  'carchi': 'Tulcán',
  'cañar': 'Azogues',
  'bolivar': 'Guaranda',
  'bolívar': 'Guaranda',
  'pastaza': 'Puyo',
  'morona santiago': 'Macas',
  'napo': 'Tena',
  'zamora chinchipe': 'Zamora',
  'orellana': 'El Coca',
  'sucumbios': 'Lago Agrio',
  'sucumbíos': 'Lago Agrio',
  'galapagos': 'Galápagos',
  'galápagos': 'Galápagos'
};

function resolveMajorCity(
  rawCity?: string,
  rawCounty?: string,
  rawMunicipality?: string,
  bdcCity?: string,
  stateName?: string,
  countryName?: string
): string {
  const cCity = cleanAdmin(rawCity);
  const cCounty = cleanAdmin(rawCounty);
  const cMun = cleanAdmin(rawMunicipality);
  const cBdc = cleanAdmin(bdcCity);

  // Preserve the exact real city/canton reported by GPS reverse geocoding first!
  if (cCity || cCounty || cMun || cBdc) {
    return cCity || cCounty || cMun || cBdc;
  }

  const normState = (stateName || '').toLowerCase().trim();
  const isEcuador = !countryName || countryName.toLowerCase().includes('ecuador');
  if (isEcuador && ECUADOR_METROPOLITAN_CITIES[normState]) {
    return ECUADOR_METROPOLITAN_CITIES[normState];
  }

  return '';
}

// 1. Topological Intersecting Street Discovery via OSM Junction Nodes
async function getTopologicalCrossStreet(osmId: string | number, userLat: number, userLon: number, primaryRoadName: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const wayUrl = `https://api.openstreetmap.org/api/0.6/way/${osmId}/full.json`;
    const wayRes = await fetch(wayUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!wayRes.ok) return null;
    const wayData = await wayRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes = (wayData.elements || []).filter((e: any) => e.type === 'node');
    if (!nodes.length) return null;

    // Sort nodes by distance to user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodes.sort((a: any, b: any) => {
      const distA = Math.hypot(a.lat - userLat, a.lon - userLon);
      const distB = Math.hypot(b.lat - userLat, b.lon - userLon);
      return distA - distB;
    });

    const prim = (primaryRoadName || '').toLowerCase().trim();

    // Probe closest junction nodes (up to 3)
    for (const node of nodes.slice(0, 3)) {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 3000);
      const nodeWaysUrl = `https://api.openstreetmap.org/api/0.6/node/${node.id}/ways.json`;
      const nodeWaysRes = await fetch(nodeWaysUrl, { headers, signal: c2.signal });
      clearTimeout(t2);
      if (!nodeWaysRes.ok) continue;
      const nodeWaysData = await nodeWaysRes.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candidateWays = (nodeWaysData.elements || []).filter((w: any) => {
        if (!w.tags || !w.tags.name) return false;
        const cand = w.tags.name.toLowerCase().trim();
        return cand !== prim && !cand.includes(prim) && !prim.includes(cand);
      });

      if (candidateWays.length > 0) {
        return candidateWays[0].tags.name.trim();
      }
    }
  } catch {
    // Timeout or network error, fallback gracefully
  }
  return null;
}

// 2. Nearby Landmarks Discovery (~6 cuadras / ~600m)
async function getLandmarkPlaceName(lat: number, lon: number) {
  try {
    const delta = 0.0055; // ~600m
    const viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
    const queries = ['parque', 'colegio', 'salud', 'escuela'];

    const searchResults = await Promise.allSettled(
      queries.map(q =>
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&bounded=1&viewbox=${viewbox}&addressdetails=1`, { headers })
          .then(r => r.json())
      )
    );

    const detectedPlaces = new Map<string, number>();
    const pattern = /(?:parque\s+(?:central\s+)?(?:de\s+)?|unidad\s+educativa\s+|colegio\s+|escuela\s+|centro\s+de\s+salud\s+(?:de\s+)?|subcentro\s+de\s+salud\s+(?:de\s+)?|iglesia\s+(?:de\s+)?)([\wáéíóúñÁÉÍÓÚÑ\s]+)/i;

    for (const res of searchResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const item of res.value) {
          if (!item.name) continue;

          // Check address fields of the landmark
          const addr = item.address || {};
          const addrPlace = addr.village || addr.town || addr.suburb || addr.neighbourhood;
          if (addrPlace && addrPlace.length > 2) {
            detectedPlaces.set(addrPlace, (detectedPlaces.get(addrPlace) || 0) + 3);
          }

          // Check text regex on landmark name
          const match = item.name.match(pattern);
          if (match && match[1]) {
            const raw = match[1].trim();
            if (raw.length > 2 && !raw.toLowerCase().includes('maceta') && !raw.toLowerCase().includes('recreación')) {
              detectedPlaces.set(raw, (detectedPlaces.get(raw) || 0) + 2);
            }
          }
        }
      }
    }

    if (detectedPlaces.size > 0) {
      const sorted = Array.from(detectedPlaces.entries()).sort((a, b) => b[1] - a[1]);
      return sorted[0][0];
    }
  } catch {
    // Ignore landmark errors
  }
  return null;
}

interface IpLocationResult {
  city: string;
  state: string;
  country: string;
  postalCode: string;
  lat?: number;
  lon?: number;
}

async function resolveLocationFromIp(clientIp?: string | null): Promise<IpLocationResult | null> {
  const ipParam = clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1' ? clientIp.split(',')[0].trim() : '';

  // Attempt FreeIPApi
  try {
    const url = ipParam ? `https://freeipapi.com/api/json/${encodeURIComponent(ipParam)}` : 'https://freeipapi.com/api/json/';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LuminaHome-App/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.cityName || data.countryName) {
        return {
          city: data.cityName || 'Quito',
          state: data.regionName || 'Pichincha',
          country: data.countryName || 'Ecuador',
          postalCode: data.zipCode || '170150',
          lat: typeof data.latitude === 'number' ? data.latitude : undefined,
          lon: typeof data.longitude === 'number' ? data.longitude : undefined,
        };
      }
    }
  } catch {}

  // Attempt IPWhois fallback
  try {
    const url = ipParam ? `https://ipwho.is/${encodeURIComponent(ipParam)}?lang=es` : 'https://ipwho.is/?lang=es';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LuminaHome-App/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && (data.city || data.country)) {
        return {
          city: data.city || 'Quito',
          state: data.region || 'Pichincha',
          country: data.country || 'Ecuador',
          postalCode: data.postal || '170150',
          lat: typeof data.latitude === 'number' ? data.latitude : undefined,
          lon: typeof data.longitude === 'number' ? data.longitude : undefined,
        };
      }
    }
  } catch {}

  return {
    city: 'Quito',
    state: 'Pichincha',
    country: 'Ecuador',
    postalCode: '170150',
    lat: -0.1807,
    lon: -78.4678
  };
}

async function resolveGeocode(latRaw: unknown, lonRaw: unknown, clientIp?: string | null) {
  const hasValidCoords = 
    latRaw !== undefined && 
    latRaw !== null && 
    lonRaw !== undefined && 
    lonRaw !== null && 
    !isNaN(Number(latRaw)) && 
    !isNaN(Number(lonRaw)) &&
    Number(latRaw) !== 0 &&
    Number(lonRaw) !== 0;

  let nLat: number;
  let nLon: number;
  let isIpFallback = false;
  let ipMeta: IpLocationResult | null = null;

  if (!hasValidCoords) {
    isIpFallback = true;
    ipMeta = await resolveLocationFromIp(clientIp);
    if (!ipMeta) {
      return NextResponse.json(
        { success: false, error: 'No se pudo determinar la ubicación del dispositivo ni por red.' },
        { status: 400 }
      );
    }
    nLat = ipMeta.lat || -0.1807;
    nLon = ipMeta.lon || -78.4678;
  } else {
    nLat = Number(latRaw);
    nLon = Number(lonRaw);
  }

function extractExteriorNumber(displayName?: string, rawHouse?: string): string {
  if (rawHouse && rawHouse.trim()) return rawHouse.trim();
  if (!displayName) return '';
  // Match Ecuadorian exterior number patterns (e.g., N34-120, Oe4-20, S12-45, E3-22, #12-34, 12-45)
  const regex = /(?:^|,\s*)([A-Z]{1,2}\d{1,4}-\d{1,4}|N\d+-\d+|Oe\d+-\d+|S\d+-\d+|E\d+-\d+|#\s*\d+(?:-\d+)?|\b\d{1,5}-\d{1,4}\b)(?:,|$)/i;
  const match = displayName.match(regex);
  if (match && match[1]) {
    return match[1].replace(/^#\s*/, '').trim();
  }
  return '';
}

  // Run parallel queries: Mapbox + Micro (zoom 18) + Macro Road/Sector (zoom 16) + Regional Parish/District (zoom 14) + Offsets + BigDataCloud
  const tightOffset = 0.00022;
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '').trim();
  const hasMapbox = mapboxToken.startsWith('pk.');

  const [mapboxRes, microRes, macroRes, regionalRes, off1Res, off2Res, bdcRes] = await Promise.allSettled([
    hasMapbox
      ? fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${nLon},${nLat}.json?access_token=${mapboxToken}&language=es&types=address,poi,neighborhood,locality,place,postcode,region,country`
        ).then(r => r.json())
      : Promise.resolve(null),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=16`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=14`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat + tightOffset}&lon=${nLon}&addressdetails=1&zoom=17`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon - tightOffset}&addressdetails=1&zoom=17`, { headers }).then(r => r.json()),
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${nLat}&longitude=${nLon}&localityLanguage=es`).then(r => r.json())
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mbData: any = mapboxRes.status === 'fulfilled' ? mapboxRes.value : null;
  const origin = microRes.status === 'fulfilled' ? microRes.value : null;
  const macro = macroRes.status === 'fulfilled' ? macroRes.value : null;
  const regional = regionalRes.status === 'fulfilled' ? regionalRes.value : null;
  const off1 = off1Res.status === 'fulfilled' ? off1Res.value : null;
  const off2 = off2Res.status === 'fulfilled' ? off2Res.value : null;
  const bdc = bdcRes.status === 'fulfilled' ? bdcRes.value : null;

  let mbStreet = '';
  let mbNumber = '';
  let mbNeighborhood = '';
  let mbCity = '';
  let mbState = '';
  let mbPostcode = '';
  let mbCountry = '';
  if (mbData && Array.isArray(mbData.features)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const feat of mbData.features as any[]) {
      const types: string[] = Array.isArray(feat.place_type) ? feat.place_type : [];
      if (types.includes('address') && !mbStreet) {
        mbStreet = feat.text_es || feat.text || '';
        mbNumber = feat.address || '';
      } else if ((types.includes('neighborhood') || types.includes('locality')) && !mbNeighborhood) {
        mbNeighborhood = feat.text_es || feat.text || '';
      } else if (types.includes('place') && !mbCity) {
        mbCity = feat.text_es || feat.text || '';
      } else if (types.includes('region') && !mbState) {
        mbState = feat.text_es || feat.text || '';
      } else if (types.includes('postcode') && !mbPostcode) {
        mbPostcode = feat.text || '';
      } else if (types.includes('country') && !mbCountry) {
        mbCountry = feat.text_es || feat.text || '';
      }

      // Also inspect context hierarchy if present
      if (Array.isArray(feat.context)) {
        for (const ctx of feat.context) {
          const id: string = ctx.id || '';
          if (id.startsWith('neighborhood') && !mbNeighborhood) mbNeighborhood = ctx.text || '';
          if (id.startsWith('place') && !mbCity) mbCity = ctx.text || '';
          if (id.startsWith('region') && !mbState) mbState = ctx.text || '';
          if (id.startsWith('postcode') && !mbPostcode) mbPostcode = ctx.text || '';
          if (id.startsWith('country') && !mbCountry) mbCountry = ctx.text || '';
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr18 = (origin && (origin as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr16 = (macro && (macro as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr14 = (regional && (regional as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const off1Addr = (off1 && (off1 as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const off2Addr = (off2 && (off2 as any).address) || {};

  // State / Province & Country
  const state = mbState || addr14.state || addr16.state || addr18.state || (bdc && bdc.principalSubdivision) || '';
  const postalCode = mbPostcode || addr18.postcode || addr16.postcode || addr14.postcode || (bdc && bdc.postcode) || '';
  const country = mbCountry || addr18.country || addr16.country || addr14.country || (bdc && bdc.countryName) || 'Ecuador';

  // 1. Primary Road & House Number (Looking "desde arriba" to prefer real thoroughfares over micro footpaths)
  const isMicroFootpath = Boolean(
    addr18.footway ||
    addr18.path ||
    addr18.steps ||
    addr18.pedestrian ||
    addr18.cycleway ||
    addr18.service
  );
  const microRoad = addr18.road || addr18.street || (isMicroFootpath ? '' : addr18.pedestrian) || '';
  const macroRoad = addr16.road || addr16.street || '';

  const rawPrimary = mbStreet || (!isMicroFootpath && microRoad ? microRoad : macroRoad) || microRoad || macroRoad || (bdc && bdc.locality) || '';
  let primaryRoad = polishRoadName(rawPrimary);

  // House / Exterior Number resolution
  let houseNum = mbNumber || extractExteriorNumber(
    (origin as { display_name?: string } | null)?.display_name,
    addr18.house_number || addr16.house_number
  );

  // Check if primary road accidentally had the house number appended
  const streetNumberMatch = primaryRoad.match(/^(.*?)\s+([A-Z]{1,2}\d{1,4}-\d{1,4}|N\d+-\d+|Oe\d+-\d+|S\d+-\d+|E\d+-\d+|#\s*\d+(?:-\d+)?|\d{1,5}-\d{1,4})$/i);
  if (streetNumberMatch) {
    primaryRoad = streetNumberMatch[1].trim();
    if (!houseNum) {
      houseNum = streetNumberMatch[2].replace(/^#\s*/, '').trim();
    }
  }

  // 2. Discover Real Intersecting Street (Topological Junction Nodes + Macro Divergence + Offsets) & Landmark Place (~6 blocks) in parallel
  const [topologicalCross, landmarkPlace] = await Promise.all([
    origin && origin.osm_type === 'way' && origin.osm_id
      ? getTopologicalCrossStreet(origin.osm_id, nLat, nLon, primaryRoad)
      : Promise.resolve(null),
    getLandmarkPlaceName(nLat, nLon)
  ]);

  let crossRoad = polishRoadName(topologicalCross);

  // If topological didn't detect an intersection, check if macro road (from zoom 16) is a different intersecting avenue
  if (!crossRoad && macroRoad && primaryRoad) {
    const normMacro = macroRoad.toLowerCase().trim();
    const normPrim = primaryRoad.toLowerCase().trim();
    if (normMacro !== normPrim && !normMacro.includes(normPrim) && !normPrim.includes(normMacro)) {
      crossRoad = polishRoadName(macroRoad);
    }
  }

  // If still no crossRoad, probe offset responses
  if (!crossRoad) {
    const candidateStreets: string[] = [
      off1Addr.road,
      off2Addr.road,
      off1Addr.street,
      off2Addr.street
    ].filter(Boolean);

    for (const cand of candidateStreets) {
      const normCand = cand.toLowerCase().trim();
      const normPrim = primaryRoad.toLowerCase().trim();
      if (normCand !== normPrim && !normCand.includes(normPrim) && !normPrim.includes(normCand)) {
        crossRoad = polishRoadName(cand);
        break;
      }
    }
  }

  // Keep street name strictly separate from exteriorNumber and crossStreets
  const streetNameOnly = primaryRoad || addr16.neighbourhood || addr18.neighbourhood || addr16.suburb || addr18.suburb || addr18.village || 'Dirección por coordenadas';

  // 3. Hierarchical City and Sub-locality / Parish (Looking "desde arriba" across zoom 14, 16 and 18)
  const bdcCity = cleanAdmin(bdc && (bdc.city || bdc.principalSubdivision));
  const rawCityCandidate = mbCity || addr14.city || addr16.city || addr18.city || addr14.town || addr16.town;
  const rawCountyCandidate = addr14.county || addr16.county || addr18.county;
  const rawMunCandidate = addr14.municipality || addr16.municipality || addr18.municipality;
  const mainCity = resolveMajorCity(rawCityCandidate, rawCountyCandidate, rawMunCandidate, bdcCity, state, country);

  let subLocality = (
    mbNeighborhood ||
    addr16.neighbourhood ||
    addr18.neighbourhood ||
    addr16.quarter ||
    addr18.quarter ||
    addr16.suburb ||
    addr18.suburb ||
    addr14.city_district ||
    addr14.suburb ||
    addr18.city_district ||
    addr16.residential ||
    addr18.residential ||
    landmarkPlace ||
    addr18.village ||
    addr16.village ||
    (addr18.town && cleanAdmin(addr18.town).toLowerCase() !== mainCity.toLowerCase() ? cleanAdmin(addr18.town) : '') ||
    (bdc && bdc.locality && bdc.locality.toLowerCase() !== mainCity.toLowerCase() ? bdc.locality : '') ||
    ''
  ).trim();

  if (landmarkPlace && landmarkPlace.toLowerCase() !== mainCity.toLowerCase() && !subLocality) {
    subLocality = landmarkPlace;
  }

  // Fallback defaults from IP metadata if available
  const finalState = state || ipMeta?.state || '';
  const finalPostal = postalCode || ipMeta?.postalCode || '';
  const finalCountry = country || ipMeta?.country || 'Ecuador';
  const finalCityResult = mainCity || subLocality || ipMeta?.city || 'Quito';
  const finalStreet = isIpFallback ? '' : streetNameOnly;

  return NextResponse.json({
    success: true,
    source: isIpFallback ? 'ip' : hasMapbox ? 'mapbox+gps' : 'gps',
    data: {
      street: finalStreet,
      exteriorNumber: houseNum || undefined,
      neighborhood: subLocality || undefined,
      crossStreets: crossRoad ? `Entre ${crossRoad}` : undefined,
      landmark: landmarkPlace || undefined,
      reference: landmarkPlace || subLocality || undefined,
      city: finalCityResult,
      state: finalState,
      postalCode: finalPostal,
      country: finalCountry,
      rawLat: !isIpFallback && Number.isFinite(nLat) ? nLat : undefined,
      rawLon: !isIpFallback && Number.isFinite(nLon) ? nLon : undefined,
      rawDisplayName: (origin as { display_name?: string } | null)?.display_name || undefined,
      rawNominatim: origin || macro || mbData || bdc || undefined,
    },
    // Direct top-level properties for seamless compatibility + Raw unformatted GPS/Geocoder payload
    street: finalStreet,
    exteriorNumber: houseNum || undefined,
    neighborhood: subLocality || undefined,
    crossStreets: crossRoad ? `Entre ${crossRoad}` : undefined,
    landmark: landmarkPlace || undefined,
    reference: landmarkPlace || subLocality || undefined,
    city: finalCityResult,
    state: finalState,
    postalCode: finalPostal,
    country: finalCountry,
    rawLat: !isIpFallback && Number.isFinite(nLat) ? nLat : undefined,
    rawLon: !isIpFallback && Number.isFinite(nLon) ? nLon : undefined,
    rawDisplayName: (origin as { display_name?: string } | null)?.display_name || undefined,
    rawNominatim: origin || macro || mbData || bdc || undefined,
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    return await resolveGeocode(lat, lon, clientIp);
  } catch (error) {
    console.error('Error in GET /api/geocode:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en el servicio de geocodificación.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { lat, lon } = body;
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    return await resolveGeocode(lat, lon, clientIp);
  } catch (error) {
    console.error('Error in POST /api/geocode:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en el servicio de geocodificación.' },
      { status: 500 }
    );
  }
}
