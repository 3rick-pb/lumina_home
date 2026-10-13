"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { getDisplacementFilter } from "./LiquidGlass";

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
  gridCols = 4,
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

  // Chromium check for feDisplacementMap SVG filter
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

    const newGeo: TabGeometry[] = [];
    tabRefs.current.forEach((el) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        newGeo.push({
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    if (newGeo.length === items.length) {
      setTabsGeo(newGeo);
    } else if (variant === "dock" && items.length > 0) {
      // Precise mathematical fallback for grid dock
      const colWidth = containerRect.width / items.length;
      const fallbackGeo: TabGeometry[] = items.map((_, i) => ({
        x: i * colWidth,
        y: 0,
        width: colWidth,
        height: containerRect.height || 52,
      }));
      setTabsGeo(fallbackGeo);
    }
  }, [items, variant]);

  useEffect(() => {
    measureTabs();
    const ro = new ResizeObserver(() => measureTabs());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measureTabs);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureTabs);
    };
  }, [measureTabs]);

  // Dimensions configuration:
  // - Resting: Fits inside the menu bar with concentric symmetric padding
  // - Scrubbing/Holding: Salta y sobrepasa arriba y abajo del cuerpo del menú principal
  const restingTop = variant === "dock" ? 3 : 2;
  const restingHeight = variant === "dock" ? 46 : 36;
  const overhangingTop = variant === "dock" ? -11 : -8;
  const overhangingHeight = variant === "dock" ? 74 : 56;

  // Motion values for physical spring follower
  const lensTargetX = useMotionValue(0);
  const lensTargetWidth = useMotionValue(0);
  const lensTargetScaleX = useMotionValue(1);

  // Apple spring physics:
  // - Agile tracking during drag
  // - Settling fluid bounce on release
  const springX = useSpring(lensTargetX, { stiffness: 460, damping: 32, mass: 0.6 });
  const springWidth = useSpring(lensTargetWidth, { stiffness: 460, damping: 32, mass: 0.6 });
  const springScaleX = useSpring(lensTargetScaleX, { stiffness: 420, damping: 24, mass: 0.5 });

  // Update resting position whenever activeIndex or tabsGeo changes
  useEffect(() => {
    if (!isScrubbingRef.current && tabsGeo[activeIndex]) {
      const current = tabsGeo[activeIndex];
      const insetX = variant === "dock" ? 3 : 2;
      lensTargetX.set(current.x + insetX);
      lensTargetWidth.set(Math.max(20, current.width - insetX * 2));
      lensTargetScaleX.set(1.0);
    }
  }, [activeIndex, tabsGeo, variant, lensTargetX, lensTargetWidth, lensTargetScaleX]);

  // Optical SVG filter for the overhanging Liquid Glass lens
  const currentLensWidth = (tabsGeo[activeIndex]?.width || 80) + 8;
  const lensFilterUrl = useMemo(() => {
    if (!hasChromiumSupport || currentLensWidth <= 0) return null;
    return getDisplacementFilter({
      width: Math.round(currentLensWidth),
      height: Math.round(overhangingHeight),
      radius: 9999,
      depth: 6,
      strength: 32,
      chromaticAberration: 2.2,
    });
  }, [hasChromiumSupport, currentLensWidth, overhangingHeight]);

  // Tactile haptic tick when crossing tab boundaries
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  }, []);

  // Helper: Find closest tab to relative X coordinate
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
  // GESTURE HANDLERS (POINTER EVENTS: TOUCH + MOUSE + TRACKPAD)
  // =========================================================================

  const activateScrubbing = useCallback(
    (idx: number) => {
      isScrubbingRef.current = true;
      setIsScrubbing(true);
      setPreviewIndex(idx);
      previewIndexRef.current = idx;
      triggerHaptic();

      if (tabsGeo[idx]) {
        const target = tabsGeo[idx];
        // Center the overhanging lens around the selected tab
        lensTargetX.set(target.x - 4);
        lensTargetWidth.set(target.width + 8);
        lensTargetScaleX.set(1.08);
      }
    },
    [tabsGeo, triggerHaptic, lensTargetX, lensTargetWidth, lensTargetScaleX]
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

    // Start hold timer:
    // If held for > 75ms without lifting, the separator SALTA and pops up into Liquid Glass puro!
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
      // If moving, activate scrubbing immediately without waiting for the timer
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

    // Detect page swipe when dragging far past the edges of the dock (> 40px)
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
      triggerHaptic();
    }

    // Follow pointer with magnetic tab attraction
    const targetGeo = tabsGeo[closestIdx];
    if (targetGeo) {
      const tabCenterX = targetGeo.x + targetGeo.width / 2;
      const fingerDelta = relX - tabCenterX;
      // Magnetic pull keeps lens close to finger while feeling attached to the tabs
      const dynamicX = targetGeo.x - 4 + fingerDelta * 0.45;
      
      lensTargetX.set(dynamicX);
      lensTargetWidth.set(targetGeo.width + 8);

      // Velocity elongation (Apple fluid jelly stretch along X axis)
      const stretchVelocity = Math.min(0.24, Math.abs(vx) * 0.12);
      lensTargetScaleX.set(1.08 + stretchVelocity);
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

    // Reset scrubbing states
    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    pointerStartRef.current = null;

    // Settle back to resting position with authentic Apple spring bounce
    if (tabsGeo[selectedIdx]) {
      const target = tabsGeo[selectedIdx];
      const insetX = variant === "dock" ? 3 : 2;
      lensTargetX.set(target.x + insetX);
      lensTargetWidth.set(Math.max(20, target.width - insetX * 2));
      lensTargetScaleX.set(1.0);
    }

    // Commit selection if released from scrubbing
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

    // Snap back to active tab resting position
    if (tabsGeo[activeIndex]) {
      const target = tabsGeo[activeIndex];
      const insetX = variant === "dock" ? 3 : 2;
      lensTargetX.set(target.x + insetX);
      lensTargetWidth.set(Math.max(20, target.width - insetX * 2));
      lensTargetScaleX.set(1.0);
    }
  };

  // Direct Tap click handler (immediate fluid glide to new tab)
  const handleDirectItemClick = (e: React.MouseEvent, item: LiquidScrubberItem, idx: number) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      return;
    }

    // Direct click/tap
    triggerHaptic();
    if (tabsGeo[idx]) {
      const target = tabsGeo[idx];
      const insetX = variant === "dock" ? 3 : 2;
      lensTargetX.set(target.x + insetX);
      lensTargetWidth.set(Math.max(20, target.width - insetX * 2));
      lensTargetScaleX.set(1.0);
    }
    onSelect(item.id, item);
  };

  // The tab that is currently under the spotlight (magnified & highlighted)
  const spotlightIndex = previewIndex !== null ? previewIndex : activeIndex;

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
          ? "w-full h-[52px] grid items-center justify-items-stretch gap-1 px-1"
          : "flex items-center gap-1 p-1 h-[40px]"
      } ${className}`}
      style={{
        WebkitTapHighlightColor: "transparent",
        gridTemplateColumns: variant === "dock" ? `repeat(${gridCols}, minmax(0, 1fr))` : undefined,
      }}
    >
      {/* ================================================================= */}
      {/* SEPARADOR DINÁMICO: REPOSO (GRISÁCEO SIMÉTRICO) + ARRASTRE (LIQUID GLASS PURO) */}
      {/* ================================================================= */}
      {tabsGeo.length > 0 && (
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
          {/* CAPA 1: SEPARADOR GRISÁCEO EN REPOSO (CAPTURA DE APPLE) */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            animate={{ opacity: isScrubbing ? 0 : 1 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 rounded-full bg-[#e2e2e7] dark:bg-[#2c2c2e] border border-white/80 dark:border-white/15 shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.7)]"
          />

          {/* ------------------------------------------------------------- */}
          {/* CAPA 2: LIQUID GLASS PURO FLOTANTE (AL MANTENER PULSADO / SLIDE) */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            animate={{ opacity: isScrubbing ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              backdropFilter: lensFilterUrl
                ? `blur(1.5px) url('${lensFilterUrl}') blur(2px) brightness(1.12) saturate(1.4)`
                : "blur(16px) saturate(190%) brightness(1.1)",
              WebkitBackdropFilter: lensFilterUrl
                ? `blur(1.5px) url('${lensFilterUrl}') blur(2px) brightness(1.12) saturate(1.4)`
                : "blur(16px) saturate(190%) brightness(1.1)",
              background: "rgba(255, 255, 255, 0.45)",
              boxShadow: `
                0 18px 38px -4px rgba(0, 0, 0, 0.28),
                0 6px 16px -2px rgba(0, 0, 0, 0.14),
                inset 0 1.5px 2px 0px rgba(255, 255, 255, 0.95),
                inset 0 -1px 1.5px 0px rgba(255, 255, 255, 0.35)
              `,
              border: "1px solid rgba(255, 255, 255, 0.85)",
            }}
          >
            {/* Borde con dispersión cromática (Arcoíris VisionOS sutil) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-50 mix-blend-overlay"
              style={{
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.5) 0%, rgba(168,85,247,0.4) 45%, rgba(251,146,60,0.5) 100%)",
              }}
            />

            {/* Reflejo curvado especular en la parte superior */}
            <div className="absolute inset-x-0 top-0 h-[48%] rounded-t-full bg-gradient-to-b from-white/90 via-white/25 to-transparent pointer-events-none" />
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
              className="relative z-10 flex-1 h-[50px] flex flex-col items-center justify-center py-1 px-0.5 rounded-full select-none cursor-pointer focus:outline-none"
            >
              {/* Icono con escala dinámica al apuntar */}
              <div
                className={`relative flex items-center justify-center transition-all duration-200 transform-gpu ${
                  isSpotlight
                    ? "scale-110 -translate-y-0.5"
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
                className={`text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-[68px] text-center transition-all duration-200 ${
                  isSpotlight
                    ? `${activeColor || "text-[#c25e1a] dark:text-[#f59e0b]"} font-black scale-105`
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
          <div key={`empty-slot-${i}`} className="w-full h-[50px] pointer-events-none" aria-hidden="true" />
        ))}
    </div>
  );
}
