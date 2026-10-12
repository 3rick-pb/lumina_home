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
  activeColor?: string; // Tailwind color class e.g. "text-stone-900" or "text-[#c25e1a]"
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

  // Track scrubbing gesture
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewIndexRef = useRef<number | null>(null);

  // Gesture physics tracking
  const pointerStartRef = useRef<{ x: number; y: number; time: number; pointerId: number } | null>(null);
  const lastMoveRef = useRef<{ x: number; time: number; vx: number }>({ x: 0, time: 0, vx: 0 });
  const hasMovedRef = useRef(false);

  // Active index
  const activeIndex = useMemo(() => {
    const idx = items.findIndex((it) => it.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [items, activeId]);

  // Optical displacement map cache for the floating lens
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
    }
  }, [items.length]);

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

  // Motion values for physical spring follower
  const lensTargetX = useMotionValue(0);
  const lensTargetWidth = useMotionValue(0);
  const lensTargetScaleX = useMotionValue(1);
  const lensTargetScaleY = useMotionValue(1);

  // Apple spring configurations:
  // - High response during gesture tracking
  // - Apple physical fluid bounce on release/settle
  const springX = useSpring(lensTargetX, { stiffness: 480, damping: 32, mass: 0.6 });
  const springWidth = useSpring(lensTargetWidth, { stiffness: 480, damping: 32, mass: 0.6 });
  const springScaleX = useSpring(lensTargetScaleX, { stiffness: 420, damping: 24, mass: 0.5 });
  const springScaleY = useSpring(lensTargetScaleY, { stiffness: 420, damping: 24, mass: 0.5 });

  // Update resting position whenever activeIndex or tabsGeo changes
  useEffect(() => {
    if (!isScrubbingRef.current && tabsGeo[activeIndex]) {
      const current = tabsGeo[activeIndex];
      lensTargetX.set(current.x);
      lensTargetWidth.set(current.width);
      lensTargetScaleX.set(1);
      lensTargetScaleY.set(1);
    }
  }, [activeIndex, tabsGeo, lensTargetX, lensTargetWidth, lensTargetScaleX, lensTargetScaleY]);

  // Optical SVG filter for the lens
  const currentLensWidth = tabsGeo[activeIndex]?.width || 80;
  const currentLensHeight = tabsGeo[activeIndex]?.height || 40;
  const lensFilterUrl = useMemo(() => {
    if (!hasChromiumSupport || currentLensWidth === 0 || currentLensHeight === 0) return null;
    return getDisplacementFilter({
      width: Math.round(currentLensWidth),
      height: Math.round(currentLensHeight),
      radius: 9999,
      depth: 6,
      strength: 30,
      chromaticAberration: 2.2,
    });
  }, [hasChromiumSupport, currentLensWidth, currentLensHeight]);

  // Trigger tactile haptic tick when crossing tab boundaries
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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tabsGeo.length === 0 || !containerRef.current) return;

    // Capture pointer so gesture continues even outside the element boundaries
    e.currentTarget.setPointerCapture(e.pointerId);

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

    isScrubbingRef.current = true;
    setIsScrubbing(true);
    setPreviewIndex(initialIdx);
    previewIndexRef.current = initialIdx;

    // Micro-squish tactile feedback on initial grab
    lensTargetScaleX.set(1.05);
    lensTargetScaleY.set(0.96);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current || !pointerStartRef.current || !containerRef.current) return;

    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    if (dx > 6) {
      hasMovedRef.current = true;
    }

    const now = performance.now();
    const dt = Math.max(1, now - lastMoveRef.current.time);
    const vx = (e.clientX - lastMoveRef.current.x) / dt;
    lastMoveRef.current = { x: e.clientX, time: now, vx };

    const containerRect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - containerRect.left;

    // Detect page swipe when dragging far past the edges of the dock
    if (onSwipePage) {
      if (relX < -40) {
        onSwipePage(-1);
        isScrubbingRef.current = false;
        setIsScrubbing(false);
        return;
      }
      if (relX > containerRect.width + 40) {
        onSwipePage(1);
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

    // Fluid position tracking:
    // Follows the pointer with a gentle magnetic pull toward the closest tab center
    const targetGeo = tabsGeo[closestIdx];
    if (targetGeo) {
      const tabCenterX = targetGeo.x + targetGeo.width / 2;
      const fingerDelta = relX - tabCenterX;
      // Magnetic interpolation: keeps lens close to finger while feeling attached to the tabs
      const dynamicX = targetGeo.x + fingerDelta * 0.45;
      
      lensTargetX.set(dynamicX);
      lensTargetWidth.set(targetGeo.width);

      // Fluid velocity stretch (Apple fluid jelly elongation along X axis)
      const stretchVelocity = Math.min(0.24, Math.abs(vx) * 0.12);
      lensTargetScaleX.set(1 + stretchVelocity);
      lensTargetScaleY.set(1 - stretchVelocity * 0.45);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const selectedIdx = previewIndexRef.current !== null ? previewIndexRef.current : activeIndex;
    const selectedItem = items[selectedIdx];

    // Reset scrubbing states
    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    pointerStartRef.current = null;

    // Commit resting position with authentic Apple spring bounce
    if (tabsGeo[selectedIdx]) {
      const target = tabsGeo[selectedIdx];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
      lensTargetScaleY.set(1.0);
    }

    // Commit selection if item exists
    if (selectedItem) {
      onSelect(selectedItem.id, selectedItem);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setPreviewIndex(null);
    previewIndexRef.current = null;
    pointerStartRef.current = null;

    // Snap back to active tab
    if (tabsGeo[activeIndex]) {
      const target = tabsGeo[activeIndex];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
      lensTargetScaleY.set(1.0);
    }
  };

  // Direct Tap fallback handler (for keyboard or rapid direct clicks)
  const handleDirectItemClick = (e: React.MouseEvent, item: LiquidScrubberItem, idx: number) => {
    if (hasMovedRef.current) {
      // Was a scrub drag gesture, already handled on pointerup
      e.preventDefault();
      return;
    }

    // Direct click/tap
    triggerHaptic();
    if (tabsGeo[idx]) {
      const target = tabsGeo[idx];
      lensTargetX.set(target.x);
      lensTargetWidth.set(target.width);
      lensTargetScaleX.set(1.0);
      lensTargetScaleY.set(1.0);
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
      className={`relative select-none touch-none cursor-pointer ${
        variant === "dock"
          ? "w-full h-full grid grid-cols-4 items-center justify-items-stretch gap-1 px-1"
          : "flex items-center gap-1"
      } ${className}`}
      style={{
        WebkitTapHighlightColor: "transparent",
        gridTemplateColumns: variant === "dock" ? `repeat(${gridCols}, minmax(0, 1fr))` : undefined,
      }}
    >
      {/* ================================================================= */}
      {/* FLOATING LIQUID GLASS LENS (APPLE STORE REFRACTION WITH CHROMATIC GLOW) */}
      {/* ================================================================= */}
      {tabsGeo.length > 0 && (
        <motion.div
          className="absolute top-0 bottom-0 pointer-events-none z-0 flex items-center"
          style={{
            x: springX,
            width: springWidth,
            scaleX: springScaleX,
            scaleY: springScaleY,
            transformOrigin: "center center",
          }}
        >
          <div
            className="w-full h-full rounded-full relative overflow-hidden transition-shadow duration-300"
            style={{
              backdropFilter: lensFilterUrl
                ? `blur(1.5px) url('${lensFilterUrl}') blur(2px) brightness(1.1) saturate(1.4)`
                : "blur(16px) saturate(190%) brightness(1.1)",
              WebkitBackdropFilter: lensFilterUrl
                ? `blur(1.5px) url('${lensFilterUrl}') blur(2px) brightness(1.1) saturate(1.4)`
                : "blur(16px) saturate(190%) brightness(1.1)",
              background: isScrubbing
                ? "rgba(255, 255, 255, 0.72)"
                : "rgba(255, 255, 255, 0.65)",
              boxShadow: `
                0 8px 24px -2px rgba(0, 0, 0, 0.12),
                0 2px 6px -1px rgba(0, 0, 0, 0.06),
                inset 0 1.5px 2px 0px rgba(255, 255, 255, 0.95),
                inset 0 -1px 1.5px 0px rgba(255, 255, 255, 0.35)
              `,
              border: "1px solid rgba(255, 255, 255, 0.75)",
            }}
          >
            {/* Prismatic Rainbow Sheen Rim (Subtle VisionOS Dispersion Flare) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-40 mix-blend-overlay"
              style={{
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.4) 0%, rgba(168,85,247,0.3) 45%, rgba(251,146,60,0.4) 100%)",
              }}
            />

            {/* Specular Curved Highlight on Upper Rim */}
            <div className="absolute inset-x-0 top-0 h-[48%] rounded-t-full bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
          </div>
        </motion.div>
      )}

      {/* ================================================================= */}
      {/* TABS ROW (TEXT + ICONS UNDER THE OPTICAL LENS) */}
      {/* ================================================================= */}
      {items.map((item, idx) => {
        const isSpotlight = idx === spotlightIndex;

        if (variant === "dock") {
          // Mobile Profile Dock vertical stack (icon on top of label)
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
              className="relative z-10 flex-1 h-[52px] flex flex-col items-center justify-center py-1 px-0.5 rounded-full select-none cursor-pointer focus:outline-none"
            >
              {/* Icon with scale & dynamic active accent */}
              <div
                className={`relative flex items-center justify-center transition-all duration-200 transform-gpu ${
                  isSpotlight
                    ? "scale-115 -translate-y-0.5"
                    : "scale-100 translate-y-0 opacity-80"
                }`}
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center transition-colors duration-200 ${
                    isSpotlight
                      ? activeColor || "text-[#c25e1a] dark:text-[#f59e0b] stroke-[2.4px]"
                      : "text-stone-700 dark:text-stone-200"
                  }`}
                >
                  {item.icon}
                </div>

                {/* Badge count if present */}
                {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-black bg-[#fa2d48] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#16161a] shadow-xs">
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </span>
                )}
              </div>

              {/* High contrast label */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-[68px] text-center transition-all duration-200 ${
                  isSpotlight
                    ? `${activeColor || "text-[#c25e1a] dark:text-[#f59e0b]"} font-black scale-105`
                    : "text-stone-800 dark:text-stone-200 font-bold"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        }

        // Horizontal pill for Header (icon beside label)
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
            className="relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm select-none cursor-pointer focus:outline-none"
          >
            <div
              className={`transition-all duration-200 transform-gpu ${
                isSpotlight
                  ? "scale-115 text-[#8c9276] dark:text-[#a3a98d]"
                  : "scale-100 text-gray-500 dark:text-gray-400"
              }`}
            >
              {item.icon}
            </div>

            <span
              className={`transition-colors duration-200 ${
                isSpotlight
                  ? "text-gray-950 dark:text-white font-semibold"
                  : "text-gray-600 dark:text-gray-300 font-medium"
              }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Symmetrical empty slots if dock page has fewer than gridCols items */}
      {variant === "dock" &&
        Array.from({ length: Math.max(0, gridCols - items.length) }).map((_, i) => (
          <div key={`empty-slot-${i}`} className="w-full h-[52px] pointer-events-none" aria-hidden="true" />
        ))}
    </div>
  );
}
