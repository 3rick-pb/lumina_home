"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Sparkles, 
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
  X,
  Flame,
  Activity,
  Leaf
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";
import { cn } from "@/lib/utils";
import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

interface ProductStorytellingShowcaseProps {
  product: CatalogProduct;
  images: string[];
  activeColor: number;
  currentFinish: { name: string; hex: string };
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
    tag: "Estructura",
    description: "Forjado a partir de un único bloque metálico sin uniones visibles. Anodizado electroquímico para una resistencia absoluta al desgaste y la decoloración por rayos UV.",
    metric: "99.8%",
    metricLabel: "Pureza Estructural",
    pinX: 28,
    pinY: 34,
  },
  {
    id: 1,
    title: "Manejo Térmico Pasivo",
    subtitle: "Disipación silenciosa de 0 decibeles",
    tag: "Acústica",
    description: "Geometría de enfriamiento por convección natural inspirada en motores de precisión. Elimina vibraciones parásitas y zumbidos mecánicos.",
    metric: "0 dB",
    metricLabel: "Emisión Sonora",
    pinX: 72,
    pinY: 30,
  },
  {
    id: 2,
    title: "Cristal Óptico & Textura Táctil",
    subtitle: "Recubrimiento oleofóbico nanoscópico",
    tag: "Superficie",
    description: "Tratamiento mate satinado que repele huellas dactilares y grasa natural de la piel con una suavidad sedosa incomparable.",
    metric: "9H",
    metricLabel: "Dureza Superficial",
    pinX: 34,
    pinY: 66,
  },
  {
    id: 3,
    title: "Calibración Ergonómica 360°",
    subtitle: "Centro de gravedad optimizado para estabilidad",
    tag: "Equilibrio",
    description: "Diseñado para interactuar con la iluminación natural de tu espacio a cualquier hora del día. Su silueta icónica genera una presencia equilibrada.",
    metric: "100%",
    metricLabel: "Equilibrio Físico",
    pinX: 66,
    pinY: 70,
  },
];

const RITUAL_STEPS = [
  {
    step: "01",
    phase: "El Desempaquetado",
    brand: "Apple Unboxing Craft",
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
  },
  {
    aspect: "Tratamiento Superficial",
    lumina: "Anodizado electroquímico multicapa grado 9H oleofóbico",
    generic: "Pintura electrostática estándar propensa a rayaduras y desgaste",
  },
  {
    aspect: "Acústica & Manejo Térmico",
    lumina: "Disipación pasiva estricta de 0 dB y cero zumbidos residuales",
    generic: "Ruido térmico audible y sobrecalentamiento progresivo",
  },
  {
    aspect: "Ciclo de Vida & Garantía",
    lumina: "10+ años de durabilidad estimada con respaldo integral de fábrica",
    generic: "Obsolescencia programada típica en 12 a 18 meses",
  },
  {
    aspect: "Empaque & Huella de Carbono",
    lumina: "100% fibra vegetal reciclada y compensación climática certificada",
    generic: "Poliestireno expandido, film plástico y residuos no degradables",
  },
];

