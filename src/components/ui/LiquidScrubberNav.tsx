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
  const r = h / 2;

  if (pinch <= 0.05 || w <= 0 || h <= 0) {
    return `M ${r},0 L ${w - r},0 A ${r},${r} 0 0,1 ${w},${r} A ${r},${r} 0 0,1 ${w - r},${h} L ${r},${h} A ${r},${r} 0 0,1 0,${r} A ${r},${r} 0 0,1 ${r},0 Z`;
  }

  const p = Math.min(pinch, 5);
  const blend = 14;
  const cx = lx + lw / 2;
  const halfW = Math.max(16, lw / 2);
  const x0 = Math.max(r * 0.75, cx - halfW);
  const x1 = Math.min(w - r * 0.75, cx + halfW);

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
    top += `C ${x1},${p} ${x1},0 ${x1 + blend},0 L ${w - r},0 `;
  } else {
    top += `C ${x1},${p} ${w - r},0 ${w - r},0 `;
  }

  const rightCap = `A ${r},${r} 0 0,1 ${w},${r} A ${r},${r} 0 0,1 ${w - r},${h} `;

  let bot = "";
  if (x1 + blend < w - r) {
    bot += `L ${x1 + blend},${h} C ${x1},${h} ${x1},${h - p} ${x1 - blend * 0.5},${h - p} `;
  } else {
    bot += `C ${w - r},${h} ${x1},${h - p} ${x1 - blend * 0.5},${h - p} `;
  }
  bot += `L ${x0 + blend * 0.5},${h - p} `;
  if (x0 - blend > r) {
    bot += `C ${x0},${h - p} ${x0},${h} ${x0 - blend},${h} L ${r},${h} `;
  } else {
    bot += `C ${x0},${h - p} ${r},${h} ${r},${h} `;
  }

  const leftCap = `A ${r},${r} 0 0,1 0,${r} A ${r},${r} 0 0,1 ${r},0 Z`;
  return top + rightCap + bot + leftCap;
}

// ============================================================================
// Types
// ============================================================================
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

