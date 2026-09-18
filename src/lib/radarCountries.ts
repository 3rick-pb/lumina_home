/**
 * Geo-spatial Multi-Country Configuration & Coordinate System for Lumina Radar
 * Supports 6 countries: Ecuador (EC), Colombia (CO), Argentina (AR), Perú (PE), México (MX), Chile (CL)
 */

export type RadarCountryCode = 'EC' | 'CO' | 'AR' | 'PE' | 'MX' | 'CL';

export interface RadarCountryMeta {
  code: RadarCountryCode;
  name: string;
  flag: string;
  aspectRatioClass: string; // Tailwind aspect class
  aspectRatioValue: number; // width / height
  width: number;
  height: number;
  entityLabel: string; // e.g. "24 Provincias"
  totalEntities: number;
  mapWebp: string;
  mapPng: string;
  currency: string;
  currencySymbol: string;
  capital: string;
  majorCities: string[];
  naturalRegions: Array<{ name: string; icon: string; query: string }>;
}

export const RADAR_COUNTRIES: Record<RadarCountryCode, RadarCountryMeta> = {
  EC: {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    aspectRatioClass: 'aspect-[2880/1919]',
    aspectRatioValue: 2880 / 1919,
    width: 2880,
    height: 1919,
    entityLabel: '24 Provincias',
    totalEntities: 24,
    mapWebp: '/images/map_ecuador_cutout.webp',
    mapPng: '/images/map_ecuador_cutout.png',
    currency: 'USD',
    currencySymbol: '$',
    capital: 'Quito',
    majorCities: ['Quito', 'Guayaquil', 'Cuenca', 'Manta', 'Ambato', 'Loja', 'Santo Domingo', 'Portoviejo'],
    naturalRegions: [
      { name: "Sierra", icon: "🏔️", query: "Sierra" },
      { name: "Costa", icon: "🌊", query: "Costa" },
      { name: "Amazonía", icon: "🌿", query: "Oriente" },
      { name: "Galápagos", icon: "🐢", query: "Galápagos" },
    ],
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    aspectRatioClass: 'aspect-[2880/1918]',
    aspectRatioValue: 2880 / 1918,
    width: 2880,
    height: 1918,
    entityLabel: '32 Departamentos + D.C.',
    totalEntities: 33,
    mapWebp: '/images/map_colombia_cutout.webp',
    mapPng: '/images/map_colombia_cutout.png',
    currency: 'COP',
    currencySymbol: '$',
    capital: 'Bogotá',
    majorCities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Santa Marta'],
    naturalRegions: [
      { name: "Andina", icon: "🏔️", query: "Andina" },
      { name: "Caribe", icon: "🌊", query: "Caribe" },
      { name: "Pacífico", icon: "🌴", query: "Pacífico" },
      { name: "Orinoquía", icon: "🌾", query: "Llanos" },
      { name: "Amazonía", icon: "🌿", query: "Amazonas" },
    ],
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    aspectRatioClass: 'aspect-[2422/2880]',
    aspectRatioValue: 2422 / 2880,
    width: 2422,
    height: 2880,
    entityLabel: '23 Provincias + CABA',
    totalEntities: 24,
    mapWebp: '/images/map_argentina_cutout.webp',
    mapPng: '/images/map_argentina_cutout.png',
    currency: 'ARS',
    currencySymbol: '$',
    capital: 'Buenos Aires',
    majorCities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Tucumán', 'Mar del Plata', 'Salta'],
    naturalRegions: [
      { name: "Pampa", icon: "🌾", query: "Buenos Aires" },
      { name: "Patagonia", icon: "❄️", query: "Patagonia" },
      { name: "Cuyo", icon: "🍇", query: "Mendoza" },
      { name: "Noroeste", icon: "🏜️", query: "Salta" },
      { name: "Litoral", icon: "🌊", query: "Litoral" },
    ],
  },
  PE: {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    aspectRatioClass: 'aspect-[2880/2666]',
    aspectRatioValue: 2880 / 2666,
    width: 2880,
    height: 2666,
    entityLabel: '24 Departamentos + Callao',
    totalEntities: 25,
    mapWebp: '/images/map_peru_cutout.webp',
    mapPng: '/images/map_peru_cutout.png',
    currency: 'PEN',
    currencySymbol: 'S/',
    capital: 'Lima',
    majorCities: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Cusco', 'Huancayo', 'Iquitos'],
    naturalRegions: [
      { name: "Costa", icon: "🌊", query: "Lima" },
      { name: "Sierra", icon: "🏔️", query: "Cusco" },
      { name: "Selva", icon: "🌿", query: "Iquitos" },
    ],
  },
  MX: {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    aspectRatioClass: 'aspect-[2880/1676]',
    aspectRatioValue: 2880 / 1676,
    width: 2880,
    height: 1676,
    entityLabel: '32 Entidades Federativas',
    totalEntities: 32,
    mapWebp: '/images/map_mexico_cutout.webp',
    mapPng: '/images/map_mexico_cutout.png',
    currency: 'MXN',
    currencySymbol: '$',
    capital: 'Ciudad de México',
    majorCities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Querétaro', 'Cancún'],
    naturalRegions: [
      { name: "Centro", icon: "🏛️", query: "CDMX" },
      { name: "Norte", icon: "🏜️", query: "Monterrey" },
      { name: "Occidente", icon: "🌺", query: "Jalisco" },
      { name: "Sur / Golfo", icon: "🌴", query: "Veracruz" },
      { name: "Península", icon: "🏝️", query: "Cancún" },
    ],
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    aspectRatioClass: 'aspect-[2880/2652]',
    aspectRatioValue: 2880 / 2652,
    width: 2880,
    height: 2652,
    entityLabel: '16 Regiones',
    totalEntities: 16,
    mapWebp: '/images/map_chile_cutout.webp',
    mapPng: '/images/map_chile_cutout.png',
    currency: 'CLP',
    currencySymbol: '$',
    capital: 'Santiago',
    majorCities: ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'La Serena', 'Temuco', 'Puerto Montt', 'Iquique'],
    naturalRegions: [
      { name: "Centro", icon: "🏙️", query: "Santiago" },
      { name: "Norte", icon: "🏜️", query: "Antofagasta" },
      { name: "Sur", icon: "🌲", query: "Temuco" },
      { name: "Austral", icon: "❄️", query: "Magallanes" },
    ],
  },
};

