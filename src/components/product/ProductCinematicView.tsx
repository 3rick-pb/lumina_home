"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Maximize2,
  Layers,
  Box, 
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  Zap,
  Cpu,
  Compass,
  Feather,
  Sliders,
  Award,
  Star,
  Coffee,
  HelpCircle,
  Eye,
  CheckCircle2,
  X
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";
import { cn } from "@/lib/utils";
import { Space_Mono } from "next/font/google";
import { useUserStore } from "@/lib/userStore";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

interface ProductCinematicViewProps {
  product: CatalogProduct;
  allProducts: CatalogProduct[];
  images: string[];
  activeImage: number;
  setActiveImage: (idx: number) => void;
  activeColor: number;
  setActiveColor: (idx: number) => void;
  activeSize: string;
  setActiveSize: (size: string) => void;
  handleAddToCart: () => void;
  isAdding: boolean;
  isAgotado: boolean;
  effectivePrice?: number;
}

type LightingMode = "studio" | "golden" | "midnight" | "neon";

interface EngineeringHotspot {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  metric: string;
  metricLabel: string;
  pinX: number;
  pinY: number;
}

const HOTSPOTS: EngineeringHotspot[] = [
  {
    id: 0,
    title: "Chasis Monolítico CNC",
    subtitle: "Tolerancia de 0.05 mm en aleación aeroespacial",
    tag: "Arquitectura",
    description: "Forjado a partir de un único bloque metálico sin uniones visibles. Anodizado electroquímico para una resistencia absoluta al desgaste y la decoloración por rayos UV.",
    metric: "99.8%",
    metricLabel: "Pureza Estructural",
    pinX: 26,
    pinY: 34,
  },
  {
    id: 1,
    title: "Manejo Térmico Pasivo",
    subtitle: "Disipación silenciosa de 0 decibeles",
    tag: "Acústica & Flujo",
    description: "Geometría de enfriamiento por convección natural inspirada en motores de precisión. Elimina vibraciones parásitas y prolonga la vida útil de los componentes por más de 12 años.",
    metric: "0 dB",
    metricLabel: "Emisión Sonora",
    pinX: 74,
    pinY: 30,
  },
  {
    id: 2,
    title: "Cristal Óptico & Textura Táctil",
    subtitle: "Recubrimiento oleofóbico nanoscópico",
    tag: "Superficie",
    description: "Tratamiento mate satinado que repele huellas dactilares y grasa natural de la piel. Cada superficie responde al tacto con una suavidad sedosa y una sensación de solidez incomparable.",
    metric: "9H",
    metricLabel: "Dureza Superficial",
    pinX: 32,
    pinY: 68,
  },
  {
    id: 3,
    title: "Calibración Ergonómica 360°",
    subtitle: "Centro de gravedad optimizado para estabilidad",
    tag: "Interacción",
    description: "Diseñado para interactuar con la iluminación natural de tu espacio a cualquier hora del día. Su silueta icónica genera una presencia equilibrada en cualquier estancia contemporánea.",
    metric: "100%",
    metricLabel: "Equilibrio Físico",
    pinX: 68,
    pinY: 72,
  },
];

const RITUAL_STEPS = [
  {
    step: "01",
    phase: "El Desempaquetado",
    brand: "Apple Packaging Philosophy",
    title: "La Apertura Asistida por Aire",
    desc: "Caja rígida biodegradable de fibra vegetal reciclada con sellado magnético. Al levantar la tapa, la resistencia del aire genera un descenso suave y cinematográfico de exactamente 3 segundos.",
    highlight: "Cero plásticos de un solo uso • Papel de estraza verjurado de 280g",
  },
  {
    step: "02",
    phase: "El Primer Contacto",
    brand: "Surface Precision Craft",
    title: "El Peso del Metal Frío",
    desc: "El primer instante en que tus manos tocan la pieza revela su equilibrio. La masa reconfortante del metal fresado absorbe lentamente la temperatura de tu piel en una experiencia háptica inolvidable.",
    highlight: "Satinado micro-pulido • Bordes con bisel de diamante de 45°",
  },
  {
    step: "03",
    phase: "La Integración Espacial",
    brand: "Starbucks Sensory Ritual",
    title: "La Atmósfera que Transforma la Habitación",
    desc: "Colócalo en tu mesa, repisa o centro de reunión. Su presencia no compite con el entorno; lo unifica, atrayendo la mirada y proyectando calma, elegancia y estatus silencioso.",
    highlight: "Reflejo difuso no intrusivo • Calidez lumínica certificada",
  },
];

