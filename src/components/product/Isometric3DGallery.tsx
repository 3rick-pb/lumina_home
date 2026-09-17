"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Isometric3DGalleryProps {
  images: string[];
  title?: string;
  category?: string;
  className?: string;
}

// Visual color themes for the 6 cards matching the video's luxury palette
const CARD_THEMES = [
  {
    bg: "bg-[#8c9276] dark:bg-[#7a8065]",
    border: "border-[#7a8065] dark:border-[#9ba185]",
    text: "text-white",
    subtext: "text-white/80",
    pill: "bg-white/20 text-white border-white/30",
    label: "Vista Principal",
    tag: "01 • STUDIO VIEW",
  },
  {
    bg: "bg-[#f4f4ee] dark:bg-[#202022]",
    border: "border-black/10 dark:border-white/10",
    text: "text-gray-900 dark:text-gray-100",
    subtext: "text-gray-600 dark:text-gray-400",
    pill: "bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-200 border-black/10 dark:border-white/10",
    label: "Detalle Textura",
    tag: "02 • MATTE FINISH",
  },
  {
    bg: "bg-[#181916] dark:bg-[#141512]",
    border: "border-white/15 dark:border-white/10",
    text: "text-white",
    subtext: "text-white/70",
    pill: "bg-white/15 text-white border-white/20",
    label: "Perspectiva Lateral",
    tag: "03 • PROFILE ANGLE",
  },
  {
    bg: "bg-[#d8dbcb] dark:bg-[#272924]",
    border: "border-black/10 dark:border-white/10",
    text: "text-gray-900 dark:text-gray-100",
    subtext: "text-gray-700 dark:text-gray-400",
    pill: "bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-200 border-black/10 dark:border-white/10",
    label: "Atmósfera & Luz",
    tag: "04 • AMBIENT GLOW",
  },
  {
    bg: "bg-[#3e4534] dark:bg-[#2c3224]",
    border: "border-[#4e5742] dark:border-[#3e4534]",
    text: "text-white",
    subtext: "text-white/80",
    pill: "bg-white/20 text-white border-white/30",
    label: "Composición Espacial",
    tag: "05 • LIVING CONTEXT",
  },
  {
    bg: "bg-[#252723] dark:bg-[#1a1c18]",
    border: "border-white/10 dark:border-white/15",
    text: "text-white",
    subtext: "text-white/70",
    pill: "bg-white/15 text-white border-white/20",
    label: "Edición Final",
    tag: "06 • ESSENTIAL FORM",
  },
];

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";

