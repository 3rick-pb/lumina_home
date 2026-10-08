"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Check, 
  Layers, 
  Box, 
  Maximize2,
  Package,
  Ruler,
  CheckCircle2,
  Volume2,
  VolumeX,
  Activity,
  Flame,
  Award,
  Leaf,
  Star,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Zap,
  HelpCircle,
  X,
  Compass,
  Plus
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";
import { cn } from "@/lib/utils";
import { Space_Mono } from "next/font/google";
import { useUserStore } from "@/lib/userStore";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

interface ProductBentoViewProps {
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

export function ProductBentoView({
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
}: ProductBentoViewProps) {
  const [hapticActive, setHapticActive] = useState<boolean>(true);
  const [activeRitualTab, setActiveRitualTab] = useState<number>(0);
  const [lightingMode, setLightingMode] = useState<"day" | "sunset" | "night">("day");
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [showStickyDock, setShowStickyDock] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { isFavorite, toggleFavorite } = useUserStore();
  const isFav = isFavorite(product.id);

  const currentPhoto = images[activeImage] || images[0] || product.imageUrl;
  const currentFinish = product.colors?.[activeColor] || { name: "Estándar", hex: "#18181b" };
  const priceToDisplay = effectivePrice ?? product.price;

  // Filter 2 companions from allProducts
  const companionProducts = React.useMemo(() => {
    return allProducts.filter(p => p.id !== product.id).slice(0, 2);
  }, [allProducts, product.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setShowStickyDock(rect.top < -200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const ritualData = [
    {
      title: "Desempaque Amortiguado",
      desc: "Caja rígida con descenso asistido por presión neumática de 3 segundos. Papel verjurado y aroma a madera noble.",
      badge: "Acto 1: Apertura"
    },
    {
      title: "El Peso del Metal Frío",
      desc: "Contacto háptico instantáneo. La masa del chasis absorbe la temperatura de tu mano con suavidad satinada.",
      badge: "Acto 2: Primer Contacto"
    },
    {
      title: "Armonía en tu Espacio",
      desc: "Colocación equilibrada. Se integra a la luz de la habitación sin estridencias, proyectando diseño silencioso.",
      badge: "Acto 3: Presencia"
    }
  ];

  const bentoFaqs = [
    {
      q: "¿Cómo resiste el paso del tiempo este material?",
      a: "El acabado incorpora anodizado multicapa Grado 9H. No se desgasta con la fricción diaria ni se decolora por luz solar."
    },
    {
      q: "¿El producto requiere algún ensamblaje?",
      a: "No. Se entrega 100% ensamblado y calibrado en nuestro taller, listo para usar desde el primer segundo."
    },
    {
      q: "¿Qué sucede si necesito asistencia o mantenimiento?",
      a: "Ofrecemos garantía directa y soporte VIP Lumina para repuestos o consultas técnicas de por vida."
    }
  ];

  return (
    <div ref={containerRef} className={cn("w-full py-6 sm:py-10 text-zinc-900 dark:text-zinc-100 select-none space-y-8", spaceMono.className)}>
      
      {/* ========================================================================= */}
      {/* CUADRÍCULA BENTO GRID INTERACTIVA (Apple Hardware Keynote Style)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        
        {/* ======================================================================= */}
        {/* TILE 1: ESCAPARATE FOTOGRÁFICO MONUMENTAL (md:col-span-8, row-span-2)  */}
        {/* ======================================================================= */}
        <div className={cn(
          "md:col-span-8 relative rounded-[2.5rem] p-6 sm:p-9 flex flex-col justify-between overflow-hidden shadow-xl border transition-all duration-700 min-h-[500px] sm:min-h-[580px]",
          lightingMode === "sunset" 
            ? "bg-gradient-to-b from-[#1c140d] via-[#14100c] to-[#0a0806] border-amber-500/20"
            : lightingMode === "night"
            ? "bg-gradient-to-b from-[#0a0c18] via-[#080912] to-[#040508] border-indigo-500/20"
            : "bg-zinc-100/90 dark:bg-[#101016] border-zinc-200/90 dark:border-zinc-800/90"
        )}>
          {/* Glow de acabado */}
          <div 
            style={{ backgroundColor: currentFinish.hex || "#3b82f6" }}
            className="absolute -top-32 -right-32 w-[450px] h-[450px] rounded-full blur-[130px] opacity-15 pointer-events-none transition-all duration-700"
          />

          {/* Top Bar de la Foto */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {product.badge || "BENTO KEYNOTE SHOWCASE"}
              </span>
              <span className="text-[11px] text-zinc-400">
                {activeImage + 1} / {images.length}
              </span>
            </div>

            {/* Selector de Iluminación Rápida */}
            <div className="flex items-center gap-1 bg-black/20 dark:bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setLightingMode("day")}
                className={cn("p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer", lightingMode === "day" ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-400 hover:text-white")}
                title="Luz Diurna"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode("sunset")}
                className={cn("p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer", lightingMode === "sunset" ? "bg-amber-400 text-zinc-950 shadow-xs" : "text-zinc-400 hover:text-amber-300")}
                title="Atardecer Cálido"
              >
                <Sunset className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode("night")}
                className={cn("p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer", lightingMode === "night" ? "bg-indigo-500 text-white shadow-xs" : "text-zinc-400 hover:text-indigo-300")}
                title="Noche de Contraste"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Pantalla Completa"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Imagen Central en Gran Formato */}
          <div className="relative z-10 my-auto flex items-center justify-center py-6 cursor-zoom-in" onClick={() => setShowLightbox(true)}>
            <AnimatePresence mode="wait">
              <motion.img
                key={`${currentPhoto}-${lightingMode}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.35 }}
                src={currentPhoto}
                alt={product.title}
                className="max-h-[380px] w-auto max-w-full object-contain drop-shadow-2xl hover:scale-103 transition-transform duration-500 ease-out rounded-2xl"
              />
            </AnimatePresence>
          </div>

          {/* Mini-dock inferior de selección de foto */}
          {images.length > 1 && (
            <div className="relative z-10 flex items-center gap-2 overflow-x-auto pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 active:scale-95",
                    activeImage === idx
                      ? "border-blue-500 shadow-md scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* TILE 2: BUY CARD KEYNOTE & STOCK METER (md:col-span-4)                 */}
        {/* ======================================================================= */}
        <div className="md:col-span-4 rounded-[2.5rem] bg-zinc-900 text-white dark:bg-[#161622] border border-zinc-800 p-6 sm:p-7 flex flex-col justify-between shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold">
                {product.category}
              </span>
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                className={cn(
                  "p-2 rounded-xl border border-white/10 transition-colors cursor-pointer",
                  isFav ? "bg-red-500/20 text-red-400 border-red-500/40" : "text-zinc-400 hover:text-white"
                )}
                title="Favorito"
              >
                <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              {product.title}
            </h1>

            {product.titleHighlight && (
              <p className="text-xs text-zinc-400 italic">
                &ldquo;{product.titleHighlight}&rdquo;
              </p>
            )}

            <div className="pt-2">
              <div className="text-3xl font-bold text-white tracking-tight">
                ${priceToDisplay.toFixed(2)} <span className="text-xs text-zinc-400">USD</span>
              </div>
              {product.oldPrice && (
                <p className="text-xs text-zinc-400 line-through mt-0.5">
                  ${product.oldPrice.toFixed(2)} USD {product.discount && `(${product.discount})`}
                </p>
              )}
            </div>

            {/* Medidor de Stock Artesanal */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Lote de Producción
                </span>
                <span className="text-zinc-300">
                  {product.stock && product.stock > 0 ? `${product.stock} disponibles` : "Disponibilidad Limitada"}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-[70%]" />
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAgotado || isAdding}
              className={cn(
                "w-full py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-40",
                isAgotado
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-white hover:bg-zinc-100 text-zinc-950 shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-102"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAgotado ? "Agotado Temporalmente" : isAdding ? "Añadido a la Bolsa" : "Añadir a la Bolsa"}</span>
            </button>

            <p className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Garantía Oficial Lumina • Despacho Seguro
            </p>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* TILE 3: SELECTOR DE ACABADOS & COLORWAYS (md:col-span-4)               */}
        {/* ======================================================================= */}
        {product.colors && product.colors.length > 0 && (
          <div className="md:col-span-4 rounded-[2rem] bg-white/80 dark:bg-[#121218] border border-zinc-200/90 dark:border-zinc-800/90 p-6 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Acabados Disponibles
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {currentFinish.name}
              </span>
            </div>

            <div className="py-4 flex items-center gap-3">
              {product.colors.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveColor(idx)}
                  style={{ backgroundColor: c.hex }}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 transition-transform active:scale-90 cursor-pointer shadow-xs",
                    activeColor === idx
                      ? "border-blue-500 ring-2 ring-blue-500/40 scale-110"
                      : "border-zinc-300 dark:border-zinc-700 hover:scale-105"
                  )}
                  title={c.name}
                />
              ))}
            </div>

            <p className="text-[11px] text-zinc-500">
              Gama de acabados arquitectónicos anodizados de alta durabilidad.
            </p>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TILE 4: ACÚSTICA HÁPTICA & SONIDO DE MECANIZADO (md:col-span-4)        */}
        {/* ======================================================================= */}
        <div className="md:col-span-4 rounded-[2rem] bg-zinc-900 text-white dark:bg-[#14141e] border border-zinc-800 p-6 flex flex-col justify-between shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Acústica & Háptica
            </span>
            <button
              type="button"
              onClick={() => setHapticActive(!hapticActive)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 cursor-pointer transition-colors"
              title="Alternar simulación"
            >
              {hapticActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-zinc-400 font-bold">
              Respuesta Háptica a 440 Hz
            </div>
            {/* Animación del ecualizador visual */}
            <div className="flex items-end gap-1.5 h-10 py-1">
              {[40, 75, 55, 90, 60, 85, 45, 70, 95, 50].map((height, i) => (
                <div
                  key={i}
                  style={{ height: hapticActive ? `${height}%` : "15%" }}
                  className="flex-1 bg-cyan-400/80 rounded-full transition-all duration-300"
                />
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Disipación de zumbidos con amortiguación cero dB para confort acústico permanente.
            </p>
          </div>

          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest pt-2 border-t border-zinc-800">
            Acoustic Chamber Verified
          </div>
        </div>

        {/* ======================================================================= */}
        {/* TILE 5: ESPECIFICACIONES CNC & INGENIERÍA (md:col-span-4)               */}
        {/* ======================================================================= */}
        <div className="md:col-span-4 rounded-[2rem] bg-white/80 dark:bg-[#121218] border border-zinc-200/90 dark:border-zinc-800/90 p-6 flex flex-col justify-between shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-blue-500" /> Dimensiones & Peso
            </span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
              Tolerancia 0.05 mm
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-zinc-200/40 dark:border-zinc-800/40">
              <span className="text-zinc-500">Material:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{product.materials || "Aleación Aeroespacial"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-zinc-200/40 dark:border-zinc-800/40">
              <span className="text-zinc-500">Dimensiones:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{product.dimensions || "Calibrado Estándar"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-500">Garantía:</span>
              <span className="font-bold text-emerald-500">{product.warranty || "10 Años Oficial"}</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 italic">
            Inspección micrométrica realizada en cada unidad individual antes del envío.
          </p>
        </div>

        {/* ======================================================================= */}
        {/* TILE 6: EL RITUAL SENSORIAL DE LOS 3 ACTOS (md:col-span-8)             */}
        {/* ======================================================================= */}
        <div className="md:col-span-8 rounded-[2rem] bg-zinc-100/90 dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>El Ritual de los Tres Actos</span>
            </div>
            {/* Pestañas de actos */}
            <div className="flex items-center gap-1.5">
              {ritualData.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveRitualTab(idx)}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                    activeRitualTab === idx 
                      ? "bg-amber-500 text-zinc-950 font-black shadow-xs" 
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  Acto {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeRitualTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-2 py-2"
            >
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-500">
                {ritualData[activeRitualTab].badge}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {ritualData[activeRitualTab].title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {ritualData[activeRitualTab].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ======================================================================= */}
        {/* TILE 7: ECOSISTEMA LUMINA - PRODUCTOS COMPLEMENTARIOS (md:col-span-4)  */}
        {/* ======================================================================= */}
        {companionProducts.length > 0 && (
          <div className="md:col-span-4 rounded-[2rem] bg-white/80 dark:bg-[#121218] border border-zinc-200/90 dark:border-zinc-800/90 p-6 flex flex-col justify-between shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-blue-500" /> Pareja Perfecta
              </span>
              <span className="text-[10px] font-bold text-emerald-500">Set Lumina</span>
            </div>

            <div className="space-y-3">
              {companionProducts.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/product/${comp.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/10 shrink-0 border border-zinc-200 dark:border-zinc-800">
                    <img src={comp.imageUrl} alt={comp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-500 transition-colors">
                      {comp.title}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      ${comp.price.toFixed(2)} USD
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>

            <p className="text-[10px] text-zinc-400 text-center">
              Diseñados con la misma paleta y lenguaje volumétrico.
            </p>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TILE 8: PREGUNTAS FRECUENTES BENTO (md:col-span-8)                     */}
        {/* ======================================================================= */}
        <div className="md:col-span-8 rounded-[2rem] bg-white/80 dark:bg-[#121218] border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <HelpCircle className="w-4 h-4" />
            <span>Consultas Rápidas de la Edición</span>
          </div>

          <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {bentoFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-2.5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 cursor-pointer hover:text-blue-500 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-90 text-blue-500")} />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-zinc-500 pt-2 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* TILE 9: COMPROMISO SOSTENIBLE (md:col-span-4)                           */}
        {/* ======================================================================= */}
        <div className="md:col-span-4 rounded-[2rem] bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border border-emerald-500/30 p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Leaf className="w-4 h-4" />
            <span>Sostenibilidad Circular</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Cero Desperdicio Metálico
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              El 100% de los recortes de mecanizado CNC se refunden para nuevos lotes. Empaque con fibras vegetales biodegradables.
            </p>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
            Carbon Neutral Certified
          </div>
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
                Bento Inspector HD • {product.title}
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
      {/* STICKY BUY DOCK                                                            */}
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
