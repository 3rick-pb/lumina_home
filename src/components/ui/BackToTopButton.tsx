"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BackToTopButtonProps {
  threshold?: number;
  className?: string;
  label?: string;
}

export function BackToTopButton({
  threshold = 600,
  className = "",
  label = "Volver arriba",
}: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const rafRef = useRef<number | null>(null);

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
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-auto select-none ${className}`}
        >
          <button
            type="button"
            onClick={scrollToTop}
            aria-label={label}
            className="group relative inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-900 dark:bg-white/90 dark:hover:bg-white text-white dark:text-zinc-900 border border-white/15 dark:border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.18)] active:scale-95 transition-transform duration-200 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-zinc-900/15 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-0.5">
              <ArrowUp className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-xs font-semibold tracking-wide">
              {label}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
