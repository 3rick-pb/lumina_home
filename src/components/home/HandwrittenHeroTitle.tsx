"use client";

import React, { useEffect, useState } from "react";
import { TegakiRenderer } from "tegaki/react";
import caveatRaw from "tegaki/fonts/caveat";

// Synthesize 'ñ' in Caveat font bundle so Spanish text renders seamlessly
const caveatWithSpanish = (() => {
  if (!caveatRaw || !caveatRaw.glyphData) return caveatRaw;
  const nGlyph = caveatRaw.glyphData["n"];
  if (!nGlyph) return caveatRaw;
  
  // Create a natural curved tilde stroke positioned above 'n'
  const tildeStroke = {
    p: [
      [nGlyph.w * 0.22, 690, 14],
      [nGlyph.w * 0.44, 730, 16],
      [nGlyph.w * 0.66, 690, 16],
      [nGlyph.w * 0.88, 720, 14],
    ],
    d: nGlyph.t,
    a: 0.22,
  };

  return {
    ...caveatRaw,
    glyphData: {
      ...caveatRaw.glyphData,
      "ñ": {
        w: nGlyph.w,
        t: nGlyph.t + 0.22,
        s: [...nGlyph.s, tildeStroke],
      },
    },
  };
})();

export function HandwrittenHeroTitle() {
  const [mounted, setMounted] = useState(false);
  const [startSecondLine, setStartSecondLine] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setStartSecondLine(true);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-medium text-white leading-[1.15] sm:leading-[1.1] tracking-tight">
        Espacios diseñados <br />
        <span className="font-display italic font-bold text-[#d2b48c]">para perdurar</span>
      </h1>
    );
  }

  return (
    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-medium text-white leading-[1.15] sm:leading-[1.1] tracking-tight">
      <span className="block text-white">
        <TegakiRenderer
          font={caveatWithSpanish}
          as="span"
          time={{ mode: "uncontrolled", speed: 1.1 }}
        >
          Espacios diseñados
        </TegakiRenderer>
      </span>
      <span className="font-display italic font-bold text-[#d2b48c] block mt-0.5 sm:mt-1 min-h-[1.2em]">
        {startSecondLine ? (
          <TegakiRenderer
            font={caveatWithSpanish}
            as="span"
            time={{ mode: "uncontrolled", speed: 1.2 }}
          >
            para perdurar
          </TegakiRenderer>
        ) : (
          <span className="opacity-0 select-none">para perdurar</span>
        )}
      </span>
    </h1>
  );
}
