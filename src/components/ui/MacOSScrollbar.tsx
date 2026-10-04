"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { getLenis } from "@/components/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

export interface MacOSScrollbarProps {
  /** If provided, attaches to this scrollable container element instead of window/document */
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * macOS Sequoia / Safari Floating Overlay Scrollbar with Authentic "Efecto Gelatina"
 * - Restored from commit 78728db (Sep 29, 2026, 5:19 p.m.) with enhanced stability.
 * - Underdamped Hooke's Law spring oscillation with visible rebound physics.
 * - Authentic elastic rubber-band bounce, squish & constant-volume bulge ("efecto gelatina").
 * - Seamless integration with Lenis Smooth Scroll on root window, or custom containers (modals, drawers, tabs).
 * - Active on any desktop/laptop with fine pointer (fullscreen or windowed).
 */
export function MacOSScrollbar({ containerRef, className }: MacOSScrollbarProps = {}) {
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktopDevice, setIsDesktopDevice] = useState(false);
  const [hasScrollableContent, setHasScrollableContent] = useState(false);

  const isWindowMode = !containerRef;

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

  // Cached metrics & physics state (avoids getBoundingClientRect on scroll)
  const stateRef = useRef({
    scrollTop: 0,
    lastScrollTop: 0,
    maxScroll: 1,
    clientHeight: 800,
    scrollHeight: 1600,
    trackHeight: 800,
    usableTrackH: 788,
    thumbH: 48,
    maxTop: 740,
    // Spring rubber-band bounce displacement (px) - EFECTO GELATINA
    bounceY: 0,
    bounceYVel: 0,
    rafId: 0,
    dragStartY: 0,
    dragStartScrollTop: 0,
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
    const targetElement = isWindowMode ? null : containerRef?.current;

    // Suppress native scrollbars on custom container
    if (targetElement) {
      targetElement.style.scrollbarWidth = "none";
      targetElement.classList.add("no-scrollbar");
    }

    // Measure metrics only on mount, resize, and DOM changes
    const measureMetrics = () => {
      let scrollHeight = 0;
      let clientHeight = 0;
      let maxScroll = 0;
      let scrollTop = 0;

      if (isWindowMode) {
        const doc = document.documentElement;
        const body = document.body;
        scrollHeight = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
        clientHeight = window.innerHeight;
        maxScroll = Math.max(0, scrollHeight - clientHeight);
        scrollTop = Math.max(0, window.scrollY || doc.scrollTop || 0);
      } else {
        const el = containerRef?.current;
        if (!el) return;
        scrollHeight = el.scrollHeight;
        clientHeight = el.clientHeight;
        maxScroll = Math.max(0, scrollHeight - clientHeight);
        scrollTop = Math.max(0, el.scrollTop);
      }

      const track = trackRef.current;
      const trackH = track ? track.clientHeight : clientHeight;
      const usableTrackH = Math.max(40, trackH - 12);

      const ratio = clientHeight / Math.max(1, scrollHeight);
      const thumbH = Math.max(36, Math.min(usableTrackH * 0.72, Math.round(usableTrackH * ratio)));
      const maxTop = Math.max(1, usableTrackH - thumbH);

      s.scrollHeight = scrollHeight;
      s.clientHeight = clientHeight;
      s.maxScroll = maxScroll;
      s.scrollTop = scrollTop;
      s.lastScrollTop = scrollTop;
      s.trackHeight = trackH;
      s.usableTrackH = usableTrackH;
      s.thumbH = thumbH;
      s.maxTop = maxTop;

      setHasScrollableContent(maxScroll > 6);

      if (thumbRef.current) {
        thumbRef.current.style.height = `${thumbH}px`;
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

      const progress = Math.max(0, Math.min(1, s.scrollTop / Math.max(1, s.maxScroll)));
      const thumbTop = 6 + progress * s.maxTop + s.bounceY;

      // Authentic rubber squish & constant-volume bulge during bounce (Efecto Gelatina)
      const squish = Math.max(0.56, 1 - Math.abs(s.bounceY) * 0.016);
      const bulge = 1 + (1 - squish) * 0.34;

      thumb.style.transformOrigin =
        s.bounceY > 0 ? "top center" : s.bounceY < 0 ? "bottom center" : "center center";
      thumb.style.transform = `translate3d(0, ${thumbTop.toFixed(
        1
      )}px, 0) scaleX(${bulge.toFixed(3)}) scaleY(${squish.toFixed(3)})`;
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
      const prevTop = s.scrollTop;
      const currentTop = isWindowMode
        ? Math.max(0, window.scrollY || document.documentElement.scrollTop || 0)
        : Math.max(0, containerRef?.current?.scrollTop || 0);

      s.scrollTop = currentTop;
      const delta = currentTop - prevTop;

      // Detect high-speed slam into TOP rail
      if (currentTop <= 0 && prevTop > 1) {
        const impact = Math.min(24, Math.abs(delta) * 0.4);
        s.bounceYVel = impact;
        triggerPhysics();
      }
      // Detect high-speed slam into BOTTOM rail
      else if (currentTop >= s.maxScroll && prevTop < s.maxScroll - 1 && s.maxScroll > 6) {
        const impact = Math.min(24, Math.abs(delta) * 0.4);
        s.bounceYVel = -impact;
        triggerPhysics();
      }

      s.lastScrollTop = currentTop;
      updateThumbDOM();
      showTemporarily();
    };

    // Wheel event handler for interactive rubber-band pull & rebound
    const handleWheel = (e: WheelEvent) => {
      if (s.maxScroll <= 6) return;

      const atTop = s.scrollTop <= 1;
      const atBottom = s.scrollTop >= s.maxScroll - 2;

      if (atTop && e.deltaY < 0) {
        // Pulling past TOP edge -> Elastic rubber displacement + bounce
        const pull = Math.min(16, Math.abs(e.deltaY) * 0.16);
        const resistance = 1 / (1 + s.bounceY * 0.08);
        s.bounceY = Math.min(28, s.bounceY + pull * resistance);
        s.bounceYVel = 0; // Hold tension while wheeling
        showTemporarily();
        triggerPhysics();
      } else if (atBottom && e.deltaY > 0) {
        // Pulling past BOTTOM edge -> Elastic rubber displacement + bounce
        const pull = Math.min(16, Math.abs(e.deltaY) * 0.16);
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

    const targetEl = containerRef?.current;

    if (isWindowMode) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("wheel", handleWheel, { passive: true });
      window.addEventListener("resize", () => {
        measureMetrics();
        updateThumbDOM();
      });
    } else if (targetEl) {
      targetEl.addEventListener("scroll", handleScroll, { passive: true });
      targetEl.addEventListener("wheel", handleWheel, { passive: true });
    }

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        measureMetrics();
        updateThumbDOM();
      });
      if (isWindowMode) {
        ro.observe(document.documentElement);
      } else if (targetEl) {
        ro.observe(targetEl);
      }
    }

    return () => {
      if (isWindowMode) {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("wheel", handleWheel);
      } else if (targetEl) {
        targetEl.removeEventListener("scroll", handleScroll);
        targetEl.removeEventListener("wheel", handleWheel);
      }
      if (ro) ro.disconnect();
      if (s.rafId) window.cancelAnimationFrame(s.rafId);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [showTemporarily, isDesktopDevice, isWindowMode, containerRef]);

  // Pointer dragging on the thumb
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const s = stateRef.current;
    setIsDragging(true);
    s.isDragging = true;
    setIsVisible(true);
    s.dragStartY = e.clientY;
    s.dragStartScrollTop = s.scrollTop;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = stateRef.current;
    if (!s.isDragging) return;
    const dy = e.clientY - s.dragStartY;
    const scrollDelta = (dy / s.maxTop) * s.maxScroll;
    const nextScroll = Math.max(0, Math.min(s.maxScroll, s.dragStartScrollTop + scrollDelta));

    s.scrollTop = nextScroll;

    if (isWindowMode) {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(nextScroll, { immediate: true });
      } else {
        window.scrollTo({ top: nextScroll, behavior: "auto" });
      }
    } else {
      const el = containerRef?.current;
      if (el) {
        el.scrollTop = nextScroll;
      }
    }

