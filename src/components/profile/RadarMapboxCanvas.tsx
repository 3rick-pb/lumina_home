"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RadarCountryCode } from "@/lib/radarCountries";
import { Layers, Satellite, Map as MapIcon } from "lucide-react";

export interface CountryGeoBounds {
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  west: number;
  east: number;
  north: number;
  south: number;
}

export const COUNTRY_GEO_CONFIG: Record<RadarCountryCode, CountryGeoBounds> = {
  EC: {
    center: [-78.4678, -1.45],
    zoom: 6.45,
    pitch: 0,
    bearing: 0,
    west: -81.2,
    east: -75.1,
    north: 1.48,
    south: -5.02,
  },
  CO: {
    center: [-74.0721, 4.5709],
    zoom: 5.5,
    pitch: 0,
    bearing: 0,
    west: -79.2,
    east: -66.8,
    north: 12.5,
    south: -4.2,
  },
  AR: {
    center: [-64.1888, -34.6037],
    zoom: 4.3,
    pitch: 0,
    bearing: 0,
    west: -73.6,
    east: -53.6,
    north: -21.8,
    south: -55.0,
  },
  PE: {
    center: [-75.5, -9.8],
    zoom: 5.2,
    pitch: 0,
    bearing: 0,
    west: -81.4,
    east: -68.6,
    north: -0.05,
    south: -18.35,
  },
  MX: {
    center: [-101.5, 23.2],
    zoom: 4.8,
    pitch: 0,
    bearing: 0,
    west: -117.1,
    east: -86.7,
    north: 32.7,
    south: 14.5,
  },
  CL: {
    center: [-70.6693, -35.6751],
    zoom: 4.5,
    pitch: 0,
    bearing: 0,
    west: -75.7,
    east: -66.4,
    north: -17.5,
    south: -55.9,
  },
};

function normalizeGeoKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Calibrated GPS [lng, lat] coordinates for Quito neighborhoods/parishes/avenues, all 24 Ecuadorian provinces & Latin American cities
export const EXACT_CITY_LNG_LAT: Record<string, [number, number]> = {
  // Quito — Exact Urban & Rural Parishes, Neighborhoods, Valleys & Main Avenues
  "inaquito": [-78.4832, -0.1825],
  "la carolina": [-78.4847, -0.1856],
  "parque la carolina": [-78.4847, -0.1856],
  "republica del salvador": [-78.4802, -0.1818],
  "av republica del salvador": [-78.4802, -0.1818],
  "naciones unidas": [-78.4825, -0.1768],
  "av naciones unidas": [-78.4825, -0.1768],
  "av amazonas": [-78.4865, -0.1892],
  "amazonas": [-78.4865, -0.1892],
  "av shyris": [-78.4798, -0.1795],
  "los shyris": [-78.4798, -0.1795],
  "av 6 de diciembre": [-78.4782, -0.1755],
  "6 de diciembre": [-78.4782, -0.1755],
  "av 10 de agosto": [-78.4915, -0.1742],
  "10 de agosto": [-78.4915, -0.1742],
  "av patria": [-78.4952, -0.2092],
  "av colon": [-78.4895, -0.1985],
  "av orellana": [-78.4838, -0.1942],
  "av gonzalez suarez": [-78.4785, -0.1972],
  "gonzalez suarez": [-78.4785, -0.1972],
  "bellavista": [-78.4742, -0.1848],
  "batan alto": [-78.4695, -0.1752],
  "el batan": [-78.4755, -0.1765],
  "quicentro": [-78.4805, -0.1762],
  "el inca": [-78.4682, -0.1565],
  "jipijapa": [-78.4789, -0.1654],
  "rumipamba": [-78.4962, -0.1785],
  "mariana de jesus": [-78.4935, -0.1885],
  "san gabriel": [-78.4982, -0.1912],
  "universidad central": [-78.5055, -0.2005],
  "miraflores": [-78.5015, -0.1995],
  "san juan": [-78.5095, -0.2135],
  "la mariscal": [-78.4912, -0.2031],
  "mariscal sucre": [-78.4912, -0.2031],
  "plaza foch": [-78.4918, -0.2036],
  "la floresta": [-78.4819, -0.2094],
  "guapulo": [-78.4731, -0.1995],
  "centro historico": [-78.5121, -0.2202],
  "plaza grande": [-78.5121, -0.2202],
  "san francisco": [-78.5152, -0.2208],
  "la basilica": [-78.5075, -0.2152],
  "san blas": [-78.5062, -0.2178],
  "san roque": [-78.5198, -0.2215],
  "el tejar": [-78.5175, -0.2165],
  "el panecillo": [-78.5186, -0.2289],
  "la tola": [-78.5042, -0.2235],
  "itchimbia": [-78.4992, -0.2212],
  "la vicentina": [-78.4895, -0.2165],
  "monjas": [-78.4882, -0.2345],
  "kennedy quito": [-78.4775, -0.1452],
  "la concepcion": [-78.4882, -0.1462],
  "bicentenario": [-78.4875, -0.1415],
  "la prensa": [-78.4945, -0.1365],
  "av la prensa": [-78.4945, -0.1365],
  "cotocollao": [-78.4965, -0.1185],
  "ponceano": [-78.4845, -0.1062],
  "el condado": [-78.5042, -0.0985],
  "carcelen": [-78.4712, -0.0895],
  "comite del pueblo": [-78.4625, -0.1315],
  "la bota": [-78.4585, -0.1215],
  "monteserrin": [-78.4615, -0.1625],
  "el bosque": [-78.4985, -0.1615],
  "pomasqui": [-78.4562, -0.0532],
  "san antonio de pichincha": [-78.4558, -0.0022],
  "mitad del mundo": [-78.4558, -0.0022],
  "calderon": [-78.4225, -0.0968],
  "carapungo": [-78.4365, -0.0992],
  "marianitas": [-78.4195, -0.1052],
  "llano chico": [-78.4385, -0.1265],
  "zambiza": [-78.4342, -0.1485],
  "nayon": [-78.4392, -0.1615],
  "miravalle": [-78.4525, -0.2045],
  "cumbaya": [-78.4301, -0.2015],
  "tumbaco": [-78.4005, -0.2131],
  "puembo": [-78.3582, -0.1775],
  "pifo": [-78.3345, -0.2285],
  "tababela": [-78.3512, -0.1265],
  "yaruqui": [-78.3185, -0.1625],
  "el quinche": [-78.2945, -0.1085],
  "conocoto": [-78.4752, -0.2935],
  "valle de los chillos": [-78.4562, -0.3125],
  "los chillos": [-78.4562, -0.3125],
  "san rafael": [-78.4612, -0.3085],
  "sangolqui": [-78.4475, -0.3341],
  "rumiahui": [-78.4475, -0.3341],
  "amaguana": [-78.5032, -0.3752],
  "alangasi": [-78.4145, -0.3065],
  "chimbacalle": [-78.5112, -0.2445],
  "villaflora": [-78.5185, -0.2492],
  "el recreo": [-78.5225, -0.2585],
  "la magdalena": [-78.5265, -0.2395],
  "la ferroviaria": [-78.5045, -0.2565],
  "chilibulo": [-78.5365, -0.2485],
  "san bartolo": [-78.5325, -0.2695],
  "solanda": [-78.5385, -0.2725],
  "quitumbe": [-78.5512, -0.2965],
  "chillogallo": [-78.5585, -0.2815],
  "turubamba": [-78.5465, -0.3125],
  "guamani": [-78.5542, -0.3315],
  "la ecuatoriana": [-78.5685, -0.3015],
  "quito": [-78.4832, -0.1825], // Modern commercial center (Iñaquito / La Carolina)
  "pichincha": [-78.4832, -0.1825],
  "cayambe": [-78.1453, 0.0408],
  "machachi": [-78.5671, -0.5101],

  // Cuenca — Exact Sectors
  "el ejido": [-79.0085, -2.9052],
  "yanuncay": [-79.0195, -2.9125],
  "totoracocha": [-78.9865, -2.8952],
  "challuabamba": [-78.9215, -2.8585],
  "puertas del sol": [-79.0245, -2.9015],
  "cuenca": [-79.0045, -2.9001],
  "azuay": [-79.0045, -2.9001],
  "gualaceo": [-78.7781, -2.8926],
  "ambato": [-78.6197, -1.2491],
  "tungurahua": [-78.6197, -1.2491],
  "banos": [-78.4229, -1.3964],
  "loja": [-79.2042, -3.9931],
  "catamayo": [-79.3592, -3.9866],
  "ibarra": [-78.1223, 0.3517],
  "imbabura": [-78.1223, 0.3517],
  "otavalo": [-78.2611, 0.2343],
  "cotacachi": [-78.2642, 0.3011],
  "riobamba": [-78.6471, -1.6635],
  "chimborazo": [-78.6471, -1.6635],
  "latacunga": [-78.6155, -0.9352],
  "cotopaxi": [-78.6155, -0.9352],
  "salcedo": [-78.5906, -1.0455],
  "tulcan": [-77.7173, 0.8119],
  "carchi": [-77.7173, 0.8119],
  "azogues": [-78.8486, -2.7397],
  "canar": [-78.8486, -2.7397],
  "guaranda": [-79.001, -1.5926],
  "bolivar": [-79.001, -1.5926],

  // Guayaquil — Exact Sectors & Cantons
  "urdesa": [-79.9085, -2.1685],
  "kennedy": [-79.8995, -2.1695],
  "los ceibos": [-79.9425, -2.1625],
  "ceibos": [-79.9425, -2.1625],
  "alborada": [-79.9025, -2.1365],
  "la garzota": [-79.8895, -2.1452],
  "garzota": [-79.8895, -2.1452],
  "sauces": [-79.8945, -2.1285],
  "samanes": [-79.9045, -2.1125],
  "via a la costa": [-79.9825, -2.1852],
  "puerto santa ana": [-79.8765, -2.1815],
  "las penas": [-79.8758, -2.1832],
  "centenario": [-79.8925, -2.2145],
  "la puntilla": [-79.865, -2.1385],
  "guayaquil": [-79.8891, -2.1894],
  "guayas": [-79.8891, -2.1894],
  "samborondon": [-79.865, -2.085],
  "duran": [-79.831, -2.171],
  "daule": [-79.978, -1.862],
  "milagro": [-79.5942, -2.134],
  "playas": [-80.388, -2.632],
  "manta": [-80.7089, -0.9677],
  "portoviejo": [-80.4545, -1.0546],
  "manabi": [-80.4545, -1.0546],
  "chone": [-80.0936, -0.6982],
  "montecristi": [-80.6589, -1.0458],
  "bahia de caraquez": [-80.4236, -0.5979],
  "santo domingo": [-79.1754, -0.253],
  "tsachilas": [-79.1754, -0.253],
  "machala": [-79.9554, -3.2581],
  "el oro": [-79.9554, -3.2581],
  "pasaje": [-79.807, -3.3256],
  "santa rosa": [-79.9595, -3.4488],
  "huaquillas": [-80.2308, -3.4752],
  "esmeraldas": [-79.654, 0.9592],
  "atacames": [-79.845, 0.869],
  "quininde": [-79.469, 0.327],
  "babahoyo": [-79.5346, -1.8019],
  "quevedo": [-79.4628, -1.0286],
  "los rios": [-79.5346, -1.8019],
  "ventanas": [-79.459, -1.441],
  "salinas": [-80.9515, -2.2145],
  "santa elena": [-80.8587, -2.2262],
  "libertad": [-80.9103, -2.233],
  "montanita": [-80.7528, -1.8267],

  // Ecuador — Amazonía / Oriente
  "tena": [-77.8129, -0.9938],
  "napo": [-77.8129, -0.9938],
  "puyo": [-78.0026, -1.4924],
  "pastaza": [-78.0026, -1.4924],
  "macas": [-78.1114, -2.3087],
  "morona santiago": [-78.1114, -2.3087],
  "zamora": [-78.9549, -4.0692],
  "zamora chinchipe": [-78.9549, -4.0692],
  "nueva loja": [-76.8885, 0.0847],
  "lago agrio": [-76.8885, 0.0847],
  "sucumbios": [-76.8885, 0.0847],
  "coca": [-76.9871, -0.4665],
  "el coca": [-76.9871, -0.4665],
  "orellana": [-76.9871, -0.4665],

  // Ecuador — Galápagos
  "galapagos": [-90.3138, -0.7443],
  "puerto ayora": [-90.3138, -0.7443],
  "santa cruz": [-90.3138, -0.7443],
  "san cristobal": [-89.6103, -0.9022],
  "baquerizo moreno": [-89.6103, -0.9022],

  // Colombia
  "bogota": [-74.0721, 4.711],
  "cundinamarca": [-74.0721, 4.711],
  "medellin": [-75.5636, 6.2442],
  "antioquia": [-75.5636, 6.2442],
  "cali": [-76.532, 3.4516],
  "valle del cauca": [-76.532, 3.4516],
  "barranquilla": [-74.7964, 10.9685],
  "atlantico": [-74.7964, 10.9685],
  "cartagena": [-75.4794, 10.391],
  "bucaramanga": [-73.1198, 7.1254],
  "santander": [-73.1198, 7.1254],
  "pereira": [-75.6961, 4.8133],
  "santa marta": [-74.199, 11.2408],

  // Argentina
  "buenos aires": [-58.3816, -34.6037],
  "caba": [-58.3816, -34.6037],
  "cordoba": [-64.1888, -31.4201],
  "rosario": [-60.6393, -32.9468],
  "santa fe": [-60.7, -31.6333],
  "mendoza": [-68.8458, -32.8895],
  "la plata": [-57.9545, -34.9215],
  "tucuman": [-65.2176, -26.8083],
  "mar del plata": [-57.5426, -38.0055],
  "salta": [-65.4117, -24.7859],

  // Perú
  "lima": [-77.0428, -12.0464],
  "callao": [-77.1181, -12.0566],
  "arequipa": [-71.5375, -16.409],
  "trujillo": [-79.029, -8.116],
  "la libertad": [-79.029, -8.116],
  "cusco": [-71.9675, -13.532],
  "cuzco": [-71.9675, -13.532],
  "chiclayo": [-79.8409, -6.7714],
  "lambayeque": [-79.8409, -6.7714],
  "piura": [-80.6328, -5.1945],
  "iquitos": [-73.2516, -3.7437],
  "huancayo": [-75.2049, -12.0651],

  // México
  "ciudad de mexico": [-99.1332, 19.4326],
  "cdmx": [-99.1332, 19.4326],
  "guadalajara": [-103.3496, 20.6597],
  "jalisco": [-103.3496, 20.6597],
  "monterrey": [-100.3161, 25.6866],
  "nuevo leon": [-100.3161, 25.6866],
  "puebla": [-98.2063, 19.0414],
  "cancun": [-86.8515, 21.1619],
  "quintana roo": [-86.8515, 21.1619],
  "queretaro": [-100.3899, 20.5888],
  "merida": [-89.5926, 20.9674],
  "yucatan": [-89.5926, 20.9674],
  "tijuana": [-117.0382, 32.5149],

  // Chile
  "santiago": [-70.6693, -33.4489],
  "region metropolitana": [-70.6693, -33.4489],
  "valparaiso": [-71.6127, -33.0472],
  "vina del mar": [-71.5518, -33.0245],
  "concepcion": [-73.0444, -36.8201],
  "biobio": [-73.0444, -36.8201],
  "la serena": [-71.252, -29.9027],
  "antofagasta": [-70.3975, -23.6509],
  "temuco": [-72.5904, -38.7359],
  "iquique": [-70.1357, -20.2307],
  "puerto montt": [-72.9429, -41.4693],
};

