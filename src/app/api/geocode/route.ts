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

const isAdministrativeEntity = (str?: string | null): boolean => {
  if (!str) return false;
  const n = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  
  // Explicit administrative prefix patterns (e.g., "Cantón Mejía", "Provincia de Pichincha", "Parroquia Uyumbicho")
  if (
    /^(?:canton|cantón)\s+/i.test(n) ||
    /^provincia\s+(?:de\s+)?/i.test(n) ||
    /^distrito\s+(?:metropolitano\s+)?(?:de\s+)?/i.test(n) ||
    /^parroquia\s+(?:de\s+)?/i.test(n) ||
    /^municipio\s+(?:de\s+)?/i.test(n) ||
    /^comunidad\s+(?:de\s+)?/i.test(n) ||
    /^departamento\s+(?:de\s+)?/i.test(n)
  ) {
    return true;
  }

  // Pure generic administration labels that are NOT street names
  const genericAdminTerms = ['ecuador', 'canton', 'parroquia', 'provincia', 'distrito', 'municipio', 'departamento'];
  if (genericAdminTerms.includes(n)) {
    return true;
  }

  return false;
};

const isUnnamedOrPlaceholderRoad = (str?: string | null): boolean => {
  if (!str) return true;
  const n = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const placeholderPatterns = [
    /^s\/?n$/i,
    /^calle\s+s\/?n$/i,
    /^pasaje\s+s\/?n$/i,
    /^avenida\s+s\/?n$/i,
    /^av\.?\s+s\/?n$/i,
    /^sin\s+nombre$/i,
    /^calle\s+sin\s+nombre$/i,
    /^pasaje\s+sin\s+nombre$/i,
    /^avenida\s+sin\s+nombre$/i,
    /^unnamed\s+road$/i,
    /^unnamed$/i,
    /^road$/i,
    /^street$/i,
    /^n\/a$/i,
    /^ninguno$/i,
    /^desconocid[oa]$/i,
  ];
  return placeholderPatterns.some((pattern) => pattern.test(n));
};

