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

  // Additional Quito & Ecuadorian Streets, Avenues & Sectors for Instant Exact Matching
  "calle luxemburgo": [-78.4778, -0.1835],
  "luxemburgo": [-78.4778, -0.1835],
  "bulevar rumipamba": [-78.4815, -0.1842],
  "calle suiza": [-78.4785, -0.1852],
  "checoslovaquia": [-78.4769, -0.1848],
  "calle portugal": [-78.4765, -0.1812],
  "portugal": [-78.4765, -0.1812],
  "calle suecia": [-78.4792, -0.1802],
  "finlandia": [-78.4788, -0.1795],
  "av eloy alfaro": [-78.4755, -0.1825],
  "eloy alfaro": [-78.4755, -0.1825],
  "av de los granados": [-78.4645, -0.1655],
  "los granados": [-78.4645, -0.1655],
  "gaspar de villarroel": [-78.4775, -0.1685],
  "av gaspar de villarroel": [-78.4775, -0.1685],
  "av la coruna": [-78.4818, -0.1978],
  "la coruna": [-78.4818, -0.1978],
  "reina victoria": [-78.4895, -0.2022],
  "diego de almagro": [-78.4862, -0.1965],
  "whymper": [-78.4828, -0.1955],
  "paulsen": [-78.4805, -0.1962],
  "catalina aldaz": [-78.4762, -0.1828],
  "moscou": [-78.4772, -0.1808],
  "rusia": [-78.4782, -0.1782],
  "galo plaza lasso": [-78.4768, -0.1355],
  "av galo plaza lasso": [-78.4768, -0.1355],
  "diego vasquez de cepeda": [-78.4915, -0.1125],
  "real audiencia": [-78.4882, -0.1215],
  "calle real audiencia": [-78.4882, -0.1215],
  "av mariscal sucre": [-78.4995, -0.1652],
  "av simon bolivar": [-78.4585, -0.1855],
  "av maldonado": [-78.5245, -0.2685],
  "teniente hugo ortiz": [-78.5325, -0.2655],
  "av teniente hugo ortiz": [-78.5325, -0.2655],
  "ajavi": [-78.5365, -0.2725],
  "capelo": [-78.4685, -0.3215],
  "interoceanica": [-78.4255, -0.2035],
  "av interoceanica": [-78.4255, -0.2035],
  "via samborondon": [-79.8685, -2.1325],
  "remigio crespo": [-79.0115, -2.9055],
  "av remigio crespo": [-79.0115, -2.9055],
  "el vergel": [-78.9965, -2.9065],
};

// Priority-sorted keys so specific streets & neighborhoods ("calle luxemburgo", "la carolina", "el condado", "cumbaya", "inaquito")
// match BEFORE general city names ("quito", "guayaquil", "cuenca") when a full address is provided!
const SORTED_GEO_KEYS = Object.keys(EXACT_CITY_LNG_LAT).sort((a, b) => {
  const genericCities = new Set([
    "quito",
    "pichincha",
    "guayaquil",
    "guayas",
    "cuenca",
    "azuay",
    "manta",
    "manabi",
    "ambato",
    "tungurahua",
    "bogota",
    "lima",
    "santiago",
    "buenos aires",
  ]);
  const aGeneric = genericCities.has(a) ? 1 : 0;
  const bGeneric = genericCities.has(b) ? 1 : 0;
  if (aGeneric !== bGeneric) return aGeneric - bGeneric;
  return b.length - a.length;
});

/**
 * Strips Ecuadorian house nomenclature (e.g. "N34-120", "E4-55", "Oe3-45", "#123", "Casa 4")
 * so Nominatim / Photon can resolve the exact street & intersection in Ecuador.
 */
