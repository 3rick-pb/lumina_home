"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  useAmbientStore,
  CATEGORY_THEMES,
  syncBrowserThemeColor,
  LUMINA_DEFAULT_BROWSER_COLOR,
  LUMINA_DEFAULT_BROWSER_DARK,
  LUMINA_WEB_BG_LIGHT,
  LUMINA_WEB_BG_DARK,
} from "@/lib/ambientStore";

export function AmbientBackground() {
  const pathname = usePathname();
  const { theme, isProductView, setTheme } = useAmbientStore();

  const isAuthPage = pathname?.startsWith("/auth");
  const isShopPage = pathname === "/shop" || Boolean(pathname?.startsWith("/shop"));
  const isProfilePage = pathname === "/profile" || Boolean(pathname?.startsWith("/profile"));

  useEffect(() => {
    if (isAuthPage) {
      setTheme(CATEGORY_THEMES.auth);
    }
  }, [pathname, isAuthPage, setTheme]);

  // Sincronización del color del navegador (<meta name="theme-color">)
  // Reglas:
  //   /shop     → melón #FAF1E8 (fondo exacto de la web)
  //   /profile  → azul-rosa bajito #e8edf5
  //   el resto  → verde oliva Lumina #8c9276 (igual que antes, sin scroll tracking)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isProductView) return; // En vista de producto, setProductAmbient controla el color

    const applyColor = () => {
      if (isShopPage) {
        syncBrowserThemeColor(LUMINA_WEB_BG_LIGHT, LUMINA_WEB_BG_DARK);
      } else if (isProfilePage) {
        syncBrowserThemeColor("#e8edf5", "#1a1d2e");
      } else {
        syncBrowserThemeColor(LUMINA_DEFAULT_BROWSER_COLOR, LUMINA_DEFAULT_BROWSER_DARK);
      }
    };

    applyColor();

    // Reaccionar a cambios de modo claro/oscuro
    const observer = new MutationObserver(applyColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [pathname, isProductView, isShopPage, isProfilePage]);

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
  // Fondo mate uniforme y limpio de color melón bajito (#FAF1E8 en light / #151413 en dark)
  // Sin cambios continuos al pasar el cursor para máxima estabilidad y rendimiento a 120 FPS
  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAF1E8] dark:bg-[#151413] [contain:strict] [transform:translateZ(0)]"
    >
      {/* Velo mate sutil y aterciopelado */}
      <div className="absolute inset-0 bg-white/[0.04] dark:bg-black/[0.08] pointer-events-none" />
    </div>
  );
}
