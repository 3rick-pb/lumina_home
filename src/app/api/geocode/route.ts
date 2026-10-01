import { NextResponse } from 'next/server';

const headers = {
  'User-Agent': 'LuminaHome-App/1.0 (delivery-routing; contact@luminahome.com)',
  'Accept-Language': 'es'
};

const cleanAdmin = (str?: string | null) => {
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
  rawCity?: string | null,
  rawCounty?: string | null,
  rawMunicipality?: string | null,
  bdcCity?: string | null,
  stateName?: string | null,
  countryName?: string | null,
  lat?: number | null,
  lon?: number | null,
  displayName?: string | null
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
      province: stateName || undefined
    };
  }

  // Fallback to specific candidate if found, or provincial map
  const fallbackCity = cCity || cCounty || cMun || cBdc || '';
  return {
    city: fallbackCity,
    parishOrSatellite: undefined,
    province: stateName || undefined
  };
}

async function safeFetchJson<T = unknown>(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json') && !ct.includes('geo+json')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
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

interface IpLocationResult {
  city: string;
  state: string;
  country: string;
  postalCode: string;
  lat?: number;
  lon?: number;
}

interface OsmElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

interface OsmMapResponse {
  elements?: OsmElement[];
}

interface NominatimReverseResponse {
  osm_type?: string;
  osm_id?: number;
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
  class?: string;
  type?: string;
}

interface PhotonFeatureProperties {
  osm_type?: string;
  osm_id?: number;
  osm_key?: string;
  osm_value?: string;
  type?: string;
  name?: string;
  street?: string;
  locality?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface PhotonResponse {
  features?: Array<{
    properties?: PhotonFeatureProperties;
  }>;
}

interface BigDataCloudResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  postcode?: string;
  countryName?: string;
}

interface MapboxFeature {
  place_type?: string[];
  text?: string;
  text_es?: string;
  address?: string;
  place_name?: string;
}

interface MapboxResponse {
  features?: MapboxFeature[];
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

  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '').trim();
  const hasMapbox = mapboxToken.startsWith('pk.');

  const delta = 0.0020; // ~220m radius for geometric highway line scanning and junction discovery
  const minLon = nLon - delta;
  const minLat = nLat - delta;
  const maxLon = nLon + delta;
  const maxLat = nLat + delta;

  // Run parallel multi-engine resolution:
  // 1. Nominatim Reverse (Single high-zoom call)
  // 2. OpenStreetMap Vector API (Real physical highways, junction nodes, and POIs in bounding box)
  // 3. Photon Reverse (OSM-based secondary geocoder with zero rate limit)
  // 4. BigDataCloud Reverse (Administrative boundary fallback)
  // 5. Mapbox Geocoding (if token configured)
  const [nominatimRes, osmMapRes, photonRes, bdcRes, mapboxRes] = await Promise.allSettled([
    safeFetchJson<NominatimReverseResponse>(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLon}&addressdetails=1&zoom=18`, { headers }),
    safeFetchJson<OsmMapResponse>(`https://api.openstreetmap.org/api/0.6/map.json?bbox=${minLon},${minLat},${maxLon},${maxLat}`, { headers }),
    safeFetchJson<PhotonResponse>(`https://photon.komoot.io/reverse?lat=${nLat}&lon=${nLon}`),
    safeFetchJson<BigDataCloudResponse>(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${nLat}&longitude=${nLon}&localityLanguage=es`),
    hasMapbox
      ? safeFetchJson<MapboxResponse>(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${nLon},${nLat}.json?access_token=${mapboxToken}&language=es&types=address,poi,neighborhood,locality,place,postcode,region,country`
        )
      : Promise.resolve(null),
  ]);

  const origin = nominatimRes.status === 'fulfilled' ? nominatimRes.value : null;
  const osmMapData = osmMapRes.status === 'fulfilled' ? osmMapRes.value : null;
  const photonData = photonRes.status === 'fulfilled' ? photonRes.value : null;
  const bdc = bdcRes.status === 'fulfilled' ? bdcRes.value : null;
  const mbData = mapboxRes.status === 'fulfilled' ? mapboxRes.value : null;

  // Process Vector Highways and POIs from OSM API
  const vectorRoads: Array<{ name: string; dist: number; highway: string }> = [];
  const vectorPois: Array<{ name: string; dist: number; type: string }> = [];

  if (osmMapData && Array.isArray(osmMapData.elements)) {
    const nodeMap = new Map<number, { lat: number; lon: number; tags?: Record<string, string> }>();
    for (const el of osmMapData.elements) {
      if (el.type === 'node' && typeof el.lat === 'number' && typeof el.lon === 'number') {
        nodeMap.set(el.id, { lat: el.lat, lon: el.lon, tags: el.tags || {} });
        if (el.tags && el.tags.name && (el.tags.amenity || el.tags.leisure || el.tags.shop || el.tags.tourism)) {
          const d = getDistanceMeters(nLat, nLon, el.lat, el.lon);
          vectorPois.push({ name: el.tags.name, type: el.tags.amenity || el.tags.leisure || el.tags.shop || 'poi', dist: d });
        }
      }
    }

    for (const el of osmMapData.elements) {
      if (el.type === 'way') {
        const tags = el.tags || {};
        if (tags.amenity || tags.leisure) {
          const nodeCoords: Array<{ lat: number; lon: number }> = [];
          for (const id of el.nodes || []) {
            const n = nodeMap.get(id);
            if (n) nodeCoords.push(n);
          }
          if (nodeCoords.length > 0 && tags.name) {
            const avgLat = nodeCoords.reduce((s, n) => s + n.lat, 0) / nodeCoords.length;
            const avgLon = nodeCoords.reduce((s, n) => s + n.lon, 0) / nodeCoords.length;
            const d = getDistanceMeters(nLat, nLon, avgLat, avgLon);
            vectorPois.push({ name: tags.name, type: tags.amenity || tags.leisure, dist: d });
          }
        }

        if (tags.highway && tags.name && !isUnnamedOrPlaceholderRoad(tags.name) && !isAdministrativeEntity(tags.name)) {
          let minDist = Infinity;
          for (const nid of el.nodes || []) {
            const n = nodeMap.get(nid);
            if (n) {
              const d = getDistanceMeters(nLat, nLon, n.lat, n.lon);
              if (d < minDist) minDist = d;
            }
          }
          vectorRoads.push({ name: tags.name, dist: minDist, highway: tags.highway });
        }
      }
    }
  }

  vectorRoads.sort((a, b) => a.dist - b.dist);
  vectorPois.sort((a, b) => a.dist - b.dist);

  let mbStreet = '';
  let mbNumber = '';
  let mbNeighborhood = '';
  let mbCity = '';
  let mbState = '';
  let mbPostcode = '';
  let mbCountry = '';
  if (mbData && Array.isArray(mbData.features)) {
    for (const feat of mbData.features || []) {
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

  const addr18 = (origin && origin.address) || {};
  const photonProp = photonData?.features?.[0]?.properties || {};

  // Extract candidate vehicular roads across sources
  const nominatimRoad = (addr18.road || addr18.street || addr18.pedestrian || '').trim();
  const closestVectorRoad = vectorRoads[0]?.name || '';
  const photonRoad = (photonProp.street || (photonProp.type === 'street' || photonProp.osm_key === 'highway' ? photonProp.name : '') || '').trim();

  const rawCandidates: string[] = [
    mbStreet,
    closestVectorRoad,
    nominatimRoad,
    photonRoad,
    ...vectorRoads.map(r => r.name),
    (origin?.osm_type === 'way' && origin?.name) || '',
  ].filter((r): r is string => Boolean(r && !isAdministrativeEntity(r) && !isUnnamedOrPlaceholderRoad(r)));

  const uniqueCandidates: string[] = [];
  const seenNorm = new Set<string>();
  for (const c of rawCandidates) {
    const polished = polishRoadName(c);
    if (!polished) continue;
    const norm = polished.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (!seenNorm.has(norm)) {
      seenNorm.add(norm);
      uniqueCandidates.push(polished);
    }
  }

  // Fallback: If still empty, attempt to extract road name from display_name
  if (uniqueCandidates.length === 0 && origin?.display_name) {
    const parts = (origin.display_name as string).split(',').map((p: string) => p.trim());
    for (const part of parts) {
      if (
        part &&
        !isAdministrativeEntity(part) &&
        !isUnnamedOrPlaceholderRoad(part) &&
        !/^\d+[-#\dA-Za-z]*$/.test(part) &&
        part.length > 2
      ) {
        uniqueCandidates.push(polishRoadName(part));
        break;
      }
    }
  }

  let primaryRoad = uniqueCandidates[0] || '';

  // House / Exterior Number resolution
  let houseNum = mbNumber || extractExteriorNumber(
    (origin as { display_name?: string } | null)?.display_name,
    addr18.house_number
  );

  // Check if primary road accidentally had the house number appended
  const streetNumberMatch = primaryRoad.match(/^(.*?)\s+([A-Z]{1,2}\d{1,4}-\d{1,4}|N\d+-\d+|Oe\d+-\d+|S\d+-\d+|E\d+-\d+|#\s*\d+(?:-\d+)?|\d{1,5}-\d{1,4})$/i);
  if (streetNumberMatch) {
    primaryRoad = streetNumberMatch[1].trim();
    if (!houseNum) {
      houseNum = streetNumberMatch[2].replace(/^#\s*/, '').trim();
    }
  }

  // Intersections / Cross Streets (Discovered from geometric connecting ways)
  let crossRoad = '';
  if (primaryRoad) {
    const primNorm = primaryRoad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const diffRoads = uniqueCandidates.filter(r => {
      const nr = r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return nr !== primNorm && !nr.includes(primNorm) && !primNorm.includes(nr);
    });

    if (diffRoads.length >= 2) {
      crossRoad = `Entre ${diffRoads[0]} y ${diffRoads[1]}`;
    } else if (diffRoads.length === 1) {
      crossRoad = `Entre ${diffRoads[0]}`;
    }
  }

  // Nearby Landmarks (parques, colegios, escuelas, universidades, iglesias, salud, mercados)
  let landmarkPlace = '';
  const filteredPois = vectorPois.filter(p => {
    const n = p.name.toLowerCase();
    return (
      !n.includes('parqueadero') &&
      !n.includes('muebles') &&
      !n.includes('taller') &&
      !n.includes('viveres') &&
      n.length >= 3
    );
  });
  if (filteredPois.length > 0) {
    const p = filteredPois[0];
    if (p.dist < 50) {
      landmarkPlace = `Frente a ${p.name}`;
    } else if (p.dist < 150) {
      landmarkPlace = `Junto a ${p.name}`;
    } else {
      landmarkPlace = `Cerca de ${p.name}`;
    }
  } else if (photonProp.name && photonProp.name !== primaryRoad && (photonProp.osm_key === 'amenity' || photonProp.osm_key === 'leisure')) {
    landmarkPlace = `Cerca de ${photonProp.name}`;
  }

  // State / Province & Country
  const state = mbState || addr18.state || photonProp.state || (bdc && bdc.principalSubdivision) || '';
  const postalCode = mbPostcode || addr18.postcode || photonProp.postcode || (bdc && bdc.postcode) || '';
  const country = mbCountry || addr18.country || photonProp.country || (bdc && bdc.countryName) || 'Ecuador';

  // Keep street name strictly separate - NEVER fallback to placeholder 'Calle S/N' or village or parish name!
  const streetNameOnly = (primaryRoad && !isUnnamedOrPlaceholderRoad(primaryRoad)) ? primaryRoad : '';

  // 3. Hierarchical City and Sub-locality / Parish (Looking "desde arriba" across zoom 14, 16 and 18)
  const bdcCity = cleanAdmin(bdc && (bdc.city || bdc.principalSubdivision));
  const rawCityCandidate = mbCity || addr18.city || addr18.town || photonProp.city || (bdc && bdc.city);
  const rawCountyCandidate = addr18.county || photonProp.county;
  const rawMunCandidate = addr18.municipality || photonProp.district;
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

  // Sector o Barrio: look closer ("un poco más cerca"), prioritizing micro neighborhood
  let subLocality = (
    addr18.quarter ||
    photonProp.locality ||
    addr18.neighbourhood ||
    addr18.residential ||
    addr18.suburb ||
    photonProp.district ||
    addr18.city_district ||
    addr18.village ||
    bdc?.locality ||
    photonProp.city ||
    ''
  ).trim();

  // If subLocality ended up matching the main city, try to get the village/hamlet or parish
  if (subLocality.toLowerCase() === mainCity.toLowerCase()) {
    subLocality = (addr18.quarter || photonProp.locality || addr18.village || satelliteParish || '').trim();
  }

  // Fallback defaults from IP metadata if available
  const finalState = state || macroResult.province || ipMeta?.state || '';
  const finalPostal = postalCode || ipMeta?.postalCode || '';
  const finalCountry = country || ipMeta?.country || 'Ecuador';
  const finalCityResult = mainCity || ipMeta?.city || 'Quito';
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
      reference: landmarkPlace || (crossRoad ? `Cerca de ${crossRoad}` : undefined),
      city: finalCityResult,
      state: finalState,
      postalCode: finalPostal,
      country: finalCountry,
      rawLat: !isIpFallback && Number.isFinite(nLat) ? nLat : undefined,
      rawLon: !isIpFallback && Number.isFinite(nLon) ? nLon : undefined,
      rawDisplayName: (origin as { display_name?: string } | null)?.display_name || undefined,
      rawNominatim: origin || mbData || bdc || osmMapData || undefined,
    },
    // Direct top-level properties for seamless compatibility + Raw unformatted GPS/Geocoder payload
    street: finalStreet,
    exteriorNumber: houseNum || undefined,
    neighborhood: subLocality || undefined,
    crossStreets: crossRoad || undefined,
    landmark: landmarkPlace || undefined,
    reference: landmarkPlace || (crossRoad ? `Cerca de ${crossRoad}` : undefined),
    city: finalCityResult,
    state: finalState,
    postalCode: finalPostal,
    country: finalCountry,
    rawLat: !isIpFallback && Number.isFinite(nLat) ? nLat : undefined,
    rawLon: !isIpFallback && Number.isFinite(nLon) ? nLon : undefined,
    rawDisplayName: (origin as { display_name?: string } | null)?.display_name || undefined,
    rawNominatim: origin || mbData || bdc || osmMapData || undefined,
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
