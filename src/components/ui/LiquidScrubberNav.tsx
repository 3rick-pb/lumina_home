"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { LiquidGlass } from "@/components/ui/LiquidGlass";

// ============================================================================
// TRACK PATH — Concave dock deformation (Deformes.png reference)
// When dragging, the top border dips DOWN and bottom border dips UP at the lens
// location, creating an organic physical notch like Apple iOS fluid surfaces.
// ============================================================================
function getTrackPath(
  w: number,
  h: number,
  lx: number,
  lw: number,
  pinch: number
): string {
  const r = h / 2; // capsule radius (e.g. 28 when h = 56)

  if (pinch <= 0.05 || w <= 0 || h <= 0) {
    // Plain capsule pill
    return `M ${r},0 L ${w - r},0 A ${r},${r} 0 0,1 ${w},${r} A ${r},${r} 0 0,1 ${w - r},${h} L ${r},${h} A ${r},${r} 0 0,1 0,${r} A ${r},${r} 0 0,1 ${r},0 Z`;
  }

  const p = Math.min(pinch, 5); // subtle inward deformation
  const blend = 14;

  // Horizontal range of the dip centered at the active lens
  const cx = lx + lw / 2;
  const halfW = Math.max(16, lw / 2);
  const x0 = Math.max(r * 0.75, cx - halfW);
  const x1 = Math.min(w - r * 0.75, cx + halfW);

  // ── TOP EDGE (left → right, dips DOWN by p) ──────────────────────────────
  let top = `M ${r},0 `;
  if (x0 - blend > r) {
    top += `L ${x0 - blend},0 `;
    top += `C ${x0},0 ${x0},${p} ${x0 + blend * 0.5},${p} `;
  } else {
    top += `C ${r},0 ${x0},${p} ${x0 + blend * 0.5},${p} `;
  }

  const flatEnd = Math.max(x0 + blend * 0.5, x1 - blend * 0.5);
  top += `L ${flatEnd},${p} `;

  if (x1 + blend < w - r) {
    top += `C ${x1},${p} ${x1},0 ${x1 + blend},0 `;
    top += `L ${w - r},0 `;
  } else {
    top += `C ${x1},${p} ${w - r},0 ${w - r},0 `;
  }

  // ── RIGHT ROUNDED CAP ─────────────────────────────────────────────────────
  const rightCap = `A ${r},${r} 0 0,1 ${w},${r} A ${r},${r} 0 0,1 ${w - r},${h} `;

  // ── BOTTOM EDGE (right → left, dips UP by p) ─────────────────────────────
  let bot = "";
  if (x1 + blend < w - r) {
    bot += `L ${x1 + blend},${h} `;
    bot += `C ${x1},${h} ${x1},${h - p} ${x1 - blend * 0.5},${h - p} `;
  } else {
    bot += `C ${w - r},${h} ${x1},${h - p} ${x1 - blend * 0.5},${h - p} `;
  }

  bot += `L ${x0 + blend * 0.5},${h - p} `;

  if (x0 - blend > r) {
    bot += `C ${x0},${h - p} ${x0},${h} ${x0 - blend},${h} `;
    bot += `L ${r},${h} `;
  } else {
    bot += `C ${x0},${h - p} ${r},${h} ${r},${h} `;
  }

  // ── LEFT ROUNDED CAP (closes path seamlessly at r,0) ─────────────────────
  const leftCap = `A ${r},${r} 0 0,1 0,${r} A ${r},${r} 0 0,1 ${r},0 Z`;

  return top + rightCap + bot + leftCap;
}

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
  activeColor?: string;
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
  const pillRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [tabsGeo, setTabsGeo] = useState<TabGeometry[]>([]);

  // Máquina de estados: Press, Hold & Scrub
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewIndexRef = useRef<number | null>(null);

  // Coordenadas y física de deformación
  const lastXRef = useRef(0);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const hasMovedRef = useRef(false);
  const justCommittedRef = useRef(false);

  // Active index derivado de activeId
  const activeIndex = useMemo(() => {
    const idx = items.findIndex((it) => it.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [items, activeId]);

  // Motion value para el SVG de deformación física
  const motionX = useMotionValue(0);
  const pinchTarget = useMotionValue(0);
  const springPinch = useSpring(pinchTarget, { stiffness: 400, damping: 28, mass: 0.5 });

  // Dimensiones del contenedor (actualizadas en resize)
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(56);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) setContainerWidth(Math.round(rect.width));
      if (rect.height > 0) setContainerHeight(Math.round(rect.height));
    };
    measure();
    const t = setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Medición matemática de tabs
  const measureTabs = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0) return;

    if (variant === "dock" && items.length > 0) {
      const cols = gridCols || items.length;
      const colWidth = containerRect.width / cols;
      const dockGeo: TabGeometry[] = items.map((_, i) => ({
        x: i * colWidth,
        y: 0,
        width: colWidth,
        height: containerRect.height || 56,
      }));
      setTabsGeo(dockGeo);
      return;
    }

    // Para variante pill
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

  // Helper: Encontrar la pestaña más cercana al centro X de la píldora
  const getClosestIndex = useCallback(
    (targetCenterX: number) => {
      if (tabsGeo.length === 0) return 0;
      let closestIdx = 0;
      let minDistance = Infinity;

      tabsGeo.forEach((geo, idx) => {
        const tabCenterX = geo.x + geo.width / 2;
        const dist = Math.abs(targetCenterX - tabCenterX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      return closestIdx;
    },
    [tabsGeo]
  );

  // Dynamic SVG path de deformación física
  const trackPathD = useTransform(() => {
    const lx = motionX.get();
    const lw = tabsGeo[0]?.width || 80;
    const pinch = springPinch.get();
    const w = containerWidth;
    const h = variant === "dock" ? containerHeight : 40;
    if (w <= 0) return "";
    return getTrackPath(w, h, lx, lw, pinch);
  });

  // Dimensiones de la píldora según variante
  const margin = variant === "dock" ? 2 : 0;
  const currentTab = tabsGeo[activeIndex] || tabsGeo[0];
  const pillWidth = currentTab ? Math.max(30, currentTab.width - margin * 2) : 80;
  const pillHeight = variant === "dock" ? 52 : 34;

  // Actualizar posición en reposo cuando cambia activeIndex o tabsGeo
  useEffect(() => {
    if (!isDraggingRef.current && tabsGeo[activeIndex] && pillRef.current) {
      const settleX = tabsGeo[activeIndex].x + margin;
      currentXRef.current = settleX;
      motionX.set(settleX);
      pillRef.current.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      pillRef.current.style.transform = `translate3d(${settleX}px, 0, 0) scale(1, 1)`;
    }
  }, [activeIndex, tabsGeo, variant, margin, motionX]);

  // =========================================================================
  // MÁQUINA DE ESTADOS CON POINTER EVENTS (Press, Hold & Scrub)
  // =========================================================================

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tabsGeo.length === 0 || !containerRef.current) return;

    // a) Captura del puntero para no perder el rastro aunque el dedo salga verticalmente
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    // b) Activar estado isDragging
    isDraggingRef.current = true;
    setIsDragging(true);

    lastXRef.current = e.clientX;
    startXRef.current = e.clientX;
    hasMovedRef.current = false;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;
    const initialIdx = getClosestIndex(relX);
    previewIndexRef.current = initialIdx;
    setPreviewIndex(initialIdx);

    // c) Desactivar transición CSS para respuesta 1:1 inmediata y aplicar expansión líquida inicial scale(1.12)
    if (pillRef.current && tabsGeo[initialIdx]) {
      const minX = tabsGeo[0].x + margin;
      const maxX = tabsGeo[tabsGeo.length - 1].x + margin;
      const targetX = relX - pillWidth / 2;
      const clampedX = Math.max(minX, Math.min(maxX, targetX));

      currentXRef.current = clampedX;
      motionX.set(clampedX);

      pillRef.current.style.transition = "none";
      pillRef.current.style.transform = `translate3d(${clampedX}px, 0, 0) scale(1.12, 1.12)`;
    }

    // Activar sutil deformación cóncava en bordes
    pinchTarget.set(3.5);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current || tabsGeo.length === 0) return;

    const dx = Math.abs(e.clientX - startXRef.current);
    if (dx > 3) {
      hasMovedRef.current = true;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;

    // Swipe de página lateral si sobrepasa los márgenes
    if (onSwipePage) {
      if (relX < -50) {
        onSwipePage(-1);
        isDraggingRef.current = false;
        setIsDragging(false);
        pinchTarget.set(0);
        return;
      }
      if (relX > containerRect.width + 50) {
        onSwipePage(1);
        isDraggingRef.current = false;
        setIsDragging(false);
        pinchTarget.set(0);
        return;
      }
    }

    // a) Calcular nueva posición X centrada en e.clientX relativa al contenedor,
    // clamped entre el borde izquierdo del primer ítem y el borde derecho del último ítem
    const minX = tabsGeo[0].x + margin;
    const maxX = tabsGeo[tabsGeo.length - 1].x + margin;
    const targetX = relX - pillWidth / 2;
    const clampedX = Math.max(minX, Math.min(maxX, targetX));

    currentXRef.current = clampedX;
    motionX.set(clampedX);

    // b) Calcular velocidad horizontal y deformación elástica:
    // Estirar scaleX (hasta 1.25 max) y comprimir scaleY (hasta 0.90 min) según Math.abs(deltaX)
    const deltaX = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;

    const speed = Math.min(1, Math.abs(deltaX) / 18);
    const scaleX = 1.12 + speed * (1.25 - 1.12);
    const scaleY = 1.0 - speed * (1.0 - 0.90);

    // Movimiento 1:1 a 60fps/120fps sin lag
    if (pillRef.current) {
      pillRef.current.style.transition = "none";
      pillRef.current.style.transform = `translate3d(${clampedX}px, 0, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
    }

    // c) Detectar en tiempo real qué ítem está debajo del centro de la píldora para iluminar su ícono
    const pillCenterX = clampedX + pillWidth / 2;
    const closestIdx = getClosestIndex(pillCenterX);
    if (closestIdx !== previewIndexRef.current) {
      previewIndexRef.current = closestIdx;
      setPreviewIndex(closestIdx);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // a) Liberar pointer capture y poner isDragging = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    pinchTarget.set(0);

    const containerRect = containerRef.current?.getBoundingClientRect();

    // b) Calcular cuál es el ítem cuyo centro está más cerca
    let selectedIdx = previewIndexRef.current !== null ? previewIndexRef.current : activeIndex;
    if (containerRect) {
      const relX = e.clientX - containerRect.left;
      selectedIdx = getClosestIndex(relX);
    }

    const selectedItem = items[selectedIdx];

    // c) Reactivar transición CSS con resorte: transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    // devolver escala a scale(1, 1) y posicionar la píldora en el centro del ítem seleccionado
    if (pillRef.current && tabsGeo[selectedIdx]) {
      const settleX = tabsGeo[selectedIdx].x + margin;
      currentXRef.current = settleX;
      motionX.set(settleX);

      pillRef.current.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      pillRef.current.style.transform = `translate3d(${settleX}px, 0, 0) scale(1, 1)`;
    }

    setPreviewIndex(null);
    previewIndexRef.current = null;

    // Disparar cambio de pestaña
    if (selectedItem) {
      justCommittedRef.current = true;
      onSelect(selectedItem.id, selectedItem);
      setTimeout(() => {
        justCommittedRef.current = false;
      }, 150);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    isDraggingRef.current = false;
    setIsDragging(false);
    pinchTarget.set(0);

    setPreviewIndex(null);
    previewIndexRef.current = null;

    if (pillRef.current && tabsGeo[activeIndex]) {
      const settleX = tabsGeo[activeIndex].x + margin;
      currentXRef.current = settleX;
      motionX.set(settleX);

      pillRef.current.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      pillRef.current.style.transform = `translate3d(${settleX}px, 0, 0) scale(1, 1)`;
    }
  };

  // Clic/Tap directo inmediato
  const handleDirectItemClick = (e: React.MouseEvent, item: LiquidScrubberItem, idx: number) => {
    if (justCommittedRef.current || hasMovedRef.current) {
      e.preventDefault();
      return;
    }

    if (pillRef.current && tabsGeo[idx]) {
      const settleX = tabsGeo[idx].x + margin;
      currentXRef.current = settleX;
      motionX.set(settleX);

      pillRef.current.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      pillRef.current.style.transform = `translate3d(${settleX}px, 0, 0) scale(1, 1)`;
    }
    onSelect(item.id, item);
  };

  const initialX = tabsGeo[activeIndex] ? tabsGeo[activeIndex].x + margin : 0;
  const hasValidGeometry = tabsGeo.length > 0;

  return (
    // 2. BLOQUEO DE GESTOS NATIVOS (CSS): touch-action: none, user-select: none, -webkit-user-select: none
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
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "none",
        gridTemplateColumns: variant === "dock" ? `repeat(${gridCols}, minmax(0, 1fr))` : undefined,
      }}
    >
      {/* ================================================================= */}
      {/* BORDE DINÁMICO DEFORMABLE SVG: Deformación física Apple           */}
      {/* ================================================================= */}
      {variant === "dock" && containerWidth > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible w-full h-full"
          style={{ zIndex: 1 }}
          width={containerWidth}
          height={containerHeight}
          viewBox={`0 0 ${containerWidth} ${containerHeight}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d={trackPathD}
            fill="none"
            stroke="rgba(255, 255, 255, 0.85)"
            className="dark:stroke-white/20"
            strokeWidth="1.2"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))" }}
          />
        </svg>
      )}

      {/* ================================================================= */}
      {/* 1. ESTRUCTURA DE CAPAS:                                           */}
      {/* Píldora flotante de Liquid Glass (.liquid-pill): elemento absoluto */}
      {/* independiente posicionado con transform: translate3d(x, 0, 0)     */}
      {/* ================================================================= */}
      {hasValidGeometry && (
        <div
          ref={pillRef}
          className="liquid-pill absolute pointer-events-none will-change-transform"
          style={{
            zIndex: 1,
            top: variant === "dock" ? 2 : 3,
            left: 0,
            width: pillWidth,
            height: pillHeight,
            transformOrigin: "center center",
            transform: `translate3d(${initialX}px, 0, 0) scale(1, 1)`,
            transition: isDragging ? "none" : "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Capa en reposo: indicador concéntrico sutil */}
          <div
            className={`absolute inset-0 rounded-full transition-opacity duration-150 ${
              isDragging ? "opacity-0" : "opacity-100"
            } bg-[#d8d8de] dark:bg-[#2c2c2e] border border-white/70 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.7)]`}
          />

          {/* Capa activa: Liquid Glass auténtico (filtro SVG displacement map + refracción óptica) */}
          <div
            className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-150 ${
              isDragging ? "opacity-100" : "opacity-0"
            }`}
          >
            <LiquidGlass
              radius={9999}
              depth={8}
              strength={36}
              chromaticAberration={0}
              blur={1.5}
              overflow="visible"
              className="w-full h-full rounded-full flex items-center justify-center relative pointer-events-none bg-white/45 dark:bg-white/15 border border-white/95 dark:border-white/30"
              style={{
                boxShadow: `
                  inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.98),
                  inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.65),
                  inset 1.5px 0 2px 0 rgba(255, 255, 255, 0.55),
                  inset -1.5px 0 2px 0 rgba(255, 255, 255, 0.55),
                  0 12px 28px -4px rgba(0, 0, 0, 0.18),
                  0 4px 10px -2px rgba(0, 0, 0, 0.10)
                `,
              }}
            >
              {/* Reflejo especular curvado superior fino */}
              <div className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/95 to-transparent pointer-events-none" />
            </LiquidGlass>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. ESTRUCTURA DE CAPAS:                                           */}
      {/* Botones/íconos del menú con position: relative y z-index: 2       */}
      {/* ================================================================= */}
      {items.map((item, idx) => {
        const isSpotlight = idx === (previewIndex !== null ? previewIndex : activeIndex);

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
              className="relative z-[2] w-full h-full flex flex-col items-center justify-center py-0.5 px-1 rounded-full select-none cursor-pointer focus:outline-none"
              style={{
                position: "relative",
                zIndex: 2,
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {/* Icono iluminado en tiempo real al pasar la píldora */}
              <div
                className={`relative flex items-center justify-center transition-all duration-150 transform-gpu ${
                  isSpotlight
                    ? "scale-105 -translate-y-0.5"
                    : "scale-100 translate-y-0 opacity-80"
                }`}
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center transition-colors duration-150 ${
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

              {/* Etiqueta con realce dinámico */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-[95px] px-0.5 text-center transition-colors duration-150 ${
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

        // Horizontal pill for Header
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
            className="relative z-[2] flex items-center gap-2 px-5 py-2 rounded-full text-sm select-none cursor-pointer focus:outline-none"
            style={{
              position: "relative",
              zIndex: 2,
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            <div
              className={`transition-all duration-150 transform-gpu ${
                isSpotlight
                  ? "scale-110 text-black dark:text-white stroke-[2.4px]"
                  : "scale-100 text-[#8e8e93] dark:text-[#98989d]"
              }`}
            >
              {item.icon}
            </div>

            <span
              className={`transition-colors duration-150 ${
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