// ── Geographic Coordinates Dictionaries per Country (percentages 0-100) ──

export const COUNTRY_CITY_COORDINATES: Record<RadarCountryCode, Record<string, { x: number; y: number }>> = {
  // ECUADOR
  EC: {
    "quito": { x: 48.8, y: 26.5 },
    "pichincha": { x: 48.8, y: 26.5 },
    "cuenca": { x: 40.5, y: 67.5 },
    "azuay": { x: 40.5, y: 67.5 },
    "ambato": { x: 50.5, y: 41.5 },
    "tungurahua": { x: 50.5, y: 41.5 },
    "latacunga": { x: 49.5, y: 35.0 },
    "cotopaxi": { x: 49.5, y: 35.0 },
    "riobamba": { x: 50.0, y: 49.0 },
    "chimborazo": { x: 50.0, y: 49.0 },
    "loja": { x: 37.5, y: 82.5 },
    "ibarra": { x: 55.0, y: 17.5 },
    "imbabura": { x: 55.0, y: 17.5 },
    "tulcan": { x: 60.5, y: 12.0 },
    "carchi": { x: 60.5, y: 12.0 },
    "azogues": { x: 42.0, y: 63.5 },
    "cañar": { x: 42.0, y: 63.5 },
    "guaranda": { x: 45.0, y: 47.0 },
    "bolivar": { x: 45.0, y: 47.0 },
    "guayaquil": { x: 35.5, y: 52.0 },
    "guayas": { x: 35.5, y: 52.0 },
    "manta": { x: 21.0, y: 39.5 },
    "portoviejo": { x: 24.5, y: 41.0 },
    "manabi": { x: 24.5, y: 41.0 },
    "santo domingo": { x: 41.0, y: 29.5 },
    "machala": { x: 27.5, y: 69.5 },
    "el oro": { x: 27.5, y: 69.5 },
    "esmeraldas": { x: 38.0, y: 12.0 },
    "santa elena": { x: 25.0, y: 50.0 },
    "salinas": { x: 24.4, y: 50.5 },
    "babahoyo": { x: 34.0, y: 49.0 },
    "los rios": { x: 34.0, y: 49.0 },
    "galapagos": { x: 10.0, y: 22.0 },
    "baquerizo moreno": { x: 10.0, y: 22.0 },
    "santa cruz": { x: 10.0, y: 22.0 },
    "nueva loja": { x: 75.0, y: 22.0 },
    "lago agrio": { x: 75.0, y: 22.0 },
    "sucumbios": { x: 75.0, y: 22.0 },
    "coca": { x: 73.0, y: 34.0 },
    "orellana": { x: 73.0, y: 34.0 },
    "tena": { x: 62.0, y: 39.0 },
    "napo": { x: 62.0, y: 39.0 },
    "puyo": { x: 63.0, y: 49.0 },
    "pastaza": { x: 63.0, y: 49.0 },
    "macas": { x: 58.0, y: 56.0 },
    "morona santiago": { x: 58.0, y: 56.0 },
    "zamora": { x: 48.0, y: 83.0 },
    "zamora chinchipe": { x: 48.0, y: 83.0 },
  },

  // COLOMBIA
  CO: {
    "bogota": { x: 46.0, y: 52.0 },
    "cundinamarca": { x: 46.0, y: 52.0 },
    "medellin": { x: 38.0, y: 41.5 },
    "antioquia": { x: 38.0, y: 41.5 },
    "cali": { x: 34.0, y: 58.0 },
    "valle del cauca": { x: 34.0, y: 58.0 },
    "valle": { x: 34.0, y: 58.0 },
    "barranquilla": { x: 43.0, y: 15.0 },
    "atlantico": { x: 43.0, y: 15.0 },
    "cartagena": { x: 39.0, y: 18.0 },
    "bolivar": { x: 39.0, y: 18.0 },
    "bucaramanga": { x: 49.0, y: 37.0 },
    "santander": { x: 49.0, y: 37.0 },
    "pereira": { x: 37.5, y: 49.0 },
    "risaralda": { x: 37.5, y: 49.0 },
    "manizales": { x: 39.0, y: 47.0 },
    "caldas": { x: 39.0, y: 47.0 },
    "armenia": { x: 38.0, y: 51.0 },
    "quindio": { x: 38.0, y: 51.0 },
    "santa marta": { x: 46.5, y: 13.5 },
    "magdalena": { x: 46.5, y: 13.5 },
    "cucuta": { x: 54.0, y: 30.0 },
    "norte de santander": { x: 54.0, y: 30.0 },
    "ibague": { x: 41.0, y: 53.0 },
    "tolima": { x: 41.0, y: 53.0 },
    "villavicencio": { x: 50.0, y: 57.0 },
    "meta": { x: 50.0, y: 57.0 },
    "pasto": { x: 30.0, y: 77.0 },
    "nariño": { x: 30.0, y: 77.0 },
    "popayan": { x: 33.0, y: 67.0 },
    "cauca": { x: 33.0, y: 67.0 },
    "neiva": { x: 39.0, y: 62.0 },
    "huila": { x: 39.0, y: 62.0 },
    "monteria": { x: 35.5, y: 25.0 },
    "cordoba": { x: 35.5, y: 25.0 },
    "valledupar": { x: 50.0, y: 16.0 },
    "cesar": { x: 50.0, y: 16.0 },
    "sincelejo": { x: 38.0, y: 22.0 },
    "sucre": { x: 38.0, y: 22.0 },
    "tunja": { x: 49.0, y: 48.0 },
    "boyaca": { x: 49.0, y: 48.0 },
    "quibdo": { x: 31.0, y: 42.0 },
    "choco": { x: 31.0, y: 42.0 },
    "riohacha": { x: 54.0, y: 10.0 },
    "la guajira": { x: 54.0, y: 10.0 },
    "florencia": { x: 43.0, y: 71.0 },
    "caqueta": { x: 43.0, y: 71.0 },
    "yopal": { x: 56.0, y: 48.0 },
    "casanare": { x: 56.0, y: 48.0 },
    "arauca": { x: 63.0, y: 38.0 },
    "mocoa": { x: 36.0, y: 78.0 },
    "putumayo": { x: 36.0, y: 78.0 },
    "san andres": { x: 23.0, y: 10.0 },
    "providencia": { x: 23.0, y: 10.0 },
    "leticia": { x: 68.0, y: 94.0 },
    "amazonas": { x: 68.0, y: 94.0 },
  },

  // ARGENTINA
  AR: {
    "buenos aires": { x: 72.0, y: 41.5 },
    "caba": { x: 72.0, y: 41.5 },
    "capital federal": { x: 72.0, y: 41.5 },
    "la plata": { x: 74.0, y: 43.0 },
    "mar del plata": { x: 73.0, y: 50.0 },
    "bahia blanca": { x: 60.0, y: 53.0 },
    "rosario": { x: 66.0, y: 37.5 },
    "santa fe": { x: 66.0, y: 34.0 },
    "cordoba": { x: 54.0, y: 33.0 },
    "mendoza": { x: 39.0, y: 42.0 },
    "san juan": { x: 39.0, y: 36.0 },
    "san luis": { x: 46.0, y: 42.0 },
    "tucuman": { x: 49.0, y: 20.0 },
    "san miguel de tucuman": { x: 49.0, y: 20.0 },
    "salta": { x: 46.0, y: 14.0 },
    "jujuy": { x: 46.0, y: 10.0 },
    "san salvador de jujuy": { x: 46.0, y: 10.0 },
    "santiago del estero": { x: 54.0, y: 23.0 },
    "corrientes": { x: 72.0, y: 24.0 },
    "resistencia": { x: 70.0, y: 23.0 },
    "chaco": { x: 70.0, y: 23.0 },
    "posadas": { x: 82.0, y: 21.0 },
    "misiones": { x: 82.0, y: 21.0 },
    "formosa": { x: 68.0, y: 16.0 },
    "parana": { x: 67.0, y: 34.0 },
    "entre rios": { x: 67.0, y: 34.0 },
    "neuquen": { x: 42.0, y: 58.0 },
    "bariloche": { x: 34.0, y: 68.0 },
    "san carlos de bariloche": { x: 34.0, y: 68.0 },
    "rio negro": { x: 44.0, y: 64.0 },
    "viedma": { x: 55.0, y: 62.0 },
    "santa rosa": { x: 52.0, y: 47.0 },
    "la pampa": { x: 52.0, y: 47.0 },
    "chubut": { x: 42.0, y: 73.0 },
    "rawson": { x: 48.0, y: 70.0 },
    "comodoro rivadavia": { x: 44.0, y: 75.0 },
    "rio gallegos": { x: 38.0, y: 88.0 },
    "santa cruz": { x: 38.0, y: 84.0 },
    "el calafate": { x: 33.0, y: 86.0 },
    "ushuaia": { x: 46.0, y: 95.0 },
    "tierra del fuego": { x: 46.0, y: 95.0 },
    "malvinas": { x: 70.0, y: 85.0 },
    "islas malvinas": { x: 70.0, y: 85.0 },
  },

  // PERÚ
  PE: {
    "lima": { x: 36.0, y: 62.5 },
    "callao": { x: 34.0, y: 61.5 },
    "arequipa": { x: 58.0, y: 82.0 },
    "trujillo": { x: 24.0, y: 41.0 },
    "la libertad": { x: 24.0, y: 41.0 },
    "chiclayo": { x: 19.0, y: 34.0 },
    "lambayeque": { x: 19.0, y: 34.0 },
    "piura": { x: 15.0, y: 26.0 },
    "tumbes": { x: 13.0, y: 18.0 },
    "cusco": { x: 62.0, y: 71.0 },
    "cuzco": { x: 62.0, y: 71.0 },
    "huancayo": { x: 45.0, y: 60.0 },
    "junin": { x: 45.0, y: 60.0 },
    "iquitos": { x: 57.0, y: 22.0 },
    "loreto": { x: 57.0, y: 22.0 },
    "tarapoto": { x: 39.0, y: 33.0 },
    "san martin": { x: 39.0, y: 33.0 },
    "pucallpa": { x: 55.0, y: 48.0 },
    "ucayali": { x: 55.0, y: 48.0 },
    "tacna": { x: 66.0, y: 89.0 },
    "puno": { x: 69.0, y: 82.0 },
    "juliaca": { x: 68.0, y: 80.0 },
    "ayacucho": { x: 50.0, y: 67.0 },
    "ica": { x: 41.0, y: 69.0 },
    "chincha": { x: 39.0, y: 66.0 },
    "cajamarca": { x: 25.0, y: 32.0 },
    "huaraz": { x: 30.0, y: 49.0 },
    "ancash": { x: 30.0, y: 49.0 },
    "chimbote": { x: 26.0, y: 45.0 },
    "huanuco": { x: 39.0, y: 52.0 },
    "pasco": { x: 42.0, y: 55.0 },
    "cerro de pasco": { x: 42.0, y: 55.0 },
    "moquegua": { x: 63.0, y: 86.0 },
    "puerto maldonado": { x: 76.0, y: 66.0 },
    "madre de dios": { x: 76.0, y: 66.0 },
    "abancay": { x: 55.0, y: 70.0 },
    "apurimac": { x: 55.0, y: 70.0 },
    "huancavelica": { x: 45.0, y: 64.0 },
    "chachapoyas": { x: 30.0, y: 28.0 },
    "amazonas": { x: 30.0, y: 28.0 },
  },

  // MÉXICO
  MX: {
    "ciudad de mexico": { x: 58.0, y: 67.5 },
    "cdmx": { x: 58.0, y: 67.5 },
    "df": { x: 58.0, y: 67.5 },
    "mexico": { x: 58.0, y: 67.5 },
    "estado de mexico": { x: 56.5, y: 67.0 },
    "edomex": { x: 56.5, y: 67.0 },
    "toluca": { x: 56.0, y: 67.5 },
    "guadalajara": { x: 44.0, y: 63.0 },
    "jalisco": { x: 44.0, y: 63.0 },
    "zapopan": { x: 44.0, y: 62.5 },
    "monterrey": { x: 54.0, y: 37.0 },
    "nuevo leon": { x: 54.0, y: 37.0 },
    "puebla": { x: 61.0, y: 69.0 },
    "tijuana": { x: 9.0, y: 8.5 },
    "baja california": { x: 9.0, y: 8.5 },
    "mexicali": { x: 12.0, y: 10.0 },
    "la paz": { x: 23.0, y: 48.0 },
    "los cabos": { x: 25.0, y: 52.0 },
    "baja california sur": { x: 23.0, y: 48.0 },
    "leon": { x: 49.0, y: 58.0 },
    "guanajuato": { x: 49.0, y: 58.0 },
    "queretaro": { x: 53.0, y: 61.5 },
    "cancun": { x: 94.0, y: 58.5 },
    "playa del carmen": { x: 93.0, y: 60.5 },
    "quintana roo": { x: 93.0, y: 60.5 },
    "merida": { x: 88.0, y: 60.0 },
    "yucatan": { x: 88.0, y: 60.0 },
    "san luis potosi": { x: 51.0, y: 52.0 },
    "aguascalientes": { x: 47.0, y: 56.0 },
    "morelia": { x: 48.0, y: 66.0 },
    "michoacan": { x: 48.0, y: 66.0 },
    "cuernavaca": { x: 58.0, y: 70.0 },
    "morelos": { x: 58.0, y: 70.0 },
    "veracruz": { x: 68.0, y: 67.0 },
    "xalapa": { x: 66.0, y: 66.0 },
    "oaxaca": { x: 66.0, y: 78.0 },
    "tuxtla gutierrez": { x: 76.0, y: 81.0 },
    "chiapas": { x: 76.0, y: 81.0 },
    "villahermosa": { x: 76.0, y: 74.0 },
    "tabasco": { x: 76.0, y: 74.0 },
    "hermosillo": { x: 21.0, y: 22.0 },
    "sonora": { x: 21.0, y: 22.0 },
    "chihuahua": { x: 34.0, y: 24.0 },
    "ciudad juarez": { x: 36.0, y: 13.0 },
    "culiacan": { x: 32.0, y: 44.0 },
    "sinaloa": { x: 32.0, y: 44.0 },
    "mazatlan": { x: 36.0, y: 50.0 },
    "durango": { x: 40.0, y: 44.0 },
    "saltillo": { x: 52.0, y: 37.0 },
    "coahuila": { x: 52.0, y: 37.0 },
    "torreon": { x: 46.0, y: 38.0 },
    "pachuca": { x: 59.0, y: 64.0 },
    "hidalgo": { x: 59.0, y: 64.0 },
    "tlaxcala": { x: 60.0, y: 67.0 },
    "acapulco": { x: 54.0, y: 78.0 },
    "guerrero": { x: 54.0, y: 78.0 },
    "tampico": { x: 61.0, y: 51.0 },
    "tamaulipas": { x: 59.0, y: 43.0 },
    "reynosa": { x: 58.0, y: 34.0 },
    "campeche": { x: 84.0, y: 68.0 },
    "zacatecas": { x: 46.0, y: 49.0 },
    "tepic": { x: 40.0, y: 59.0 },
    "nayarit": { x: 40.0, y: 59.0 },
    "colima": { x: 41.0, y: 68.0 },
    "manzanillo": { x: 40.0, y: 69.0 },
  },

  // CHILE
  CL: {
    "santiago": { x: 37.5, y: 37.5 },
    "metropolitana": { x: 37.5, y: 37.5 },
    "region metropolitana": { x: 37.5, y: 37.5 },
    "valparaiso": { x: 35.0, y: 36.0 },
    "viña del mar": { x: 35.5, y: 36.5 },
    "viña": { x: 35.5, y: 36.5 },
    "concepcion": { x: 41.5, y: 48.0 },
    "biobio": { x: 41.5, y: 48.0 },
    "antofagasta": { x: 24.0, y: 16.0 },
    "la serena": { x: 33.0, y: 31.0 },
    "coquimbo": { x: 32.5, y: 31.5 },
    "temuco": { x: 45.0, y: 54.0 },
    "araucania": { x: 45.0, y: 54.0 },
    "puerto montt": { x: 47.0, y: 62.0 },
    "los lagos": { x: 47.0, y: 62.0 },
    "iquique": { x: 18.0, y: 10.0 },
    "tarapaca": { x: 18.0, y: 10.0 },
    "arica": { x: 14.0, y: 4.0 },
    "arica y parinacota": { x: 14.0, y: 4.0 },
    "calama": { x: 26.0, y: 14.0 },
    "copiapo": { x: 29.0, y: 24.0 },
    "atacama": { x: 29.0, y: 24.0 },
    "rancagua": { x: 38.0, y: 40.0 },
    "o'higgins": { x: 38.0, y: 40.0 },
    "talca": { x: 40.0, y: 43.0 },
    "maule": { x: 40.0, y: 43.0 },
    "chillan": { x: 42.0, y: 46.0 },
    "ñuble": { x: 42.0, y: 46.0 },
    "los angeles": { x: 43.0, y: 49.0 },
    "valdivia": { x: 46.0, y: 58.0 },
    "los rios": { x: 46.0, y: 58.0 },
    "osorno": { x: 47.0, y: 60.0 },
    "castro": { x: 46.0, y: 65.0 },
    "chiloe": { x: 46.0, y: 65.0 },
    "coyhaique": { x: 53.0, y: 74.0 },
    "aysen": { x: 53.0, y: 74.0 },
    "punta arenas": { x: 76.0, y: 90.0 },
    "puerto natales": { x: 71.0, y: 86.0 },
    "magallanes": { x: 76.0, y: 90.0 },
  },
};

