"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getLenis } from "@/components/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

export interface MacOSScrollbarInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface MacOSScrollbarProps {
  /** If provided, attaches to this scrollable container element instead of window/document */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Scroll axis. Default: "vertical" */
  orientation?: "vertical" | "horizontal";
  /**
   * Inset / limits from container edges to prevent thumb clipping into rounded corners.
   * Can be a number (applied symmetrically) or an object with specific sides.
   * Defaults:
   * - Vertical container: top 24px, bottom 24px, right 3px
   * - Horizontal container: left 16px, right 16px, bottom 3px
   * - Window mode: 0px / 0px
   */
  inset?: number | MacOSScrollbarInsets;
  /** Direct top limit override (px) */
  insetTop?: number;
  /** Direct bottom limit override (px) */
  insetBottom?: number;
  /** Direct left limit override (px) */
  insetLeft?: number;
  /** Direct right limit override (px) */
  insetRight?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * macOS Sequoia / Safari Floating Overlay Scrollbar with Authentic "Efecto Gelatina"
 * - Restored from commit 78728db with enhancements for bounded containers.
 * - Underdamped Hooke's Law spring oscillation with visible rebound physics.
 * - Authentic elastic rubber-band bounce, squish & constant-volume bulge ("efecto gelatina").
 * - Boundary-aware: track and thumb stay strictly within straight container limits,
 *   completely eliminating corner clipping in rounded modals (rounded-3xl, rounded-[2.5rem], etc.).
 * - Seamless integration with Lenis Smooth Scroll on root window, or custom containers.
 * - Supports both vertical (default) and horizontal orientations.
 * - Active on any desktop/laptop with fine pointer (fullscreen or windowed).
 */
export function MacOSScrollbar({
  containerRef,
  orientation = "vertical",
  inset,
  insetTop,
  insetBottom,
  insetLeft,
  insetRight,
  className,
  style,
}: MacOSScrollbarProps = {}) {
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktopDevice, setIsDesktopDevice] = useState(false);
  const [hasScrollableContent, setHasScrollableContent] = useState(false);

  const isWindowMode = !containerRef;
  const isHorizontal = orientation === "horizontal";

  // Calculate resolved insets (limits)
  const resolvedInsets = useMemo(() => {
    let t = 0;
    let b = 0;
    let l = 0;
    let r = 0;

    if (isWindowMode) {
      t = 0;
      b = 0;
      l = 0;
      r = 0;
    } else if (isHorizontal) {
      l = 16;
      r = 16;
      t = 0;
      b = 3;
    } else {
      // Default vertical container limits: 24px top & bottom to comfortably clear rounded-[2.5rem]
      t = 24;
      b = 24;
      l = 0;
      r = 3;
    }

    if (typeof inset === "number") {
      if (isHorizontal) {
        l = inset;
        r = inset;
      } else {
        t = inset;
        b = inset;
      }
    } else if (typeof inset === "object" && inset !== null) {
      if (inset.top !== undefined) t = inset.top;
      if (inset.bottom !== undefined) b = inset.bottom;
      if (inset.left !== undefined) l = inset.left;
      if (inset.right !== undefined) r = inset.right;
    }

    if (insetTop !== undefined) t = insetTop;
    if (insetBottom !== undefined) b = insetBottom;
    if (insetLeft !== undefined) l = insetLeft;
    if (insetRight !== undefined) r = insetRight;

    return { top: t, bottom: b, left: l, right: r };
  }, [isWindowMode, isHorizontal, inset, insetTop, insetBottom, insetLeft, insetRight]);

  // Detect PC / Laptop with fine pointer (mouse / trackpad) across ANY window size
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkDevice = () => {
      const isFinePointer = window.matchMedia("(pointer: fine)").matches;
      setIsDesktopDevice(isFinePointer);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Detect when modals or overlays lock body scrolling (only relevant in window mode)
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !isWindowMode) return;
    const checkLocked = () => {
      const doc = document.documentElement;
      const body = document.body;
      const isLocked =
        body.style.overflow === "hidden" ||
        doc.style.overflow === "hidden" ||
        doc.classList.contains("lumina-modal-lock-scroll") ||
        doc.classList.contains("lumina-add-card-scroll-lock") ||
        doc.hasAttribute("data-modal-open") ||
        body.classList.contains("overflow-hidden") ||
        Boolean(document.querySelector("[data-modal-open='true'], [aria-modal='true']"));
      setIsScrollLocked(Boolean(isLocked));
    };