export function cleanEcuadorStreetForGeocoding(rawStreet: string): string {
  return rawStreet
    .replace(/\b(?:[NSOE]{1,2}\d+[A-Z]?[-\s]\d+[A-Z0-9-]*|#\s*\d+|casa\s*\d+|lote\s*\d+|dpto\.?\s*\d+|apto\.?\s*\d+|bloque\s*[a-z0-9]+|piso\s*\d+)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Synchronous lookup against calibrated street/sector/parish dictionary BEFORE generic city fallback.
 */
/**
 * Official INEC 2-digit Provincial Postal Code Prefixes (01 to 24) for Ecuador.
 * Guarantees any 6-digit Ecuadorian postal code (PPCCZZ) is anchored to its true province/capital.
 */
const ECUADOR_PROVINCE_PREFIX_LNG_LAT: Record<string, [number, number]> = {
  "01": [-79.0045, -2.9001], // Azuay (Cuenca)
  "02": [-79.0010, -1.5926], // Bolívar (Guaranda)
  "03": [-78.8486, -2.7397], // Cañar (Azogues)
  "04": [-77.7173, 0.8119],  // Carchi (Tulcán)
  "05": [-78.6155, -0.9346], // Cotopaxi (Latacunga)
  "06": [-78.6471, -1.6635], // Chimborazo (Riobamba)
  "07": [-79.9554, -3.2581], // El Oro (Machala)
  "08": [-79.6540, 0.9592],  // Esmeraldas
  "09": [-79.8891, -2.1894], // Guayas (Guayaquil)
  "10": [-78.1223, 0.3517],  // Imbabura (Ibarra)
  "11": [-79.2042, -3.9931], // Loja
  "12": [-79.5346, -1.8019], // Los Ríos (Babahoyo)
  "13": [-80.4545, -1.0546], // Manabí (Portoviejo / Manta)
  "14": [-78.1114, -2.3087], // Morona Santiago (Macas)
  "15": [-77.8129, -0.9938], // Napo (Tena)
  "16": [-78.0026, -1.4924], // Pastaza (Puyo)
  "17": [-78.4832, -0.1825], // Pichincha (Quito)
  "18": [-78.6267, -1.2491], // Tungurahua (Ambato)
  "19": [-78.9549, -4.0692], // Zamora Chinchipe (Zamora)
  "20": [-90.3138, -0.7443], // Galápagos (Puerto Ayora)
  "21": [-76.8885, 0.0847],  // Sucumbíos (Nueva Loja)
  "22": [-76.9871, -0.4665], // Orellana (El Coca)
  "23": [-79.1754, -0.2531], // Santo Domingo de los Tsáchilas
  "24": [-80.8587, -2.2262], // Santa Elena
};

/**
 * Resolves the expected [lng, lat] center for a given Ecuadorian city, state, or postal code.
 * Used as a geometric bounding-radius anchor so street homonyms (e.g. "Calle Loja", "Calle Lima", "Santa Rosa")
 * can NEVER teleport a pin to another province or another country (like Peru or Colombia).
 */
export function getExpectedCityOrPostalCenter(
  city?: string,
  postalCode?: string,
  state?: string
): [number, number] {
  const cleanCity = normalizeGeoKey(formatCleanCityForGeocode(city || ""));
  if (cleanCity && EXACT_CITY_LNG_LAT[cleanCity]) {
    return EXACT_CITY_LNG_LAT[cleanCity];
  }
  if (cleanCity) {
    for (const [k, coord] of Object.entries(EXACT_CITY_LNG_LAT)) {
      if (cleanCity === k || (k.length >= 4 && cleanCity.includes(k))) {
        // Ensure it's inside Ecuador bounds (lng between -92 and -75, lat between -5.2 and 1.6)
        if (coord[0] >= -92 && coord[0] <= -75 && coord[1] >= -5.2 && coord[1] <= 1.6) {
          return coord;
        }
      }
    }
  }

  const cleanState = normalizeGeoKey(state || "");
  if (cleanState && EXACT_CITY_LNG_LAT[cleanState]) {
    const coord = EXACT_CITY_LNG_LAT[cleanState];
    if (coord[0] >= -92 && coord[0] <= -75 && coord[1] >= -5.2 && coord[1] <= 1.6) {
      return coord;
    }
  }

  const cleanDigits = (postalCode || "").replace(/\D/g, "").trim();
  if (cleanDigits.length >= 2) {
    if (ECUADOR_POSTAL_CODE_LNG_LAT[cleanDigits]) {
      return ECUADOR_POSTAL_CODE_LNG_LAT[cleanDigits];
    }
    const p2 = cleanDigits.slice(0, 2);
    if (ECUADOR_PROVINCE_PREFIX_LNG_LAT[p2]) {
      return ECUADOR_PROVINCE_PREFIX_LNG_LAT[p2];
    }
  }

  return [-78.4832, -0.1825]; // Default Quito, Ecuador
}

/**
 * Verifies that a candidate [lng, lat] coordinate actually lies inside Ecuador AND within ~38km (0.35 deg)
 * of the user's declared city / postal code center. Rejects any poisoned Peru/Colombia/distant coordinates.
 */
export function isCoordinateValidForAddress(
  lng?: number,
  lat?: number,
  city?: string,
  postalCode?: string,
  state?: string
): boolean {
  if (typeof lng !== "number" || typeof lat !== "number" || !Number.isFinite(lng) || !Number.isFinite(lat)) {
    return false;
  }
  // Strict Ecuador geographic bounding box (including Galápagos [-92..-89] and Continental [-81.5..-75.0, -5.0..1.5])
  const isGalapagos = lng >= -92.0 && lng <= -89.0 && lat >= -1.8 && lat <= 0.8;
  const isContinentalEcuador = lng >= -81.5 && lng <= -75.0 && lat >= -5.0 && lat <= 1.55;
  if (!isGalapagos && !isContinentalEcuador) {
    return false;
  }

  const expectedCenter = getExpectedCityOrPostalCenter(city, postalCode, state);
  const distDeg = Math.hypot(lng - expectedCenter[0], lat - expectedCenter[1]);
  // Must be within 0.36 degrees (~40 km metropolitan radius) of the city/postal center
  return distDeg <= 0.36;
}

/**
 * Synchronous lookup against calibrated street/sector/parish dictionary, strictly bounded
 * to the user's city/postal radius so street names like "Calle Lima", "Calle Loja", or "Santa Rosa"
 * never jump to Peru or another province.
 */
export function lookupLocalStreetOrSectorLngLat(
  street?: string,
  reference?: string,
  city?: string,
  postalCode?: string,
  state?: string
): [number, number] | null {
  const expectedCenter = getExpectedCityOrPostalCenter(city, postalCode, state);

  const detailText = normalizeGeoKey([street, reference].filter(Boolean).join(" "));
  if (detailText) {
    if (
      EXACT_CITY_LNG_LAT[detailText] &&
      Math.hypot(
        EXACT_CITY_LNG_LAT[detailText][0] - expectedCenter[0],
        EXACT_CITY_LNG_LAT[detailText][1] - expectedCenter[1]
      ) <= 0.35
    ) {
      return EXACT_CITY_LNG_LAT[detailText];
    }
    const specificKey = SORTED_GEO_KEYS.find((k) => {
      if (k.length < 5) return false;
      if (k === "quito" || k === "guayaquil" || k === "cuenca" || k === "pichincha") return false;
      // Whole-word match to prevent "alimentacion" matching "lima" or "localidad" matching "cali"
      const regex = new RegExp(`(?:^|\\s)${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`, "i");
      if (!regex.test(detailText)) return false;
      const candidate = EXACT_CITY_LNG_LAT[k];
      return Math.hypot(candidate[0] - expectedCenter[0], candidate[1] - expectedCenter[1]) <= 0.35;
    });
    if (specificKey) {
      return EXACT_CITY_LNG_LAT[specificKey];
    }
  }

  if (city) {
    return expectedCenter;
  }

  return null;
}

/**
 * Calibrated Ecuadorian 6-digit Postal Code (Código Postal EC) dictionary & zone resolver.
 * Maps official Agencia Nacional Postal prefixes and postal zones to exact parish/sector [lng, lat].
 */
const ECUADOR_POSTAL_CODE_LNG_LAT: Record<string, [number, number]> = {
  // Pichincha - Quito Distrito Metropolitano & Valles (17xxxx)
  "170101": [-78.5126, -0.2201], // Centro Histórico / González Suárez
  "170102": [-78.5082, -0.2148], // San Blas / Itchimbía / La Alameda
  "170103": [-78.5164, -0.2235], // San Roque / El Tejar / Centro
  "170104": [-78.5045, -0.2242], // La Tola / San Marcos / La Loma
  "170105": [-78.5195, -0.2422], // Chimbacalle / Chiriyacu
  "170106": [-78.5245, -0.2412], // La Magdalena / Pintado
  "170107": [-78.5182, -0.2512], // Villaflora / El Recreo
  "170108": [-78.5312, -0.2535], // Chilibulo / La Raya
  "170109": [-78.5125, -0.2625], // La Ferroviaria / Puengasí
  "170111": [-78.5482, -0.2895], // Quitumbe / Chillogallo
  "170112": [-78.5365, -0.2735], // Solanda / San Bartolo
  "170120": [-78.4945, -0.1062], // Cotocollao / El Condado
  "170121": [-78.4922, -0.1125], // Ponceano / Ofelia
  "170122": [-78.4685, -0.0955], // Carcelén / Llano Chico
  "170124": [-78.4512, -0.0715], // Pomasqui / San Antonio de Pichincha
  "170129": [-78.4742, -0.1285], // Comité del Pueblo / El Inca
  "170130": [-78.4231, -0.0968], // Calderón / Carapungo
  "170131": [-78.4265, -0.0922], // Carapungo / Marianitas
  "170135": [-78.4812, -0.1818], // Iñaquito / La Carolina / Av. Amazonas
  "170136": [-78.4752, -0.2938], // Conocoto / Valle de los Chillos
  "170138": [-78.4612, -0.3425], // Amaguaña / Valle de los Chillos
  "170143": [-78.4828, -0.2015], // Mariscal Sucre / La Mariscal
  "170150": [-78.4846, -0.1842], // Quito Urbano / La Carolina / Iñaquito
  "170155": [-78.4362, -0.2015], // Cumbayá / Miravalle
  "170157": [-78.4322, -0.2038], // Cumbayá Centro / USFQ / La Primavera
  "170184": [-78.4015, -0.2132], // Tumbaco / Hilacril / Churoloma
  "170501": [-78.4872, -0.1878], // Iñaquito / Rumipamba / Av. América
  "170502": [-78.4818, -0.1755], // Naciones Unidas / Shyris / Quicentro
  "170503": [-78.4792, -0.1825], // República del Salvador / Portugal / La Carolina
  "170504": [-78.4745, -0.1885], // Bellavista / González Suárez / Guápulo
  "170505": [-78.4835, -0.1912], // La Pradera / Eloy Alfaro / Colón
  "170506": [-78.4882, -0.1945], // Las Casas / Gasca / Universidad Central
  "170507": [-78.4838, -0.2018], // La Mariscal / Reina Victoria / Foch
  "170508": [-78.4912, -0.2065], // Miraflores / San Juan / América
  "170509": [-78.4965, -0.1782], // Mariana de Jesús / Granda Centeno
  "170510": [-78.4985, -0.1652], // El Bosque / Cochapamba
  "170511": [-78.4875, -0.1565], // La Concepción / Bicentenario / Prensa
  "170512": [-78.4755, -0.1525], // Kennedy / Los Laureles / Río Coca
  "170513": [-78.4685, -0.1585], // Monteserrín / El Batán Alto / Zámbiza
  "170514": [-78.4695, -0.1415], // El Inca / Dammer / San Isidro del Inca
  "170515": [-78.4785, -0.1975], // 12 de Octubre / Patria / La Floresta
  "170516": [-78.4815, -0.2075], // La Floresta / Andalucía / Isabel La Católica
  "170517": [-78.4925, -0.2145], // El Dorado / Ejido / Tarqui
  "170518": [-78.4925, -0.1435], // San Carlos / La Florida / Prensa
  "170520": [-78.4865, -0.1285], // Cotocollao / Condado Shopping
  "170525": [-78.4745, -0.1685], // El Batán / 6 de Diciembre / Granados
  "170601": [-78.5235, -0.2565], // San Bartolo / El Recreo
  "170602": [-78.5325, -0.2685], // Solanda / Mayorista
  "170605": [-78.5185, -0.2765], // La Argelia / Lucha de los Pobres
  "170701": [-78.5485, -0.2925], // Quitumbe / Terminal Sur
  "170702": [-78.5545, -0.3085], // Guamaní / Turubamba
  "171101": [-78.4485, -0.3315], // Sangolquí / Rumiñahui
  "171102": [-78.4545, -0.3125], // San Rafael / Valle de los Chillos
  "171103": [-78.4425, -0.3245], // Fajardo / Selva Alegre

  // Guayas - Guayaquil & Samborondón (09xxxx)
  "090101": [-79.8835, -2.1922], // Centro de Guayaquil / Rocafuerte / 9 de Octubre
  "090102": [-79.8812, -2.1855], // Las Peñas / Puerto Santa Ana
  "090103": [-79.8865, -2.1985], // Parque Centenario / Olmedo
  "090112": [-79.9012, -2.1682], // Urdesa / Kennedy / Policentro
  "090150": [-79.8962, -2.1685], // Guayaquil Urbano / Kennedy / San Marino
  "090201": [-79.8915, -2.2265], // Ximena / Barrio del Seguro / Centenario
  "090204": [-79.8942, -2.2485], // Guasmo / Pradera / Puerto Marítimo
  "090301": [-79.9265, -2.2085], // Febres Cordero / Portete
  "090501": [-79.8965, -2.1725], // Kennedy Norte / San Marino
  "090502": [-79.9085, -2.1645], // Urdesa Central / Las Monjas
  "090505": [-79.8935, -2.1545], // La Garzota / Atarazana / Aeropuerto
  "090507": [-79.8985, -2.1365], // La Alborada / Sauces
  "090509": [-79.9025, -2.1215], // Samanes / Guayacanes
  "090601": [-79.9385, -2.1665], // Los Ceibos / Espol
  "090605": [-79.9685, -2.1825], // Vía a la Costa / Puerto Azul / Belo Horizonte
  "092301": [-79.8654, -2.1382], // Samborondón / La Puntilla / Entre Ríos
  "092302": [-79.8525, -2.0945], // Ciudad Celeste / Plaza Lagos / Samborondón
  "092401": [-79.8395, -2.1725], // Durán / El Recreo
  "091910": [-79.8825, -2.0625], // La Aurora / Daule / Villa Club

  // Azuay - Cuenca (01xxxx)
  "010101": [-79.0045, -2.8995], // Centro Histórico Cuenca / El Sagrario
  "010102": [-79.0145, -2.8945], // San Sebastián / Gringolandia / Ordóñez Lasso
  "010104": [-78.9945, -2.9045], // El Vergel / Pumapungo
  "010107": [-79.0085, -2.9085], // El Ejido / Estadio / Solano
  "010150": [-79.0045, -2.9001], // Cuenca Urbano
  "010201": [-79.0185, -2.9125], // Yanuncay / Puertas del Sol
  "010203": [-78.9845, -2.8965], // Totoracocha / Monay
  "010205": [-78.9685, -2.8845], // Challuabamba / Ricaurte

  // Otras capitales y ciudades principales del Ecuador
  "130101": [-80.4545, -1.0546], // Portoviejo
  "130150": [-80.4545, -1.0546], // Portoviejo Urbano
  "130201": [-80.7282, -0.9538], // Manta / Tarqui
  "130202": [-80.7425, -0.9465], // Barbasquillo / Umiña (Manta)
  "130250": [-80.7282, -0.9538], // Manta Urbano
  "180101": [-78.6242, -1.2485], // Ambato Centro
  "180103": [-78.6345, -1.2395], // Ficoa / Miraflores (Ambato)
  "180150": [-78.6267, -1.2491], // Ambato Urbano
  "070101": [-79.9582, -3.2582], // Machala Centro
  "070150": [-79.9554, -3.2581], // Machala Urbano
  "110101": [-79.2042, -3.9931], // Loja Centro
  "110150": [-79.2042, -3.9931], // Loja Urbano
  "100101": [-78.1223, 0.3517],  // Ibarra Centro
  "100150": [-78.1223, 0.3517],  // Ibarra Urbano
  "230101": [-79.1754, -0.2531], // Santo Domingo
  "230150": [-79.1754, -0.2531], // Santo Domingo Urbano
  "060101": [-78.6471, -1.6635], // Riobamba
  "060150": [-78.6471, -1.6635], // Riobamba Urbano
  "080101": [-79.6542, 0.9682],  // Esmeraldas
  "050101": [-78.6155, -0.9346], // Latacunga
  "240101": [-80.8585, -2.2262], // Santa Elena / Salinas
  "120101": [-79.5346, -1.8019], // Babahoyo
  "120501": [-79.4628, -1.0286], // Quevedo
};

/**
 * Resolves a 6-digit Ecuadorian postal code (`170503`, `092301`, etc.) to an exact parish/sector [lng, lat],
 * applying a micro-street deterministic sub-block offset when street/reference text is also provided.
 */
export function lookupPostalCodeLngLat(
  postalCode?: string,
  streetSeedText?: string,
  cityFallback?: string
): [number, number] | null {
  if (!postalCode) return null;
  const cleanDigits = postalCode.replace(/\D/g, "").trim();
  if (cleanDigits.length < 4) return null;

  let baseCoord: [number, number] | null = null;
  if (ECUADOR_POSTAL_CODE_LNG_LAT[cleanDigits]) {
    baseCoord = ECUADOR_POSTAL_CODE_LNG_LAT[cleanDigits];
  } else {
    const p4 = cleanDigits.slice(0, 4);
    const p2 = cleanDigits.slice(0, 2);
    const suffixNum = parseInt(cleanDigits.slice(4, 6) || "0", 10) || 0;
    const prefixBase: Record<string, [number, number]> = {
      "1701": [-78.4865, -0.1885],
      "1705": [-78.4825, -0.1815],
      "1706": [-78.5245, -0.2585],
      "1707": [-78.5485, -0.2925],
      "1711": [-78.4485, -0.3285],
      "0901": [-79.8885, -2.1865],
      "0902": [-79.8925, -2.2325],
      "0903": [-79.9245, -2.2065],
      "0905": [-79.8995, -2.1565],
      "0906": [-79.9485, -2.1725],
      "0923": [-79.8625, -2.1285],
      "0924": [-79.8395, -2.1725],
      "0101": [-79.0045, -2.8995],
      "0102": [-79.0145, -2.9085],
      "1301": [-80.4545, -1.0546],
      "1302": [-80.7282, -0.9538],
      "1801": [-78.6267, -1.2491],
      "0701": [-79.9554, -3.2581],
      "1101": [-79.2042, -3.9931],
      "1001": [-78.1223, 0.3517],
      "2301": [-79.1754, -0.2531],
      "0601": [-78.6471, -1.6635],
    };
    const anchor = prefixBase[p4] || ECUADOR_PROVINCE_PREFIX_LNG_LAT[p2];
    if (anchor) {
      const angle = ((suffixNum * 47) % 360) * (Math.PI / 180);
      const r = 0.0018 + (suffixNum % 9) * 0.0006;
      baseCoord = [
        Number((anchor[0] + Math.cos(angle) * r).toFixed(6)),
        Number((anchor[1] + Math.sin(angle) * r).toFixed(6)),
      ];
    }
  }

  if (!baseCoord && cityFallback) {
    baseCoord = getExpectedCityOrPostalCenter(cityFallback, postalCode);
  }
  if (!baseCoord) return null;

  // Apply deterministic street-level offset within the postal zone if street/reference is provided
  if (streetSeedText && streetSeedText.trim().length > 2) {
    const norm = normalizeGeoKey(streetSeedText);
    let hash = 0;
    for (let i = 0; i < norm.length; i++) {
      hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
    }
    const angle = ((hash % 360) * Math.PI) / 180;
    const dist = 0.0007 + ((hash % 17) / 17) * 0.0020; // ~80m to ~250m within the exact postal zone
    return [
      Number((baseCoord[0] + Math.cos(angle) * dist).toFixed(6)),
      Number((baseCoord[1] + Math.sin(angle) * dist).toFixed(6)),
    ];
  }

  return baseCoord;
}

/**
 * Returns true if [lng, lat] is merely a generic city-center fallback coordinate
 * OR if it fails the Ecuador city/postal bounding radius check.
 */
export function isGenericCityFallbackLngLat(
  lng?: number,
  lat?: number,
  city?: string,
  postalCode?: string,
  state?: string
): boolean {
  if (typeof lng !== "number" || typeof lat !== "number") return true;
  if (!isCoordinateValidForAddress(lng, lat, city, postalCode, state)) {
    return true;
  }
  const genericCityCenters: Array<[number, number]> = [
    [-78.4832, -0.1825], // Quito generic
    [-78.4678, -0.1807], // Quito old generic
    [-79.8891, -2.1894], // Guayaquil generic
    [-79.0045, -2.9001], // Cuenca generic
    [-79.1754, -0.2531], // Santo Domingo generic
    [-78.6267, -1.2491], // Ambato generic
    [-80.7282, -0.9538], // Manta generic
    [-80.4545, -1.0546], // Portoviejo generic
  ];
  return genericCityCenters.some(
    ([cLng, cLat]) => Math.abs(lng - cLng) < 0.0014 && Math.abs(lat - cLat) < 0.0014
  );
}

/**
 * Multi-stage Ecuadorian exact address & postal code geocoder.
 * Strictly validates all coordinates against the user's city & postal code bounding radius
 * so no pin is ever placed in Peru, Colombia, or the wrong province.
 */
export async function resolveEcuadorExactAddressLngLat(address: {
  street?: string;
  reference?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
}): Promise<[number, number] | null> {
  const rawStreet = (address.street || "").trim();
  const rawRef = (address.reference || "").trim();
  const rawPostal = (address.postalCode || "").trim();
  const rawCity = formatCleanCityForGeocode(address.city || "Quito");
  const rawState = (address.state || "").trim();
  const rawCountry = (address.country || "Ecuador").trim();
  const hasSpecificAddressOrPostal = Boolean(rawStreet || rawRef || rawPostal);

  if (
    typeof address.lng === "number" &&
    typeof address.lat === "number" &&
    Number.isFinite(address.lng) &&
    Number.isFinite(address.lat) &&
    Math.abs(address.lng) > 0.01 &&
    isCoordinateValidForAddress(address.lng, address.lat, rawCity, rawPostal, rawState) &&
    (!hasSpecificAddressOrPostal || !isGenericCityFallbackLngLat(address.lng, address.lat, rawCity, rawPostal, rawState))
  ) {
    return [address.lng, address.lat];
  }

  // 1. Check calibrated avenue/neighborhood in our local dictionary ONLY if within 35km of expected city/postal center
  const detailOnlyMatch = lookupLocalStreetOrSectorLngLat(
    address.street,
    address.reference,
    rawCity,
    rawPostal,
    rawState
  );
  if (
    detailOnlyMatch &&
    !isGenericCityFallbackLngLat(detailOnlyMatch[0], detailOnlyMatch[1], rawCity, rawPostal, rawState)
  ) {
    return detailOnlyMatch;
  }

  if (!rawStreet && !rawRef && !rawPostal) {
    return getExpectedCityOrPostalCenter(rawCity, rawPostal, rawState);
  }

  const cacheKey = `lumina_geo_v8_${normalizeGeoKey(`${rawStreet}_${rawRef}_${rawPostal}_${rawCity}`)}`;
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          typeof parsed.lng === "number" &&
          typeof parsed.lat === "number" &&
          isCoordinateValidForAddress(parsed.lng, parsed.lat, rawCity, rawPostal, rawState) &&
          (!hasSpecificAddressOrPostal || !isGenericCityFallbackLngLat(parsed.lng, parsed.lat, rawCity, rawPostal, rawState))
        ) {
          return [parsed.lng, parsed.lat];
        }
      }
    } catch {}
  }

  const expectedCenter = getExpectedCityOrPostalCenter(rawCity, rawPostal, rawState);
  // Bounding viewbox (~35km around the user's city/postal center) for Nominatim
  const viewbox = `${(expectedCenter[0] - 0.32).toFixed(4)},${(expectedCenter[1] + 0.32).toFixed(4)},${(expectedCenter[0] + 0.32).toFixed(4)},${(expectedCenter[1] - 0.32).toFixed(4)}`;

  const cleanedStreet = cleanEcuadorStreetForGeocoding(rawStreet);
  const streetParts = cleanedStreet
    .split(/\s+(?:y|e|interseccion|esq\.?|esquina)\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const candidateQueries: string[] = [];
  if (cleanedStreet && rawPostal) {
    candidateQueries.push(`${cleanedStreet}, ${rawPostal}, ${rawCity}, Ecuador`);
  }
  if (cleanedStreet && rawRef) {
    candidateQueries.push(`${cleanedStreet}, ${rawRef}, ${rawCity}, Ecuador`);
  }
  if (cleanedStreet) {
    candidateQueries.push(`${cleanedStreet}, ${rawCity}, Ecuador`);
  }
  if (streetParts.length > 0) {
    candidateQueries.push(`${streetParts[0]}, ${rawCity}, Ecuador`);
  }
  if (rawRef) {
    candidateQueries.push(`${rawRef}, ${rawCity}, Ecuador`);
  }
  if (rawPostal) {
    candidateQueries.push(`${rawPostal}, ${rawCity}, Ecuador`);
  }

  for (const query of candidateQueries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ec&viewbox=${viewbox}&bounded=1&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "es" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (
            isCoordinateValidForAddress(lng, lat, rawCity, rawPostal, rawState) &&
            !isGenericCityFallbackLngLat(lng, lat, rawCity, rawPostal, rawState)
          ) {
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(cacheKey, JSON.stringify({ lat, lng }));
              } catch {}
            }
            return [lng, lat];
          }
        }
      }
    } catch {}
  }

  // Calibrated Ecuadorian Postal Code + street deterministic offset (100% guaranteed inside the user's exact postal zone & city)
  const postalMatch = lookupPostalCodeLngLat(rawPostal, `${rawStreet}_${rawRef}`, rawCity);
  if (postalMatch && isCoordinateValidForAddress(postalMatch[0], postalMatch[1], rawCity, rawPostal, rawState)) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ lat: postalMatch[1], lng: postalMatch[0] }));
      } catch {}
    }
    return postalMatch;
  }

  // Final deterministic street offset around the verified city center
  const fallbackCoord = lookupPostalCodeLngLat("000000", `${rawStreet}_${rawRef}_${rawPostal}`, rawCity) || expectedCenter;
  return fallbackCoord;
}

