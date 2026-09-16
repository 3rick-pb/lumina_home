import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fbfaf8]/80 dark:bg-[#121214]/85 backdrop-blur-xl transition-all duration-300">
      {/* Ambient background glows */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/[0.08] via-[#8c9276]/[0.09] to-amber-300/[0.06] blur-3xl pointer-events-none animate-pulse duration-1000" />
      
      {/* Center Luxury Monogram Capsule */}
      <div className="relative z-10 flex flex-col items-center gap-5 p-8 rounded-3xl border border-black/[0.04] dark:border-white/10 bg-white/70 dark:bg-[#1c1c1f]/70 shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
        {/* Animated Brand Ring */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl border-2 border-black/[0.06] dark:border-white/10" />
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-[#8c9276] dark:border-t-amber-400 animate-spin" />
          <span className="font-display font-bold text-xl text-gray-900 dark:text-white tracking-widest pl-0.5 select-none">
            L
          </span>
        </div>

        {/* Brand Caption & Minimal Progress */}
        <div className="text-center space-y-1.5">
          <p className="font-display font-semibold text-sm tracking-widest uppercase text-gray-900 dark:text-gray-100">
            Lumina
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            Cargando experiencia...
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