    checkLocked();
    const observer = new MutationObserver(checkLocked);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-modal-open"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
    observer.observe(document.body, { childList: true, subtree: false });

    return () => observer.disconnect();
  }, [isWindowMode]);

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cached metrics & physics state
  const stateRef = useRef({
    scrollPos: 0,
    lastScrollPos: 0,
    maxScroll: 1,
    clientSize: 800,
    scrollSize: 1600,
    trackSize: 800,
    usableTrackSize: 788,
    thumbSize: 48,
    maxPos: 740,
    // Spring rubber-band bounce displacement (px) - EFECTO GELATINA
    bounceY: 0,
    bounceYVel: 0,
    rafId: 0,
    dragStartClient: 0,
    dragStartScrollPos: 0,
    isDragging: false,
  });

  const showTemporarily = useCallback(() => {
    setIsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (!stateRef.current.rafId && !stateRef.current.isDragging && !isHovered) {
        setIsVisible(false);
      }
    }, 1200);
  }, [isHovered]);

  useEffect(() => {
    if (typeof window === "undefined" || !isDesktopDevice) return;

    const s = stateRef.current;
    const targetEl = isWindowMode ? null : containerRef?.current;

    // Suppress native scrollbars on custom container
    if (targetEl) {
      targetEl.style.scrollbarWidth = "none";
      targetEl.classList.add("no-scrollbar");
    }

    // Measure metrics
    const measureMetrics = () => {
      let scrollSize = 0;
      let clientSize = 0;
      let maxScroll = 0;
      let scrollPos = 0;

      if (isWindowMode) {
        const doc = document.documentElement;
        const body = document.body;
        if (isHorizontal) {
          scrollSize = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
          clientSize = window.innerWidth;
          scrollPos = Math.max(0, window.scrollX || doc.scrollLeft || 0);
        } else {
          scrollSize = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
          clientSize = window.innerHeight;
          scrollPos = Math.max(0, window.scrollY || doc.scrollTop || 0);
        }
        maxScroll = Math.max(0, scrollSize - clientSize);
      } else {
        const el = containerRef?.current;
        if (!el) return;
        if (isHorizontal) {
          scrollSize = el.scrollWidth;
          clientSize = el.clientWidth;
          scrollPos = Math.max(0, el.scrollLeft);
        } else {
          scrollSize = el.scrollHeight;
          clientSize = el.clientHeight;
          scrollPos = Math.max(0, el.scrollTop);
        }
        maxScroll = Math.max(0, scrollSize - clientSize);
      }

      const track = trackRef.current;
      const trackSize = track
        ? isHorizontal
          ? track.clientWidth
          : track.clientHeight
        : clientSize;
      
      const usableTrackSize = Math.max(30, trackSize);
      const ratio = clientSize / Math.max(1, scrollSize);
      const thumbSize = Math.max(32, Math.min(usableTrackSize * 0.72, Math.round(usableTrackSize * ratio)));
      const maxPos = Math.max(1, usableTrackSize - thumbSize);

      s.scrollSize = scrollSize;
      s.clientSize = clientSize;
      s.maxScroll = maxScroll;
      s.scrollPos = scrollPos;
      s.lastScrollPos = scrollPos;
      s.trackSize = trackSize;
      s.usableTrackSize = usableTrackSize;
      s.thumbSize = thumbSize;
      s.maxPos = maxPos;

      setHasScrollableContent(maxScroll > 6);

      if (thumbRef.current) {
        if (isHorizontal) {
          thumbRef.current.style.width = `${thumbSize}px`;
        } else {
          thumbRef.current.style.height = `${thumbSize}px`;
        }
      }
    };

    // Fast GPU transform update without layout thrashing — EFECTO GELATINA (squish & bulge)
    const updateThumbDOM = () => {
      const thumb = thumbRef.current;
      if (!thumb) return;

      if (s.maxScroll <= 6) {
        thumb.style.opacity = "0";
        return;
      }

      const progress = Math.max(0, Math.min(1, s.scrollPos / Math.max(1, s.maxScroll)));
      
      // Rubber bounce displacement with safe limits (never spills outside the straight track)
      const clampedBounce = Math.max(-6, Math.min(6, s.bounceY));
      const thumbPos = progress * s.maxPos + clampedBounce;

      // Authentic rubber squish & constant-volume bulge during bounce (Efecto Gelatina)
      const squish = Math.max(0.58, 1 - Math.abs(s.bounceY) * 0.016);
      const bulge = 1 + (1 - squish) * 0.34;

      if (isHorizontal) {
        thumb.style.transformOrigin =
          s.bounceY > 0 ? "left center" : s.bounceY < 0 ? "right center" : "center center";
        thumb.style.transform = `translate3d(${thumbPos.toFixed(1)}px, 0, 0) scaleX(${squish.toFixed(3)}) scaleY(${bulge.toFixed(3)})`;
      } else {
        thumb.style.transformOrigin =
          s.bounceY > 0 ? "top center" : s.bounceY < 0 ? "bottom center" : "center center";
        thumb.style.transform = `translate3d(0, ${thumbPos.toFixed(1)}px, 0) scaleX(${bulge.toFixed(3)}) scaleY(${squish.toFixed(3)})`;
      }
      thumb.style.opacity = "";
    };

    // Underdamped spring oscillation loop for juicy rebound (Efecto Gelatina)
    const stepPhysics = () => {
      s.rafId = 0;

      const springK = 0.17; // Spring tension
      const springDamping = 0.73; // Spring friction (allows 2-3 satisfying rebound oscillations)
      const force = -s.bounceY * springK;
      s.bounceYVel = (s.bounceYVel + force) * springDamping;
      s.bounceY += s.bounceYVel;

      updateThumbDOM();

      if (Math.abs(s.bounceY) > 0.12 || Math.abs(s.bounceYVel) > 0.12) {
        s.rafId = window.requestAnimationFrame(stepPhysics);
      } else {
        s.bounceY = 0;
        s.bounceYVel = 0;
        updateThumbDOM();
      }
    };

    const triggerPhysics = () => {
      if (s.rafId === 0) {
        s.rafId = window.requestAnimationFrame(stepPhysics);
      }
    };

    // Fast scroll handler
    const handleScroll = () => {
      if (s.isDragging) return;
      const prevPos = s.scrollPos;
      let currentPos = 0;

      if (isWindowMode) {
        currentPos = isHorizontal
          ? Math.max(0, window.scrollX || document.documentElement.scrollLeft || 0)
          : Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
      } else {
        const el = containerRef?.current;
        currentPos = isHorizontal
          ? Math.max(0, el?.scrollLeft || 0)
          : Math.max(0, el?.scrollTop || 0);
      }

      s.scrollPos = currentPos;
      const delta = currentPos - prevPos;

      // Detect high-speed slam into START rail
      if (currentPos <= 0 && prevPos > 1) {
        const impact = Math.min(24, Math.abs(delta) * 0.4);
        s.bounceYVel = impact;
        triggerPhysics();
      }
      // Detect high-speed slam into END rail
      else if (currentPos >= s.maxScroll && prevPos < s.maxScroll - 1 && s.maxScroll > 6) {
        const impact = Math.min(24, Math.abs(delta) * 0.4);
        s.bounceYVel = -impact;
        triggerPhysics();
      }

      s.lastScrollPos = currentPos;
      updateThumbDOM();
      showTemporarily();
    };

    // Wheel event handler for interactive rubber-band pull & rebound
    const handleWheel = (e: WheelEvent) => {
      if (s.maxScroll <= 6) return;

      const delta = isHorizontal ? (e.deltaX !== 0 ? e.deltaX : e.deltaY) : e.deltaY;
      const atStart = s.scrollPos <= 1;
      const atEnd = s.scrollPos >= s.maxScroll - 2;

      if (atStart && delta < 0) {
        const pull = Math.min(16, Math.abs(delta) * 0.16);
        const resistance = 1 / (1 + s.bounceY * 0.08);
        s.bounceY = Math.min(28, s.bounceY + pull * resistance);
        s.bounceYVel = 0;
        showTemporarily();
        triggerPhysics();
      } else if (atEnd && delta > 0) {
        const pull = Math.min(16, Math.abs(delta) * 0.16);
        const resistance = 1 / (1 + Math.abs(s.bounceY) * 0.08);
        s.bounceY = Math.max(-28, s.bounceY - pull * resistance);
        s.bounceYVel = 0;
        showTemporarily();
        triggerPhysics();
      }
    };

    // Initialize metrics & DOM
    measureMetrics();
    updateThumbDOM();

    const capturedTargetEl = containerRef?.current;

    if (isWindowMode) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("wheel", handleWheel, { passive: true });
      window.addEventListener("resize", () => {
        measureMetrics();
        updateThumbDOM();
      });
    } else if (capturedTargetEl) {
      capturedTargetEl.addEventListener("scroll", handleScroll, { passive: true });
      capturedTargetEl.addEventListener("wheel", handleWheel, { passive: true });
    }

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        measureMetrics();
        updateThumbDOM();
      });
      if (isWindowMode) {
        ro.observe(document.documentElement);
      } else if (capturedTargetEl) {
        ro.observe(capturedTargetEl);
      }
    }

    return () => {
      if (isWindowMode) {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("wheel", handleWheel);
      } else if (capturedTargetEl) {
        capturedTargetEl.removeEventListener("scroll", handleScroll);
        capturedTargetEl.removeEventListener("wheel", handleWheel);
      }
      if (ro) ro.disconnect();
      if (s.rafId) window.cancelAnimationFrame(s.rafId);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [showTemporarily, isDesktopDevice, isWindowMode, isHorizontal, containerRef]);

  // Pointer dragging on the thumb
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const s = stateRef.current;
    setIsDragging(true);
    s.isDragging = true;
    setIsVisible(true);
    s.dragStartClient = isHorizontal ? e.clientX : e.clientY;
    s.dragStartScrollPos = s.scrollPos;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s.isDragging) return;
    const dClient = isHorizontal
      ? e.clientX - s.dragStartClient
      : e.clientY - s.dragStartClient;
    const scrollDelta = (dClient / s.maxPos) * s.maxScroll;
    const nextScroll = Math.max(0, Math.min(s.maxScroll, s.dragStartScrollPos + scrollDelta));

    s.scrollPos = nextScroll;

    if (isWindowMode) {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(nextScroll, { immediate: true });
      } else {
        if (isHorizontal) {
          window.scrollTo({ left: nextScroll, behavior: "auto" });
        } else {
          window.scrollTo({ top: nextScroll, behavior: "auto" });
        }
      }
    } else {
      const el = containerRef?.current;
      if (el) {
        if (isHorizontal) {
          el.scrollLeft = nextScroll;
        } else {
          el.scrollTop = nextScroll;
        }
      }
    }

    // Edge elastic resistance while dragging
    const rawNext = s.dragStartScrollPos + scrollDelta;
    if (rawNext < 0) {
      s.bounceY = Math.min(24, Math.abs(dClient) * 0.2);
    } else if (rawNext > s.maxScroll) {
      s.bounceY = Math.max(-24, -Math.abs(dClient) * 0.2);
    } else {
      s.bounceY = 0;
    }

    // Instantly update thumb DOM to stick to cursor without waiting for scroll event loop
    if (thumbRef.current) {
      const progress = Math.max(0, Math.min(1, s.scrollPos / Math.max(1, s.maxScroll)));
      const clampedBounce = Math.max(-6, Math.min(6, s.bounceY));
      const thumbPos = progress * s.maxPos + clampedBounce;
      if (isHorizontal) {
        thumbRef.current.style.transform = `translate3d(${thumbPos.toFixed(1)}px, 0, 0) scaleX(1) scaleY(1)`;
      } else {
        thumbRef.current.style.transform = `translate3d(0, ${thumbPos.toFixed(1)}px, 0) scaleX(1) scaleY(1)`;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s.isDragging) return;
    setIsDragging(false);
    s.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    // Trigger bounce release if released past edge
    if (Math.abs(stateRef.current.bounceY) > 0.5) {
      stateRef.current.bounceYVel = -stateRef.current.bounceY * 0.3;
      if (stateRef.current.rafId === 0) {
        stateRef.current.rafId = window.requestAnimationFrame(() => {});
      }
    }
    showTemporarily();
  };

  // Click on track to jump directly to target
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === thumbRef.current) return;
    const track = trackRef.current;
    if (!track) return;

    const trackRect = track.getBoundingClientRect();
    const s = stateRef.current;

    let progress = 0;
    if (isHorizontal) {
      const clickX = e.clientX - trackRect.left;
      progress = Math.max(0, Math.min(1, (clickX - s.thumbSize / 2) / s.maxPos));
    } else {
      const clickY = e.clientY - trackRect.top;
      progress = Math.max(0, Math.min(1, (clickY - s.thumbSize / 2) / s.maxPos));
    }
    const targetScroll = progress * s.maxScroll;

    if (isWindowMode) {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(targetScroll);
      } else {
        if (isHorizontal) {
          window.scrollTo({ left: targetScroll, behavior: "smooth" });
        } else {
          window.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      }
    } else {
      const el = containerRef?.current;
      if (el) {
        if (isHorizontal) {
          el.scrollTo({ left: targetScroll, behavior: "smooth" });
        } else {
          el.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      }
    }
  };

  if (!isDesktopDevice) return null;

  const showOverlay = isWindowMode
    ? !isScrollLocked && hasScrollableContent && (isVisible || isHovered || isDragging)
    : hasScrollableContent && (isVisible || isHovered || isDragging);

  const canAcceptPointerEvents = isWindowMode
    ? !isScrollLocked && hasScrollableContent
    : hasScrollableContent;

  // Track position styles with boundary limits
  const trackStyle: React.CSSProperties = {
    opacity: showOverlay ? 1 : 0,
    pointerEvents: canAcceptPointerEvents ? "auto" : "none",
    transition: "opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)",
    ...style,
  };

  if (isWindowMode) {
    if (isHorizontal) {
      trackStyle.bottom = 0;
      trackStyle.left = 0;
      trackStyle.right = 0;
      trackStyle.height = "14px";
    } else {
      trackStyle.top = 0;
      trackStyle.right = 0;
      trackStyle.bottom = 0;
      trackStyle.width = "14px";
    }
  } else {
    // Container mode: physically constrain track to the safe straight region
    if (isHorizontal) {
      trackStyle.left = `${resolvedInsets.left}px`;
      trackStyle.right = `${resolvedInsets.right}px`;
      trackStyle.bottom = `${resolvedInsets.bottom}px`;
      trackStyle.height = "14px";
    } else {
      trackStyle.top = `${resolvedInsets.top}px`;
      trackStyle.bottom = `${resolvedInsets.bottom}px`;
      trackStyle.right = `${resolvedInsets.right}px`;
      trackStyle.width = "14px";
    }
  }

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (hasScrollableContent) setIsVisible(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isDragging) {
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 700);
        }
      }}
      className={cn(
        isWindowMode ? "fixed z-[9999]" : "absolute z-50",
        "select-none transition-colors duration-200",
        className
      )}
      style={trackStyle}
      aria-hidden="true"
    >
      {/* macOS Sequoia / Safari Capsule Scrollbar Thumb with Gelatina Physics */}
      <div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "absolute rounded-full cursor-grab active:cursor-grabbing backdrop-blur-md",
          "transition-[width,height,background-color,box-shadow] duration-200",
          isHorizontal
            ? `bottom-[2px] left-0 top-auto ${
                isHovered || isDragging
                  ? "h-[9px] shadow-[0_2px_8px_rgba(0,0,0,0.18)] dark:shadow-none"
                  : "h-[6px] dark:shadow-none"
              }`
            : `right-[2px] top-0 ${
                isHovered || isDragging
                  ? "w-[9px] shadow-[0_2px_8px_rgba(0,0,0,0.18)] dark:shadow-none"
                  : "w-[6px] dark:shadow-none"
              }`
        )}
        style={{
          [isHorizontal ? "width" : "height"]: "48px",
          willChange: "transform",
          backgroundColor:
            isHovered || isDragging
              ? "var(--scrollbar-thumb-hover, rgba(0, 0, 0, 0.44))"
              : "var(--scrollbar-thumb, rgba(0, 0, 0, 0.24))",
        }}
      />
    </div>
  );
}

