"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

let globalLenisInstance: Lenis | null = null;
export function getLenis(): Lenis | null {
  return globalLenisInstance;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window === "undefined") return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Exact configuration replicating the physics from Orbix Studio:
    // lerp: 0.08 produces that signature buttery, luxurious "pesadita pero suave" inertia feel.
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false, // Keeps native 120Hz touch physics on mobile/tablets
      wheelMultiplier: 1,
      touchMultiplier: 1,
      autoRaf: true, // Native Lenis ticker automatically sleeps when idle and wakes on scroll
      // Prevent Lenis from intercepting wheel/touch on nested scrollable elements:
      // modals, comboboxes, dropdowns, and any container with overflow-y: auto/scroll
      prevent: (node) => {
        if (!node) return false;
        let curr: HTMLElement | null = node as HTMLElement;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          if (
            curr.hasAttribute?.("data-lenis-prevent") ||
            curr.getAttribute?.("role") === "dialog" ||
            curr.getAttribute?.("role") === "listbox" ||
            curr.getAttribute?.("role") === "menu" ||
            curr.getAttribute?.("role") === "combobox" ||
            curr.classList?.contains("overflow-y-auto") ||
            curr.classList?.contains("overflow-auto") ||
            curr.classList?.contains("overflow-y-scroll") ||
            curr.classList?.contains("lumina-order-modal-scroll")
          ) {
            return true;
          }
          try {
            const style = window.getComputedStyle(curr);
            if (
              (style.overflowY === "auto" || style.overflowY === "scroll" || style.overflow === "auto" || style.overflow === "scroll") &&
              curr.scrollHeight > curr.clientHeight
            ) {
              return true;
            }
          } catch {}
          curr = curr.parentElement;
        }
        return false;
      },
    });

    lenisRef.current = lenis;
    globalLenisInstance = lenis;
    (window as unknown as { __luminaLenis?: Lenis }).__luminaLenis = lenis;

    // Watch for modal scroll locks (overflow: hidden on body or documentElement)
    const checkScrollLock = () => {
      const isLocked =
        document.body.style.overflow === "hidden" ||
        document.documentElement.style.overflow === "hidden" ||
        document.documentElement.classList.contains("lumina-modal-lock-scroll") ||
        document.documentElement.classList.contains("lumina-add-card-scroll-lock");
      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    const observer = new MutationObserver(checkScrollLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });

    // Safety recovery watchdog: if no modal dialog is present, ensure locks are cleared and Lenis is active
    const watchdog = setInterval(() => {
      const hasActiveModal = document.querySelector('[role="dialog"], .lumina-modal-portal');
      if (!hasActiveModal) {
        if (document.documentElement.classList.contains("lumina-modal-lock-scroll")) {
          document.documentElement.classList.remove("lumina-modal-lock-scroll");
        }
        if (
          document.body.style.overflow === "hidden" ||
          document.documentElement.style.overflow === "hidden"
        ) {
          document.body.style.removeProperty("overflow");
          document.documentElement.style.removeProperty("overflow");
          document.body.style.removeProperty("overscroll-behavior");
        }
        if (lenis.isStopped) {
          lenis.start();
        }
      }
    }, 1000);

    return () => {
      clearInterval(watchdog);
      observer.disconnect();
      lenis.destroy();
      lenisRef.current = null;
      globalLenisInstance = null;
      delete (window as unknown as { __luminaLenis?: Lenis }).__luminaLenis;
    };
  }, []);

  // When changing pages in Next.js, immediately reset scroll to top
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return <>{children}</>;
}
