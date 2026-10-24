"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getLenis } from "@/components/providers/SmoothScrollProvider";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function forceResetScroll() {
  if (typeof window === "undefined") return;

  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // 1. Reseteo instantáneo del DOM nativo
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // 2. Reseteo coordinado del motor Lenis (virtual coords + RAF target)
    const lenis = getLenis() || (window as unknown as { __luminaLenis?: Record<string, unknown> }).__luminaLenis;
    if (lenis) {
      if (typeof (lenis as { stop?: () => void }).stop === "function") {
        (lenis as { stop: () => void }).stop();
      }
      if (typeof (lenis as { scrollTo?: (t: number, opts: Record<string, unknown>) => void }).scrollTo === "function") {
        (lenis as { scrollTo: (t: number, opts: Record<string, unknown>) => void }).scrollTo(0, { immediate: true, force: true });
      }
      (lenis as { scroll?: number }).scroll = 0;
      (lenis as { targetScroll?: number }).targetScroll = 0;
      (lenis as { animatedScroll?: number }).animatedScroll = 0;
      if (typeof (lenis as { start?: () => void }).start === "function") {
        (lenis as { start: () => void }).start();
      }
      if (typeof (lenis as { resize?: () => void }).resize === "function") {
        (lenis as { resize: () => void }).resize();
      }
    }
  } catch {}
}

export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() || "";

  // 1. Reseteo sincrónico previo al repintado de pantalla en cambios de ruta y parámetros de búsqueda
  useIsomorphicLayoutEffect(() => {
    forceResetScroll();
  }, [pathname, searchString]);

  // 2. Interceptación síncrona en el nivel de History API (pushState / replaceState / popstate)
  // Next.js App Router invoca pushState al iniciar la navegación del cliente, mucho antes de pintar la nueva vista.
  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as unknown as { __luminaForceScrollTop?: () => void }).__luminaForceScrollTop = forceResetScroll;

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function (...args: Parameters<History["pushState"]>) {
      const url = args[2];
      if (url) {
        forceResetScroll();
      }
      return originalPushState(...args);
    };

    window.history.replaceState = function (...args: Parameters<History["replaceState"]>) {
      const url = args[2];
      if (url) {
        forceResetScroll();
      }
      return originalReplaceState(...args);
    };

    const handlePopState = () => {
      forceResetScroll();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // 3. Interceptor anticipado en fase de captura para clicks en cualquier enlace interno (incluyendo nichos con query params)
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

        // Si es un enlace de navegación interna dentro de la app (sea diferente ruta o diferente filtro query)
        if (link.origin === window.location.origin) {
          const currentFull = window.location.pathname + window.location.search;
          const targetFull = link.pathname + link.search;
          if (currentFull !== targetFull) {
            forceResetScroll();
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
