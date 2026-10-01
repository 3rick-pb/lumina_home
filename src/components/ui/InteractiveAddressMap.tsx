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

type MiniMapStyle = "streets-v12" | "dark-v11" | "satellite-streets-v12";

const TILE_SIZE = 256;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;

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

function getFallbackTileUrl(
  _style: MiniMapStyle,
  z: number,
  x: number,
  y: number
): string {
  // Google Maps Satélite Híbrido con Calles (Satellite Streets - lyrs=y)
  const safeZ = Math.max(1, Math.min(18, z));
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
  const [mapStyle] = useState<MiniMapStyle>("satellite-streets-v12");
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
  const [isDraggingPin, setIsDraggingPin] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 360,
    height: 220,
  });

  // Refs for Native Mapbox GL JS instance
  const mapboxContainerRef = useRef<HTMLDivElement>(null);
  const mapboxInstanceRef = useRef<mapboxgl.Map | null>(null);
  const mapboxMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Refs for Fallback Canvas engine
  const fallbackContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapDragRef = useRef<{
    startX: number;
    startY: number;
    startCenterLat: number;
    startCenterLng: number;
    isPanning: boolean;
  } | null>(null);

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
        setCenter({ lat: lngLat.lat, lng: lngLat.lng });
        onLocationSelect(lngLat.lat, lngLat.lng);
        triggerReverseGeocode(lngLat.lat, lngLat.lng);
      });

      map.on("click", (ev) => {
        const { lat, lng } = ev.lngLat;
        marker.setLngLat([lng, lat]);
        setPin({ lat, lng });
        setCenter({ lat, lng });
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

  // Coordinate projections
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

  // Wheel zoom prevention: Zoom map without scrolling window
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
      // Keep center locked to pin during wheel zoom so anchor never shifts
      setCenter({ lat: pin.lat, lng: pin.lng });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [useNativeMapbox, pin.lat, pin.lng]);

  // Fallback Canvas Rendering
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

    const maxNative = 18;
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

    const loadTile = (style: MiniMapStyle, zLevel: number, tx: number, ty: number) => {
      const url = getFallbackTileUrl(style, zLevel, tx, ty);
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

        const exactImg = loadTile(mapStyle, zTile, tx, ty);
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
          const ancImg = loadTile(mapStyle, ancZ, ax, ay);
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
  }, [useNativeMapbox, center.lat, center.lng, zoom, mapStyle, renderTick, dimensions]);

  // Background Map Panning & Tap-To-Place
  const handleMapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox || isDraggingPin) return;
    mapDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCenterLat: center.lat,
      startCenterLng: center.lng,
      isPanning: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleMapPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox || isDraggingPin) return;
    const start = mapDragRef.current;
    if (!start) return;

    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;

    if (!start.isPanning && Math.hypot(dx, dy) > 5) {
      start.isPanning = true;
    }

    if (start.isPanning) {
      const startTileX = lngToTileX(start.startCenterLng, zoom);
      const startTileY = latToTileY(start.startCenterLat, zoom);
      const nextLng = tileXToLng(startTileX - dx / TILE_SIZE, zoom);
      const nextLat = tileYToLat(startTileY - dy / TILE_SIZE, zoom);
      setCenter({
        lat: Math.max(-85, Math.min(85, nextLat)),
        lng: Math.max(-180, Math.min(180, nextLng)),
      });
    }
  };

  const handleMapPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useNativeMapbox || isDraggingPin) return;
    const start = mapDragRef.current;
    mapDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const container = fallbackContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // If user clicked or tapped anywhere without panning: Teleport pin to that spot!
    if (!start || !start.isPanning) {
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const next = screenToLatLng(px, py, rect.width, rect.height);
      setPin(next);
      setCenter(next);
      prevPropsRef.current = next;
      onLocationSelect(next.lat, next.lng);
      triggerReverseGeocode(next.lat, next.lng);
    }
  };

  // Dedicated Tactile Pin Dragging
  const handlePinPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingPin(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePinPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPin) return;
    const container = fallbackContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const py = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const next = screenToLatLng(px, py, rect.width, rect.height);
    setPin(next);
    prevPropsRef.current = next;
    onLocationSelect(next.lat, next.lng);
  };

  const handlePinPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPin) return;
    setIsDraggingPin(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // Lock map center to the pin so zooming never drifts
    setCenter({ lat: pin.lat, lng: pin.lng });
    onLocationSelect(pin.lat, pin.lng);
    triggerReverseGeocode(pin.lat, pin.lng);
  };

  const pinScreen = latLngToScreen(
    pin.lat,
    pin.lng,
    dimensions.width,
    dimensions.height
  );

  const handleZoomStep = (delta: number) => {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    if (nextZoom === zoom) return;

    if (useNativeMapbox && mapboxInstanceRef.current) {
      try {
        mapboxInstanceRef.current.zoomTo(nextZoom);
      } catch {}
    } else {
      // Anchoring zoom strictly around the pin prevents any anchor movement or sliding!
      setCenter({ lat: pin.lat, lng: pin.lng });
      setZoom(nextZoom);
    }
  };

  const handleRecenter = () => {
    if (useNativeMapbox && mapboxInstanceRef.current) {
      try {
        mapboxInstanceRef.current.flyTo({ center: [pin.lng, pin.lat], zoom: 16 });
      } catch {}
    } else {
      setCenter({ lat: pin.lat, lng: pin.lng });
      setZoom(16);
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
        /* 2. High-Performance Instant Satellite Hybrid Canvas Map */
        <div
          ref={fallbackContainerRef}
          onPointerDown={handleMapPointerDown}
          onPointerMove={handleMapPointerMove}
          onPointerUp={handleMapPointerUp}
          style={{ touchAction: "none" }}
          className="w-full h-full cursor-crosshair relative overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            style={{
              filter: "contrast(1.06) saturate(1.1)",
            }}
            className="w-full h-full block"
          />

          {/* Dedicated Tactile Draggable Anchor Pin */}
          <div
            style={{
              transform: `translate3d(${pinScreen.x}px, ${pinScreen.y}px, 0)`,
            }}
            onPointerDown={handlePinPointerDown}
            onPointerMove={handlePinPointerMove}
            onPointerUp={handlePinPointerUp}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-full z-20 pointer-events-auto touch-none"
          >
            <div
              className={`relative flex flex-col items-center select-none cursor-grab active:cursor-grabbing ${
                isDraggingPin
                  ? "scale-115 -translate-y-3 transition-none"
                  : "scale-100 translate-y-0 transition-transform duration-150 ease-out"
              }`}
            >
              {/* Pulse reticle on ground directly under the needle tip when dragging */}
              {isDraggingPin && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 translate-y-1 pointer-events-none">
                  <div className="w-6 h-6 rounded-full border-2 border-blue-400 bg-blue-500/20 animate-ping -translate-x-1/2 -translate-y-1/2" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 -translate-x-1/2 -translate-y-1/2 shadow-sm" />
                </div>
              )}

              {/* Pin Head */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 border-2 border-white shadow-[0_4px_12px_rgba(37,99,235,0.45)] flex items-center justify-center text-white">
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-inner" />
              </div>

              {/* Needle Tip */}
              <div className="w-1 h-2.5 bg-blue-600 -mt-0.5 rounded-b-full shadow-sm" />

              {/* Drop Shadow */}
              <div
                className={`rounded-full bg-black/40 blur-[1px] mt-0.5 transition-all duration-150 ${
                  isDraggingPin ? "w-2 h-0.5 opacity-30 blur-[2px]" : "w-3.5 h-1 opacity-70"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top Banner: Guidance */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
        <div className="bg-white/95 dark:bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 leading-none">
            Toca el mapa o arrastra el pin
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
          title={zoom >= MAX_ZOOM ? "Zoom máximo alcanzado" : "Acercar"}
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
          title="Centrar en el pin"
          className="w-7 h-7 rounded-lg bg-white/95 dark:bg-black/85 border border-black/10 dark:border-white/15 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer active:scale-95 transition-all"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live Coordinates Badge */}
      <div className="absolute bottom-2.5 left-2.5 bg-white/95 dark:bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 shadow-sm pointer-events-none z-10">
        <span className="text-[10px] font-mono font-semibold text-gray-700 dark:text-gray-300">
          {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
        </span>
      </div>
    </div>
  );
}