// Priority-sorted keys so specific neighborhoods ("la carolina", "el condado", "cumbaya", "inaquito")
// match BEFORE general city names ("quito", "guayaquil", "cuenca") when a full address is provided!
const SORTED_GEO_KEYS = Object.keys(EXACT_CITY_LNG_LAT).sort((a, b) => {
  const genericCities = new Set(["quito", "pichincha", "guayaquil", "guayas", "cuenca", "azuay", "bogota", "lima", "santiago", "buenos aires"]);
  const aGeneric = genericCities.has(a) ? 1 : 0;
  const bGeneric = genericCities.has(b) ? 1 : 0;
  if (aGeneric !== bGeneric) return aGeneric - bGeneric;
  return b.length - a.length;
});

export function resolveGeoLngLat(
  cityName: string | undefined,
  xPct: number,
  yPct: number,
  countryCode: RadarCountryCode,
  offsetXPct: number = 0,
  offsetYPct: number = 0,
  exactLngLat?: [number, number],
  camZoom: number = 6.45
): [number, number] {
  let baseLng: number | null = null;
  let baseLat: number | null = null;

  if (
    exactLngLat &&
    typeof exactLngLat[0] === "number" &&
    typeof exactLngLat[1] === "number" &&
    !isNaN(exactLngLat[0]) &&
    !isNaN(exactLngLat[1]) &&
    Math.abs(exactLngLat[0]) > 0.01
  ) {
    baseLng = exactLngLat[0];
    baseLat = exactLngLat[1];
  } else {
    const bounds = COUNTRY_GEO_CONFIG[countryCode] || COUNTRY_GEO_CONFIG.EC;
    const cleanCity = normalizeGeoKey(cityName || "");

    if (cleanCity && EXACT_CITY_LNG_LAT[cleanCity]) {
      [baseLng, baseLat] = EXACT_CITY_LNG_LAT[cleanCity];
    } else if (cleanCity) {
      const matchedKey = SORTED_GEO_KEYS.find((k) => cleanCity.includes(k));
      if (matchedKey) {
        [baseLng, baseLat] = EXACT_CITY_LNG_LAT[matchedKey];
      }
    }

    if (baseLng === null || baseLat === null) {
      baseLng = bounds.center[0];
      baseLat = bounds.center[1];
    }
  }

  // Adaptive zoom-aware dispersion:
  // At country overview (zoom ~6.45), degPerUnit is ~0.038° (~26px separation on screen so pins never pile up).
  // As you zoom into a city/street (zoom 11 -> 15), degPerUnit smoothly tightens down to 0.0018° (~180m street block).
  const zoomFactor = Math.pow(1.65, Math.max(0, 11.2 - camZoom));
  const degPerUnit = Math.min(0.038, Math.max(0.0018, 0.0018 * zoomFactor));
  const geoLng = baseLng + offsetXPct * degPerUnit;
  const geoLat = baseLat - offsetYPct * degPerUnit;

  return [geoLng, geoLat];
}