/**
 * Normalizes city and department strings
 */
function cleanSearchTerm(term?: string): string {
  if (!term) return '';
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Resolves map coordinates { x, y } in percentages (0-100) for a given city and country
 */
export function resolveMultiCountryCoordinates(
  city?: string,
  countryCode: RadarCountryCode = 'EC'
): { x: number; y: number } {
  if (!city || !city.trim()) return { x: -100, y: -100 };

  const clean = cleanSearchTerm(city);
  const countryDict = COUNTRY_CITY_COORDINATES[countryCode] || COUNTRY_CITY_COORDINATES.EC;

  // Direct match
  if (countryDict[clean]) {
    return countryDict[clean];
  }

  // Partial match
  for (const key of Object.keys(countryDict)) {
    const cleanKey = cleanSearchTerm(key);
    if (clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return countryDict[key];
    }
  }

  // Fallback: If city is not found, place in capital city
  const capitalKey = cleanSearchTerm(RADAR_COUNTRIES[countryCode]?.capital || 'quito');
  if (countryDict[capitalKey]) {
    return countryDict[capitalKey];
  }

  return { x: -100, y: -100 };
}

export interface SampleClientSeed {
  name: string;
  city: string;
  spent: number;
  orders: number;
  section: string;
  hasCart: boolean;
  score: number;
}

const SAMPLE_CLIENTS_BY_COUNTRY: Record<RadarCountryCode, SampleClientSeed[]> = {
  EC: [
    { name: 'Alejandro Morales', city: 'Quito', spent: 340, orders: 4, section: 'Catálogo Iluminación', hasCart: true, score: 88 },
    { name: 'Valeria Cifuentes', city: 'Guayaquil', spent: 520, orders: 7, section: 'Carrito de Compras', hasCart: true, score: 94 },
    { name: 'Mateo Delgado', city: 'Cuenca', spent: 180, orders: 2, section: 'Aromaterapia', hasCart: false, score: 72 },
    { name: 'Camila Villavicencio', city: 'Manta', spent: 210, orders: 3, section: 'Colección Cerámica', hasCart: true, score: 85 },
    { name: 'Sebastián Noboa', city: 'Ambato', spent: 95, orders: 1, section: 'Home Office', hasCart: false, score: 65 },
    { name: 'Daniela Salazar', city: 'Loja', spent: 410, orders: 5, section: 'Detalle de Producto', hasCart: false, score: 78 },
  ],
  CO: [
    { name: 'Santiago Restrepo', city: 'Bogotá', spent: 480, orders: 5, section: 'Catálogo de Lujo', hasCart: true, score: 92 },
    { name: 'Mariana Henao', city: 'Medellín', spent: 620, orders: 8, section: 'Carrito Activo', hasCart: true, score: 96 },
    { name: 'Camilo Ospina', city: 'Cali', spent: 290, orders: 3, section: 'Aromaterapia & Velas', hasCart: false, score: 75 },
    { name: 'Laura Char', city: 'Barranquilla', spent: 510, orders: 6, section: 'Checkout Pasarela', hasCart: true, score: 94 },
    { name: 'Felipe Santodomingo', city: 'Cartagena', spent: 380, orders: 4, section: 'Decoración Exclusiva', hasCart: false, score: 80 },
    { name: 'Paula Mantilla', city: 'Bucaramanga', spent: 170, orders: 2, section: 'Home Office', hasCart: true, score: 79 },
    { name: 'Nicolás Jaramillo', city: 'Pereira', spent: 230, orders: 3, section: 'Colección Café', hasCart: false, score: 71 },
  ],
  AR: [
    { name: 'Martín Palermo', city: 'Buenos Aires', spent: 780, orders: 9, section: 'Colección Minimalista', hasCart: true, score: 97 },
    { name: 'Florencia de la Torre', city: 'Córdoba', spent: 410, orders: 5, section: 'Carrito de Compras', hasCart: true, score: 89 },
    { name: 'Joaquín Caputto', city: 'Rosario', spent: 310, orders: 4, section: 'Iluminación Escandinava', hasCart: false, score: 76 },
    { name: 'Lucía Zuccardi', city: 'Mendoza', spent: 540, orders: 6, section: 'Boutique Premium', hasCart: true, score: 93 },
    { name: 'Ignacio Riquelme', city: 'La Plata', spent: 195, orders: 2, section: 'Detalle Lámparas', hasCart: false, score: 68 },
    { name: 'Agustina Bariloche', city: 'Bariloche', spent: 340, orders: 3, section: 'Textiles Nórdicos', hasCart: true, score: 82 },
    { name: 'Federico Uriburu', city: 'Salta', spent: 220, orders: 2, section: 'Cerámica de Autor', hasCart: false, score: 70 },
  ],
  PE: [
    { name: 'Rodrigo Miro Quesada', city: 'Lima', spent: 650, orders: 7, section: 'Colección Principal', hasCart: true, score: 95 },
    { name: 'Ximena Benavides', city: 'Arequipa', spent: 420, orders: 5, section: 'Aromas del Valle', hasCart: true, score: 88 },
    { name: 'Diego Larco', city: 'Trujillo', spent: 280, orders: 3, section: 'Carrito en Proceso', hasCart: true, score: 84 },
    { name: 'Valeria Cúneo', city: 'Cusco', spent: 490, orders: 6, section: 'Textiles Andinos', hasCart: false, score: 81 },
    { name: 'Carlos Brescia', city: 'Chiclayo', spent: 180, orders: 2, section: 'Home Office', hasCart: false, score: 66 },
    { name: 'Fiorella Romero', city: 'Piura', spent: 310, orders: 3, section: 'Iluminación Cálida', hasCart: true, score: 80 },
  ],
  MX: [
    { name: 'Emiliano Garza Sada', city: 'Monterrey', spent: 890, orders: 11, section: 'Boutique VIP', hasCart: true, score: 98 },
    { name: 'Regina Slim Domit', city: 'Ciudad de México', spent: 750, orders: 9, section: 'Carrito de Compras', hasCart: true, score: 96 },
    { name: 'Mauricio Leaño', city: 'Guadalajara', spent: 510, orders: 6, section: 'Cerámica & Diseño', hasCart: false, score: 85 },
    { name: 'Sofía Aspe', city: 'Puebla', spent: 340, orders: 4, section: 'Lámparas Esculturales', hasCart: true, score: 82 },
    { name: 'Andrés Hank', city: 'Tijuana', spent: 290, orders: 3, section: 'Home Office Tech', hasCart: false, score: 74 },
    { name: 'Fernanda Peón', city: 'Mérida', spent: 420, orders: 5, section: 'Decoración Maya', hasCart: true, score: 87 },
    { name: 'Alejandro Chapur', city: 'Cancún', spent: 610, orders: 7, section: 'Colección Resort', hasCart: true, score: 93 },
  ],
  CL: [
    { name: 'Matías Errázuriz', city: 'Santiago', spent: 690, orders: 8, section: 'Colección Alta Gama', hasCart: true, score: 96 },
    { name: 'Isidora Cousiño', city: 'Valparaíso', spent: 380, orders: 4, section: 'Carrito de Compras', hasCart: true, score: 86 },
    { name: 'Benjamín Matte', city: 'Concepción', spent: 420, orders: 5, section: 'Home Office & Luz', hasCart: false, score: 81 },
    { name: 'Trinidad Luksic', city: 'Antofagasta', spent: 550, orders: 7, section: 'Detalle de Producto', hasCart: true, score: 91 },
    { name: 'Cristóbal Vial', city: 'La Serena', spent: 260, orders: 3, section: 'Aromaterapia Costera', hasCart: false, score: 73 },
    { name: 'Francisca Angelini', city: 'Puerto Montt', spent: 390, orders: 4, section: 'Textiles Patagónicos', hasCart: true, score: 84 },
  ],
};

export function getSampleClientsForCountry(countryCode: RadarCountryCode) {
  const seeds = SAMPLE_CLIENTS_BY_COUNTRY[countryCode] || SAMPLE_CLIENTS_BY_COUNTRY.EC;
  const meta = RADAR_COUNTRIES[countryCode] || RADAR_COUNTRIES.EC;

  return seeds.map((s, idx) => {
    const coords = resolveMultiCountryCoordinates(s.city, countryCode);
    return {
      id: `sim_${countryCode}_${idx + 1}`,
      name: s.name,
      email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@cliente.com`,
      city: s.city,
      country: meta.name,
      countryCode,
      x: coords.x >= 0 ? coords.x : 50,
      y: coords.y >= 0 ? coords.y : 50,
      frequency: (s.orders >= 6 ? 'Semanal' : s.orders >= 3 ? 'Quincenal' : 'Ocasional') as "Semanal" | "Quincenal" | "Mensual" | "Ocasional" | "1ª Vez",
      purchasesCount: s.orders,
      totalSpent: s.spent,
      currentSection: s.section,
      intentScore: s.score,
      device: (idx % 2 === 0 ? 'Computador' : 'Celular') as "Computador" | "Celular" | "Tablet",
      hasCart: s.hasCart,
      cartItemsCount: s.hasCart ? (idx % 3) + 1 : 0,
      isRealUser: false,
      isAnonymous: false,
      isOnline: true,
      lastSeen: Date.now() - (idx * 45000),
      lastUpdated: Date.now(),
      activeSessionsCount: 1,
    };
  });
}

