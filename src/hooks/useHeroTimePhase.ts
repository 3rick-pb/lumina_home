"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type LightingPeriod =
  | "amanecer"   // 06:00 - 09:00
  | "mediodia"   // 09:00 - 16:30
  | "atardecer"  // 16:30 - 18:30
  | "crepusculo" // 18:30 - 19:30
  | "noche";     // 19:30 - 06:00

export type HeroPhaseId = LightingPeriod;
export type LightingMode = "auto" | "manual";

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

export const HERO_IMAGE_MAP: Record<LightingPeriod, string> = {
  amanecer: "/images/hero/Amanecer.jpg",
  mediodia: "/images/hero/Medio_Dia.jpg",
  atardecer: "/images/hero/Atardecer.jpg",
  crepusculo: "/images/hero/Crepusculo.jpg",
  noche: "/images/hero/Noche.jpg",
};

export const HERO_PHASES: Record<HeroPhaseId, HeroPhase> = {
  amanecer: {
    id: "amanecer",
    label: "Amanecer",
    badgeLabel: "Amanecer",
    timeRange: "06:00 – 09:00",
    description: "Luz matutina fresca y apacible",
    imageSrc: HERO_IMAGE_MAP.amanecer,
    accentPill: "bg-rose-500/20 text-rose-200 border-rose-300/30",
    glowColor: "rgba(244, 114, 182, 0.2)",
  },
  mediodia: {
    id: "mediodia",
    label: "Medio Día",
    badgeLabel: "Medio Día",
    timeRange: "09:00 – 16:30",
    description: "Luz natural diurna pura",
    imageSrc: HERO_IMAGE_MAP.mediodia,
    accentPill: "bg-amber-500/20 text-amber-200 border-amber-300/30",
    glowColor: "rgba(251, 191, 36, 0.15)",
  },
  atardecer: {
    id: "atardecer",
    label: "Atardecer",
    badgeLabel: "Atardecer",
    timeRange: "16:30 – 18:30",
    description: "Golden hour cálida y envolvente",
    imageSrc: HERO_IMAGE_MAP.atardecer,
    accentPill: "bg-orange-500/20 text-orange-200 border-orange-300/30",
    glowColor: "rgba(249, 115, 22, 0.22)",
  },
  crepusculo: {
    id: "crepusculo",
    label: "Crepúsculo",
    badgeLabel: "Crepúsculo",
    timeRange: "18:30 – 19:30",
    description: "Hora azul y primeras luces tenues",
    imageSrc: HERO_IMAGE_MAP.crepusculo,
    accentPill: "bg-indigo-500/20 text-indigo-200 border-indigo-300/30",
    glowColor: "rgba(99, 102, 241, 0.22)",
  },
  noche: {
    id: "noche",
    label: "Noche",
    badgeLabel: "Noche Profunda",
    timeRange: "19:30 – 06:00",
    description: "Atmósfera íntima, velas y noche urbana",
    imageSrc: HERO_IMAGE_MAP.noche,
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

// Calcula la temporalidad exacta según la hora y minutos del dispositivo
export function getLightingPeriodByDate(date = new Date()): LightingPeriod {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();

  if (totalMinutes >= 360 && totalMinutes < 540) return "amanecer";     // 06:00 - 09:00
  if (totalMinutes >= 540 && totalMinutes < 990) return "mediodia";     // 09:00 - 16:30
  if (totalMinutes >= 990 && totalMinutes < 1110) return "atardecer";   // 16:30 - 18:30
  if (totalMinutes >= 1110 && totalMinutes < 1170) return "crepusculo"; // 18:30 - 19:30
  return "noche";                                                       // 19:30 - 06:00
}

export const getPhaseForTime = getLightingPeriodByDate;
export const getLightingPeriodByTime = getLightingPeriodByDate;

const STORAGE_KEY = "lumina_hero_phase_override";

// Resuelve la temporalidad síncrona en 0ms sin esperar hidratación ni useEffect
export function getInitialLightingPeriod(): LightingPeriod {
  if (typeof window !== "undefined") {
    // 1. Temporalidad inyectada en <head> síncronamente antes del parseo del DOM
    const initialPhase = (window as unknown as { __LUMINA_INITIAL_PHASE__?: LightingPeriod }).__LUMINA_INITIAL_PHASE__;
    if (initialPhase && initialPhase in HERO_IMAGE_MAP) return initialPhase;

    // 2. Preferencia manual guardada en sessionStorage
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && saved in HERO_IMAGE_MAP) return saved as LightingPeriod;
    } catch {}

    // 3. Cookie persistente
    try {
      const match = document.cookie.match(/lumina_client_phase=([^;]+)/);
      if (match && match[1] in HERO_IMAGE_MAP) return match[1] as LightingPeriod;
    } catch {}

    // 4. Hora real del cliente
    return getLightingPeriodByDate(new Date());
  }
  return getLightingPeriodByDate(new Date());
}