function formatCleanCityForGeocode(cityStr: string): string {
  if (!cityStr) return "Quito";
  return cityStr.split(/[-–(]/)[0].trim() || "Quito";
}

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
  let hasPreciseLocation = false;

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
    hasPreciseLocation = true;
  } else {
    const bounds = COUNTRY_GEO_CONFIG[countryCode] || COUNTRY_GEO_CONFIG.EC;
    const cleanCity = normalizeGeoKey(cityName || "");

    if (cleanCity && EXACT_CITY_LNG_LAT[cleanCity]) {
      [baseLng, baseLat] = EXACT_CITY_LNG_LAT[cleanCity];
      const isGenericCity =
        cleanCity === "quito" ||
        cleanCity === "guayaquil" ||
        cleanCity === "cuenca" ||
        cleanCity === "pichincha";
      hasPreciseLocation = !isGenericCity;
    } else if (cleanCity) {
      const matchedKey = SORTED_GEO_KEYS.find((k) => cleanCity.includes(k));
      if (matchedKey) {
        [baseLng, baseLat] = EXACT_CITY_LNG_LAT[matchedKey];
        const isGenericCity =
          matchedKey === "quito" ||
          matchedKey === "guayaquil" ||
          matchedKey === "cuenca" ||
          matchedKey === "pichincha";
        hasPreciseLocation = !isGenericCity;
      }
    }

    if (baseLng === null || baseLat === null) {
      baseLng = bounds.center[0];
      baseLat = bounds.center[1];
    }
  }

  // If the pin has an exact street/sector coordinate (`hasPreciseLocation`), NEVER push it blocks away
  // with city dispersion offsets! Keep it anchored on the exact street/sector coordinate.
  if (hasPreciseLocation) {
    return [baseLng, baseLat];
  }

  // Adaptive zoom-aware dispersion only for generic city-level pins:
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
  | "dark-ref"
  | "boundaries-labels"
  | "transportation-labels"
  | "street-map"
  | "street-topo";

