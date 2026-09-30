"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  HERO_SVG_LINE1_ANIMATED,
  HERO_SVG_LINE2_ANIMATED,
  HERO_SVG_LINE1_STATIC,
  HERO_SVG_LINE2_STATIC,
} from "./heroTitleData";

export function HandwrittenHeroTitle() {
  const [replayKey, setReplayKey] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReduced(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  const line1Svg = prefersReduced ? HERO_SVG_LINE1_STATIC : HERO_SVG_LINE1_ANIMATED;
  const line2Svg = prefersReduced ? HERO_SVG_LINE2_STATIC : HERO_SVG_LINE2_ANIMATED;

  return (
    <div className="relative group/title select-none">
      <h1 className="sr-only">
        Espacios diseñados para perdurar
      </h1>

      <div
        key={replayKey}
        onClick={handleReplay}
        className="cursor-pointer"
        title="Haz clic para volver a ver la animación de escritura"
      >
        {/* Línea 1: "Espacios diseñados" (Blanco) */}
        <div
          className="w-full max-w-[310px] sm:max-w-[460px] md:max-w-[580px] lg:max-w-[660px] xl:max-w-[720px] leading-none"
          dangerouslySetInnerHTML={{ __html: line1Svg }}
        />

        {/* Línea 2: "para perdurar" (Tono dorado cálido #d2b48c) */}
        <div
          className="w-full max-w-[230px] sm:max-w-[340px] md:max-w-[440px] lg:max-w-[500px] xl:max-w-[550px] -mt-1 sm:-mt-2 md:-mt-3 leading-none"
          dangerouslySetInnerHTML={{ __html: line2Svg }}
        />
      </div>
    </div>
  );
}
