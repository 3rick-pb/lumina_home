"use client";

import React from "react";
import { LuminaBrandEmblem } from "@/components/ui/LuminaBrandEmblem";
import { brandConfig } from "@/config/brand.config";

export interface BrandLoadingScreenProps {
  className?: string;
  isFixed?: boolean;
}

/**
 * Pantalla de carga unificada de la marca Lumina
 * - Muestra el emblema oficial de la marca (doble rombo geométrico) en el centro
 * - Anillo giratorio estético con acabado de lujo
 * - Indicador de progreso con brillo 'shimmer'
 * - Elimina de raíz cualquier letra 'L' o loader inconsistente en la tienda
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

      {/* Center Luxury Monogram Capsule with Official Brand Emblem */}
      <div className="relative z-10 flex flex-col items-center gap-5 p-8 rounded-3xl border border-black/[0.04] dark:border-white/10 bg-white/70 dark:bg-[#1c1c1f]/70 shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
        {/* Animated Brand Ring con efecto girando al rededor */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl border-2 border-black/[0.06] dark:border-white/10" />
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-[#8c9276] dark:border-t-amber-400 animate-spin" />
          <div className="w-10 h-10 rounded-xl bg-[#080C26] text-[#FFE4D1] border border-[#FFE4D1]/30 flex items-center justify-center shadow-md shadow-black/50 select-none">
            <LuminaBrandEmblem size={24} />
          </div>
        </div>

        {/* Brand Caption */}
        <div className="text-center space-y-1">
          <p className="font-display font-semibold text-sm tracking-widest uppercase text-gray-900 dark:text-gray-100">
            {brandConfig.shortName || "LUMINA"}
          </p>
        </div>

        {/* Shimmering Line Indicator */}
        <div className="w-32 h-[2px] bg-black/[0.06] dark:bg-white/10 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#8c9276] dark:via-amber-400 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    </div>
  );
}

export default BrandLoadingScreen;
