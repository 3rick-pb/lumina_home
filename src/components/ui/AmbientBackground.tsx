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
    const cat = searchParams?.get("category");
    if (cat) {
      setCategoryTheme(cat);
    }
  }, [pathname, searchParams, isAuthPage, setCategoryTheme, setTheme]);

  // Auth pages have multi-axis, continuous screensaver-style drifting fluid matte aura
  if (isAuthPage) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#faf8f5] [contain:strict] [transform:translateZ(0)]">
        {/* Screensaver Orb 1: Lumina Signature Olive / Sage */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full opacity-60 animate-screensaver-1 pointer-events-none" 
          style={{ background: "radial-gradient(circle at center, #8c9276 0%, rgba(140, 146, 118, 0) 70%)" }} 
        />
        {/* Screensaver Orb 2: Lumina Sandstone / Warm Tan */}
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[65vw] h-[65vw] rounded-full opacity-55 animate-screensaver-2 pointer-events-none" 
          style={{ background: "radial-gradient(circle at center, #d2b48c 0%, rgba(210, 180, 140, 0) 70%)" }} 
        />
        {/* Screensaver Orb 3: Lumina Champagne Cream Glow */}
        <div 
          className="absolute top-1/4 right-1/4 w-[55vw] h-[55vw] rounded-full opacity-65 animate-screensaver-3 pointer-events-none" 
          style={{ background: "radial-gradient(circle at center, #f3e7d3 0%, rgba(243, 231, 211, 0) 70%)" }} 
        />
        {/* Screensaver Orb 4: Deep Warm Slate Accent */}
        <div 
          className="absolute bottom-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full opacity-35 animate-screensaver-4 pointer-events-none" 
          style={{ background: "radial-gradient(circle at center, #686b59 0%, rgba(104, 107, 89, 0) 70%)" }} 
        />
        {/* Velvety Matte Frosted Overlay */}
        <div className="absolute inset-0 bg-white/30 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#faf9f6] [contain:strict] [transform:translateZ(0)]">
      {/* Primary Atmospheric Glow (Top Left) */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] rounded-full filter blur-[120px] opacity-45 transition-colors duration-1000 ease-out transform-gpu will-change-[background-color] pointer-events-none" 
        style={{ backgroundColor: theme.c1 }} 
      />
      {/* Secondary Atmospheric Glow (Bottom Right) */}
      <div 
        className="absolute -bottom-[15%] -right-[10%] w-[70vw] h-[70vw] rounded-full filter blur-[130px] opacity-40 transition-colors duration-1000 ease-out transform-gpu will-change-[background-color] pointer-events-none" 
        style={{ backgroundColor: theme.c2 }} 
      />
      {/* Center Ambient Hue (Adapts to Active Product/Niche) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] h-[50vw] rounded-full filter blur-[135px] opacity-35 transition-colors duration-1000 ease-out transform-gpu will-change-[background-color] pointer-events-none" 
        style={{ backgroundColor: theme.c3 }} 
      />
      {/* Fine Matte Texture Layer - Zero-cost matte veil without heavy backdrop-blur */}
      <div className="absolute inset-0 bg-[#fafafa]/40 pointer-events-none" />
    </div>
  );
}