export function Isometric3DGallery({
  images = [],
  title = "Pieza Lumina",
  category = "Colección de Autor",
  className = "",
}: Isometric3DGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Guarantee exactly 6 cards for this effect
  const cardImages = Array.from({ length: 6 }).map((_, i) => {
    return images[i] || images[i % Math.max(1, images.length)] || FALLBACK_IMAGE;
  });

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % 6);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + 6) % 6);
  };

  return (
    <div className={cn("relative w-full select-none", className)}>
      {/* Outer Card Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-[460px] sm:h-[540px] md:h-[580px] rounded-3xl sm:rounded-[2.5rem] bg-[#0d0e0c] dark:bg-[#090a08] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-6"
      >
        {/* Subtle Ambient Radial Lighting */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 transform-gpu"
          style={{
            background: "radial-gradient(circle at 40% 35%, rgba(140, 146, 118, 0.35) 0%, rgba(20, 22, 18, 0.8) 60%, #0d0e0c 100%)",
          }}
        />

        {/* Top Header Bar */}
        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-white border border-white/15">
              <Layers className="w-3.5 h-3.5 text-[#8c9276]" />
              Galería 3D Isométrica
            </span>
            <span className="hidden sm:inline-block text-[11px] text-white/50 font-mono">
              6 Vistas Exclusivas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Ver imagen en tamaño completo"
              aria-label="Abrir imagen completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Isometric Viewport */}
        <div 
          className="relative w-full flex-1 flex items-center justify-center overflow-visible"
          style={{ perspective: 1200 }}
          onTouchStart={(e) => setDragStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const diff = e.changedTouches[0].clientX - dragStartX;
            if (diff > 40) handlePrev();
            else if (diff < -40) handleNext();
          }}
          onMouseDown={(e) => setDragStartX(e.clientX)}
          onMouseUp={(e) => {
            const diff = e.clientX - dragStartX;
            if (diff > 50) handlePrev();
            else if (diff < -50) handleNext();
          }}
        >
          <div 
            className="relative w-[260px] h-[340px] sm:w-[310px] sm:h-[400px] transition-transform duration-700 ease-out"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(42deg) rotateZ(-28deg) rotateY(4deg)",
            }}
          >
            {cardImages.map((imgUrl, i) => {
              const diff = i - activeIndex;
              const theme = CARD_THEMES[i % CARD_THEMES.length];
              const isActive = diff === 0;

              // Calculate 3D position along the diagonal trajectory or in the bottom-left stack
              let x = 0;
              let y = 0;
              let z = 0;
              let scale = 1;
              let opacity = 1;
              let zIndex = 10;

              if (diff < 0) {
                // In the bottom-left stack of layered cards
                x = -130 + diff * 12;
                y = 110 - diff * 10;
                z = diff * 18;
                scale = Math.max(0.75, 0.88 + diff * 0.03);
                opacity = 0.9;
                zIndex = 10 + diff;
              } else if (diff === 0) {
                // Active foreground card
                x = 0;
                y = 0;
                z = 50;
                scale = 1;
                opacity = 1;
                zIndex = 30;
              } else {
                // Upcoming cards floating along the top-right diagonal
                x = diff * 135;
                y = -diff * 100;
                z = -diff * 35;
                scale = Math.max(0.72, 1 - diff * 0.07);
                opacity = Math.max(0.35, 1 - diff * 0.16);
                zIndex = 20 - diff;
              }

              return (
                <motion.div
                  key={i}
                  animate={{
                    x,
                    y,
                    z,
                    scale,
                    opacity,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 26,
                    mass: 0.8,
                  }}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    zIndex,
                    transformStyle: "preserve-3d",
                  }}
                  className={cn(
                    "absolute inset-0 rounded-[2rem] sm:rounded-[2.4rem] p-3 sm:p-4 border-2 shadow-2xl cursor-pointer select-none transition-shadow duration-300",
                    theme.bg,
                    theme.border,
                    isActive 
                      ? "ring-2 ring-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]" 
                      : "hover:brightness-105 opacity-90 hover:opacity-100"
                  )}
                >
                  <div className="flex flex-col h-full justify-between">
                    {/* Card Inner Photo Container */}
                    <div className="relative w-full h-[180px] sm:h-[230px] rounded-[1.4rem] sm:rounded-[1.7rem] overflow-hidden bg-black/20 border border-black/10 shadow-inner">
                      <Image
                        src={imgUrl}
                        alt={`${title} - Vista ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 260px, 320px"
                        priority={i === 0}
                        draggable={false}
                        className="object-cover pointer-events-none select-none transition-transform duration-700 hover:scale-105"
                      />
                      
                      {/* Top Floating Badge on photo */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold font-mono uppercase tracking-wider backdrop-blur-md border",
                          theme.pill
                        )}>
                          {theme.tag}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer Typography */}
                    <div className="pt-2 sm:pt-3 px-1">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[10px] sm:text-xs font-mono uppercase tracking-wider font-semibold", theme.subtext)}>
                          {theme.label}
                        </span>
                        <span className={cn("text-xs sm:text-sm font-black font-mono tracking-tight", theme.text)}>
                          0{i + 1} <span className="opacity-40">/ 06</span>
                        </span>
                      </div>
                      <h4 className={cn("text-xs sm:text-sm font-bold tracking-tight line-clamp-1 mt-0.5", theme.text)}>
                        {title}
                      </h4>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Interactive Navigation Dock */}
        <div className="relative z-20 flex items-center justify-between pt-2 border-t border-white/10">
          {/* Active Card Indicator */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  idx === activeIndex
                    ? "w-7 bg-[#8c9276]"
                    : "w-2 bg-white/20 hover:bg-white/40"
                )}
                aria-label={`Ir a foto ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Siguiente foto"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-8"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Lightbox Header */}
            <div className="w-full flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
              <div>
                <p className="text-xs text-[#8c9276] uppercase font-bold tracking-widest">{category}</p>
                <h3 className="text-base sm:text-lg font-bold">{title} • Vista {activeIndex + 1} de 6</h3>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Main Image */}
            <div className="relative w-full max-w-4xl h-[65vh] sm:h-[75vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Image
                src={cardImages[activeIndex]}
                alt={`${title} - Vista ${activeIndex + 1}`}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
                priority
              />
            </div>

            {/* Lightbox Thumbnails Strip */}
            <div className="flex items-center gap-2 overflow-x-auto p-2 bg-white/5 rounded-2xl border border-white/10 z-10" onClick={(e) => e.stopPropagation()}>
              {cardImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                    idx === activeIndex ? "border-[#8c9276] scale-105" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <Image src={img} alt={`Miniatura ${idx + 1}`} fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Isometric3DGallery;