// Caché en memoria de imágenes ya descargadas y decodificadas en la GPU
const decodedImageCache = new Set<string>();

export async function preloadAndDecodeImage(src: string): Promise<void> {
  if (!src || typeof window === "undefined" || decodedImageCache.has(src)) {
    return;
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;

    const finalize = () => {
      decodedImageCache.add(src);
      resolve();
    };

    if (typeof img.decode === "function") {
      img
        .decode()
        .then(finalize)
        .catch(() => {
          // Si decode falla o el navegador ya la tiene lista, continuamos sin bloquear
          if (img.complete) finalize();
          else {
            img.onload = finalize;
            img.onerror = finalize;
          }
        });
    } else {
      img.onload = finalize;
      img.onerror = finalize;
    }
  });
}

/**
 * Controlador de arquitectura de iluminación del Hero:
 * 1. Cero descarga de imagen equivocada en SSR (inicializa en null en server)
 * 2. Decodificación en GPU (img.decode()) antes de iniciar la animación de escritura
 * 3. Doble buffer con crossfade cinematográfico suave de 700ms
 * 4. Pre-decodificación en segundo plano de las otras 4 temporalidades tras 1.8s
 */
export function useHeroTimePhase(imageMap: Record<LightingPeriod, string> = HERO_IMAGE_MAP) {
  const initialPeriod = getInitialLightingPeriod();
  const [mode, setMode] = useState<LightingMode>("auto");
  const [activePeriod, setActivePeriod] = useState<LightingPeriod>(initialPeriod);
  const [displayedPeriod, setDisplayedPeriod] = useState<LightingPeriod>(initialPeriod);
  const [previousPeriod, setPreviousPeriod] = useState<LightingPeriod | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHeroReady, setIsHeroReady] = useState(false);
  const [formattedTime, setFormattedTime] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Determinar la hora real del cliente en el instante 0 y decodificar SOLO esa imagen primero
  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setFormattedTime(`${hh}:${mm}`);

    // Revisar si había una preferencia manual previa guardada
    let resolvedPeriod: LightingPeriod = getLightingPeriodByDate(now);
    let initialMode: LightingMode = "auto";
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && saved in HERO_IMAGE_MAP) {
        resolvedPeriod = saved as LightingPeriod;
        initialMode = "manual";
      }
    } catch {}

    setMode(initialMode);
    setActivePeriod(resolvedPeriod);
    setDisplayedPeriod(resolvedPeriod);

    let mounted = true;
    const initialSrc = imageMap[resolvedPeriod];

    // Timeout de seguridad de 850ms por si la red del usuario es muy lenta
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsHeroReady(true);
    }, 850);

    preloadAndDecodeImage(initialSrc).then(() => {
      clearTimeout(safetyTimer);
      if (mounted) {
        setIsHeroReady(true);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [imageMap]);

  // 2. Pre-cargamos y decodificamos en segundo plano las otras 4 temporalidades tras 1.8s
  useEffect(() => {
    if (!isHeroReady || !displayedPeriod) return;

    const preloadOthers = () => {
      (Object.keys(imageMap) as LightingPeriod[]).forEach((period) => {
        if (period !== displayedPeriod) {
          preloadAndDecodeImage(imageMap[period]);
        }
      });
    };

    const idleTimer = setTimeout(() => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(preloadOthers, { timeout: 2000 });
      } else {
        preloadOthers();
      }
    }, 1800);

    return () => clearTimeout(idleTimer);
  }, [isHeroReady, displayedPeriod, imageMap]);

  // 3. Reloj en tiempo real cada 30 segundos cuando está en modo "auto"
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setFormattedTime(`${hh}:${mm}`);

      if (mode === "auto") {
        const nextAuto = getLightingPeriodByDate(now);
        setActivePeriod((prev) => (prev !== nextAuto ? nextAuto : prev));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [mode]);

  // 4. Transición suave de Doble Buffer cuando cambia activePeriod (sin parpadeos ni bloqueos)
  useEffect(() => {
    if (!activePeriod || !displayedPeriod || activePeriod === displayedPeriod) {
      return;
    }

    let cancelled = false;
    const targetSrc = imageMap[activePeriod];

    preloadAndDecodeImage(targetSrc).then(() => {
      if (cancelled) return;
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

      setPreviousPeriod(displayedPeriod);
      setDisplayedPeriod(activePeriod);
      setIsTransitioning(true);

      transitionTimerRef.current = setTimeout(() => {
        setPreviousPeriod(null);
        setIsTransitioning(false);
      }, 700);
    });

    return () => {
      cancelled = true;
    };
  }, [activePeriod, displayedPeriod, imageMap]);

  // Funciones para el menú desplegable "Iluminación Lumina"
  const selectManualPeriod = useCallback((period: LightingPeriod) => {
    setMode("manual");
    setActivePeriod(period);
    try {
      sessionStorage.setItem(STORAGE_KEY, period);
      document.cookie = `lumina_client_phase=${period}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.setAttribute("data-hero-phase", period);
    } catch {}
  }, []);

  const selectAutoMode = useCallback(() => {
    setMode("auto");
    const currentAuto = getLightingPeriodByDate(new Date());
    setActivePeriod(currentAuto);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      document.cookie = `lumina_client_phase=${currentAuto}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.setAttribute("data-hero-phase", currentAuto);
    } catch {}
  }, []);

  const setPhase = useCallback((target: HeroPhaseId | "auto") => {
    if (target === "auto") {
      selectAutoMode();
    } else {
      selectManualPeriod(target);
    }
  }, [selectAutoMode, selectManualPeriod]);

  const cycleNextPhase = useCallback(() => {
    const cur = activePeriod || initialPeriod;
    const currentIndex = HERO_PHASE_ORDER.indexOf(cur);
    const nextIndex = (currentIndex + 1) % HERO_PHASE_ORDER.length;
    selectManualPeriod(HERO_PHASE_ORDER[nextIndex]);
  }, [activePeriod, initialPeriod, selectManualPeriod]);

  const resolvedPhaseId = activePeriod || initialPeriod;

  return {
    isMounted,
    mode,
    isAuto: mode === "auto",
    phaseId: resolvedPhaseId,
    activePeriod,
    displayedPeriod,
    previousPeriod,
    isTransitioning,
    isHeroReady, // Permite disparar la animación de escritura exactamente cuando la GPU tiene la imagen decodificada
    formattedTime,
    currentPhase: HERO_PHASES[resolvedPhaseId],
    selectManualPeriod,
    selectAutoMode,
    setPhase,
    cycleNextPhase,
    phases: HERO_PHASES,
    phaseOrder: HERO_PHASE_ORDER,
  };
}

export const useHeroLighting = useHeroTimePhase;
