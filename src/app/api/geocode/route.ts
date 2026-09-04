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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lon } = body;

    if (lat === undefined || lon === undefined || isNaN(Number(lat)) || isNaN(Number(lon))) {
      return NextResponse.json(
        { success: false, error: 'Coordenadas inválidas.' },
        { status: 400 }
      );
    }

    const nLat = Number(lat);
    const nLon = Number(lon);

    // Run parallel queries: Origin + 2 tight offsets (~22m) + BigDataCloud fallback
    const tightOffset = 0.00020;
    const [originRes, off1Res, off2Res, bdcRes] = await Promise.allSettled([
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat + tightOffset}&lon=${nLon}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon - tightOffset}&addressdetails=1&zoom=18`, { headers }).then(r => r.json()),
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${nLat}&longitude=${nLon}&localityLanguage=es`).then(r => r.json())
    ]);

    const origin = originRes.status === 'fulfilled' ? originRes.value : null;
    const off1 = off1Res.status === 'fulfilled' ? off1Res.value : null;
    const off2 = off2Res.status === 'fulfilled' ? off2Res.value : null;
    const bdc = bdcRes.status === 'fulfilled' ? bdcRes.value : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addr = (origin && (origin as any).address) || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const off1Addr = (off1 && (off1 as any).address) || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const off2Addr = (off2 && (off2 as any).address) || {};

    // 1. Primary Road & House Number
    const rawPrimary = addr.road || addr.pedestrian || addr.footway || addr.path || addr.street || (bdc && bdc.locality) || '';
    const primaryRoad = polishRoadName(rawPrimary);
    const houseNum = addr.house_number || '';

    // 2. Discover Real Intersecting Street (Topological Junction Nodes) & Landmark Place (~6 blocks) in parallel
    const [topologicalCross, landmarkPlace] = await Promise.all([
      origin && origin.osm_type === 'way' && origin.osm_id
        ? getTopologicalCrossStreet(origin.osm_id, nLat, nLon, primaryRoad)
        : Promise.resolve(null),
      getLandmarkPlaceName(nLat, nLon)
    ]);

    // If topological junction didn't find a cross street, test tight offset fallback
    let crossRoad = polishRoadName(topologicalCross);
    if (!crossRoad) {
      const candidateStreets: string[] = [
        off1Addr.road,
        off2Addr.road,
        off1Addr.pedestrian,
        off2Addr.pedestrian,
        off1Addr.street,
        off2Addr.street
      ].filter(Boolean);

      for (const cand of candidateStreets) {
        if (
          primaryRoad &&
          cand.toLowerCase() !== primaryRoad.toLowerCase() &&
          !cand.toLowerCase().includes(primaryRoad.toLowerCase()) &&
          !primaryRoad.toLowerCase().includes(cand.toLowerCase())
        ) {
          crossRoad = polishRoadName(cand);
          break;
        }
      }
    }

    // Build enhanced street description (e.g. "San Isidro y San Cristóbal")
    let street = primaryRoad;
    if (!street) {
      street = addr.suburb || addr.neighbourhood || addr.village || 'Dirección por coordenadas';
    }

    if (houseNum) {
      street += ` #${houseNum}`;
    }

    if (crossRoad) {
      street += ` y ${crossRoad}`;
    }

    // 3. Hierarchical City and Sub-locality / Parish (e.g. "Machachi - Uyumbicho" or "Quito - Guayllabamba")
    const rawCounty = cleanAdmin(addr.county);
    const rawCity = cleanAdmin(addr.city);
    const rawTown = cleanAdmin(addr.town);
    const rawMunicipality = cleanAdmin(addr.municipality);
    const bdcCity = cleanAdmin(bdc && (bdc.city || bdc.principalSubdivision));

    // Determine principal city/canton
    const mainCity = rawCity || rawCounty || rawMunicipality || bdcCity || '';

    // Determine sub-locality, parish, sector or neighbourhood
    let subLocality = (
      addr.village ||
      landmarkPlace ||
      (rawTown && rawTown.toLowerCase() !== mainCity.toLowerCase() ? rawTown : '') ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.hamlet ||
      (bdc && bdc.locality && bdc.locality.toLowerCase() !== mainCity.toLowerCase() ? bdc.locality : '') ||
      ''
    ).trim();

    // If landmark place was detected with high confidence and is distinct from mainCity, prioritize it
    if (landmarkPlace && landmarkPlace.toLowerCase() !== mainCity.toLowerCase()) {
      subLocality = landmarkPlace;
    }

    // Format hierarchical city name
    let finalCity = mainCity;
    if (
      mainCity &&
      subLocality &&
      mainCity.toLowerCase() !== subLocality.toLowerCase() &&
      !mainCity.toLowerCase().includes(subLocality.toLowerCase()) &&
      !subLocality.toLowerCase().includes(mainCity.toLowerCase())
    ) {
      finalCity = `${mainCity} - ${subLocality}`;
    } else if (!mainCity && subLocality) {
      finalCity = subLocality;
    }

    // 4. State / Province, Postal Code, Country
    const state = addr.state || addr.province || addr.region || (bdc && bdc.principalSubdivision) || '';
    const postalCode = addr.postcode || (bdc && bdc.postcode) || '';
    const country = addr.country || (bdc && bdc.countryName) || 'Ecuador';

    return NextResponse.json({
      success: true,
      data: {
        street,
        city: finalCity || 'Ciudad no determinada',
        state,
        postalCode,
        country
      }
    });
  } catch (error) {
    console.error('Error in /api/geocode:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en el servicio de geocodificación.' },
      { status: 500 }
    );
  }
}
