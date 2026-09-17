"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Layers,
  Play,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Isometric3DGalleryProps {
  images: string[];
  title?: string;
  category?: string;
  className?: string;
  autoplay?: boolean;
  autoplaySpeed?: number;
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

// Calculates 3D coordinates based on relative cyclical offset
interface CardPosition {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

const getPositionForOffset = (offset: number): CardPosition => {
  switch (offset) {
    case 0:
      // Active card in front
      return {
        x: 0,
        y: 0,
        z: 60,
        scale: 1,
        opacity: 1,
        zIndex: 40,
      };
    case 1:
      // First upcoming card on the diagonal
      return {
        x: 135,
        y: -100,
        z: -30,
        scale: 0.92,
        opacity: 0.88,
        zIndex: 30,
      };
    case 2:
      // Second upcoming card on the diagonal
      return {
        x: 265,
        y: -195,
        z: -70,
        scale: 0.84,
        opacity: 0.6,
        zIndex: 20,
      };
    case 3:
      // Waiting at the far top-right diagonal entrance (invisible ready to cycle in)
      return {
        x: 380,
        y: -280,
        z: -110,
        scale: 0.76,
        opacity: 0,
        zIndex: 10,
      };
    case -1:
      // Top of bottom-left stack
      return {
        x: -130,
        y: 110,
        z: -15,
        scale: 0.88,
        opacity: 0.85,
        zIndex: 25,
      };
    case -2:
      // Base of bottom-left stack (subtle background card)
      return {
        x: -155,
        y: 130,
        z: -38,
        scale: 0.82,
        opacity: 0.45,
        zIndex: 15,
      };
    default:
      return {
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        opacity: 0,
        zIndex: 1,
      };
  }
};

export function Isometric3DGallery({
  images = [],
  title = "Pieza Lumina",
  category = "Colección de Autor",
  className = "",
  autoplay = true,
  autoplaySpeed = 4,
}: Isometric3DGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Guarantee exactly 6 cards for this effect
  const cardImages = Array.from({ length: 6 }).map((_, i) => {
    return images[i] || images[i % Math.max(1, images.length)] || FALLBACK_IMAGE;
  });

  const N = 6;

  // Cyclical offset mapping: maps index difference into [-2, 3] so cards continuously flow
  const computeOffset = (idx: number, currentActive: number) => {
    let diff = ((idx - currentActive) % N + N) % N;
    if (diff > 3) {
      diff = diff - N; // maps 4 -> -2, 5 -> -1
    }
    return diff;
  };

  const currentOffsets = useMemo(() => {
    return Array.from({ length: N }).map((_, i) => computeOffset(i, activeIndex));
  }, [activeIndex]);

  const prevOffsetsRef = useRef<number[]>(currentOffsets);

  useEffect(() => {
    prevOffsetsRef.current = currentOffsets;
  }, [currentOffsets]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % N);
    setProgress(0);
  }, [N]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + N) % N);
    setProgress(0);
  }, [N]);

  // Autoplay Continuous Loop Timer
  useEffect(() => {
    if (!isPlaying || isHovered || isLightboxOpen) return;

    const intervalMs = Math.max(2000, autoplaySpeed * 1000);
    const tickMs = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += tickMs;
      setProgress(Math.min(100, (elapsed / intervalMs) * 100));
      if (elapsed >= intervalMs) {
        elapsed = 0;
        setProgress(0);
        setActiveIndex((prev) => (prev + 1) % N);
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, isLightboxOpen, autoplaySpeed, N, activeIndex]);

  return (
    <div className={cn("relative w-full select-none", className)}>
      {/* Outer Card Container */}
      <div 
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
            {isPlaying && !isHovered && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Autoplay {autoplaySpeed}s
              </span>
            )}
            {isHovered && isPlaying && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/50">
                Pausa (inspección)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Play/Pause Autoplay Button */}
            <button
              onClick={() => setIsPlaying(prev => !prev)}
              className={cn(
                "w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer",
                isPlaying 
                  ? "bg-white/10 hover:bg-white/20 border-white/15 text-white" 
                  : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300"
              )}
              title={isPlaying ? "Pausar desplazamiento automático" : "Reanudar desplazamiento automático"}
              aria-label={isPlaying ? "Pausar autoplay" : "Iniciar autoplay"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            {/* Lightbox Trigger */}
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
              const offset = currentOffsets[i];
              const prevOffset = prevOffsetsRef.current[i] ?? offset;
              // Detect if card is wrapping across the boundaries (from stack -2 to diagonal +3 or vice-versa)
              const isWrapping = Math.abs(offset - prevOffset) > 2;
              const pos = getPositionForOffset(offset);
              const theme = CARD_THEMES[i % CARD_THEMES.length];
              const isActive = offset === 0;

              return (
                <motion.div
                  key={i}
                  animate={{
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                    scale: pos.scale,
                    opacity: pos.opacity,
                  }}
                  transition={
                    isWrapping
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 220,
                          damping: 24,
                          mass: 0.8,
                        }
                  }
                  onClick={() => {
                    setActiveIndex(i);
                    setProgress(0);
                  }}
                  style={{
                    zIndex: pos.zIndex,
                    transformStyle: "preserve-3d",
                    pointerEvents: pos.opacity === 0 ? "none" : "auto",
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
        <div className="relative z-20 flex items-center justify-between pt-3 border-t border-white/10">
          {/* Autoplay Progress Line Indicator on Dock */}
          {isPlaying && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-[#8c9276] transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Active Card Indicator */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveIndex(idx);
                  setProgress(0);
                }}
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
                  onClick={() => {
                    setActiveIndex(idx);
                    setProgress(0);
                  }}
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
