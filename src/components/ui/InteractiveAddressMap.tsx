"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Plus, Minus, Crosshair } from "lucide-react";

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

const TILE_SIZE = 256;
const MIN_ZOOM = 11;
const MAX_ZOOM = 20;

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

function isRealMapboxToken(token: string): boolean {
  return (
    token.startsWith("pk.") &&
    token.length > 35 &&
    !token.includes("ejemplo") &&
    !token.includes("tu_usuario")
  );
}

function getFallbackTileUrl(z: number, x: number, y: number): string {
  // Google Maps Satélite Híbrido con Calles (Satellite Streets - lyrs=y)
  const safeZ = Math.max(1, Math.min(20, Math.round(z)));
  const maxIndex = Math.pow(2, safeZ);
  const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
  const sub = Math.abs(wrappedX + y) % 4;

  return `https://mt${sub}.google.com/vt/lyrs=y&hl=es&x=${wrappedX}&y=${y}&z=${safeZ}`;
}

export default function InteractiveAddressMap({
  initialLat = -0.1807,
  initialLng = -78.4678,
  onLocationSelect,
  onAddressResolved,
  className = "h-64 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10",
}: InteractiveAddressMapProps) {
  const envToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();
  const hasValidMapboxToken = isRealMapboxToken(envToken);

  const validInitLat =
    typeof initialLat === "number" && Number.isFinite(initialLat)
      ? initialLat
      : -0.1807;
  const validInitLng =
    typeof initialLng === "number" && Number.isFinite(initialLng)
      ? initialLng
      : -78.4678;

  const [useNativeMapbox, setUseNativeMapbox] = useState<boolean>(false);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: validInitLat,
    lng: validInitLng,
  });
  const [zoom, setZoom] = useState<number>(18);
  const [renderTick, setRenderTick] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 360,
    height: 220,
  });

  // Native Mapbox GL JS instance refs
  const mapboxContainerRef = useRef<HTMLDivElement>(null);
  const mapboxInstanceRef = useRef<mapboxgl.Map | null>(null);

  // Fallback Canvas engine refs
  const fallbackContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapDragRef = useRef<{
    startX: number;
    startY: number;
    startCenterLat: number;
    startCenterLng: number;
    isMoving: boolean;
  } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize precise container dimensions using ResizeObserver
  useEffect(() => {
    const el = fallbackContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateSize();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const triggerReverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(async () => {
        if (!onAddressResolved) return;
        try {
          const res = await fetch("/api/geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon: lng }),
          });
          const data = await res.json();
          if (data?.success && data?.data) {
            const sanitized = {
              ...data.data,
              street: (data.data.street || "").replace(/^(?:calle\s+)?s\/?n$/i, "").trim()
            };
            onAddressResolved(sanitized);
          }
        } catch {
          // Ignore reverse geocode network errors silently
        }
      }, 350);
    },
    [onAddressResolved]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 1. Initialize Official Mapbox GL JS (`mapbox-gl`) when NEXT_PUBLIC_MAPBOX_TOKEN is present
  useEffect(() => {
    if (!hasValidMapboxToken || !useNativeMapbox || !mapboxContainerRef.current) return;
    if (mapboxInstanceRef.current) return;

    try {
      mapboxgl.accessToken = envToken;

      const map = new mapboxgl.Map({
        container: mapboxContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [validInitLng, validInitLat],
        zoom: 17.5,
        attributionControl: false,
      });

      map.on("error", (err) => {
        if (
          err?.error?.message?.toLowerCase().includes("token") ||
          err?.error?.message?.toLowerCase().includes("unauthorized") ||
          (err as { status?: number })?.status === 401
        ) {
          setUseNativeMapbox(false);
        }
      });

      map.on("move", () => {
        setIsPanning(true);
        const curCenter = map.getCenter();
        setCenter({ lat: curCenter.lat, lng: curCenter.lng });
        onLocationSelect(curCenter.lat, curCenter.lng);
      });

      map.on("moveend", () => {
        setIsPanning(false);
        const curCenter = map.getCenter();
        setCenter({ lat: curCenter.lat, lng: curCenter.lng });
        onLocationSelect(curCenter.lat, curCenter.lng);
        triggerReverseGeocode(curCenter.lat, curCenter.lng);
      });

      mapboxInstanceRef.current = map;
    } catch {
      setUseNativeMapbox(false);
    }

    return () => {
      if (mapboxInstanceRef.current) {
        try {
          mapboxInstanceRef.current.remove();
        } catch {}
        mapboxInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidMapboxToken, useNativeMapbox]);

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
        setZoom(18);

        if (useNativeMapbox && mapboxInstanceRef.current) {
          try {
            mapboxInstanceRef.current.flyTo({
              center: [initialLng, initialLat],
              zoom: 18,
              essential: true,
            });
          } catch {}
        }
      }
    }
  }, [initialLat, initialLng, useNativeMapbox]);

  // Screen to LatLng coordinate projection relative to viewport center
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

  // Wheel zoom prevention: Zoom map smoothly without scrolling window
  useEffect(() => {
    const el = fallbackContainerRef.current;
    if (!el || useNativeMapbox) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = -Math.sign(e.deltaY) * 0.5;
      setZoom((curZ) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, curZ + delta));
        return Number(next.toFixed(2));
      });
      triggerReverseGeocode(center.lat, center.lng);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [useNativeMapbox, center.lat, center.lng, triggerReverseGeocode]);

  // Fallback Canvas Rendering Loop
  useEffect(() => {
    if (useNativeMapbox) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, width, height);

    const maxNative = 20;
    const zTile = Math.max(3, Math.min(maxNative, Math.round(zoom)));
    const scaleFactor = Math.pow(2, zoom - zTile);
    const drawnTileSize = TILE_SIZE * scaleFactor;

    const centerTileX = lngToTileX(center.lng, zTile);
    const centerTileY = latToTileY(center.lat, zTile);

    const halfCols = Math.ceil(width / drawnTileSize / 2) + 1;
    const halfRows = Math.ceil(height / drawnTileSize / 2) + 1;

    const minX = Math.floor(centerTileX) - halfCols;
    const maxX = Math.floor(centerTileX) + halfCols;
    const minY = Math.max(0, Math.floor(centerTileY) - halfRows);
    const maxY = Math.min(Math.pow(2, zTile) - 1, Math.floor(centerTileY) + halfRows);

    const loadTile = (zLevel: number, tx: number, ty: number) => {
      const url = getFallbackTileUrl(zLevel, tx, ty);
      const cached = miniTileCache.get(url);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        return cached;
      }
      if (!cached) {
        const img = new Image();
        img.decoding = "async";
        miniTileCache.set(url, img);
        img.onload = () => setRenderTick((t) => t + 1);
        img.src = url;
      }
      return null;
    };

    for (let tx = minX; tx <= maxX; tx++) {
      for (let ty = minY; ty <= maxY; ty++) {
        const drawX = width / 2 + (tx - centerTileX) * drawnTileSize;
        const drawY = height / 2 + (ty - centerTileY) * drawnTileSize;

        const exactImg = loadTile(zTile, tx, ty);
        if (exactImg) {
          ctx.drawImage(exactImg, drawX, drawY, drawnTileSize + 0.5, drawnTileSize + 0.5);
          continue;
        }

        // Ancestor fallback (zTile - 1, zTile - 2) so zooming never flashes empty squares
        for (let dz = 1; dz <= 3; dz++) {
          const ancZ = zTile - dz;
          if (ancZ < 2) break;
          const div = 1 << dz;
          const ax = Math.floor(tx / div);
          const ay = Math.floor(ty / div);
          const ancImg = loadTile(ancZ, ax, ay);
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
              drawX,
              drawY,
              drawnTileSize + 0.5,
              drawnTileSize + 0.5
            );
            break;
          }
        }
      }
    }
    ctx.restore();
  }, [useNativeMapbox, center.lat, center.lng, zoom, renderTick, dimensions]);

  // Background Map Panning & Tap-To-Center
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox) return;
    mapDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCenterLat: center.lat,
      startCenterLng: center.lng,
      isMoving: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox) return;
    const start = mapDragRef.current;
    if (!start) return;

    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;

    if (!start.isMoving && Math.hypot(dx, dy) > 4) {
      start.isMoving = true;
      setIsPanning(true);
    }

    if (start.isMoving) {
      const startTileX = lngToTileX(start.startCenterLng, zoom);
      const startTileY = latToTileY(start.startCenterLat, zoom);
      const nextLng = tileXToLng(startTileX - dx / TILE_SIZE, zoom);
      const nextLat = tileYToLat(startTileY - dy / TILE_SIZE, zoom);
      const nextCenter = {
        lat: Math.max(-85, Math.min(85, nextLat)),
        lng: Math.max(-180, Math.min(180, nextLng)),
      };
      setCenter(nextCenter);
      prevPropsRef.current = nextCenter;
      onLocationSelect(nextCenter.lat, nextCenter.lng);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox) return;
    const start = mapDragRef.current;
    mapDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const container = fallbackContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (start && start.isMoving) {
      // Finished panning: drop pin with bounce and reverse-geocode
      setIsPanning(false);
      triggerReverseGeocode(center.lat, center.lng);
    } else {
      // User tapped or clicked anywhere without panning: Center that exact spot right under the pin!
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const clicked = screenToLatLng(px, py, rect.width, rect.height);
      setCenter(clicked);
      prevPropsRef.current = clicked;
      onLocationSelect(clicked.lat, clicked.lng);
      triggerReverseGeocode(clicked.lat, clicked.lng);
    }
  };

  const handleZoomStep = (delta: number) => {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    if (nextZoom === zoom) return;

    if (useNativeMapbox && mapboxInstanceRef.current) {
      try {
        mapboxInstanceRef.current.zoomTo(nextZoom);
      } catch {}
    } else {
      setZoom(nextZoom);
      triggerReverseGeocode(center.lat, center.lng);
    }
  };

  const handleRecenter = () => {
    const target = { lat: validInitLat, lng: validInitLng };
    if (useNativeMapbox && mapboxInstanceRef.current) {
      try {
        mapboxInstanceRef.current.flyTo({ center: [target.lng, target.lat], zoom: 18 });
      } catch {}
    } else {
      setCenter(target);
      setZoom(18);
      prevPropsRef.current = target;
      onLocationSelect(target.lat, target.lng);
      triggerReverseGeocode(target.lat, target.lng);
    }
  };

  return (
    <div
      data-lenis-prevent="true"
      className={`relative select-none ${className}`}
    >
      {/* 1. Native Mapbox GL JS Container (Active when valid NEXT_PUBLIC_MAPBOX_TOKEN is present) */}
      {useNativeMapbox ? (
        <div ref={mapboxContainerRef} className="w-full h-full" />
      ) : (
        /* 2. High-Performance Instant Satellite Hybrid Canvas Map with Center Pin */
        <div
          ref={fallbackContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: "none" }}
          className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            style={{
              filter: "contrast(1.06) saturate(1.1)",
            }}
            className="w-full h-full block"
          />

          {/* Target Reticle on Ground: Permanently anchored at viewport center (0 pixel drift on zoom) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div
              className={`w-6 h-6 rounded-full border-2 border-blue-400 bg-blue-500/20 transition-all duration-200 ${
                isPanning ? "scale-125 opacity-100 animate-ping" : "scale-75 opacity-40"
              }`}
            />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-sm" />
          </div>

          {/* Center Delivery Pin: Permanently fixed at viewport center with tactile elevation on pan */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-20">
            <div
              className={`relative flex flex-col items-center select-none transition-transform duration-200 ease-out ${
                isPanning
                  ? "-translate-y-3.5 scale-110"
                  : "translate-y-0 scale-100"
              }`}
            >
              {/* Pin Head */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 border-2 border-white shadow-[0_6px_16px_rgba(37,99,235,0.5)] flex items-center justify-center text-white">
                <div className="w-3 h-3 rounded-full bg-white shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
              </div>

              {/* Needle Tip */}
              <div className="w-1.5 h-3 bg-blue-600 -mt-0.5 rounded-b-full shadow-sm" />

              {/* Dynamic Ground Shadow */}
              <div
                className={`rounded-full bg-black/45 blur-[1px] mt-0.5 transition-all duration-200 ${
                  isPanning ? "w-2.5 h-0.5 opacity-25 blur-[2px]" : "w-4 h-1 opacity-70"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top Banner: Guidance */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
        <div className="bg-white/95 dark:bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 shadow-sm flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isPanning ? "bg-amber-500 animate-ping" : "bg-blue-600 animate-pulse"
            }`}
          />
          <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 leading-none">
            {isPanning
              ? "Suelta para fijar la ubicación exacta"
              : "Mueve el mapa o toca tu casa para fijar la entrega"}
          </span>
        </div>
      </div>

      {/* Zoom & Recenter Controls */}
      <div
        className="absolute bottom-2.5 right-2.5 flex flex-col gap-1 pointer-events-auto z-10"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => handleZoomStep(1)}
          title={zoom >= MAX_ZOOM ? "Zoom máximo alcanzado" : "Acercar (Ver casas y tejados)"}
          className={`w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center transition-all ${
            zoom >= MAX_ZOOM
              ? "opacity-35 cursor-not-allowed text-gray-400"
              : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer active:scale-95"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => handleZoomStep(-1)}
          title={zoom <= MIN_ZOOM ? "Zoom mínimo alcanzado" : "Alejar"}
          className={`w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center transition-all ${
            zoom <= MIN_ZOOM
              ? "opacity-35 cursor-not-allowed text-gray-400"
              : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer active:scale-95"
          }`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          title="Centrar en mi ubicación GPS"
          className="w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer active:scale-95 transition-all"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live Coordinates Badge */}
      <div className="absolute bottom-2.5 left-2.5 bg-white/95 dark:bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 shadow-sm pointer-events-none z-10">
        <span className="text-[10px] font-mono font-semibold text-gray-700 dark:text-gray-300">
          {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
        </span>
      </div>
    </div>
  );
}
