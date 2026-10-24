"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { getLenis } from "@/components/providers/SmoothScrollProvider";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ScrollToTop() {
  const pathname = usePathname();

  // 1. Reseteo síncrono previo a la pintura cuando cambia la ruta
  useIsomorphicLayoutEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if ("scrollRestoration" in window.history) {
          window.history.scrollRestoration = "manual";
        }

        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;

        const lenis = getLenis() || (window as unknown as { __luminaLenis?: { stop: () => void; scrollTo: (target: number, opts?: Record<string, unknown>) => void; start: () => void } }).__luminaLenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          try {
            if (typeof lenis.stop === "function") lenis.stop();
            lenis.scrollTo(0, { immediate: true });
            if (typeof lenis.start === "function") lenis.start();
          } catch {}
        }
      }
    } catch {}
  }, [pathname]);

  // 2. Interceptor anticipado de clicks en enlaces internos: resetea el scroll a 0 en el instante exacto del click
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLinkClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        const link = target?.closest?.("a");
        if (!link || !(link instanceof HTMLAnchorElement)) return;

        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank") {
          return;
        }

        // Si es un enlace de navegación interna dentro de la app
        if (link.origin === window.location.origin && link.pathname !== window.location.pathname) {
          if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
          }
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;

          const lenis = getLenis() || (window as unknown as { __luminaLenis?: { stop: () => void; scrollTo: (target: number, opts?: Record<string, unknown>) => void; start: () => void } }).__luminaLenis;
          if (lenis && typeof lenis.scrollTo === "function") {
            try {
              if (typeof lenis.stop === "function") lenis.stop();
              lenis.scrollTo(0, { immediate: true });
              if (typeof lenis.start === "function") lenis.start();
            } catch {}
          }
        }
      } catch {}
    };

    document.addEventListener("click", handleLinkClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, []);

  return null;
}