    // Edge elastic resistance while dragging
    if (s.dragStartScrollTop + scrollDelta < 0) {
      s.bounceY = Math.min(24, Math.abs(dy) * 0.2);
    } else if (s.dragStartScrollTop + scrollDelta > s.maxScroll) {
      s.bounceY = Math.max(-24, -Math.abs(dy) * 0.2);
    } else {
      s.bounceY = 0;
    }

    // Instantly update thumb DOM to stick to cursor without waiting for scroll event loop
    if (thumbRef.current) {
      const progress = Math.max(0, Math.min(1, s.scrollTop / Math.max(1, s.maxScroll)));
      const thumbTop = 6 + progress * s.maxTop + s.bounceY;
      thumbRef.current.style.transform = `translate3d(0, ${thumbTop.toFixed(1)}px, 0) scaleX(1) scaleY(1)`;
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
    const clickY = e.clientY - trackRect.top - 6;
    const s = stateRef.current;

    const progress = Math.max(0, Math.min(1, (clickY - s.thumbH / 2) / s.maxTop));
    const targetScroll = progress * s.maxScroll;

    if (isWindowMode) {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(targetScroll);
      } else {
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    } else {
      const el = containerRef?.current;
      if (el) {
        el.scrollTo({ top: targetScroll, behavior: "smooth" });
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
        isWindowMode
          ? "fixed top-0 right-0 bottom-0 w-3.5 z-[9999]"
          : "absolute top-0 right-0 bottom-0 w-3.5 z-50",
        "select-none transition-colors duration-200",
        className
      )}
      style={{
        opacity: showOverlay ? 1 : 0,
        pointerEvents: canAcceptPointerEvents ? "auto" : "none",
        transition: "opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      aria-hidden="true"
    >
      {/* macOS Sequoia / Safari Capsule Scrollbar Thumb with Gelatina Physics */}
      <div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute right-[3px] top-0 rounded-full cursor-grab active:cursor-grabbing backdrop-blur-md transition-[width,background-color,box-shadow] duration-200 ${
          isHovered || isDragging
            ? "w-[9px] shadow-[0_2px_8px_rgba(0,0,0,0.18)] dark:shadow-none"
            : "w-[6px] dark:shadow-none"
        }`}
        style={{
          height: "48px",
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
}

/**
 * Reusable container wrapper that equips any scrollable region with the authentic
 * MacOS Jelly Scrollbar and Hooke's Law physics.
 */
export const MacOSScrollArea = React.forwardRef<HTMLDivElement, MacOSScrollAreaProps>(
  ({ children, className, style, dataLenisPrevent = true, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollRef = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef;

    return (
      <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          data-lenis-prevent={dataLenisPrevent ? "true" : undefined}
          className={cn(
            "w-full h-full overflow-y-auto overscroll-contain select-text [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            className
          )}
          style={style}
          {...props}
        >
          {children}
        </div>
        <MacOSScrollbar containerRef={scrollRef} />
      </div>
    );
  }
);
MacOSScrollArea.displayName = "MacOSScrollArea";
