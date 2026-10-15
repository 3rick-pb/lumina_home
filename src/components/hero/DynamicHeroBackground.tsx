"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { HERO_PHASES, HeroPhaseId } from "@/hooks/useHeroTimePhase";

export interface DynamicHeroBackgroundProps {
  activePhaseId?: HeroPhaseId;
  displayedPeriod?: HeroPhaseId | null;
  previousPeriod?: HeroPhaseId | null;
  isHeroReady?: boolean;
}

/**
 * DynamicHeroBackground - Arquitectura de Iluminación Lumina en 4 pasos:
 * 1. Cero descarga de imagen errónea en SSR (no monta <img> en SSR ni antes de hidratación)
 * 2. Decodificación GPU (img.decode()) previa con revelado sincronizado al título caligráfico
 * 3. Doble buffer con crossfade cinematográfico de 700ms (previousPeriod de fondo, displayedPeriod al frente)
 * 4. Tono neutro piedra cálido #191715 sin ningún destello verde antes de la carga de la imagen
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

  // Si no está listo o no hay temporalidad resuelta en cliente, mantenemos el fondo piedra cálido neutro
  const activePhase = isHeroReady && effectivePeriod ? HERO_PHASES[effectivePeriod] : null;
  const prevPhase = prevPeriod ? HERO_PHASES[prevPeriod] : null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [contain:paint] bg-[#191715]">
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

      {/* 3. Lumina Warm Stone Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#191715]/90 via-[#191715]/40 to-transparent pointer-events-none z-20" />
    </div>
  );
});
