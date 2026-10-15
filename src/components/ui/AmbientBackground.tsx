"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAmbientStore, CATEGORY_THEMES } from "@/lib/ambientStore";

export function AmbientBackground() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, isProductView, setCategoryTheme, setTheme } = useAmbientStore();

  const isAuthPage = pathname?.startsWith("/auth");

  // Sync category query param if present and not in product view
  useEffect(() => {
    if (isAuthPage) {
      setTheme(CATEGORY_THEMES.auth);
      return;
    }
    const cat = searchParams?.get("category");
    if (cat && !isProductView) {
      setCategoryTheme(cat);
    }
  }, [pathname, searchParams, isAuthPage, isProductView, setCategoryTheme, setTheme]);

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

  // 1. In Product Detail View: The ENTIRE background matches the browser toolbar color exactly!
  if (isProductView) {
    const unifiedColor = theme.browserColor || theme.c1 || "#8c9276";
    return (
      <div 
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden [contain:strict] [transform:translateZ(0)]"
        style={{
          backgroundColor: unifiedColor,
          transition: "background-color 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "background-color"
        }}
      >
        {/* Soft atmospheric depth highlight centered behind product presentation */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[65vh] rounded-full opacity-25 pointer-events-none transform-gpu"
          style={{
            background: `radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)`
          }}
        />
        {/* Fine velvety matte veil */}
        <div className="absolute inset-0 bg-white/[0.03] pointer-events-none" />
      </div>
    );
  }

  // 2. In Catalog / Home / Shop View:
  // - En celulares: Fondo mate uniforme y limpio con sutil matiz del color del navegador en modo claro (#8c9276 a intensidad muy bajita), CERO cambio gradual de color.
  // - En desktop: Fondo marfil limpio y uniforme (#FAF8F5 / #FFFFFF) sin manchas verdes invasivas ni overdraw.
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAF8F5] dark:bg-[#121214] [contain:strict] [transform:translateZ(0)]">
      {/* Capa estática mate móvil: Tono tenue derivado de #8c9276 sin transiciones graduales */}
      <div className="block md:hidden absolute inset-0 bg-[#8c9276]/[0.04] pointer-events-none" />

      {/* Capa sutil para pantallas grandes (Desktop): Suave y sin manchas verdes densas */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-transparent via-[#8c9276]/[0.02] to-transparent pointer-events-none" />
    </div>
  );
}
