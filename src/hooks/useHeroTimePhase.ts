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
    imageSrc: "/images/hero/Amanecer_clean.png",
    accentPill: "bg-rose-500/20 text-rose-200 border-rose-300/30",
    glowColor: "rgba(244, 114, 182, 0.2)",
  },
  mediodia: {
    id: "mediodia",
    label: "Medio Día",
    badgeLabel: "Medio Día",
    timeRange: "09:30 – 16:30",
    description: "Luz natural diurna pura",
    imageSrc: "/images/hero/Lumina_Hero_Original.jpg",
    accentPill: "bg-amber-500/20 text-amber-200 border-amber-300/30",
    glowColor: "rgba(251, 191, 36, 0.15)",
  },
  atardecer: {
    id: "atardecer",
    label: "Atardecer",
    badgeLabel: "Atardecer",
    timeRange: "16:30 – 19:30",
    description: "Golden hour cálida y envolvente",
    imageSrc: "/images/hero/Atardecer_clean.png",
    accentPill: "bg-orange-500/20 text-orange-200 border-orange-300/30",
    glowColor: "rgba(249, 115, 22, 0.22)",
  },
  crepusculo: {
    id: "crepusculo",
    label: "Crepúsculo",
    badgeLabel: "Crepúsculo",
    timeRange: "19:30 – 21:00",
    description: "Hora azul y primeras luces tenues",
    imageSrc: "/images/hero/Crepusculo_clean.png",
    accentPill: "bg-indigo-500/20 text-indigo-200 border-indigo-300/30",
    glowColor: "rgba(99, 102, 241, 0.22)",
  },
  noche: {
    id: "noche",
    label: "Noche",
    badgeLabel: "Noche Profunda",
    timeRange: "21:00 – 06:00",
    description: "Atmósfera íntima, velas y noche urbana",
    imageSrc: "/images/hero/Noche_clean.png",
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
  const [autoPhaseId, setAutoPhaseId] = useState<HeroPhaseId>("mediodia");
  const [manualPhaseId, setManualPhaseId] = useState<HeroPhaseId | null>(null);
  const [formattedTime, setFormattedTime] = useState<string>("");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Sync with client clock
  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    setAutoPhaseId(getPhaseForTime(now));
    setFormattedTime(formatClockTime(now));

    // Restore manual selection if previously saved in session
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && saved in HERO_PHASES) {
        setManualPhaseId(saved as HeroPhaseId);
      }
    } catch {}

    // Interval to refresh time every 30 seconds
    const interval = setInterval(() => {
      const cur = new Date();
      setAutoPhaseId(getPhaseForTime(cur));
      setFormattedTime(formatClockTime(cur));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const isAuto = manualPhaseId === null;
  const activePhaseId: HeroPhaseId = manualPhaseId || autoPhaseId;
  const currentPhase = HERO_PHASES[activePhaseId];

  const setPhase = useCallback((target: HeroPhaseId | "auto") => {
    if (target === "auto") {
      setManualPhaseId(null);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
    } else {
      setManualPhaseId(target);
      try {
        sessionStorage.setItem(STORAGE_KEY, target);
      } catch {}
    }
  }, []);

  const cycleNextPhase = useCallback(() => {
    const currentIndex = HERO_PHASE_ORDER.indexOf(activePhaseId);
    const nextIndex = (currentIndex + 1) % HERO_PHASE_ORDER.length;
    setPhase(HERO_PHASE_ORDER[nextIndex]);
  }, [activePhaseId, setPhase]);

  return {
    isMounted,
    isAuto,
    phaseId: activePhaseId,
    currentPhase,
    autoPhaseId,
    formattedTime,
    setPhase,
    cycleNextPhase,
    phases: HERO_PHASES,
    phaseOrder: HERO_PHASE_ORDER,
  };
}
