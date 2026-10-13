"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { LiquidGlass } from "@/components/ui/LiquidGlass";

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
  activeColor: _activeColor,
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
  const justCommittedRef = useRef(false);

  // Active index
  const activeIndex = useMemo(() => {
    const idx = items.findIndex((it) => it.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [items, activeId]);

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
  // - En reposo: Ocupa el slot de forma concéntrica a 2px del borde exterior (dock h=56px, inner=52px)
  // - Al mantener presionado: Salta y sobrepasa arriba, abajo y a los laterales con Liquid Glass puro
  const restingTop = variant === "dock" ? 0 : 3;
  const restingHeight = variant === "dock" ? (tabsGeo[0]?.height || 52) : 34;
  const overhangingTop = variant === "dock" ? -10 : -7;
  const overhangingHeight = variant === "dock" ? ((tabsGeo[0]?.height || 52) + 20) : 48;

  // Motion values para el seguidor de resorte físico Apple
  const lensTargetX = useMotionValue(0);
  const lensTargetWidth = useMotionValue(0);
  const lensTargetScaleX = useMotionValue(1);

  // Física de resortes Apple ultra-reactiva: sin retardo al arrastrar, rebote elástico al soltar
  const springX = useSpring(lensTargetX, { stiffness: 450, damping: 30, mass: 0.6 });
  const springWidth = useSpring(lensTargetWidth, { stiffness: 400, damping: 28, mass: 0.6 });
  const springScaleX = useSpring(lensTargetScaleX, { stiffness: 350, damping: 20, mass: 0.6 });

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
  // GESTORES DE GESTOS (TOUCH + MOUSE + TRACKPAD) SIN LATENCIA (0MS)
  // =========================================================================

  const activateScrubbing = useCallback(
    (idx: number, initialRelX?: number) => {
      isScrubbingRef.current = true;
      setIsScrubbing(true);
      setPreviewIndex(idx);
      previewIndexRef.current = idx;

      if (tabsGeo[idx] && containerRef.current) {
        const target = tabsGeo[idx];
        const lateralExpand = variant === "dock" ? 10 : 8;
        const activeWidth = target.width + lateralExpand * 2;
        lensTargetWidth.set(activeWidth);
        lensTargetScaleX.set(1.02);

        if (typeof initialRelX === "number") {
          const minX = (tabsGeo[0]?.x ?? 0) - lateralExpand;
          const lastGeo = tabsGeo[tabsGeo.length - 1];
          const maxX = lastGeo ? (lastGeo.x - lateralExpand) : 0;
          const boundedX = Math.max(minX, Math.min(maxX, initialRelX - activeWidth / 2));
          lensTargetX.set(boundedX);
        } else {
          lensTargetX.set(target.x - lateralExpand);
        }
      }
    },
    [tabsGeo, variant, lensTargetX, lensTargetWidth, lensTargetScaleX]
  );

  // Touch directo en móvil (0ms de latencia, elimina los 500ms de retardo del navegador)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (tabsGeo.length === 0 || !containerRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = touch.clientX - containerRect.left;
    const initialIdx = getClosestIndex(relX);

    pointerStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
      pointerId: 0,
    };
    lastMoveRef.current = { x: touch.clientX, time: performance.now(), vx: 0 };
    hasMovedRef.current = false;

    activateScrubbing(initialIdx, relX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || !containerRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const dx = Math.abs(touch.clientX - pointerStartRef.current.x);
    const dy = Math.abs(touch.clientY - pointerStartRef.current.y);

    if (dx > 3 || dy > 3) {
      hasMovedRef.current = true;
    }

    const now = performance.now();
    const dt = Math.max(1, now - lastMoveRef.current.time);
    const vx = (touch.clientX - lastMoveRef.current.x) / dt;
    lastMoveRef.current = { x: touch.clientX, time: now, vx };

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = touch.clientX - containerRect.left;

    // Deslizamiento de cambio de página en dock (> 45px fuera de bordes)
    if (onSwipePage) {
      if (relX < -45) {
        onSwipePage(-1);
        isScrubbingRef.current = false;
        setIsScrubbing(false);
        return;
      }
      if (relX > containerRect.width + 45) {
        onSwipePage(1);
        isScrubbingRef.current = false;
        setIsScrubbing(false);
        return;
      }
    }

    if (!isScrubbingRef.current) {
      activateScrubbing(getClosestIndex(relX), relX);
    }

    // Desplazamiento 100% fluido y continuo (sin efecto imán 1:1)
    const lateralExpand = variant === "dock" ? 10 : 8;
    const currentUnderIdx = getClosestIndex(relX);
    const currentTabGeo = tabsGeo[currentUnderIdx] || tabsGeo[0];
    const activeWidth = (currentTabGeo ? currentTabGeo.width : 80) + lateralExpand * 2;

    const minX = (tabsGeo[0]?.x ?? 0) - lateralExpand;
    const lastGeo = tabsGeo[tabsGeo.length - 1];
    const maxX = lastGeo ? (lastGeo.x - lateralExpand) : (containerRect.width - activeWidth);

    const rawX = relX - activeWidth / 2;
    const boundedX = Math.max(minX, Math.min(maxX, rawX));

    lensTargetX.set(boundedX);
    lensTargetWidth.set(activeWidth);

    const stretchVelocity = Math.min(0.08, Math.abs(vx) * 0.04);
    lensTargetScaleX.set(1.02 + stretchVelocity);

    // Actualización de color en tiempo real según la posición del centro de la lente
    const lensCenterX = boundedX + activeWidth / 2;
    const activeIdxUnderLens = getClosestIndex(lensCenterX);
    if (activeIdxUnderLens !== previewIndexRef.current) {
      previewIndexRef.current = activeIdxUnderLens;
      setPreviewIndex(activeIdxUnderLens);
    }
  };

  const handleTouchEnd = () => {
    const selectedIdx = previewIndexRef.current !== null ? previewIndexRef.current : activeIndex;
    const selectedItem = items[selectedIdx];

    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    pointerStartRef.current = null;

    // Asentar en posición de reposo con rebote suave
    if (tabsGeo[selectedIdx]) {
      const target = tabsGeo[selectedIdx];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
    }

    // Confirmar selección
    if (selectedItem) {
      justCommittedRef.current = true;
      onSelect(selectedItem.id, selectedItem);
      setTimeout(() => {
        justCommittedRef.current = false;
      }, 120);
    }
  };

  // Pointer events para Desktop (mouse / trackpad)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return; // Manejado por touch events
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

    activateScrubbing(initialIdx, relX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (!pointerStartRef.current || !containerRef.current) return;

    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);

    if (dx > 4 || dy > 4) {
      hasMovedRef.current = true;
    }

    const now = performance.now();
    const dt = Math.max(1, now - lastMoveRef.current.time);
    const vx = (e.clientX - lastMoveRef.current.x) / dt;
    lastMoveRef.current = { x: e.clientX, time: now, vx };

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;

    if (onSwipePage) {
      if (relX < -45) {
        onSwipePage(-1);
        isScrubbingRef.current = false;
        setIsScrubbing(false);
        return;
      }
      if (relX > containerRect.width + 45) {
        onSwipePage(1);
        isScrubbingRef.current = false;
        setIsScrubbing(false);
        return;
      }
    }

    if (!isScrubbingRef.current) {
      activateScrubbing(getClosestIndex(relX), relX);
    }

    // Desplazamiento 100% fluido y continuo (sin efecto imán 1:1)
    const lateralExpand = variant === "dock" ? 10 : 8;
    const currentUnderIdx = getClosestIndex(relX);
    const currentTabGeo = tabsGeo[currentUnderIdx] || tabsGeo[0];
    const activeWidth = (currentTabGeo ? currentTabGeo.width : 80) + lateralExpand * 2;

    const minX = (tabsGeo[0]?.x ?? 0) - lateralExpand;
    const lastGeo = tabsGeo[tabsGeo.length - 1];
    const maxX = lastGeo ? (lastGeo.x - lateralExpand) : (containerRect.width - activeWidth);

    const rawX = relX - activeWidth / 2;
    const boundedX = Math.max(minX, Math.min(maxX, rawX));

    lensTargetX.set(boundedX);
    lensTargetWidth.set(activeWidth);

    const stretchVelocity = Math.min(0.08, Math.abs(vx) * 0.04);
    lensTargetScaleX.set(1.02 + stretchVelocity);

    // Actualización de color en tiempo real según la posición del centro de la lente
    const lensCenterX = boundedX + activeWidth / 2;
    const activeIdxUnderLens = getClosestIndex(lensCenterX);
    if (activeIdxUnderLens !== previewIndexRef.current) {
      previewIndexRef.current = activeIdxUnderLens;
      setPreviewIndex(activeIdxUnderLens);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const selectedIdx = previewIndexRef.current !== null ? previewIndexRef.current : activeIndex;
    const selectedItem = items[selectedIdx];

    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    pointerStartRef.current = null;

    if (tabsGeo[selectedIdx]) {
      const target = tabsGeo[selectedIdx];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
    }

    if (selectedItem) {
      justCommittedRef.current = true;
      onSelect(selectedItem.id, selectedItem);
      setTimeout(() => {
        justCommittedRef.current = false;
      }, 120);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    pointerStartRef.current = null;

    if (tabsGeo[activeIndex]) {
      const target = tabsGeo[activeIndex];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
    }
  };

  // Clic/Tap directo inmediato sin lag
  const handleDirectItemClick = (e: React.MouseEvent, item: LiquidScrubberItem, idx: number) => {
    if (justCommittedRef.current || hasMovedRef.current) {
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
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
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "none",
        gridTemplateColumns: variant === "dock" ? `repeat(${gridCols}, minmax(0, 1fr))` : undefined,
      }}
    >
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
            top: { type: "spring", stiffness: 450, damping: 30, mass: 0.6 },
            height: { type: "spring", stiffness: 450, damping: 30, mass: 0.6 },
          }}
        >
          {/* ------------------------------------------------------------- */}
          {/* CAPA 1: SEPARADOR GRISÁCEO EN REPOSO (IDÉNTICO A "BIEN HECHO.PNG") */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            animate={{ opacity: isScrubbing ? 0 : 1 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 rounded-full bg-[#d8d8de] dark:bg-[#2c2c2e] border border-white/70 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.7)]"
          />

          {/* ------------------------------------------------------------- */}
          {/* CAPA 2: LIQUID GLASS ORIGINAL (CRISTAL PURO SIN PINTURA NI COLORES) */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            animate={{ opacity: isScrubbing ? 1 : 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 rounded-full pointer-events-none"
          >
            <LiquidGlass
              radius={9999}
              depth={6}
              strength={42}
              chromaticAberration={0}
              blur={2.2}
              className="w-full h-full rounded-full"
              style={{
                /* Casi totalmente transparente: el vidrio solo dobla la luz */
                background: "rgba(255, 255, 255, 0.06)",
                /* Borde exterior: línea de cristal muy fina */
                border: "1.5px solid rgba(255, 255, 255, 0.82)",
                boxShadow: `
                  /* Arco de refracción oscuro — ARRIBA (menisco cóncavo) */
                  inset 0 9px 16px -3px rgba(0, 0, 0, 0.70),
                  /* Arco de refracción oscuro — ABAJO */
                  inset 0 -9px 16px -3px rgba(0, 0, 0, 0.70),
                  /* Arco de refracción oscuro — IZQUIERDA */
                  inset 7px 0 12px -3px rgba(0, 0, 0, 0.45),
                  /* Arco de refracción oscuro — DERECHA */
                  inset -7px 0 12px -3px rgba(0, 0, 0, 0.45),
                  /* Línea especular brillante en la cúpula superior (física del cristal) */
                  inset 0 2px 1px 0 rgba(255, 255, 255, 0.90),
                  /* Sombra exterior de elevación */
                  0 16px 36px -4px rgba(0, 0, 0, 0.26),
                  0 6px 14px -2px rgba(0, 0, 0, 0.14)
                `,
              }}
            >
              {/* Línea especular delgada en el borde superior — como cristal físico */}
              <div className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/85 to-transparent pointer-events-none" />
            </LiquidGlass>
          </motion.div>
        </motion.div>
      )}

      {/* ================================================================= */}
      {/* FILA DE ELEMENTOS / PESTAÑAS (COLOR EN TIEMPO REAL: NEGRO / GRIS) */}
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
              className="relative z-40 w-full h-full flex flex-col items-center justify-center py-0.5 px-1 rounded-full select-none cursor-pointer focus:outline-none"
              style={{ touchAction: "none" }}
            >
              {/* Icono */}
              <div
                className={`relative flex items-center justify-center transition-all duration-100 transform-gpu ${
                  isSpotlight
                    ? "scale-105 -translate-y-0.5"
                    : "scale-100 translate-y-0 opacity-80"
                }`}
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center transition-colors duration-100 ${
                    isSpotlight
                      ? "text-black dark:text-white stroke-[2.6px]"
                      : "text-[#8e8e93] dark:text-[#98989d]"
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
                className={`text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-[95px] px-0.5 text-center transition-colors duration-100 ${
                  isSpotlight
                    ? "text-black dark:text-white font-black"
                    : "text-[#8e8e93] dark:text-[#98989d] font-medium"
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
            className="relative z-40 flex items-center gap-2 px-5 py-2 rounded-full text-sm select-none cursor-pointer focus:outline-none"
            style={{ touchAction: "none" }}
          >
            <div
              className={`transition-all duration-100 transform-gpu ${
                isSpotlight
                  ? "scale-110 text-black dark:text-white stroke-[2.4px]"
                  : "scale-100 text-[#8e8e93] dark:text-[#98989d]"
              }`}
            >
              {item.icon}
            </div>

            <span
              className={`transition-colors duration-100 ${
                isSpotlight
                  ? "text-black dark:text-white font-black"
                  : "text-[#8e8e93] dark:text-[#98989d] font-medium"
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
