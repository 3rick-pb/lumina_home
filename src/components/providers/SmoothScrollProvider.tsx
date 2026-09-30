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
      autoRaf: false, // We control the RAF loop cleanly
    });

    lenisRef.current = lenis;
    globalLenisInstance = lenis;
    (window as unknown as { __luminaLenis?: Lenis }).__luminaLenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Watch for modal scroll locks (overflow: hidden on body)
    const observer = new MutationObserver(() => {
      const isLocked =
        document.body.style.overflow === "hidden" ||
        document.documentElement.style.overflow === "hidden";
      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });

    return () => {
      cancelAnimationFrame(rafId);
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
