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
    zoom: 6.4,
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
    const clampedX = Math.max(2, Math.min(98, xPct)) / 100;
    const clampedY = Math.max(2, Math.min(98, yPct)) / 100;
    baseLng = bounds.west + clampedX * (bounds.east - bounds.west);
    baseLat = bounds.north - clampedY * (bounds.north - bounds.south);
  }

  const lngSpan = Math.abs(bounds.east - bounds.west) * 0.14;
  const latSpan = Math.abs(bounds.north - bounds.south) * 0.14;
  const finalLng = baseLng + (offsetXPct / 100) * lngSpan;
  const finalLat = baseLat - (offsetYPct / 100) * latSpan;

  return [finalLng, finalLat];
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

// Global in-memory tile cache so switching modes/countries is instantaneous
const tileImageCache = new Map<string, HTMLImageElement>();
const tileLoadingSet = new Set<string>();

function getTileUrl(provider: "satellite" | "dark-base" | "dark-labels" | "voyager", z: number, x: number, y: number): string {
  const maxIndex = Math.pow(2, z);
  const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
  const sub = ["a", "b", "c"][Math.abs(wrappedX + y) % 3];

  if (provider === "satellite") {
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${wrappedX}`;
  }
  if (provider === "dark-base") {
    return `https://${sub}.basemaps.cartocdn.com/dark_nolabels/${z}/${wrappedX}/${y}@2x.png`;
  }
  if (provider === "dark-labels") {
    return `https://${sub}.basemaps.cartocdn.com/dark_only_labels/${z}/${wrappedX}/${y}@2x.png`;
  }
  return `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${wrappedX}/${y}@2x.png`;
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
  renderOverlayPins: (
    projectFn: (
      cityName: string | undefined,
      baseX: number,
      baseY: number,
      dispX?: number,
      dispY?: number
    ) => ProjectedPinPosition
  ) => React.ReactNode;
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

  const initialGeo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;

  // Live camera state in ref for 144 FPS canvas rendering + state tick for React pin overlay
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

  const requestRepaint = useCallback(() => {
    setRenderTick((t) => (t + 1) % 1000000);
  }, []);

  // Load a tile image and trigger repaint when ready
  const fetchTile = useCallback(
    (provider: "satellite" | "dark-base" | "dark-labels" | "voyager", z: number, x: number, y: number): HTMLImageElement | null => {
      if (z < 1 || z > 18) return null;
      const maxTile = Math.pow(2, z);
      if (y < 0 || y >= maxTile) return null;

      const url = getTileUrl(provider, z, x, y);
      const cached = tileImageCache.get(url);
      if (cached) return cached;

      if (!tileLoadingSet.has(url) && typeof window !== "undefined") {
        tileLoadingSet.add(url);
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => {
          tileImageCache.set(url, img);
          tileLoadingSet.delete(url);
          requestRepaint();
        };
        img.onerror = () => {
          tileLoadingSet.delete(url);
          // Fallback to standard OpenStreetMap tile if primary CDN fails
          const maxIndex = Math.pow(2, z);
          const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
          const fallbackUrl = `https://tile.openstreetmap.org/${z}/${wrappedX}/${y}.png`;
          if (url !== fallbackUrl && !tileImageCache.has(url)) {
            const fbImg = new window.Image();
            fbImg.onload = () => {
              tileImageCache.set(url, fbImg);
              requestRepaint();
            };
            fbImg.src = fallbackUrl;
          }
        };
        img.src = url;
      }
      return null;
    },
    [requestRepaint]
  );

  // Draw a single tile layer with automatic parent-tile fallback (`z - 1`, `z - 2`) so there are NEVER blank gaps
  const drawTileLayer = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      provider: "satellite" | "dark-base" | "dark-labels" | "voyager",
      camLng: number,
      camLat: number,
      camZoom: number,
      width: number,
      height: number,
      alpha: number = 1,
      filterStr: string = "none"
    ) => {
      const zInt = Math.max(2, Math.min(18, Math.floor(camZoom)));
      const scaleFactor = Math.pow(2, camZoom - zInt);
      const drawnTileSize = TILE_SIZE * scaleFactor;

      const centerWorldX = lngToMercatorX(camLng, zInt);
      const centerWorldY = latToMercatorY(camLat, zInt);

      const topLeftWorldX = centerWorldX - width / 2 / scaleFactor;
      const topLeftWorldY = centerWorldY - height / 2 / scaleFactor;

      const startTileX = Math.floor(topLeftWorldX / TILE_SIZE) - 1;
      const endTileX = Math.ceil((topLeftWorldX + width / scaleFactor) / TILE_SIZE) + 1;
      const startTileY = Math.floor(topLeftWorldY / TILE_SIZE) - 1;
      const endTileY = Math.ceil((topLeftWorldY + height / scaleFactor) / TILE_SIZE) + 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      if (filterStr !== "none") {
        ctx.filter = filterStr;
      }

      for (let ty = startTileY; ty <= endTileY; ty++) {
        for (let tx = startTileX; tx <= endTileX; tx++) {
          const screenX = (tx * TILE_SIZE - topLeftWorldX) * scaleFactor;
          const screenY = (ty * TILE_SIZE - topLeftWorldY) * scaleFactor;

          const exactImg = fetchTile(provider, zInt, tx, ty);
          if (exactImg) {
            ctx.drawImage(exactImg, screenX, screenY, drawnTileSize + 0.6, drawnTileSize + 0.6);
          } else if (zInt > 2) {
            // Fallback to parent tile (zInt - 1) while high-res tile downloads
            const parentZ = zInt - 1;
            const ptx = Math.floor(tx / 2);
            const pty = Math.floor(ty / 2);
            const parentImg = fetchTile(provider, parentZ, ptx, pty);
            if (parentImg) {
              const subX = ((tx % 2) + 2) % 2;
              const subY = ((ty % 2) + 2) % 2;
              const srcW = parentImg.width / 2;
              const srcH = parentImg.height / 2;
              ctx.drawImage(
                parentImg,
                subX * srcW,
                subY * srcH,
                srcW,
                srcH,
                screenX,
                screenY,
                drawnTileSize + 0.6,
                drawnTileSize + 0.6
              );
            }
          }
        }
      }

      ctx.restore();
    },
    [fetchTile]
  );

  // Main Canvas Render Loop
  useEffect(() => {
    let rafId = 0;
    let mounted = true;

    onMapReady?.();

    const renderFrame = () => {
      if (!mounted) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (container && canvas) {
        const w = container.clientWidth || 960;
        const h = container.clientHeight || 680;
        const cam = camRef.current;
        cam.width = w;
        cam.height = h;

        const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
        const targetW = Math.round(w * dpr);
        const targetH = Math.round(h * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        // Smooth camera interpolation (`flyTo` / `easeTo`)
        if (cam.animating) {
          const dLng = cam.targetLng - cam.lng;
          const dLat = cam.targetLat - cam.lat;
          const dZoom = cam.targetZoom - cam.zoom;
          if (Math.abs(dLng) < 0.0005 && Math.abs(dLat) < 0.0005 && Math.abs(dZoom) < 0.002) {
            cam.lng = cam.targetLng;
            cam.lat = cam.targetLat;
            cam.zoom = cam.targetZoom;
            cam.animating = false;
          } else {
            cam.lng += dLng * 0.12;
            cam.lat += dLat * 0.12;
            cam.zoom += dZoom * 0.12;
          }
          setRenderTick((t) => (t + 1) % 1000000);
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          // 1. Base Tactical Ocean / Terrain Backdrop
          ctx.fillStyle = mapStyleMode === "street" ? "#e8ecef" : "#111b18";
          ctx.fillRect(0, 0, w, h);

          if (mapStyleMode === "tactical") {
            // Layer A: Real Satellite Terrain Relief (Andes mountains, Amazon, Coastline)
            drawTileLayer(
              ctx,
              "satellite",
              cam.lng,
              cam.lat,
              cam.zoom,
              w,
              h,
              0.68,
              "contrast(1.18) brightness(0.92) saturate(0.82)"
            );
            // Layer B: Dark Cartographic Vector Roads & Borders
            drawTileLayer(
              ctx,
              "dark-base",
              cam.lng,
              cam.lat,
              cam.zoom,
              w,
              h,
              0.48,
              "contrast(1.3) brightness(1.35)"
            );
            // Layer C: High-DPI Crisp White City & Province Names (`@2x`)
            drawTileLayer(
              ctx,
              "dark-labels",
              cam.lng,
              cam.lat,
              cam.zoom,
              w,
              h,
              1.0,
              "brightness(1.55) contrast(1.35)"
            );
          } else if (mapStyleMode === "satellite") {
            // Full HD Satellite Imagery + High-Contrast White Labels
            drawTileLayer(
              ctx,
              "satellite",
              cam.lng,
              cam.lat,
              cam.zoom,
              w,
              h,
              1.0,
              "contrast(1.1) brightness(1.06) saturate(1.18)"
            );
            drawTileLayer(
              ctx,
              "dark-labels",
              cam.lng,
              cam.lat,
              cam.zoom,
              w,
              h,
              1.0,
              "brightness(1.6) contrast(1.4)"
            );
          } else {
            // Crisp Full-Color Street & Topographic Map (`Voyager @2x`)
            drawTileLayer(ctx, "voyager", cam.lng, cam.lat, cam.zoom, w, h, 1.0, "none");
          }

          // Subtle Tactical Radar Coordinate Grid Lines (`lat` / `lng` every 2 degrees)
          if (mapStyleMode !== "street") {
            ctx.save();
            ctx.strokeStyle = "rgba(204, 255, 0, 0.08)";
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

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => {
      mounted = false;
      window.cancelAnimationFrame(rafId);
    };
  }, [drawTileLayer, mapStyleMode, onMapReady]);

  // Fly to selected country when changed
  useEffect(() => {
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    camRef.current.targetLng = geo.center[0];
    camRef.current.targetLat = geo.center[1];
    camRef.current.targetZoom = geo.zoom;
    camRef.current.animating = true;
  }, [selectedCountry]);

  // Respond to external zoom buttons (+ / -)
  useEffect(() => {
    if (zoomCommand === prevZoomCommandRef.current) return;
    const ratio = zoomCommand / Math.max(0.5, prevZoomCommandRef.current);
    prevZoomCommandRef.current = zoomCommand;

    const delta = Math.log2(ratio);
    camRef.current.targetZoom = Math.max(3.2, Math.min(14.5, camRef.current.zoom + delta * 1.25));
    camRef.current.animating = true;
  }, [zoomCommand]);

  // Respond to Reset View command
  useEffect(() => {
    if (resetCommandSeq === 0) return;
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    camRef.current.targetLng = geo.center[0];
    camRef.current.targetLat = geo.center[1];
    camRef.current.targetZoom = geo.zoom;
    camRef.current.animating = true;
  }, [resetCommandSeq, selectedCountry]);

  // Respond to focusOnLocation (search bar city selection or cluster click)
  useEffect(() => {
    if (!focusTarget) return;
    const geo = COUNTRY_GEO_CONFIG[selectedCountry] || COUNTRY_GEO_CONFIG.EC;
    const [lng, lat] = resolveGeoLngLat(
      focusTarget.cityName,
      focusTarget.xPct,
      focusTarget.yPct,
      selectedCountry
    );
    const targetMapZoom = Math.min(12.5, geo.zoom + Math.max(1.6, (focusTarget.zoomLevel - 1) * 2.2));
    camRef.current.targetLng = lng;
    camRef.current.targetLat = lat;
    camRef.current.targetZoom = targetMapZoom;
    camRef.current.animating = true;
  }, [focusTarget, selectedCountry]);

  // Exact Web Mercator projection helper passed to overlay pins
  const projectPin = useCallback(
    (
      cityName: string | undefined,
      baseX: number,
      baseY: number,
      dispX?: number,
      dispY?: number
    ): ProjectedPinPosition => {
      const cam = camRef.current;
      const offsetX = dispX !== undefined ? dispX - baseX : 0;
      const offsetY = dispY !== undefined ? dispY - baseY : 0;
      const [lng, lat] = resolveGeoLngLat(cityName, baseX, baseY, selectedCountry, offsetX, offsetY);

      const centerWx = lngToMercatorX(cam.lng, cam.zoom);
      const centerWy = latToMercatorY(cam.lat, cam.zoom);
      const pinWx = lngToMercatorX(lng, cam.zoom);
      const pinWy = latToMercatorY(lat, cam.zoom);

      const x = pinWx - centerWx + cam.width / 2;
      const y = pinWy - centerWy + cam.height / 2;
      const visible = x >= -60 && x <= cam.width + 60 && y >= -60 && y <= cam.height + 60;

      return { x, y, visible };
    },
    [selectedCountry]
  );

  // Interactive Pointer Drag & Wheel Zoom handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    camRef.current.animating = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      lng: camRef.current.lng,
      lat: camRef.current.lat,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
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

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0018;
    const nextZoom = Math.max(3.2, Math.min(14.5, camRef.current.zoom + zoomDelta));
    camRef.current.zoom = nextZoom;
    camRef.current.targetZoom = nextZoom;
    camRef.current.animating = false;
    requestRepaint();
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onClick={() => {
        if (!dragMovedRef.current) {
          onCanvasClick?.();
        }
      }}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Direct Hardware-Accelerated 2D Slippy Tile Canvas (Zero WebWorker / Zero Token Dependencies) */}
      <canvas
        ref={canvasRef}
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
