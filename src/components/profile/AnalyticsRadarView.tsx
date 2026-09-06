"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { 
  MapPin, 
  Search, 
  ShoppingBag, 
  ArrowUpRight, 
  Smartphone, 
  Monitor, 
  Tablet, 
  TrendingUp, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Compass, 
  Activity, 
  Users, 
  Sparkles,
  ChevronRight,
  X
} from "lucide-react";
import { useUserStore, type User, type ShippingAddress, type Order } from "@/lib/userStore";
import type { CatalogProduct } from "@/lib/catalogStore";
import { useRadarStore, cleanClientName, resolveCoordinates, type ConnectedClient } from "@/lib/radarStore";

export type { ConnectedClient } from "@/lib/radarStore";

interface AnalyticsRadarViewProps {
  user: User | null;
  addresses: ShippingAddress[];
  orders: Order[];
  products: CatalogProduct[];
  categories: string[];
  onNavigateToAddresses?: () => void;
}

// Coordenadas geográficas calibradas con el mapa oficial de las 24 Provincias de Ecuador
export const ECUADOR_PROVINCE_COORDINATES: Record<string, { x: number; y: number; province: string; region: "Sierra" | "Costa" | "Oriente" | "Galápagos" }> = {
  // Sierra (Cordillera de los Andes)
  "quito": { x: 48.8, y: 26.5, province: "Pichincha", region: "Sierra" },
  "pichincha": { x: 48.8, y: 26.5, province: "Pichincha", region: "Sierra" },
  "cuenca": { x: 40.5, y: 67.5, province: "Azuay", region: "Sierra" },
  "azuay": { x: 40.5, y: 67.5, province: "Azuay", region: "Sierra" },
  "ambato": { x: 50.5, y: 41.5, province: "Tungurahua", region: "Sierra" },
  "tungurahua": { x: 50.5, y: 41.5, province: "Tungurahua", region: "Sierra" },
  "latacunga": { x: 49.5, y: 35.0, province: "Cotopaxi", region: "Sierra" },
  "cotopaxi": { x: 49.5, y: 35.0, province: "Cotopaxi", region: "Sierra" },
  "riobamba": { x: 50.0, y: 49.0, province: "Chimborazo", region: "Sierra" },
  "chimborazo": { x: 50.0, y: 49.0, province: "Chimborazo", region: "Sierra" },
  "loja": { x: 37.5, y: 82.5, province: "Loja", region: "Sierra" },
  "ibarra": { x: 55.0, y: 17.5, province: "Imbabura", region: "Sierra" },
  "imbabura": { x: 55.0, y: 17.5, province: "Imbabura", region: "Sierra" },
  "tulcan": { x: 60.5, y: 12.0, province: "Carchi", region: "Sierra" },
  "carchi": { x: 60.5, y: 12.0, province: "Carchi", region: "Sierra" },
  "azogues": { x: 42.0, y: 63.5, province: "Cañar", region: "Sierra" },
  "cañar": { x: 42.0, y: 63.5, province: "Cañar", region: "Sierra" },
  "guaranda": { x: 45.0, y: 47.0, province: "Bolívar", region: "Sierra" },
  "bolivar": { x: 45.0, y: 47.0, province: "Bolívar", region: "Sierra" },

  // Costa (Calibrado con precisión a tierra firme, fuera de aguas del golfo)
  "guayaquil": { x: 35.5, y: 52.0, province: "Guayas", region: "Costa" },
  "guayas": { x: 35.5, y: 52.0, province: "Guayas", region: "Costa" },
  "manta": { x: 21.0, y: 39.5, province: "Manabí", region: "Costa" },
  "portoviejo": { x: 24.5, y: 41.0, province: "Manabí", region: "Costa" },
  "manabi": { x: 24.5, y: 41.0, province: "Manabí", region: "Costa" },
  "santo domingo": { x: 41.0, y: 29.5, province: "Sto. Domingo de los Tsáchilas", region: "Costa" },
  "machala": { x: 27.5, y: 69.5, province: "El Oro", region: "Costa" },
  "el oro": { x: 27.5, y: 69.5, province: "El Oro", region: "Costa" },
  "esmeraldas": { x: 38.0, y: 12.0, province: "Esmeraldas", region: "Costa" },
  "santa elena": { x: 25.0, y: 50.0, province: "Santa Elena", region: "Costa" },
  "salinas": { x: 24.4, y: 50.5, province: "Santa Elena", region: "Costa" },
  "babahoyo": { x: 34.0, y: 49.0, province: "Los Ríos", region: "Costa" },
  "los rios": { x: 34.0, y: 49.0, province: "Los Ríos", region: "Costa" },

  // Galápagos (Archipiélago)
  "galapagos": { x: 10.0, y: 22.0, province: "Galápagos", region: "Galápagos" },
  "baquerizo moreno": { x: 10.0, y: 22.0, province: "Galápagos", region: "Galápagos" },
  "santa cruz": { x: 10.0, y: 22.0, province: "Galápagos", region: "Galápagos" },

  // Amazonía / El Oriente
  "nueva loja": { x: 75.0, y: 22.0, province: "Sucumbíos", region: "Oriente" },
  "lago agrio": { x: 75.0, y: 22.0, province: "Sucumbíos", region: "Oriente" },
  "sucumbios": { x: 75.0, y: 22.0, province: "Sucumbíos", region: "Oriente" },
  "coca": { x: 73.0, y: 34.0, province: "Orellana", region: "Oriente" },
  "orellana": { x: 73.0, y: 34.0, province: "Orellana", region: "Oriente" },
  "tena": { x: 62.0, y: 39.0, province: "Napo", region: "Oriente" },
  "napo": { x: 62.0, y: 39.0, province: "Napo", region: "Oriente" },
  "puyo": { x: 63.0, y: 49.0, province: "Pastaza", region: "Oriente" },
  "pastaza": { x: 63.0, y: 49.0, province: "Pastaza", region: "Oriente" },
  "macas": { x: 58.0, y: 56.0, province: "Morona Santiago", region: "Oriente" },
  "morona santiago": { x: 58.0, y: 56.0, province: "Morona Santiago", region: "Oriente" },
  "zamora": { x: 48.0, y: 83.0, province: "Zamora Chinchipe", region: "Oriente" },
  "zamora chinchipe": { x: 48.0, y: 83.0, province: "Zamora Chinchipe", region: "Oriente" }
};

