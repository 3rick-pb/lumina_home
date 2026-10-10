"use client";

import { useState, useEffect, useCallback } from "react";

export type HeroPhaseId = "amanecer" | "mediodia" | "atardecer" | "crepusculo" | "noche";

export interface HeroPhase {
  id: HeroPhaseId;
  label: string;
  badgeLabel: string;
  timeRange: string;
  description: string;
  imageSrc: string;
  accentPill: string;
  glowColor: string;
}

export const HERO_PHASES: Record<HeroPhaseId, HeroPhase> = {
  amanecer: {
    id: "amanecer",
    label: "Amanecer",
    badgeLabel: "Amanecer",
    timeRange: "06:00 – 09:30",
    description: "Luz matutina fresca y apacible",
    imageSrc: "/images/hero/Amanecer.jpg",
    accentPill: "bg-rose-500/20 text-rose-200 border-rose-300/30",
    glowColor: "rgba(244, 114, 182, 0.2)",
  },
  mediodia: {
    id: "mediodia",
    label: "Medio Día",
    badgeLabel: "Medio Día",
    timeRange: "09:30 – 16:30",
    description: "Luz natural diurna pura",
    imageSrc: "/images/hero/Medio_Dia.jpg",
    accentPill: "bg-amber-500/20 text-amber-200 border-amber-300/30",
    glowColor: "rgba(251, 191, 36, 0.15)",
  },
  atardecer: {
    id: "atardecer",
    label: "Atardecer",
    badgeLabel: "Atardecer",
    timeRange: "16:30 – 19:30",
    description: "Golden hour cálida y envolvente",
    imageSrc: "/images/hero/Atardecer.jpg",
    accentPill: "bg-orange-500/20 text-orange-200 border-orange-300/30",
    glowColor: "rgba(249, 115, 22, 0.22)",
  },
  crepusculo: {
    id: "crepusculo",
    label: "Crepúsculo",
    badgeLabel: "Crepúsculo",
    timeRange: "19:30 – 21:00",
    description: "Hora azul y primeras luces tenues",
    imageSrc: "/images/hero/Crepusculo.jpg",
    accentPill: "bg-indigo-500/20 text-indigo-200 border-indigo-300/30",
    glowColor: "rgba(99, 102, 241, 0.22)",
  },
  noche: {
    id: "noche",
    label: "Noche",
    badgeLabel: "Noche Profunda",
    timeRange: "21:00 – 06:00",
    description: "Atmósfera íntima, velas y noche urbana",
    imageSrc: "/images/hero/Noche.jpg",
    accentPill: "bg-sky-500/20 text-sky-200 border-sky-300/30",
    glowColor: "rgba(56, 189, 248, 0.18)",
  },
};

export const HERO_PHASE_ORDER: HeroPhaseId[] = [
  "amanecer",
  "mediodia",
  "atardecer",
  "crepusculo",
  "noche",
];

export function getPhaseForTime(date: Date = new Date()): HeroPhaseId {
  const hours = date.getHours() + date.getMinutes() / 60;
  if (hours >= 6.0 && hours < 9.5) return "amanecer";
  if (hours >= 9.5 && hours < 16.5) return "mediodia";
  if (hours >= 16.5 && hours < 19.5) return "atardecer";
  if (hours >= 19.5 && hours < 21.0) return "crepusculo";
  return "noche";
}

function formatClockTime(date: Date = new Date()): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

const STORAGE_KEY = "lumina_hero_phase_override";

export function useHeroTimePhase() {
  const [autoPhaseId, setAutoPhaseId] = useState<HeroPhaseId>(() => {
    if (typeof window !== "undefined") {
      const globalPhase = (window as unknown as { __LUMINA_INITIAL_PHASE__?: HeroPhaseId }).__LUMINA_INITIAL_PHASE__;
      if (globalPhase && HERO_PHASES[globalPhase]) return globalPhase;
      return getPhaseForTime(new Date());
    }
    return getPhaseForTime(new Date());
  });

  const [formattedTime, setFormattedTime] = useState<string>(() => {
    return formatClockTime(new Date());
  });
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Sync with client clock automatically
  useEffect(() => {
    setIsMounted(true);

    const syncTime = () => {
      const now = new Date();
      const currentCalculatedPhase = getPhaseForTime(now);
      setAutoPhaseId(currentCalculatedPhase);
      setFormattedTime(formatClockTime(now));

      if (typeof window !== "undefined") {
        (window as unknown as { __LUMINA_INITIAL_PHASE__?: HeroPhaseId }).__LUMINA_INITIAL_PHASE__ = currentCalculatedPhase;
        try {
          document.cookie = `lumina_client_phase=${currentCalculatedPhase}; path=/; max-age=31536000; SameSite=Lax`;
          document.documentElement.setAttribute("data-hero-phase", currentCalculatedPhase);
        } catch {}
      }
    };

    // Run sync immediately on mount
    syncTime();

    // Clear any legacy manual test override from session storage
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}

    // Polling interval every 30 seconds: enables automatic smooth transition when crossing time boundaries (e.g. 9:30 AM)
    const interval = setInterval(syncTime, 30000);

    // Also re-sync immediately when user returns to tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncTime();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const activePhaseId: HeroPhaseId = autoPhaseId;
  const currentPhase = HERO_PHASES[activePhaseId];

  return {
    isMounted,
    isAuto: true,
    phaseId: activePhaseId,
    currentPhase,
    autoPhaseId,
    formattedTime,
    phases: HERO_PHASES,
    phaseOrder: HERO_PHASE_ORDER,
  };
}
