"use client";

import React, { useEffect, Suspense } from "react";
import type Lenis from "lenis";
import { usePathname, useSearchParams } from "next/navigation";
import { SmoothScroll, useSmoothScroll } from "@/components/motion/smooth-scroll";

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

let globalLenisInstance: Lenis | null = null;
export function getLenis(): Lenis | null {
  return globalLenisInstance;
}

function SmoothScrollSync() {
  const { lenis } = useSmoothScroll();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() || "";

  useEffect(() => {
    globalLenisInstance = lenis;
    if (typeof window !== "undefined") {
      (window as unknown as { __luminaLenis?: Lenis | null }).__luminaLenis = lenis;
    }
  }, [lenis]);

  // When changing pages or search filters in Next.js, immediately reset scroll to top
  useEffect(() => {
    if (lenis) {
      try {
        if (typeof lenis.stop === "function") lenis.stop();
        lenis.scrollTo(0, { immediate: true, force: true });
        (lenis as unknown as { scroll?: number }).scroll = 0;
        (lenis as unknown as { targetScroll?: number }).targetScroll = 0;
        (lenis as unknown as { animatedScroll?: number }).animatedScroll = 0;
        if (typeof lenis.start === "function") lenis.start();
        if (typeof lenis.resize === "function") lenis.resize();
      } catch {}
    }
  }, [pathname, searchString, lenis]);

  return null;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  return (
    <SmoothScroll root lerp={0.08} duration={1.2} wheelMultiplier={1} touch={false}>
      <Suspense fallback={null}>
        <SmoothScrollSync />
      </Suspense>
      {children}
    </SmoothScroll>
  );
}
