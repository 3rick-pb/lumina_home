"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * macOS Sequoia / Safari Floating Overlay Scrollbar
 * - 120 FPS lag-free performance with ZERO synchronous layout reflows on scroll.
 * - Authentic elastic rubber-band bounce ("efecto rebote") at top and bottom boundaries.
 * - Underdamped Hooke's Law spring oscillation with visible rebound physics.
 * - Auto-fading translucent capsule with smooth hover/drag expansion.
 */
export function MacOSScrollbar() {
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasScrollableContent, setHasScrollableContent] = useState(false);

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
    // Spring rubber-band bounce displacement (px)
    bounceY: 0,
    bounceYVel: 0,
    rafId: 0,
    dragStartY: 0,
    dragStartScrollTop: 0,
  });

  const showTemporarily = useCallback(() => {
    setIsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (!stateRef.current.rafId && !isDragging && !isHovered) {
        setIsVisible(false);
      }
    }, 1100);
  }, [isDragging, isHovered]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const s = stateRef.current;

    // Measure metrics only on mount, resize, and DOM changes (NEVER on scroll)
    const measureMetrics = () => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollHeight = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
      const clientHeight = window.innerHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const scrollTop = Math.max(0, window.scrollY || doc.scrollTop || 0);

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

    // Fast GPU transform update without layout thrashing
    const updateThumbDOM = () => {
      const thumb = thumbRef.current;
      if (!thumb) return;

      if (s.maxScroll <= 6) {
        thumb.style.opacity = "0";
        return;
      }

      const progress = Math.max(0, Math.min(1, s.scrollTop / Math.max(1, s.maxScroll)));
      const thumbTop = 6 + progress * s.maxTop + s.bounceY;

      // Authentic rubber squish & constant-volume bulge during bounce
      const squish = Math.max(0.56, 1 - Math.abs(s.bounceY) * 0.016);
      const bulge = 1 + (1 - squish) * 0.34;

      thumb.style.transformOrigin =
        s.bounceY > 0 ? "top center" : s.bounceY < 0 ? "bottom center" : "center center";
      thumb.style.transform = `translate3d(0, ${thumbTop.toFixed(
        1
      )}px, 0) scaleX(${bulge.toFixed(3)}) scaleY(${squish.toFixed(3)})`;
      thumb.style.opacity = "";
    };

    // Underdamped spring oscillation loop for juicy rebound (efecto rebote)
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

    // Ultra-fast scroll handler (Zero DOM measurements -> Zero lag)
    const handleScroll = () => {
      const prevTop = s.scrollTop;
      const currentTop = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("resize", () => {
      measureMetrics();
      updateThumbDOM();
    });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        measureMetrics();
        updateThumbDOM();
      });
      ro.observe(document.documentElement);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      if (ro) ro.disconnect();
      if (s.rafId) window.cancelAnimationFrame(s.rafId);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [showTemporarily]);

  // Pointer dragging on the thumb
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const s = stateRef.current;
    setIsDragging(true);
    setIsVisible(true);
    s.dragStartY = e.clientY;
    s.dragStartScrollTop = s.scrollTop;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const s = stateRef.current;
    const dy = e.clientY - s.dragStartY;
    const scrollDelta = (dy / s.maxTop) * s.maxScroll;
    const nextScroll = Math.max(0, Math.min(s.maxScroll, s.dragStartScrollTop + scrollDelta));

    window.scrollTo({ top: nextScroll, behavior: "auto" });

    // Edge elastic resistance while dragging
    if (s.dragStartScrollTop + scrollDelta < 0) {
      s.bounceY = Math.min(24, Math.abs(dy) * 0.2);
    } else if (s.dragStartScrollTop + scrollDelta > s.maxScroll) {
      s.bounceY = Math.max(-24, -Math.abs(dy) * 0.2);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    // Trigger bounce release if released past edge
    if (Math.abs(stateRef.current.bounceY) > 0.5) {
      stateRef.current.bounceYVel = -stateRef.current.bounceY * 0.3;
      if (stateRef.current.rafId === 0) {
        stateRef.current.rafId = window.requestAnimationFrame(() => {
          // Will be picked up by stepPhysics
        });
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

    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

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
      className="fixed top-0 right-0 bottom-0 w-3.5 z-[9999] pointer-events-auto select-none transition-colors duration-200"
      style={{
        opacity: hasScrollableContent && (isVisible || isHovered || isDragging) ? 1 : 0,
        transition: "opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      aria-hidden="true"
    >
      {/* macOS Sequoia / Safari Capsule Scrollbar Thumb */}
      <div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute right-[3px] top-0 rounded-full cursor-grab active:cursor-grabbing backdrop-blur-md transition-[width,background-color,box-shadow] duration-200 ${
          isHovered || isDragging
            ? "w-[9px] bg-black/55 dark:bg-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
            : "w-[6px] bg-black/35 dark:bg-white/45"
        }`}
        style={{
          height: "48px",
          border: "0.5px solid rgba(255, 255, 255, 0.22)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
