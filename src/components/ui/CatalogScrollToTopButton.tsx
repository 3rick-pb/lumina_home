"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDisplacementFilter } from "./LiquidGlass";

interface CatalogScrollToTopButtonProps {
  threshold?: number;
  className?: string;
  label?: string;
}

/**
 * Botón flotante "Volver arriba" con Liquid Glass real (srdavo / Apple design):
 * - Refracción óptica real mediante filtro SVG Displacement Map con aberración cromática
 * - Reflejo especular superior continuo y bisel interno Apple-style
 * - Escalado y transición física suave en hover y active
 */
export function CatalogScrollToTopButton({
  threshold = 280,
  className = "",
  label = "Volver arriba",
}: CatalogScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hasSvgFilterSupport, setHasSvgFilterSupport] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isChromium = /chrome|chromium|crios|edg/.test(ua) && !/firefox|fxios/.test(ua);
      setHasSvgFilterSupport(isChromium);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsVisible(scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  useEffect(() => {
    if (!buttonRef.current || !isVisible) return;
    const el = buttonRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);
      if (w > 0 && h > 0) {
        setDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isVisible]);

  const filterUrl = useMemo(() => {
    if (!hasSvgFilterSupport || dims.width === 0 || dims.height === 0) return null;
    return getDisplacementFilter({
      width: dims.width,
      height: dims.height,
      radius: 9999,
      depth: 4,
      strength: 24,
      chromaticAberration: 1.5,
    });
  }, [hasSvgFilterSupport, dims.width, dims.height]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    if (typeof document !== "undefined") {
      if (document.documentElement) {
        document.documentElement.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
      if (document.body) {
        document.body.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.92 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed bottom-28 sm:bottom-32 md:bottom-36 left-1/2 -translate-x-1/2 lg:bottom-28 xl:bottom-32 lg:left-8 xl:left-12 lg:translate-x-0 z-40 flex items-center justify-center pointer-events-auto ${className}`}
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={scrollToTop}
            aria-label={label}
            title={label}
            style={{
              clipPath: "inset(0 round 9999px)",
              WebkitClipPath: "inset(0 round 9999px)",
              backdropFilter: hasSvgFilterSupport && filterUrl
                ? `blur(0.8px) url('${filterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
                : "blur(16px) saturate(190%) brightness(1.10)",
              WebkitBackdropFilter: hasSvgFilterSupport && filterUrl
                ? `blur(0.8px) url('${filterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
                : "blur(16px) saturate(190%) brightness(1.10)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(240,240,248,0.24) 100%)",
              boxShadow: `
                inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.90),
                inset -1px -1px 1px 0px rgba(255, 255, 255, 0.35),
                0 10px 30px -4px rgba(0, 0, 0, 0.12)
              `,
              border: "1px solid rgba(255, 255, 255, 0.75)",
            }}
            className="group relative flex items-center gap-2 px-4 py-2.5 rounded-full text-gray-900 dark:text-white hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer select-none overflow-hidden"
          >
            {/* Reflejo especular superior característico de srdavo/liquid-glass */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full" />

            <div className="relative z-10 w-5 h-5 rounded-full bg-white/40 dark:bg-white/15 border border-white/60 dark:border-white/20 flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5 shadow-xs">
              <ArrowUp className="w-3.5 h-3.5 text-gray-950 dark:text-white stroke-[2.2]" />
            </div>
            <span className="relative z-10 text-xs font-bold tracking-tight whitespace-nowrap text-gray-950 dark:text-white drop-shadow-xs">
              {label}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
