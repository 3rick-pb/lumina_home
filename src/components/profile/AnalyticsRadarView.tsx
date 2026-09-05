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
import { User, ShippingAddress, Order } from "@/lib/userStore";
import { CatalogProduct } from "@/lib/catalogStore";

export interface ConnectedClient {
  id: string;
  name: string;
  email: string;
  city: string;
  country: string;
  x: number; // percentage horizontal position (0 - 100)
  y: number; // percentage vertical position (0 - 100)
  frequency: "Semanal" | "Quincenal" | "Mensual" | "Ocasional" | "Primera vez";
  purchasesCount: number;
  totalSpent: number;
  currentSection: string;
  intentScore: number;
  device: "Computador" | "Celular" | "Tablet";
  hasCart: boolean;
  cartItemsCount?: number;
  isRealUser?: boolean;
}

interface AnalyticsRadarViewProps {
  user: User | null;
  addresses: ShippingAddress[];
  orders: Order[];
  products: CatalogProduct[];
  categories: string[];
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

  // Costa (Litoral del Pacífico y Golfo de Guayaquil)
  "guayaquil": { x: 29.5, y: 53.5, province: "Guayas", region: "Costa" },
  "guayas": { x: 29.5, y: 53.5, province: "Guayas", region: "Costa" },
  "manta": { x: 21.0, y: 39.5, province: "Manabí", region: "Costa" },
  "portoviejo": { x: 24.5, y: 41.0, province: "Manabí", region: "Costa" },
  "manabi": { x: 24.5, y: 41.0, province: "Manabí", region: "Costa" },
  "santo domingo": { x: 41.0, y: 29.5, province: "Sto. Domingo de los Tsáchilas", region: "Costa" },
  "machala": { x: 27.5, y: 69.5, province: "El Oro", region: "Costa" },
  "el oro": { x: 27.5, y: 69.5, province: "El Oro", region: "Costa" },
  "esmeraldas": { x: 38.0, y: 12.0, province: "Esmeraldas", region: "Costa" },
  "santa elena": { x: 19.5, y: 52.0, province: "Santa Elena", region: "Costa" },
  "salinas": { x: 17.5, y: 53.5, province: "Santa Elena", region: "Costa" },
  "babahoyo": { x: 34.0, y: 49.0, province: "Los Ríos", region: "Costa" },
  "los rios": { x: 34.0, y: 49.0, province: "Los Ríos", region: "Costa" },

  // Galápagos (Archipiélago)
  "galapagos": { x: 10.0, y: 22.0, province: "Galápagos", region: "Galápagos" },
  "baquerizo moreno": { x: 10.0, y: 22.0, province: "Galápagos", region: "Galápagos" },
  "santa cruz": { x: 9.0, y: 21.0, province: "Galápagos", region: "Galápagos" },

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
  "macas": { x: 61.0, y: 61.0, province: "Morona Santiago", region: "Oriente" },
  "morona santiago": { x: 61.0, y: 61.0, province: "Morona Santiago", region: "Oriente" },
  "zamora": { x: 48.0, y: 83.0, province: "Zamora Chinchipe", region: "Oriente" },
  "zamora chinchipe": { x: 48.0, y: 83.0, province: "Zamora Chinchipe", region: "Oriente" }
};