// ============================================================================
// Component
// ============================================================================
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
  // pillRef apunta al div exterior de la píldora — controlamos su transform SIEMPRE via ref, nunca via React state
  const pillRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [tabsGeo, setTabsGeo] = useState<TabGeometry[]>([]);

  // ── Máquina de estados ────────────────────────────────────────────────────
  // isDragging como ref (imperativo) + state (para re-render del material)
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // previewIndex: qué tab se ilumina durante el scrub (NO cambia activeTab)
  const previewIndexRef = useRef<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // ── dragX: posición continua en px del dedo — SEPARADA de activeTab ───────
  // Es el único valor que mueve la píldora durante el drag.
  const dragXRef = useRef(0);      // valor imperativo (0-lag updates)
  const lastClientXRef = useRef(0); // para calcular deltaX por frame

  const hasMovedRef = useRef(false);
  const justCommittedRef = useRef(false);

  // ── activeIndex derivado de activeId ─────────────────────────────────────
  const activeIndex = useMemo(() => {
    const idx = items.findIndex((it) => it.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [items, activeId]);

  // ── Motion values para el SVG de deformación del borde ───────────────────
  // motionX alimenta getTrackPath vía useTransform (solo el SVG, no la píldora)
  const motionX = useMotionValue(0);
  const pinchTarget = useMotionValue(0);
  const springPinch = useSpring(pinchTarget, { stiffness: 400, damping: 28, mass: 0.5 });

  // ── Dimensiones del contenedor ────────────────────────────────────────────
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
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, []);

  // ── Medición de la geometría de las pestañas ──────────────────────────────
  const measureTabs = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0) return;

    if (variant === "dock" && items.length > 0) {
      const cols = gridCols || items.length;
      const colWidth = containerRect.width / cols;
      setTabsGeo(items.map((_, i) => ({
        x: i * colWidth,
        y: 0,
        width: colWidth,
        height: containerRect.height || 56,
      })));
      return;
    }

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
    if (newGeo.length === items.length) setTabsGeo(newGeo);
  }, [items, variant, gridCols]);

  useEffect(() => {
    measureTabs();
    window.addEventListener("resize", measureTabs);
    const t1 = setTimeout(measureTabs, 50);
    const t2 = setTimeout(measureTabs, 150);
    return () => { window.removeEventListener("resize", measureTabs); clearTimeout(t1); clearTimeout(t2); };
  }, [measureTabs]);

  // ── Helper: tab más cercano al centro X dado ──────────────────────────────
  const getClosestIndex = useCallback((centerX: number) => {
    if (tabsGeo.length === 0) return 0;
    let closestIdx = 0;
    let minDist = Infinity;
    tabsGeo.forEach((geo, idx) => {
      const dist = Math.abs((geo.x + geo.width / 2) - centerX);
      if (dist < minDist) { minDist = dist; closestIdx = idx; }
    });
    return closestIdx;
  }, [tabsGeo]);

  // ── SVG path de deformación (solo borde, no la píldora) ──────────────────
  const trackPathD = useTransform(() => {
    const lx = motionX.get();
    const lw = tabsGeo[0]?.width || 80;
    const pinch = springPinch.get();
    const w = containerWidth;
    const h = variant === "dock" ? containerHeight : 40;
    if (w <= 0) return "";
    return getTrackPath(w, h, lx, lw, pinch);
  });

  // ── Dimensiones de la píldora ─────────────────────────────────────────────
  const margin = variant === "dock" ? 2 : 0;
  const pillSlotWidth = tabsGeo[0]?.width ?? 80;
  const pillWidth = Math.max(30, pillSlotWidth - margin * 2);
  const pillHeight = variant === "dock" ? 52 : 34;

  // ── Función imperativa para mover la píldora directamente via ref ─────────
  // Esto nunca pasa por React render → cero lag.
  const movePillTo = useCallback((x: number, scaleX: number, scaleY: number, withTransition: boolean) => {
    const pill = pillRef.current;
    if (!pill) return;
    pill.style.transition = withTransition
      ? "transform 0.45s cubic-bezier(0.22, 1.35, 0.36, 1)"
      : "none";
    pill.style.transform = `translate3d(${x}px, 0, 0) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
  }, []);

  // ── Cuando cambia activeIndex o tabsGeo (y NO estamos arrastrando), snap ──
  useEffect(() => {
    if (isDraggingRef.current) return;
    if (!tabsGeo[activeIndex]) return;
    const settleX = tabsGeo[activeIndex].x + margin;
    dragXRef.current = settleX;
    motionX.set(settleX);
    movePillTo(settleX, 1, 1, true);
  }, [activeIndex, tabsGeo, margin, motionX, movePillTo]);

  // ── Límites de arrastre ───────────────────────────────────────────────────
  const clampDragX = useCallback((rawX: number): number => {
    if (tabsGeo.length === 0) return rawX;
    const minX = tabsGeo[0].x + margin;
    const maxX = tabsGeo[tabsGeo.length - 1].x + margin;
    return Math.max(minX, Math.min(maxX, rawX));
  }, [tabsGeo, margin]);

  // =========================================================================
  // MÁQUINA DE ESTADOS POINTER EVENTS — Press, Hold & Scrub
  // =========================================================================

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tabsGeo.length === 0 || !containerRef.current) return;

    // 3. CAPTURA DE PUNTERO — nunca pierde el dedo aunque salga verticalmente
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}

    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    lastClientXRef.current = e.clientX;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;

    // dragX inicial = dedo centrado en la píldora (no salta al tab index)
    const rawX = relX - pillWidth / 2;
    const clampedX = clampDragX(rawX);
    dragXRef.current = clampedX;
    motionX.set(clampedX);

    // Quitar transición — respuesta 1:1 inmediata + expansión inicial scale(1.12)
    movePillTo(clampedX, 1.12, 1.12, false);

    // Iluminar tab más cercano al centro de la píldora
    const pillCenterX = clampedX + pillWidth / 2;
    const closestIdx = getClosestIndex(pillCenterX);
    previewIndexRef.current = closestIdx;
    setPreviewIndex(closestIdx);

    // Activar deformación cóncava del borde
    pinchTarget.set(3.5);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current || tabsGeo.length === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;

    // Swipe de página si sale mucho por los laterales
    if (onSwipePage) {
      if (relX < -50) { onSwipePage(-1); isDraggingRef.current = false; setIsDragging(false); pinchTarget.set(0); return; }
      if (relX > containerRect.width + 50) { onSwipePage(1); isDraggingRef.current = false; setIsDragging(false); pinchTarget.set(0); return; }
    }

    hasMovedRef.current = Math.abs(e.clientX - lastClientXRef.current) > 2;

    // 1. POSICIÓN VISUAL CONTINUA — píxel a píxel, SIN snap por index
    const rawX = relX - pillWidth / 2;
    const clampedX = clampDragX(rawX);
    dragXRef.current = clampedX;
    motionX.set(clampedX); // alimenta el SVG de deformación

    // 2. DEFORMACIÓN ELÁSTICA — velocidad → scaleX ↑ scaleY ↓
    const deltaX = e.clientX - lastClientXRef.current;
    lastClientXRef.current = e.clientX;
    const speed = Math.min(1, Math.abs(deltaX) / 18);
    const scaleX = 1.12 + speed * (1.25 - 1.12); // 1.12 → 1.25
    const scaleY = 1.0  - speed * (1.0  - 0.90); // 1.00 → 0.90

    // Mover píldora directamente via ref — transition: none → 60/120fps sin lag
    movePillTo(clampedX, scaleX, scaleY, false);

    // Detectar tab bajo el centro de la píldora para iluminar el ícono
    const pillCenterX = clampedX + pillWidth / 2;
    const closestIdx = getClosestIndex(pillCenterX);
    if (closestIdx !== previewIndexRef.current) {
      previewIndexRef.current = closestIdx;
      setPreviewIndex(closestIdx);
    }
  };

  const commitDrop = useCallback((clientX: number) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    pinchTarget.set(0);

    // Calcular tab más cercano al centro actual de la píldora
    const pillCenterX = dragXRef.current + pillWidth / 2;
    // También considerar el punto exacto donde soltó el dedo
    const containerRect = containerRef.current?.getBoundingClientRect();
    const fingerX = containerRect ? clientX - containerRect.left : pillCenterX;
    const selectedIdx = getClosestIndex(fingerX);
    const selectedItem = items[selectedIdx];

    // Snap con resorte hacia el centro exacto del tab seleccionado
    if (tabsGeo[selectedIdx]) {
      const settleX = tabsGeo[selectedIdx].x + margin;
      dragXRef.current = settleX;
      motionX.set(settleX);
      movePillTo(settleX, 1, 1, true); // transición de resorte reactivada
    }

    setPreviewIndex(null);
    previewIndexRef.current = null;

    if (selectedItem) {
      justCommittedRef.current = true;
      onSelect(selectedItem.id, selectedItem);
      setTimeout(() => { justCommittedRef.current = false; }, 150);
    }
  }, [tabsGeo, margin, pillWidth, motionX, movePillTo, getClosestIndex, items, onSelect]);

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if (!isDraggingRef.current) return;
    commitDrop(e.clientX);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if (!isDraggingRef.current) return;
    // Cancelar: volver al tab activo actual
    isDraggingRef.current = false;
    setIsDragging(false);
    pinchTarget.set(0);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    if (tabsGeo[activeIndex]) {
      const settleX = tabsGeo[activeIndex].x + margin;
      dragXRef.current = settleX;
      motionX.set(settleX);
      movePillTo(settleX, 1, 1, true);
    }
  };

  // Tap directo sin arrastre
  const handleDirectItemClick = (e: React.MouseEvent, item: LiquidScrubberItem, idx: number) => {
    if (justCommittedRef.current || hasMovedRef.current) { e.preventDefault(); return; }
    if (tabsGeo[idx]) {
      const settleX = tabsGeo[idx].x + margin;
      dragXRef.current = settleX;
      motionX.set(settleX);
      movePillTo(settleX, 1, 1, true);
    }
    onSelect(item.id, item);
  };

  const hasValidGeometry = tabsGeo.length > 0;
  const spotlightIndex = previewIndex !== null ? previewIndex : activeIndex;
  // Posición inicial de la píldora (solo para el primer render, luego todo es imperativo)
  const initialX = tabsGeo[activeIndex]?.x != null ? tabsGeo[activeIndex].x + margin : -9999;

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
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        // 3. CAPTURA DE PUNTERO — touch-action: none bloquea scroll nativo
        touchAction: "none",
        gridTemplateColumns: variant === "dock" ? `repeat(${gridCols}, minmax(0, 1fr))` : undefined,
      }}
    >
      {/* ================================================================= */}
      {/* SVG BORDE DINÁMICO DEFORMABLE — Alimentado por motionX (no la píldora) */}
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
      {/* PÍLDORA FLOTANTE — .liquid-pill                                    */}
      {/* Clave: NO tiene style.transform controlado por React state.        */}
      {/* Su transform es 100% imperativo via pillRef.current.style          */}
      {/* → jamás pelea con el re-render de React durante el drag.          */}
      {/* ================================================================= */}
      {hasValidGeometry && (
        <div
          ref={pillRef}
          className="liquid-pill absolute pointer-events-none will-change-transform"
          style={{
            // left: 0 siempre — el desplazamiento horizontal lo hace translate3d
            zIndex: 1,
            top: variant === "dock" ? 2 : 3,
            left: 0,
            width: pillWidth,
            height: pillHeight,
            transformOrigin: "center center",
            // Posición inicial solo para el primer mount — después es imperativo
            transform: `translate3d(${initialX}px, 0, 0) scale(1, 1)`,
            transition: "transform 0.45s cubic-bezier(0.22, 1.35, 0.36, 1)",
            // NO hay ningún state de React controlando transform aquí
          }}
        >
          {/* ── Capa en reposo: píldora grisácea concéntrica ──────────────── */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              opacity: isDragging ? 0 : 1,
              transition: "opacity 0.12s",
              border: "1px solid rgba(255,255,255,0.70)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.7)",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-[#d8d8de] dark:bg-[#2c2c2e]" />
          </div>

          {/* ── Capa activa: Liquid Glass auténtico ──────────────────────── */}
          {/* 2. MATERIAL LIQUID GLASS CORRECTO                               */}
          {/* • background: rgba(255,255,255,0.18) — ultra translúcido        */}
          {/* • box-shadow con reflejos especulares internos                  */}
          {/* • backdrop-filter: url(#filter) blur(4px) saturate(180%)        */}
          {/* • overflow: hidden + border-radius: 9999px — sin artefactos     */}
          {/* • Al arrastrar: blur(1px) para efecto lupa/refracción           */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
            style={{
              opacity: isDragging ? 1 : 0,
              transition: "opacity 0.12s",
            }}
          >
            <LiquidGlass
              radius={9999}
              depth={8}
              strength={36}
              chromaticAberration={0}
              // 2. Reducir blur a 1px durante drag para efecto lupa/refracción activo
              blur={isDragging ? 1 : 1.5}
              overflow="hidden"
              className="w-full h-full rounded-full pointer-events-none"
              style={{
                // 2. Fondo ultra translúcido — no blanco sólido
                background: "rgba(255, 255, 255, 0.18)",
                borderRadius: "9999px",
                // 2. Reflejos especulares internos exactos solicitados
                boxShadow: `
                  inset 0 1.5px 2px rgba(255, 255, 255, 0.85),
                  inset 0 -1.5px 2px rgba(255, 255, 255, 0.35),
                  0 6px 20px rgba(0, 0, 0, 0.12)
                `,
                // border fino para el contorno del cristal
                border: "1px solid rgba(255, 255, 255, 0.65)",
              }}
            >
              {/* Reflejo especular curvado superior (highlight de cristal) */}
              <div
                className="absolute inset-x-2 top-0 h-[1.5px] rounded-full pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.90), transparent)" }}
              />
              {/* Reflejo inferior sutil */}
              <div
                className="absolute inset-x-4 bottom-0 h-[1px] rounded-full pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)" }}
              />
            </LiquidGlass>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ITEMS DEL MENÚ — position: relative, z-index: 2                  */}
      {/* Siempre visibles — el cristal pasa POR DETRÁS, nunca los oculta  */}
      {/* ================================================================= */}
      {items.map((item, idx) => {
        const isSpotlight = idx === spotlightIndex;

        if (variant === "dock") {
          return (
            <div
              key={item.id}
              ref={(el) => { tabRefs.current[idx] = el; }}
              role="tab"
              aria-selected={isSpotlight}
              draggable={false}
              onClick={(e) => handleDirectItemClick(e, item, idx)}
              style={{ position: "relative", zIndex: 2, touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
              className="w-full h-full flex flex-col items-center justify-center py-0.5 px-1 rounded-full select-none cursor-pointer focus:outline-none"
            >
              <div
                className={`relative flex items-center justify-center transition-all duration-150 transform-gpu ${
                  isSpotlight ? "scale-105 -translate-y-0.5" : "scale-100 translate-y-0 opacity-80"
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

                {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-black bg-[#fa2d48] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#16161a] shadow-xs">
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </span>
                )}
              </div>

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

        // Variante horizontal (Header pill)
        return (
          <div
            key={item.id}
            ref={(el) => { tabRefs.current[idx] = el; }}
            role="tab"
            aria-selected={isSpotlight}
            draggable={false}
            onClick={(e) => handleDirectItemClick(e, item, idx)}
            style={{ position: "relative", zIndex: 2, touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm select-none cursor-pointer focus:outline-none"
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

      {/* Slots vacíos para dock simétrico */}
      {variant === "dock" &&
        Array.from({ length: Math.max(0, gridCols - items.length) }).map((_, i) => (
          <div key={`empty-slot-${i}`} className="w-full h-full pointer-events-none" aria-hidden="true" />
        ))}
    </div>
  );
}
