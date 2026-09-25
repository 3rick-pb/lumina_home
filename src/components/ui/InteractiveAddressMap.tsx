"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Plus, Minus, Crosshair } from "lucide-react";

interface InteractiveAddressMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

type MiniMapStyle = "streets" | "dark" | "satellite";

const TILE_SIZE = 256;
const MIN_ZOOM = 4;
const MAX_ZOOM = 19;

// Standard Web Mercator projection helpers
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

function getTileUrl(style: MiniMapStyle, z: number, x: number, y: number): string {
  const maxIndex = Math.pow(2, z);
  const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
  const sub = Math.abs(wrappedX + y) % 4;
  if (style === "satellite") {
    return `https://mt${sub}.google.com/vt/lyrs=y&hl=es&x=${wrappedX}&y=${y}&z=${z}&scale=2`;
  }
  if (style === "dark") {
    const aSub = ["a", "b", "c", "d"][sub];
    return `https://${aSub}.basemaps.cartocdn.com/dark_all/${z}/${wrappedX}/${y}@2x.png`;
  }
  return `https://mt${sub}.google.com/vt/lyrs=m&hl=es&x=${wrappedX}&y=${y}&z=${z}&scale=2`;
}

export default function InteractiveAddressMap({
  initialLat = -0.1807,
  initialLng = -78.4678,
  onLocationSelect,
  className = "h-56 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10",
}: InteractiveAddressMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validInitLat =
    typeof initialLat === "number" && Number.isFinite(initialLat)
      ? initialLat
      : -0.1807;
  const validInitLng =
    typeof initialLng === "number" && Number.isFinite(initialLng)
      ? initialLng
      : -78.4678;

  // Map camera center & zoom
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: validInitLat,
    lng: validInitLng,
  });
  // Draggable pin position
  const [pin, setPin] = useState<{ lat: number; lng: number }>({
    lat: validInitLat,
    lng: validInitLng,
  });
  const [zoom, setZoom] = useState<number>(16);
  const [mapStyle, setMapStyle] = useState<MiniMapStyle>("streets");
  const [renderTick, setRenderTick] = useState<number>(0);

  // Interaction state
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

  // Sync when external coordinates change (e.g. "Autocompletar con mi ubicación actual")
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
      }
    }
  }, [initialLat, initialLng]);

  // Convert screen (x, y) relative to canvas into { lat, lng }
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

  // Convert { lat, lng } into screen (x, y) relative to canvas
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

  // Draw map tiles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
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

    // Background fill
    ctx.fillStyle = mapStyle === "dark" ? "#18181b" : "#e5e7eb";
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
        const url = getTileUrl(mapStyle, z, tx, ty);
        const drawX = width / 2 + (tx - centerTileX) * TILE_SIZE;
        const drawY = height / 2 + (ty - centerTileY) * TILE_SIZE;

        const cached = miniTileCache.get(url);
        if (cached && cached.complete && cached.naturalWidth > 0) {
          ctx.drawImage(cached, drawX, drawY, TILE_SIZE + 0.5, TILE_SIZE + 0.5);
        } else if (!cached) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          miniTileCache.set(url, img);
          img.onload = () => {
            setRenderTick((t) => t + 1);
          };
          img.src = url;
        }
      }
    }

    ctx.restore();
  }, [center.lat, center.lng, zoom, mapStyle, renderTick]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setRenderTick((t) => t + 1));
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Pointer handlers for dragging pin or panning map
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const pinPos = latLngToScreen(pin.lat, pin.lng, rect.width, rect.height);
    const distToPin = Math.hypot(px - pinPos.x, py - (pinPos.y - 16));

    e.currentTarget.setPointerCapture(e.pointerId);

    if (distToPin <= 34) {
      dragModeRef.current = "pin";
    } else {
      dragModeRef.current = "pan";
    }

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startCenterLat: center.lat,
      startCenterLng: center.lng,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragModeRef.current === "none") return;
    const container = containerRef.current;
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
    if (dragModeRef.current === "none") return;
    const container = containerRef.current;
    if (container && !dragStartRef.current.moved) {
      // Single click/tap anywhere on the map moves the pin directly there!
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const next = screenToLatLng(px, py, rect.width, rect.height);
      setPin(next);
      prevPropsRef.current = next;
      onLocationSelect(next.lat, next.lng);
    }
    dragModeRef.current = "none";
  };

  // Calculate pin screen coordinates for overlay
  const rect = containerRef.current?.getBoundingClientRect();
  const w = rect?.width || 360;
  const h = rect?.height || 200;
  const pinScreen = latLngToScreen(pin.lat, pin.lng, w, h);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative select-none touch-none cursor-grab active:cursor-grabbing ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top instruction & style switcher bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
        <div className="bg-white/95 dark:bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 leading-none">
            Arrastra el pin o toca el mapa
          </span>
        </div>

        <div
          className="flex items-center bg-white/95 dark:bg-black/85 backdrop-blur-md p-0.5 rounded-xl border border-black/10 dark:border-white/15 shadow-sm pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {(
            [
              { id: "streets", label: "Streets" },
              { id: "dark", label: "Dark" },
              { id: "satellite", label: "Satélite" },
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

      {/* Draggable Pin Overlay */}
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

      {/* Zoom & Recenter Controls */}
      <div
        className="absolute bottom-2.5 right-2.5 flex flex-col gap-1 pointer-events-auto z-10"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 1))}
          title="Acercar"
          className="w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 1))}
          title="Alejar"
          className="w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setCenter({ lat: pin.lat, lng: pin.lng })}
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
  );
}