export default function AnalyticsRadarView({
  user,
  addresses,
  orders,
}: AnalyticsRadarViewProps) {
  // Interaction & filter states
  const [hoveredClient, setHoveredClient] = useState<ConnectedClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<ConnectedClient | null>(null);
  const [lastActiveClient, setLastActiveClient] = useState<ConnectedClient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStage, setActiveStage] = useState<"all" | "cart" | "frequent">("all");
  const [activeTab, setActiveTab] = useState<"metrics" | "clients">("metrics");
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  // Preload optimized WebP 3D relief landmass (< 480KB) for instant load
  useEffect(() => {
    const img = new Image();
    img.src = "/images/map_3d_relief_cutout.webp";
    img.onload = () => setIsMapLoaded(true);
  }, []);

  // Keyboard shortcut: Escape to deselect active client
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedClient(null);
        setHoveredClient(null);
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
  const clientsListRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connected clients distributed accurately across Ecuador's calibrated 3D terrain
  const connectedClients: ConnectedClient[] = useMemo(() => {
    const baseClients: ConnectedClient[] = [
      {
        id: "cli-1",
        name: "Valeria Montejo",
        email: "valeria.m@lumina.com",
        city: "Quito (Pichincha)",
        country: "Ecuador",
        x: 48.8,
        y: 26.5,
        frequency: "Semanal",
        purchasesCount: 9,
        totalSpent: 1840,
        currentSection: "Lámparas Nova LED",
        intentScore: 94,
        device: "Computador",
        hasCart: true,
        cartItemsCount: 2
      },
      {
        id: "cli-2",
        name: "Carlos De la Hoz",
        email: "carlos.dlh@gmail.com",
        city: "Guayaquil (Guayas)",
        country: "Ecuador",
        x: 29.5,
        y: 53.5,
        frequency: "Quincenal",
        purchasesCount: 5,
        totalSpent: 920,
        currentSection: "Mesas de Roble Escandinavo",
        intentScore: 88,
        device: "Celular",
        hasCart: true,
        cartItemsCount: 1
      },
      {
        id: "cli-3",
        name: "Elena Rostova",
        email: "elena.design@studio.de",
        city: "Cuenca (Azuay)",
        country: "Ecuador",
        x: 40.5,
        y: 67.5,
        frequency: "Mensual",
        purchasesCount: 4,
        totalSpent: 1350,
        currentSection: "Colección Minimalista",
        intentScore: 79,
        device: "Computador",
        hasCart: false
      },
      {
        id: "cli-4",
        name: "Mateo Bianchi",
        email: "mateo.b@milano.it",
        city: "Ambato (Tungurahua)",
        country: "Ecuador",
        x: 50.5,
        y: 41.5,
        frequency: "Semanal",
        purchasesCount: 12,
        totalSpent: 2890,
        currentSection: "Sillones Boucle Crudo",
        intentScore: 96,
        device: "Tablet",
        hasCart: true,
        cartItemsCount: 3
      },
      {
        id: "cli-5",
        name: "Sophie Laurent",
        email: "sophie.l@atelier.fr",
        city: "Galápagos (San Cristóbal)",
        country: "Ecuador",
        x: 10.0,
        y: 22.0,
        frequency: "Ocasional",
        purchasesCount: 2,
        totalSpent: 430,
        currentSection: "Espejos Orgánicos LED",
        intentScore: 72,
        device: "Celular",
        hasCart: false
      },
      {
        id: "cli-6",
        name: "Oliver Smith",
        email: "oliver.s@archit.co.uk",
        city: "Manta (Manabí)",
        country: "Ecuador",
        x: 21.0,
        y: 39.5,
        frequency: "Quincenal",
        purchasesCount: 7,
        totalSpent: 1680,
        currentSection: "Iluminación Arquitectónica",
        intentScore: 91,
        device: "Computador",
        hasCart: true,
        cartItemsCount: 1
      },
      {
        id: "cli-7",
        name: "Alejandro Morales",
        email: "alejandro.m@valencia.es",
        city: "Puyo (Pastaza - Oriente)",
        country: "Ecuador",
        x: 63.0,
        y: 49.0,
        frequency: "Mensual",
        purchasesCount: 3,
        totalSpent: 620,
        currentSection: "Lámparas de Pie Artemide",
        intentScore: 84,
        device: "Celular",
        hasCart: false
      },
      {
        id: "cli-8",
        name: "Julian Sterling",
        email: "j.sterling@nycloft.com",
        city: "Loja (Loja)",
        country: "Ecuador",
        x: 37.5,
        y: 82.5,
        frequency: "Semanal",
        purchasesCount: 15,
        totalSpent: 4200,
        currentSection: "Edición Limitada Bestseller",
        intentScore: 98,
        device: "Computador",
        hasCart: true,
        cartItemsCount: 4
      },
      {
        id: "cli-9",
        name: "Camila Navas",
        email: "camila.n@decor.ec",
        city: "Santo Domingo - La Concordia (Tsáchilas)",
        country: "Ecuador",
        x: 41.0,
        y: 29.5,
        frequency: "Quincenal",
        purchasesCount: 6,
        totalSpent: 1140,
        currentSection: "Aparadores Nórdicos",
        intentScore: 89,
        device: "Celular",
        hasCart: true,
        cartItemsCount: 1
      },
      {
        id: "cli-10",
        name: "Diego Alvarado",
        email: "diego.alv@estudio.ec",
        city: "Machala (El Oro)",
        country: "Ecuador",
        x: 27.5,
        y: 69.5,
        frequency: "Mensual",
        purchasesCount: 4,
        totalSpent: 890,
        currentSection: "Sillas de Cuero Natural",
        intentScore: 82,
        device: "Computador",
        hasCart: false
      }
    ];

    // Real User Dynamic Integration: Automatic Geographic Resolution from Database Addresses
    if (addresses && addresses.length > 0) {
      addresses.forEach((addr, idx) => {
        const cityName = (addr.city || "Quito").toLowerCase().trim();
        const matchedEntry = Object.entries(ECUADOR_PROVINCE_COORDINATES).find(([key]) => cityName.includes(key));
        const coords = matchedEntry ? matchedEntry[1] : { x: 48.8, y: 26.5, province: "Pichincha" };

        baseClients.unshift({
          id: `user-addr-${addr.id || idx}`,
          name: addr.recipient || user?.name || "Tu Sesión (Activa)",
          email: user?.email || "admin@lumina.com",
          city: `${addr.city || "Quito"} (${coords.province})`,
          country: addr.country || "Ecuador",
          x: coords.x + (idx * 1.5),
          y: coords.y + (idx * 1.5),
          frequency: orders.length > 5 ? "Semanal" : orders.length > 0 ? "Quincenal" : "Primera vez",
          purchasesCount: orders.length,
          totalSpent: orders.reduce((acc, o) => acc + o.total, 0),
          currentSection: "Explorando: Radar Lumina",
          intentScore: 99,
          device: "Computador",
          hasCart: true,
          cartItemsCount: 2,
          isRealUser: true
        });
      });
    }

    return baseClients;
  }, [addresses, user, orders]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return connectedClients.filter(c => {
      if (activeStage === "cart" && !c.hasCart) return false;
      if (activeStage === "frequent" && (c.purchasesCount < 3 || c.frequency === "Primera vez")) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.currentSection.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [connectedClients, activeStage, searchQuery]);

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
      setScrollProgress(el.scrollTop / maxScroll);
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
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      className="relative w-full h-[660px] lg:h-[720px] rounded-[2.5rem] overflow-hidden bg-[#181d1b] text-white shadow-2xl border border-white/10 select-none animate-fade-in font-sans"
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
        onClick={() => setSelectedClient(null)}
        className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Zoomed & Panned 3D Terrain Wrapper */}
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out"
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

          {/* Interactive Geographic Beacons Calibrated by Province */}
          {filteredClients.map((client) => {
            const isHovered = hoveredClient?.id === client.id;
            const isSelected = selectedClient?.id === client.id;
            const isActive = isHovered || isSelected;

            return (
              <div 
                key={client.id}
                style={{
                  left: `${client.x}%`,
                  top: `${client.y}%`
                }}
                className="absolute z-30 -translate-x-1/2 -translate-y-full cursor-pointer group"
                onMouseEnter={() => setHoveredClient(client)}
                onMouseLeave={() => setHoveredClient(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClient(prev => prev?.id === client.id ? null : client);
                }}
              >
                {/* Pulsing Ground Halo */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none">
                  <span className={`block rounded-full ${
                    client.isRealUser 
                      ? "w-4 h-4 bg-emerald-400 animate-ping shadow-[0_0_14px_#34d399]" 
                      : "w-3 h-3 bg-[#ccff00] animate-ping shadow-[0_0_12px_#ccff00]"
                  }`} />
                </div>

                {/* Beacon Head & Stem */}
                <div className="flex flex-col items-center">
                  <div className={`relative transition-all duration-300 flex items-center justify-center rounded-full border shadow-xl ${
                    isActive 
                      ? "scale-125 z-40 bg-white text-gray-950 border-[#ccff00] shadow-[0_0_24px_#ccff00]" 
                      : client.isRealUser 
                      ? "bg-emerald-400 text-gray-950 border-white shadow-[0_0_16px_#34d399]" 
                      : "bg-gradient-to-tr from-amber-400 to-yellow-200 text-gray-950 border-white/80 shadow-[0_0_14px_#f59e0b]"
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
                      : "h-7 bg-gradient-to-t from-amber-400 to-yellow-200 shadow-[0_0_8px_#f59e0b]"
                  }`} />
                  <div className="w-1 h-1 bg-[#ccff00] rotate-45 shadow-[0_0_6px_#ccff00]" />
                </div>

                {/* City & Province Tag Label (Shows complete city name e.g. "Santo Domingo") */}
                <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider transition-all pointer-events-none ${
                  isActive 
                    ? "bg-white text-gray-950 shadow-md scale-105" 
                    : "bg-black/85 text-white/90 border border-white/10 backdrop-blur-md"
                }`}>
                  {formatBeaconCity(client.city)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP FLOATING BAR (Minimal Header Capsule)                              */}
      {/* ========================================================================= */}
      <div className="absolute top-5 left-6 right-6 lg:right-96 z-30 flex items-center justify-between gap-3 pointer-events-none">
        
        {/* Left/Center Glass Search & Stage Capsule */}
        <div className="flex items-center bg-black/60 backdrop-blur-xl border border-white/15 rounded-full px-3.5 py-1.5 shadow-xl text-xs text-white max-w-md w-full pointer-events-auto">
          <div className="flex items-center gap-2 pr-3 border-r border-white/10 shrink-0">
            <div className="w-6 h-6 rounded-full bg-white text-gray-950 font-black text-xs flex items-center justify-center">
              L
            </div>
            <span className="font-extrabold tracking-wider text-xs hidden sm:inline">RADAR</span>
          </div>

          <Search className="w-3.5 h-3.5 text-white/50 mx-2 shrink-0" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar ciudad o provincia..."
            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/45 flex-1 min-w-0"
          />

          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-white/70 font-semibold">24 Provincias</span>
          </div>
        </div>

        {/* Zoom Help Badge (Desktop/Trackpad reminder) */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-[10.5px] font-mono text-white/60 pointer-events-auto">
          <span>💡 Rueda o 2 dedos para Zoom</span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. LEFT HUD CONTROLS (ShotScape GIS Floating Toolstrip - Zero Widgets)    */}
      {/* ========================================================================= */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 pointer-events-auto">
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
      <div onClick={(e) => e.stopPropagation()} className="absolute right-6 top-5 bottom-24 w-80 lg:w-84 z-30 flex flex-col pointer-events-auto transition-all duration-500 ease-out">
        <div className="flex-1 rounded-[2rem] bg-[#121615]/85 backdrop-blur-2xl border border-white/15 p-5 shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out">
          
          {/* Panel Top Navigation & Scrollable Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-3.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                  Clientes ({filteredClients.length})
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
                        {displayedDossierClient.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white leading-tight truncate">{displayedDossierClient.name}</h4>
                          {displayedDossierClient.isRealUser && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 font-bold shrink-0">
                              Tú
                            </span>
                          )}
                        </div>
                        
                        {/* Ubicación detallada del cliente con ancho completo */}
                        <p className="text-xs text-white/80 flex items-center gap-1.5 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#ccff00] shrink-0" /> 
                          <span>{displayedDossierClient.city}</span>
                        </p>
                        
                        {/* Píldora de Recompra con mayor tamaño de fuente situada debajo de la ubicación */}
                        <div className="mt-2">
                          <span 
                            className="inline-flex items-center text-[12px] font-mono px-3 py-1 rounded-full bg-white/10 text-[#ccff00] border border-[#ccff00]/30 font-bold tracking-tight shadow-md"
                            title="Frecuencia estimada de recompra del cliente"
                          >
                            Recompra: {displayedDossierClient.frequency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(null);
                        setHoveredClient(null);
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
                      <strong className="text-white font-medium text-right truncate max-w-[140px]">{displayedDossierClient.currentSection}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Total Compras:</span>
                      <strong className="text-[#ccff00] font-mono font-bold">${displayedDossierClient.totalSpent.toFixed(2)} USD</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Historial:</span>
                      <span className="text-white/80">{displayedDossierClient.purchasesCount} pedidos realizados</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Dispositivo:</span>
                      <span className="text-white/80">{displayedDossierClient.device}</span>
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

            {/* TABS CONTAINER: SILKY SMOOTH CROSSFADE & SLIDE ANIMATION */}
            <div className="relative">
              {/* TAB CONTENT B: CORE METRICS OVERVIEW */}
              <div 
                className={`transition-all duration-500 ease-in-out ${
                  activeTab === "metrics" 
                    ? "opacity-100 translate-x-0 relative z-10" 
                    : "opacity-0 -translate-x-4 pointer-events-none absolute inset-x-0 top-0 z-0"
                }`}
              >
                <div className="space-y-4">
                
                {/* Metric 1: Online Volume & Stage Filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/90">Tráfico Activo</span>
                    <span className="text-[10px] font-mono text-[#ccff00] font-bold">
                      {connectedClients.length} Clientes Radar
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

                {/* Metric 2: Frecuencia de Compra Organic Trend Mini Graph */}
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
                    <span className="text-[#ccff00] font-bold">$6,420/mes</span>
                  </div>
                </div>

                {/* Metric 3: Concentración por Ciudades */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-white/80 block">Distribución Geográfica</span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/70">Quito / Pichincha</span>
                      <strong className="font-mono text-white">42%</strong>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: "42%" }} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-white/70">Guayaquil / Costa</span>
                      <strong className="font-mono text-white">28%</strong>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#ccff00] rounded-full" style={{ width: "28%" }} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-white/70">Cuenca & Austral</span>
                      <strong className="font-mono text-white">18%</strong>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: "18%" }} />
                    </div>
                  </div>
                </div>

                </div>
              </div>

              {/* TAB CONTENT C: CLIENTS LIST WITH LUMINOUS NEON GREEN SLIDER BAR */}
              <div 
                className={`transition-all duration-500 ease-in-out ${
                  activeTab === "clients" 
                    ? "opacity-100 translate-x-0 relative z-10" 
                    : "opacity-0 translate-x-4 pointer-events-none absolute inset-x-0 top-0 z-0"
                }`}
              >
                <div className="relative flex items-stretch gap-2 h-64">
                {/* Scrollable List with Native Scrollbar Hidden */}
                <div 
                  ref={clientsListRef}
                  onScroll={handleClientsScroll}
                  className="flex-1 space-y-2 overflow-y-auto pr-1 select-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filteredClients.map(c => {
                    const isSelected = activeHUDClient?.id === c.id;
                    return (
                      <div 
                        key={c.id}
                        onClick={() => setSelectedClient(prev => prev?.id === c.id ? null : c)}
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
                              : c.isRealUser 
                              ? "bg-emerald-500 text-gray-950 font-black" 
                              : "bg-gradient-to-tr from-amber-400 to-yellow-200 text-gray-950"
                          }`}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="leading-tight truncate font-semibold">{c.name}</p>
                              {c.isRealUser && (
                                <span className="text-[7.5px] font-mono px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 font-bold shrink-0">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className={`text-[9.5px] mt-0.5 ${isSelected ? "text-gray-700 font-medium" : "text-white/45"}`}>
                              {c.city} • <span className="font-mono">${c.totalSpent}</span>
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
                  })}
                </div>

                {/* Elegant Luminous Neon Green Vertical Slider Track */}
                <div className="relative w-1.5 bg-white/5 rounded-full overflow-hidden shrink-0 border border-white/10">
                  <div 
                    style={{
                      height: "32%",
                      top: `${scrollProgress * 68}%`
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

        {/* Card 2: Embudo de Conversión (Catálogo, Carrito, Recurrentes) */}
        <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-3.5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-emerald-400" /> Embudo de Conversión
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">+4.2%</span>
          </div>
          <div className="flex items-center justify-between text-[9.5px] text-white/70">
            <span>Catálogo: <strong>62%</strong></span>
            <span>Carrito: <strong>24%</strong></span>
            <span>Recurrentes: <strong>14%</strong></span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 flex overflow-hidden mt-1.5">
            <div className="h-full bg-white" style={{ width: "62%" }} />
            <div className="h-full bg-amber-400" style={{ width: "24%" }} />
            <div className="h-full bg-[#ccff00]" style={{ width: "14%" }} />
          </div>
        </div>

        {/* Card 3: IA Predictiva Radar */}
        <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-3.5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#ccff00]" /> IA Predictiva Radar
            </span>
            <span className="text-[9px] font-mono text-[#ccff00] font-bold">En Vivo</span>
          </div>
          <p className="text-[10px] text-white/70">
            Detección de intención en tiempo real
          </p>
          <div className="flex items-center justify-between text-[9px] font-mono text-white/60 mt-1 pt-1 border-t border-white/10">
            <span>Ticket Promedio: <strong className="text-white">$185 USD</strong></span>
            <span>Conversión: <strong className="text-[#ccff00]">3.8% Alta</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
}
