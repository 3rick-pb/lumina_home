"use client";

import React from "react";
import { ThinkingOrb } from "thinking-orbs";

export interface BrandLoadingScreenProps {
  className?: string;
  isFixed?: boolean;
}

/**
 * Pantalla de carga unificada de la marca Lumina con ThinkingOrb en tinta negra de alto contraste
 */
export function BrandLoadingScreen({
  className = "",
  isFixed = true,
}: BrandLoadingScreenProps) {
  const containerClass = isFixed
    ? "fixed inset-0 z-[9999]"
    : "relative w-full min-h-[70vh]";

  return (
    <div
      className={`${containerClass} flex items-center justify-center bg-[#fbfaf8] dark:bg-[#121214] transition-all duration-300 select-none ${className}`}
    >
      {/* Ambient background glows */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/[0.08] via-[#8c9276]/[0.09] to-amber-300/[0.06] blur-3xl pointer-events-none animate-pulse duration-1000" />

      {/* Center ThinkingOrb in large, prominent size (+50% larger for deep visual appreciation) */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <ThinkingOrb 
          state="working" 
          size={64} 
          color="#000000" 
          theme="light" 
          style={{ width: 132, height: 132 }} 
        />
      </div>
    </div>
  );
}

export default BrandLoadingScreen;