const PRESS_ACCOLADES = [
  {
    quote: "La convergencia más depurada entre ergonomía industrial y poesía visual que hemos probado este año.",
    source: "Design Milk",
    award: "Best of Design 2026",
  },
  {
    quote: "Un objeto que no solo cumple su propósito con solvencia técnica, sino que embellece la estancia entera.",
    source: "Wallpaper* Magazine",
    award: "Design Excellence Award",
  },
  {
    quote: "Lumina ha alcanzado el nivel de refinamiento de las mejores casas de relojería suiza y tecnología de silicio.",
    source: "Architectural Digest",
    award: "Editor's Choice",
  },
  {
    quote: "Cero adornos superfluos. Solo pura ingeniería, tacto sublime y una durabilidad concebida para durar generaciones.",
    source: "Wired Innovation",
    award: "Gold Seal Innovation",
  },
];

const COMPARISONS = [
  {
    aspect: "Arquitectura Estructural",
    lumina: "Monobloque CNC con aleación aeroespacial (tolerancia 0.05mm)",
    generic: "Plásticos inyectados con holguras visibles y ensambles pegados",
    luminaWins: true,
  },
  {
    aspect: "Tratamiento Superficial",
    lumina: "Anodizado electroquímico multicapa grado 9H oleofóbico",
    generic: "Pintura electrostática estándar propensa a rayaduras y desgaste",
    luminaWins: true,
  },
  {
    aspect: "Acústica & Manejo Térmico",
    lumina: "Disipación pasiva estricta de 0 dB y cero zumbidos residuales",
    generic: "Ruido térmico audible y sobrecalentamiento progresivo",
    luminaWins: true,
  },
  {
    aspect: "Ciclo de Vida & Garantía",
    lumina: "10+ años de durabilidad estimada con respaldo integral de fábrica",
    generic: "Obsolescencia programada típica en 12 a 18 meses",
    luminaWins: true,
  },
  {
    aspect: "Empaque & Huella de Carbono",
    lumina: "100% fibra vegetal reciclada y compensación climática certificada",
    generic: "Poliestireno expandido, film plástico y residuos no degradables",
    luminaWins: true,
  },
];

const FAQS = [
  {
    q: "¿Cómo se limpia y conserva el acabado original?",
    a: "El tratamiento anodizado es altamente resistente a marcas de huellas y sudor. Basta con pasar un paño suave de microfibra seco o ligeramente humedecido con agua destilada. No se requieren productos químicos agresivos.",
  },
  {
    q: "¿Qué cobertura ofrece la garantía de fábrica Lumina?",
    a: "Cada unidad incluye garantía oficial contra defectos de ensamblaje, corrosión o fallos estructurales. Si experimentas cualquier irregularidad, nuestro equipo de soporte gestionará un reemplazo exprés sin costo adicional.",
  },
  {
    q: "¿Cómo se gestiona el envío seguro de piezas de alto valor?",
    a: "Todos los envíos se despachan con blindaje antigolpes reforzado, precinto de seguridad numerado y seguro de tránsito al 100%. Recibirás un enlace de rastreo en tiempo real desde el despacho hasta la entrega en tu puerta.",
  },
  {
    q: "¿Puedo coordinar devoluciones si el producto no se adapta a mi espacio?",
    a: "Sí. Ofrecemos 30 días de periodo de prueba en tu propio hogar. Si por cualquier motivo no encaja a la perfección con tu arquitectura o diseño interior, coordinamos el retiro asegurado con reembolso íntegro.",
  },
];

