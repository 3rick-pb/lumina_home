"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Plus, Minus, Crosshair, Search, Loader2, MapPin } from "lucide-react";

export interface ResolvedMapAddress {
  street?: string;
  exteriorNumber?: string;
  neighborhood?: string;
  crossStreets?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface InteractiveAddressMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressResolved?: (addr: ResolvedMapAddress) => void;
  className?: string;
}

type MiniMapStyle = "streets-v12" | "dark-v11" | "satellite-streets-v12";

interface SearchSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

const TILE_SIZE = 256;
const MIN_ZOOM = 4;
const MAX_ZOOM = 19;

function lngToTileX(lng: number, z: number): number {
  return ((lng + 180) / 360) * Math.pow(2, z);
}

function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, z)
  );
}

function tileXToLng(tileX: number, z: number): number {
  return (tileX / Math.pow(2, z)) * 360 - 180;
}

function tileYToLat(tileY: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * tileY) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

const miniTileCache = new Map<string, HTMLImageElement>();

function getFallbackTileUrl(style: MiniMapStyle, z: number, x: number, y: number): string {
  const maxIndex = Math.pow(2, z);
  const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
  const sub = Math.abs(wrappedX + y) % 4;
  if (style === "satellite-streets-v12") {
    return `https://mt${sub}.google.com/vt/lyrs=y&hl=es&x=${wrappedX}&y=${y}&z=${z}&scale=2`;
  }
  if (style === "dark-v11") {
    const aSub = ["a", "b", "c", "d"][sub];
    return `https://${aSub}.basemaps.cartocdn.com/dark_all/${z}/${wrappedX}/${y}@2x.png`;
  }
  return `https://mt${sub}.google.com/vt/lyrs=m&hl=es&x=${wrappedX}&y=${y}&z=${z}&scale=2`;
}

