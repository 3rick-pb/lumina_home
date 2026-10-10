"use client";

import Image from "next/image";
import { memo, useState, useEffect } from "react";
import { HERO_PHASES, HERO_PHASE_ORDER, HeroPhaseId } from "@/hooks/useHeroTimePhase";

interface DynamicHeroBackgroundProps {
  activePhaseId: HeroPhaseId;
}

export const DynamicHeroBackground = memo(function DynamicHeroBackground({
  activePhaseId,
}: DynamicHeroBackgroundProps) {
  // Only the active phase is rendered on first paint, completely eliminating initial thread blocking & decode lag
  const [loadedPhases, setLoadedPhases] = useState<Set<HeroPhaseId>>(() => new Set([activePhaseId]));

  // Ensure active phase is immediately added if time updates or is overridden
  useEffect(() => {
    setLoadedPhases((prev) => {
      if (prev.has(activePhaseId)) return prev;
      const next = new Set(prev);
      next.add(activePhaseId);
      return next;
    });
  }, [activePhaseId]);

  // Non-blocking background preloader: cache all other phases after initial paint
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      setLoadedPhases(new Set(HERO_PHASE_ORDER));
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [contain:paint]">
      {/* Dynamic Hero Layers with Progressive Non-blocking Loading */}
      {HERO_PHASE_ORDER.map((phaseKey) => {
        // Skip mounting DOM/Image elements until needed, avoiding GPU memory pressure
        if (!loadedPhases.has(phaseKey)) return null;

        const phase = HERO_PHASES[phaseKey];
        const isActive = phaseKey === activePhaseId;

        return (
          <div
            key={phase.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-[2200ms] transform-gpu pointer-events-none select-none ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{ 
              willChange: isActive ? "opacity" : "auto",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <Image
              src={phase.imageSrc}
              alt={`Lumina Home - ${phase.label}`}
              fill
              sizes="100vw"
              priority={isActive}
              loading={isActive ? "eager" : "lazy"}
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
