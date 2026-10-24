"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { getLenis } from "@/components/providers/SmoothScrollProvider";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ScrollToTop() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    // 1. Desactivar la restauración automática del navegador antes de pintar
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      // 2. Reset síncrono nativo a 0ms
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      // 3. Forzar detención y reseteo inmediato de Lenis si está activo
      const lenis = getLenis() || (window as unknown as { __luminaLenis?: { stop: () => void; scrollTo: (target: number, opts?: Record<string, unknown>) => void; start: () => void } }).__luminaLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        if (typeof lenis.stop === "function") lenis.stop();
        lenis.scrollTo(0, { immediate: true });
        if (typeof lenis.start === "function") lenis.start();
      }
    }
  }, [pathname]);

  return null;
}
