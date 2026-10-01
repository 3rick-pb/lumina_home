"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAmbientStore, CATEGORY_THEMES } from "@/lib/ambientStore";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";

function syncBrowserThemeColor(color: string) {
  if (typeof document === "undefined") return;

  // 1. Direct root background-color styling (vital for Safari 16-18+ live observer)
  try {
    document.documentElement.style.backgroundColor = color;
    if (document.body) {
      document.body.style.backgroundColor = color;
    }
  } catch {}

  // 2. Primary W3C standard: meta[name="theme-color"]
  // Remove existing media-query restricted tags to avoid getting overridden by OS dark/light mode
  try {
    const existingMetas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    existingMetas.forEach((meta) => meta.remove());

    const newMeta = document.createElement("meta");
    newMeta.name = "theme-color";
    newMeta.content = color;
    document.head.appendChild(newMeta);
  } catch {}

  // 3. Apple-specific status bar style
  try {
    let appleMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement("meta");
      appleMeta.name = "apple-mobile-web-app-status-bar-style";
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute("content", "default");
  } catch {}

  // 4. Microsoft Windows / Tile / Navigation button color
  try {
    let msMeta = document.querySelector<HTMLMetaElement>('meta[name="msapplication-navbutton-color"]');
    if (!msMeta) {
      msMeta = document.createElement("meta");
      msMeta.name = "msapplication-navbutton-color";
      document.head.appendChild(msMeta);
    }
    msMeta.setAttribute("content", color);
  } catch {}
}

export function AmbientBackground() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setCategoryTheme, setTheme } = useAmbientStore();
  const themeMode = useThemeStore((state) => state.mode);
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

  // Synchronize native browser UI bar with ambient scene color (Android Chrome & iOS/macOS Safari)
  useEffect(() => {
    let targetColor = theme.browserColor || "#faf9f6";

    if (isAuthPage) {
      targetColor = "#faf8f5";
    } else if (pathname?.startsWith("/profile")) {
      const resolved = getResolvedTheme(themeMode);
      targetColor = resolved === "dark" ? "#161618" : "#faf9f6";
    }

    syncBrowserThemeColor(targetColor);
  }, [theme, isAuthPage, pathname, themeMode]);

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
        className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] rounded-full opacity-50 transform-gpu pointer-events-none" 
        style={{ 
          backgroundColor: theme.c1,
          transition: "background-color 1.6s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "background-color",
          WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 70%)",
          maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 70%)"
        }} 
      />
      {/* Secondary Atmospheric Glow (Bottom Right) */}
      <div 
        className="absolute -bottom-[15%] -right-[10%] w-[70vw] h-[70vw] rounded-full opacity-45 transform-gpu pointer-events-none" 
        style={{ 
          backgroundColor: theme.c2,
          transition: "background-color 1.6s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "background-color",
          WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 70%)",
          maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 70%)"
        }} 
      />
      {/* Center Ambient Hue (Adapts to Active Product/Niche) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] h-[50vw] rounded-full opacity-40 transform-gpu pointer-events-none" 
        style={{ 
          backgroundColor: theme.c3,
          transition: "background-color 1.6s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "background-color",
          WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 70%)",
          maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 70%)"
        }} 
      />
      {/* Fine Matte Texture Layer - Zero-cost matte veil without heavy backdrop-blur */}
      <div className="absolute inset-0 bg-[#fafafa]/40 pointer-events-none" />
    </div>
  );
}
