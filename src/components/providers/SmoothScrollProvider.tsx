"use client";

import React, { useEffect } from "react";
import type Lenis from "lenis";
import { usePathname } from "next/navigation";
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

  useEffect(() => {
    globalLenisInstance = lenis;
    if (typeof window !== "undefined") {
      (window as unknown as { __luminaLenis?: Lenis | null }).__luminaLenis = lenis;
    }
  }, [lenis]);

  // When changing pages in Next.js, immediately reset scroll to top
  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname, lenis]);

  return null;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  return (
    <SmoothScroll root lerp={0.08} duration={1.2} wheelMultiplier={1} touch={false}>
      <SmoothScrollSync />
      {children}
    </SmoothScroll>
  );
}
