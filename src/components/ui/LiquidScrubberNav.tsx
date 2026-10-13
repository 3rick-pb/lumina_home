"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export interface LiquidScrubberItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badgeCount?: number;
  title?: string;
  onClick?: () => void;
}

export interface LiquidScrubberNavProps {
  items: LiquidScrubberItem[];
  activeId: string;
  onSelect: (id: string, item: LiquidScrubberItem) => void;
  variant?: "pill" | "dock";
  className?: string;
  activeColor?: string; // Tailwind color class e.g. "text-[#c25e1a] dark:text-[#f59e0b]"
  gridCols?: number;
  onSwipePage?: (direction: 1 | -1) => void;
}

interface TabGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function LiquidScrubberNav({
  items,
  activeId,
  onSelect,
  variant = "pill",
  className = "",
  activeColor,
  gridCols = 3,
  onSwipePage,
}: LiquidScrubberNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [tabsGeo, setTabsGeo] = useState<TabGeometry[]>([]);

  // Track scrubbing state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewIndexRef = useRef<number | null>(null);

  // Gesture physics tracking
  const pointerStartRef = useRef<{ x: number; y: number; time: number; pointerId: number } | null>(null);
  const lastMoveRef = useRef<{ x: number; time: number; vx: number }>({ x: 0, time: 0, vx: 0 });
  const hasMovedRef = useRef(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active index
  const activeIndex = useMemo(() => {
    const idx = items.findIndex((it) => it.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [items, activeId]);

  // Chromium check for in-document SVG backdrop filter
  const [hasChromiumSupport, setHasChromiumSupport] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isChromium = /chrome|chromium|crios|edg/.test(ua) && !/firefox|fxios/.test(ua);
      setHasChromiumSupport(isChromium);
    }
  }, []);

  // Measure tab geometries
  const measureTabs = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0) return;

    if (variant === "dock" && items.length > 0) {
      // Rejilla matemática simétrica exacta: cada slot ocupa 1 / gridCols
      const cols = gridCols || items.length;
      const colWidth = containerRect.width / cols;
      const dockGeo: TabGeometry[] = items.map((_, i) => ({
        x: i * colWidth,
        y: 0,
        width: colWidth,
        height: containerRect.height || 50,
      }));
      setTabsGeo(dockGeo);
      return;
    }

    // Para pill (Header), medir cada pestaña
    const newGeo: TabGeometry[] = [];
    for (let i = 0; i < items.length; i++) {
      const el = tabRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) {
          newGeo.push({
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          });
        }
      }
    }

    if (newGeo.length === items.length) {
      setTabsGeo(newGeo);
    }
  }, [items, variant, gridCols]);

  useEffect(() => {
    measureTabs();
    const handleResize = () => measureTabs();
    window.addEventListener("resize", handleResize);

    const t1 = setTimeout(measureTabs, 50);
    const t2 = setTimeout(measureTabs, 150);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measureTabs]);

  // Dimensiones simétricas:
  // - En reposo: Ocupa el slot de forma concéntrica y elegante (sin pegarse al texto)
  // - Al mantener presionado: Salta y sobrepasa arriba y abajo ~5px de forma calibrada
  const restingTop = variant === "dock" ? 0 : 3;
  const restingHeight = variant === "dock" ? (tabsGeo[0]?.height || 50) : 34;
  const overhangingTop = variant === "dock" ? -6 : -5;
  const overhangingHeight = variant === "dock" ? ((tabsGeo[0]?.height || 50) + 12) : 48;

  // Motion values para el seguidor de resorte físico Apple
  const lensTargetX = useMotionValue(0);
  const lensTargetWidth = useMotionValue(0);
  const lensTargetScaleX = useMotionValue(1);

  // Física de resortes Apple
  const springX = useSpring(lensTargetX, { stiffness: 450, damping: 32, mass: 0.6 });
  const springWidth = useSpring(lensTargetWidth, { stiffness: 450, damping: 32, mass: 0.6 });
  const springScaleX = useSpring(lensTargetScaleX, { stiffness: 420, damping: 24, mass: 0.5 });

  // Actualizar posición de reposo cuando cambia activeIndex o tabsGeo
  useEffect(() => {
    if (!isScrubbingRef.current && tabsGeo[activeIndex]) {
      const current = tabsGeo[activeIndex];
      lensTargetX.set(current.x);
      lensTargetWidth.set(current.width);
      lensTargetScaleX.set(1.0);
    }
  }, [activeIndex, tabsGeo, lensTargetX, lensTargetWidth, lensTargetScaleX]);

  // Helper: Encontrar la pestaña más cercana a la coordenada X
  const getClosestIndex = useCallback(
    (relX: number) => {
      if (tabsGeo.length === 0) return 0;
      let closestIdx = 0;
      let minDistance = Infinity;

      tabsGeo.forEach((geo, idx) => {
        const tabCenterX = geo.x + geo.width / 2;
        const dist = Math.abs(relX - tabCenterX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      return closestIdx;
    },
    [tabsGeo]
  );

  // =========================================================================
  // GESTORES DE GESTOS (TOUCH + MOUSE + TRACKPAD)
  // =========================================================================

  const activateScrubbing = useCallback(
    (idx: number) => {
      isScrubbingRef.current = true;
      setIsScrubbing(true);
      setPreviewIndex(idx);
      previewIndexRef.current = idx;

      if (tabsGeo[idx] && containerRef.current) {
        const target = tabsGeo[idx];
        lensTargetX.set(target.x);
        lensTargetWidth.set(target.width);
        lensTargetScaleX.set(1.04);
      }
    },
    [tabsGeo, lensTargetX, lensTargetWidth, lensTargetScaleX]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tabsGeo.length === 0 || !containerRef.current) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;
    const initialIdx = getClosestIndex(relX);

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      pointerId: e.pointerId,
    };
    lastMoveRef.current = { x: e.clientX, time: performance.now(), vx: 0 };
    hasMovedRef.current = false;

    // Temporizador de pulsación mantenida:
    // Si se mantiene > 75ms sin levantar, el separador SALTA y activa Liquid Glass
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      activateScrubbing(initialIdx);
    }, 75);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || !containerRef.current) return;

    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);

    if (dx > 4 || dy > 4) {
      hasMovedRef.current = true;
      // Si se mueve, activar arrastre de inmediato
      if (!isScrubbingRef.current) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        const containerRect = containerRef.current.getBoundingClientRect();
        const relX = e.clientX - containerRect.left;
        activateScrubbing(getClosestIndex(relX));
      }
    }

    if (!isScrubbingRef.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastMoveRef.current.time);
    const vx = (e.clientX - lastMoveRef.current.x) / dt;
    lastMoveRef.current = { x: e.clientX, time: now, vx };

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;

    // Deslizamiento de cambio de página en dock (> 40px fuera de bordes)
    if (onSwipePage) {
      if (relX < -40) {
        onSwipePage(-1);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        isScrubbingRef.current = false;
        setIsScrubbing(false);
        return;
      }
      if (relX > containerRect.width + 40) {
        onSwipePage(1);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        isScrubbingRef.current = false;
        setIsScrubbing(false);
        return;
      }
    }

    const closestIdx = getClosestIndex(relX);

    if (closestIdx !== previewIndexRef.current) {
      previewIndexRef.current = closestIdx;
      setPreviewIndex(closestIdx);
    }

    // Seguidor magnético estrictamente acotado a la barra
    const targetGeo = tabsGeo[closestIdx];
    if (targetGeo) {
      const tabCenterX = targetGeo.x + targetGeo.width / 2;
      // Tensión elástica limitada a +-14px
      const fingerDelta = Math.max(-14, Math.min(14, relX - tabCenterX));
      const dynamicX = targetGeo.x + fingerDelta * 0.45;

      // Límites estrictos dentro del contenedor
      const minX = 0;
      const maxX = containerRect.width - targetGeo.width;
      const boundedX = Math.max(minX, Math.min(maxX, dynamicX));

      lensTargetX.set(boundedX);
      lensTargetWidth.set(targetGeo.width);

      // Estiramiento sutil por velocidad
      const stretchVelocity = Math.min(0.15, Math.abs(vx) * 0.08);
      lensTargetScaleX.set(1.03 + stretchVelocity);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const wasScrubbing = isScrubbingRef.current;
    const selectedIdx = previewIndexRef.current !== null ? previewIndexRef.current : activeIndex;
    const selectedItem = items[selectedIdx];

    // Restablecer estados
    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    pointerStartRef.current = null;

    // Asentar en posición de reposo simétrica
    if (tabsGeo[selectedIdx]) {
      const target = tabsGeo[selectedIdx];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
    }

    // Confirmar selección si se soltó desde arrastre
    if (wasScrubbing && selectedItem) {
      onSelect(selectedItem.id, selectedItem);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    pointerStartRef.current = null;

    // Volver a la pestaña activa
    if (tabsGeo[activeIndex]) {
      const target = tabsGeo[activeIndex];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
    }
  };

  // Clic/Tap directo inmediato sin lag
  const handleDirectItemClick = (e: React.MouseEvent, item: LiquidScrubberItem, idx: number) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      return;
    }

    if (tabsGeo[idx]) {
      const target = tabsGeo[idx];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
    }
    onSelect(item.id, item);
  };

  const spotlightIndex = previewIndex !== null ? previewIndex : activeIndex;
  const hasValidGeometry = !!tabsGeo[activeIndex];

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-orientation="horizontal"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`relative select-none touch-none cursor-pointer overflow-visible ${
        variant === "dock"
          ? "w-full h-full grid items-center justify-items-stretch"
          : "flex items-center gap-1 p-1 h-[40px]"
      } ${className}`}
      style={{
        WebkitTapHighlightColor: "transparent",
        gridTemplateColumns: variant === "dock" ? `repeat(${gridCols}, minmax(0, 1fr))` : undefined,
      }}
    >
      {/* ================================================================= */}
      {/* FILTRO DE REFRACCIÓN ÓPTICA EN EL DOM (PARA CHROMIUM) */}
      {/* ================================================================= */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="apple-liquid-glass-refract" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.04" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>
      </svg>

      {/* ================================================================= */}
      {/* SEPARADOR DINÁMICO: REPOSO (GRISÁCEO SIMÉTRICO) + ARRASTRE (LIQUID GLASS PURO) */}
      {/* ================================================================= */}
      {hasValidGeometry && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            x: springX,
            width: springWidth,
            scaleX: springScaleX,
            transformOrigin: "center center",
          }}
          animate={{
            top: isScrubbing ? overhangingTop : restingTop,
            height: isScrubbing ? overhangingHeight : restingHeight,
            zIndex: isScrubbing ? 30 : 0,
          }}
          transition={{
            top: { type: "spring", stiffness: 450, damping: 28, mass: 0.6 },
            height: { type: "spring", stiffness: 450, damping: 28, mass: 0.6 },
          }}
        >
          {/* ------------------------------------------------------------- */}
          {/* CAPA 1: SEPARADOR GRISÁCEO EN REPOSO (IDÉNTICO A "BIEN HECHO.PNG") */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            animate={{ opacity: isScrubbing ? 0 : 1 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-full bg-[#d8d8de] dark:bg-[#2c2c2e] border border-white/70 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.7)]"
          />

          {/* ------------------------------------------------------------- */}
          {/* CAPA 2: LIQUID GLASS PURO FLOTANTE (AL MANTENER PULSADO / SLIDE) */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            animate={{ opacity: isScrubbing ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              backdropFilter: hasChromiumSupport
                ? "url(#apple-liquid-glass-refract) blur(16px) saturate(190%) brightness(1.12)"
                : "blur(18px) saturate(190%) brightness(1.12)",
              WebkitBackdropFilter: "blur(18px) saturate(190%) brightness(1.12)",
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.85)",
              boxShadow: `
                inset 0 1.5px 2px rgba(255, 255, 255, 0.95),
                inset 0 -1.5px 2px rgba(255, 255, 255, 0.35),
                inset 1.5px 0 2px rgba(255, 255, 255, 0.5),
                inset -1.5px 0 2px rgba(255, 255, 255, 0.5),
                0 14px 30px -4px rgba(0, 0, 0, 0.24),
                0 4px 10px -2px rgba(0, 0, 0, 0.12)
              `,
            }}
          >
            {/* Reflejo curvado especular en la parte superior (Gota física de cristal) */}
            <div className="absolute inset-x-0 top-0 h-[50%] rounded-t-full bg-gradient-to-b from-white/50 via-white/10 to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      )}

      {/* ================================================================= */}
      {/* FILA DE ELEMENTOS / PESTAÑAS */}
      {/* ================================================================= */}
      {items.map((item, idx) => {
        const isSpotlight = idx === spotlightIndex;

        if (variant === "dock") {
          // Mobile Profile Dock: vertical stack (icono arriba, texto abajo)
          return (
            <div
              key={item.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              role="tab"
              aria-selected={isSpotlight}
              draggable={false}
              onClick={(e) => handleDirectItemClick(e, item, idx)}
              className="relative z-10 w-full h-full flex flex-col items-center justify-center py-1 px-1 rounded-full select-none cursor-pointer focus:outline-none"
            >
              {/* Icono */}
              <div
                className={`relative flex items-center justify-center transition-all duration-200 transform-gpu ${
                  isSpotlight
                    ? "scale-105 -translate-y-0.5"
                    : "scale-100 translate-y-0 opacity-85"
                }`}
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center transition-colors duration-200 ${
                    isSpotlight
                      ? activeColor || "text-[#c25e1a] dark:text-[#f59e0b] stroke-[2.4px]"
                      : "text-stone-900 dark:text-stone-100 font-bold"
                  }`}
                >
                  {item.icon}
                </div>

                {/* Badge count */}
                {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-black bg-[#fa2d48] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#16161a] shadow-xs">
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </span>
                )}
              </div>

              {/* Etiqueta nítida de alto contraste */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-[95px] px-0.5 text-center transition-all duration-200 ${
                  isSpotlight
                    ? `${activeColor || "text-[#c25e1a] dark:text-[#f59e0b]"} font-black`
                    : "text-stone-900 dark:text-stone-200 font-bold"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        }

        // Horizontal pill for Header (icono al lado de etiqueta)
        return (
          <div
            key={item.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            role="tab"
            aria-selected={isSpotlight}
            draggable={false}
            onClick={(e) => handleDirectItemClick(e, item, idx)}
            className="relative z-10 flex items-center gap-2 px-5 py-2 rounded-full text-sm select-none cursor-pointer focus:outline-none"
          >
            <div
              className={`transition-all duration-200 transform-gpu ${
                isSpotlight
                  ? "scale-115 text-[#8c9276] dark:text-[#a3a98d]"
                  : "scale-100 text-stone-700 dark:text-stone-300"
              }`}
            >
              {item.icon}
            </div>

            <span
              className={`transition-colors duration-200 ${
                isSpotlight
                  ? "text-stone-950 dark:text-white font-bold"
                  : "text-stone-700 dark:text-stone-300 font-medium"
              }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Espacios vacíos simétricos en dock si hay menos items que gridCols */}
      {variant === "dock" &&
        Array.from({ length: Math.max(0, gridCols - items.length) }).map((_, i) => (
          <div key={`empty-slot-${i}`} className="w-full h-full pointer-events-none" aria-hidden="true" />
        ))}
    </div>
  );
}