export default function InteractiveAddressMap({
  initialLat = -0.1807,
  initialLng = -78.4678,
  onLocationSelect,
  onAddressResolved,
  className = "h-64 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10",
}: InteractiveAddressMapProps) {
  const envToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();
  const hasValidMapboxToken = envToken.startsWith("pk.") && envToken.length > 20;

  const validInitLat =
    typeof initialLat === "number" && Number.isFinite(initialLat)
      ? initialLat
      : -0.1807;
  const validInitLng =
    typeof initialLng === "number" && Number.isFinite(initialLng)
      ? initialLng
      : -78.4678;

  const [useNativeMapbox, setUseNativeMapbox] = useState<boolean>(hasValidMapboxToken);
  const [mapStyle, setMapStyle] = useState<MiniMapStyle>("streets-v12");
  const [pin, setPin] = useState<{ lat: number; lng: number }>({
    lat: validInitLat,
    lng: validInitLng,
  });
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: validInitLat,
    lng: validInitLng,
  });
  const [zoom, setZoom] = useState<number>(16);
  const [renderTick, setRenderTick] = useState<number>(0);

  // Search / Autocomplete state (Mapbox Places API + fallback)
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Refs for Native Mapbox GL JS instance
  const mapboxContainerRef = useRef<HTMLDivElement>(null);
  const mapboxInstanceRef = useRef<mapboxgl.Map | null>(null);
  const mapboxMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Refs for Fallback Canvas engine (when NEXT_PUBLIC_MAPBOX_TOKEN is not set yet)
  const fallbackContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragModeRef = useRef<"none" | "pin" | "pan">("none");
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startCenterLat: number;
    startCenterLng: number;
    moved: boolean;
  }>({
    clientX: 0,
    clientY: 0,
    startCenterLat: validInitLat,
    startCenterLng: validInitLng,
    moved: false,
  });

  const triggerReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!onAddressResolved) return;
      try {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon: lng }),
        });
        const data = await res.json();
        if (data?.success && data?.data) {
          onAddressResolved(data.data);
        }
      } catch {
        // Ignore reverse geocode network errors silently
      }
    },
    [onAddressResolved]
  );

  // 1. Initialize Official Mapbox GL JS (`mapbox-gl`) when NEXT_PUBLIC_MAPBOX_TOKEN is present
  useEffect(() => {
    if (!hasValidMapboxToken || !useNativeMapbox || !mapboxContainerRef.current) return;
    if (mapboxInstanceRef.current) return;

    try {
      mapboxgl.accessToken = envToken;

      const map = new mapboxgl.Map({
        container: mapboxContainerRef.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: [validInitLng, validInitLat],
        zoom: 15.5,
        attributionControl: false,
      });

      map.on("error", (err) => {
        // If token is invalid/revoked, fall back gracefully without crashing React!
        if (
          err?.error?.message?.toLowerCase().includes("token") ||
          err?.error?.message?.toLowerCase().includes("unauthorized") ||
          (err as { status?: number })?.status === 401
        ) {
          setUseNativeMapbox(false);
        }
      });

      const marker = new mapboxgl.Marker({
        draggable: true,
        color: "#2563eb",
      })
        .setLngLat([validInitLng, validInitLat])
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        setPin({ lat: lngLat.lat, lng: lngLat.lng });
        onLocationSelect(lngLat.lat, lngLat.lng);
        triggerReverseGeocode(lngLat.lat, lngLat.lng);
      });

      map.on("click", (ev) => {
        const { lat, lng } = ev.lngLat;
        marker.setLngLat([lng, lat]);
        setPin({ lat, lng });
        onLocationSelect(lat, lng);
        triggerReverseGeocode(lat, lng);
      });

      mapboxInstanceRef.current = map;
      mapboxMarkerRef.current = marker;
    } catch {
      setUseNativeMapbox(false);
    }

    return () => {
      if (mapboxInstanceRef.current) {
        try {
          mapboxInstanceRef.current.remove();
        } catch {}
        mapboxInstanceRef.current = null;
        mapboxMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidMapboxToken, useNativeMapbox]);

  // Update Mapbox style when user switches between Streets / Dark / Satellite Streets
  useEffect(() => {
    if (useNativeMapbox && mapboxInstanceRef.current) {
      try {
        mapboxInstanceRef.current.setStyle(`mapbox://styles/mapbox/${mapStyle}`);
      } catch {}
    }
  }, [mapStyle, useNativeMapbox]);

  // Sync external coordinates change (e.g. "Autocompletar con mi ubicación actual")
  const prevPropsRef = useRef<{ lat: number; lng: number }>({
    lat: validInitLat,
    lng: validInitLng,
  });
  useEffect(() => {
    if (
      typeof initialLat === "number" &&
      typeof initialLng === "number" &&
      Number.isFinite(initialLat) &&
      Number.isFinite(initialLng)
    ) {
      const dLat = Math.abs(initialLat - prevPropsRef.current.lat);
      const dLng = Math.abs(initialLng - prevPropsRef.current.lng);
      if (dLat > 0.00001 || dLng > 0.00001) {
        prevPropsRef.current = { lat: initialLat, lng: initialLng };
        setCenter({ lat: initialLat, lng: initialLng });
        setPin({ lat: initialLat, lng: initialLng });

        if (useNativeMapbox && mapboxInstanceRef.current && mapboxMarkerRef.current) {
          try {
            mapboxMarkerRef.current.setLngLat([initialLng, initialLat]);
            mapboxInstanceRef.current.flyTo({
              center: [initialLng, initialLat],
              zoom: 16,
              essential: true,
            });
          } catch {}
        }
      }
    }
  }, [initialLat, initialLng, useNativeMapbox]);

  // Address Search Autocomplete (Mapbox Geocoding v5 API when token present, Nominatim fallback)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (hasValidMapboxToken) {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            q
          )}.json?access_token=${envToken}&language=es&limit=4&country=ec,co,pe,mx,cl,ar`;
          const res = await fetch(url);
          const data = await res.json();
          if (Array.isArray(data?.features)) {
            setSuggestions(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.features.map((f: any) => ({
                id: String(f.id),
                place_name: String(f.place_name_es || f.place_name),
                center: f.center as [number, number],
              }))
            );
          }
        } else {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}&limit=4&accept-language=es`;
          const res = await fetch(url);
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.map((item: any, idx: number) => ({
                id: String(item.place_id || idx),
                place_name: String(item.display_name),
                center: [Number(item.lon), Number(item.lat)],
              }))
            );
          }
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery, hasValidMapboxToken, envToken]);

  const handleSelectSuggestion = (s: SearchSuggestion) => {
    const [lng, lat] = s.center;
    setSuggestions([]);
    setSearchQuery("");
    setPin({ lat, lng });
    setCenter({ lat, lng });
    prevPropsRef.current = { lat, lng };
    onLocationSelect(lat, lng);
    triggerReverseGeocode(lat, lng);

    if (useNativeMapbox && mapboxInstanceRef.current && mapboxMarkerRef.current) {
      try {
        mapboxMarkerRef.current.setLngLat([lng, lat]);
        mapboxInstanceRef.current.flyTo({
          center: [lng, lat],
          zoom: 16.5,
          essential: true,
        });
      } catch {}
    }
  };

  // Fallback Canvas Web Mercator helpers (active when NEXT_PUBLIC_MAPBOX_TOKEN is not yet configured)
  const screenToLatLng = useCallback(
    (px: number, py: number, width: number, height: number) => {
      const centerTileX = lngToTileX(center.lng, zoom);
      const centerTileY = latToTileY(center.lat, zoom);
      const targetTileX = centerTileX + (px - width / 2) / TILE_SIZE;
      const targetTileY = centerTileY + (py - height / 2) / TILE_SIZE;
      const lng = Math.max(-180, Math.min(180, tileXToLng(targetTileX, zoom)));
      const lat = Math.max(-85, Math.min(85, tileYToLat(targetTileY, zoom)));
      return { lat, lng };
    },
    [center.lat, center.lng, zoom]
  );

  const latLngToScreen = useCallback(
    (lat: number, lng: number, width: number, height: number) => {
      const centerTileX = lngToTileX(center.lng, zoom);
      const centerTileY = latToTileY(center.lat, zoom);
      const ptTileX = lngToTileX(lng, zoom);
      const ptTileY = latToTileY(lat, zoom);
      const x = width / 2 + (ptTileX - centerTileX) * TILE_SIZE;
      const y = height / 2 + (ptTileY - centerTileY) * TILE_SIZE;
      return { x, y };
    },
    [center.lat, center.lng, zoom]
  );

  useEffect(() => {
    if (useNativeMapbox) return;
    const canvas = canvasRef.current;
    const container = fallbackContainerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(280, Math.floor(rect.width));
    const height = Math.max(180, Math.floor(rect.height));
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = mapStyle === "dark-v11" ? "#18181b" : "#e5e7eb";
    ctx.fillRect(0, 0, width, height);

    const z = Math.round(zoom);
    const centerTileX = lngToTileX(center.lng, z);
    const centerTileY = latToTileY(center.lat, z);

    const halfCols = Math.ceil(width / TILE_SIZE / 2) + 1;
    const halfRows = Math.ceil(height / TILE_SIZE / 2) + 1;

    const minX = Math.floor(centerTileX) - halfCols;
    const maxX = Math.floor(centerTileX) + halfCols;
    const minY = Math.max(0, Math.floor(centerTileY) - halfRows);
    const maxY = Math.min(Math.pow(2, z) - 1, Math.floor(centerTileY) + halfRows);

    for (let tx = minX; tx <= maxX; tx++) {
      for (let ty = minY; ty <= maxY; ty++) {
        const url = getFallbackTileUrl(mapStyle, z, tx, ty);
        const drawX = width / 2 + (tx - centerTileX) * TILE_SIZE;
        const drawY = height / 2 + (ty - centerTileY) * TILE_SIZE;

        const cached = miniTileCache.get(url);
        if (cached && cached.complete && cached.naturalWidth > 0) {
          ctx.drawImage(cached, drawX, drawY, TILE_SIZE + 0.5, TILE_SIZE + 0.5);
        } else if (!cached) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          miniTileCache.set(url, img);
          img.onload = () => setRenderTick((t) => t + 1);
          img.src = url;
        }
      }
    }
    ctx.restore();
  }, [useNativeMapbox, center.lat, center.lng, zoom, mapStyle, renderTick]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox) return;
    const container = fallbackContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const pinPos = latLngToScreen(pin.lat, pin.lng, rect.width, rect.height);
    const distToPin = Math.hypot(px - pinPos.x, py - (pinPos.y - 16));

    e.currentTarget.setPointerCapture(e.pointerId);
    dragModeRef.current = distToPin <= 34 ? "pin" : "pan";
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startCenterLat: center.lat,
      startCenterLng: center.lng,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox || dragModeRef.current === "none") return;
    const container = fallbackContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (Math.hypot(dx, dy) > 3) {
      dragStartRef.current.moved = true;
    }

    if (dragModeRef.current === "pin") {
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const next = screenToLatLng(px, py, rect.width, rect.height);
      setPin(next);
      prevPropsRef.current = next;
      onLocationSelect(next.lat, next.lng);
    } else if (dragModeRef.current === "pan") {
      const startTileX = lngToTileX(dragStartRef.current.startCenterLng, zoom);
      const startTileY = latToTileY(dragStartRef.current.startCenterLat, zoom);
      const nextLng = tileXToLng(startTileX - dx / TILE_SIZE, zoom);
      const nextLat = tileYToLat(startTileY - dy / TILE_SIZE, zoom);
      setCenter({
        lat: Math.max(-85, Math.min(85, nextLat)),
        lng: Math.max(-180, Math.min(180, nextLng)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox || dragModeRef.current === "none") return;
    const container = fallbackContainerRef.current;
    if (container && !dragStartRef.current.moved) {
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const next = screenToLatLng(px, py, rect.width, rect.height);
      setPin(next);
      prevPropsRef.current = next;
      onLocationSelect(next.lat, next.lng);
      triggerReverseGeocode(next.lat, next.lng);
    } else if (dragModeRef.current === "pin") {
      triggerReverseGeocode(pin.lat, pin.lng);
    }
    dragModeRef.current = "none";
  };

  const rect = fallbackContainerRef.current?.getBoundingClientRect();
  const w = rect?.width || 360;
  const h = rect?.height || 220;
  const pinScreen = latLngToScreen(pin.lat, pin.lng, w, h);

  const handleZoomStep = (delta: number) => {
    if (useNativeMapbox && mapboxInstanceRef.current) {
      try {
        const curZ = mapboxInstanceRef.current.getZoom();
        mapboxInstanceRef.current.zoomTo(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, curZ + delta)));
      } catch {}
    } else {
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
    }
  };

  const handleRecenter = () => {
    if (useNativeMapbox && mapboxInstanceRef.current) {
      try {
        mapboxInstanceRef.current.flyTo({ center: [pin.lng, pin.lat], zoom: 16 });
      } catch {}
    } else {
      setCenter({ lat: pin.lat, lng: pin.lng });
    }
  };

  return (
    <div className="space-y-2">
      {/* Mapbox Places Search / Autocomplete Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1c]">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar dirección o sector en el mapa (Mapbox Places)..."
            className="w-full text-xs bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          {isSearching && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/15 rounded-xl shadow-lg z-30 overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-[11px] text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-white/10 flex items-center gap-2 border-b last:border-b-0 border-gray-100 dark:border-white/5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{s.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Container */}
      <div className={`relative select-none ${className}`}>
        {/* 1. Native Mapbox GL JS Container (Active when NEXT_PUBLIC_MAPBOX_TOKEN is in .env) */}
        {useNativeMapbox ? (
          <div ref={mapboxContainerRef} className="w-full h-full" />
        ) : (
          /* 2. Crash-Proof Fallback Interactive Map (Active if token not yet added) */
          <div
            ref={fallbackContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full touch-none cursor-grab active:cursor-grabbing relative"
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div
              style={{
                transform: `translate3d(${pinScreen.x}px, ${pinScreen.y}px, 0)`,
              }}
              className="absolute top-0 left-0 -translate-x-1/2 -translate-y-full pointer-events-none z-10 transition-transform duration-75"
            >
              <div className="relative flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
                <div className="w-1 h-2.5 bg-blue-600 -mt-0.5 rounded-b-full shadow-sm" />
                <div className="w-3 h-1 rounded-full bg-black/35 blur-[1px] mt-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* Top Bar: Instruction & Mapbox Official Styles Switcher */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
          <div className="bg-white/95 dark:bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 leading-none">
              {useNativeMapbox ? "Mapbox GL API · Arrastra el pin" : "Arrastra el pin o toca el mapa"}
            </span>
          </div>

          <div
            className="flex items-center bg-white/95 dark:bg-black/85 backdrop-blur-md p-0.5 rounded-xl border border-black/10 dark:border-white/15 shadow-sm pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {(
              [
                { id: "streets-v12", label: "Streets" },
                { id: "dark-v11", label: "Dark" },
                { id: "satellite-streets-v12", label: "Satellite Streets" },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setMapStyle(st.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  mapStyle === st.id
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-2xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom & Recenter Controls */}
        <div
          className="absolute bottom-2.5 right-2.5 flex flex-col gap-1 pointer-events-auto z-10"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleZoomStep(1)}
            title="Acercar"
            className="w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomStep(-1)}
            title="Alejar"
            className="w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            title="Centrar en el pin"
            className="w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Coordinates Badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 dark:bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/15 shadow-sm pointer-events-none z-10">
          <span className="text-[10px] font-mono font-semibold text-gray-700 dark:text-gray-300">
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </span>
        </div>
      </div>
    </div>
  );
}
