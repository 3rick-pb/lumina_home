"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AmbientBackground() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Scroll offset state to shift ambient colors smoothly as user navigates down the page
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0) {
        setScrollProgress(Math.min(scrollY / height, 1));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAuthPage = pathname?.startsWith("/auth");

  // Soft palette definitions for Lumina branding (delicate, matte, elegant)
  let c1 = "#e7dfd5"; // Soft warm linen
  let c2 = "#dce4dc"; // Gentle sage / olive mist
  let c3 = "#eedec7"; // Soft muted champagne

  if (isAuthPage) {
    // Elegant, soothing branded ambient mood for login & register
    c1 = "#e8dfd8"; // Warm cashmere
    c2 = "#d9e2d6"; // Soft sage
    c3 = "#f0e6da"; // Pearl sand

    return (
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#fafafa] pointer-events-none transition-colors duration-1000">
        <div 
          className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] rounded-full filter blur-[160px] opacity-40 animate-ambient-float transition-colors duration-1000" 
          style={{ backgroundColor: c1 }} 
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vw] rounded-full filter blur-[180px] opacity-35 animate-ambient-drift transition-colors duration-1000" 
          style={{ backgroundColor: c2 }} 
        />
        <div 
          className="absolute top-1/3 left-1/4 w-[50vw] h-[50vw] rounded-full filter blur-[170px] opacity-30 animate-ambient-float transition-colors duration-1000" 
          style={{ backgroundColor: c3, animationDelay: "-8s" }} 
        />
        {/* Soft matte film */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[30px]" />
      </div>
    );
  }

  // Category specific gentle shades
  const category = searchParams.get("category")?.toLowerCase();

  if (category === "iluminacion") {
    c1 = "#fef3c7"; // Warm diffused amber
    c2 = "#fae8b6"; // Soft glow
    c3 = "#f3e8d2"; // Muted linen
  } else if (category === "aromaterapia") {
    c1 = "#fed7aa"; // Gentle terracotta peach
    c2 = "#f5d0c5"; // Muted clay
    c3 = "#fce7f3"; // Soft rose mist
  } else if (category === "textiles") {
    c1 = "#e9d5ff"; // Subtle lavender
    c2 = "#ede9fe"; // Soft heather
    c3 = "#f1f5f9"; // Cloud white
  } else if (category === "home office") {
    c1 = "#e0f2fe"; // Soft morning sky
    c2 = "#dbeafe"; // Pale slate
    c3 = "#e2e8f0"; // Cool pearl
  } else if (category === "gadgets") {
    c1 = "#e2e8f0"; // Pure silver
    c2 = "#cbd5e1"; // Platinum
    c3 = "#f1f5f9"; // Soft mist
  } else if (category === "almacenamiento") {
    c1 = "#e0e7ff"; // Ice crystal
    c2 = "#f3f4f6"; // Minimalist light gray
    c3 = "#ede9fe"; // Soft clean wash
  } else {
    // Dynamic Scroll response on Home / General pages:
    // As user scrolls past hero down into catalog, smoothly transition from sage/linen into warm golden/champagne tones
    if (scrollProgress > 0.6) {
      c1 = "#e8e5dc"; // Calming linen
      c2 = "#dadfc9"; // Sage leaf
      c3 = "#faedd9"; // Soft golden hour
    } else if (scrollProgress > 0.25) {
      c1 = "#f5edd8"; // Soft amber warmth
      c2 = "#dbe5dc"; // Pale sage
      c3 = "#ebdccc"; // Cashmere
    }
  }

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#fafafa] pointer-events-none transition-colors duration-1000">
      {/* Top Left Orb */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full filter blur-[150px] opacity-35 animate-ambient-float transition-colors duration-1000" 
        style={{ backgroundColor: c1 }} 
      />
      {/* Bottom Right Orb */}
      <div 
        className="absolute -bottom-[15%] -right-[10%] w-[65vw] h-[65vw] rounded-full filter blur-[170px] opacity-30 animate-ambient-drift transition-colors duration-1000" 
        style={{ backgroundColor: c2 }} 
      />
      {/* Center Subtle Atmosphere */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[45vw] rounded-full filter blur-[190px] opacity-25 transition-colors duration-1000" 
        style={{ backgroundColor: c3 }} 
      />
      {/* Micro Frosted Matte Surface */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[20px]" />
    </div>
  );
}
