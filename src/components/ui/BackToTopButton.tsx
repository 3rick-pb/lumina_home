"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDisplacementFilter } from "./LiquidGlass";

interface BackToTopButtonProps {
  threshold?: number;
  className?: string;
  label?: string;
}

/**
 * Botón flotante "+ Volver arriba" aislado en la raíz del viewport:
 * - Liquid Glass Real Negro Apple-style (refracción SVG displacement + bisel especular)
 * - Cero re-renders en el scroll del catálogo gracias a listener pasivo con rAF
 * - Posicionado en la raíz (fixed bottom-6 left-1/2 -translate-x-1/2 z-40) para nunca romperse ni meterse en las tarjetas
 */
export function BackToTopButton({
  threshold = 600,
  className = "",
  label = "Volver arriba",
}: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const rafRef = useRef<number | null>(null);

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
    if (typeof window === "undefined") return;

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const shouldShow = scrollY > threshold;
        if (shouldShow !== isVisibleRef.current) {
          isVisibleRef.current = shouldShow;
          setIsVisible(shouldShow);
        }
      });
    };

    // Initial check
    const initialScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    if (initialScrollY > threshold) {
      isVisibleRef.current = true;
      setIsVisible(true);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
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
      strength: 22,
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
          className={`fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 lg:bottom-28 xl:bottom-32 lg:left-8 xl:left-12 lg:translate-x-0 z-40 flex items-center justify-center pointer-events-auto select-none ${className}`}
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
                : "blur(18px) saturate(190%) brightness(1.10)",
              WebkitBackdropFilter: hasSvgFilterSupport && filterUrl
                ? `blur(0.8px) url('${filterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
                : "blur(18px) saturate(190%) brightness(1.10)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(245,245,250,0.58) 100%)",
              boxShadow: `
                inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.95),
                inset -1px -1px 1px 0px rgba(255, 255, 255, 0.40),
                0 10px 30px -4px rgba(0, 0, 0, 0.12)
              `,
              border: "0.9px solid #18181b",
            }}
            className="group relative flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-zinc-900 hover:scale-[1.03] active:scale-95 transition-transform duration-200 cursor-pointer select-none overflow-hidden"
          >
            {/* Reflejo especular superior característico de srdavo/liquid-glass */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/60 via-white/15 to-transparent rounded-full" />

            <div className="relative z-10 w-5 h-5 rounded-full bg-white/50 border border-white/70 flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5 shadow-2xs">
              <ArrowUp className="w-3.5 h-3.5 text-zinc-900 stroke-[2.4]" />
            </div>
            <span className="relative z-10 text-xs font-bold tracking-tight whitespace-nowrap text-zinc-900 drop-shadow-xs">
              {label}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
