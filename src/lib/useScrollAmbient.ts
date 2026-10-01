"use client";

import { useEffect } from "react";
import { useAmbientStore } from "@/lib/ambientStore";

/**
 * Intelligent Mobile/Touch Scroll-Based Ambient Observer
 * 
 * Specifically optimized for mobile processors (e.g. MediaTek Helio G99):
 * - On desktop: Inactive (desktop preserves full smooth cursor hover).
 * - On mobile/touch: Bypasses synthetic mouse hover lag and uses native IntersectionObserver
 *   to detect which category card or section is in the foreground of the screen as the user scrolls.
 * - Smoothly updates ambient aura and browser bar theme-color without touching page background styles.
 */
export function useScrollAmbient(selector = "[data-ambient-category]", deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only activate scroll-based ambient detection on touch screens, tablets, or mobile viewports
    const isMobileOrTouchOrTablet =
      window.innerWidth < 1024 ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!isMobileOrTouchOrTablet) return;

    let rafId: number | null = null;
    let currentCategory = "";

    const handleEvaluation = () => {
      rafId = null;

      // 1. If at top of page (hero / header), reset to Lumina signature olive
      if (window.scrollY < 120) {
        if (currentCategory !== "default") {
          currentCategory = "default";
          useAmbientStore.getState().resetTheme();
        }
        return;
      }

      const viewportCenter = window.innerHeight * 0.45; // Optical center on mobile screens
      let closestCategory: string | null = null;
      let minDistance = Infinity;

      const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Element must be partially visible within viewport
        if (rect.bottom > 60 && rect.top < window.innerHeight - 60) {
          const elCenter = rect.top + rect.height / 2;
          const dist = Math.abs(elCenter - viewportCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestCategory = el.dataset.ambientCategory || null;
          }
        }
      }

      if (closestCategory && closestCategory !== currentCategory) {
        currentCategory = closestCategory;
        if (closestCategory === "default" || closestCategory === "none") {
          useAmbientStore.getState().resetTheme();
        } else {
          useAmbientStore.getState().setCategoryTheme(closestCategory);
        }
      }
    };

    const triggerEvaluation = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(handleEvaluation);
      }
    };

    // Native IntersectionObserver operates off the main thread with 0 CPU overhead
    const observer = new IntersectionObserver(
      () => triggerEvaluation(),
      {
        rootMargin: "-15% 0px -15% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    elements.forEach((el) => observer.observe(el));

    // Also attach passive scroll listener throttled with rAF so continuous smooth swipes update smoothly
    window.addEventListener("scroll", triggerEvaluation, { passive: true });

    // Initial check
    triggerEvaluation();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", triggerEvaluation);
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, ...deps]);
}
