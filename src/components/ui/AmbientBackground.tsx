"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAmbientStore, CATEGORY_THEMES } from "@/lib/ambientStore";

export function AmbientBackground() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setCategoryTheme, setTheme } = useAmbientStore();

  const isAuthPage = pathname?.startsWith("/auth");

  // Sync category query param if present
  useEffect(() => {
    if (isAuthPage) {
      setTheme(CATEGORY_THEMES.auth);
      return;
    }
    const cat = searchParams.get("category");
    if (cat) {
      setCategoryTheme(cat);
    }
  }, [pathname, searchParams, isAuthPage, setCategoryTheme, setTheme]);

  // Auth pages have floating drifting orbs
  if (isAuthPage) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#fbfbfa]">
        {/* Floating Orb 1: moves left-right, up-down */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] rounded-full filter blur-[150px] opacity-50 animate-ambient-float transition-colors duration-1000" 
          style={{ backgroundColor: CATEGORY_THEMES.auth.c1 }} 
        />
        {/* Floating Orb 2: drifts opposite */}
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vw] rounded-full filter blur-[170px] opacity-45 animate-ambient-drift transition-colors duration-1000" 
          style={{ backgroundColor: CATEGORY_THEMES.auth.c2 }} 
        />
        {/* Center atmospheric glow */}
        <div 
          className="absolute top-1/3 left-1/4 w-[50vw] h-[50vw] rounded-full filter blur-[160px] opacity-40 animate-ambient-float transition-colors duration-1000" 
          style={{ backgroundColor: CATEGORY_THEMES.auth.c3, animationDelay: "-8s" }} 
        />
        {/* Velvety matte film */}
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[25px]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#faf9f6]">
      {/* Primary Atmospheric Glow (Top Left) */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] rounded-full filter blur-[160px] opacity-45 transition-colors duration-1000 ease-out" 
        style={{ backgroundColor: theme.c1 }} 
      />
      {/* Secondary Atmospheric Glow (Bottom Right) */}
      <div 
        className="absolute -bottom-[15%] -right-[10%] w-[70vw] h-[70vw] rounded-full filter blur-[180px] opacity-40 transition-colors duration-1000 ease-out" 
        style={{ backgroundColor: theme.c2 }} 
      />
      {/* Center Ambient Hue (Adapts to Active Product/Niche) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] h-[50vw] rounded-full filter blur-[190px] opacity-35 transition-colors duration-1000 ease-out" 
        style={{ backgroundColor: theme.c3 }} 
      />
      {/* Fine Matte Texture Layer */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[20px]" />
    </div>
  );
}
