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
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [contain:paint]">
      {/* 5 Stacked Hero Layers with Pure Original Images */}
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
              priority
              unoptimized
              className="object-cover pointer-events-none select-none transform-gpu"
            />
          </div>
        );
      })}

      {/* Original Lumina Brand Gradient Overlay (matches Original.png 100%) */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-transparent pointer-events-none z-20" />
    </div>
  );
});
