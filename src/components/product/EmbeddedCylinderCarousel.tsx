"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Play, 
  Pause,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmbeddedCarouselConfig, EmbeddedCarouselSlide } from "@/lib/catalogStore";

interface EmbeddedCylinderCarouselProps {
  config?: EmbeddedCarouselConfig;
  productTitle: string;
  category: string;
  productImages: string[];
  className?: string;
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800&auto=format&fit=crop"
];

export function EmbeddedCylinderCarousel({
  config,
  productTitle,
  category,
  productImages = [],
  className = "",
}: EmbeddedCylinderCarouselProps) {


  const title = config?.title || "Atmósfera & Edición Visual";
  const subtitle = config?.subtitle || "Perspectiva sensorial y atmósfera espacial de esta pieza";
  const autoplaySpeed = config?.autoplaySpeed || 3.5;

  // Build the 6 curated slides cloning Video Enveding.mp4
  // Build the 6 curated slides with clean product info (no arbitrary dates or codes)
  const slides: EmbeddedCarouselSlide[] = useMemo(() => {
    const imgs = productImages.length > 0 ? productImages : FALLBACK_IMAGES;
    const getImg = (idx: number) => imgs[idx % imgs.length] || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];

    if (config?.slides && config.slides.length >= 3) {
      return config.slides.map((s, idx) => ({
        ...s,
        title: s.title && s.title.trim() ? s.title : productTitle,
        tag: s.tag && s.tag.trim() ? s.tag : (category || "EDICIÓN"),
        subtitle: s.subtitle && s.subtitle.trim() ? s.subtitle : "VISTA EDITORIAL",
        image: s.image && s.image.trim() ? s.image : getImg(idx),
      }));
    }

    return [
      {
        image: getImg(0),
        tag: category || "EDICIÓN",
        title: productTitle,
        subtitle: "VISTA PRINCIPAL",
        theme: "photo_overlay",
      },
      {
        image: getImg(1),
        tag: "DISEÑO",
        title: productTitle,
        subtitle: "ACABADO DE AUTOR",
        code: category || "PIEZA DESTACADA",
        theme: "dark_typography",
      },
      {
        image: getImg(2),
        tag: category || "DETALLE",
        title: productTitle,
        subtitle: "PERSPECTIVA Y TEXTURA",
        code: "ORIGINAL",
        theme: "split_numbers",
      },
      {
        image: getImg(3),
        tag: "GEOMETRÍA",
        title: productTitle,
        subtitle: "PROPORCIÓN Y EQUILIBRIO",
        theme: "framed",
      },
      {
        image: getImg(4),
        tag: "ATMÓSFERA",
        title: productTitle,
        subtitle: "ESPACIO Y ARMONÍA",
        theme: "photo_overlay",
      },
      {
        image: getImg(5),
        tag: "COLECCIÓN",
        title: productTitle,
        subtitle: "PIEZA DE CATÁLOGO",
        code: "ESENCIAL",
        theme: "minimal_date",
      },
    ];
  }, [config?.slides, productImages, productTitle, category]);

  const N = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState(0);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % N);
  }, [N]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + N) % N);
  }, [N]);

  // Autoplay Continuous Loop: Reliable, uninterrupted rotation
  useEffect(() => {
    if (!isPlaying || isDragging || lightboxIndex !== null) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % N);
    }, Math.max(1800, autoplaySpeed * 1000));

    return () => clearInterval(interval);
  }, [isPlaying, isDragging, lightboxIndex, autoplaySpeed, N]);

  // Cylinder radius and angle step for 3D curved horizontal arc
  const RADIUS = 620; // Radius in px of the 3D cylinder
  const ANGLE_STEP = 26; // Angle difference per card in degrees

  // If explicitly disabled in product configuration, do not render
  if (config?.enabled === false) return null;

  return (
    <section 
      className={cn("relative w-full py-16 sm:py-24 overflow-hidden select-none", className)}
    >
      {/* Background Ambience / Subtle Lighting Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 transform-gpu"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(140, 146, 118, 0.25) 0%, rgba(18, 20, 16, 0.6) 60%, transparent 100%)",
        }}
      />

      {/* Header Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-10 sm:mb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#8c9276]/15 text-[#8c9276] dark:text-[#ccff00] border border-[#8c9276]/25">
                <Compass className="w-3.5 h-3.5" />
                {category} • Curaduría
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Carrusel Cilíndrico 3D
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
              {subtitle}
            </p>
          </div>

          {/* Controls Dock */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className={cn(
                "w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md",
                isPlaying
                  ? "bg-white/80 dark:bg-white/10 hover:bg-white border-gray-200 dark:border-white/15 text-gray-800 dark:text-white"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
              )}
              title={isPlaying ? "Pausar carrusel" : "Reanudar carrusel"}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-gray-200 dark:border-white/15 text-gray-800 dark:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-gray-200 dark:border-white/15 text-gray-800 dark:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Cylindrical Viewport */}
      <div 
        className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] flex items-center justify-center overflow-visible"
        style={{ perspective: 1200 }}
        onTouchStart={(e) => {
          setIsDragging(true);
          setDragStartX(e.touches[0].clientX);
        }}
        onTouchEnd={(e) => {
          setIsDragging(false);
          const diff = e.changedTouches[0].clientX - dragStartX;
          if (diff > 40) handlePrev();
          else if (diff < -40) handleNext();
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          setDragStartX(e.clientX);
        }}
        onMouseUp={(e) => {
          setIsDragging(false);
          const diff = e.clientX - dragStartX;
          if (diff > 50) handlePrev();
          else if (diff < -50) handleNext();
        }}
      >
        <div 
          className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[310px] md:h-[310px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {slides.map((slide, idx) => {
            // Compute signed circular offset relative to activeIndex in range [-N/2, N/2]
            let offset = ((idx - activeIndex) % N + N) % N;
            if (offset > N / 2) {
              offset = offset - N;
            }

            // Radial angle along the cylinder
            const angleDeg = offset * ANGLE_STEP;
            const angleRad = (angleDeg * Math.PI) / 180;

            // Curved cylinder math:
            // x = R * sin(theta)
            // z = R * (cos(theta) - 1)
            // rotateY = -theta
            const x = RADIUS * Math.sin(angleRad);
            const z = RADIUS * (Math.cos(angleRad) - 1);
            const rotateY = -angleDeg;
            const scale = Math.max(0.68, Math.cos(angleRad * 0.9));
            const opacity = Math.cos(angleRad) > 0.05 ? Math.max(0.2, Math.cos(angleRad)) : 0;
            const zIndex = Math.round(100 + z);
            const isActive = offset === 0;

            return (
              <motion.div
                key={idx}
                animate={{
                  x,
                  z,
                  rotateY,
                  scale,
                  opacity,
                }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 26,
                  mass: 0.8,
                }}
                onClick={() => {
                  if (isActive) {
                    setLightboxIndex(idx);
                  } else {
                    setActiveIndex(idx);
                  }
                }}
                style={{
                  zIndex,
                  transformStyle: "preserve-3d",
                  pointerEvents: opacity < 0.2 ? "none" : "auto",
                }}
                className={cn(
                  "absolute inset-0 rounded-[2rem] sm:rounded-[2.4rem] overflow-hidden border cursor-pointer select-none shadow-2xl transition-shadow duration-300",
                  isActive
                    ? "ring-2 ring-[#8c9276] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-white/20"
                    : "border-black/10 dark:border-white/10 hover:brightness-105"
                )}
              >
                {/* ARCHETYPE 1: DARK TYPOGRAPHY (TITULO DE PRODUCTO / DISEÑO DE AUTOR) */}
                {slide.theme === "dark_typography" && (
                  <div className="relative w-full h-full bg-[#121310] text-white p-5 sm:p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest text-[#8c9276] uppercase font-bold">
                        {slide.tag || category || "DISEÑO"}
                      </span>
                      <span className="text-[9px] font-mono text-white/40 uppercase">
                        {slide.code || "PIEZA DESTACADA"}
                      </span>
                    </div>

                    <div className="text-center space-y-1 my-auto">
                      <p className="text-sm sm:text-base font-mono font-black tracking-widest text-white/95 uppercase line-clamp-2">
                        {slide.title || productTitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-[10px] font-mono text-white/50 uppercase">
                        {slide.subtitle || "ACABADO DE AUTOR"}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-[#8c9276]" />
                    </div>
                  </div>
                )}

                {/* ARCHETYPE 2: PRESENTACIÓN COMPLETA (FOTO COMPLETA + DISEÑO ORIGINAL) */}
                {slide.theme === "split_numbers" && (
                  <div className="relative w-full h-full overflow-hidden bg-[#1e201b]">
                    {/* Foto Completa */}
                    <Image
                      src={slide.image}
                      alt={slide.title || productTitle}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                    {/* Luxury Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35 p-4 sm:p-5 flex flex-col justify-between font-mono text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 font-bold uppercase tracking-wider text-white">
                          {slide.tag || category || "DETALLE"}
                        </span>
                        <span className="text-[9px] font-bold tracking-widest text-[#8c9276] uppercase">
                          ORIGINAL
                        </span>
                      </div>
                      <div className="space-y-1 my-auto">
                        <p className="text-xs sm:text-sm font-black tracking-tight text-white uppercase line-clamp-2 drop-shadow-sm">
                          {slide.title || productTitle}
                        </p>
                        <p className="text-[9px] text-white/70 uppercase">
                          {slide.subtitle || "PERSPECTIVA Y TEXTURA"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/15 text-[9px] font-bold tracking-widest text-[#8c9276] uppercase">
                        <span>DISEÑO ORIGINAL</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8c9276]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ARCHETYPE 3: MINIMAL DATE OR CATALOG BADGE (PHOTO BACKGROUND) */}
                {slide.theme === "minimal_date" && (
                  <div className="relative w-full h-full overflow-hidden bg-[#242620]">
                    <Image
                      src={slide.image}
                      alt={slide.title || productTitle}
                      fill
                      sizes="300px"
                      className="object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 sm:p-5 flex flex-col justify-between text-white font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest text-[#8c9276] uppercase">
                          {slide.tag || category || "COLECCIÓN"}
                        </span>
                        <span className="text-[9px] font-bold tracking-widest text-white/60 uppercase">
                          {slide.code || "ESENCIAL"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base sm:text-lg font-black tracking-tight text-white uppercase line-clamp-2">
                          {slide.title || productTitle}
                        </h4>
                        <p className="text-[10px] sm:text-xs font-bold tracking-widest text-white/70 uppercase">
                          {slide.subtitle || "PIEZA DE CATÁLOGO"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ARCHETYPE 4: FRAMED PASSEPARTOUT OR GEOMETRIC MOTIF */}
                {slide.theme === "framed" && (
                  <div className="relative w-full h-full bg-[#4e5544] p-3.5 sm:p-4 flex flex-col justify-between text-white">
                    <div className="relative w-full flex-1 rounded-[1.3rem] overflow-hidden bg-black/30">
                      <Image
                        src={slide.image}
                        alt={slide.title || productTitle}
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                    </div>
                    <div className="pt-2 px-1 flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-white/95 line-clamp-1 uppercase">{slide.title || productTitle}</span>
                      <span className="text-white/60 uppercase">{slide.tag || category || "AUTOR"}</span>
                    </div>
                  </div>
                )}

                {/* ARCHETYPE 5: DEFAULT PHOTO OVERLAY (FOTO EDITORIAL + NOMBRE DE PRODUCTO) */}
                {(!slide.theme || slide.theme === "photo_overlay") && (
                  <div className="relative w-full h-full overflow-hidden bg-black/40">
                    <Image
                      src={slide.image}
                      alt={slide.title || productTitle}
                      fill
                      sizes="300px"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 p-5 sm:p-6 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/25">
                          {slide.tag || category || "EDICIÓN"}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
                          <Maximize2 className="w-3.5 h-3.5 text-white/80" />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm sm:text-base font-bold font-mono tracking-tight text-white line-clamp-1 uppercase">
                          {slide.title || productTitle}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-white/70 font-mono mt-0.5 line-clamp-1 uppercase">
                          {slide.subtitle || "PERSPECTIVA VISUAL"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation Dots Indicator */}
      <div className="max-w-6xl mx-auto px-4 mt-8 flex items-center justify-center gap-1.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
              idx === activeIndex
                ? "w-8 bg-[#8c9276]"
                : "w-2 bg-black/15 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/40"
            )}
            aria-label={`Ir a tarjeta ${idx + 1}`}
          />
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-8"
            onClick={() => setLightboxIndex(null)}
          >
            <div className="w-full flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
              <div>
                <p className="text-xs text-[#8c9276] uppercase font-bold tracking-widest">{category}</p>
                <h3 className="text-base sm:text-lg font-bold">{slides[lightboxIndex]?.title || productTitle}</h3>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full max-w-4xl h-[65vh] sm:h-[75vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Image
                src={slides[lightboxIndex]?.image || FALLBACK_IMAGES[0]}
                alt={slides[lightboxIndex]?.title || "Detalle completo"}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
                priority
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto p-2 bg-white/5 rounded-2xl border border-white/10 z-10" onClick={(e) => e.stopPropagation()}>
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={cn(
                    "relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                    idx === lightboxIndex ? "border-[#8c9276] scale-105" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <Image src={s.image} alt={`Miniatura ${idx + 1}`} fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default EmbeddedCylinderCarousel;
