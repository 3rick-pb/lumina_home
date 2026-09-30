"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import {
  HERO_SVG_LINE1_ANIMATED,
  HERO_SVG_LINE2_ANIMATED,
  HERO_SVG_LINE1_STATIC,
  HERO_SVG_LINE2_STATIC,
} from "./heroTitleData";

export const HandwrittenHeroTitle = memo(function HandwrittenHeroTitle() {
  const [mounted, setMounted] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReduced(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mediaQuery.addEventListener("change", listener);
      setMounted(true);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  // Durante SSR y antes del montaje: renderiza el SVG estático invisible para reservar el espacio exacto (CLS=0) sin iniciar animaciones prematuras que se corten en la hidratación
  if (!mounted) {
    return (
      <div className="relative group/title select-none">
        <h1 className="sr-only">
          Espacios diseñados para perdurar
        </h1>

        <div
          className="w-full max-w-[330px] sm:max-w-[460px] md:max-w-[540px] lg:max-w-[620px] xl:max-w-[660px] opacity-0 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="w-full leading-none [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:overflow-visible [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: HERO_SVG_LINE1_STATIC }}
          />
          <div
            className="w-[79.5%] -mt-1 sm:-mt-2 md:-mt-2.5 leading-none [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:overflow-visible [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: HERO_SVG_LINE2_STATIC }}
          />
        </div>
      </div>
    );
  }

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
        className="cursor-pointer w-full max-w-[330px] sm:max-w-[460px] md:max-w-[540px] lg:max-w-[620px] xl:max-w-[660px]"
        title="Haz clic para volver a ver la animación de escritura"
      >
        {/* Línea 1: "Espacios diseñados" (Blanco) */}
        <div
          className="w-full leading-none [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:overflow-visible [&>svg]:block"
          dangerouslySetInnerHTML={{ __html: line1Svg }}
        />

        {/* Línea 2: "para perdurar" (Tono dorado cálido #d2b48c) */}
        <div
          className="w-[79.5%] -mt-1 sm:-mt-2 md:-mt-2.5 leading-none [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:overflow-visible [&>svg]:block"
          dangerouslySetInnerHTML={{ __html: line2Svg }}
        />
      </div>
    </div>
  );
});

