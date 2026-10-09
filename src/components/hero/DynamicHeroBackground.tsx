"use client";

import Image from "next/image";
import { memo } from "react";
import { HERO_PHASES, HERO_PHASE_ORDER, HeroPhaseId } from "@/hooks/useHeroTimePhase";

interface DynamicHeroBackgroundProps {
  activePhaseId: HeroPhaseId;
}

export const DynamicHeroBackground = memo(function DynamicHeroBackground({
  activePhaseId,
}: DynamicHeroBackgroundProps) {
  const currentPhase = HERO_PHASES[activePhaseId] || HERO_PHASES.mediodia;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [contain:paint]">
      {/* 5 Stacked Hero Layers for True Zero-Flicker Crossfade */}
      {HERO_PHASE_ORDER.map((phaseKey) => {
        const phase = HERO_PHASES[phaseKey];
        const isActive = phaseKey === activePhaseId;

        return (
          <div
            key={phase.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out transform-gpu pointer-events-none select-none ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{ willChange: "opacity" }}
          >
            <Image
              src={phase.imageSrc}
              alt={`Lumina Home - ${phase.label}`}
              fill
              sizes="100vw"
              priority={phaseKey === "mediodia" || phaseKey === "noche"}
              quality={90}
              className="object-cover pointer-events-none select-none transform-gpu"
            />
          </div>
        );
      })}

      {/* Atmospheric Tone Overlay adapted per time phase */}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${currentPhase.gradientOverlay} transition-all duration-1000 pointer-events-none z-20`}
      />

      {/* Subtle Bottom Ambient Vignette to cleanly integrate with the Trust Badges bar */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none z-20" />
    </div>
  );
});
