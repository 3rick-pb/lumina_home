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
 * Botón flotante circular "Volver arriba" (flecha única):
 * - Se acciona ESTRICTAMENTE al dar click (sin disparos accidentales en scroll/touch)
 * - Diseño Liquid Glass Apple-style (refracción SVG displacement + bisel especular)
 * - Posición aislada en la raíz con cero re-renders innecesarios
 */
export function BackToTopButton({
  threshold = 600,
  className = "",
  label = "Volver al inicio",
}: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 48, height: 48 });
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
    if (typeof window !== "undefined") {
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
    }
  }, [threshold]);

  useEffect(() => {
    if (!buttonRef.current || !isVisible) return;
    const el = buttonRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.ceil(rect.width) || 48;
      const h = Math.ceil(rect.height) || 48;
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

  const scrollToTop = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Desplazamiento ultra suave con Lenis si está activo
    const lenis =
      typeof window !== "undefined"
        ? (window as unknown as { __luminaLenis?: { scrollTo: (target: number, opts?: Record<string, unknown>) => void } }).__luminaLenis
        : null;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { duration: 1.2, immediate: false });
    }

    // 2. Respaldo nativo suave
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
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: "transform", transform: "translateZ(0)" }}
          className={`fixed bottom-24 sm:bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 lg:bottom-24 xl:bottom-28 lg:left-8 xl:left-12 lg:translate-x-0 z-40 flex items-center justify-center pointer-events-auto select-none ${className}`}
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={scrollToTop}
            aria-label={label}
            title={label}
            style={{
              clipPath: "circle(50% at 50% 50%)",
              WebkitClipPath: "circle(50% at 50% 50%)",
              backdropFilter: hasSvgFilterSupport && filterUrl
                ? `blur(0.8px) url('${filterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
                : "blur(18px) saturate(190%) brightness(1.10)",
              WebkitBackdropFilter: hasSvgFilterSupport && filterUrl
                ? `blur(0.8px) url('${filterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
                : "blur(18px) saturate(190%) brightness(1.10)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(245,245,250,0.65) 100%)",
              boxShadow: `
                inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.95),
                inset -1px -1px 1px 0px rgba(255, 255, 255, 0.40),
                0 10px 30px -4px rgba(0, 0, 0, 0.16)
              `,
              border: "1px solid #18181b",
            }}
            className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0 flex items-center justify-center text-zinc-900 [@media(hover:hover)]:hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer select-none overflow-hidden touch-manipulation shadow-lg"
          >
            {/* Reflejo especular superior característico de Liquid Glass */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-70 bg-gradient-to-b from-white/70 via-white/20 to-transparent rounded-full" />

            {/* Ícono de flecha hacia arriba */}
            <ArrowUp className="w-5 h-5 text-zinc-900 stroke-[2.4] transition-transform duration-200 group-hover:-translate-y-0.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
