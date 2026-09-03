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

  // Auth pages have multi-axis, continuous screensaver-style drifting fluid matte aura
  if (isAuthPage) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#faf8f5]">
        {/* Screensaver Orb 1: Lumina Signature Olive / Sage */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full filter blur-[150px] opacity-60 animate-screensaver-1" 
          style={{ backgroundColor: "#8c9276" }} 
        />
        {/* Screensaver Orb 2: Lumina Sandstone / Warm Tan */}
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[65vw] h-[65vw] rounded-full filter blur-[160px] opacity-55 animate-screensaver-2" 
          style={{ backgroundColor: "#d2b48c" }} 
        />
        {/* Screensaver Orb 3: Lumina Champagne Cream Glow */}
        <div 
          className="absolute top-1/4 right-1/4 w-[55vw] h-[55vw] rounded-full filter blur-[170px] opacity-65 animate-screensaver-3" 
          style={{ backgroundColor: "#f3e7d3" }} 
        />
        {/* Screensaver Orb 4: Deep Warm Slate Accent */}
        <div 
          className="absolute bottom-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full filter blur-[180px] opacity-35 animate-screensaver-4" 
          style={{ backgroundColor: "#686b59" }} 
        />
        {/* Velvety Matte Frosted Overlay */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[45px]" />
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
