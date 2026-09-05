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
  Tablet 
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
  region: "europe" | "america" | "global";
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
  const [filterType, setFilterType] = useState<"all" | "cart" | "vip" | "europe" | "america">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [livePingsCount, setLivePingsCount] = useState(24);

  // Periodic heartbeat simulation for live radar feeling
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePingsCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(18, Math.min(32, prev + delta));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Connected clients dataset built dynamically from registered addresses + realistic simulated sessions
  const connectedClients: ConnectedClient[] = useMemo(() => {
    const baseClients: ConnectedClient[] = [
      {
        id: "cli-1",
        name: "Valeria Montejo",
        email: "valeria.m@lumina.com",
        city: "Madrid",
        country: "España",
        x: 48.5,
        y: 39.2,
        frequency: "Semanal (VIP)",
        purchasesCount: 9,
        totalSpent: 1840,
        currentSection: "Lámparas Nova LED",
        intentScore: 94,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 2,
        region: "europe"
      },
      {
        id: "cli-2",
        name: "Carlos De la Hoz",
        email: "carlos.dlh@gmail.com",
        city: "Barcelona",
        country: "España",
        x: 50.8,
        y: 38.0,
        frequency: "Quincenal",
        purchasesCount: 5,
        totalSpent: 920,
        currentSection: "Mesas de Roble Escandinavo",
        intentScore: 88,
        device: "Móvil",
        hasCart: true,
        cartItemsCount: 1,
        region: "europe"
      },
      {
        id: "cli-3",
        name: "Elena Rostova",
        email: "elena.design@studio.de",
        city: "Berlín",
        country: "Alemania",
        x: 52.4,
        y: 31.8,
        frequency: "Mensual",
        purchasesCount: 4,
        totalSpent: 1350,
        currentSection: "Colección Minimalista",
        intentScore: 79,
        device: "Desktop",
        hasCart: false,
        region: "europe"
      },
      {
        id: "cli-4",
        name: "Mateo Bianchi",
        email: "mateo.b@milano.it",
        city: "Milán",
        country: "Italia",
        x: 51.6,
        y: 36.4,
        frequency: "Semanal (VIP)",
        purchasesCount: 12,
        totalSpent: 2890,
        currentSection: "Sillones Boucle Crudo",
        intentScore: 96,
        device: "Tablet",
        hasCart: true,
        cartItemsCount: 3,
        region: "europe"
      },
      {
        id: "cli-5",
        name: "Sophie Laurent",
        email: "sophie.l@atelier.fr",
        city: "París",
        country: "Francia",
        x: 49.2,
        y: 34.1,
        frequency: "Ocasional",
        purchasesCount: 2,
        totalSpent: 430,
        currentSection: "Espejos Orgánicos LED",
        intentScore: 72,
        device: "Móvil",
        hasCart: false,
        region: "europe"
      },
      {
        id: "cli-6",
        name: "Oliver Smith",
        email: "oliver.s@archit.co.uk",
        city: "Londres",
        country: "Reino Unido",
        x: 47.8,
        y: 31.2,
        frequency: "Quincenal",
        purchasesCount: 7,
        totalSpent: 1680,
        currentSection: "Iluminación Arquitectónica",
        intentScore: 91,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 1,
        region: "europe"
      },
      {
        id: "cli-7",
        name: "Alejandro Morales",
        email: "alejandro.m@valencia.es",
        city: "Valencia",
        country: "España",
        x: 49.6,
        y: 40.5,
        frequency: "Mensual",
        purchasesCount: 3,
        totalSpent: 620,
        currentSection: "Lámparas de Pie Artemide",
        intentScore: 84,
        device: "Móvil",
        hasCart: false,
        region: "europe"
      },
      {
        id: "cli-8",
        name: "Lucía Fernández",
        email: "lucia.f@sevilla.es",
        city: "Sevilla",
        country: "España",
        x: 47.4,
        y: 41.6,
        frequency: "Primera vez",
        purchasesCount: 1,
        totalSpent: 195,
        currentSection: "Rebajas & Descuentos",
        intentScore: 68,
        device: "Móvil",
        hasCart: true,
        cartItemsCount: 1,
        region: "europe"
      },
      {
        id: "cli-9",
        name: "Julian Sterling",
        email: "j.sterling@nycloft.com",
        city: "Nueva York",
        country: "EE.UU.",
        x: 28.5,
        y: 36.2,
        frequency: "Semanal (VIP)",
        purchasesCount: 15,
        totalSpent: 4200,
        currentSection: "Edición Limitada Bestseller",
        intentScore: 98,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 4,
        region: "america"
      },
      {
        id: "cli-10",
        name: "Camila Restrepo",
        email: "camila.r@diseno.co",
        city: "Bogotá",
        country: "Colombia",
        x: 29.2,
        y: 56.4,
        frequency: "Quincenal",
        purchasesCount: 6,
        totalSpent: 1120,
        currentSection: "Comedores Nórdicos",
        intentScore: 87,
        device: "Móvil",
        hasCart: true,
        cartItemsCount: 2,
        region: "america"
      },
      {
        id: "cli-11",
        name: "Rodrigo Albarrán",
        email: "rodrigo.cdmx@studio.mx",
        city: "Ciudad de México",
        country: "México",
        x: 21.8,
        y: 48.0,
        frequency: "Mensual",
        purchasesCount: 4,
        totalSpent: 870,
        currentSection: "Lámparas Colgantes Vidrio",
        intentScore: 83,
        device: "Desktop",
        hasCart: false,
        region: "america"
      },
      {
        id: "cli-12",
        name: "Mia Thorne",
        email: "mia.t@miamiliving.com",
        city: "Miami",
        country: "EE.UU.",
        x: 26.8,
        y: 44.5,
        frequency: "Ocasional",
        purchasesCount: 3,
        totalSpent: 750,
        currentSection: "Muebles de Terraza & Salón",
        intentScore: 76,
        device: "Tablet",
        hasCart: true,
        cartItemsCount: 1,
        region: "america"
      },
      {
        id: "cli-13",
        name: "Joaquín Larreta",
        email: "j.larreta@ba.ar",
        city: "Buenos Aires",
        country: "Argentina",
        x: 33.5,
        y: 78.8,
        frequency: "Semanal (VIP)",
        purchasesCount: 8,
        totalSpent: 1980,
        currentSection: "Salas Modulares Cuero",
        intentScore: 92,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 2,
        region: "america"
      },
      {
        id: "cli-14",
        name: "Ethan Walker",
        email: "ethan.w@california.io",
        city: "Los Ángeles",
        country: "EE.UU.",
        x: 18.2,
        y: 39.4,
        frequency: "Quincenal",
        purchasesCount: 5,
        totalSpent: 1290,
        currentSection: "Iluminación Inteligente",
        intentScore: 86,
        device: "Móvil",
        hasCart: false,
        region: "america"
      },
      {
        id: "cli-15",
        name: "Florencia Paz",
        email: "florencia.paz@santiago.cl",
        city: "Santiago",
        country: "Chile",
        x: 29.4,
        y: 77.2,
        frequency: "Ocasional",
        purchasesCount: 2,
        totalSpent: 380,
        currentSection: "Textiles de Lino Crudo",
        intentScore: 74,
        device: "Móvil",
        hasCart: false,
        region: "america"
      },
      {
        id: "cli-16",
        name: "Kenji Takahashi",
        email: "kenji.t@ginza.jp",
        city: "Tokio",
        country: "Japón",
        x: 85.8,
        y: 39.0,
        frequency: "Mensual",
        purchasesCount: 7,
        totalSpent: 2150,
        currentSection: "Lámparas Cerámica Wabi-Sabi",
        intentScore: 90,
        device: "Desktop",
        hasCart: true,
        cartItemsCount: 2,
        region: "global"
      },
      {
        id: "cli-17",
        name: "Liam O'Connor",
        email: "liam.oc@sydney.au",
        city: "Sídney",
        country: "Australia",
        x: 88.5,
        y: 76.5,
        frequency: "Primera vez",
        purchasesCount: 1,
        totalSpent: 290,
        currentSection: "Sillas de Tilo Esculpidas",
        intentScore: 81,
        device: "Móvil",
        hasCart: true,
        cartItemsCount: 1,
        region: "global"
      },
      {
        id: "cli-18",
        name: "Astrid Lindgren",
        email: "astrid.l@nordic.se",
        city: "Estocolmo",
        country: "Suecia",
        x: 52.8,
        y: 25.5,
        frequency: "Quincenal",
        purchasesCount: 6,
        totalSpent: 1740,
        currentSection: "Luminarias Colgantes Vidrio",
        intentScore: 89,
        device: "Desktop",
        hasCart: false,
        region: "europe"
      }
    ];

    // Real User Dynamic Integration: If the user has saved shipping addresses, inject them with priority!
    if (addresses && addresses.length > 0) {
      addresses.forEach((addr, idx) => {
        const cityLower = (addr.city || "").toLowerCase();
        let cx = 48.5 + (idx * 1.5);
        let cy = 39.2 + (idx * 1.2);
        let reg: "europe" | "america" | "global" = "europe";

        if (cityLower.includes("madrid")) { cx = 48.5; cy = 39.2; }
        else if (cityLower.includes("barcelona")) { cx = 50.8; cy = 38.0; }
        else if (cityLower.includes("valencia")) { cx = 49.6; cy = 40.5; }
        else if (cityLower.includes("sevilla")) { cx = 47.4; cy = 41.6; }
        else if (cityLower.includes("bogota") || cityLower.includes("bogotá") || cityLower.includes("colombia")) { cx = 29.2; cy = 56.4; reg = "america"; }
        else if (cityLower.includes("mexico") || cityLower.includes("méxico") || cityLower.includes("cdmx")) { cx = 21.8; cy = 48.0; reg = "america"; }
        else if (cityLower.includes("buenos aires") || cityLower.includes("argentina")) { cx = 33.5; cy = 78.8; reg = "america"; }
        else if (cityLower.includes("lima") || cityLower.includes("peru")) { cx = 28.2; cy = 65.4; reg = "america"; }

        baseClients.unshift({
          id: `user-addr-${addr.id || idx}`,
          name: addr.recipient || user?.name || "Tu Sesión (Activo)",
          email: user?.email || "admin@lumina.com",
          city: addr.city || "Madrid",
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
      // Filter tab
      if (filterType === "cart" && !c.hasCart) return false;
      if (filterType === "vip" && !c.frequency.includes("VIP")) return false;
      if (filterType === "europe" && c.region !== "europe") return false;
      if (filterType === "america" && c.region !== "america") return false;

      // Text search
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

  // Aggregate Metrics for Quick Glance
  const activeCartClientsCount = useMemo(() => {
    return connectedClients.filter(c => c.hasCart).length;
  }, [connectedClients]);

  const vipClientsCount = useMemo(() => {
    return connectedClients.filter(c => c.frequency.includes("VIP")).length;
  }, [connectedClients]);

  const averageIntentScore = useMemo(() => {
    if (connectedClients.length === 0) return 0;
    const sum = connectedClients.reduce((acc, c) => acc + c.intentScore, 0);
    return Math.round(sum / connectedClients.length);
  }, [connectedClients]);

  // Target client for HUD (either hovered or locked selected)
  const activeHUDClient = hoveredClient || selectedClient;

  return (
    <div className="space-y-8 animate-fade-in text-gray-900 pb-12">
      
      {/* ========================================================================= */}
      {/* SECTION 1: RADAR COMMAND HEADER (Orion Style Ambient Header) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#12161f] via-[#171c26] to-[#0f131a] p-6 sm:p-8 text-white border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.25)]">
        
        {/* Glow Spheres Backdrop */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8c9276]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Activity className="w-3 h-3 animate-pulse text-amber-400" />
                Lumina Radar Engine
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                Actualización algorítmica viva (Sin rastreo GPS)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white flex items-center gap-3">
              Radar Geográfico de Conexión
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-lg bg-white/10 text-gray-300 border border-white/10">
                Live Feed
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mt-1.5 leading-relaxed">
              Visualiza en tiempo real de qué ciudades y países se conectan tus clientes al navegar por los {categories.length} nichos y {products.length} piezas de la tienda. Las coordenadas se alimentan automáticamente cuando los clientes registran sus direcciones y realizan pedidos en la plataforma.
            </p>
          </div>

          {/* Quick Metrics Capsule Array (Inspired by Orion Header Badges) */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            
            {/* Pill 1: Total Online */}
            <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Conectados
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-display text-white">{connectedClients.length}</span>
                <span className="text-[10px] text-emerald-400 font-bold">+18%</span>
              </div>
              <span className="text-[10px] text-gray-400 truncate">En sesión activa</span>
            </div>

            {/* Pill 2: With Active Cart */}
            <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-amber-400" /> Carrito
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-display text-amber-300">{activeCartClientsCount}</span>
                <span className="text-[10px] text-gray-400 font-medium">de {connectedClients.length}</span>
              </div>
              <span className="text-[10px] text-gray-400 truncate">Preparando pedido</span>
            </div>

            {/* Pill 3: Intent Score */}
            <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#a3e635]" /> Match Compra
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-display text-[#a3e635]">{averageIntentScore}%</span>
                <span className="text-[10px] text-[#a3e635] font-bold">Alta</span>
              </div>
              <span className="text-[10px] text-gray-400 truncate">Interés comercial</span>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: THE INTERACTIVE WORLD RADAR MAP (Featuring Glowing Vertical Pins) */}
      {/* ========================================================================= */}
      <div className="relative rounded-[2.5rem] bg-[#0c1017] border border-neutral-800/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
        
        {/* Top Floating Controls Bar */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 relative z-20 bg-neutral-950/40 backdrop-blur-xl">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-2xl border border-white/10 text-xs font-semibold">
            <button 
              onClick={() => setFilterType("all")} 
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterType === "all" ? "bg-amber-400 text-gray-950 font-bold shadow-md shadow-amber-400/20" : "text-gray-400 hover:text-white"
              }`}
            >
              Todos ({connectedClients.length})
            </button>
            <button 
              onClick={() => setFilterType("cart")} 
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === "cart" ? "bg-amber-400 text-gray-950 font-bold shadow-md shadow-amber-400/20" : "text-gray-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Con Bolsa ({activeCartClientsCount})
            </button>
            <button 
              onClick={() => setFilterType("vip")} 
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === "vip" ? "bg-amber-400 text-gray-950 font-bold shadow-md shadow-amber-400/20" : "text-gray-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Clientes VIP ({vipClientsCount})
            </button>
            <button 
              onClick={() => setFilterType("europe")} 
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer hidden md:inline-block ${
                filterType === "europe" ? "bg-amber-400 text-gray-950 font-bold shadow-md shadow-amber-400/20" : "text-gray-400 hover:text-white"
              }`}
            >
              Europa
            </button>
            <button 
              onClick={() => setFilterType("america")} 
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer hidden md:inline-block ${
                filterType === "america" ? "bg-amber-400 text-gray-950 font-bold shadow-md shadow-amber-400/20" : "text-gray-400 hover:text-white"
              }`}
            >
              América
            </button>
          </div>

          {/* Search / Filter Quick Input */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtrar por ciudad, cliente o sección..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-400 w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{filteredClients.length} en radar</span>
            </div>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* THE MAP CANVAS (Stylized High-Tech Radar with Glowing Vertical Pins) */}
        {/* ======================================================================= */}
        <div className="relative w-full h-[520px] sm:h-[620px] bg-[#0b0e14] overflow-hidden select-none">
          
          {/* Subtle Latitude / Longitude Radar Grid Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="radarGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <circle cx="60" cy="0" r="1.5" fill="rgba(255,255,255,0.3)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#radarGrid)" />
            {/* Concentric Radar Range Rings centered on Europe / Global */}
            <circle cx="50%" cy="40%" r="140" fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="40%" r="280" fill="none" stroke="rgba(245,158,11,0.08)" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="50%" cy="40%" r="420" fill="none" stroke="rgba(245,158,11,0.05)" strokeWidth="1" />
          </svg>

          {/* Stylized High-Tech Continents Silhouette (Vector Landmasses in Dark Slate) */}
          <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full pointer-events-none opacity-45" preserveAspectRatio="none">
            {/* North America */}
            <path d="M 120 70 Q 180 50 250 80 Q 300 120 280 180 Q 230 220 210 260 Q 170 230 140 180 Z" fill="#1b2230" stroke="#2a3547" strokeWidth="1" />
            {/* South America */}
            <path d="M 270 270 Q 340 310 320 390 Q 300 450 270 480 Q 250 430 260 340 Z" fill="#1b2230" stroke="#2a3547" strokeWidth="1" />
            {/* Europe */}
            <path d="M 460 90 Q 540 80 560 130 Q 520 180 480 190 Q 450 160 460 120 Z" fill="#1f2737" stroke="#36435a" strokeWidth="1" />
            {/* Africa */}
            <path d="M 460 200 Q 550 220 540 320 Q 510 420 480 440 Q 430 350 450 240 Z" fill="#1b2230" stroke="#2a3547" strokeWidth="1" />
            {/* Asia */}
            <path d="M 570 80 Q 750 70 860 130 Q 820 250 740 280 Q 640 250 570 170 Z" fill="#1b2230" stroke="#2a3547" strokeWidth="1" />
            {/* Australia */}
            <path d="M 800 340 Q 900 330 890 410 Q 830 430 790 390 Z" fill="#1b2230" stroke="#2a3547" strokeWidth="1" />
          </svg>

          {/* Ambient Lighting Gradients over Map */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* =================================================================== */}
          {/* THE GLOWING VERTICAL PINS ("Palito vertical amarillo con símbolo") */}
          {/* =================================================================== */}
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
                className="absolute z-20 -translate-x-1/2 -translate-y-full cursor-pointer group"
                onMouseEnter={() => setHoveredClient(client)}
                onMouseLeave={() => setHoveredClient(null)}
                onClick={() => setSelectedClient(prev => prev?.id === client.id ? null : client)}
              >
                {/* 1. Pulsing Ground Halo (Base on the map) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none">
                  <span className={`block rounded-full ${
                    client.isRealUser 
                      ? "w-4 h-4 bg-emerald-400/80 animate-ping shadow-[0_0_16px_#34d399]" 
                      : "w-3 h-3 bg-amber-400/70 animate-ping shadow-[0_0_12px_#f59e0b]"
                  }`} />
                  <span className={`block -mt-3 -ml-1 rounded-full ${
                    client.isRealUser 
                      ? "w-2 h-2 bg-emerald-300 shadow-[0_0_8px_#10b981]" 
                      : "w-2 h-2 bg-amber-300 shadow-[0_0_8px_#f59e0b]"
                  }`} />
                </div>

                {/* 2. THE VERTICAL GLOWING STEM ("Palito vertical amarillo") */}
                <div className="flex flex-col items-center">
                  
                  {/* Pin Head Beacon / Viñeta (Pulsing glowing capsule with icon/avatar) */}
                  <div className={`relative transition-all duration-300 flex items-center justify-center rounded-full border shadow-lg ${
                    isActive 
                      ? "scale-125 z-40 bg-white text-gray-950 border-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.9)]" 
                      : client.isRealUser 
                      ? "bg-gradient-to-tr from-emerald-500 to-teal-300 text-white border-white/80 shadow-[0_0_18px_rgba(16,185,129,0.8)]" 
                      : "bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 text-gray-950 border-white/70 shadow-[0_0_14px_rgba(245,158,11,0.6)]"
                  } w-7 h-7 sm:w-8 sm:h-8`}>
                    
                    {client.device === "Desktop" ? (
                      <Monitor className="w-3.5 h-3.5 shrink-0" />
                    ) : client.device === "Móvil" ? (
                      <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Tablet className="w-3.5 h-3.5 shrink-0" />
                    )}

                    {/* Tiny Cart Indicator on Head if shopping */}
                    {client.hasCart && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-600 text-white flex items-center justify-center text-[7.5px] font-extrabold border border-white">
                        {client.cartItemsCount || 1}
                      </span>
                    )}

                    {/* Ping ripple effect on top of beacon */}
                    <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-pulse pointer-events-none" />
                  </div>

                  {/* The Vertical Stem Line */}
                  <div className={`w-[2px] transition-all duration-300 ${
                    isActive 
                      ? "h-10 bg-gradient-to-t from-white via-amber-300 to-amber-400 shadow-[0_0_12px_#fde047]" 
                      : client.isRealUser 
                      ? "h-8 bg-gradient-to-t from-emerald-400 via-teal-300 to-emerald-200 shadow-[0_0_8px_#34d399]" 
                      : "h-7 bg-gradient-to-t from-amber-500 via-amber-400 to-amber-200 shadow-[0_0_8px_#f59e0b]"
                  }`} />

                  {/* Tiny Ground Contact Diamond */}
                  <div className="w-1.5 h-1.5 rotate-45 bg-amber-300 shadow-[0_0_6px_#fde047] shrink-0" />
                </div>

                {/* Floating Quick Label (Always visible city tag) */}
                <div className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wider transition-all pointer-events-none ${
                  isActive 
                    ? "bg-white text-gray-950 shadow-md scale-110" 
                    : "bg-black/60 text-gray-300 backdrop-blur-md border border-white/10"
                }`}>
                  {client.city}
                </div>

              </div>
            );
          })}

          {/* =================================================================== */}
          {/* THE FLOATING HUD DOSSIER CARD (Displays when hovering/clicking pin) */}
          {/* =================================================================== */}
          {activeHUDClient && (
            <div 
              style={{
                left: `${Math.min(Math.max(activeHUDClient.x, 18), 75)}%`,
                top: `${Math.min(Math.max(activeHUDClient.y - 12, 10), 55)}%`
              }}
              className="absolute z-50 -translate-x-1/2 pointer-events-auto transition-all duration-300 animate-fade-in"
            >
              <div className="w-80 sm:w-96 rounded-3xl bg-[#141922]/95 backdrop-blur-2xl border border-white/20 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.7)] text-white space-y-4">
                
                {/* HUD Header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                      {activeHUDClient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">
                          {activeHUDClient.name}
                        </h4>
                        {activeHUDClient.isRealUser && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Tu Ubicación
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">
                        {activeHUDClient.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center gap-1 text-[10px] font-semibold font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      En Vivo
                    </span>
                    {selectedClient && (
                      <button 
                        onClick={() => setSelectedClient(null)} 
                        className="text-gray-400 hover:text-white text-xs px-1 cursor-pointer"
                        title="Cerrar panel"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Location & Frequency Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
                      <MapPin className="w-3 h-3 text-amber-400" /> Ubicación
                    </span>
                    <p className="font-bold text-white truncate">
                      {activeHUDClient.city}, {activeHUDClient.country}
                    </p>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      {activeHUDClient.device} • SSL 256
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Frecuencia
                    </span>
                    <p className="font-bold text-amber-300 truncate">
                      {activeHUDClient.frequency}
                    </p>
                    <span className="text-[10px] text-gray-400 block">
                      {activeHUDClient.purchasesCount} {activeHUDClient.purchasesCount === 1 ? "compra realizada" : "compras efectuadas"}
                    </span>
                  </div>

                </div>

                {/* What they are currently browsing / shopping */}
                <div className="p-3 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <Eye className="w-3 h-3 text-blue-400" /> Navegando actualmente:
                    </span>
                    <span className="text-amber-400 font-mono">
                      {activeHUDClient.hasCart ? "En Bolsa de Compra" : "Viendo Catálogo"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    {activeHUDClient.currentSection}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-gray-400">
                    <span>Gasto acumulado: <strong className="text-white">${activeHUDClient.totalSpent.toFixed(2)} USD</strong></span>
                    <span className="text-emerald-400 font-bold">{activeHUDClient.intentScore}% Intención</span>
                  </div>
                </div>

                {/* Close instruction tip */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                  <span>Alimentado por direcciones registradas del cliente</span>
                  <span>{selectedClient ? "Clic fuera para soltar" : "Clic para fijar"}</span>
                </div>

              </div>
            </div>
          )}

          {/* Bottom Right Floating Map Compass & Status Indicator */}
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs text-gray-300 shadow-lg">
            <Compass className="w-4 h-4 text-amber-400 animate-[spin_12s_linear_infinite]" />
            <span className="font-mono text-[11px] text-gray-400">
              Escaneo activo: <strong className="text-white">{connectedClients.length} nodos</strong> • <span className="text-amber-400">{livePingsCount} pings/m</span>
            </span>
          </div>

          {/* Bottom Left Map Legend */}
          <div className="absolute bottom-5 left-5 z-20 hidden sm:flex items-center gap-4 bg-neutral-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[11px] text-gray-400 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span>Cliente conectado (Palito vertical)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>Tu dirección vinculada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Con carrito activo</span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: IN-DEPTH CUSTOMER BEHAVIOR & INTENT DECK (Orion AI Style) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-display font-bold text-xl text-gray-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#8c9276]" />
              Comportamiento, Interés & Frecuencia de Compra
            </h3>
            <p className="text-xs text-gray-500">
              Análisis predictivo de qué buscan los clientes, a qué sección se dirigen y con qué intención compran.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              +26.4% Ritmo de Compra
            </span>
          </div>
        </div>

        {/* 4 BENTO CARDS MATCHING THE ORION REFERENCE DECK */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* BENTO CARD 1: TOP SECTIONS TRAFFIC HEATMAP */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Secciones Más Visitadas
                </span>
                <Eye className="w-4 h-4 text-[#8c9276]" />
              </div>
              <h4 className="font-display font-bold text-lg text-gray-900">
                A qué sección van al entrar
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Volumen de tráfico y tiempo medio de navegación por nicho.
              </p>
            </div>

            {/* Progress Bars per section */}
            <div className="space-y-3 pt-1">
              {[
                { name: "Iluminación & Lámparas", pct: 42, time: "5m 48s", color: "bg-amber-500" },
                { name: "Salas & Sofás Nórdicos", pct: 28, time: "4m 12s", color: "bg-[#8c9276]" },
                { name: "Comedores & Mesas Roble", pct: 18, time: "3m 05s", color: "bg-blue-600" },
                { name: "Decoración & Espejos", pct: 12, time: "1m 50s", color: "bg-rose-500" },
              ].map((sec, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{sec.name}</span>
                    <span className="font-mono text-gray-500 text-[11px]">{sec.pct}% • {sec.time}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${sec.color}`} 
                      style={{ width: `${sec.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Nicho líder: <strong>Iluminación</strong></span>
              <span className="text-emerald-600 font-semibold">+14% vs sem. ant.</span>
            </div>
          </div>

          {/* BENTO CARD 2: PURCHASE INTENT & MATCH RINGS (Direct Orion Reference Recreation) */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Intención de Compra
                </span>
                <Zap className="w-4 h-4 text-[#a3e635]" />
              </div>
              <h4 className="font-display font-bold text-lg text-gray-900">
                Match & Conversión
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Probabilidad de cierre según artículos agregados a bolsa y favoritos.
              </p>
            </div>

            {/* Circular Gauge Indicators (Directly from Orion Mockup with Rings) */}
            <div className="flex items-center justify-around py-2">
              
              {/* Ring 1: 84% Match */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-100"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-amber-500 transition-all duration-1000"
                      strokeDasharray="84, 100"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-display font-bold text-lg text-gray-900">
                    84%
                  </span>
                </div>
                <span className="text-[11px] font-bold text-gray-800 mt-1.5">Intención Alta</span>
                <span className="text-[10px] text-gray-400">Listos para pagar</span>
              </div>

              {/* Ring 2: 89% Retention */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-100"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-1000"
                      strokeDasharray="89, 100"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-display font-bold text-lg text-gray-900">
                    89%
                  </span>
                </div>
                <span className="text-[11px] font-bold text-gray-800 mt-1.5">Fidelidad</span>
                <span className="text-[10px] text-gray-400">Recompran en tienda</span>
              </div>

            </div>

            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Ratio de conversión: <strong>3.8%</strong></span>
              <span className="text-amber-600 font-semibold">Excelente</span>
            </div>
          </div>

          {/* BENTO CARD 3: PURCHASE FREQUENCY & TREND VELOCITY */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Frecuencia de Compra
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-display font-bold text-lg text-gray-900">
                ¿Han subido o bajado?
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Evolución de compras por cliente en los últimos 6 meses.
              </p>
            </div>

            {/* Sparkline / Monthly Trend Bars */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold font-display text-gray-900">+26.4%</span>
                <span className="text-xs text-emerald-600 font-bold">Al alza ↗</span>
              </div>

              {/* Mini Interactive Trend Bar Chart */}
              <div className="flex items-end justify-between h-20 pt-2 gap-1.5 border-b border-gray-100 pb-1">
                {[
                  { month: "Mar", height: 35, orders: 12 },
                  { month: "Abr", height: 45, orders: 16 },
                  { month: "May", height: 40, orders: 14 },
                  { month: "Jun", height: 60, orders: 22 },
                  { month: "Jul", height: 75, orders: 28 },
                  { month: "Ago", height: 92, orders: 35 },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer" title={`${item.month}: ${item.orders} compras`}>
                    <div 
                      className="w-full rounded-lg bg-emerald-500 group-hover:bg-emerald-600 transition-all"
                      style={{ height: `${item.height}%` }}
                    />
                    <span className="text-[9px] font-mono text-gray-400 group-hover:text-gray-900">
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-gray-500 flex items-center justify-between">
              <span>Intervalo medio:</span>
              <strong className="text-gray-900">1 compra cada 16 días</strong>
            </div>
          </div>

          {/* BENTO CARD 4: WHAT CLIENTS SEARCH FOR THE MOST (Trending Queries) */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Términos Más Buscados
                </span>
                <Search className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-display font-bold text-lg text-gray-900">
                Qué es lo que más quieren
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Productos con mayor intención de búsqueda en tienda.
              </p>
            </div>

            {/* Tag Cloud with Hits */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { tag: "Lámpara arco", count: 184, isHot: true },
                { tag: "Mesa roble", count: 142, isHot: true },
                { tag: "AGOTADO", count: 118, isAlert: true },
                { tag: "Sillón boucle", count: 95 },
                { tag: "Espejo LED", count: 74 },
                { tag: "Lino crudo", count: 62 },
                { tag: "Nova LED", count: 54 },
              ].map((item, idx) => (
                <span 
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    item.isAlert 
                      ? "bg-red-50 text-red-700 border border-red-200 font-bold" 
                      : item.isHot 
                      ? "bg-amber-50 text-amber-900 border border-amber-200 font-bold" 
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {item.isHot && <Flame className="w-3 h-3 text-amber-500" />}
                  {item.tag}
                  <span className="text-[9.5px] opacity-60">({item.count})</span>
                </span>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Alerta de stock:</span>
              <span className="text-red-600 font-bold">118 buscan artículos agotados</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