const polishRoadName = (name?: string | null) => {
  if (!name) return '';
  if (isUnnamedOrPlaceholderRoad(name)) return '';
  let n = name.trim();
  n = n.replace(/\bSan Cristobal\b/gi, 'San Cristóbal');
  n = n.replace(/\bRuminahui\b/gi, 'Rumiñahui');
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

interface MacroCityResult {
  city: string;
  parishOrSatellite?: string;
  province?: string;
}

const PICHINCHA_SATELLITE_AREAS: Record<string, string> = {
  'machachi': 'Machachi',
  'mejia': 'Mejía',
  'mejía': 'Mejía',
  'rumiñahui': 'Rumiñahui',
  'sangolqui': 'Sangolquí',
  'sangolquí': 'Sangolquí',
  'san rafael': 'San Rafael',
  'tambillo': 'Tambillo',
  'aloag': 'Alóag',
  'alóag': 'Alóag',
  'aloasi': 'Aloasí',
  'aloasí': 'Aloasí',
  'cutuglagua': 'Cutuglagua',
  'uyumbicho': 'Uyumbicho',
  'el chaupi': 'El Chaupi',
  'cumbaya': 'Cumbayá',
  'cumbayá': 'Cumbayá',
  'tumbaco': 'Tumbaco',
  'puembo': 'Puembo',
  'pifo': 'Pifo',
  'yaruqui': 'Yaruquí',
  'yaruquí': 'Yaruquí',
  'el quinche': 'El Quinche',
  'checa': 'Checa',
  'tababela': 'Tababela',
  'conocoto': 'Conocoto',
  'amaguaña': 'Amaguaña',
  'alangasi': 'Alangasí',
  'alangasí': 'Alangasí',
  'la merced': 'La Merced',
  'pintag': 'Píntag',
  'píntag': 'Píntag',
  'guangopolo': 'Guangopolo',
  'calderon': 'Calderón',
  'calderón': 'Calderón',
  'pomasqui': 'Pomasqui',
  'san antonio': 'San Antonio de Pichincha',
  'san antonio de pichincha': 'San Antonio de Pichincha',
  'calacali': 'Calacalí',
  'calacalí': 'Calacalí',
  'nono': 'Nono',
  'cayambe': 'Cayambe',
  'tabacundo': 'Tabacundo',
  'pedro moncayo': 'Pedro Moncayo',
  'puerto quito': 'Puerto Quito',
  'pedro vicente maldonado': 'Pedro Vicente Maldonado',
  'san miguel de los bancos': 'San Miguel de los Bancos'
};

const GUAYAS_SATELLITE_AREAS: Record<string, string> = {
  'samborondon': 'Samborondón',
  'samborondón': 'Samborondón',
  'duran': 'Durán',
  'durán': 'Durán',
  'daule': 'Daule'
};

function resolveMajorCity(
  rawCity?: string,
  rawCounty?: string,
  rawMunicipality?: string,
  bdcCity?: string,
  stateName?: string,
  countryName?: string,
  lat?: number,
  lon?: number,
  displayName?: string
): MacroCityResult {
  const cCity = cleanAdmin(rawCity);
  const cCounty = cleanAdmin(rawCounty);
  const cMun = cleanAdmin(rawMunicipality);
  const cBdc = cleanAdmin(bdcCity);

  const normState = (stateName || '').toLowerCase().trim();
  const isEcuador = !countryName || countryName.toLowerCase().includes('ecuador');

  // Check if coordinates or state or raw candidates are in Pichincha
  const isCoordInPichincha =
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -0.90 &&
    lat <= 0.35 &&
    lon >= -79.35 &&
    lon <= -78.00;

  const allCandidateStrings = [
    cCity,
    cCounty,
    cMun,
    cBdc,
    displayName || ''
  ].join(' ').toLowerCase();

  const isPichinchaSatellite = Object.keys(PICHINCHA_SATELLITE_AREAS).some(key =>
    allCandidateStrings.includes(key)
  );

  const isPichincha =
    normState.includes('pichincha') ||
    isCoordInPichincha ||
    isPichinchaSatellite;

  if (isEcuador && isPichincha) {
    let detectedParish: string | undefined;
    for (const [key, label] of Object.entries(PICHINCHA_SATELLITE_AREAS)) {
      if (allCandidateStrings.includes(key)) {
        detectedParish = label;
        break;
      }
    }
    if (!detectedParish && (cCounty || cCity || cMun)) {
      const cand = cCounty || cCity || cMun;
      if (cand.toLowerCase() !== 'quito') {
        detectedParish = cand;
      }
    }

    return {
      city: 'Quito',
      parishOrSatellite: detectedParish,
      province: 'Pichincha'
    };
  }

  // Check Guayas
  const isCoordInGuayas =
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -2.55 &&
    lat <= -1.65 &&
    lon >= -80.30 &&
    lon <= -79.60;

  const isGuayasSatellite = Object.keys(GUAYAS_SATELLITE_AREAS).some(key =>
    allCandidateStrings.includes(key)
  );

  const isGuayas =
    normState.includes('guayas') ||
    isCoordInGuayas ||
    isGuayasSatellite;

  if (isEcuador && isGuayas) {
    let detectedParish: string | undefined;
    for (const [key, label] of Object.entries(GUAYAS_SATELLITE_AREAS)) {
      if (allCandidateStrings.includes(key)) {
        detectedParish = label;
        break;
      }
    }
    if (!detectedParish && (cCounty || cCity || cMun)) {
      const cand = cCounty || cCity || cMun;
      if (cand.toLowerCase() !== 'guayaquil') {
        detectedParish = cand;
      }
    }

    return {
      city: 'Guayaquil',
      parishOrSatellite: detectedParish,
      province: 'Guayas'
    };
  }

  // General Ecuador provincial capitals (looking "desde arriba")
  if (isEcuador && ECUADOR_METROPOLITAN_CITIES[normState]) {
    const macroCity = ECUADOR_METROPOLITAN_CITIES[normState];
    const candidateLocal = cCity || cCounty || cMun || cBdc;
    return {
      city: macroCity,
      parishOrSatellite: candidateLocal && candidateLocal.toLowerCase() !== macroCity.toLowerCase() ? candidateLocal : undefined,
      province: stateName
    };
  }

  // Fallback to specific candidate if found, or provincial map
  const fallbackCity = cCity || cCounty || cMun || cBdc || '';
  return {
    city: fallbackCity,
    parishOrSatellite: undefined,
    province: stateName
  };
}

// 1. Topological Intersecting Street Discovery via OSM Junction Nodes (Discovering 2 closest connecting streets)
async function getTopologicalCrossStreets(
  osmId: string | number,
  userLat: number,
  userLon: number,
  primaryRoadName: string
): Promise<string[]> {
  const intersecting: string[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const wayUrl = `https://api.openstreetmap.org/api/0.6/way/${osmId}/full.json`;
    const wayRes = await fetch(wayUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!wayRes.ok) return [];
    const wayData = await wayRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes = (wayData.elements || []).filter((e: any) => e.type === 'node');
    if (!nodes.length) return [];

    // Sort nodes by distance to user coordinates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodes.sort((a: any, b: any) => {
      const distA = Math.hypot(a.lat - userLat, a.lon - userLon);
      const distB = Math.hypot(b.lat - userLat, b.lon - userLon);
      return distA - distB;
    });

    const primNorm = (primaryRoadName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Probe closest junction nodes (up to 4)
    for (const node of nodes.slice(0, 4)) {
      try {
        const c2 = new AbortController();
        const t2 = setTimeout(() => c2.abort(), 2500);
        const nodeWaysUrl = `https://api.openstreetmap.org/api/0.6/node/${node.id}/ways.json`;
        const nodeWaysRes = await fetch(nodeWaysUrl, { headers, signal: c2.signal });
        clearTimeout(t2);
        if (!nodeWaysRes.ok) continue;
        const nodeWaysData = await nodeWaysRes.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const w of nodeWaysData.elements || []) {
          const wName = w.tags?.name;
          if (wName && !isUnnamedOrPlaceholderRoad(wName)) {
            const wNorm = wName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            if (wNorm !== primNorm && !wNorm.includes(primNorm) && !primNorm.includes(wNorm)) {
              const polished = polishRoadName(wName);
              if (polished && !intersecting.includes(polished)) {
                intersecting.push(polished);
              }
            }
          }
        }
      } catch {}
      if (intersecting.length >= 2) break;
    }
  } catch {}
  return intersecting;
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

  // Run parallel queries: Mapbox + Micro with layer=address + 4 Cardinal Offsets (25m) + Macro + BigDataCloud
  const tightOffset = 0.00025; // ~28m
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '').trim();
  const hasMapbox = mapboxToken.startsWith('pk.');

  const [mapboxRes, microRes, macroRes, regionalRes, offNRes, offSRes, offERes, offWRes, bdcRes] = await Promise.allSettled([
    hasMapbox
      ? fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${nLon},${nLat}.json?access_token=${mapboxToken}&language=es&types=address,poi,neighborhood,locality,place,postcode,region,country`
        ).then(r => r.json())
      : Promise.resolve(null),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=18&layer=address`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=16&layer=address`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=14`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat + tightOffset}&lon=${nLon}&addressdetails=1&zoom=18&layer=address`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat - tightOffset}&lon=${nLon}&addressdetails=1&zoom=18&layer=address`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon + tightOffset}&addressdetails=1&zoom=18&layer=address`, { headers }).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon - tightOffset}&addressdetails=1&zoom=18&layer=address`, { headers }).then(r => r.json()),
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${nLat}&longitude=${nLon}&localityLanguage=es`).then(r => r.json())
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mbData: any = mapboxRes.status === 'fulfilled' ? mapboxRes.value : null;
  const origin = microRes.status === 'fulfilled' ? microRes.value : null;
  const macro = macroRes.status === 'fulfilled' ? macroRes.value : null;
  const regional = regionalRes.status === 'fulfilled' ? regionalRes.value : null;
  const offN = offNRes.status === 'fulfilled' ? offNRes.value : null;
  const offS = offSRes.status === 'fulfilled' ? offSRes.value : null;
  const offE = offERes.status === 'fulfilled' ? offERes.value : null;
  const offW = offWRes.status === 'fulfilled' ? offWRes.value : null;
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
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr18 = (origin && (origin as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr16 = (macro && (macro as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr14 = (regional && (regional as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offNAddr = (offN && (offN as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offSAddr = (offS && (offS as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offEAddr = (offE && (offE as any).address) || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offWAddr = (offW && (offW as any).address) || {};

  // State / Province & Country
  const state = mbState || addr14.state || addr16.state || addr18.state || (bdc && bdc.principalSubdivision) || '';
  const postalCode = mbPostcode || addr18.postcode || addr16.postcode || addr14.postcode || (bdc && bdc.postcode) || '';
  const country = mbCountry || addr18.country || addr16.country || addr14.country || (bdc && bdc.countryName) || 'Ecuador';

  // 1. High-Precision Primary Road Resolution (Checking addressable highway lines & discarding admin entities)
  const isMicroFootpath = Boolean(
    addr18.footway ||
    addr18.path ||
    addr18.steps ||
    addr18.cycleway ||
    addr18.service
  );
  const microRoad = (!isMicroFootpath && (addr18.road || addr18.street)) || (addr18.pedestrian && !isUnnamedOrPlaceholderRoad(addr18.pedestrian) ? addr18.pedestrian : '') || '';
  const macroRoad = addr16.road || addr16.street || '';

  // Collect candidate vehicular roads from origin, macro, origin/macro way names, and 4-point cardinal offset probes
  const candidateRoads: string[] = [
    mbStreet,
    microRoad,
    macroRoad,
    (origin?.osm_type === 'way' && origin?.name) || '',
    (macro?.osm_type === 'way' && macro?.name) || '',
    offNAddr.road,
    offSAddr.road,
    offEAddr.road,
    offWAddr.road,
  ].filter((r): r is string => Boolean(r && !isAdministrativeEntity(r) && !isUnnamedOrPlaceholderRoad(r)));

  let rawPrimary = candidateRoads[0] || '';
  let activeWayOsmId = origin?.osm_type === 'way' && origin?.osm_id ? origin.osm_id : null;

  // If origin wasn't a way with an addressable road, adopt the way osm_id from whichever offset probe detected the road
  if (!activeWayOsmId) {
    for (const off of [offN, offS, offE, offW, macro]) {
      if (off?.osm_type === 'way' && off?.osm_id && off?.address?.road) {
        if (!isAdministrativeEntity(off.address.road) && !isUnnamedOrPlaceholderRoad(off.address.road)) {
          activeWayOsmId = off.osm_id;
          if (!rawPrimary) rawPrimary = off.address.road;
          break;
        }
      }
    }
  }

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

  // 2. Discover Real Connecting Intersecting Streets (OSM Junction Nodes Discovery)
  const [topologicalCrosses, landmarkPlace] = await Promise.all([
    activeWayOsmId && primaryRoad
      ? getTopologicalCrossStreets(activeWayOsmId, nLat, nLon, primaryRoad)
      : Promise.resolve([]),
    getLandmarkPlaceName(nLat, nLon)
  ]);

  let crossRoad = '';
  if (topologicalCrosses.length >= 2) {
    crossRoad = `Entre ${topologicalCrosses[0]} y ${topologicalCrosses[1]}`;
  } else if (topologicalCrosses.length === 1) {
    crossRoad = `Entre ${topologicalCrosses[0]}`;
  } else {
    // If topological didn't discover junction nodes, check distinct offset streets
    const normPrim = primaryRoad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const diffRoads = candidateRoads.filter(r => {
      if (isUnnamedOrPlaceholderRoad(r)) return false;
      const nr = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return nr !== normPrim && !nr.includes(normPrim) && !normPrim.includes(nr);
    });
    if (diffRoads.length >= 2) {
      crossRoad = `Entre ${polishRoadName(diffRoads[0])} y ${polishRoadName(diffRoads[1])}`;
    } else if (diffRoads.length === 1) {
      crossRoad = `Entre ${polishRoadName(diffRoads[0])}`;
    }
  }

  // Keep street name strictly separate - NEVER fallback to placeholder 'Calle S/N' or village or parish name!
  const streetNameOnly = (primaryRoad && !isUnnamedOrPlaceholderRoad(primaryRoad)) ? primaryRoad : '';

  // 3. Hierarchical City and Sub-locality / Parish (Looking "desde arriba" across zoom 14, 16 and 18)
  const bdcCity = cleanAdmin(bdc && (bdc.city || bdc.principalSubdivision));
  const rawCityCandidate = mbCity || addr14.city || addr16.city || addr18.city || addr14.town || addr16.town;
  const rawCountyCandidate = addr14.county || addr16.county || addr18.county;
  const rawMunCandidate = addr14.municipality || addr16.municipality || addr18.municipality;
  const macroResult = resolveMajorCity(
    rawCityCandidate,
    rawCountyCandidate,
    rawMunCandidate,
    bdcCity,
    state,
    country,
    nLat,
    nLon,
    (origin as { display_name?: string } | null)?.display_name
  );
  const mainCity = macroResult.city;
  const satelliteParish = macroResult.parishOrSatellite;

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

  // If a satellite parish / canton was detected (e.g., "Machachi", "Mejía", "Sangolquí", "Samborondón")
  if (satelliteParish && satelliteParish.toLowerCase() !== mainCity.toLowerCase()) {
    if (!subLocality) {
      subLocality = satelliteParish;
    } else if (!subLocality.toLowerCase().includes(satelliteParish.toLowerCase())) {
      subLocality = `${subLocality}, ${satelliteParish}`;
    }
  }

  if (landmarkPlace && landmarkPlace.toLowerCase() !== mainCity.toLowerCase() && !subLocality) {
    subLocality = landmarkPlace;
  }

  // Fallback defaults from IP metadata if available
  const finalState = state || macroResult.province || ipMeta?.state || '';
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
      crossStreets: crossRoad || undefined,
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
    crossStreets: crossRoad || undefined,
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
