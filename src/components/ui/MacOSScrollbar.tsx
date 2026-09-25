"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * macOS Sequoia / Safari Floating Overlay Scrollbar
 * - Ultra-stable, silky-smooth native feel with zero layout shifts or erratic jumping.
 * - Dedicated exclusively to viewport scrolling (ignores nested container scroll events).
 * - Floating translucent capsule thumb (auto-fades on idle, expands on hover/drag).
 * - Elastic gummy physics: squishes with organic spring oscillation when hitting
 *   top/bottom boundaries and stretches smoothly with velocity.
 */
export function MacOSScrollbar() {
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasScrollableContent, setHasScrollableContent] = useState(false);

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Physics & metrics state
  const stateRef = useRef({
    scrollTop: 0,
    maxScroll: 1,
    clientHeight: 800,
    scrollHeight: 1600,
    lastScrollTop: 0,
    velocity: 0,
    // Gummy deformation
    scaleY: 1,
    scaleYVel: 0,
    scaleX: 1,
    origin: "center center" as "top center" | "bottom center" | "center center",
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

    const readMetrics = () => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollHeight = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
      const clientHeight = window.innerHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const scrollTop = Math.max(0, window.scrollY || doc.scrollTop || 0);

      s.scrollHeight = scrollHeight;
      s.clientHeight = clientHeight;
      s.maxScroll = maxScroll;
      s.scrollTop = scrollTop;

      setHasScrollableContent(maxScroll > 6);
    };

    const updateThumbDOM = () => {
      const thumb = thumbRef.current;
      const track = trackRef.current;
      if (!thumb || !track) return;

      if (s.maxScroll <= 6) {
        thumb.style.opacity = "0";
        return;
      }

      const trackRect = track.getBoundingClientRect();
      const trackH = Math.max(80, trackRect.height);
      const usableTrackH = Math.max(40, trackH - 12);

      const ratio = s.clientHeight / Math.max(1, s.scrollHeight);
      const thumbH = Math.max(36, Math.min(usableTrackH * 0.75, Math.round(usableTrackH * ratio)));
      const maxTop = Math.max(1, usableTrackH - thumbH);

      const progress = Math.max(0, Math.min(1, s.scrollTop / Math.max(1, s.maxScroll)));
      const thumbTop = 6 + progress * maxTop;

      thumb.style.height = `${thumbH}px`;
      thumb.style.transformOrigin = s.origin;
      thumb.style.transform = `translate3d(0, ${thumbTop.toFixed(2)}px, 0) scaleX(${s.scaleX.toFixed(
        3
      )}) scaleY(${s.scaleY.toFixed(3)})`;
      thumb.style.opacity = "";
    };

    const stepPhysics = () => {
      s.rafId = 0;

      // Spring oscillation for gummy scale deformation
      const springStiffness = 0.22;
      const springDamping = 0.72;
      const targetScaleY = 1;
      const forceY = (targetScaleY - s.scaleY) * springStiffness;
      s.scaleYVel = (s.scaleYVel + forceY) * springDamping;
      s.scaleY += s.scaleYVel;

      // Constant volume width deformation (chicloso)
      if (s.scaleY < 0.98) {
        s.scaleX = Math.min(1.28, 1 + (1 - s.scaleY) * 0.42);
      } else if (s.scaleY > 1.02) {
        s.scaleX = Math.max(0.86, 1 - (s.scaleY - 1) * 0.25);
      } else {
        s.scaleX = 1;
      }

      // Decay velocity
      s.velocity *= 0.82;

      updateThumbDOM();

      const stillOscillating =
        Math.abs(s.scaleY - 1) > 0.005 ||
        Math.abs(s.scaleYVel) > 0.005 ||
        Math.abs(s.velocity) > 0.3;

      if (stillOscillating) {
        s.rafId = window.requestAnimationFrame(stepPhysics);
      } else {
        s.scaleY = 1;
        s.scaleX = 1;
        s.scaleYVel = 0;
        s.velocity = 0;
        updateThumbDOM();
      }
    };

    const triggerPhysics = () => {
      if (s.rafId === 0) {
        s.rafId = window.requestAnimationFrame(stepPhysics);
      }
    };

    // Passive window scroll listener (NEVER capture child div scrolls)
    const handleScroll = () => {
      const prevTop = s.scrollTop;
      readMetrics();
      const delta = s.scrollTop - prevTop;
      s.velocity = delta;

      // Gentle velocity stretch while scrolling
      const stretch = Math.min(0.24, Math.abs(delta) * 0.004);
      if (stretch > 0.02) {
        s.origin = delta >= 0 ? "top center" : "bottom center";
        s.scaleY = Math.max(s.scaleY, 1 + stretch);
      }

      // Detect hitting edge with momentum -> trigger gummy squish & bounce
      if (s.scrollTop <= 1 && delta < -1.5) {
        s.origin = "top center";
        s.scaleYVel -= Math.min(0.3, Math.abs(delta) * 0.015);
      } else if (s.scrollTop >= s.maxScroll - 1 && delta > 1.5 && s.maxScroll > 6) {
        s.origin = "bottom center";
        s.scaleYVel -= Math.min(0.3, Math.abs(delta) * 0.015);
      }

      updateThumbDOM();
      showTemporarily();
      triggerPhysics();
    };

    // Wheel listener for edge rubber-band deformation
    const handleWheel = (e: WheelEvent) => {
      readMetrics();
      if (s.maxScroll <= 6) return;

      const atTop = s.scrollTop <= 1;
      const atBottom = s.scrollTop >= s.maxScroll - 2;

      if (atTop && e.deltaY < 0) {
        // Squish against top
        s.origin = "top center";
        s.scaleY = Math.max(0.55, s.scaleY - Math.min(0.12, Math.abs(e.deltaY) * 0.0018));
        showTemporarily();
        triggerPhysics();
      } else if (atBottom && e.deltaY > 0) {
        // Squish against bottom
        s.origin = "bottom center";
        s.scaleY = Math.max(0.55, s.scaleY - Math.min(0.12, Math.abs(e.deltaY) * 0.0018));
        showTemporarily();
        triggerPhysics();
      }
    };

    // Initialize
    readMetrics();
    updateThumbDOM();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("resize", () => {
      readMetrics();
      updateThumbDOM();
    });

    // ResizeObserver on document root to update when dynamic content renders
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        readMetrics();
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
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const trackH = Math.max(80, track.getBoundingClientRect().height);
    const usableTrackH = Math.max(40, trackH - 12);
    const thumbH = thumb.getBoundingClientRect().height || 40;
    const maxTop = Math.max(1, usableTrackH - thumbH);

    const dy = e.clientY - s.dragStartY;
    const scrollDelta = (dy / maxTop) * s.maxScroll;
    const nextScroll = Math.max(0, Math.min(s.maxScroll, s.dragStartScrollTop + scrollDelta));

    window.scrollTo({ top: nextScroll, behavior: "auto" });

    // Edge squishing during drag
    if (s.dragStartScrollTop + scrollDelta < 0) {
      s.origin = "top center";
      s.scaleY = Math.max(0.6, 1 - Math.abs(dy) * 0.003);
    } else if (s.dragStartScrollTop + scrollDelta > s.maxScroll) {
      s.origin = "bottom center";
      s.scaleY = Math.max(0.6, 1 - Math.abs(dy) * 0.003);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    stateRef.current.scaleY = 1;
    stateRef.current.scaleX = 1;
    showTemporarily();
  };

  // Click on track to jump directly to target
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === thumbRef.current) return;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const trackRect = track.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top - 6;
    const usableTrackH = Math.max(40, trackRect.height - 12);
    const thumbH = thumb.getBoundingClientRect().height || 40;
    const maxTop = Math.max(1, usableTrackH - thumbH);

    const progress = Math.max(0, Math.min(1, (clickY - thumbH / 2) / maxTop));
    const targetScroll = progress * stateRef.current.maxScroll;

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
