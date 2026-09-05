"use client";

import React, { useState, useMemo } from "react";
import { 
  MapPin, 
  Search, 
  ShoppingBag, 
  Sparkles, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Check, 
  X, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Share2, 
  SlidersHorizontal, 
  Bell, 
  Activity,
  TrendingUp
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

interface StrongMatchWidgetProps {
  percentage: number;
  isFavorite?: boolean;
}

function StrongMatchWidget({ percentage, isFavorite = false }: StrongMatchWidgetProps) {
  // SVG radius 38, circumference = 2 * Math.PI * 38 = 238.76
  const strokeDashoffset = 238.76 * (1 - percentage / 100);

  return (
    <div className="flex items-center justify-end gap-2.5 sm:gap-3.5 shrink-0">
      {/* Orion Interconnected Action Nodes Constellation */}
      <div className="relative flex flex-col items-center justify-between h-20 py-0.5">
        <div className="absolute top-2.5 bottom-2.5 w-[1.5px] bg-white/10" />

        {/* Top Node Cluster: Share & Close */}
        <div className="flex items-center gap-1 relative z-10">
          <button 
            aria-label="Compartir"
            className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all hover:scale-110 cursor-pointer"
          >
            <Share2 className="w-2.5 h-2.5" />
          </button>
          <button 
            aria-label="Descartar"
            className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all hover:scale-110 cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Middle Node: Active / Highlighted Heart (Neon Lime in Orion) */}
        <button 
          aria-label="Favorito"
          className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 cursor-pointer ${
            isFavorite 
              ? "bg-[#ccff00] text-gray-950 shadow-[0_0_14px_#ccff00]" 
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-gray-950" : ""}`} />
        </button>

        {/* Bottom Node: Checkmark */}
        <button 
          aria-label="Verificado"
          className="relative z-10 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-all hover:scale-110 cursor-pointer"
        >
          <Check className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Large High-End Circular Neon Gauge Ring (Direct Orion Recreation) */}
      <div className="relative w-24 h-24 sm:w-26 sm:h-26 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <defs>
            <filter id={`neonGlow-${percentage}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#ccff00" floodOpacity="0.85" />
            </filter>
          </defs>

          {/* Neutral Background Track */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="7"
            fill="none"
          />

          {/* Active Neon Lime Arc with Round Endcaps */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="#ccff00"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="238.76"
            strokeDashoffset={strokeDashoffset}
            fill="none"
            filter={`url(#neonGlow-${percentage})`}
          />
        </svg>

        {/* Center Percentage & Strong Match Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="font-display font-extrabold text-2xl text-white leading-none tracking-tight">
            {percentage}%
          </span>
          <span className="text-[7.5px] font-extrabold text-[#ccff00] uppercase tracking-widest mt-1">
            Strong Match
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsRadarView({
  user,
  addresses,
  orders,
  products,
  categories
}: AnalyticsRadarViewProps) {
  // Navigation & interaction states
  const [hoveredClient, setHoveredClient] = useState<ConnectedClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<ConnectedClient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStage, setActiveStage] = useState<"catalog" | "cart" | "vip">("vip");

  // Connected clients distributed realistically across the 3D terrain map without overlapping
  const connectedClients: ConnectedClient[] = useMemo(() => {
    const baseClients: ConnectedClient[] = [
      {
        id: "cli-1",
        name: "Valeria Montejo",
        email: "valeria.m@lumina.com",
        city: "Quito (Andes Norte)",
        country: "Ecuador",
        x: 48,
        y: 28,
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
        x: 29,
        y: 54,
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
        x: 39,
        y: 68,
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
        x: 52,
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
        x: 8,
        y: 20,
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
        city: "Manta (Costa Oeste)",
        country: "Ecuador",
        x: 20,
        y: 38,
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
        city: "Amazonía (El Oriente)",
        country: "Ecuador",
        x: 72,
        y: 46,
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
        x: 36,
        y: 82,
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

    // Real User Dynamic Integration: If user has registered addresses, inject them with priority
    if (addresses && addresses.length > 0) {
      addresses.forEach((addr, idx) => {
        baseClients.unshift({
          id: `user-addr-${addr.id || idx}`,
          name: addr.recipient || user?.name || "Tu Sesión (Activo)",
          email: user?.email || "admin@lumina.com",
          city: addr.city || "Quito Centro",
          country: addr.country || "Ecuador",
          x: 48 + (idx * 5),
          y: 24 + (idx * 6),
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

  // Filtered clients list based on search or active pill stage
  const filteredClients = useMemo(() => {
    return connectedClients.filter(c => {
      if (activeStage === "cart" && !c.hasCart) return false;
      if (activeStage === "vip" && !c.frequency.includes("VIP")) return false;

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

  const activeHUDClient = hoveredClient || selectedClient;

  return (
    <div className="rounded-[2.5rem] overflow-hidden bg-[#2d3331] text-white shadow-2xl border border-white/10 select-none animate-fade-in font-sans">
      
      {/* ========================================================================= */}
      {/* SECTION 1: TOP SCENIC CANVAS (Moody Olive/Slate with Orion Floating Cards) */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 space-y-6 relative overflow-hidden bg-gradient-to-b from-[#383f3c] via-[#2f3533] to-[#262b29]">
        
        {/* Soft Ambient Light Gradient on Top */}
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[700px] h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. TOP NAVIGATION CAPSULE BAR (Direct Orion Recreation) */}
        <div className="relative z-30 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Lumina */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold text-sm tracking-tighter">
              L
            </div>
            <span className="font-bold text-lg tracking-wider text-white">LUMINA</span>
          </div>

          {/* Central Floating Search Capsule (As in Orion Mockup) */}
          <div className="flex items-center bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/20 shadow-md text-xs text-white max-w-lg w-full">
            <Search className="w-4 h-4 text-white/70 mr-2 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, nicho, producto..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/60 flex-1 min-w-0"
            />
            <span className="text-white/30 px-2">|</span>
            <div className="flex items-center gap-1 text-white/80 shrink-0 cursor-pointer pr-2">
              <MapPin className="w-3.5 h-3.5 text-white/70" />
              <span className="text-[11px] font-medium hidden sm:inline">Quito / Nacional</span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </div>
            <button className="bg-white text-gray-950 font-bold px-4 py-1.5 rounded-full text-xs hover:bg-white/90 transition-colors shrink-0 shadow-sm cursor-pointer">
              Buscar
            </button>
          </div>

          {/* Right Header Controls (Bell & Profile Avatar) */}
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 cursor-pointer">
              <Bell className="w-3.5 h-3.5" />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#ccff00] text-gray-950 font-bold flex items-center justify-center text-xs border border-white/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
          </div>

        </div>

        {/* 2. THE MAIN HERO STAGE: LEFT FLOATING WIDGET, CENTER 3D MAP, RIGHT FLOATING CARDS */}
        <div className="relative z-20 min-h-[480px] flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* ----------------------------------------------------------------- */}
          {/* LEFT COLUMN: TITLE & REALISTIC PURCHASING TREND CHART WIDGET      */}
          {/* ----------------------------------------------------------------- */}
          <div className="w-full lg:w-[305px] space-y-5 shrink-0 z-20">
            
            {/* Big Bold Typography with AI-Powered Capsule */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-sans font-extrabold text-3xl sm:text-4xl leading-tight text-white tracking-tight">
                  YOUR
                </h1>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white/90 border border-white/30 bg-white/10 backdrop-blur-md flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5 text-[#ccff00] animate-pulse" />
                  AI - Powered
                </span>
              </div>
              <h1 className="font-sans font-extrabold text-3xl sm:text-4xl leading-tight text-white tracking-tight">
                CLIENT RADAR
              </h1>
            </div>

            {/* REALISTIC NATURAL TREND CHART (Orion-style Dual-Spline Hatch Band) */}
            <div className="rounded-[2rem] bg-black/50 backdrop-blur-xl border border-white/15 p-5 shadow-2xl space-y-3.5 hover:border-white/25 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white tracking-tight block">
                    Frecuencia de Compra
                  </span>
                  <span className="text-[10px] text-[#ccff00] font-mono font-semibold flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" /> +28.4% Crecimiento Orgánico
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/60" />
              </div>

              {/* Orion-Style Dual Boundary Trend Corridor with Diagonal Hatching */}
              <div className="relative h-28 w-full flex items-center">
                
                {/* Subtle Left Y-Axis Levels */}
                <div className="absolute left-0 top-0 bottom-4 flex flex-col justify-between text-[8px] font-mono text-white/30 pointer-events-none select-none">
                  <span>Alto</span>
                  <span>Medio</span>
                  <span>Base</span>
                </div>

                <svg viewBox="0 0 290 95" className="w-full h-full overflow-visible ml-4">
                  <defs>
                    {/* Diagonal Hatch Pattern (Direct Orion Styling) */}
                    <pattern id="orionHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#ccff00" strokeWidth="1.3" strokeOpacity="0.38" />
                    </pattern>

                    {/* Gradient for the Hatch Corridor Glow */}
                    <linearGradient id="corridorGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                      <stop offset="40%" stopColor="#a3e635" stopOpacity="0.25" />
                      <stop offset="85%" stopColor="#ccff00" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#ccff00" stopOpacity="0.45" />
                    </linearGradient>

                    {/* Gradient Stroke for Upper and Lower Boundary Splines */}
                    <linearGradient id="splineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#a3e635" />
                      <stop offset="100%" stopColor="#ccff00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline Grids */}
                  <line x1="0" y1="18" x2="285" y2="18" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="46" x2="285" y2="46" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="74" x2="285" y2="74" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  {/* 1. Underlying Soft Color Wash for Trend Corridor */}
                  <path 
                    d="M 5 56
                       C 45 60, 75 48, 115 50
                       C 155 52, 175 32, 215 20
                       C 245 10, 265 14, 285 12
                       L 285 32
                       C 265 34, 245 30, 215 40
                       C 175 52, 155 72, 115 70
                       C 75 68, 45 80, 5 76
                       Z" 
                    fill="url(#corridorGlow)" 
                  />

                  {/* 2. Diagonal Hatch Striping Between Upper & Lower Curves (Orion Exact Recreation) */}
                  <path 
                    d="M 5 56
                       C 45 60, 75 48, 115 50
                       C 155 52, 175 32, 215 20
                       C 245 10, 265 14, 285 12
                       L 285 32
                       C 265 34, 245 30, 215 40
                       C 175 52, 155 72, 115 70
                       C 75 68, 45 80, 5 76
                       Z" 
                    fill="url(#orionHatch)" 
                  />

                  {/* 3. Upper Boundary Spline */}
                  <path 
                    d="M 5 56
                       C 45 60, 75 48, 115 50
                       C 155 52, 175 32, 215 20
                       C 245 10, 265 14, 285 12" 
                    fill="none" 
                    stroke="url(#splineStroke)" 
                    strokeWidth="2.2" 
                    strokeLinecap="round"
                  />

                  {/* 4. Lower Boundary Spline */}
                  <path 
                    d="M 5 76
                       C 45 80, 75 68, 115 70
                       C 155 72, 175 52, 215 40
                       C 245 30, 265 34, 285 32" 
                    fill="none" 
                    stroke="url(#splineStroke)" 
                    strokeWidth="1.8" 
                    strokeOpacity="0.85"
                    strokeLinecap="round"
                  />

                  {/* Pulsing Beacon Circle at the Surge Junction */}
                  <circle cx="215" cy="30" r="3.5" fill="#ffffff" stroke="#ccff00" strokeWidth="2" />
                  <circle cx="215" cy="30" r="8" fill="none" stroke="#ccff00" strokeWidth="1" opacity="0.6" className="animate-ping" />
                </svg>

                {/* Floating Neon Pill Flag on the Trend Surge (Orion Style) */}
                <div className="absolute left-[72%] top-2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#ccff00] text-gray-950 font-black text-[9.5px] shadow-[0_0_16px_#ccff00] flex items-center gap-1 border border-black/25">
                  <span>84%</span>
                </div>
              </div>

              {/* Stats Footer & Month Timeline */}
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-white/70">
                  <span>Recompra: <strong className="text-white font-mono">3.4x / cliente</strong></span>
                  <span className="text-[#ccff00] font-mono font-bold">$6,420 USD</span>
                </div>
                <div className="flex items-center justify-between text-[9.5px] font-mono text-white/40 pt-1">
                  <span>Ene</span>
                  <span>Mar</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Ago</span>
                </div>
              </div>
            </div>

          </div>

          {/* ----------------------------------------------------------------- */}
          {/* CENTER HERO: SEAMLESS 3D TOPOGRAPHIC RELIEF MAP                   */}
          {/* (Pristine 100% Transparent Cutout: Zero Box, Zero Rectangular Border)*/}
          {/* ----------------------------------------------------------------- */}
          <div className="flex-1 w-full flex items-center justify-center relative min-h-[420px] lg:min-h-[500px]">
            
            {/* The Floating 3D Map Container */}
            <div className="relative w-full max-w-[660px] aspect-[1024/682] flex items-center justify-center">
              
              {/* Soft Ground Reflection Shadow Beneath the 3D Landmass */}
              <div className="absolute inset-x-10 bottom-4 h-28 bg-black/75 blur-3xl rounded-full pointer-events-none -z-10" />

              {/* The Seamless 3D Relief Topographic Map (Pure Transparent Cutout - No rectangular PNG frame!) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/map_3d_relief_cutout.png" 
                alt="Mapa 3D Topográfico en Relieve del Territorio"
                className="w-full h-full object-contain pointer-events-none select-none filter contrast-110 brightness-105 drop-shadow-[0_26px_36px_rgba(0,0,0,0.65)]"
              />

              {/* Glowing Yellow Beacon Pins stationed accurately on geographic cities */}
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
                    {/* Ground Pulsing Halo */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none">
                      <span className={`block rounded-full ${
                        client.isRealUser 
                          ? "w-4 h-4 bg-emerald-400 animate-ping shadow-[0_0_14px_#34d399]" 
                          : "w-3 h-3 bg-[#ccff00] animate-ping shadow-[0_0_12px_#ccff00]"
                      }`} />
                    </div>

                    {/* Vertical Yellow Stem & Head Beacon */}
                    <div className="flex flex-col items-center">
                      
                      {/* Beacon Head with Device Icon */}
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

                      {/* The Vertical Yellow Stem Line */}
                      <div className={`w-[2px] transition-all duration-300 ${
                        isActive 
                          ? "h-9 bg-gradient-to-t from-[#ccff00] to-white shadow-[0_0_12px_#ccff00]" 
                          : "h-7 bg-gradient-to-t from-amber-400 to-yellow-200 shadow-[0_0_8px_#f59e0b]"
                      }`} />

                      <div className="w-1 h-1 bg-[#ccff00] rotate-45 shadow-[0_0_6px_#ccff00]" />
                    </div>

                    {/* City Tag Label with Clean Spacing */}
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

              {/* FLOATING HUD DOSSIER POPOVER (Hover) */}
              {activeHUDClient && (
                <div className="absolute top-2 right-2 z-50 pointer-events-auto transition-all duration-300 animate-fade-in w-72">
                  <div className="rounded-2xl bg-[#141817]/95 backdrop-blur-2xl border border-white/20 p-3.5 shadow-2xl text-white space-y-2.5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div>
                        <p className="font-bold text-xs text-white">{activeHUDClient.name}</p>
                        <p className="text-[10px] text-white/50">{activeHUDClient.city}, {activeHUDClient.country}</p>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/30 font-bold">
                        {activeHUDClient.frequency}
                      </span>
                    </div>
                    <div className="text-[11px] space-y-1">
                      <p className="text-white/70">Navegando: <strong className="text-white">{activeHUDClient.currentSection}</strong></p>
                      <p className="text-white/70">Gasto acumulado: <strong className="text-white">${activeHUDClient.totalSpent.toFixed(2)} USD</strong> ({activeHUDClient.purchasesCount} pedidos)</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT COLUMN: ORION FLOATING STAT CARDS (310px width)             */}
          {/* ----------------------------------------------------------------- */}
          <div className="w-full lg:w-[310px] space-y-4 shrink-0 z-20">
            
            {/* 1. CANDIDATES / CLIENTS ONLINE CARD (Direct Orion Recreation) */}
            <div className="rounded-[2rem] bg-black/45 backdrop-blur-xl border border-white/15 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-tight">
                  Clientes Online
                </span>
                <ArrowUpRight className="w-4 h-4 text-white/60" />
              </div>

              {/* 3 Metric Columns: 2 574 (32%), 4 131 (54%), 998 (14%) */}
              <div className="grid grid-cols-3 gap-2 text-left">
                <div>
                  <p className="font-display font-extrabold text-xl text-white">18</p>
                  <span className="text-[9.5px] font-mono text-white/50">Catálogo 32%</span>
                </div>
                <div>
                  <p className="font-display font-extrabold text-xl text-white">12</p>
                  <span className="text-[9.5px] font-mono text-white/50">Carrito 54%</span>
                </div>
                <div>
                  <p className="font-display font-extrabold text-xl text-white">6</p>
                  <span className="text-[9.5px] font-mono text-white/50">VIP 14%</span>
                </div>
              </div>

              {/* Segmented Pill Selector (Orion Style with Junior/Middle/Senior in Lime Neon) */}
              <div className="p-1 rounded-full bg-black/60 border border-white/10 grid grid-cols-3 text-center text-[10px] font-bold">
                <button 
                  onClick={() => setActiveStage("catalog")} 
                  className={`py-1.5 rounded-full transition-all cursor-pointer ${
                    activeStage === "catalog" ? "bg-white text-gray-950 shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  Catálogo
                </button>
                <button 
                  onClick={() => setActiveStage("cart")} 
                  className={`py-1.5 rounded-full transition-all cursor-pointer ${
                    activeStage === "cart" ? "bg-white text-gray-950 shadow-sm" : "text-white/60 hover:text-white"
                  }`}
                >
                  En Bolsa
                </button>
                <button 
                  onClick={() => setActiveStage("vip")} 
                  className={`py-1.5 rounded-full transition-all cursor-pointer ${
                    activeStage === "vip" ? "bg-[#ccff00] text-gray-950 shadow-[0_0_12px_#ccff00]" : "text-white/60 hover:text-white"
                  }`}
                >
                  VIP Checkout
                </button>
              </div>
            </div>

            {/* 2. ORION INDEX & VACANCIES / PIEZAS (Two Small Adjacent Cards) */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Card A: Orion Index */}
              <div className="rounded-[2rem] bg-black/45 backdrop-blur-xl border border-white/15 p-4 shadow-xl flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">Lumina Index</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/60" />
                </div>
                <div>
                  <p className="font-display font-bold text-2xl text-white">0.27 <sup className="text-[10px] text-emerald-400 font-mono">+6</sup></p>
                  <div className="flex items-center justify-between text-[9px] text-white/50 font-mono mt-1">
                    <span>Visitas</span>
                    <span>Compras</span>
                  </div>
                  {/* Slider indicator bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: "68%" }} />
                  </div>
                </div>
              </div>

              {/* Card B: Vacancies / Sesiones Activas with Equalizer Bars */}
              <div className="rounded-[2rem] bg-black/45 backdrop-blur-xl border border-white/15 p-4 shadow-xl flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">Actividad</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/60" />
                </div>
                <div>
                  <p className="font-display font-bold text-2xl text-white">1,420 <sup className="text-[10px] text-amber-400 font-mono">+37</sup></p>
                  {/* Equalizer Sound-Wave Bar Graph from Orion Mockup */}
                  <div className="flex items-end justify-between h-5 gap-1 pt-1">
                    {[35, 60, 45, 90, 75, 40, 80, 55, 95, 65].map((h, i) => (
                      <div key={i} className="flex-1 bg-white rounded-full" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: MIDDLE CONTROL STRIP (Orion Horizontal Pill Filters & Pag.)   */}
      {/* ========================================================================= */}
      <div className="px-6 py-3.5 bg-[#0e1110] border-y border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-white">
        
        {/* Horizontal Pill Filters from Orion: This week ⌄ • Remote ⌄ • $100k-$130k ⌄ • Full time ⌄ */}
        <div className="flex items-center flex-wrap gap-2 text-[11px]">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer">
            <span>Esta semana</span>
            <ChevronDown className="w-3 h-3 text-white/60" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer">
            <span>En vivo</span>
            <ChevronDown className="w-3 h-3 text-white/60" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer">
            <span>$50 - $800 USD</span>
            <ChevronDown className="w-3 h-3 text-white/60" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer">
            <span>{categories.length} Nichos • {products.length} Piezas</span>
            <ChevronDown className="w-3 h-3 text-white/60" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer">
            <span>Clientes VIP</span>
            <ChevronDown className="w-3 h-3 text-white/60" />
          </button>
          
          <button className="w-7 h-7 rounded-full bg-white text-gray-950 flex items-center justify-center shadow-sm cursor-pointer ml-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Pagination: ← 03 / 18 → */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-white tracking-wider">
            <strong className="text-white text-sm">03</strong> <span className="text-white/40">/ {connectedClients.length} Clientes</span>
          </span>
          <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: BOTTOM DECK (3 Matte Black Cards with Orion Neon Green Rings)   */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 bg-[#0a0c0b] grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ---------------------------------------------------- */}
        {/* CARD 1: ILUMINACIÓN & LÁMPARAS (Amazon Style in Orion) */}
        {/* ---------------------------------------------------- */}
        <div className="rounded-[2rem] bg-[#121517] border border-white/10 p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-white/25 transition-all">
          
          <div className="flex items-start justify-between gap-4">
            
            {/* Left Content */}
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-gray-950 font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
                  a
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight">Iluminación Nova LED</h4>
                  <p className="text-[11px] text-white/50 mt-0.5">Lumina Design • 6 min ago</p>
                </div>
              </div>

              {/* Tag Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] font-mono text-white/90">
                  $185/promedio
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] text-white/90 font-medium">
                  En Stock
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] text-white/90 font-medium">
                  Alta Demanda
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <span>Quito & Madrid</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">42% del tráfico</span>
              </div>
            </div>

            {/* Right Action Icons & HIGH-END NEON GAUGE (79% Strong Match) */}
            <StrongMatchWidget percentage={79} isFavorite={true} />

          </div>

          {/* Card Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/50">
            <ShoppingBag className="w-3.5 h-3.5 text-white/70" />
            <span>Más de 14 clientes navegando en esta sección en vivo</span>
          </div>

        </div>

        {/* ---------------------------------------------------- */}
        {/* CARD 2: SALAS & SOFÁS NÓRDICOS (BeReal Style in Orion) */}
        {/* ---------------------------------------------------- */}
        <div className="rounded-[2rem] bg-[#121517] border border-white/10 p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-white/25 transition-all">
          
          <div className="flex items-start justify-between gap-4">
            
            {/* Left Content */}
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white font-extrabold flex items-center justify-center text-xs border border-white/20 shrink-0">
                  L
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight">Salas & Sofás Nórdicos</h4>
                  <p className="text-[11px] text-white/50 mt-0.5">Lumina Atelier • 2 d ago</p>
                </div>
              </div>

              {/* Tag Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] font-mono text-white/90">
                  $840/promedio
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] text-white/90 font-medium">
                  Bestseller
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] text-white/90 font-medium">
                  Frecuente
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <span>Guayaquil & Costa</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">28% del tráfico</span>
              </div>
            </div>

            {/* Right Action Icons & HIGH-END NEON GAUGE (86% Strong Match) */}
            <StrongMatchWidget percentage={86} />

          </div>

          {/* Card Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/50">
            <ShoppingBag className="w-3.5 h-3.5 text-white/70" />
            <span>8 pedidos confirmados en las últimas 24 horas</span>
          </div>

        </div>

        {/* ---------------------------------------------------- */}
        {/* CARD 3: COMEDORES & ROBLE MACIZO (Wise Style in Orion)*/}
        {/* ---------------------------------------------------- */}
        <div className="rounded-[2rem] bg-[#121517] border border-white/10 p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-white/25 transition-all">
          
          <div className="flex items-start justify-between gap-4">
            
            {/* Left Content */}
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-gray-950 font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
                  W
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight">Comedores & Roble Macizo</h4>
                  <p className="text-[11px] text-white/50 mt-0.5">Lumina Craft • 3 d ago</p>
                </div>
              </div>

              {/* Tag Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] font-mono text-white/90">
                  $560/promedio
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] text-white/90 font-medium">
                  Edición Limitada
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10.5px] text-white/90 font-medium">
                  Exclusivo
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <span>Cuenca & Global</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">18% del tráfico</span>
              </div>
            </div>

            {/* Right Action Icons & HIGH-END NEON GAUGE (92% Strong Match) */}
            <StrongMatchWidget percentage={92} />

          </div>

          {/* Card Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/50">
            <Sparkles className="w-3.5 h-3.5 text-[#ccff00]" />
            <span>Alta tasa de clientes recurrentes VIP fidelizados</span>
          </div>

        </div>

      </div>

    </div>
  );
}
