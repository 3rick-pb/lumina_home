"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * macOS Sequoia / Safari Floating Overlay Scrollbar with Gummy Rubber-Band Physics
 * - Replaces the default browser scrollbar across the entire store.
 * - Floating translucent capsule thumb (auto-fades on idle, expands on hover/drag).
 * - Gummy / elastic ("chicloso / pegajoso / rebote") physics:
 *   1. Stretches with scroll velocity like elastic gum.
 *   2. Compresses/squishes and rebounds with underdamped spring oscillation when hitting the top or bottom limit.
 *   3. Applies a smooth macOS Safari rubber-band overscroll bounce to the viewport when hitting top/bottom boundaries.
 */
export function MacOSScrollbar() {
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasScrollableContent, setHasScrollableContent] = useState(false);

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTargetRef = useRef<HTMLElement | Window>(
    typeof window !== "undefined" ? window : ({} as Window)
  );

  // Spring & Gummy Physics state (60-120fps rAF)
  const physicsRef = useRef({
    scrollTop: 0,
    maxScroll: 1,
    clientHeight: 800,
    scrollHeight: 1600,
    lastScrollTop: 0,
    velocity: 0,
    // Overscroll rubber-band displacement (px) when hitting top (<0) or bottom (>0)
    overscrollY: 0,
    overscrollVel: 0,
    // Gummy thumb deformation (1 = neutral, <1 = squished at top/bottom, >1 = stretched by speed)
    thumbScaleY: 1,
    thumbScaleYVel: 0,
    thumbOrigin: "center center" as "top center" | "bottom center" | "center center",
    rafId: 0,
    dragStartY: 0,
    dragStartScrollTop: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const p = physicsRef.current;

    const showScrollbarTemporarily = () => {
      setIsVisible(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        if (!physicsRef.current.rafId && !isDragging && !isHovered) {
          setIsVisible(false);
        }
      }, 1100);
    };

    const readMetrics = (target: HTMLElement | Window) => {
      if (target === window || !(target instanceof HTMLElement)) {
        const doc = document.documentElement;
        const body = document.body;
        const scrollHeight = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
        const clientHeight = window.innerHeight;
        const maxScroll = Math.max(0, scrollHeight - clientHeight);
        const scrollTop = window.scrollY || doc.scrollTop || 0;
        p.scrollHeight = scrollHeight;
        p.clientHeight = clientHeight;
        p.maxScroll = maxScroll;
        p.scrollTop = scrollTop;
        setHasScrollableContent(maxScroll > 4);
      } else {
        p.scrollHeight = target.scrollHeight;
        p.clientHeight = target.clientHeight;
        p.maxScroll = Math.max(0, target.scrollHeight - target.clientHeight);
        p.scrollTop = target.scrollTop;
        setHasScrollableContent(p.maxScroll > 4);
      }
    };

    const applyOverscrollTransform = (offsetY: number) => {
      const mainEl = document.querySelector("main");
      if (!mainEl) return;
      if (Math.abs(offsetY) < 0.15) {
        mainEl.style.transform = "";
        mainEl.style.transition = "";
      } else {
        mainEl.style.transform = `translate3d(0, ${offsetY.toFixed(2)}px, 0)`;
      }
    };

    const updateThumbDOM = () => {
      const thumb = thumbRef.current;
      const track = trackRef.current;
      if (!thumb || !track) return;

      const trackRect = track.getBoundingClientRect();
      const trackH = Math.max(100, trackRect.height - 12);
      if (p.maxScroll <= 4) {
        thumb.style.opacity = "0";
        return;
      }

      const ratio = p.clientHeight / Math.max(1, p.scrollHeight);
      const baseThumbH = Math.max(38, Math.min(trackH * 0.65, Math.round(trackH * ratio)));

      // Gummy compression when overscrolling at top or bottom
      const absOver = Math.abs(p.overscrollY);
      const squishFactor = Math.max(0.42, 1 - absOver / 115);
      const combinedScaleY = Math.max(0.42, Math.min(1.38, p.thumbScaleY * squishFactor));

      // Constant-volume gummy width bulge when squished (pegajoso / chicloso)
      const scaleX =
        combinedScaleY < 0.96
          ? Math.min(1.32, 1 + (1 - combinedScaleY) * 0.48)
          : combinedScaleY > 1.04
          ? Math.max(0.84, 1 - (combinedScaleY - 1) * 0.28)
          : 1;

      const progress = Math.max(0, Math.min(1, p.scrollTop / Math.max(1, p.maxScroll)));
      const maxTop = trackH - baseThumbH;
      let thumbTop = 6 + progress * maxTop;

      // Sticky pull at boundaries
      if (p.overscrollY > 0) {
        thumbTop = 6;
        p.thumbOrigin = "top center";
      } else if (p.overscrollY < 0) {
        thumbTop = 6 + maxTop;
        p.thumbOrigin = "bottom center";
      }

      thumb.style.height = `${baseThumbH}px`;
      thumb.style.transformOrigin = p.thumbOrigin;
      thumb.style.transform = `translate3d(0, ${thumbTop.toFixed(1)}px, 0) scaleX(${scaleX.toFixed(
        3
      )}) scaleY(${combinedScaleY.toFixed(3)})`;
      thumb.style.opacity = "";
    };

    const stepPhysics = () => {
      p.rafId = 0;

      // 1. Underdamped spring for rubber-band overscroll (gives the soft "efecto bota / rebote chicloso")
      const springStiffness = 0.19;
      const springDamping = 0.74;
      const forceY = -p.overscrollY * springStiffness;
      p.overscrollVel = (p.overscrollVel + forceY) * springDamping;
      p.overscrollY += p.overscrollVel;

      // 2. Underdamped spring for gummy thumb scaleY stretch & rebound
      const scaleForce = (1 - p.thumbScaleY) * 0.22;
      p.thumbScaleYVel = (p.thumbScaleYVel + scaleForce) * 0.72;
      p.thumbScaleY += p.thumbScaleYVel;

      // Decay scroll velocity
      p.velocity *= 0.82;

      applyOverscrollTransform(p.overscrollY);
      updateThumbDOM();

      const stillMoving =
        Math.abs(p.overscrollY) > 0.18 ||
        Math.abs(p.overscrollVel) > 0.18 ||
        Math.abs(1 - p.thumbScaleY) > 0.006 ||
        Math.abs(p.thumbScaleYVel) > 0.006 ||
        Math.abs(p.velocity) > 0.25;

      if (stillMoving) {
        p.rafId = window.requestAnimationFrame(stepPhysics);
      } else {
        p.overscrollY = 0;
        p.overscrollVel = 0;
        p.thumbScaleY = 1;
        p.thumbScaleYVel = 0;
        applyOverscrollTransform(0);
        updateThumbDOM();
      }
    };

    const triggerPhysics = () => {
      if (p.rafId === 0) {
        p.rafId = window.requestAnimationFrame(stepPhysics);
      }
    };

    const resolveScrollableParent = (node: EventTarget | null): HTMLElement | Window => {
      let el = node instanceof HTMLElement ? node : null;
      while (el && el !== document.body && el !== document.documentElement) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight + 8
        ) {
          return el;
        }
        el = el.parentElement;
      }
      return window;
    };

    const handleScroll = (e: Event) => {
      const target =
        e.target === document || e.target === window
          ? window
          : e.target instanceof HTMLElement
          ? e.target
          : window;

      activeTargetRef.current = target;
      const prevTop = p.scrollTop;
      readMetrics(target);

      const delta = p.scrollTop - prevTop;
      p.velocity = delta;

      // Gummy velocity stretch while scrolling
      const speedStretch = Math.min(0.28, Math.abs(delta) * 0.0055);
      if (speedStretch > 0.02) {
        p.thumbOrigin = delta >= 0 ? "top center" : "bottom center";
        p.thumbScaleY = Math.max(p.thumbScaleY, 1 + speedStretch);
      }

      // Detect hitting top or bottom boundary with momentum -> trigger gummy squish & bounce!
      if (p.scrollTop <= 1 && delta < -1.5) {
        p.thumbOrigin = "top center";
        p.thumbScaleYVel -= Math.min(0.26, Math.abs(delta) * 0.012);
        if (target === window) {
          p.overscrollVel += Math.min(18, Math.abs(delta) * 0.45);
        }
      } else if (p.scrollTop >= p.maxScroll - 1 && delta > 1.5 && p.maxScroll > 4) {
        p.thumbOrigin = "bottom center";
        p.thumbScaleYVel -= Math.min(0.26, Math.abs(delta) * 0.012);
        if (target === window) {
          p.overscrollVel -= Math.min(18, Math.abs(delta) * 0.45);
        }
      }

      showScrollbarTemporarily();
      triggerPhysics();
    };

    const handleWheel = (e: WheelEvent) => {
      const target = resolveScrollableParent(e.target);
      activeTargetRef.current = target;
      readMetrics(target);

      if (p.maxScroll <= 4) return;
      showScrollbarTemporarily();

      const atTop = p.scrollTop <= 1;
      const atBottom = p.scrollTop >= p.maxScroll - 2;

      if (atTop && e.deltaY < 0) {
        // Pulling past TOP edge -> gummy compress & rubber-band bounce
        p.thumbOrigin = "top center";
        const pull = Math.min(26, Math.abs(e.deltaY) * 0.22);
        const resistance = 1 / (1 + Math.abs(p.overscrollY) * 0.038);
        if (target === window) {
          p.overscrollY = Math.min(68, p.overscrollY + pull * resistance);
        }
        p.thumbScaleY = Math.max(0.45, p.thumbScaleY - 0.065);
        triggerPhysics();
      } else if (atBottom && e.deltaY > 0) {
        // Pulling past BOTTOM edge -> gummy compress & rubber-band bounce
        p.thumbOrigin = "bottom center";
        const pull = Math.min(26, Math.abs(e.deltaY) * 0.22);
        const resistance = 1 / (1 + Math.abs(p.overscrollY) * 0.038);
        if (target === window) {
          p.overscrollY = Math.max(-68, p.overscrollY - pull * resistance);
        }
        p.thumbScaleY = Math.max(0.45, p.thumbScaleY - 0.065);
        triggerPhysics();
      }
    };

    readMetrics(window);
    updateThumbDOM();

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("resize", () => {
      readMetrics(activeTargetRef.current);
      updateThumbDOM();
    });

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("wheel", handleWheel);
      if (p.rafId) window.cancelAnimationFrame(p.rafId);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      applyOverscrollTransform(0);
    };
  }, [isDragging, isHovered]);

  // Dragging the macOS Scrollbar Thumb with Mouse/Pointer
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const p = physicsRef.current;
    setIsDragging(true);
    setIsVisible(true);
    p.dragStartY = e.clientY;
    p.dragStartScrollTop = p.scrollTop;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const p = physicsRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const trackH = Math.max(100, track.getBoundingClientRect().height - 12);
    const thumbH = thumb.getBoundingClientRect().height || 48;
    const scrollableTrack = Math.max(1, trackH - thumbH);

    const dy = e.clientY - p.dragStartY;
    const scrollDelta = (dy / scrollableTrack) * p.maxScroll;
    const nextScroll = p.dragStartScrollTop + scrollDelta;

    const target = activeTargetRef.current;
    if (target === window || !(target instanceof HTMLElement)) {
      window.scrollTo({ top: Math.max(0, Math.min(p.maxScroll, nextScroll)), behavior: "auto" });
    } else {
      target.scrollTop = Math.max(0, Math.min(p.maxScroll, nextScroll));
    }

    // Gummy squish when user drags past top or bottom edge
    if (nextScroll < 0) {
      p.thumbOrigin = "top center";
      p.overscrollY = Math.min(54, Math.abs(nextScroll) * 0.12);
      p.thumbScaleY = Math.max(0.48, 1 - Math.abs(nextScroll) * 0.0012);
    } else if (nextScroll > p.maxScroll) {
      p.thumbOrigin = "bottom center";
      p.overscrollY = Math.max(-54, -(nextScroll - p.maxScroll) * 0.12);
      p.thumbScaleY = Math.max(0.48, 1 - (nextScroll - p.maxScroll) * 0.0012);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={trackRef}
      onMouseEnter={() => {
        setIsHovered(true);
        if (hasScrollableContent) setIsVisible(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isDragging) {
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 750);
        }
      }}
      className="fixed top-0 right-0 bottom-0 w-3.5 z-[9999] pointer-events-auto select-none"
      style={{
        opacity: hasScrollableContent && (isVisible || isHovered || isDragging) ? 1 : 0,
        transition: "opacity 260ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
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
            ? "w-[9.5px] bg-black/55 dark:bg-white/65 shadow-[0_2px_10px_rgba(0,0,0,0.28)]"
            : "w-[6.5px] bg-black/38 dark:bg-white/45"
        }`}
        style={{
          height: "56px",
          border: "0.5px solid rgba(255, 255, 255, 0.26)",
          willChange: "transform, height, width",
        }}
      />
    </div>
  );
}
