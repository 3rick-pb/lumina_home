"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { RadarCountryCode } from "@/lib/radarCountries";
import { KeyRound, Layers, Compass, Check, X } from "lucide-react";

export interface CountryGeoBounds {
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  // Bounding box corresponding to x: 0..100%, y: 0..100% of the radar coordinate system
  west: number;
  east: number;
  north: number;
  south: number;
}

export const COUNTRY_GEO_CONFIG: Record<RadarCountryCode, CountryGeoBounds> = {
  EC: {
    center: [-78.4678, -1.55],
    zoom: 6.1,
    pitch: 42,
    bearing: -6,
    west: -81.2,
    east: -75.1,
    north: 1.48,
    south: -5.02,
  },
  CO: {
    center: [-74.0721, 4.5709],
    zoom: 5.1,
    pitch: 42,
    bearing: -5,
    west: -79.2,
    east: -66.8,
    north: 12.5,
    south: -4.2,
  },
  AR: {
    center: [-64.1888, -34.6037],
    zoom: 3.9,
    pitch: 38,
    bearing: 0,
    west: -73.6,
    east: -53.6,
    north: -21.8,
    south: -55.0,
  },
  PE: {
    center: [-75.5, -9.8],
    zoom: 4.8,
    pitch: 42,
    bearing: -8,
    west: -81.4,
    east: -68.6,
    north: -0.05,
    south: -18.35,
  },
  MX: {
    center: [-101.5, 23.2],
    zoom: 4.3,
    pitch: 40,
    bearing: -4,
    west: -117.1,
    east: -86.7,
    north: 32.7,
    south: 14.5,
  },
  CL: {
    center: [-70.6693, -35.6751],
    zoom: 4.1,
    pitch: 38,
    bearing: 4,
    west: -75.7,
    east: -66.4,
    north: -17.5,
    south: -55.9,
  },
};

// Exact [lng, lat] coordinates for major cities across all 6 countries
const EXACT_CITY_LNG_LAT: Record<string, [number, number]> = {
  // Ecuador
  quito: [-78.4678, -0.1807],
  guayaquil: [-79.8891, -2.1894],
  cuenca: [-79.0045, -2.9001],
  manta: [-80.7089, -0.9677],
  ambato: [-78.6197, -1.2491],
  loja: [-79.2042, -3.9931],
  "santo domingo": [-79.1754, -0.253],
  portoviejo: [-80.4545, -1.0546],
  machala: [-79.9554, -3.2581],
  ibarra: [-78.1223, 0.3517],
  riobamba: [-78.6471, -1.6635],
  esmeraldas: [-79.654, 0.9592],
  latacunga: [-78.6155, -0.9352],
  tulcan: [-77.7173, 0.8119],
  tulcán: [-77.7173, 0.8119],
  babahoyo: [-79.5346, -1.8019],
  quevedo: [-79.4628, -1.0286],
  milagro: [-79.5942, -2.134],
  salinas: [-80.9515, -2.2145],
  tena: [-77.8129, -0.9938],
  puyo: [-78.0026, -1.4924],
  macas: [-78.1114, -2.3087],
  zamora: [-78.9549, -4.0692],
  galapagos: [-90.3042, -0.7402],
  galápagos: [-90.3042, -0.7402],
  "puerto ayora": [-90.3138, -0.7443],
  // Colombia
  bogota: [-74.0721, 4.711],
  bogotá: [-74.0721, 4.711],
  medellin: [-75.5636, 6.2442],
  medellín: [-75.5636, 6.2442],
  cali: [-76.532, 3.4516],
  barranquilla: [-74.7964, 10.9685],
  cartagena: [-75.4794, 10.391],
  bucaramanga: [-73.1198, 7.1254],
  pereira: [-75.6961, 4.8133],
  "santa marta": [-74.199, 11.2408],
  // Argentina
  "buenos aires": [-58.3816, -34.6037],
  cordoba: [-64.1888, -31.4201],
  córdoba: [-64.1888, -31.4201],
  rosario: [-60.6393, -32.9468],
  mendoza: [-68.8458, -32.8895],
  "la plata": [-57.9545, -34.9215],
  tucuman: [-65.2176, -26.8083],
  tucumán: [-65.2176, -26.8083],
  "mar del plata": [-57.5426, -38.0055],
  salta: [-65.4117, -24.7859],
  // Perú
  lima: [-77.0428, -12.0464],
  arequipa: [-71.5375, -16.409],
  trujillo: [-79.029, -8.116],
  cusco: [-71.9675, -13.532],
  chiclayo: [-79.8409, -6.7714],
  piura: [-80.6328, -5.1945],
  iquitos: [-73.2516, -3.7437],
  huancayo: [-75.2049, -12.0651],
  // México
  "ciudad de mexico": [-99.1332, 19.4326],
  "ciudad de méxico": [-99.1332, 19.4326],
  cdmx: [-99.1332, 19.4326],
  guadalajara: [-103.3496, 20.6597],
  monterrey: [-100.3161, 25.6866],
  puebla: [-98.2063, 19.0414],
  cancun: [-86.8515, 21.1619],
  cancún: [-86.8515, 21.1619],
  queretaro: [-100.3899, 20.5888],
  querétaro: [-100.3899, 20.5888],
  merida: [-89.5926, 20.9674],
  mérida: [-89.5926, 20.9674],
  tijuana: [-117.0382, 32.5149],
  // Chile
  santiago: [-70.6693, -33.4489],
  valparaiso: [-71.6127, -33.0472],
  valparaíso: [-71.6127, -33.0472],
  concepcion: [-73.0444, -36.8201],
  concepción: [-73.0444, -36.8201],
  "la serena": [-71.252, -29.9027],
  antofagasta: [-70.3975, -23.6509],
  temuco: [-72.5904, -38.7359],
  iquique: [-70.1357, -20.2307],
  "puerto montt": [-72.9429, -41.4693],
};