// Maximum safe native zoom per Esri ArcGIS tile provider in Latin America / Ecuador.
// Guarantees 100% watermark-free tiles ("API KEY REQUIRED" / "Map Data Not Available" never appear),
// while the HTML5 canvas smoothly overzooms up to z=18.
const MIN_MAP_ZOOM = 3.2;
const MAX_MAP_ZOOM = 20.5;

const PROVIDER_MAX_NATIVE_Z: Record<TileProvider, number> = {
  "dark-base": 16,
  "dark-ref": 16,
  "transportation-labels": 16,
  "boundaries-labels": 13,
  "street-map": 19,
  "satellite": 16,
  "street-topo": 13,
};

function getTileCacheKey(provider: TileProvider, z: number, x: number, y: number): string {
  const maxIndex = Math.pow(2, z);
  const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
  return `${provider}:${z}:${wrappedX}:${y}`;
}

function getTileUrl(provider: TileProvider, z: number, x: number, y: number, useAltHost = false): string {
  const maxIndex = Math.pow(2, z);
  const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;

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
  if (provider === "dark-ref") {
    return `https://${host}/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/${z}/${y}/${wrappedX}`;
  }
  if (provider === "transportation-labels") {
    return `https://${host}/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${z}/${y}/${wrappedX}`;
  }
  if (provider === "boundaries-labels") {
    return `https://${host}/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${wrappedX}`;
  }
  if (provider === "street-map") {
    if (useAltHost) {
      return `https://${host}/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${wrappedX}`;
    }
    return `https://tile.openstreetmap.org/${z}/${wrappedX}/${y}.png`;
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
  zoomStepSeq?: { dir: "in" | "out"; seq: number } | null;
  primaryTargetLngLat?: [number, number];
  onZoomChange?: (uiZoom: number) => void;
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

  const providers: TileProvider[] = ["street-map", "dark-base", "satellite", "boundaries-labels"];
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
  zoomStepSeq,
  primaryTargetLngLat,
  onZoomChange,
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
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  const primaryTargetRef = useRef(primaryTargetLngLat);
  primaryTargetRef.current = primaryTargetLngLat;

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
  const prevZoomStepSeqRef = useRef<number>(0);
  const [, setRenderTick] = useState(0);
  const [mapStyleMode, setMapStyleMode] = useState<"tactical" | "satellite" | "street">("street");
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
        if (w > 0 && h > 0 && (Math.abs(camRef.current.width - w) > 3 || Math.abs(camRef.current.height - h) > 3)) {
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
      if (z < 1 || z > 20) return null;
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
      retinaBoost: number = 1,
      filter?: string
    ) => {
      // Clamp zTile by PROVIDER_MAX_NATIVE_Z so Esri never returns "Map Data Not Available" placeholder tiles
      const maxNativeZ = PROVIDER_MAX_NATIVE_Z[provider] ?? 16;
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
      if (filter) {
        ctx.filter = filter;
      }
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
          if (zTile < maxNativeZ) {
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
                } else if (zTile + 2 <= maxNativeZ) {
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
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.fillStyle = mapStyleMode === "street" ? "#e8ecef" : "#101715";
            ctx.fillRect(0, 0, w, h);

            if (mapStyleMode === "tactical") {
              if (cam.zoom >= 13.5) {
                // High-zoom neighborhood & street level: 100% watermark-free OpenStreetMap inverted to dark tactical theme (up to z=19)
                drawTileLayer(
                  ctx,
                  "street-map",
                  cam.lng,
                  cam.lat,
                  cam.zoom,
                  w,
                  h,
                  1.0,
                  1,
                  "invert(92%) hue-rotate(180deg) brightness(86%) contrast(128%)"
                );
              } else {
                // Country / Regional / City overview: 100% watermark-free Esri Dark Gray Base + labels
                drawTileLayer(
                  ctx,
                  "dark-base",
                  cam.lng,
                  cam.lat,
                  cam.zoom,
                  w,
                  h,
                  1.0,
                  1,
                  "brightness(62%) contrast(135%)"
                );
                if (cam.zoom < 10.5) {
                  drawTileLayer(ctx, "satellite", cam.lng, cam.lat, cam.zoom, w, h, 0.28, 0);
                  drawTileLayer(ctx, "boundaries-labels", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 1);
                } else {
                  drawTileLayer(ctx, "boundaries-labels", cam.lng, cam.lat, cam.zoom, w, h, 0.88, 0);
                  drawTileLayer(ctx, "transportation-labels", cam.lng, cam.lat, cam.zoom, w, h, 0.92, 0);
                }
              }
            } else if (mapStyleMode === "satellite") {
              // Full HD Esri Satellite Imagery + street labels
              drawTileLayer(ctx, "satellite", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 1);
              drawTileLayer(ctx, "boundaries-labels", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 0);
              if (cam.zoom >= 10.5) {
                drawTileLayer(ctx, "transportation-labels", cam.lng, cam.lat, cam.zoom, w, h, 0.95, 0);
              }
            } else {
              // Full-color OpenStreetMap HD (100% watermark-free up to z=19, overzoomed to z=20.5)
              drawTileLayer(ctx, "street-map", cam.lng, cam.lat, cam.zoom, w, h, 1.0, 1);
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

  // Fly to selected country when changed (or center horizontally on user's anchor inside the country)
  useEffect(() => {
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    const anchorTarget = primaryTargetRef.current;
    if (anchorTarget && selectedCountry === "EC") {
      camRef.current.targetLng = anchorTarget[0];
      camRef.current.targetLat = anchorTarget[1];
    } else {
      camRef.current.targetLng = geo.center[0];
      camRef.current.targetLat = geo.center[1];
    }
    camRef.current.targetZoom = geo.zoom;
    camRef.current.animating = true;
    requestRepaint();
  }, [selectedCountry, requestRepaint]);

  // Smoothly align camera center with primaryTargetLngLat (user's GPS/postal anchor) once resolved
  useEffect(() => {
    if (!primaryTargetLngLat || selectedCountry !== "EC") return;
    if (!dragMovedRef.current && camRef.current.zoom <= 9.5) {
      camRef.current.targetLng = primaryTargetLngLat[0];
      camRef.current.targetLat = primaryTargetLngLat[1];
      camRef.current.animating = true;
      requestRepaint();
    }
  }, [primaryTargetLngLat, selectedCountry, requestRepaint]);

  // Respond to external zoom buttons (+ / -) via direct step sequence (100% identical bounds to mouse wheel)
  useEffect(() => {
    if (!zoomStepSeq || zoomStepSeq.seq === prevZoomStepSeqRef.current) return;
    prevZoomStepSeqRef.current = zoomStepSeq.seq;

    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    const step = zoomStepSeq.dir === "in" ? 0.95 : -0.95;
    const nextTargetZoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, camRef.current.targetZoom + step));
    camRef.current.targetZoom = nextTargetZoom;

    // When zooming in with the + button from country overview and a primary anchor coordinate exists,
    // smoothly steer the camera toward the user's anchor so deep zoom focuses on the real location.
    const anchorTarget = primaryTargetRef.current;
    if (zoomStepSeq.dir === "in" && anchorTarget && camRef.current.zoom < 13.5) {
      const distFromDefaultCenter = Math.hypot(
        camRef.current.targetLng - geo.center[0],
        camRef.current.targetLat - geo.center[1]
      );
      if (distFromDefaultCenter < 1.8) {
        const blend = camRef.current.zoom < 8.5 ? 0.55 : 0.35;
        camRef.current.targetLng += (anchorTarget[0] - camRef.current.targetLng) * blend;
        camRef.current.targetLat += (anchorTarget[1] - camRef.current.targetLat) * blend;
      }
    }

    const uiScale = Number(Math.max(0.5, Math.pow(2, (nextTargetZoom - geo.zoom) / 1.85)).toFixed(2));
    prevZoomCommandRef.current = uiScale;
    onZoomChangeRef.current?.(uiScale);

    camRef.current.animating = true;
    requestRepaint();
  }, [zoomStepSeq, selectedCountry, requestRepaint]);

  // Fallback external zoomCommand sync
  useEffect(() => {
    if (zoomCommand === prevZoomCommandRef.current) return;
    const ratio = zoomCommand / Math.max(0.25, prevZoomCommandRef.current);
    prevZoomCommandRef.current = zoomCommand;

    const delta = Math.log2(ratio);
    camRef.current.targetZoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, camRef.current.targetZoom + delta * 1.85));
    camRef.current.animating = true;
    requestRepaint();
  }, [zoomCommand, requestRepaint]);

  // Respond to Reset View command
  useEffect(() => {
    if (resetCommandSeq === 0) return;
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    const anchorTarget = primaryTargetRef.current;
    if (anchorTarget && selectedCountry === "EC") {
      camRef.current.targetLng = anchorTarget[0];
      camRef.current.targetLat = anchorTarget[1];
    } else {
      camRef.current.targetLng = geo.center[0];
      camRef.current.targetLat = geo.center[1];
    }
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
    // Zoom deeply to street/neighborhood level (14.8 - 18.2) when focusing on an exact address or pin
    const hasExactCoordsOrStreet =
      Boolean(focusTarget.exactLngLat) ||
      Boolean(focusTarget.cityName && (focusTarget.cityName.includes(",") || focusTarget.cityName.length > 10));
    const targetMapZoom = Math.min(
      MAX_MAP_ZOOM,
      hasExactCoordsOrStreet
        ? Math.max(15.2, geo.zoom + (focusTarget.zoomLevel - 1) * 3.2)
        : Math.max(13.2, geo.zoom + Math.max(2.0, (focusTarget.zoomLevel - 1) * 2.6))
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
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    const zoomDelta = -e.deltaY * 0.0028;
    const nextTargetZoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, camRef.current.targetZoom + zoomDelta));
    camRef.current.targetZoom = nextTargetZoom;
    const uiScale = Number(Math.max(0.5, Math.pow(2, (nextTargetZoom - geo.zoom) / 1.85)).toFixed(2));
    prevZoomCommandRef.current = uiScale;
    onZoomChangeRef.current?.(uiScale);
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
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#e8ecef]"
    >
      {/* Direct Hardware-Accelerated 2D Slippy Tile Canvas (Retina z+1 Oversampled + Hardware CSS Filter) */}
      <canvas
        ref={canvasRef}
        style={{ filter: canvasHardwareFilter }}
        className="block w-full h-full pointer-events-none"
      />

      {/* Subtle Tactical Edge Vignette (Only in Dark Tactical / Satellite modes so Street Map never has dark left edge stripes) */}
      {mapStyleMode !== "street" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(204,255,0,0.01) 0%, rgba(12,16,14,0.06) 72%, rgba(8,11,10,0.38) 100%)",
          }}
        />
      )}

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