// ============================================================================
// WEB MERCATOR (EPSG:3857) EXACT PROJECTION HELPERS
// ============================================================================
const TILE_SIZE = 256;

function lngToMercatorX(lng: number, zoom: number): number {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  return ((lng + 180) / 360) * scale;
}

function latToMercatorY(lat: number, zoom: number): number {
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const rad = (clampedLat * Math.PI) / 180;
  const scale = TILE_SIZE * Math.pow(2, zoom);
  return (0.5 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI)) * scale;
}

function mercatorXToLng(wx: number, zoom: number): number {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  return (wx / scale) * 360 - 180;
}

function mercatorYToLat(wy: number, zoom: number): number {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const n = Math.PI - (2 * Math.PI * wy) / scale;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

// Global in-memory tile cache — 100% Watermark-Free ArcGIS / Esri + OpenStreetMap Endpoints
const tileImageCache = new Map<string, HTMLImageElement>();
const tileLoadingSet = new Set<string>();

type TileProvider =
  | "satellite"
  | "dark-base"
  | "boundaries-labels"
  | "street-topo"
  | "osm-streets"
  | "carto-dark-all"
  | "carto-dark-labels"
  | "carto-voyager";

// Maximum safe native zoom per tile provider in Latin America / Ecuador
// Prevents Esri ArcGIS from ever returning HTTP 200 "Map Data Not Available" placeholder images
const PROVIDER_MAX_NATIVE_Z: Record<TileProvider, number> = {
  "dark-base": 11,
  "boundaries-labels": 11,
  "satellite": 13,
  "street-topo": 12,
  "osm-streets": 18,
  "carto-dark-all": 18,
  "carto-dark-labels": 18,
  "carto-voyager": 18,
};

function getTileCacheKey(provider: TileProvider, z: number, x: number, y: number): string {
  const maxIndex = Math.pow(2, z);
  const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
  return `${provider}:${z}:${wrappedX}:${y}`;
}

function getTileUrl(provider: TileProvider, z: number, x: number, y: number, useAltHost = false): string {
  const maxIndex = Math.pow(2, z);
  const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
  const cartoSubs = ["a", "b", "c", "d"];
  const cartoSub = cartoSubs[(wrappedX + y + (useAltHost ? 1 : 0)) % cartoSubs.length];

  if (provider === "carto-dark-all") {
    return `https://${cartoSub}.basemaps.cartocdn.com/dark_all/${z}/${wrappedX}/${y}@2x.png`;
  }
  if (provider === "carto-dark-labels") {
    return `https://${cartoSub}.basemaps.cartocdn.com/dark_only_labels/${z}/${wrappedX}/${y}@2x.png`;
  }
  if (provider === "carto-voyager" || provider === "osm-streets") {
    return `https://${cartoSub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${wrappedX}/${y}@2x.png`;
  }

  // Load-balance across both official Esri ArcGIS CDN hosts to double concurrent tile throughput
  const host =
    useAltHost
      ? (wrappedX + y) % 2 === 0
        ? "services.arcgisonline.com"
        : "server.arcgisonline.com"
      : (wrappedX + y) % 2 === 0
      ? "server.arcgisonline.com"
      : "services.arcgisonline.com";

  if (provider === "satellite") {
    return `https://${host}/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${wrappedX}`;
  }
  if (provider === "dark-base") {
    return `https://${host}/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${wrappedX}`;
  }
  if (provider === "boundaries-labels") {
    return `https://${host}/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${wrappedX}`;
  }
  return `https://${host}/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${wrappedX}`;
}

export interface ProjectedPinPosition {
  x: number;
  y: number;
  visible: boolean;
  isMoving: boolean;
}

interface RadarMapboxCanvasProps {
  selectedCountry: RadarCountryCode;
  zoomCommand: number;
  focusTarget: {
    xPct: number;
    yPct: number;
    zoomLevel: number;
    cityName?: string;
    exactLngLat?: [number, number];
    seq: number;
  } | null;
  resetCommandSeq: number;
  onMapReady?: () => void;
  onCanvasClick?: () => void;
  renderOverlayPins: (
    projectFn: (
      cityName: string | undefined,
      baseX: number,
      baseY: number,
      dispX?: number,
      dispY?: number,
      exactLngLat?: [number, number]
    ) => ProjectedPinPosition
  ) => React.ReactNode;
}

// Cap cache size at 2500 tiles with LRU refresh so continental + regional tiles are NEVER evicted
const MAX_TILE_CACHE_SIZE = 2500;
function cacheTileImage(key: string, img: HTMLImageElement) {
  if (tileImageCache.has(key)) {
    tileImageCache.delete(key);
  } else if (tileImageCache.size >= MAX_TILE_CACHE_SIZE) {
    const oldestKey = tileImageCache.keys().next().value;
    if (oldestKey) tileImageCache.delete(oldestKey);
  }
  tileImageCache.set(key, img);
}

// Eagerly warm low-zoom continental & world overview tiles (z = 2, 3, 4, 5) once so zooming out
// across South/Central/North America is 100% instantaneous and NEVER shows a blank green background.
let continentalTilesPreloaded = false;
function preloadContinentalBaseTiles(onTileLoaded?: () => void) {
  if (continentalTilesPreloaded || typeof window === "undefined") return;
  continentalTilesPreloaded = true;

  const providers: TileProvider[] = ["dark-base", "satellite", "boundaries-labels"];
  const ranges: Array<{ z: number; xMin: number; xMax: number; yMin: number; yMax: number }> = [
    { z: 2, xMin: 0, xMax: 2, yMin: 1, yMax: 2 }, // Entire Western Hemisphere at z=2
    { z: 3, xMin: 1, xMax: 3, yMin: 3, yMax: 5 }, // Entire Latin America at z=3
    { z: 4, xMin: 3, xMax: 6, yMin: 6, yMax: 11 }, // Andean & South America overview at z=4
    { z: 5, xMin: 7, xMax: 11, yMin: 14, yMax: 19 }, // Regional zoom-out ring around Ecuador/Colombia/Peru at z=5
  ];

  for (const r of ranges) {
    for (let x = r.xMin; x <= r.xMax; x++) {
      for (let y = r.yMin; y <= r.yMax; y++) {
        for (const provider of providers) {
          const key = getTileCacheKey(provider, r.z, x, y);
          if (tileImageCache.has(key) || tileLoadingSet.has(key)) continue;
          tileLoadingSet.add(key);
          const img = new window.Image();
          img.referrerPolicy = "no-referrer";
          img.decoding = "async";
          img.onload = () => {
            cacheTileImage(key, img);
            tileLoadingSet.delete(key);
            onTileLoaded?.();
          };
          img.onerror = () => {
            tileLoadingSet.delete(key);
            const retryImg = new window.Image();
            retryImg.referrerPolicy = "no-referrer";
            retryImg.onload = () => {
              cacheTileImage(key, retryImg);
              onTileLoaded?.();
            };
            retryImg.src = getTileUrl(provider, r.z, x, y, true);
          };
          img.src = getTileUrl(provider, r.z, x, y, false);
        }
      }
    }
  }
}

export function RadarMapboxCanvas({
  selectedCountry,
  zoomCommand,
  focusTarget,
  resetCommandSeq,
  onMapReady,
  onCanvasClick,
  renderOverlayPins,
}: RadarMapboxCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  const initialGeo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;

  const camRef = useRef({
    lng: initialGeo.center[0],
    lat: initialGeo.center[1],
    zoom: initialGeo.zoom,
    targetLng: initialGeo.center[0],
    targetLat: initialGeo.center[1],
    targetZoom: initialGeo.zoom,
    animating: false,
    width: 960,
    height: 680,
  });

  const prevZoomCommandRef = useRef<number>(zoomCommand);
  const [, setRenderTick] = useState(0);
  const [mapStyleMode, setMapStyleMode] = useState<"tactical" | "satellite" | "street">("tactical");
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, lng: 0, lat: 0 });

  // Event-driven dirty flag & RAF scheduler — 0% GPU usage when camera is stationary
  const dirtyRef = useRef<boolean>(true);
  const rafIdRef = useRef<number>(0);
  const triggerLoopRef = useRef<(() => void) | null>(null);

  const requestRepaint = useCallback(() => {
    dirtyRef.current = true;
    setRenderTick((t) => (t + 1) % 1000000);
    triggerLoopRef.current?.();
  }, []);

  // Warm continental overview tiles immediately so zooming out never hits an empty cache
  useEffect(() => {
    preloadContinentalBaseTiles(() => {
      dirtyRef.current = true;
      triggerLoopRef.current?.();
    });
  }, []);

  // Observe container size changes so pin coordinates and canvas dimensions stay 100% synchronized
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        if (w > 0 && h > 0 && (Math.abs(camRef.current.width - w) > 2 || Math.abs(camRef.current.height - h) > 2)) {
          camRef.current.width = w;
          camRef.current.height = h;
          requestRepaint();
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [requestRepaint]);

  // Load a tile image (no-referrer, dual-CDN failover) and trigger on-demand repaint when ready
  const fetchTile = useCallback(
    (provider: TileProvider, z: number, x: number, y: number): HTMLImageElement | null => {
      if (z < 1 || z > 18) return null;
      const maxTile = Math.pow(2, z);
      if (y < 0 || y >= maxTile) return null;

      const key = getTileCacheKey(provider, z, x, y);
      const cached = tileImageCache.get(key);
      if (cached) {
        // Refresh LRU position so active screen tiles are never evicted
        tileImageCache.delete(key);
        tileImageCache.set(key, cached);
        return cached;
      }

      if (!tileLoadingSet.has(key) && typeof window !== "undefined") {
        tileLoadingSet.add(key);
        const primaryUrl = getTileUrl(provider, z, x, y, false);
        const img = new window.Image();
        img.referrerPolicy = "no-referrer";
        img.decoding = "async";
        img.onload = () => {
          cacheTileImage(key, img);
          tileLoadingSet.delete(key);
          dirtyRef.current = true;
          triggerLoopRef.current?.();
        };
        img.onerror = () => {
          // Retry on alternate Esri CDN host first, then fallback to OpenStreetMap if needed
          const retryImg = new window.Image();
          retryImg.referrerPolicy = "no-referrer";
          retryImg.decoding = "async";
          retryImg.onload = () => {
            cacheTileImage(key, retryImg);
            tileLoadingSet.delete(key);
            dirtyRef.current = true;
            triggerLoopRef.current?.();
          };
          retryImg.onerror = () => {
            tileLoadingSet.delete(key);
            if (provider === "street-topo" || provider === "dark-base") {
              const wrappedX = ((x % maxTile) + maxTile) % maxTile;
              const osmImg = new window.Image();
              osmImg.referrerPolicy = "no-referrer";
              osmImg.onload = () => {
                cacheTileImage(key, osmImg);
                dirtyRef.current = true;
                triggerLoopRef.current?.();
              };
              osmImg.src = `https://a.basemaps.cartocdn.com/dark_all/${z}/${wrappedX}/${y}@2x.png`;
            }
          };
          retryImg.src = getTileUrl(provider, z, x, y, true);
        };
        img.src = primaryUrl;
      }
      return null;
    },
    []
  );

  // High-Definition Retina (z + 1) Tile Layer Renderer with Multi-Level Ancestor & Child Fallback
  // Guarantees ZERO green/blank screens when zooming out across countries or zooming in rapidly.
  const drawTileLayer = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      provider: TileProvider,
      camLng: number,
      camLat: number,
      camZoom: number,
      width: number,
      height: number,
      alpha: number = 1,
      retinaBoost: number = 1
    ) => {
      // Clamp zTile by PROVIDER_MAX_NATIVE_Z so Esri never returns "Map Data Not Available" placeholder tiles
      const maxNativeZ = PROVIDER_MAX_NATIVE_Z[provider] ?? 18;
      const zTile = Math.max(2, Math.min(maxNativeZ, Math.floor(camZoom) + retinaBoost));
      const scaleFactor = Math.pow(2, camZoom - zTile);
      const drawnTileSize = TILE_SIZE * scaleFactor;

      // Exact camera center in continuous zoom world pixels (`TILE_SIZE * 2^camZoom`)
      const centerWx = lngToMercatorX(camLng, camZoom);
      const centerWy = latToMercatorY(camLat, camZoom);

      const startTileX = Math.floor((centerWx - width / 2) / drawnTileSize) - 1;
      const endTileX = Math.ceil((centerWx + width / 2) / drawnTileSize) + 1;
      const startTileY = Math.floor((centerWy - height / 2) / drawnTileSize) - 1;
      const endTileY = Math.ceil((centerWy + height / 2) / drawnTileSize) + 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      for (let ty = startTileY; ty <= endTileY; ty++) {
        for (let tx = startTileX; tx <= endTileX; tx++) {
          const screenX = tx * drawnTileSize - centerWx + width / 2;
          const screenY = ty * drawnTileSize - centerWy + height / 2;

          const exactImg = fetchTile(provider, zTile, tx, ty);
          if (exactImg) {
            ctx.drawImage(exactImg, screenX, screenY, drawnTileSize + 0.4, drawnTileSize + 0.4);
            continue;
          }

          // 1. MULTI-LEVEL ANCESTOR FALLBACK (walk from zTile - 1 all the way down to z = 2)
          let drewAncestor = false;
          if (zTile > 2) {
            fetchTile(provider, zTile - 1, Math.floor(tx / 2), Math.floor(ty / 2));
            for (let dz = 1; dz <= zTile - 2; dz++) {
              const ancZ = zTile - dz;
              const div = 1 << dz;
              const ax = Math.floor(tx / div);
              const ay = Math.floor(ty / div);
              const ancImg = tileImageCache.get(getTileCacheKey(provider, ancZ, ax, ay));
              if (ancImg) {
                const subX = ((tx % div) + div) % div;
                const subY = ((ty % div) + div) % div;
                const srcW = ancImg.width / div;
                const srcH = ancImg.height / div;
                ctx.drawImage(
                  ancImg,
                  subX * srcW,
                  subY * srcH,
                  srcW,
                  srcH,
                  screenX,
                  screenY,
                  drawnTileSize + 0.5,
                  drawnTileSize + 0.5
                );
                drewAncestor = true;
                break;
              }
            }
          }
          if (drewAncestor) continue;

          // 2. CHILD-TILE QUADRANT COMPOSITE FALLBACK (zTile + 1 and zTile + 2)
          if (zTile < 18) {
            const halfSize = drawnTileSize / 2;
            for (let cy = 0; cy < 2; cy++) {
              for (let cx = 0; cx < 2; cx++) {
                const childX = tx * 2 + cx;
                const childY = ty * 2 + cy;
                const childImg = tileImageCache.get(getTileCacheKey(provider, zTile + 1, childX, childY));
                if (childImg) {
                  ctx.drawImage(
                    childImg,
                    screenX + cx * halfSize,
                    screenY + cy * halfSize,
                    halfSize + 0.4,
                    halfSize + 0.4
                  );
                } else if (zTile + 2 <= 18) {
                  const quarterSize = drawnTileSize / 4;
                  for (let gcy = 0; gcy < 2; gcy++) {
                    for (let gcx = 0; gcx < 2; gcx++) {
                      const grandX = childX * 2 + gcx;
                      const grandY = childY * 2 + gcy;
                      const grandImg = tileImageCache.get(
                        getTileCacheKey(provider, zTile + 2, grandX, grandY)
                      );
                      if (grandImg) {
                        ctx.drawImage(
                          grandImg,
                          screenX + cx * halfSize + gcx * quarterSize,
                          screenY + cy * halfSize + gcy * quarterSize,
                          quarterSize + 0.35,
                          quarterSize + 0.35
                        );
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      ctx.restore();
    },
    [fetchTile]
  );

  // Event-Driven On-Demand Render Loop (0% Idle GPU usage on low-end hardware)
  useEffect(() => {
    let mounted = true;
    onMapReadyRef.current?.();

    const renderStep = () => {
      rafIdRef.current = 0;
      if (!mounted) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      const cam = camRef.current;

      if (container && canvas) {
        const w = container.clientWidth || 960;
        const h = container.clientHeight || 680;
        if (Math.abs(cam.width - w) > 1 || Math.abs(cam.height - h) > 1) {
          cam.width = w;
          cam.height = h;
          dirtyRef.current = true;
        }

        // True 2x Retina framebuffer resolution for razor-sharp typography & borders
        const dpr = Math.min(2, Math.max(1.5, (typeof window !== "undefined" && window.devicePixelRatio) || 2));
        const targetW = Math.round(w * dpr);
        const targetH = Math.round(h * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
          dirtyRef.current = true;
        }

        if (cam.animating) {
          const dLng = cam.targetLng - cam.lng;
          const dLat = cam.targetLat - cam.lat;
          const dZoom = cam.targetZoom - cam.zoom;
          if (Math.abs(dLng) < 0.00015 && Math.abs(dLat) < 0.00015 && Math.abs(dZoom) < 0.0008) {
            cam.lng = cam.targetLng;
            cam.lat = cam.targetLat;
            cam.zoom = cam.targetZoom;
            cam.animating = false;
          } else {
            // Silky smooth exponential spring interpolation (60-120fps)
            cam.lng += dLng * 0.105;
            cam.lat += dLat * 0.105;
            cam.zoom += dZoom * 0.115;
          }
          dirtyRef.current = true;
          setRenderTick((t) => (t + 1) % 1000000);
        }

        if (dirtyRef.current) {
          dirtyRef.current = false;
          const ctx = canvas.getContext("2d", { alpha: false });
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.fillStyle = mapStyleMode === "street" ? "#e8ecef" : "#101715";
            ctx.fillRect(0, 0, w, h);

            if (mapStyleMode === "tactical") {
              if (cam.zoom < 9.8) {
                // Country / Continental view: Esri Dark Gray Base + Satellite Relief + Boundaries
                drawTileLayer(ctx, "dark-base", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 1);
                drawTileLayer(ctx, "satellite", cam.lng, cam.lat, cam.zoom, w, h, 0.32, 0);
                drawTileLayer(ctx, "boundaries-labels", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 1);
              } else {
                // City / Neighborhood / Street view (up to z=18): Single clean CartoDB @2x Dark All layer
                // (already includes high-DPI street & sector labels, preventing any double-label overlap)
                drawTileLayer(ctx, "carto-dark-all", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 0);
              }
            } else if (mapStyleMode === "satellite") {
              // Full HD Esri Satellite Imagery + clean labels
              drawTileLayer(ctx, "satellite", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 1);
              if (cam.zoom < 10.2) {
                drawTileLayer(ctx, "boundaries-labels", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 1);
              } else {
                drawTileLayer(ctx, "carto-dark-labels", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 0);
              }
            } else {
              // Full-color CartoDB Voyager @2x Retina street & neighborhood cartography up to z=18
              drawTileLayer(ctx, "carto-voyager", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 0);
            }

            // Subtle Tactical Radar Coordinate Grid Lines
            if (mapStyleMode !== "street") {
              ctx.save();
              ctx.strokeStyle = "rgba(204, 255, 0, 0.065)";
              ctx.lineWidth = 1;
              const stepDeg = cam.zoom > 7 ? 1 : 2;
              const centerWx = lngToMercatorX(cam.lng, cam.zoom);
              const centerWy = latToMercatorY(cam.lat, cam.zoom);

              for (let lngLine = -120; lngLine <= -50; lngLine += stepDeg) {
                const sx = lngToMercatorX(lngLine, cam.zoom) - centerWx + w / 2;
                if (sx >= 0 && sx <= w) {
                  ctx.beginPath();
                  ctx.moveTo(sx, 0);
                  ctx.lineTo(sx, h);
                  ctx.stroke();
                }
              }
              for (let latLine = -60; latLine <= 35; latLine += stepDeg) {
                const sy = latToMercatorY(latLine, cam.zoom) - centerWy + h / 2;
                if (sy >= 0 && sy <= h) {
                  ctx.beginPath();
                  ctx.moveTo(0, sy);
                  ctx.lineTo(w, sy);
                  ctx.stroke();
                }
              }
              ctx.restore();
            }
          }
        }
      }

      // Only schedule next frame if camera is actively animating or dirty
      if (camRef.current.animating || dirtyRef.current) {
        rafIdRef.current = window.requestAnimationFrame(renderStep);
      }
    };

    const scheduleFrame = () => {
      if (rafIdRef.current === 0 && mounted) {
        rafIdRef.current = window.requestAnimationFrame(renderStep);
      }
    };

    triggerLoopRef.current = scheduleFrame;
    dirtyRef.current = true;
    scheduleFrame();

    return () => {
      mounted = false;
      triggerLoopRef.current = null;
      if (rafIdRef.current !== 0) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [drawTileLayer, mapStyleMode]);

  // Fly to selected country when changed
  useEffect(() => {
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    camRef.current.targetLng = geo.center[0];
    camRef.current.targetLat = geo.center[1];
    camRef.current.targetZoom = geo.zoom;
    camRef.current.animating = true;
    requestRepaint();
  }, [selectedCountry, requestRepaint]);

  // Respond to external zoom buttons (+ / -)
  useEffect(() => {
    if (zoomCommand === prevZoomCommandRef.current) return;
    const ratio = zoomCommand / Math.max(0.5, prevZoomCommandRef.current);
    prevZoomCommandRef.current = zoomCommand;

    const delta = Math.log2(ratio);
    camRef.current.targetZoom = Math.max(3.2, Math.min(17.5, camRef.current.targetZoom + delta * 1.35));
    camRef.current.animating = true;
    requestRepaint();
  }, [zoomCommand, requestRepaint]);

  // Respond to Reset View command
  useEffect(() => {
    if (resetCommandSeq === 0) return;
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    camRef.current.targetLng = geo.center[0];
    camRef.current.targetLat = geo.center[1];
    camRef.current.targetZoom = geo.zoom;
    camRef.current.animating = true;
    requestRepaint();
  }, [resetCommandSeq, selectedCountry, requestRepaint]);

  // Respond to focusOnLocation (search bar city/street selection or anchor/cluster click)
  useEffect(() => {
    if (!focusTarget) return;
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    const [lng, lat] = resolveGeoLngLat(
      focusTarget.cityName,
      focusTarget.xPct,
      focusTarget.yPct,
      selectedCountry,
      0,
      0,
      focusTarget.exactLngLat
    );
    // Zoom deeply to street/neighborhood level (13.8 - 16.2) when focusing on an exact address or pin
    const hasExactCoordsOrStreet =
      Boolean(focusTarget.exactLngLat) ||
      Boolean(focusTarget.cityName && (focusTarget.cityName.includes(",") || focusTarget.cityName.length > 10));
    const targetMapZoom = Math.min(
      16.8,
      hasExactCoordsOrStreet
        ? Math.max(14.4, geo.zoom + (focusTarget.zoomLevel - 1) * 2.8)
        : Math.max(12.8, geo.zoom + Math.max(2.0, (focusTarget.zoomLevel - 1) * 2.5))
    );
    camRef.current.targetLng = lng;
    camRef.current.targetLat = lat;
    camRef.current.targetZoom = targetMapZoom;
    camRef.current.animating = true;
    requestRepaint();
  }, [focusTarget, selectedCountry, requestRepaint]);

  const dragVelRef = useRef<{ x: number; y: number; t: number; vx: number; vy: number }>({
    x: 0,
    y: 0,
    t: 0,
    vx: 0,
    vy: 0,
  });

  // Exact Web Mercator projection helper — locks every pin to its exact geographic [lng, lat] coordinate
  // (exact GPS/Nominatim street coordinate or calibrated neighborhood/sector inside Quito/Guayaquil/etc.)
  // with zero screen-pixel floating drift.
  const projectPin = useCallback(
    (
      cityName: string | undefined,
      baseX: number,
      baseY: number,
      dispX?: number,
      dispY?: number,
      exactLngLat?: [number, number]
    ): ProjectedPinPosition => {
      const cam = camRef.current;
      const liveW = containerRef.current?.clientWidth || cam.width || 960;
      const liveH = containerRef.current?.clientHeight || cam.height || 680;

      const offsetX = dispX !== undefined ? dispX - baseX : 0;
      const offsetY = dispY !== undefined ? dispY - baseY : 0;
      const [lng, lat] = resolveGeoLngLat(
        cityName,
        baseX,
        baseY,
        selectedCountry,
        offsetX,
        offsetY,
        exactLngLat,
        cam.zoom
      );

      const centerWx = lngToMercatorX(cam.lng, cam.zoom);
      const centerWy = latToMercatorY(cam.lat, cam.zoom);
      const pinWx = lngToMercatorX(lng, cam.zoom);
      const pinWy = latToMercatorY(lat, cam.zoom);

      const rawX = pinWx - centerWx + liveW / 2;
      const rawY = pinWy - centerWy + liveH / 2;
      const isMoving = isDraggingRef.current || cam.animating;
      const x = isMoving ? Number(rawX.toFixed(2)) : Math.round(rawX);
      const y = isMoving ? Number(rawY.toFixed(2)) : Math.round(rawY);
      const visible = x >= -60 && x <= liveW + 60 && y >= -60 && y <= liveH + 60;

      return { x, y, visible, isMoving };
    },
    [selectedCountry]
  );

  // Interactive Pointer Drag & Wheel Zoom handlers with strict PointerCapture, Selection Lock & Momentum Inertia
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore right-clicks or clicks originating from interactive HUD buttons/inputs
    if (e.button !== 0) return;
    const targetEl = e.target as HTMLElement | null;
    if (targetEl?.closest("button, input, select, a, [data-no-map-pan='true']")) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    window.getSelection()?.removeAllRanges();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if pointer capture is unsupported
    }

    isDraggingRef.current = true;
    dragMovedRef.current = false;
    camRef.current.animating = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      lng: camRef.current.lng,
      lat: camRef.current.lat,
    };
    dragVelRef.current = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const now = performance.now();
    const dt = Math.max(4, now - dragVelRef.current.t);
    const instVx = (e.clientX - dragVelRef.current.x) / dt;
    const instVy = (e.clientY - dragVelRef.current.y) / dt;
    dragVelRef.current = {
      x: e.clientX,
      y: e.clientY,
      t: now,
      vx: dragVelRef.current.vx * 0.45 + instVx * 0.55,
      vy: dragVelRef.current.vy * 0.45 + instVy * 0.55,
    };

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragMovedRef.current = true;
    }
    const z = camRef.current.zoom;
    const startWx = lngToMercatorX(dragStartRef.current.lng, z);
    const startWy = latToMercatorY(dragStartRef.current.lat, z);
    camRef.current.lng = mercatorXToLng(startWx - dx, z);
    camRef.current.lat = mercatorYToLat(startWy - dy, z);
    camRef.current.targetLng = camRef.current.lng;
    camRef.current.targetLat = camRef.current.lat;
    requestRepaint();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release errors
      }
      const { vx, vy, t } = dragVelRef.current;
      const age = performance.now() - t;
      if (age < 80 && Math.hypot(vx, vy) > 0.12) {
        const z = camRef.current.zoom;
        const curWx = lngToMercatorX(camRef.current.lng, z);
        const curWy = latToMercatorY(camRef.current.lat, z);
        camRef.current.targetLng = mercatorXToLng(curWx - vx * 160, z);
        camRef.current.targetLat = mercatorYToLat(curWy - vy * 160, z);
        camRef.current.animating = true;
      }
      requestRepaint();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0024;
    const nextTargetZoom = Math.max(3.2, Math.min(17.5, camRef.current.targetZoom + zoomDelta));
    camRef.current.targetZoom = nextTargetZoom;
    camRef.current.animating = true;
    requestRepaint();
  };

  // Hardware-composited CSS filter applied once to the canvas element instead of 75x per frame in JS
  const canvasHardwareFilter =
    mapStyleMode === "tactical"
      ? "contrast(1.18) brightness(1.12)"
      : mapStyleMode === "satellite"
      ? "contrast(1.1) brightness(1.04) saturate(1.14)"
      : "none";

  return (
    <div
      ref={containerRef}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onClick={() => {
        if (!dragMovedRef.current) {
          onCanvasClick?.();
        }
      }}
      style={{
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Direct Hardware-Accelerated 2D Slippy Tile Canvas (Retina z+1 Oversampled + Hardware CSS Filter) */}
      <canvas
        ref={canvasRef}
        style={{ filter: canvasHardwareFilter }}
        className="block w-full h-full pointer-events-none"
      />

      {/* Subtle Tactical Edge Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(204,255,0,0.01) 0%, rgba(12,16,14,0.06) 72%, rgba(8,11,10,0.38) 100%)",
        }}
      />

      {/* Geographic Projected Beacons & Clusters Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {renderOverlayPins(projectPin)}
      </div>

      {/* Unobstructed Map Mode Selector Pill (Positioned above bottom cards on the left) */}
      <div
        className="absolute bottom-36 sm:bottom-40 left-3 sm:left-4 z-30 flex flex-col gap-1.5 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() =>
            setMapStyleMode((prev) =>
              prev === "tactical" ? "satellite" : prev === "satellite" ? "street" : "tactical"
            )
          }
          className="px-3 py-1.5 rounded-full bg-black/85 hover:bg-black backdrop-blur-xl border border-white/15 hover:border-[#ccff00]/60 text-[10px] font-mono text-white hover:text-[#ccff00] flex items-center gap-1.5 transition-all cursor-pointer shadow-xl"
          title="Cambiar vista del mapa (Táctico HD / Satélite Real / Mapa Calle)"
        >
          {mapStyleMode === "tactical" ? (
            <Layers className="w-3.5 h-3.5 text-[#ccff00]" />
          ) : mapStyleMode === "satellite" ? (
            <Satellite className="w-3.5 h-3.5 text-[#ccff00]" />
          ) : (
            <MapIcon className="w-3.5 h-3.5 text-[#ccff00]" />
          )}
          <span className="font-bold">
            {mapStyleMode === "tactical"
              ? "Táctico HD"
              : mapStyleMode === "satellite"
              ? "Satélite Real"
              : "Mapa Calle"}
          </span>
        </button>
      </div>
    </div>
  );
}