export interface MacOSScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  dataLenisPrevent?: boolean;
  inset?: number | MacOSScrollbarInsets;
  insetTop?: number;
  insetBottom?: number;
  orientation?: "vertical" | "horizontal";
}

/**
 * Reusable container wrapper that equips any scrollable region with the authentic
 * MacOS Jelly Scrollbar and Hooke's Law physics.
 */
export const MacOSScrollArea = React.forwardRef<HTMLDivElement, MacOSScrollAreaProps>(
  (
    {
      children,
      className,
      style,
      dataLenisPrevent = true,
      inset = 18,
      insetTop,
      insetBottom,
      orientation = "vertical",
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollRef = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef;

    return (
      <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          data-lenis-prevent={dataLenisPrevent ? "true" : undefined}
          className={cn(
            orientation === "horizontal"
              ? "w-full h-full overflow-x-auto overflow-y-hidden overscroll-contain select-text [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              : "w-full h-full overflow-y-auto overscroll-contain select-text [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            className
          )}
          style={style}
          {...props}
        >
          {children}
        </div>
        <MacOSScrollbar
          containerRef={scrollRef}
          orientation={orientation}
          inset={inset}
          insetTop={insetTop}
          insetBottom={insetBottom}
        />
      </div>
    );
  }
);
MacOSScrollArea.displayName = "MacOSScrollArea";