export default function AnalyticsRadarView(props: AnalyticsRadarViewProps) {
  // Interaction & filter states
  const [hoveredClientId, setHoveredClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [lastActiveClient, setLastActiveClient] = useState<ConnectedClient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [activeStage, setActiveStage] = useState<"all" | "cart" | "frequent">("all");
  const [activeTab, setActiveTab] = useState<"metrics" | "clients">("metrics");
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  // Preload optimized WebP 3D relief landmass (< 480KB) for instant load
  useEffect(() => {
    const img = new Image();
    img.src = "/images/map_3d_relief_cutout.webp";
    img.onload = () => setIsMapLoaded(true);
    img.onerror = () => setIsMapLoaded(true);
  }, []);

  // Keyboard shortcut: Escape to deselect active client
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedClientId(null);
        setHoveredClientId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Zoom & Pan states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapLayerTransformRef = useRef<HTMLDivElement>(null);
  const clientsListRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const fetchActiveClients = useRadarStore((state) => state.fetchActiveClients);
  const currentUser = useUserStore((state) => state.user);
  const userAddress = useUserStore((state) => state.address);
  const userAddresses = useUserStore((state) => state.addresses);
  const userOrders = useUserStore((state) => state.orders);

  const isAdmin = (currentUser?.role === 'ADMIN') || (props.user?.role === 'ADMIN');

  // Authoritative location of the active viewer directly from the user store
  const currentUserCity = useMemo(() => {
    return userAddress?.city || props.addresses?.[0]?.city || userAddresses?.[0]?.city || "";
  }, [userAddress, props.addresses, userAddresses]);

  // Determine if a client is the current logged in viewer ("Tú")
  const isUserSelf = useCallback((c?: { id?: string; email?: string } | null) => {
    if (!c || !currentUser) return false;
    if (currentUser.id && c.id && currentUser.id === c.id) return true;
    if (currentUser.email && c.email && currentUser.email.toLowerCase() === c.email.toLowerCase()) return true;
    return false;
  }, [currentUser]);

  // Check whether an entity is an administrator (Admins are NOT clients!)
  const isClientAdmin = useCallback((c?: { id?: string; email?: string; name?: string } | null) => {
    if (!c) return false;
    if (isUserSelf(c) && isAdmin) return true;
    if (c.name && c.name.toLowerCase().includes('admin')) return true;
    if (c.email && c.email.toLowerCase().includes('admin')) return true;
    return false;
  }, [isUserSelf, isAdmin]);

  // Verify whether the Admin has a configured shipping/location address
  const hasAdminLocation = useMemo(() => {
    if (!isAdmin) return true;
    return Boolean(currentUserCity.trim());
  }, [isAdmin, currentUserCity]);

  const handleNavigateToAddress = () => {
    if (props.onNavigateToAddresses) {
      props.onNavigateToAddresses();
    } else if (typeof window !== "undefined") {
      window.location.href = "/profile?tab=settings&addAddress=true";
    }
  };

  // Real-time clients synchronized via centralized radarStore (Real authenticated accounts only)
  const rawConnectedClients = useRadarStore((state) => state.clients);
  const connectedClients = useMemo(() => {
    const list = Array.isArray(rawConnectedClients) 
      ? rawConnectedClients.filter(c => 
          c && 
          c.id && 
          !c.id.startsWith('vis_') && 
          !c.id.startsWith('guest_') && 
          !c.name?.toLowerCase().includes('visitante')
        )
      : [];

    let foundSelf = false;
    const mapped = list.map(c => {
      if (isUserSelf(c)) {
        foundSelf = true;
        const selfCity = currentUserCity || c.city || "";
        const coords = selfCity ? resolveCoordinates(selfCity) : { x: -100, y: -100 };
        return {
          ...c,
          name: cleanClientName(currentUser?.name || c.name),
          city: selfCity,
          x: coords.x,
          y: coords.y,
          currentSection: isAdmin ? "Mi Perfil / Mapa" : (c.currentSection || "Explorando Tienda"),
        };
      }
      return c;
    });

    if (!foundSelf && currentUser?.id && !currentUser.id.startsWith('vis_') && !currentUser.id.startsWith('guest_')) {
      const selfCity = currentUserCity;
      const coords = selfCity ? resolveCoordinates(selfCity) : { x: -100, y: -100 };
      const spent = userOrders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;
      const purchases = userOrders?.length || 0;
      mapped.unshift({
        id: currentUser.id,
        name: cleanClientName(currentUser.name || currentUser.email.split('@')[0]),
        email: currentUser.email || '',
        city: selfCity,
        country: 'Ecuador',
        x: coords.x,
        y: coords.y,
        frequency: purchases >= 12 ? 'Semanal' : purchases >= 6 ? 'Quincenal' : purchases >= 3 ? 'Mensual' : purchases >= 1 ? 'Ocasional' : '1ª Vez',
        purchasesCount: purchases,
        totalSpent: spent,
        currentSection: isAdmin ? "Mi Perfil / Mapa" : "Panel Radar / Métricas",
        intentScore: 90,
        device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Celular' : 'Computador',
        hasCart: false,
        cartItemsCount: 0,
        isRealUser: true,
      });
    }

    return mapped;
  }, [rawConnectedClients, isUserSelf, currentUserCity, isAdmin, currentUser, userOrders]);

  // Actual clients connected (Administrators do NOT count as clients!)
  const actualClients = useMemo(() => {
    return connectedClients.filter(c => !isClientAdmin(c));
  }, [connectedClients, isClientAdmin]);

  // Guarantee the active logged-in user is immediately registered and visible on the radar ("Tú")
  useEffect(() => {
    if (currentUser?.id && !currentUser.id.startsWith('vis_') && !currentUser.id.startsWith('guest_')) {
      const city = currentUserCity;
      const spent = userOrders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;
      const purchases = userOrders?.length || 0;
      const section = isAdmin ? "Mi Perfil / Mapa" : "Panel Radar / Métricas";
      useRadarStore.getState().initRadar(currentUser, city, spent, purchases, section);
      useRadarStore.getState().trackActivity(currentUser, city, spent, purchases, section);
    }
  }, [currentUser, currentUserCity, userOrders, isAdmin]);

  // Fast live polling (1.2s): ensures the dossier and metrics update live automatically
  useEffect(() => {
    fetchActiveClients();
    const pollInterval = setInterval(() => {
      fetchActiveClients();
    }, 1200);
    return () => clearInterval(pollInterval);
  }, [fetchActiveClients]);

  // Dynamically resolve LIVE client objects from the reactive connectedClients array
  const hoveredClient = useMemo(() => {
    if (!hoveredClientId) return null;
    return connectedClients.find(c => c.id === hoveredClientId) || null;
  }, [hoveredClientId, connectedClients]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return connectedClients.find(c => c.id === selectedClientId) || null;
  }, [selectedClientId, connectedClients]);

  // Filtered actual clients list (Excludes administrators from client lists and metrics)
  const filteredActualClients = useMemo(() => {
    if (!Array.isArray(actualClients)) return [];
    return actualClients.filter(c => {
      if (!c) return false;
      if (activeStage === "cart" && !c.hasCart) return false;
      if (activeStage === "frequent" && ((c.purchasesCount || 0) < 3 || c.frequency === "1ª Vez")) return false;

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.country && c.country.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.currentSection && c.currentSection.toLowerCase().includes(q))
        ) return true;

        if (c.city) {
          const matchedEntry = Object.entries(ECUADOR_PROVINCE_COORDINATES).find(([k]) => c.city && c.city.toLowerCase().includes(k));
          if (matchedEntry) {
            const { province, region } = matchedEntry[1];
            if (province && province.toLowerCase().includes(q)) return true;
            if (region && region.toLowerCase().includes(q)) return true;
            if ((q === "amazonia" || q === "amazonía") && region && region.toLowerCase() === "oriente") return true;
          }
        }

        return false;
      }
      return true;
    });
  }, [actualClients, activeStage, searchQuery]);

  // Map Beacons: Both actual clients and the Admin (if address exists) are visible on the physical map terrain
  const mapVisibleClients = useMemo(() => {
    return connectedClients.filter(c => {
      if (typeof c.x !== 'number' || typeof c.y !== 'number' || c.x < 0 || c.y < 0) return false;
      const isSelf = isUserSelf(c);
      const city = isSelf ? currentUserCity : c.city;
      if (!city || !city.trim()) return false;
      if (isSelf && isAdmin && !hasAdminLocation) return false;
      return true;
    });
  }, [connectedClients, isUserSelf, currentUserCity, isAdmin, hasAdminLocation]);

  // Natural Zoom handling via mouse wheel & laptop trackpad (2 fingers up / down)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;

    setZoom(prev => {
      const next = Math.min(Math.max(prev * factor, 0.75), 4.5);
      return Number(next.toFixed(2));
    });
  }, []);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Scroll handler for the clients list to update the luminous green vertical bar
  const handleClientsScroll = () => {
    const el = clientsListRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      // DIRECT DOM MUTATION: Bypasses React rendering entirely during scroll frames for extreme performance
      const progress = el.scrollTop / maxScroll;
      if (scrollTrackRef.current) {
        scrollTrackRef.current.style.top = `${progress * 68}%`;
      }
    }
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newX = panStartRef.current.x + dx;
    const newY = panStartRef.current.y + dy;
    // DIRECT DOM MUTATION: Bypasses React rendering entirely during drag frames for extreme performance
    if (mapLayerTransformRef.current) {
      mapLayerTransformRef.current.style.transform = `translate(${newX}px, ${newY}px) scale(${zoom})`;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      // Sync state back on drag end to ensure consistency on next React render
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy
      });
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(Number((prev * 1.25).toFixed(2)), 4.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(Number((prev * 0.8).toFixed(2)), 0.75));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Smooth camera fly-to function for cities and coordinates
  const focusOnLocation = useCallback((xPct: number, yPct: number, zoomLevel: number = 1.6) => {
    const targetPanX = Math.round((50 - xPct) * 5.4 * (zoomLevel / 1.5));
    const targetPanY = Math.round((50 - yPct) * 3.8 * (zoomLevel / 1.5));
    setZoom(zoomLevel);
    setPan({ x: targetPanX, y: targetPanY });
  }, []);

  const activeHUDClient = hoveredClient || selectedClient;

  // Helper to extract full clean city name (e.g. "Santo Domingo", "Quito") before parentheses or hyphens
  const formatBeaconCity = (cityStr: string) => {
    if (!cityStr) return "Ecuador";
    let clean = cityStr;
    // If formatted like "Santo Domingo - La Concordia", extract city before hyphen
    if (clean.includes(" - ")) {
      clean = clean.split(" - ")[0].trim();
    } else if (clean.includes("-") && !clean.includes(" (")) {
      clean = clean.split("-")[0].trim();
    }
    // Remove province or additional info in parentheses
    if (clean.includes("(")) {
      clean = clean.split("(")[0].trim();
    }
    return clean.trim() || cityStr;
  };

  // Preserve last active client data during collapse animation
  useEffect(() => {
    if (activeHUDClient) {
      setLastActiveClient(activeHUDClient);
    }
  }, [activeHUDClient]);

  const displayedDossierClient = activeHUDClient || lastActiveClient;

  return (
    <div 
      className="relative w-full h-[660px] lg:h-[720px] rounded-[2.5rem] overflow-hidden bg-[#181d1b] text-white shadow-xl shadow-black/20 dark:shadow-none border border-white/10 select-none animate-fade-in font-sans"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      
      {/* ========================================================================= */}
      {/* 1. SCENIC BACKGROUND & ATMOSPHERE                                         */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#232a27] via-[#1a201e] to-[#131715] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-80 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* 2. THE MAIN HERO: PROTAGONIC 3D RELIEF MAP (4K HIGH DEFINITION)           */}
      {/* ========================================================================= */}
      <div 
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onClick={() => setSelectedClientId(null)}
        className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Zoomed & Panned 3D Terrain Wrapper */}
        <div 
          ref={mapLayerTransformRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          className="relative w-[780px] lg:w-[920px] aspect-[1024/682] flex items-center justify-center pointer-events-auto shrink-0"
        >
          {/* Ambient Ground Shadow */}
          <div className="absolute inset-x-12 bottom-4 h-32 bg-black/75 blur-3xl rounded-full pointer-events-none -z-10" />

          {/* Smooth Radar Loading Spinner while WebP decodes (sub-100ms) */}
          {!isMapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none z-10">
              <div className="w-9 h-9 rounded-full border-2 border-[#ccff00]/30 border-t-[#ccff00] animate-spin" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">Cargando topografía 3D...</span>
            </div>
          )}

          {/* Authentic 4K High-Res Transparent 3D Relief Landmass (Instant WebP < 480KB) */}
          <picture className="w-full h-full pointer-events-none select-none">
            <source srcSet="/images/map_3d_relief_cutout.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/images/map_3d_relief_cutout.png" 
              alt="Mapa 3D Topográfico en Relieve del Territorio de Ecuador en Alta Resolución"
              draggable={false}
              loading="eager"
              onLoad={() => setIsMapLoaded(true)}
              className={`w-full h-full object-contain pointer-events-none select-none filter contrast-110 brightness-105 drop-shadow-[0_28px_40px_rgba(0,0,0,0.7)] transition-opacity duration-300 ${
                isMapLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </picture>

          {/* Interactive Geographic Beacons Calibrated by Province (Only clients with valid addresses) */}
          {mapVisibleClients.map((client) => {
            const isHovered = hoveredClient?.id === client.id;
            const isSelected = selectedClient?.id === client.id;
            const isActive = isHovered || isSelected;
            const isSelf = isUserSelf(client);

            return (
              <div 
                key={client.id}
                style={{
                  left: `${client.x}%`,
                  top: `${client.y}%`
                }}
                className="absolute z-30 -translate-x-1/2 -translate-y-full cursor-pointer group"
                onMouseEnter={() => setHoveredClientId(client.id)}
                onMouseLeave={() => setHoveredClientId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClientId(prev => prev === client.id ? null : client.id);
                }}
              >
                {/* Pulsing Ground Halo */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none">
                  <span className={`block rounded-full ${
                    isSelf 
                      ? "w-4 h-4 bg-emerald-400 animate-ping shadow-[0_0_14px_#34d399]" 
                      : "w-3 h-3 bg-[#ccff00] animate-ping shadow-[0_0_12px_#ccff00]"
                  }`} />
                </div>

                {/* Beacon Head & Stem */}
                <div className="flex flex-col items-center">
                  <div className={`relative transition-all duration-300 flex items-center justify-center rounded-full border shadow-xl ${
                    isActive 
                      ? "scale-125 z-40 bg-white text-gray-950 border-[#ccff00] shadow-[0_0_24px_#ccff00]" 
                      : isSelf 
                      ? "bg-emerald-400 text-gray-950 border-white shadow-[0_0_16px_#34d399]" 
                      : "bg-[#ccff00] text-gray-950 border-white/90 shadow-[0_0_14px_#ccff00]"
                  } w-6 h-6`}>
                    {client.device === "Computador" ? (
                      <Monitor className="w-3 h-3 shrink-0" />
                    ) : client.device === "Celular" ? (
                      <Smartphone className="w-3 h-3 shrink-0" />
                    ) : (
                      <Tablet className="w-3 h-3 shrink-0" />
                    )}

                    {client.hasCart && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
                    )}
                  </div>

                  {/* Vertical Pin Line */}
                  <div className={`w-[2px] transition-all duration-300 ${
                    isActive 
                      ? "h-9 bg-gradient-to-t from-[#ccff00] to-white shadow-[0_0_12px_#ccff00]" 
                      : isSelf
                      ? "h-7 bg-gradient-to-t from-emerald-400 to-white shadow-[0_0_8px_#34d399]"
                      : "h-7 bg-gradient-to-t from-[#ccff00] to-yellow-200 shadow-[0_0_8px_#ccff00]"
                  }`} />
                  <div className="w-1 h-1 bg-[#ccff00] rotate-45 shadow-[0_0_6px_#ccff00]" />
                </div>

                {/* City & Province Tag Label (Shows complete city name e.g. "Santo Domingo") */}
                <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider transition-all pointer-events-none ${
                  isActive 
                    ? "bg-white text-gray-950 shadow-md scale-105" 
                    : "bg-black/85 text-white/90 border border-white/10 backdrop-blur-md"
                }`}>
                  {formatBeaconCity(client.city || "Ecuador")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP FLOATING BAR (Minimal Header Capsule)                              */}
      {/* ========================================================================= */}
      <div className="absolute top-5 left-6 right-6 lg:right-96 z-50 flex items-center justify-between gap-3 pointer-events-none">
        
        {/* Interactive Dynamic Search Capsule & Live Suggester */}
        <div 
          ref={searchContainerRef}
          className="relative max-w-md w-full pointer-events-auto"
        >
          {/* Main Search Pill */}
          <div className={`flex items-center bg-black/75 backdrop-blur-2xl border rounded-full px-3.5 py-2 shadow-2xl text-xs text-white w-full transition-all duration-300 ${
            isSearchFocused 
              ? "border-[#ccff00] ring-2 ring-[#ccff00]/30 shadow-[0_0_24px_rgba(204,255,0,0.25)] bg-black/90" 
              : "border-white/15 hover:border-white/30"
          }`}>
            <div className="flex items-center gap-2 pr-3 border-r border-white/10 shrink-0">
              <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-[#ccff00] to-white text-gray-950 font-black text-xs flex items-center justify-center shadow-[0_0_10px_#ccff00]/40">
                L
              </div>
              <span className="font-extrabold tracking-wider text-xs hidden sm:inline font-mono text-[#ccff00]">RADAR</span>
            </div>

            <Search className={`w-3.5 h-3.5 mx-2 shrink-0 transition-colors duration-200 ${isSearchFocused ? "text-[#ccff00]" : "text-white/50"}`} />
            
            <input 
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar ciudad, provincia o región..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/45 flex-1 min-w-0"
            />

            {/* Clear Search Button */}
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  handleResetView();
                }}
                className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer mr-1.5 shrink-0"
                title="Limpiar búsqueda"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}

            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 shrink-0">
              <span className={`w-2 h-2 rounded-full transition-colors ${
                searchQuery ? "bg-[#ccff00] shadow-[0_0_8px_#ccff00]" : "bg-emerald-400 animate-pulse"
              }`} />
              <span className="text-[10px] font-mono text-white/80 font-semibold">
                {searchQuery ? `${filteredActualClients.length} en radar` : "24 Provincias"}
              </span>
            </div>
          </div>

          {/* FLOATING LIVE INTERACTIVE SUGGESTER & REGIONAL TELEPORT POPOVER */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-3xl bg-[#111614]/95 backdrop-blur-3xl border border-white/20 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[70] animate-fade-in space-y-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
              
              {/* 1. Quick Regional Filters */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-white/50 font-bold uppercase tracking-wider">
                  <span>Regiones Naturales</span>
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(""); handleResetView(); }} 
                      className="text-[#ccff00] hover:underline normal-case font-sans cursor-pointer text-[11px]"
                    >
                      Ver todo Ecuador
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { name: "Sierra", icon: "🏔️", query: "Sierra" },
                    { name: "Costa", icon: "🌊", query: "Costa" },
                    { name: "Amazonía", icon: "🌿", query: "Oriente" },
                    { name: "Galápagos", icon: "🐢", query: "Galápagos" },
                  ].map((reg) => {
                    const isActive = searchQuery.toLowerCase() === reg.query.toLowerCase() || (reg.name === "Amazonía" && (searchQuery.toLowerCase() === "amazonia" || searchQuery.toLowerCase() === "oriente"));
                    return (
                      <button
                        key={reg.name}
                        onClick={() => {
                          setSearchQuery(reg.query);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                          isActive
                            ? "bg-[#ccff00] text-gray-950 font-bold border-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.4)]"
                            : "bg-white/5 hover:bg-white/15 text-white/80 border-white/10 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span>{reg.icon}</span>
                        <span>{reg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Key Cities Quick Teleport */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px] font-mono text-white/50 font-bold uppercase tracking-wider">
                  <span>Explorar Ciudades</span>
                  <span className="text-[9.5px] font-mono text-[#ccff00] flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> Clic para enfocar
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { city: "Quito", coords: ECUADOR_PROVINCE_COORDINATES["quito"] },
                    { city: "Guayaquil", coords: ECUADOR_PROVINCE_COORDINATES["guayaquil"] },
                    { city: "Cuenca", coords: ECUADOR_PROVINCE_COORDINATES["cuenca"] },
                    { city: "Santo Domingo", coords: ECUADOR_PROVINCE_COORDINATES["santo domingo"] },
                    { city: "Manta", coords: ECUADOR_PROVINCE_COORDINATES["manta"] },
                    { city: "Ambato", coords: ECUADOR_PROVINCE_COORDINATES["ambato"] },
                    { city: "Loja", coords: ECUADOR_PROVINCE_COORDINATES["loja"] },
                    { city: "Puyo", coords: ECUADOR_PROVINCE_COORDINATES["puyo"] },
                    { city: "Galápagos", coords: ECUADOR_PROVINCE_COORDINATES["galapagos"] },
                  ].map(({ city, coords }) => {
                    const clientMatch = connectedClients.find(c => c && c.city && c.city.toLowerCase().includes(city.toLowerCase()));
                    return (
                      <button
                        key={city}
                        onClick={() => {
                          setSearchQuery(city);
                          if (coords) {
                            focusOnLocation(coords.x, coords.y, 1.8);
                          }
                          if (clientMatch) {
                            setSelectedClientId(clientMatch.id);
                          }
                          setIsSearchFocused(false);
                        }}
                        className="px-2.5 py-1 rounded-xl text-[10.5px] bg-white/5 hover:bg-[#ccff00]/15 hover:border-[#ccff00]/40 text-white/85 hover:text-[#ccff00] border border-white/10 transition-all flex items-center gap-1 cursor-pointer group"
                      >
                        <MapPin className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:text-[#ccff00]" />
                        <span>{city}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Live Matching Clients List */}
              {searchQuery.trim().length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50 font-bold uppercase tracking-wider">
                    <span>Coincidencias en Vivo ({filteredActualClients.length})</span>
                  </div>
                  {filteredActualClients.length === 0 ? (
                    <div className="py-3 text-center text-white/50 text-[11px]">
                      No hay clientes conectados en &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {filteredActualClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => {
                            setSelectedClientId(client.id);
                            focusOnLocation(client.x, client.y, 1.9);
                            setIsSearchFocused(false);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#ccff00]/40 flex items-center justify-between cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-full bg-[#ccff00] text-gray-950 font-black flex items-center justify-center text-[10px] shrink-0">
                              {(client.name || "C").charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-white group-hover:text-[#ccff00] transition-colors truncate">
                                {cleanClientName(client.name)}
                              </p>
                              <p className="text-[10px] text-white/50 truncate">
                                {client.city || "Ecuador"} • <span className="font-mono text-white/80">${client.totalSpent || 0}</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 group-hover:bg-[#ccff00] group-hover:text-gray-950 font-bold transition-all shrink-0">
                            Enfocar &rarr;
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Right side controls: Location Prompt for Admin + Zoom Help Badge */}
        <div className="flex items-center gap-2.5 pointer-events-auto shrink-0">
          {isAdmin && !hasAdminLocation && (
            <button
              onClick={handleNavigateToAddress}
              className="group relative flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/90 hover:bg-black backdrop-blur-2xl border border-[#ccff00]/80 hover:border-[#ccff00] text-white text-xs font-semibold shadow-[0_0_24px_rgba(204,255,0,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer shrink-0"
              title="Añade tu dirección para mostrar tu ubicación en el mapa"
            >
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-[#ccff00] text-gray-950 font-black shrink-0 shadow-[0_0_10px_#ccff00]/50">
                <MapPin className="w-3 h-3 text-gray-950" />
                <span className="absolute inset-0 rounded-full bg-[#ccff00] animate-ping opacity-75 pointer-events-none" />
              </div>
              <span className="font-semibold text-xs text-white group-hover:text-[#ccff00] transition-colors whitespace-nowrap">
                Mostrar mi ubicación también
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#ccff00] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-[10.5px] font-mono text-white/60">
            <span>💡 Rueda o 2 dedos para Zoom</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. LEFT HUD CONTROLS (ShotScape GIS Floating Toolstrip - Zero Widgets)    */}
      {/* ========================================================================= */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex flex-col items-center bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl p-1.5 shadow-2xl space-y-1">
          
          {/* Zoom In Button */}
          <button 
            onClick={handleZoomIn}
            title="Acercar mapa (+)"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Compass Indicator / Center on Ecuador Button */}
          <button 
            onClick={handleResetView}
            title="Orientación Norte & Centrar Mapa"
            className="w-8 h-8 rounded-xl bg-black/50 border border-white/15 hover:border-[#ccff00] flex items-center justify-center text-[#ccff00] transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(204,255,0,0.15)] group"
          >
            <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </button>

          {/* Zoom Out Button */}
          <button 
            onClick={handleZoomOut}
            title="Alejar mapa (-)"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-5 h-[1px] bg-white/10 my-0.5" />

          {/* Reset Zoom & Pan */}
          <button 
            onClick={handleResetView}
            title="Restablecer vista (100%)"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

        </div>

        {/* Current Zoom Level Pill */}
        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-white/60 font-bold">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 5. RIGHT FLOATING GLASS PANEL (Concise Metrics & Live Client Dossier)     */}
      {/* ========================================================================= */}
      <div onClick={(e) => e.stopPropagation()} className="absolute right-6 top-5 bottom-24 w-80 lg:w-84 z-30 flex flex-col pointer-events-auto transition-all duration-500 ease-out overflow-hidden">
        <div className="flex-1 rounded-[2rem] bg-[#121615]/85 backdrop-blur-2xl border border-white/15 p-5 shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out w-full">
          
          {/* Panel Top Navigation & Scrollable Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-x-none w-full pr-0.5 space-y-3.5 select-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-black/50 border border-white/10 text-[11px] font-semibold">
                <button 
                  onClick={() => setActiveTab("metrics")}
                  className={`px-3 py-1 rounded-full transition-all duration-300 ease-out cursor-pointer ${
                    activeTab === "metrics" ? "bg-white text-gray-950 font-bold shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  Métricas
                </button>
                <button 
                  onClick={() => setActiveTab("clients")}
                  className={`px-3 py-1 rounded-full transition-all duration-300 ease-out cursor-pointer ${
                    activeTab === "clients" ? "bg-white text-gray-950 font-bold shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  Clientes ({actualClients.length})
                </button>
              </div>

              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold transition-all duration-500 ease-in-out ${
                activeHUDClient 
                  ? "bg-[#ccff00]/20 text-[#ccff00] border-[#ccff00]/30 opacity-100 scale-100" 
                  : "opacity-0 scale-75 pointer-events-none border-transparent"
              }`}>
                Selección
              </span>
            </div>

            {/* TAB CONTENT A: ACTIVE CLIENT DOSSIER (Silky Smooth Collapsible Transition 500ms) */}
            <div 
              className={`transition-all duration-500 ease-in-out overflow-hidden transform-gpu ${
                activeHUDClient 
                  ? "max-h-[380px] opacity-100 translate-y-0 scale-100 mb-3.5" 
                  : "max-h-0 opacity-0 -translate-y-2 scale-98 mb-0 pointer-events-none"
              }`}
            >
              {displayedDossierClient && (
                <div className="rounded-2xl bg-black/55 border border-[#ccff00]/30 p-3.5 space-y-2.5 shadow-xl backdrop-blur-md transition-all duration-500 ease-out">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-[#ccff00] text-gray-950 font-black flex items-center justify-center text-sm shrink-0 shadow-md transition-transform duration-300 hover:scale-105 mt-0.5">
                        {(displayedDossierClient.name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-sans font-bold text-sm text-white tracking-normal leading-tight truncate">{cleanClientName(displayedDossierClient.name)}</h4>
                          {isUserSelf(displayedDossierClient) && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 font-bold shrink-0">
                              {isAdmin ? "Tú (Admin)" : "Tú"}
                            </span>
                          )}
                        </div>
                        
                        {/* Ubicación detallada del cliente con ancho completo */}
                        <p className="text-xs text-white/80 flex items-center gap-1.5 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#ccff00] shrink-0" /> 
                          <span>
                            {isUserSelf(displayedDossierClient)
                              ? (currentUserCity || "Sin ubicación registrada")
                              : (displayedDossierClient.city || "Sin ubicación registrada")}
                          </span>
                        </p>
                        
                        {/* Píldora de Recompra exclusiva para clientes reales (No aplica a cuentas administradoras) */}
                        {!isClientAdmin(displayedDossierClient) && (
                          <div className="mt-2">
                            <span 
                              className="inline-flex items-center text-[12px] font-mono px-3 py-1 rounded-full bg-white/10 text-[#ccff00] border border-[#ccff00]/30 font-bold tracking-tight shadow-md"
                              title="Frecuencia estimada de recompra del cliente"
                            >
                              Recompra: {displayedDossierClient.frequency || "1ª Vez"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientId(null);
                        setHoveredClientId(null);
                        setLastActiveClient(null);
                      }}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
                      title="Cerrar detalle (Esc)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[10.5px] pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Explorando:</span>
                      <strong className="text-white font-medium text-right truncate max-w-[140px]">
                        {displayedDossierClient.name?.toLowerCase().includes("admin") || (isUserSelf(displayedDossierClient) && isAdmin)
                          ? "Mi Perfil / Mapa"
                          : (displayedDossierClient.currentSection || "Tienda")}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Total Compras:</span>
                      <strong className="text-[#ccff00] font-mono font-bold">${Number(displayedDossierClient.totalSpent || 0).toFixed(2)} USD</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Historial:</span>
                      <span className="text-white/80">{displayedDossierClient.purchasesCount || 0} pedidos realizados</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Dispositivo:</span>
                      <span className="text-white/80">{displayedDossierClient.device || "Computador"}</span>
                    </div>
                  </div>

                  {displayedDossierClient.hasCart && (
                    <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-[10px]">
                      <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                        <ShoppingBag className="w-3 h-3" /> Con ítems en el carrito
                      </span>
                      <span className="font-mono text-white font-bold">{displayedDossierClient.cartItemsCount || 1} pzs</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TABS CONTAINER: SILKY SMOOTH CROSSFADE & SLIDE ANIMATION (LOCKED HORIZONTALLY) */}
            <div className="relative w-full overflow-hidden">
              {/* TAB CONTENT B: CORE METRICS OVERVIEW */}
              <div 
                className={`w-full transition-all duration-500 ease-in-out ${
                  activeTab === "metrics" 
                    ? "opacity-100 translate-x-0 relative z-10 pointer-events-auto" 
                    : "opacity-0 -translate-x-2 pointer-events-none absolute inset-x-0 top-0 z-0 invisible"
                }`}
              >
                <div className="space-y-4 w-full">
                
                {/* Metric 1: Online Volume & Stage Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/90">Tráfico Activo</span>
                    <span className="text-[10px] font-mono text-[#ccff00] font-bold">
                      {actualClients.length} Clientes Radar
                    </span>
                  </div>
                  
                  {/* Stage filter pills: Todos | En Carrito | Recurrentes */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-black/50 border border-white/10 text-[10px] text-center font-bold">
                    <button 
                      onClick={() => setActiveStage("all")}
                      className={`py-1 rounded-full transition-all cursor-pointer ${
                        activeStage === "all" ? "bg-white text-gray-950 shadow-sm" : "text-white/60 hover:text-white"
                      }`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setActiveStage("cart")}
                      className={`py-1 rounded-full transition-all cursor-pointer ${
                        activeStage === "cart" ? "bg-white text-gray-950 shadow-sm" : "text-white/60 hover:text-white"
                      }`}
                    >
                      En Carrito
                    </button>
                    <button 
                      onClick={() => setActiveStage("frequent")}
                      className={`py-1 rounded-full transition-all cursor-pointer ${
                        activeStage === "frequent" ? "bg-[#ccff00] text-gray-950 shadow-[0_0_10px_#ccff00]" : "text-white/60 hover:text-white"
                      }`}
                    >
                      Recurrentes
                    </button>
                  </div>
                </div>

                {/* Metric 2: Tendencia de Compra — Spline Curve con Gradiente Neón */}
                <div className="rounded-2xl bg-black/45 border border-white/10 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-white block">Tendencia de Compra</span>
                      <span className="text-[9.5px] text-[#ccff00] font-mono font-semibold flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" /> +28.4% al alza
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/50" />
                  </div>

                  {/* Clean SVG Spline Trend Curve */}
                  <div className="relative h-14 w-full">
                    <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="miniTrendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ccff00" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#ccff00" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M 5 45 C 35 48, 55 35, 85 38 C 115 42, 135 18, 165 20 C 180 22, 190 14, 195 10 L 195 55 L 5 55 Z" 
                        fill="url(#miniTrendGrad)" 
                      />
                      <path 
                        d="M 5 45 C 35 48, 55 35, 85 38 C 115 42, 135 18, 165 20 C 180 22, 190 14, 195 10" 
                        fill="none" 
                        stroke="#ccff00" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                      />
                      <circle cx="165" cy="20" r="3" fill="#ffffff" stroke="#ccff00" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] font-mono text-white/60 pt-1 border-t border-white/10">
                    <span>Recompra: <strong>1 cada 14d</strong></span>
                    <span className="text-[#ccff00] font-bold">
                      {actualClients.length > 0 && actualClients.reduce((sum, c) => sum + (c.totalSpent || 0), 0) > 0
                        ? `$${actualClients.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toFixed(0)}/vol`
                        : "$0/mes"}
                    </span>
                  </div>
                </div>

                {/* Metric 3: Distribución Geográfica — Computed dynamically from actual clients */}
                {(() => {
                  const total = actualClients.length || 1;
                  const regionCounts: Record<string, number> = {};
                  
                  actualClients.forEach(c => {
                    const cityLower = (c.city || 'otro').toLowerCase().trim();
                    const matchedEntry = Object.entries(ECUADOR_PROVINCE_COORDINATES).find(([k]) => 
                      cityLower.includes(k) || k.includes(cityLower)
                    );
                    const region = matchedEntry ? matchedEntry[1].region : 'Otro';
                    regionCounts[region] = (regionCounts[region] || 0) + 1;
                  });

                  const regionColors: Record<string, string> = {
                    'Sierra': 'bg-white',
                    'Costa': 'bg-[#ccff00]',
                    'Oriente': 'bg-emerald-400',
                    'Galápagos': 'bg-amber-400',
                    'Otro': 'bg-white/50',
                  };

                  const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);

                  return (
                    <div className="space-y-1.5 text-xs">
                      <span className="text-[11px] font-bold text-white/80 block">Distribución Geográfica</span>
                      {actualClients.length === 0 ? (
                        <p className="text-[10px] text-white/40 font-mono">Sin clientes conectados</p>
                      ) : (
                        <div className="space-y-1">
                          {sortedRegions.map(([region, count]) => {
                            const pct = Math.round((count / total) * 100);
                            return (
                              <div key={region}>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-white/70">{region}</span>
                                  <strong className="font-mono text-white">{pct}% ({count})</strong>
                                </div>
                                <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                                  <div className={`h-full ${regionColors[region] || 'bg-white/50'} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                </div>
              </div>

              {/* TAB CONTENT C: CLIENTS LIST WITH LUMINOUS NEON GREEN SLIDER BAR */}
              <div 
                className={`w-full transition-all duration-500 ease-in-out ${
                  activeTab === "clients" 
                    ? "opacity-100 translate-x-0 relative z-10 pointer-events-auto" 
                    : "opacity-0 translate-x-2 pointer-events-none absolute inset-x-0 top-0 z-0 invisible"
                }`}
              >
                <div className="relative flex items-stretch gap-2 h-64 w-full overflow-hidden">
                {/* Scrollable List with Native Scrollbar Hidden */}
                <div 
                  ref={clientsListRef}
                  onScroll={handleClientsScroll}
                  className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-x-none pr-1 select-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filteredActualClients.length === 0 ? (
                    <div className="py-12 text-center text-white/40 text-xs flex flex-col items-center justify-center">
                      <Users className="w-7 h-7 mx-auto mb-2 opacity-30 text-[#ccff00]" />
                      <p className="font-semibold text-white/80">Sin clientes conectados</p>
                      <p className="text-[10px] text-white/40 mt-1">El radar monitorea en vivo las 24 provincias</p>
                    </div>
                  ) : (
                    filteredActualClients.map(c => {
                      const isSelected = activeHUDClient?.id === c.id;
                      return (
                        <div 
                          key={c.id}
                          onClick={() => {
                            setSelectedClientId(prev => prev === c.id ? null : c.id);
                            if (c.x >= 0 && c.y >= 0) {
                              focusOnLocation(c.x, c.y, 1.9);
                            }
                          }}
                          className={`p-2.5 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-all duration-300 ease-out border ${
                            isSelected 
                              ? "bg-white text-gray-950 font-bold border-[#ccff00] shadow-[0_0_16px_rgba(204,255,0,0.35)]" 
                              : "bg-black/40 hover:bg-black/70 text-white/85 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected 
                                ? "bg-gray-950 text-[#ccff00]" 
                                : "bg-[#ccff00] text-gray-950 font-black"
                            }`}>
                              {(c.name || "C").charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="leading-tight truncate font-semibold">{cleanClientName(c.name)}</p>
                              <p className={`text-[9.5px] mt-0.5 ${isSelected ? "text-gray-700 font-medium" : "text-white/45"}`}>
                                {c.city || "Ecuador"} • <span className="font-mono">${c.totalSpent || 0}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {c.hasCart && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" title="Con Carrito Activo" />
                            )}
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Elegant Luminous Neon Green Vertical Slider Track */}
                <div className="relative w-1.5 bg-white/5 rounded-full overflow-hidden shrink-0 border border-white/10">
                  <div 
                    ref={scrollTrackRef}
                    style={{
                      height: "32%",
                      top: `0%`
                    }}
                    className="absolute w-full bg-[#ccff00] rounded-full shadow-[0_0_12px_#ccff00] transition-all duration-300 ease-out"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Panel Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#ccff00]" /> Radar Lumina Activo
            </span>
            <span className="font-mono text-emerald-400">99.8% Cobertura</span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM FLOATING WIDGETS (ShotScape 3-Card Dock along bottom)           */}
      {/* ========================================================================= */}
      <div onClick={(e) => e.stopPropagation()}
        className="absolute bottom-5 left-6 right-6 lg:right-96 z-30 grid grid-cols-1 sm:grid-cols-3 gap-3 pointer-events-auto">
        
        {/* Card 1: Cobertura Territorial (Actualizada con 24 Provincias) */}
        <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-3.5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#ccff00]" /> Alcance Territorial
            </span>
            <span className="text-[9px] font-mono text-white/50">24 Provincias</span>
          </div>
          <p className="text-[10px] text-white/70">
            Sierra • Costa • Amazonía • Galápagos
          </p>
          <div className="flex items-center gap-1 text-[9.5px] font-mono text-[#ccff00] mt-1">
            <span>Monitoreo en tiempo real • 24 Provincias</span>
          </div>
        </div>

        {/* Card 2: Embudo de Conversión — Computed from real client data */}
        {(() => {
          const total = actualClients.length;
          const totalSafe = total || 1;
          const cartCount = actualClients.filter(c => c.hasCart).length;
          const frequentCount = actualClients.filter(c => (c.purchasesCount || 0) >= 3).length;
          const browsingCount = Math.max(0, total - cartCount - frequentCount);
          const browsingPct = total > 0 ? Math.round((browsingCount / totalSafe) * 100) : 0;
          const cartPct = total > 0 ? Math.round((cartCount / totalSafe) * 100) : 0;
          const frequentPct = total > 0 ? Math.round((frequentCount / totalSafe) * 100) : 0;
          return (
            <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-3.5 shadow-xl flex flex-col justify-between">
              <div className="mb-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white whitespace-nowrap">
                  <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Embudo de Conversión</span>
                </div>
                <p className="text-[9.5px] font-mono text-emerald-400 font-bold mt-0.5 pl-4.5">
                  {total} {total === 1 ? 'cliente activo' : 'clientes activos'}
                </p>
              </div>
              <div className="flex items-center justify-between text-[9.5px] text-white/70">
                <span>Catálogo: <strong>{browsingPct}%</strong></span>
                <span>Carrito: <strong>{cartPct}%</strong></span>
                <span>Recurrentes: <strong>{frequentPct}%</strong></span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 flex overflow-hidden mt-1.5">
                <div className="h-full bg-white transition-all duration-500" style={{ width: `${browsingPct}%` }} />
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${cartPct}%` }} />
                <div className="h-full bg-[#ccff00] transition-all duration-500" style={{ width: `${frequentPct}%` }} />
              </div>
            </div>
          );
        })()}

        {/* Card 3: Resumen Radar — Live data */}
        {(() => {
          const totalOrders = actualClients.reduce((sum, c) => sum + (c.purchasesCount || 0), 0);
          const totalRevenue = actualClients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
          const avgTicket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
          const avgIntent = actualClients.length > 0 ? Math.round(actualClients.reduce((sum, c) => sum + (c.intentScore || 0), 0) / actualClients.length) : 0;
          return (
            <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-3.5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#ccff00]" /> Resumen Radar
                </span>
                <span className="text-[9px] font-mono text-[#ccff00] font-bold">En Vivo</span>
              </div>
              <p className="text-[10px] text-white/70">
                {actualClients.length} cliente{actualClients.length !== 1 ? 's' : ''} conectado{actualClients.length !== 1 ? 's' : ''} ahora
              </p>
              <div className="flex items-center justify-between text-[9px] font-mono text-white/60 mt-1 pt-1 border-t border-white/10">
                <span>Ticket Promedio: <strong className="text-white">${avgTicket.toFixed(0)} USD</strong></span>
                <span>Intent: <strong className="text-[#ccff00]">{avgIntent}%</strong></span>
              </div>
            </div>
          );
        })()}

      </div>

    </div>
  );
}
