"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";

// Use environment variable for token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface InteractiveAddressMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

export default function InteractiveAddressMap({
  initialLat = -0.1807, // Default to Quito, Ecuador
  initialLng = -78.4678,
  onLocationSelect,
  className = "h-48 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10",
}: InteractiveAddressMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialLng, initialLat],
      zoom: 14,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: "#2563eb", // Blue marker
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    marker.current.on("dragend", () => {
      if (!marker.current) return;
      const lngLat = marker.current.getLngLat();
      onLocationSelect(lngLat.lat, lngLat.lng);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map and marker if props change (e.g. user hits Auto-detect)
  useEffect(() => {
    if (!map.current || !marker.current) return;
    
    // Only fly and update if the coordinates are significantly different
    // to avoid resetting while the user is dragging or adjusting
    const currentMarkerPos = marker.current.getLngLat();
    const isSame = 
      Math.abs(currentMarkerPos.lat - initialLat) < 0.00001 && 
      Math.abs(currentMarkerPos.lng - initialLng) < 0.00001;

    if (!isSame) {
      marker.current.setLngLat([initialLng, initialLat]);
      map.current.flyTo({
        center: [initialLng, initialLat],
        zoom: 15,
        essential: true,
      });
    }
  }, [initialLat, initialLng]);

  return (
    <div className={`relative ${className}`}>
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-[#1a1a1c] flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="ml-2 text-xs text-gray-500 font-medium">Cargando mapa interactivo...</span>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      {isMapLoaded && (
        <div className="absolute top-2 left-2 right-2 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/10 shadow-sm pointer-events-none z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">Arrastra el pin azul a tu ubicación exacta</span>
        </div>
      )}
    </div>
  );
}
