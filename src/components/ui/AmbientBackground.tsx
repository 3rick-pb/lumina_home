"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AmbientBackground() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // No ambient background on auth pages to keep them clean
  if (pathname.includes("/auth")) return null;

  // Dynamic colors based on URL or category
  let color1 = "#d2b48c"; // Tan
  let color2 = "#8c9276"; // Olive
  let color3 = "#e1ad01"; // Mustard

  const category = searchParams.get("category");
  if (category) {
    if (category === "iluminacion") { color1 = "#fef08a"; color2 = "#fde047"; color3 = "#eab308"; } // Yellows
    if (category === "textiles") { color1 = "#f3e8ff"; color2 = "#d8b4fe"; color3 = "#c084fc"; } // Purples
    if (category === "aromaterapia") { color1 = "#ffedd5"; color2 = "#fdba74"; color3 = "#fb923c"; } // Oranges
    if (category === "home office") { color1 = "#e0f2fe"; color2 = "#7dd3fc"; color3 = "#38bdf8"; } // Blues
    if (category === "gadgets") { color1 = "#f1f5f9"; color2 = "#cbd5e1"; color3 = "#94a3b8"; } // Grays/Silvers
  }

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#fafafa] pointer-events-none transition-colors duration-1000">
      <div 
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[150px] opacity-30 animate-pulse transition-colors duration-1000" 
        style={{ backgroundColor: color1, animationDuration: '10s' }} 
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 transition-colors duration-1000" 
        style={{ backgroundColor: color2 }} 
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vw] rounded-full mix-blend-multiply filter blur-[200px] opacity-[0.15] transition-colors duration-1000" 
        style={{ backgroundColor: color3 }} 
      />
    </div>
  );
}
