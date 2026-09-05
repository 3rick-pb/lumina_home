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
  ChevronRight
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
  frequency: "Semanal (VIP)" | "Quincenal" | "Mensual" | "Ocasional" | "Primera vez";
  purchasesCount: number;
  totalSpent: number;
  currentSection: string;
  intentScore: number;
  device: "Desktop" | "Móvil" | "Tablet";
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

export default function AnalyticsRadarView({
  user,
  addresses,
  orders,
}: AnalyticsRadarViewProps) {
  // Interaction & filter states
  const [hoveredClient, setHoveredClient] = useState<ConnectedClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<ConnectedClient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStage, setActiveStage] = useState<"all" | "cart" | "frequent">("all");
  const [activeTab, setActiveTab] = useState<"metrics" | "clients">("metrics");
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Zoom & Pan states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clientsListRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connected clients distributed accurately across Ecuador's 3D terrain
  const connectedClients: ConnectedClient[] = useMemo(() => {
    const baseClients: ConnectedClient[] = [
      {
        id: "cli-1",
        name: "Valeria Montejo",
        email: "valeria.m@lumina.com",
        city: "Quito (Andes Norte)",
        country: "Ecuador",
        x: 49,
        y: 27,
        frequency: "Semanal (VIP)",
        purchasesCount: 9,
        totalSpent: 1840,
        currentSection: "Lámparas Nova LED",
        intentScore: 94,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 2
      },
      {
        id: "cli-2",
        name: "Carlos De la Hoz",
        email: "carlos.dlh@gmail.com",
        city: "Guayaquil (Costa)",
        country: "Ecuador",
        x: 30,
        y: 53,
        frequency: "Quincenal",
        purchasesCount: 5,
        totalSpent: 920,
        currentSection: "Mesas de Roble Escandinavo",
        intentScore: 88,
        device: "Móvil",
        hasCart: true,
        cartItemsCount: 1
      },
      {
        id: "cli-3",
        name: "Elena Rostova",
        email: "elena.design@studio.de",
        city: "Cuenca (Sierra Sur)",
        country: "Ecuador",
        x: 40,
        y: 67,
        frequency: "Mensual",
        purchasesCount: 4,
        totalSpent: 1350,
        currentSection: "Colección Minimalista",
        intentScore: 79,
        device: "Desktop",
        hasCart: false
      },
      {
        id: "cli-4",
        name: "Mateo Bianchi",
        email: "mateo.b@milano.it",
        city: "Ambato (Sierra Centro)",
        country: "Ecuador",
        x: 51,
        y: 42,
        frequency: "Semanal (VIP)",
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
        city: "Islas Galápagos",
        country: "Ecuador",
        x: 10,
        y: 22,
        frequency: "Ocasional",
        purchasesCount: 2,
        totalSpent: 430,
        currentSection: "Espejos Orgánicos LED",
        intentScore: 72,
        device: "Móvil",
        hasCart: false
      },
      {
        id: "cli-6",
        name: "Oliver Smith",
        email: "oliver.s@archit.co.uk",
        city: "Manta (Costa)",
        country: "Ecuador",
        x: 21,
        y: 39,
        frequency: "Quincenal",
        purchasesCount: 7,
        totalSpent: 1680,
        currentSection: "Iluminación Arquitectónica",
        intentScore: 91,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 1
      },
      {
        id: "cli-7",
        name: "Alejandro Morales",
        email: "alejandro.m@valencia.es",
        city: "Amazonía (Oriente)",
        country: "Ecuador",
        x: 70,
        y: 47,
        frequency: "Mensual",
        purchasesCount: 3,
        totalSpent: 620,
        currentSection: "Lámparas de Pie Artemide",
        intentScore: 84,
        device: "Móvil",
        hasCart: false
      },
      {
        id: "cli-8",
        name: "Julian Sterling",
        email: "j.sterling@nycloft.com",
        city: "Loja (Sur Andino)",
        country: "Ecuador",
        x: 38,
        y: 83,
        frequency: "Semanal (VIP)",
        purchasesCount: 15,
        totalSpent: 4200,
        currentSection: "Edición Limitada Bestseller",
        intentScore: 98,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 4
      }
    ];

    if (addresses && addresses.length > 0) {
      addresses.forEach((addr, idx) => {
        baseClients.unshift({
          id: `user-addr-${addr.id || idx}`,
          name: addr.recipient || user?.name || "Tu Sesión (Activa)",
          email: user?.email || "admin@lumina.com",
          city: addr.city || "Quito Centro",
          country: addr.country || "Ecuador",
          x: 49 + (idx * 4),
          y: 26 + (idx * 5),
          frequency: orders.length > 5 ? "Semanal (VIP)" : orders.length > 0 ? "Quincenal" : "Primera vez",
          purchasesCount: orders.length,
          totalSpent: orders.reduce((acc, o) => acc + o.total, 0),
          currentSection: "Explorando: Radar Lumina",
          intentScore: 99,
          device: "Desktop",
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
      {/* 2. THE MAIN HERO: PROTAGONIC 3D RELIEF MAP WITH LIVE ZOOM & PAN           */}
      {/* ========================================================================= */}
      <div 
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
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

          {/* Authentic 100% Transparent 3D Topographic Relief Landmass */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/map_3d_relief_cutout.png" 
            alt="Mapa 3D Topográfico en Relieve del Territorio"
            draggable={false}
            className="w-full h-full object-contain pointer-events-none select-none filter contrast-110 brightness-105 drop-shadow-[0_28px_40px_rgba(0,0,0,0.7)]"
          />

          {/* Interactive Geographic Beacons */}
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
                    {client.device === "Desktop" ? (
                      <Monitor className="w-3 h-3 shrink-0" />
                    ) : client.device === "Móvil" ? (
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

                {/* City Tag Label */}
                <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono tracking-wider transition-all pointer-events-none ${
                  isActive 
                    ? "bg-white text-gray-950 shadow-md scale-105" 
                    : "bg-black/85 text-white/90 border border-white/10 backdrop-blur-md"
                }`}>
                  {client.city.split(" ")[0]}
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
            placeholder="Buscar ciudad o cliente..."
            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/45 flex-1 min-w-0"
          />

          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-white/70 font-semibold">En Vivo</span>
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
      <div className="absolute right-6 top-5 bottom-24 w-80 lg:w-84 z-30 flex flex-col pointer-events-auto">
        <div className="flex-1 rounded-[2rem] bg-[#121615]/85 backdrop-blur-2xl border border-white/15 p-5 shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Panel Top Navigation: Tabs */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-black/50 border border-white/10 text-[11px] font-semibold">
                <button 
                  onClick={() => setActiveTab("metrics")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activeTab === "metrics" ? "bg-white text-gray-950 font-bold shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  Métricas
                </button>
                <button 
                  onClick={() => setActiveTab("clients")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activeTab === "clients" ? "bg-white text-gray-950 font-bold shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  Clientes ({filteredClients.length})
                </button>
              </div>

              {activeHUDClient && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/30 font-bold">
                  Selección
                </span>
              )}
            </div>

            {/* TAB CONTENT A: ACTIVE CLIENT DOSSIER (When client pin is hovered/clicked) */}
            {activeHUDClient ? (
              <div className="rounded-2xl bg-black/40 border border-[#ccff00]/30 p-4 space-y-3 animate-fade-in shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#ccff00] text-gray-950 font-bold flex items-center justify-center text-sm shadow-[0_0_12px_#ccff00]">
                      {activeHUDClient.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white leading-tight">{activeHUDClient.name}</h4>
                      <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-white/60" /> {activeHUDClient.city}
                      </p>
                    </div>
                  </div>
                  <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10 font-bold">
                    {activeHUDClient.frequency}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Explorando:</span>
                    <strong className="text-white font-medium text-right truncate max-w-[140px]">{activeHUDClient.currentSection}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Total Compras:</span>
                    <strong className="text-[#ccff00] font-mono font-bold">${activeHUDClient.totalSpent.toFixed(2)} USD</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Historial:</span>
                    <span className="text-white/80">{activeHUDClient.purchasesCount} pedidos realizados</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Dispositivo:</span>
                    <span className="text-white/80">{activeHUDClient.device}</span>
                  </div>
                </div>

                {activeHUDClient.hasCart && (
                  <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-[10.5px]">
                    <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                      <ShoppingBag className="w-3 h-3" /> Con ítems en el carrito
                    </span>
                    <span className="font-mono text-white font-bold">{activeHUDClient.cartItemsCount || 1} pzs</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* TAB CONTENT B: CORE METRICS OVERVIEW */}
            {activeTab === "metrics" ? (
              <div className="space-y-4">
                
                {/* Metric 1: Online Volume & Stage Filter (Clarified: Todos, En Carrito, Recurrentes) */}
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
            ) : (
              /* TAB CONTENT C: CLIENTS LIST WITH LUMINOUS NEON GREEN SLIDER BAR */
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
                        onClick={() => setSelectedClient(c)}
                        className={`p-2.5 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-all border ${
                          isSelected 
                            ? "bg-white text-gray-950 font-bold border-[#ccff00] shadow-[0_0_16px_rgba(204,255,0,0.35)]" 
                            : "bg-black/40 hover:bg-black/70 text-white/85 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isSelected 
                              ? "bg-gray-950 text-[#ccff00]" 
                              : c.isRealUser 
                              ? "bg-emerald-400 text-gray-950 shadow-[0_0_10px_#34d399]" 
                              : "bg-gradient-to-tr from-amber-400 to-yellow-200 text-gray-950"
                          }`}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="leading-tight truncate font-semibold">{c.name}</p>
                            <p className={`text-[9.5px] mt-0.5 ${isSelected ? "text-gray-700 font-medium" : "text-white/45"}`}>
                              {c.city.split(" ")[0]} • <span className="font-mono">${c.totalSpent}</span>
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
                    className="absolute w-full bg-[#ccff00] rounded-full shadow-[0_0_12px_#ccff00] transition-all duration-75"
                  />
                </div>
              </div>
            )}

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
      <div className="absolute bottom-5 left-6 right-6 lg:right-96 z-30 grid grid-cols-1 sm:grid-cols-3 gap-3 pointer-events-auto">
        
        {/* Card 1: Cobertura Territorial (Conservada) */}
        <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-3.5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#ccff00]" /> Alcance Territorial
            </span>
            <span className="text-[9px] font-mono text-white/50">8 Regiones</span>
          </div>
          <p className="text-[10px] text-white/70">
            Sierra • Costa • Amazonía • Galápagos
          </p>
          <div className="flex items-center gap-1 text-[9.5px] font-mono text-[#ccff00] mt-1">
            <span>Envío a domicilio 100% verificado</span>
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

        {/* Card 3: IA Predictiva Radar (Reemplazo de latencia por métricas de negocio reales) */}
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