export function resolveGeoLngLat(
  cityName: string | undefined,
  xPct: number,
  yPct: number,
  countryCode: RadarCountryCode,
  offsetXPct: number = 0,
  offsetYPct: number = 0
): [number, number] {
  const bounds = COUNTRY_GEO_CONFIG[countryCode] || COUNTRY_GEO_CONFIG.EC;
  const cleanCity = (cityName || "").toLowerCase().trim();

  // Check exact city dictionary first
  let baseLng: number | null = null;
  let baseLat: number | null = null;

  if (cleanCity && EXACT_CITY_LNG_LAT[cleanCity]) {
    [baseLng, baseLat] = EXACT_CITY_LNG_LAT[cleanCity];
  } else if (cleanCity) {
    const matchedKey = Object.keys(EXACT_CITY_LNG_LAT).find((k) => cleanCity.includes(k));
    if (matchedKey) {
      [baseLng, baseLat] = EXACT_CITY_LNG_LAT[matchedKey];
    }
  }

  if (baseLng === null || baseLat === null) {
    // Bilinear interpolation from percentage coordinates (0..100)
    const clampedX = Math.max(2, Math.min(98, xPct)) / 100;
    const clampedY = Math.max(2, Math.min(98, yPct)) / 100;
    baseLng = bounds.west + clampedX * (bounds.east - bounds.west);
    baseLat = bounds.north - clampedY * (bounds.north - bounds.south);
  }

  // Apply radial dispersion offset in degrees so multiple pins in the same city don't stack
  const lngSpan = Math.abs(bounds.east - bounds.west) * 0.14;
  const latSpan = Math.abs(bounds.north - bounds.south) * 0.14;
  const finalLng = baseLng + (offsetXPct / 100) * lngSpan;
  const finalLat = baseLat - (offsetYPct / 100) * latSpan;

  return [finalLng, finalLat];
}

export interface ProjectedPinPosition {
  x: number;
  y: number;
  visible: boolean;
}

