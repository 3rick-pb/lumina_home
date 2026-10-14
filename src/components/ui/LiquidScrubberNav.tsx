"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

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
// Component: LiquidScrubberNav
// ============================================================================
export function LiquidScrubberNav({
  items,
  activeId,
  onSelect,
  variant = "pill",
  className = "",
  activeColor = "text-black dark:text-white",
  gridCols = 3,
  onSwipePage,
}: LiquidScrubberNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [tabsGeo, setTabsGeo] = useState<TabGeometry[]>([]);

  // ── Máquina de estados ────────────────────────────────────────────────────
  const isDraggingRef = useRef(false);
  const [, setIsDragging] = useState(false);

  // previewIndex: qué tab se ilumina durante el scrub (NO cambia activeTab)
  const previewIndexRef = useRef<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // ── dragX: posición continua en px del dedo — SEPARADA de activeTab ───────
  const dragXRef = useRef(0);
  const lastClientXRef = useRef(0);

  const hasMovedRef = useRef(false);
  const justCommittedRef = useRef(false);

  // ── activeIndex derivado de activeId ─────────────────────────────────────
  const activeIndex = useMemo(() => {
    const idx = items.findIndex((it) => it.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [items, activeId]);

  // ── Dimensiones de la píldora ─────────────────────────────────────────────
  const margin = variant === "dock" ? 2 : 0;
  const pillSlotWidth = tabsGeo[0]?.width ?? 80;
  const pillWidth = Math.max(30, pillSlotWidth - margin * 2);
  const pillHeight = variant === "dock" ? 52 : 34;

  // ── Medición de la geometría de las pestañas ──────────────────────────────
  const measureTabs = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0) return;

    if (variant === "dock" && items.length > 0) {
      const cols = gridCols || items.length;
      const colWidth = containerRect.width / cols;
      setTabsGeo(
        items.map((_, i) => ({
          x: i * colWidth,
          y: 0,
          width: colWidth,
          height: containerRect.height || 56,
        }))
      );
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
    return () => {
      window.removeEventListener("resize", measureTabs);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measureTabs]);

  // ── Helper: tab más cercano al centro X dado ──────────────────────────────
  const getClosestIndex = useCallback(
    (centerX: number) => {
      if (tabsGeo.length === 0) return 0;
      let closestIdx = 0;
      let minDist = Infinity;
      tabsGeo.forEach((geo, idx) => {
        const dist = Math.abs(geo.x + geo.width / 2 - centerX);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = idx;
        }
      });
      return closestIdx;
    },
    [tabsGeo]
  );

  // ── Función imperativa para mover la píldora directamente via ref ─────────
  // Cero lag — jamás pasa por React re-render durante el drag
  const movePillTo = useCallback(
    (x: number, scaleX: number, scaleY: number, withTransition: boolean) => {
      const pill = pillRef.current;
      if (!pill) return;
      pill.style.transition = withTransition
        ? "transform 0.45s cubic-bezier(0.22, 1.35, 0.36, 1)"
        : "none";
      pill.style.transform = `translate3d(${x}px, 0, 0) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
    },
    []
  );

  // ── Snap en reposo cuando cambia activeIndex o tabsGeo ────────────────────
  useEffect(() => {
    if (isDraggingRef.current) return;
    if (!tabsGeo[activeIndex]) return;
    const settleX = tabsGeo[activeIndex].x + margin;
    dragXRef.current = settleX;
    movePillTo(settleX, 1, 1, true);
  }, [activeIndex, tabsGeo, margin, movePillTo]);

  // ── Límites de arrastre ───────────────────────────────────────────────────
  const clampDragX = useCallback(
    (rawX: number): number => {
      if (tabsGeo.length === 0) return rawX;
      const minX = tabsGeo[0].x + margin;
      const maxX = tabsGeo[tabsGeo.length - 1].x + margin;
      return Math.max(minX, Math.min(maxX, rawX));
    },
    [tabsGeo, margin]
  );

  // =========================================================================
  // MÁQUINA DE ESTADOS POINTER EVENTS — Press, Hold & Scrub
  // =========================================================================

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tabsGeo.length === 0 || !containerRef.current) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    lastClientXRef.current = e.clientX;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;

    // dragX continuo centrado en el dedo
    const rawX = relX - pillWidth / 2;
    const clampedX = clampDragX(rawX);
    dragXRef.current = clampedX;

    // Respuesta 1:1 inmediata sin lag + leve expansión líquida controlada (1.08)
    movePillTo(clampedX, 1.08, 1.08, false);

    // Iluminar tab más cercano al centro de la píldora
    const pillCenterX = clampedX + pillWidth / 2;
    const closestIdx = getClosestIndex(pillCenterX);
    previewIndexRef.current = closestIdx;
    setPreviewIndex(closestIdx);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current || tabsGeo.length === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;

    // Swipe de página si sale por los extremos
    if (onSwipePage) {
      if (relX < -50) {
        onSwipePage(-1);
        isDraggingRef.current = false;
        setIsDragging(false);
        return;
      }
      if (relX > containerRect.width + 50) {
        onSwipePage(1);
        isDraggingRef.current = false;
        setIsDragging(false);
        return;
      }
    }

    hasMovedRef.current = Math.abs(e.clientX - lastClientXRef.current) > 2;

    // Posición continua en px — sigue el dedo píxel a píxel
    const rawX = relX - pillWidth / 2;
    const clampedX = clampDragX(rawX);
    dragXRef.current = clampedX;

    // Deformación elástica orgánica muy sutil y contenida (max 1.14 / min 0.96)
    const deltaX = e.clientX - lastClientXRef.current;
    lastClientXRef.current = e.clientX;
    const speed = Math.min(1, Math.abs(deltaX) / 20);
    const scaleX = 1.08 + speed * (1.14 - 1.08);
    const scaleY = 1.00 - speed * (1.00 - 0.96);

    movePillTo(clampedX, scaleX, scaleY, false);

    // Detectar tab bajo el centro de la píldora para iluminar su ícono
    const pillCenterX = clampedX + pillWidth / 2;
    const closestIdx = getClosestIndex(pillCenterX);
    if (closestIdx !== previewIndexRef.current) {
      previewIndexRef.current = closestIdx;
      setPreviewIndex(closestIdx);
    }
  };

  const commitDrop = useCallback(
    (clientX: number) => {
      isDraggingRef.current = false;
      setIsDragging(false);

      const pillCenterX = dragXRef.current + pillWidth / 2;
      const containerRect = containerRef.current?.getBoundingClientRect();
      const fingerX = containerRect ? clientX - containerRect.left : pillCenterX;
      const selectedIdx = getClosestIndex(fingerX);
      const selectedItem = items[selectedIdx];

      // Snap con resorte físico suave al centro exacto del tab seleccionado
      if (tabsGeo[selectedIdx]) {
        const settleX = tabsGeo[selectedIdx].x + margin;
        dragXRef.current = settleX;
        movePillTo(settleX, 1, 1, true);
      }

      setPreviewIndex(null);
      previewIndexRef.current = null;

      if (selectedItem) {
        justCommittedRef.current = true;
        onSelect(selectedItem.id, selectedItem);
        setTimeout(() => {
          justCommittedRef.current = false;
        }, 150);
      }
    },
    [tabsGeo, margin, pillWidth, movePillTo, getClosestIndex, items, onSelect]
  );

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!isDraggingRef.current) return;
    commitDrop(e.clientX);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    if (tabsGeo[activeIndex]) {
      const settleX = tabsGeo[activeIndex].x + margin;
      dragXRef.current = settleX;
      movePillTo(settleX, 1, 1, true);
    }
  };

  // Click directo
  const handleDirectItemClick = (
    e: React.MouseEvent,
    item: LiquidScrubberItem,
    idx: number
  ) => {
    if (justCommittedRef.current || hasMovedRef.current) {
      e.preventDefault();
      return;
    }
    if (tabsGeo[idx]) {
      const settleX = tabsGeo[idx].x + margin;
      dragXRef.current = settleX;
      movePillTo(settleX, 1, 1, true);
    }
    onSelect(item.id, item);
  };

  const hasValidGeometry = tabsGeo.length > 0;
  const spotlightIndex = previewIndex !== null ? previewIndex : activeIndex;
  const initialX =
    tabsGeo[activeIndex]?.x != null ? tabsGeo[activeIndex].x + margin : -9999;

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
        touchAction: "none",
        gridTemplateColumns:
          variant === "dock" ? `repeat(${gridCols}, minmax(0, 1fr))` : undefined,
      }}
    >
      {/* ================================================================= */}
      {/* PÍLDORA FLOTANTE LIQUID GLASS (.liquid-pill)                       */}
      {/* Cristal translúcido continuo — nunca blanco sólido ni gris opaco   */}
      {/* ================================================================= */}
      {hasValidGeometry && (
        <div
          ref={pillRef}
          className="liquid-pill absolute pointer-events-none will-change-transform rounded-full overflow-hidden"
          style={{
            zIndex: 1,
            top: variant === "dock" ? 2 : 3,
            left: 0,
            width: pillWidth,
            height: pillHeight,
            transformOrigin: "center center",
            transform: `translate3d(${initialX}px, 0, 0) scale(1, 1)`,
            transition: "transform 0.45s cubic-bezier(0.22, 1.35, 0.36, 1)",
            background: "rgba(255, 255, 255, 0.28)",
            backdropFilter: "blur(10px) saturate(190%) brightness(1.10)",
            WebkitBackdropFilter: "blur(10px) saturate(190%) brightness(1.10)",
            border: "1px solid rgba(255, 255, 255, 0.65)",
            boxShadow: `
              inset 0 1.5px 2px rgba(255, 255, 255, 0.85),
              inset 0 -1.5px 2px rgba(255, 255, 255, 0.35),
              0 4px 16px rgba(0, 0, 0, 0.10)
            `,
          }}
        >
          {/* Reflejo especular superior continuo de cristal líquido */}
          <div
            className="absolute inset-x-2 top-0 h-[1.5px] rounded-full pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent)",
            }}
          />
          {/* Brillo inferior tenue */}
          <div
            className="absolute inset-x-3 bottom-0 h-[1px] rounded-full pointer-events-none opacity-60"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent)",
            }}
          />
        </div>
      )}

      {/* ================================================================= */}
      {/* BOTONES / ÍCONOS DEL MENÚ — position: relative, z-index: 2        */}
      {/* Anclados permanentemente en sus celdas — NUNCA se mueven de lugar  */}
      {/* ================================================================= */}
      {items.map((item, idx) => {
        const isSpotlight = idx === spotlightIndex;

        if (variant === "dock") {
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
              style={{
                position: "relative",
                zIndex: 2,
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              className="w-full h-full flex flex-col items-center justify-center py-0.5 px-1 rounded-full select-none cursor-pointer focus:outline-none"
            >
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
                      ? `${activeColor} stroke-[2.6px]`
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
                    ? `${activeColor} font-black`
                    : "text-[#8e8e93] dark:text-[#98989d] font-medium"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        }

        // Header pill
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
            style={{
              position: "relative",
              zIndex: 2,
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm select-none cursor-pointer focus:outline-none"
          >
            <div
              className={`transition-all duration-150 transform-gpu ${
                isSpotlight
                  ? `scale-110 ${activeColor} stroke-[2.4px]`
                  : "scale-100 text-[#8e8e93] dark:text-[#98989d]"
              }`}
            >
              {item.icon}
            </div>

            <span
              className={`transition-colors duration-150 ${
                isSpotlight
                  ? `${activeColor} font-black`
                  : "text-[#8e8e93] dark:text-[#98989d] font-medium"
              }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Slots vacíos para dock simétrico si gridCols > items.length */}
      {variant === "dock" &&
        Array.from({ length: Math.max(0, gridCols - items.length) }).map((_, i) => (
          <div
            key={`empty-slot-${i}`}
            className="w-full h-full pointer-events-none"
            aria-hidden="true"
          />
        ))}
    </div>
  );
}