export function ProductCinematicView({
  product,
  allProducts,
  images,
  activeImage,
  setActiveImage,
  activeColor,
  setActiveColor,
  activeSize,
  setActiveSize,
  handleAddToCart,
  isAdding,
  isAgotado,
  effectivePrice
}: ProductCinematicViewProps) {
  const [lighting, setLighting] = useState<LightingMode>("studio");
  const [activeHotspot, setActiveHotspot] = useState<number>(0);
  const [activeRitual, setActiveRitual] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [showStickyDock, setShowStickyDock] = useState<boolean>(false);

  const heroRef = useRef<HTMLDivElement>(null);

  const { isFavorite, toggleFavorite } = useUserStore();
  const isFav = isFavorite(product.id);

  const currentPhoto = images[activeImage] || images[0] || product.imageUrl;
  const currentFinish = product.colors?.[activeColor] || { name: "Estándar", hex: "#18181b" };
  const priceToDisplay = effectivePrice ?? product.price;

  // Scroll listener for sticky keynote buy dock
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      // Show dock when the bottom of the hero scrolls out of view
      setShowStickyDock(rect.bottom < 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nextImage = () => {
    setActiveImage((activeImage + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImage((activeImage - 1 + images.length) % images.length);
  };

  // Lighting mode ambient styling
  const getLightingStyles = () => {
    switch (lighting) {
      case "golden":
        return {
          glow1: "rgba(245, 158, 11, 0.28)",
          glow2: "rgba(234, 88, 12, 0.2)",
          backdrop: "from-[#1a140d] via-[#120f0b] to-[#0a0806]",
          beam: "rgba(251, 191, 36, 0.15)",
          name: "Hora Dorada (Golden Sunset 3200K)",
        };
      case "midnight":
        return {
          glow1: "rgba(99, 102, 241, 0.25)",
          glow2: "rgba(59, 130, 246, 0.18)",
          backdrop: "from-[#080b18] via-[#090b14] to-[#04050a]",
          beam: "rgba(129, 140, 248, 0.12)",
          name: "Medianoche Profunda (Midnight Blue)",
        };
      case "neon":
        return {
          glow1: "rgba(6, 182, 212, 0.3)",
          glow2: "rgba(168, 85, 247, 0.2)",
          backdrop: "from-[#07131a] via-[#0b0c16] to-[#07050e]",
          beam: "rgba(34, 211, 238, 0.18)",
          name: "Ciberpunk Neón (Electric Glow)",
        };
      case "studio":
      default:
        return {
          glow1: currentFinish.hex ? `${currentFinish.hex}33` : "rgba(255, 255, 255, 0.12)",
          glow2: "rgba(59, 130, 246, 0.15)",
          backdrop: "from-[#0c0c14] via-[#0a0a0f] to-[#07070a]",
          beam: "rgba(255, 255, 255, 0.08)",
          name: "Estudio Neutral de Precisión (5500K)",
        };
    }
  };

  const lightStyle = getLightingStyles();
  const selectedHotspot = HOTSPOTS[activeHotspot];

  return (
    <div className={cn("w-full min-h-[90vh] text-zinc-900 dark:text-zinc-100 py-4 sm:py-8 space-y-16 sm:space-y-24 select-none", spaceMono.className)}>
      
      {/* ========================================================================= */}
      {/* 1. CINEMATIC HERO: PANTALLA MONUMENTAL CON LUZ AMBIENTAL Y CONTROLES PRO  */}
      {/* ========================================================================= */}
      <div 
        ref={heroRef}
        className={cn(
          "relative w-full rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl p-6 sm:p-10 lg:p-14 flex flex-col justify-between min-h-[82vh] lg:min-h-[88vh] transition-all duration-700 bg-gradient-to-b",
          lightStyle.backdrop
        )}
      >
        {/* Glows ambientales dinámicos */}
        <div 
          style={{ backgroundColor: lightStyle.glow1 }}
          className="absolute -top-36 -right-36 w-[550px] h-[550px] rounded-full blur-[150px] pointer-events-none transition-all duration-700"
        />
        <div 
          style={{ backgroundColor: lightStyle.glow2 }}
          className="absolute -bottom-36 -left-36 w-[550px] h-[550px] rounded-full blur-[150px] pointer-events-none transition-all duration-700"
        />

        {/* Haz de luz de estudio diagonal */}
        <div 
          style={{ background: `linear-gradient(135deg, ${lightStyle.beam} 0%, transparent 60%)` }}
          className="absolute inset-0 pointer-events-none transition-all duration-700"
        />

        {/* TOP BAR: BADGES, LIGHT SWITCHER, KEYNOTE SPECS & FAVORITE */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {product.badge || product.category || "Edición Exclusiva"}
              </span>
              <span className="text-[11px] text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                CINEMATIC KEYNOTE SHOWCASE
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline-block">
                • {lightStyle.name}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-none">
              {product.title}
            </h1>

            {product.titleHighlight && (
              <p className="text-sm sm:text-base text-zinc-400 italic max-w-2xl">
                &ldquo;{product.titleHighlight}&rdquo;
              </p>
            )}
          </div>

          {/* Selector de Iluminación de Estudio (Apple Studio Showcase) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setLighting("studio")}
                title="Estudio Neutral (5500K)"
                className={cn(
                  "p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold",
                  lighting === "studio" ? "bg-white text-zinc-950 shadow-md scale-105" : "text-zinc-400 hover:text-white"
                )}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Estudio</span>
              </button>

              <button
                type="button"
                onClick={() => setLighting("golden")}
                title="Hora Dorada (Atardecer Cálido)"
                className={cn(
                  "p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold",
                  lighting === "golden" ? "bg-amber-400 text-zinc-950 shadow-md scale-105" : "text-zinc-400 hover:text-amber-300"
                )}
              >
                <Sunset className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dorada</span>
              </button>

              <button
                type="button"
                onClick={() => setLighting("midnight")}
                title="Medianoche (Deep Contrast)"
                className={cn(
                  "p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold",
                  lighting === "midnight" ? "bg-indigo-500 text-white shadow-md scale-105" : "text-zinc-400 hover:text-indigo-300"
                )}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Noche</span>
              </button>

              <button
                type="button"
                onClick={() => setLighting("neon")}
                title="Ciber Neón (Tecnología)"
                className={cn(
                  "p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold",
                  lighting === "neon" ? "bg-cyan-400 text-zinc-950 shadow-md scale-105" : "text-zinc-400 hover:text-cyan-300"
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Neón</span>
              </button>
            </div>

            {/* Botón Favorito */}
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              className={cn(
                "w-11 h-11 rounded-2xl backdrop-blur-md border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-90",
                isFav ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-white/5 text-zinc-400 hover:text-white"
              )}
              title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
            >
              <Heart className={cn("w-5 h-5", isFav && "fill-current")} />
            </button>
          </div>
        </div>

        {/* CENTRO: ESCAPARATE MONUMENTAL CON HOTSPOTS Y NAVEGACIÓN 360 */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-8 sm:py-12">
          <div className="relative max-w-3xl w-full aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center">
            
            {/* Halo de pedestal lumínico */}
            <div 
              style={{ background: `radial-gradient(circle, ${lightStyle.glow1} 0%, transparent 70%)` }}
              className="absolute inset-0 scale-90 blur-2xl pointer-events-none transition-all duration-700"
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentPhoto}-${lighting}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full flex items-center justify-center cursor-zoom-in"
                onClick={() => setShowLightbox(true)}
                title="Haz clic para inspección en pantalla completa"
              >
                <img
                  src={currentPhoto}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.85)] rounded-2xl select-none"
                />
              </motion.div>
            </AnimatePresence>

            {/* Hotspots interactivos de ingeniería sobre la imagen */}
            {HOTSPOTS.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot(spot.id);
                }}
                style={{ left: `${spot.pinX}%`, top: `${spot.pinY}%` }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer transition-all duration-300",
                  activeHotspot === spot.id ? "scale-125" : "hover:scale-115 opacity-80 hover:opacity-100"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-60",
                    activeHotspot === spot.id ? "bg-blue-400" : "bg-white/40"
                  )} />
                  <span className={cn(
                    "relative inline-flex rounded-full h-6 w-6 items-center justify-center text-[10px] font-bold border shadow-xl backdrop-blur-md transition-colors",
                    activeHotspot === spot.id 
                      ? "bg-blue-600 text-white border-white ring-4 ring-blue-500/30" 
                      : "bg-black/80 text-white border-white/40"
                  )}>
                    {spot.id + 1}
                  </span>
                </div>
              </button>
            ))}

            {/* Flechas de Navegación Cinemáticas */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xl z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xl z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Botón flotante para ver en grande */}
            <button
              type="button"
              onClick={() => setShowLightbox(true)}
              className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 p-2.5 rounded-2xl bg-black/60 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 flex items-center gap-1.5 text-xs transition-all cursor-pointer z-20"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inspeccionar</span>
            </button>
          </div>
        </div>

        {/* BARRA INFERIOR DEL ESCAPARATE: REEL DE MINIATURAS, ACABADOS Y COMPRA */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10">
          
          {/* Reel de fotos en miniatura */}
          <div className="flex items-center gap-2.5 overflow-x-auto max-w-full pb-2 lg:pb-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(idx)}
                className={cn(
                  "relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 active:scale-95",
                  activeImage === idx
                    ? "border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105 ring-2 ring-blue-500/30"
                    : "border-white/10 opacity-50 hover:opacity-100"
                )}
              >
                <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Selector de acabados de color y talla */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-xs text-zinc-300 font-bold uppercase tracking-wider">
                  {currentFinish.name}
                </span>
                <div className="flex items-center gap-2">
                  {product.colors.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveColor(idx)}
                      style={{ backgroundColor: c.hex }}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform active:scale-90 cursor-pointer",
                        activeColor === idx
                          ? "border-white ring-2 ring-blue-400 scale-110 shadow-lg"
                          : "border-white/30 hover:scale-105"
                      )}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Medida:</span>
                <div className="flex items-center gap-1">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setActiveSize(s)}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        activeSize === s ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bloque de Precio y Botón Monumental de Compra */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="text-left lg:text-right">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                ${priceToDisplay.toFixed(2)} <span className="text-xs text-zinc-400">USD</span>
              </div>
              {product.oldPrice && (
                <div className="text-xs text-zinc-400 line-through">
                  ${product.oldPrice.toFixed(2)} USD {product.discount && `(${product.discount})`}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAgotado || isAdding}
              className={cn(
                "py-4 px-8 sm:px-10 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-2xl flex items-center gap-2 shrink-0 disabled:opacity-40",
                isAgotado 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-white hover:bg-zinc-200 text-zinc-950 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-102"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAgotado ? "Agotado Temporalmente" : isAdding ? "Añadido a la Bolsa" : "Añadir a la Bolsa"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CAPÍTULO I: EL MANIFIESTO VISUAL & INGENIERÍA DE MATERIALES             */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Compass className="w-4 h-4" />
            <span>Capítulo 01 // La Génesis del Diseño</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Diseñado para desaparecer en tu espacio hasta que lo necesitas.
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {product.description || "Cada curva, cada arista y cada transición de material ha sido calibrada para responder a las leyes de la proporción áurea y la acústica espacial contemporánea."}
          </p>
        </div>

        {/* 3 Pilares de Ingeniería Monumental */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-[2rem] bg-zinc-100/80 dark:bg-[#121218]/80 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl space-y-4 shadow-sm hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ingeniería Monolítica</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Mecanizado a partir de un sólido bloque estructural. Sin holguras, sin tornillos a la vista y con una rigidez que supera los estándares industriales más exigentes.
            </p>
          </div>

          <div className="p-7 rounded-[2rem] bg-zinc-100/80 dark:bg-[#121218]/80 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl space-y-4 shadow-sm hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Feather className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Tacto Satinado Grado 9H</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Tratamiento térmico oleofóbico que dispersa la luz y repele marcas de huellas. Cada interacción táctil transmite serenidad, peso sustancial y precisión milimétrica.
            </p>
          </div>

          <div className="p-7 rounded-[2rem] bg-zinc-100/80 dark:bg-[#121218]/80 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl space-y-4 shadow-sm hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Longevidad Decenal</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Concebido para resistir una década de uso continuado. Materiales 100% circulares, arquitectura desmontable y garantía respaldada por el laboratorio técnico de Lumina.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CAPÍTULO II: DESPIECE DE INGENIERÍA & MICRO-ARQUITECTURA INTERACTIVA     */}
      {/* ========================================================================= */}
      <div className="p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] bg-zinc-900 text-white dark:bg-[#0f0f16] border border-zinc-800 space-y-10 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <Sliders className="w-4 h-4" />
              <span>Capítulo 02 // Arquitectura de Precisión</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Inspección de Componentes & Nodos Clave
            </h2>
          </div>
          <span className="text-xs text-zinc-400">
            Selecciona un nodo para revelar su especificación de laboratorio
          </span>
        </div>

        {/* Selector de Nodos Hotspot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => setActiveHotspot(spot.id)}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all cursor-pointer active:scale-95",
                activeHotspot === spot.id
                  ? "bg-white text-zinc-950 border-white shadow-xl scale-102"
                  : "bg-zinc-800/50 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800"
              )}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Nodo 0{spot.id + 1}
              </div>
              <div className="text-xs sm:text-sm font-bold truncate mt-1">
                {spot.title}
              </div>
            </button>
          ))}
        </div>

        {/* Tarjeta de Especificación Activa del Nodo */}
        <motion.div
          key={selectedHotspot.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 rounded-[2rem] bg-zinc-800/40 border border-zinc-700/60 backdrop-blur-xl"
        >
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {selectedHotspot.tag}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {selectedHotspot.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 italic">
              {selectedHotspot.subtitle}
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {selectedHotspot.description}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center items-center lg:items-end text-center lg:text-right border-t lg:border-t-0 lg:border-l border-zinc-700/60 pt-6 lg:pt-0 lg:pl-8 space-y-1">
            <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {selectedHotspot.metric}
            </div>
            <div className="text-xs text-cyan-400 uppercase tracking-widest font-bold">
              {selectedHotspot.metricLabel}
            </div>
            <p className="text-[10px] text-zinc-400 pt-2">
              Verificado bajo normas de ensayo de precisión Lumina Core.
            </p>
          </div>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CAPÍTULO III: EL RITUAL SENSORIAL DE LOS 3 ACTOS (Starbucks & Luxury)   */}
      {/* ========================================================================= */}
      <div className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Coffee className="w-4 h-4" />
            <span>Capítulo 03 // La Experiencia Sensorial</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            El Ritual de los Tres Actos
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Comprar en Lumina no es una transacción apresurada; es un acontecimiento de bienvenida diseñado para estimular cada sentido.
          </p>
        </div>

        {/* Fases del Ritual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RITUAL_STEPS.map((step, idx) => (
            <div
              key={step.step}
              onClick={() => setActiveRitual(idx)}
              className={cn(
                "p-7 rounded-[2rem] border transition-all cursor-pointer flex flex-col justify-between space-y-6",
                activeRitual === idx
                  ? "bg-zinc-900 text-white dark:bg-[#181824] border-amber-500/50 shadow-2xl scale-102"
                  : "bg-zinc-100/70 dark:bg-[#121218]/70 text-zinc-900 dark:text-white border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400"
              )}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-3xl font-bold tracking-tight",
                    activeRitual === idx ? "text-amber-400" : "text-zinc-400"
                  )}>
                    {step.step}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/10">
                    {step.phase}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                    {step.brand}
                  </div>
                  <h3 className="text-lg font-bold leading-tight">
                    {step.title}
                  </h3>
                </div>

                <p className={cn(
                  "text-xs sm:text-sm leading-relaxed",
                  activeRitual === idx ? "text-zinc-300" : "text-zinc-600 dark:text-zinc-400"
                )}>
                  {step.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 text-[10px] font-bold tracking-wider text-amber-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{step.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CAPÍTULO IV: COMPARATIVA INTERACTIVA (Lumina vs El Mercado Común)        */}
      {/* ========================================================================= */}
      <div className="p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] bg-zinc-100/90 dark:bg-[#111116] border border-zinc-200/90 dark:border-zinc-800/90 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Capítulo 04 // Transparencia & Rendimiento</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            El Estándar Lumina vs El Mercado Convencional
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Compara objetivamente los materiales, la garantía y la ingeniería frente a productos masivos del sector.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="py-4 font-bold pr-4">Parámetro de Calidad</th>
                <th className="py-4 font-bold px-4 text-blue-600 dark:text-blue-400">Edición Lumina</th>
                <th className="py-4 font-bold pl-4 text-zinc-400">Mercado Convencional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {COMPARISONS.map((row, idx) => (
                <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 pr-4 font-bold text-zinc-900 dark:text-white">
                    {row.aspect}
                  </td>
                  <td className="py-4 px-4 text-zinc-800 dark:text-zinc-200 font-medium">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{row.lumina}</span>
                    </div>
                  </td>
                  <td className="py-4 pl-4 text-zinc-500">
                    <div className="flex items-start gap-2">
                      <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <span>{row.generic}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. CAPÍTULO V: CITAS DE LA CRÍTICA INTERNACIONAL & MARQUEE EDITORIAL       */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span>Capítulo 05 // La Voz de la Crítica</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Reconocido por los Principales Medios de Diseño
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRESS_ACCOLADES.map((item, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-[2rem] bg-white/70 dark:bg-[#14141c]/70 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  {item.source}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {item.award}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. CAPÍTULO VI: PREGUNTAS FRECUENTES DE LA KEYNOTE (FAQ INTERACTIVO)       */}
      {/* ========================================================================= */}
      <div className="p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] bg-zinc-100/80 dark:bg-[#121218]/80 border border-zinc-200/80 dark:border-zinc-800/80 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
            <HelpCircle className="w-4 h-4" />
            <span>Capítulo 06 // Claridad Total</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Preguntas Frecuentes de la Keynote
          </h2>
        </div>

        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="pt-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left py-2 font-bold text-sm sm:text-base text-zinc-900 dark:text-white cursor-pointer group"
                >
                  <span className="group-hover:text-blue-500 transition-colors">{faq.q}</span>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90 text-blue-500")} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 py-3 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX DE INSPECCIÓN A PANTALLA COMPLETA                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-10 select-none"
            onClick={() => setShowLightbox(false)}
          >
            <div className="w-full flex items-center justify-between text-white">
              <div className="text-xs tracking-widest uppercase font-bold text-zinc-400">
                Inspección Ultra-HD • {product.title} ({activeImage + 1} / {images.length})
              </div>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center p-4">
              <img
                src={currentPhoto}
                alt={product.title}
                className="max-h-full max-w-full object-contain rounded-2xl drop-shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2" onClick={(e) => e.stopPropagation()}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      "w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                      activeImage === idx ? "border-blue-400 scale-105" : "border-white/20 opacity-50 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* STICKY KEYNOTE BUY DOCK (Aparece al scrollear para no perder la compra)     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showStickyDock && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto bg-zinc-900/90 dark:bg-[#12121c]/90 text-white backdrop-blur-xl border border-white/15 px-4 sm:px-6 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-between sm:gap-8"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0 bg-black">
                <img src={currentPhoto} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {product.title}
                </div>
                <div className="text-[10px] text-zinc-400">
                  ${priceToDisplay.toFixed(2)} USD • {currentFinish.name}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAgotado || isAdding}
              className={cn(
                "py-2.5 px-5 sm:px-7 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-lg flex items-center gap-2 shrink-0 disabled:opacity-40",
                isAgotado
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-white hover:bg-zinc-200 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isAgotado ? "Agotado" : isAdding ? "En la Bolsa" : "Comprar Ahora"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
