"use client";

import { memo, useRef } from "react";
import { motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { HERO_PHASES, HeroPhaseId } from "@/hooks/useHeroTimePhase";

export interface DynamicHeroBackgroundProps {
  activePhaseId?: HeroPhaseId;
  displayedPeriod?: HeroPhaseId | null;
  previousPeriod?: HeroPhaseId | null;
  isHeroReady?: boolean;
}

/**
 * DynamicHeroBackground:
 * - Doble buffer para transición suave entre fases
 * - Movimiento suave e inercial slow-motion con Lenis al hacer scroll
 * - Degradado original brand-900 verde bosque suave
 */
export const DynamicHeroBackground = memo(function DynamicHeroBackground({
  activePhaseId,
  displayedPeriod,
  previousPeriod,
  isHeroReady = true,
}: DynamicHeroBackgroundProps) {
  // Resuelve la temporalidad activa y la previa del doble buffer
  const effectivePeriod = displayedPeriod !== undefined ? displayedPeriod : activePhaseId;
  const prevPeriod = previousPeriod ?? null;

  const activePhase = isHeroReady && effectivePeriod ? HERO_PHASES[effectivePeriod] : null;
  const prevPhase = prevPeriod ? HERO_PHASES[prevPeriod] : null;

  const heroParallaxRef = useRef<HTMLDivElement>(null);

  // Movimiento suave Lenis slow-motion para la imagen del Hero al hacer scroll
  useLenis(({ scroll }) => {
    if (!heroParallaxRef.current) return;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    if (scroll <= vh * 1.5) {
      const slowTranslateY = scroll * 0.32;
      heroParallaxRef.current.style.transform = `translate3d(0, ${slowTranslateY.toFixed(2)}px, 0) scale(1.05)`;
    }
  });

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [contain:paint] bg-brand-900">
      {/* Contenedor con movimiento suave e inercial Lenis */}
      <div ref={heroParallaxRef} className="absolute inset-0 pointer-events-none select-none will-change-transform transform-gpu">
        {/* 1. Capa de Fondo (Doble Buffer - Imagen Anterior durante transición) */}
        {prevPhase && (
          <div
            key={`hero-buffer-prev-${prevPhase.id}`}
            className="absolute inset-0 z-0 pointer-events-none select-none transform-gpu"
          >
            <img
              src={prevPhase.imageSrc}
              alt={`Lumina Home - ${prevPhase.label}`}
              decoding="async"
              className="w-full h-full object-cover pointer-events-none select-none transform-gpu"
            />
          </div>
        )}

        {/* 2. Capa Frontal Activa (Doble Buffer - Imagen Nueva con Crossfade de 700ms) */}
        {activePhase && (
          <motion.div
            key={`hero-buffer-active-${activePhase.id}`}
            initial={prevPhase ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 pointer-events-none select-none transition-opacity duration-700 ease-out transform-gpu"
          >
            <img
              src={activePhase.imageSrc}
              alt={`Lumina Home - ${activePhase.label}`}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover pointer-events-none select-none transform-gpu"
            />
          </motion.div>
        )}
      </div>

      {/* 3. Original Lumina Brand Gradient Overlay (matches Original.png 100%) */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-transparent pointer-events-none z-20" />
    </div>
  );
});