interface RadarMapboxCanvasProps {
  selectedCountry: RadarCountryCode;
  zoomCommand: number;
  focusTarget: { xPct: number; yPct: number; zoomLevel: number; cityName?: string; seq: number } | null;
  resetCommandSeq: number;
  onMapReady?: () => void;
  onCanvasClick?: () => void;
  renderOverlayPins: (projectFn: (cityName: string | undefined, baseX: number, baseY: number, dispX?: number, dispY?: number) => ProjectedPinPosition) => React.ReactNode;
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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const prevZoomCommandRef = useRef<number>(zoomCommand);
  const [, setRenderTick] = useState(0);
  const [mapStyleMode, setMapStyleMode] = useState<"dark" | "voyager">("dark");
  const [mapboxToken, setMapboxToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || localStorage.getItem("lumina_mapbox_token") || "";
    }
    return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
  });
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");

  const getStyleUrl = useCallback(
    (mode: "dark" | "voyager", token: string) => {
      if (token && token.startsWith("pk.")) {
        return mode === "dark"
          ? `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1?access_token=${token}`
          : `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${token}`;
      }
      return mode === "dark"
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
    },
    []
  );

  // Initialize WebGL Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialGeo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getStyleUrl(mapStyleMode, mapboxToken),
      center: initialGeo.center,
      zoom: initialGeo.zoom,
      pitch: initialGeo.pitch,
      bearing: initialGeo.bearing,
      attributionControl: false,
      dragRotate: true,
      touchZoomRotate: true,
    });

    mapRef.current = map;

    const triggerProjectionUpdate = () => {
      setRenderTick((t) => (t + 1) % 1000000);
    };

    map.on("load", () => {
      triggerProjectionUpdate();
      onMapReady?.();
    });

    map.on("move", triggerProjectionUpdate);
    map.on("zoom", triggerProjectionUpdate);
    map.on("rotate", triggerProjectionUpdate);
    map.on("pitch", triggerProjectionUpdate);
    map.on("resize", triggerProjectionUpdate);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to selected country when changed
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    map.flyTo({
      center: geo.center,
      zoom: geo.zoom,
      pitch: geo.pitch,
      bearing: geo.bearing,
      duration: 2200,
      essential: true,
    });
  }, [selectedCountry]);

  // Respond to external zoom buttons (+ / -)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (zoomCommand === prevZoomCommandRef.current) return;

    const ratio = zoomCommand / Math.max(0.5, prevZoomCommandRef.current);
    prevZoomCommandRef.current = zoomCommand;

    const currentMapZoom = map.getZoom();
    const delta = Math.log2(ratio);
    map.easeTo({
      zoom: Math.max(2.5, Math.min(16, currentMapZoom + delta * 1.35)),
      duration: 380,
    });
  }, [zoomCommand]);

  // Respond to Reset View command
  useEffect(() => {
    if (resetCommandSeq === 0) return;
    const map = mapRef.current;
    if (!map) return;
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    map.flyTo({
      center: geo.center,
      zoom: geo.zoom,
      pitch: geo.pitch,
      bearing: geo.bearing,
      duration: 1200,
      essential: true,
    });
  }, [resetCommandSeq, selectedCountry]);

  // Respond to focusOnLocation (search bar city selection or cluster click)
  useEffect(() => {
    if (!focusTarget) return;
    const map = mapRef.current;
    if (!map) return;
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    const [lng, lat] = resolveGeoLngLat(
      focusTarget.cityName,
      focusTarget.xPct,
      focusTarget.yPct,
      selectedCountry
    );
    const targetMapZoom = Math.min(13.5, geo.zoom + Math.max(1.8, (focusTarget.zoomLevel - 1) * 2.6));
    map.flyTo({
      center: [lng, lat],
      zoom: targetMapZoom,
      pitch: 48,
      duration: 1600,
      essential: true,
    });
  }, [focusTarget, selectedCountry]);

  // Projection helper passed to overlay pins
  const projectPin = useCallback(
    (
      cityName: string | undefined,
      baseX: number,
      baseY: number,
      dispX?: number,
      dispY?: number
    ): ProjectedPinPosition => {
      const map = mapRef.current;
      if (!map) {
        return { x: (dispX ?? baseX) * 8, y: (dispY ?? baseY) * 6, visible: false };
      }

      const offsetX = dispX !== undefined ? dispX - baseX : 0;
      const offsetY = dispY !== undefined ? dispY - baseY : 0;
      const [lng, lat] = resolveGeoLngLat(cityName, baseX, baseY, selectedCountry, offsetX, offsetY);
      const pt = map.project([lng, lat]);

      const canvas = map.getCanvas();
      const w = canvas?.clientWidth || 900;
      const h = canvas?.clientHeight || 680;
      const visible = pt.x >= -60 && pt.x <= w + 60 && pt.y >= -60 && pt.y <= h + 60;

      return {
        x: pt.x,
        y: pt.y,
        visible,
      };
    },
    [selectedCountry]
  );

  const handleToggleMapStyle = () => {
    const nextMode = mapStyleMode === "dark" ? "voyager" : "dark";
    setMapStyleMode(nextMode);
    if (mapRef.current) {
      mapRef.current.setStyle(getStyleUrl(nextMode, mapboxToken));
    }
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenDraft.trim();
    setMapboxToken(cleaned);
    if (typeof window !== "undefined") {
      if (cleaned) {
        localStorage.setItem("lumina_mapbox_token", cleaned);
      } else {
        localStorage.removeItem("lumina_mapbox_token");
      }
    }
    if (mapRef.current) {
      mapRef.current.setStyle(getStyleUrl(mapStyleMode, cleaned));
    }
    setIsTokenModalOpen(false);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onClick={() => onCanvasClick?.()}
    >
      {/* Interactive WebGL Mapbox / MapLibre GL Surface */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          filter:
            mapStyleMode === "dark"
              ? "contrast(1.08) brightness(0.96) saturate(1.15)"
              : "contrast(1.02) brightness(0.88)",
        }}
      />

      {/* Subtle Tactical Radar Vignette & Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(204,255,0,0.03) 0%, rgba(15,20,18,0.22) 65%, rgba(10,14,12,0.72) 100%)",
        }}
      />

      {/* Geographic Projected Beacons & Clusters Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {renderOverlayPins(projectPin)}
      </div>

      {/* Bottom-Left Mapbox / WebGL Engine Badge & Style Controls */}
      <div
        className="absolute bottom-3 left-16 sm:left-20 z-30 flex items-center gap-2 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-xl border border-white/15 text-[10px] font-mono text-white/80 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] shadow-[0_0_6px_#ccff00]" />
          <span className="font-bold tracking-wider">MAPBOX GL</span>
          <span className="text-white/40">•</span>
          <span className="text-[#ccff00] font-semibold">WEBGL 3D</span>
        </div>

        <button
          type="button"
          onClick={handleToggleMapStyle}
          className="px-2.5 py-1 rounded-full bg-black/80 hover:bg-black backdrop-blur-xl border border-white/15 hover:border-[#ccff00]/50 text-[10px] font-mono text-white/85 hover:text-[#ccff00] flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
          title="Cambiar estilo cartográfico"
        >
          <Layers className="w-3 h-3 text-[#ccff00]" />
          <span>{mapStyleMode === "dark" ? "Modo Táctico Oscuro" : "Modo Satélite / Calle"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTokenDraft(mapboxToken);
            setIsTokenModalOpen(true);
          }}
          className="p-1.5 rounded-full bg-black/80 hover:bg-black backdrop-blur-xl border border-white/15 hover:border-[#ccff00]/50 text-white/70 hover:text-[#ccff00] transition-all cursor-pointer shadow-lg"
          title="Configurar Access Token de Mapbox (pk.*)"
        >
          <KeyRound className="w-3 h-3" />
        </button>
      </div>

      {/* Optional Mapbox Access Token Configuration Modal */}
      {isTokenModalOpen && (
        <div
          className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
          onClick={() => setIsTokenModalOpen(false)}
        >
          <form
            onSubmit={handleSaveToken}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#121615] border border-white/15 p-5 shadow-2xl space-y-4 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#ccff00]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Motor Cartográfico Mapbox GL
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-white/65 leading-relaxed">
              El radar vectorial 3D está activo en tiempo real. Si dispones de una llave pública de Mapbox (<code className="text-[#ccff00]">pk.eyJ1...</code>), puedes ingresarla aquí para habilitar los estilos propietarios de Mapbox Studio.
            </p>
            <input
              type="text"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              placeholder="pk.eyJ1Ijoi..."
              className="w-full h-10 px-3.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#ccff00] text-xs font-mono text-white outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-white/70 hover:text-white bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#ccff00] text-gray-950 hover:bg-[#d8ff33] flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
