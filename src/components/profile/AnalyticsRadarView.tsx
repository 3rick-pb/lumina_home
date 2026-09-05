"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  MapPin, 
  TrendingUp, 
  Sparkles, 
  Search, 
  ShoppingBag, 
  Eye, 
  Compass, 
  Activity, 
  Flame, 
  Zap, 
  Smartphone, 
  Monitor, 
  Tablet,
  RotateCcw
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
  intentScore: number; // 0 - 100 %
  device: "Desktop" | "Móvil" | "Tablet";
  hasCart: boolean;
  cartItemsCount?: number;
  region: "norte" | "centro" | "sur" | "costa";
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
  products,
  categories
}: AnalyticsRadarViewProps) {
  // Interactive HUD & Filter States
  const [hoveredClient, setHoveredClient] = useState<ConnectedClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<ConnectedClient | null>(null);
  const [filterType, setFilterType] = useState<"all" | "cart" | "vip" | "norte" | "costa">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [livePingsCount, setLivePingsCount] = useState(28);
  const [is3DTilted, setIs3DTilted] = useState(true);

  // Periodic heartbeat simulation for live radar feeling
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePingsCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(22, Math.min(36, prev + delta));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Connected clients dataset built dynamically from registered addresses + realistic simulated sessions
  // Distributed geographically over the 3D relief terrain map!
  const connectedClients: ConnectedClient[] = useMemo(() => {
    const baseClients: ConnectedClient[] = [
      {
        id: "cli-1",
        name: "Valeria Montejo",
        email: "valeria.m@lumina.com",
        city: "Distrito Capital (Centro)",
        country: "España",
        x: 51,
        y: 45,
        frequency: "Semanal (VIP)",
        purchasesCount: 9,
        totalSpent: 1840,
        currentSection: "Lámparas Nova LED",
        intentScore: 94,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 2,
        region: "centro"
      },
      {
        id: "cli-2",
        name: "Carlos De la Hoz",
        email: "carlos.dlh@gmail.com",
        city: "Cuenca Najafgarh & Bahía",
        country: "España",
        x: 74,
        y: 31,
        frequency: "Quincenal",
        purchasesCount: 5,
        totalSpent: 920,
        currentSection: "Mesas de Roble Escandinavo",
        intentScore: 88,
        device: "Móvil",
        hasCart: true,
        cartItemsCount: 1,
        region: "costa"
      },
      {
        id: "cli-3",
        name: "Elena Rostova",
        email: "elena.design@studio.de",
        city: "Cumbres Arala Norte",
        country: "Alemania",
        x: 24,
        y: 39,
        frequency: "Mensual",
        purchasesCount: 4,
        totalSpent: 1350,
        currentSection: "Colección Minimalista",
        intentScore: 79,
        device: "Desktop",
        hasCart: false,
        region: "norte"
      },
      {
        id: "cli-4",
        name: "Mateo Bianchi",
        email: "mateo.b@milano.it",
        city: "Ribera del Río Sahibi",
        country: "Italia",
        x: 54,
        y: 62,
        frequency: "Semanal (VIP)",
        purchasesCount: 12,
        totalSpent: 2890,
        currentSection: "Sillones Boucle Crudo",
        intentScore: 96,
        device: "Tablet",
        hasCart: true,
        cartItemsCount: 3,
        region: "centro"
      },
      {
        id: "cli-5",
        name: "Sophie Laurent",
        email: "sophie.l@atelier.fr",
        city: "Meseta Aravalli Sur",
        country: "Francia",
        x: 26,
        y: 71,
        frequency: "Ocasional",
        purchasesCount: 2,
        totalSpent: 430,
        currentSection: "Espejos Orgánicos LED",
        intentScore: 72,
        device: "Móvil",
        hasCart: false,
        region: "sur"
      },
      {
        id: "cli-6",
        name: "Oliver Smith",
        email: "oliver.s@archit.co.uk",
        city: "Región Gurgaon Alto",
        country: "Reino Unido",
        x: 22,
        y: 26,
        frequency: "Quincenal",
        purchasesCount: 7,
        totalSpent: 1680,
        currentSection: "Iluminación Arquitectónica",
        intentScore: 91,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 1,
        region: "norte"
      },
      {
        id: "cli-7",
        name: "Alejandro Morales",
        email: "alejandro.m@valencia.es",
        city: "Delta Yamuna",
        country: "España",
        x: 83,
        y: 28,
        frequency: "Mensual",
        purchasesCount: 3,
        totalSpent: 620,
        currentSection: "Lámparas de Pie Artemide",
        intentScore: 84,
        device: "Móvil",
        hasCart: false,
        region: "costa"
      },
      {
        id: "cli-8",
        name: "Lucía Fernández",
        email: "lucia.f@sevilla.es",
        city: "Valle Verde del Río",
        country: "España",
        x: 48,
        y: 21,
        frequency: "Primera vez",
        purchasesCount: 1,
        totalSpent: 195,
        currentSection: "Rebajas & Descuentos",
        intentScore: 68,
        device: "Móvil",
        hasCart: true,
        cartItemsCount: 1,
        region: "norte"
      },
      {
        id: "cli-9",
        name: "Julian Sterling",
        email: "j.sterling@nycloft.com",
        city: "Distrito Financiero Central",
        country: "EE.UU.",
        x: 44,
        y: 48,
        frequency: "Semanal (VIP)",
        purchasesCount: 15,
        totalSpent: 4200,
        currentSection: "Edición Limitada Bestseller",
        intentScore: 98,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 4,
        region: "centro"
      },
      {
        id: "cli-10",
        name: "Camila Restrepo",
        email: "camila.r@diseno.co",
        city: "Colinas del Sur",
        country: "Colombia",
        x: 38,
        y: 74,
        frequency: "Quincenal",
        purchasesCount: 6,
        totalSpent: 1120,
        currentSection: "Comedores Nórdicos",
        intentScore: 87,
        device: "Móvil",
        hasCart: true,
        cartItemsCount: 2,
        region: "sur"
      },
      {
        id: "cli-11",
        name: "Rodrigo Albarrán",
        email: "rodrigo.cdmx@studio.mx",
        city: "Laguna Najafgarh Este",
        country: "México",
        x: 64,
        y: 38,
        frequency: "Mensual",
        purchasesCount: 4,
        totalSpent: 870,
        currentSection: "Lámparas Colgantes Vidrio",
        intentScore: 83,
        device: "Desktop",
        hasCart: false,
        region: "costa"
      },
      {
        id: "cli-12",
        name: "Mia Thorne",
        email: "mia.t@miamiliving.com",
        city: "Valle Central Sahibi",
        country: "EE.UU.",
        x: 58,
        y: 53,
        frequency: "Ocasional",
        purchasesCount: 3,
        totalSpent: 750,
        currentSection: "Muebles de Terraza & Salón",
        intentScore: 76,
        device: "Tablet",
        hasCart: true,
        cartItemsCount: 1,
        region: "centro"
      }
    ];

    // Real User Dynamic Integration: If the user has saved shipping addresses, inject them with priority!
    if (addresses && addresses.length > 0) {
      addresses.forEach((addr, idx) => {
        const cityLower = (addr.city || "").toLowerCase();
        let cx = 50 + (idx * 4);
        let cy = 46 + (idx * 3);
        let reg: "norte" | "centro" | "sur" | "costa" = "centro";

        if (cityLower.includes("madrid") || cityLower.includes("centro")) { cx = 51; cy = 46; reg = "centro"; }
        else if (cityLower.includes("barcelona") || cityLower.includes("costa") || cityLower.includes("valencia")) { cx = 76; cy = 33; reg = "costa"; }
        else if (cityLower.includes("sevilla") || cityLower.includes("sur") || cityLower.includes("malaga")) { cx = 32; cy = 72; reg = "sur"; }
        else if (cityLower.includes("bilbao") || cityLower.includes("norte") || cityLower.includes("galicia")) { cx = 26; cy = 28; reg = "norte"; }

        baseClients.unshift({
          id: `user-addr-${addr.id || idx}`,
          name: addr.recipient || user?.name || "Tu Sesión (Activo)",
          email: user?.email || "admin@lumina.com",
          city: `${addr.city || "Madrid"} • Región ${reg.toUpperCase()}`,
          country: addr.country || "España",
          x: cx,
          y: cy,
          frequency: orders.length > 5 ? "Semanal (VIP)" : orders.length > 0 ? "Quincenal" : "Primera vez",
          purchasesCount: orders.length,
          totalSpent: orders.reduce((acc, o) => acc + o.total, 0),
          currentSection: "Explorando: Radar de Analítica Lumina",
          intentScore: 99,
          device: "Desktop",
          hasCart: true,
          cartItemsCount: 2,
          region: reg,
          isRealUser: true
        });
      });
    }

    return baseClients;
  }, [addresses, user, orders]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return connectedClients.filter(c => {
      if (filterType === "cart" && !c.hasCart) return false;
      if (filterType === "vip" && !c.frequency.includes("VIP")) return false;
      if (filterType === "norte" && c.region !== "norte") return false;
      if (filterType === "costa" && c.region !== "costa") return false;

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
  }, [connectedClients, filterType, searchQuery]);

  const activeCartClientsCount = useMemo(() => {
    return connectedClients.filter(c => c.hasCart).length;
  }, [connectedClients]);

  const averageIntentScore = useMemo(() => {
    if (connectedClients.length === 0) return 0;
    const sum = connectedClients.reduce((acc, c) => acc + c.intentScore, 0);
    return Math.round(sum / connectedClients.length);
  }, [connectedClients]);

  const activeHUDClient = hoveredClient || selectedClient;

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 select-none">
      
      {/* ========================================================================= */}
      {/* 1. TOP COMPACT HUD COMMAND BAR (Integrated Video Game Header) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0f141d] border border-white/10 p-4 sm:px-6 sm:py-3.5 shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
        
        {/* Brand & Live Pulse Tag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Compass className="w-5 h-5 text-gray-950 animate-[spin_16s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base sm:text-lg tracking-tight text-white leading-none">
                Lumina Orion Radar
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Activity className="w-2.5 h-2.5 animate-pulse text-amber-400" />
                Live 3D HUD
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Supervisión de {categories.length} nichos y {products.length} piezas • Alimentado por direcciones reales
            </p>
          </div>
        </div>

        {/* Filters & Mode Switcher */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setFilterType("all")} 
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === "all" ? "bg-amber-400 text-gray-950 font-bold shadow-xs" : "text-gray-400 hover:text-white"
              }`}
            >
              Todos ({connectedClients.length})
            </button>
            <button 
              onClick={() => setFilterType("cart")} 
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterType === "cart" ? "bg-amber-400 text-gray-950 font-bold shadow-xs" : "text-gray-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3 h-3" /> Con Bolsa ({activeCartClientsCount})
            </button>
            <button 
              onClick={() => setFilterType("vip")} 
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterType === "vip" ? "bg-amber-400 text-gray-950 font-bold shadow-xs" : "text-gray-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3 h-3" /> VIP
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, ciudad..."
              className="pl-7 pr-3 py-1 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-400 w-36 sm:w-48"
            />
          </div>

          {/* 3D Tilt View Toggle */}
          <button 
            onClick={() => setIs3DTilted(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 transition-colors cursor-pointer text-xs"
            title="Alternar perspectiva 3D isométrica"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{is3DTilted ? "Vista Isométrica 3D" : "Vista Cenital 2D"}</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. THE MAIN CONSOLE STAGE: 3D MAP CENTERED WITH FLANKING HUD WIDGETS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT FLANK WIDGETS (3 cols - Orion Style Conversion & Retention) */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-4">
          
          {/* Orion Circle Match Widget 1 */}
          <div className="p-5 rounded-3xl bg-[#111622] border border-white/10 shadow-lg text-white space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Orion Match Engine
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="flex items-center gap-4 py-1">
              {/* Circular Gauge from Orion Reference */}
              <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-neutral-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-400 transition-all duration-1000"
                    strokeDasharray="84, 100"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-display font-bold text-base text-white">
                  84%
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Intención Alta</h4>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Usuarios con piezas en bolsa o lista de deseos
                </p>
                <span className="text-[10px] text-amber-400 font-bold mt-1 block">
                  +5.8% esta semana
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
              <span>Conversión estimada</span>
              <strong className="text-white font-mono">{averageIntentScore}% índice</strong>
            </div>
          </div>

          {/* Orion Circle Match Widget 2 */}
          <div className="p-5 rounded-3xl bg-[#111622] border border-white/10 shadow-lg text-white space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Fidelidad & Recompra
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#a3e635]" />
            </div>

            <div className="flex items-center gap-4 py-1">
              {/* Circular Gauge 2 from Orion Reference */}
              <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-neutral-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-1000"
                    strokeDasharray="89, 100"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-display font-bold text-base text-white">
                  89%
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Tasa Recurrente</h4>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Clientes que compran de nuevo cada 16 días
                </p>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                  Nivel Excelente
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
              <span>Valor promedio pedido</span>
              <strong className="text-white font-mono">$384.50 USD</strong>
            </div>
          </div>

        </div>

        {/* CENTER STAGE: THE REAL 3D EXTRUDED RELIEF TERRAIN MAP (6 cols) */}
        <div className="lg:col-span-6 relative rounded-3xl bg-[#090d14] border border-neutral-800 p-3 sm:p-4 shadow-2xl flex flex-col justify-between overflow-hidden min-h-[460px]">
          
          {/* Top Map Status Bar */}
          <div className="flex items-center justify-between px-2 pb-2 relative z-30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                MAPA TOPOGRÁFICO EN RELIEVE 3D
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
              {filteredClients.length} balizas activas
            </span>
          </div>

          {/* 3D SCENE PERSPECTIVE CONTAINER */}
          <div 
            className="relative w-full flex-1 flex items-center justify-center overflow-hidden my-auto"
            style={{ perspective: "1100px" }}
          >
            
            {/* THE 3D ISOMETRIC RELIEF ISLAND (Extruded Topography like Reference Image 2) */}
            <div 
              className={`relative w-full max-w-[500px] aspect-[1/0.88] transition-transform duration-700 ease-out origin-center ${
                is3DTilted ? "scale-95 hover:scale-[0.98]" : "scale-100"
              }`}
              style={{
                transform: is3DTilted ? "rotateX(28deg) rotateZ(-6deg)" : "none",
                transformStyle: "preserve-3d"
              }}
            >
              
              {/* LAYER 1: Deep 3D Cast Shadow Beneath the Extruded Slab */}
              <div 
                className="absolute inset-x-4 -bottom-6 h-24 rounded-[3rem] bg-black/80 blur-2xl pointer-events-none -z-20"
                style={{ transform: "translateZ(-40px)" }}
              />

              {/* LAYER 2: The 3D Extruded Bedrock Slab / Base (The dark thick lateral edge from Image 2) */}
              <svg viewBox="0 0 600 520" className="absolute inset-0 w-full h-full pointer-events-none -z-10" style={{ transform: "translateZ(-14px)" }}>
                {/* Thick lateral extruded rim of the terrain block */}
                <path 
                  d="M 280 40 
                     L 480 110 L 550 200 L 530 330 L 410 440 L 320 490 L 190 460 L 90 350 L 70 210 L 150 90 Z" 
                  fill="#0e131d" 
                  stroke="#1c2536" 
                  strokeWidth="8"
                />
                <path 
                  d="M 190 460 L 320 490 L 410 440 L 410 470 L 320 520 L 190 490 Z" 
                  fill="#080b11" 
                />
                <path 
                  d="M 410 440 L 530 330 L 530 360 L 410 470 Z" 
                  fill="#0a0e16" 
                />
                <path 
                  d="M 90 350 L 190 460 L 190 490 L 90 380 Z" 
                  fill="#0b0f17" 
                />
              </svg>

              {/* LAYER 3: TOPOGRAPHIC RELIEF TERRAIN SURFACE (Detailed relief with rivers, ridges & green valleys) */}
              <svg viewBox="0 0 600 520" className="w-full h-full drop-shadow-2xl">
                <defs>
                  {/* Terrain Elevation Gradient (Valleys to Mountain Ridges) */}
                  <linearGradient id="terrainRelief" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3d6346" />
                    <stop offset="25%" stopColor="#4f7a55" />
                    <stop offset="45%" stopColor="#6e8a60" />
                    <stop offset="65%" stopColor="#8c7750" />
                    <stop offset="85%" stopColor="#75523b" />
                    <stop offset="100%" stopColor="#4e3526" />
                  </linearGradient>

                  {/* River & Lake Shimmer Gradient */}
                  <linearGradient id="riverWater" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>

                  {/* Mountain Shadow Shading */}
                  <radialGradient id="mountainRidgeGlow" cx="40%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                    <stop offset="70%" stopColor="rgba(0,0,0,0.3)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
                  </radialGradient>
                </defs>

                {/* 1. Main Terrain Block Perimeter (Topographic outline matching reference shape) */}
                <path 
                  d="M 280 40 
                     C 350 50, 420 80, 480 110 
                     C 530 140, 560 170, 550 200 
                     C 530 240, 540 280, 530 330 
                     C 490 380, 460 410, 410 440 
                     C 370 470, 350 480, 320 490 
                     C 270 480, 230 470, 190 460 
                     C 140 430, 100 390, 90 350 
                     C 70 300, 60 250, 70 210 
                     C 80 160, 110 120, 150 90 
                     C 190 60, 240 40, 280 40 Z" 
                  fill="url(#terrainRelief)" 
                  stroke="#1c2536" 
                  strokeWidth="3"
                />

                {/* 2. Topographic Mountain Contours & Shaded Ridges (Aravalli & Arala Hills from Image 2) */}
                <g fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1">
                  {/* Western Hills */}
                  <path d="M 120 180 Q 160 150 210 200 Q 240 250 190 300 Q 140 320 120 250 Z" fill="#6d543b" opacity="0.75" />
                  <path d="M 140 200 Q 170 180 200 220 Q 210 260 170 280 Z" fill="#4d3725" opacity="0.85" />
                  <path d="M 155 215 Q 180 205 190 230 Q 190 250 175 260 Z" fill="#382517" />

                  {/* Southern Mountain Range */}
                  <path d="M 160 380 Q 220 340 280 390 Q 340 440 270 460 Q 200 450 160 380 Z" fill="#5f4935" opacity="0.8" />
                  <path d="M 180 400 Q 230 370 270 410 Q 290 430 240 445 Z" fill="#422f20" />

                  {/* Eastern Highland Slopes */}
                  <path d="M 420 160 Q 480 140 510 190 Q 520 260 460 270 Q 400 240 420 160 Z" fill="#574332" opacity="0.7" />
                  <path d="M 440 180 Q 480 170 495 210 Q 480 240 450 235 Z" fill="#3b2b1d" />
                </g>

                {/* 3. Lush Green Central Valley & Basins */}
                <path d="M 230 110 Q 320 90 390 140 Q 410 260 350 320 Q 290 350 250 280 Q 200 220 230 110 Z" fill="#345e3c" opacity="0.6" />

                {/* 4. Natural Hydrography: Winding Sahibi River & Tributaries (Cyan water from Image 2) */}
                <g fill="none" stroke="url(#riverWater)" strokeLinecap="round">
                  {/* Central Ancient River Course */}
                  <path d="M 290 50 Q 285 100 280 140 T 295 220 T 310 300 T 300 380 T 285 450 T 290 485" strokeWidth="6" opacity="0.9" />
                  <path d="M 290 50 Q 285 100 280 140 T 295 220 T 310 300 T 300 380 T 285 450 T 290 485" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />

                  {/* Tributary to Eastern Bay (Najafgarh & Yamuna in Image 2) */}
                  <path d="M 305 170 Q 380 160 440 190 T 520 160 T 545 170" strokeWidth="4" opacity="0.85" />
                  {/* Tributary to Western Hills */}
                  <path d="M 285 240 Q 230 260 180 240 T 130 270" strokeWidth="3" opacity="0.75" />
                  {/* Tributary to Southern Lake */}
                  <path d="M 305 340 Q 360 360 380 400" strokeWidth="2.5" opacity="0.7" />
                </g>

                {/* 5. Lakes & Water Basins (Sapphire reservoirs from Image 2) */}
                <ellipse cx="230" cy="180" rx="14" ry="10" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <ellipse cx="380" cy="200" rx="12" ry="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <ellipse cx="440" cy="330" rx="16" ry="11" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <ellipse cx="340" cy="390" rx="13" ry="9" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <ellipse cx="530" cy="165" rx="18" ry="14" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />

                {/* 6. Realistic Region Names Written Across the Relief (As in Image 2) */}
                <g fill="rgba(255,255,255,0.85)" fontSize="10.5" fontFamily="sans-serif" fontWeight="bold">
                  <text x="235" y="75" textAnchor="middle" fill="#f8fafc">Río Sahibi (Curso Norte)</text>
                  <text x="140" y="145">Región Gurgaon</text>
                  <text x="135" y="235">Cumbres Arala</text>
                  <text x="140" y="425">Meseta Aravalli</text>
                  <text x="435" y="145">Bahía Yamuna</text>
                  <text x="410" y="210">Cuenca Najafgarh</text>
                  <text x="360" y="340">Valle Sur Sahibi</text>
                </g>

                {/* 7. Classic Compass Rose on bottom left (From Image 2) */}
                <g transform="translate(65, 430) scale(0.65)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                  <line x1="0" y1="-30" x2="0" y2="30" />
                  <line x1="-30" y1="0" x2="30" y2="0" />
                  <polygon points="0,-30 4,-6 0,0 -4,-6" fill="#f59e0b" />
                  <polygon points="0,30 4,6 0,0 -4,6" fill="rgba(255,255,255,0.4)" />
                  <polygon points="30,0 6,4 0,0 6,-4" fill="rgba(255,255,255,0.4)" />
                  <polygon points="-30,0 -6,4 0,0 -6,-4" fill="rgba(255,255,255,0.4)" />
                  <text x="0" y="-35" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">N</text>
                </g>
              </svg>

              {/* LAYER 4: THE GLOWING VERTICAL PINS ("Palito vertical amarillo con viñeta") */}
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
                    onClick={() => setSelectedClient(prev => prev?.id === client.id ? null : client)}
                  >
                    {/* 1. Ground Contact Pulse (Base anchored to 3D terrain) */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none">
                      <span className={`block rounded-full ${
                        client.isRealUser 
                          ? "w-4 h-4 bg-emerald-400/80 animate-ping shadow-[0_0_16px_#34d399]" 
                          : "w-3.5 h-3.5 bg-amber-400/80 animate-ping shadow-[0_0_14px_#f59e0b]"
                      }`} />
                      <span className={`block -mt-3 -ml-0.5 rounded-full ${
                        client.isRealUser 
                          ? "w-2.5 h-2.5 bg-emerald-300 shadow-[0_0_10px_#10b981]" 
                          : "w-2.5 h-2.5 bg-amber-300 shadow-[0_0_10px_#f59e0b]"
                      }`} />
                    </div>

                    {/* 2. Vertical Stem & Glowing Head Beacon */}
                    <div className="flex flex-col items-center">
                      
                      {/* Beacon Head (Viñeta con dispositivo o inicial) */}
                      <div className={`relative transition-all duration-300 flex items-center justify-center rounded-full border shadow-xl ${
                        isActive 
                          ? "scale-125 z-40 bg-white text-gray-950 border-amber-300 shadow-[0_0_26px_rgba(245,158,11,1)]" 
                          : client.isRealUser 
                          ? "bg-gradient-to-tr from-emerald-500 to-teal-300 text-white border-white shadow-[0_0_18px_rgba(16,185,129,0.8)]" 
                          : "bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 text-gray-950 border-white/80 shadow-[0_0_16px_rgba(245,158,11,0.7)]"
                      } w-7 h-7`}>
                        
                        {client.device === "Desktop" ? (
                          <Monitor className="w-3.5 h-3.5 shrink-0" />
                        ) : client.device === "Móvil" ? (
                          <Smartphone className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Tablet className="w-3.5 h-3.5 shrink-0" />
                        )}

                        {client.hasCart && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-600 text-white flex items-center justify-center text-[7.5px] font-extrabold border border-white">
                            {client.cartItemsCount || 1}
                          </span>
                        )}

                        <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-pulse pointer-events-none" />
                      </div>

                      {/* The Vertical Yellow Stem Line ("Palito vertical amarillo") */}
                      <div className={`w-[2.5px] transition-all duration-300 ${
                        isActive 
                          ? "h-10 bg-gradient-to-t from-white via-amber-300 to-amber-400 shadow-[0_0_14px_#fde047]" 
                          : client.isRealUser 
                          ? "h-8 bg-gradient-to-t from-emerald-400 via-teal-300 to-emerald-200 shadow-[0_0_10px_#34d399]" 
                          : "h-7 bg-gradient-to-t from-amber-500 via-amber-400 to-amber-200 shadow-[0_0_10px_#f59e0b]"
                      }`} />

                      {/* Ground Contact Diamond */}
                      <div className="w-1.5 h-1.5 rotate-45 bg-amber-300 shadow-[0_0_8px_#fde047] shrink-0" />
                    </div>

                    {/* Floating Label (City / Node Name) */}
                    <div className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wider transition-all pointer-events-none ${
                      isActive 
                        ? "bg-white text-gray-950 shadow-md scale-110" 
                        : "bg-black/75 text-gray-200 backdrop-blur-md border border-white/10"
                    }`}>
                      {client.city.split("•")[0]}
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          {/* FLOATING HUD DOSSIER CARD (Displays smoothly over hovered/selected pin) */}
          {activeHUDClient && (
            <div className="absolute top-12 left-4 right-4 sm:left-auto sm:right-4 z-50 pointer-events-auto transition-all duration-300 animate-fade-in sm:w-80">
              <div className="rounded-3xl bg-[#121722]/95 backdrop-blur-2xl border border-white/20 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white space-y-3">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                      {activeHUDClient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-white truncate">{activeHUDClient.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{activeHUDClient.email}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-bold font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En Línea
                  </span>
                </div>

                {/* Location & Frequency */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="text-[9.5px] text-gray-400 flex items-center gap-1 uppercase font-semibold">
                      <MapPin className="w-3 h-3 text-amber-400" /> Territorio
                    </span>
                    <p className="font-bold text-white truncate mt-0.5">{activeHUDClient.city}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="text-[9.5px] text-gray-400 flex items-center gap-1 uppercase font-semibold">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Frecuencia
                    </span>
                    <p className="font-bold text-amber-300 truncate mt-0.5">{activeHUDClient.frequency}</p>
                  </div>
                </div>

                {/* Section browsing */}
                <div className="p-2.5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[9.5px] font-bold text-gray-400 uppercase">
                    <span className="flex items-center gap-1 text-gray-300">
                      <Eye className="w-3 h-3 text-blue-400" /> Explorando:
                    </span>
                    <span className="text-emerald-400 font-mono">{activeHUDClient.intentScore}% Intención</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{activeHUDClient.currentSection}</p>
                  <p className="text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    Gasto acumulado: <strong className="text-white">${activeHUDClient.totalSpent.toFixed(2)} USD</strong> ({activeHUDClient.purchasesCount} pedidos)
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Bottom Bar Controls */}
          <div className="flex items-center justify-between px-2 pt-2 border-t border-white/10 text-[11px] text-gray-400 relative z-30">
            <span className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Balizas en Relieve 3D</span>
            </span>
            <span className="font-mono text-gray-500">
              Escaneo activo: {livePingsCount} pings/min
            </span>
          </div>

        </div>

        {/* RIGHT FLANK WIDGETS (3 cols - Device Distribution & Activity Velocity) */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-4">
          
          {/* Device Distribution Card */}
          <div className="p-5 rounded-3xl bg-[#111622] border border-white/10 shadow-lg text-white space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Dispositivos de Conexión
              </span>
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5"><Monitor className="w-3 h-3 text-blue-400" /> Desktop</span>
                  <span className="font-mono text-gray-300">54%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "54%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5"><Smartphone className="w-3 h-3 text-emerald-400" /> Móvil</span>
                  <span className="font-mono text-gray-300">36%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "36%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5"><Tablet className="w-3 h-3 text-amber-400" /> Tablet</span>
                  <span className="font-mono text-gray-300">10%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: "10%" }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
              <span>Tráfico dominante</span>
              <strong className="text-white">Escritorio</strong>
            </div>
          </div>

          {/* Purchasing Velocity & Trend Card */}
          <div className="p-5 rounded-3xl bg-[#111622] border border-white/10 shadow-lg text-white space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Velocidad de Compra
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-display text-white">+26.4%</span>
                <span className="text-[11px] text-emerald-400 font-bold">Al alza ↗</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Aceleración de pedidos en los últimos 6 meses.
              </p>
            </div>

            {/* Mini Monthly Bar Sparkline */}
            <div className="flex items-end justify-between h-12 gap-1.5 pt-1">
              {[35, 45, 40, 60, 75, 94].map((val, idx) => (
                <div key={idx} className="flex-1 bg-neutral-800 rounded-md overflow-hidden h-full flex flex-col justify-end">
                  <div className="bg-emerald-400 rounded-md transition-all" style={{ height: `${val}%` }} />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
              <span>Frecuencia media</span>
              <strong className="text-white">1 compra / 16 días</strong>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM COMPACT DOCK: WHAT CLIENTS WANT & SEARCH (Orion Lower Row) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* DOCK CARD 1: SECCIONES MÁS VISITADAS */}
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Secciones Más Visitadas
            </span>
            <Eye className="w-3.5 h-3.5 text-[#8c9276]" />
          </div>
          <h4 className="font-bold text-sm text-gray-900">
            A qué sección entran primero
          </h4>

          <div className="space-y-2">
            {[
              { name: "Iluminación & Lámparas", pct: 42, color: "bg-amber-500" },
              { name: "Salas & Sofás Nórdicos", pct: 28, color: "bg-[#8c9276]" },
              { name: "Comedores & Mesas Roble", pct: 18, color: "bg-blue-600" },
              { name: "Decoración & Espejos", pct: 12, color: "bg-rose-500" },
            ].map((sec, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                  <span>{sec.name}</span>
                  <span className="font-mono text-gray-500">{sec.pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${sec.color}`} style={{ width: `${sec.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DOCK CARD 2: TENDENCIAS DE COMPRA */}
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Hábitos & Comportamiento
              </span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <h4 className="font-bold text-sm text-gray-900">
              Con qué intención compran
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              El <strong>84% de los visitantes</strong> interactúa con las especificaciones técnicas o añade productos al carrito antes de 4 minutos.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-900">Horario Pico de Pedidos:</span>
            <p className="text-xs font-bold text-amber-950 font-mono">19:30 - 22:45 hrs (Tarde / Noche)</p>
          </div>
        </div>

        {/* DOCK CARD 3: TÉRMINOS MÁS BUSCADOS & ALERTAS AGOTADO */}
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Términos Más Buscados
            </span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <h4 className="font-bold text-sm text-gray-900">
            Qué es lo que más quieren
          </h4>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              { tag: "Lámpara arco", count: 184, isHot: true },
              { tag: "Mesa roble", count: 142, isHot: true },
              { tag: "AGOTADO", count: 118, isAlert: true },
              { tag: "Sillón boucle", count: 95 },
              { tag: "Espejo LED", count: 74 },
              { tag: "Lino crudo", count: 62 },
            ].map((item, idx) => (
              <span 
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-medium ${
                  item.isAlert 
                    ? "bg-red-50 text-red-700 border border-red-200 font-bold" 
                    : item.isHot 
                    ? "bg-amber-50 text-amber-900 border border-amber-200 font-semibold" 
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {item.isHot && <Flame className="w-2.5 h-2.5 text-amber-500" />}
                {item.tag}
                <span className="text-[9px] opacity-60">({item.count})</span>
              </span>
            ))}
          </div>

          <p className="text-[10px] text-red-600 font-semibold pt-1">
            ⚠️ 118 clientes buscan artículos con badge AGOTADO para reposición.
          </p>
        </div>

      </div>

    </div>
  );
}
