"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CatalogScrollToTopButtonProps {
  threshold?: number;
  className?: string;
  label?: string;
}

/**
 * Botón flotante centrado en la parte inferior de la pantalla para volver
 * a la parte superior del catálogo (celulares, tablets y PC/Laptop).
 */
export function CatalogScrollToTopButton({
  threshold = 280,
  className = "",
  label = "Volver arriba",
}: CatalogScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsVisible(scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

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
          className={`fixed left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-auto ${className}`}
        >
          <button
            type="button"
            onClick={scrollToTop}
            aria-label={label}
            title={label}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/95 dark:bg-[#1e1e20]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 text-gray-900 dark:text-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:bg-gray-50 dark:hover:bg-[#28282b] hover:shadow-[0_12px_32px_rgba(0,0,0,0.16)] active:scale-95 transition-all duration-200 cursor-pointer select-none"
          >
            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5">
              <ArrowUp className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
            </div>
            <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
              {label}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