const FAQS = [
  {
    q: "¿Cómo se limpia y conserva el acabado original?",
    a: "El tratamiento anodizado es altamente resistente a marcas de huellas y sudor. Basta con pasar un paño suave de microfibra seco o ligeramente humedecido con agua destilada. No se requieren productos químicos agresivos.",
  },
  {
    q: "¿Qué cobertura ofrece la garantía de fábrica Lumina?",
    a: "Cada unidad incluye garantía oficial de 2 años contra defectos de ensamblaje, corrosión o fallos estructurales. Si experimentas cualquier irregularidad, nuestro equipo de soporte gestionará un reemplazo exprés sin costo adicional.",
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

export function ProductStorytellingShowcase({
  product,
  images,
  activeColor,
  currentFinish,
  handleAddToCart,
  isAdding,
  isAgotado,
  effectivePrice
}: ProductStorytellingShowcaseProps) {
  const [lighting, setLighting] = useState<LightingMode>("studio");
  const [activeHotspot, setActiveHotspot] = useState<number>(0);
  const [activeRitual, setActiveRitual] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showStickyDock, setShowStickyDock] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentPhoto = images[0] || product.imageUrl;
  const priceToDisplay = effectivePrice ?? product.price;

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setShowStickyDock(rect.top < -150 && rect.bottom > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLightingStyles = () => {
    switch (lighting) {
      case "golden":
        return {
          glow: "rgba(245, 158, 11, 0.25)",
          bg: "from-[#1a130c] via-[#120e0a] to-[#0a0705]",
          name: "Hora Dorada (Atardecer 3200K)",
        };
      case "midnight":
        return {
          glow: "rgba(99, 102, 241, 0.22)",
          bg: "from-[#090c1a] via-[#070912] to-[#030408]",
          name: "Medianoche Profunda (Contraste Íntimo)",
        };
      case "neon":
        return {
          glow: "rgba(6, 182, 212, 0.25)",
          bg: "from-[#08141c] via-[#0b0c16] to-[#06040c]",
          name: "Ciberpunk Neón (Alta Tecnología)",
        };
      case "studio":
      default:
        return {
          glow: currentFinish.hex ? `${currentFinish.hex}33` : "rgba(255, 255, 255, 0.12)",
          bg: "from-[#0d0d14] via-[#0a0a0f] to-[#07070a]",
          name: "Luz de Estudio Diurna (5500K)",
        };
    }
  };

  const lightStyle = getLightingStyles();
  const selectedHotspot = HOTSPOTS[activeHotspot];

  return (
    <div ref={containerRef} className={cn("w-full py-16 sm:py-24 space-y-24 sm:space-y-32 select-none", spaceMono.className)}>
      
      {/* ========================================================================= */}
      {/* CAPÍTULO 01: EL MANIFIESTO DE LA CREACIÓN & FILOSOFÍA DE DISEÑO           */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Compass className="w-3.5 h-3.5" />
            <span>Capítulo 01 // La Génesis del Diseño</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Perfección en cada milímetro. Diseñado para desaparecer en tu espacio hasta que lo necesitas.
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
            {product.description || "Cada curva, cada arista y cada transición de material ha sido calibrada para responder a las leyes de la proporción áurea y la acústica espacial contemporánea."}
          </p>
        </div>

        {/* 3 Pilares de Ingeniería Monumental */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-[2rem] bg-zinc-100/80 dark:bg-[#121218]/80 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl space-y-4 shadow-xs hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ingeniería Monolítica CNC</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
              Mecanizado a partir de un único bloque estructural. Cero holguras, sin tornillos a la vista y con una rigidez que supera los estándares industriales más exigentes.
            </p>
          </div>

          <div className="p-8 rounded-[2rem] bg-zinc-100/80 dark:bg-[#121218]/80 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl space-y-4 shadow-xs hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Feather className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Tacto Satinado Grado 9H</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
              Tratamiento térmico oleofóbico que dispersa la luz y repele marcas de huellas. Cada contacto transmite serenidad, peso sustancial y precisión milimétrica.
            </p>
          </div>

          <div className="p-8 rounded-[2rem] bg-zinc-100/80 dark:bg-[#121218]/80 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl space-y-4 shadow-xs hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Longevidad Decenal</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
              Concebido para resistir una década de uso continuado. Materiales 100% circulares, arquitectura reparable y respaldo directo del laboratorio Lumina.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CAPÍTULO 02: DESPIECE DE INGENIERÍA & MICRO-ARQUITECTURA INTERACTIVA     */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-12 lg:p-14 rounded-[2.5rem] sm:rounded-[3.5rem] bg-zinc-950 text-white border border-zinc-800 space-y-12 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <Sliders className="w-4 h-4" />
              <span>Capítulo 02 // Arquitectura de Precisión</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Inspección Anatómica & Puntos de Laboratorio
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-sans">
            Haz clic en los nodos interactivos para examinar la micro-ingeniería
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
                  : "bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
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
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 rounded-[2rem] bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl"
        >
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {selectedHotspot.tag}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {selectedHotspot.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 italic font-sans">
              {selectedHotspot.subtitle}
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans">
              {selectedHotspot.description}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center items-center lg:items-end text-center lg:text-right border-t lg:border-t-0 lg:border-l border-zinc-800 pt-6 lg:pt-0 lg:pl-8 space-y-1">
            <div className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
              {selectedHotspot.metric}
            </div>
            <div className="text-xs text-cyan-400 uppercase tracking-widest font-bold">
              {selectedHotspot.metricLabel}
            </div>
            <p className="text-[10px] text-zinc-500 pt-2 font-sans">
              Ensayo de tolerancia certificado bajo normas Lumina Core.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* CAPÍTULO 03: EL RITUAL SENSORIAL DE LOS 3 ACTOS (Starbucks & Apple)       */}
      {/* ========================================================================= */}
      <section className="space-y-10">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Coffee className="w-3.5 h-3.5" />
            <span>Capítulo 03 // La Experiencia Sensorial</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            El Ritual de los Tres Actos
          </h2>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans">
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
                "p-8 rounded-[2rem] border transition-all cursor-pointer flex flex-col justify-between space-y-6",
                activeRitual === idx
                  ? "bg-zinc-950 text-white border-amber-500/60 shadow-2xl scale-102"
                  : "bg-zinc-100/80 dark:bg-[#121218]/80 text-zinc-900 dark:text-white border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400"
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
                  "text-xs sm:text-sm leading-relaxed font-sans",
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
      </section>

      {/* ========================================================================= */}
      {/* CAPÍTULO 04: ESTUDIO DE ILUMINACIÓN EN VIVO (Atmosphere Switcher)        */}
      {/* ========================================================================= */}
      <section className={cn(
        "p-8 sm:p-12 lg:p-14 rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/10 transition-all duration-700 bg-gradient-to-b space-y-10 shadow-2xl text-white relative overflow-hidden",
        lightStyle.bg
      )}>
        {/* Glow dinámico de fondo */}
        <div 
          style={{ backgroundColor: lightStyle.glow }}
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <Sun className="w-4 h-4" />
              <span>Capítulo 04 // Estudio Lumínico</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Comportamiento del Acabado según la Luz
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans">
              Activo: {lightStyle.name}
            </p>
          </div>

          {/* Conmutador de 4 Luces */}
          <div className="flex flex-wrap items-center gap-2 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setLighting("studio")}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5", lighting === "studio" ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white")}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Estudio</span>
            </button>
            <button
              type="button"
              onClick={() => setLighting("golden")}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5", lighting === "golden" ? "bg-amber-400 text-zinc-950 shadow-md" : "text-zinc-400 hover:text-amber-300")}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span>Atardecer</span>
            </button>
            <button
              type="button"
              onClick={() => setLighting("midnight")}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5", lighting === "midnight" ? "bg-indigo-500 text-white shadow-md" : "text-zinc-400 hover:text-indigo-300")}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Noche</span>
            </button>
            <button
              type="button"
              onClick={() => setLighting("neon")}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5", lighting === "neon" ? "bg-cyan-400 text-zinc-950 shadow-md" : "text-zinc-400 hover:text-cyan-300")}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Neón</span>
            </button>
          </div>
        </div>

        {/* Escaparate de Luz */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="relative max-w-md w-full aspect-square flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={`${currentPhoto}-${lighting}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.35 }}
                src={currentPhoto}
                alt={product.title}
                className="max-h-full max-w-full object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)] rounded-2xl"
              />
            </AnimatePresence>
          </div>

          <div className="max-w-lg space-y-5 text-sm text-zinc-300 font-sans leading-relaxed">
            <h3 className="text-xl font-bold text-white font-mono">
              Reflexión Difusa Calibrada
            </h3>
            <p>
              El satinado electroquímico absorbe la radiación directa y dispersa la luz circundante de manera homogénea. Esto evita reflejos molestos en pantallas o lámparas de escritorio, manteniendo la sutileza cromática del acabado <span className="font-bold text-white">{currentFinish.name}</span> durante las 24 horas del día.
            </p>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider font-mono">Índice de Confort Visual</span>
              <p className="text-xs text-white font-mono">UGR &lt; 10 (Libre de deslumbramiento residual)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CAPÍTULO 05: COMPARATIVA (Lumina vs Mercado Convencional)                 */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] bg-zinc-100/90 dark:bg-[#111116] border border-zinc-200/90 dark:border-zinc-800/90 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Capítulo 05 // Transparencia & Rendimiento</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            El Estándar Lumina vs El Mercado Convencional
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-sans">
            Compara objetivamente los materiales, la garantía y la ingeniería frente a productos masivos del sector.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
                <th className="py-4 font-bold pr-4">Parámetro de Calidad</th>
                <th className="py-4 font-bold px-4 text-blue-600 dark:text-blue-400">Edición Lumina</th>
                <th className="py-4 font-bold pl-4 text-zinc-400">Mercado Convencional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 font-sans">
              {COMPARISONS.map((row, idx) => (
                <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 pr-4 font-bold text-zinc-900 dark:text-white font-mono">
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
      </section>

      {/* ========================================================================= */}
      {/* CAPÍTULO 06: LA VOZ DE LA CRÍTICA & PRENSA                                */}
      {/* ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-500 font-mono">
            <Star className="w-4 h-4 fill-current" />
            <span>Capítulo 06 // La Voz de la Crítica</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Reconocido por los Principales Medios de Diseño
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRESS_ACCOLADES.map((item, idx) => (
            <div 
              key={idx}
              className="p-7 rounded-[2rem] bg-white/70 dark:bg-[#14141c]/70 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between space-y-5 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic font-sans">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 font-mono">
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
      </section>

      {/* ========================================================================= */}
      {/* CAPÍTULO 07: SOSTENIBILIDAD & COMPROMISO CIRCULAR                        */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] bg-emerald-950/20 text-emerald-950 dark:text-emerald-300 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">
            <Leaf className="w-4 h-4" />
            <span>Compromiso Ambiental Certificado</span>
          </div>
          <h3 className="text-xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            100% de Recortes Refundidos & Cero Desperdicio
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-sans leading-relaxed">
            Cada viruta de metal originada en el fresado CNC se recolecta para refundición en nuevos bloques. Nuestro embalaje prescinde completamente de derivados del petróleo, empleando fibras vegetales biodegradables y tintas al agua.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121218]/90 border border-emerald-500/20 text-center space-y-1 shrink-0 font-mono">
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            0%
          </div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Plásticos de Un Solo Uso
          </div>
          <p className="text-[10px] text-zinc-500">Certificación EcoDesign 2026</p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CAPÍTULO 08: PREGUNTAS FRECUENTES DE LA KEYNOTE (FAQ)                    */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] bg-zinc-100/80 dark:bg-[#121218]/80 border border-zinc-200/80 dark:border-zinc-800/80 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest font-mono">
            <HelpCircle className="w-4 h-4" />
            <span>Transparencia Total</span>
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
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 py-3 leading-relaxed font-sans">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STICKY KEYNOTE BUY DOCK (Acompaña al usuario durante la lectura larga)    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showStickyDock && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto bg-zinc-900/90 dark:bg-[#12121c]/90 text-white backdrop-blur-xl border border-white/15 px-4 sm:px-6 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-between sm:gap-8 font-mono"
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
              <span>{isAgotado ? "Agotado" : isAdding ? "En la Bolsa" : "Añadir a la Bolsa"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
