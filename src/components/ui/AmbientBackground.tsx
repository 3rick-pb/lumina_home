"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAmbientStore, CATEGORY_THEMES } from "@/lib/ambientStore";

export function AmbientBackground() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, isProductView, setCategoryTheme, setTheme } = useAmbientStore();
  
  // Detección robusta de cursor / ratón:
  // - Laptops / Desktops (pantallas >= 768px o cualquier fine pointer/hover) -> true por defecto
  // - Si se detecta cualquier movimiento de ratón/trackpad -> se activa true inmediatamente
  // - Solo en móviles táctiles (< 768px estrictamente táctiles) se mantiene false (fondo mate estático suave)
  const [hasMouse, setHasMouse] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isDesktop = window.innerWidth >= 768;
    const hasFine = window.matchMedia("(any-pointer: fine), (any-hover: hover)").matches;

    if (!isDesktop && !hasFine) {
      setHasMouse(false);
    } else {
      setHasMouse(true);
    }

    const onPointerActivity = (e: MouseEvent | PointerEvent) => {
      if ("pointerType" in e && e.pointerType === "touch") return;
      setHasMouse(true);
    };

    window.addEventListener("pointermove", onPointerActivity, { passive: true });
    window.addEventListener("mousemove", onPointerActivity, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerActivity);
      window.removeEventListener("mousemove", onPointerActivity);
    };
  }, []);

  const isAuthPage = pathname?.startsWith("/auth");

  // Sincronizar parámetro category si existe y no es vista de producto
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

  // Auth pages screensaver
  if (isAuthPage) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#faf8f5] [contain:strict] [transform:translateZ(0)]">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full opacity-60 animate-screensaver-1 pointer-events-none" 
          style={{ background: "radial-gradient(circle at center, #8c9276 0%, rgba(140, 146, 118, 0) 70%)" }} 
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[65vw] h-[65vw] rounded-full opacity-55 animate-screensaver-2 pointer-events-none" 
          style={{ background: "radial-gradient(circle at center, #d2b48c 0%, rgba(210, 180, 140, 0) 70%)" }} 
        />
        <div 
          className="absolute top-1/4 right-1/4 w-[55vw] h-[55vw] rounded-full opacity-65 animate-screensaver-3 pointer-events-none" 
          style={{ background: "radial-gradient(circle at center, #f3e7d3 0%, rgba(243, 231, 211, 0) 70%)" }} 
        />
        <div 
          className="absolute bottom-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full opacity-35 animate-screensaver-4 pointer-events-none" 
          style={{ background: "radial-gradient(circle at center, #686b59 0%, rgba(104, 107, 89, 0) 70%)" }} 
        />
        <div className="absolute inset-0 bg-white/30 pointer-events-none" />
      </div>
    );
  }

  // Vista de producto: el fondo unificado exacto
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
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[65vh] rounded-full opacity-25 pointer-events-none transform-gpu"
          style={{
            background: `radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)`
          }}
        />
        <div className="absolute inset-0 bg-white/[0.03] pointer-events-none" />
      </div>
    );
  }

  // Vista Catálogo / Home / Shop:
  // CASO A: Laptop / Desktop / Tablet con ratón
  // Auras atmosféricas visibles que cambian suavemente de color al pasar el cursor sobre productos y categorías.
  //
  // CASO B: Celulares táctiles sin ratón
  // Fondo mate uniforme derivado de #8c9276 a intensidad muy bajita, sin ningún cambio gradual de color.
  const showInteractiveGlows = hasMouse;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAF8F5] dark:bg-[#121214] [contain:strict] [transform:translateZ(0)]">
      {showInteractiveGlows ? (
        <>
          {/* Primary Atmospheric Glow (Top Left) */}
          <div 
            className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] rounded-full opacity-55 transform-gpu pointer-events-none" 
            style={{ 
              backgroundColor: theme.c1,
              transition: "background-color 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "background-color",
              WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)",
              maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)"
            }} 
          />
          {/* Secondary Atmospheric Glow (Bottom Right) */}
          <div 
            className="absolute -bottom-[15%] -right-[10%] w-[75vw] h-[75vw] rounded-full opacity-50 transform-gpu pointer-events-none" 
            style={{ 
              backgroundColor: theme.c2,
              transition: "background-color 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "background-color",
              WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)",
              maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)"
            }} 
          />
          {/* Center Ambient Hue */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[55vw] rounded-full opacity-45 transform-gpu pointer-events-none" 
            style={{ 
              backgroundColor: theme.c3,
              transition: "background-color 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "background-color",
              WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)",
              maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)"
            }} 
          />
          {/* Velo mate suave para fusionar los tonos */}
          <div className="absolute inset-0 bg-[#FAF8F5]/35 dark:bg-[#121214]/40 pointer-events-none" />
        </>
      ) : (
        /* Fondo mate estático en celulares táctiles: Tono derivado de #8c9276 a intensidad muy bajita */
        <div className="absolute inset-0 bg-[#8c9276]/[0.035] pointer-events-none" />
      )}
    </div>
  );
}
