"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BeUIDockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badgeCount?: number;
  onClick: () => void;
  title?: string;
  href?: string;
}

export interface BeUIPaginatedDockProps {
  items: BeUIDockItem[];
  itemsPerPage?: number;
  className?: string;
  isVisible?: boolean;
}

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.98,
  }),
};

/**
 * Apple Music Style Bottom Tab Bar
 * - Docked 100% edge-to-edge at the bottom with frosted glass material (UIBlurEffect)
 * - Safe area aware for modern mobile screens (env(safe-area-inset-bottom))
 * - Native iOS TabBar typography, icon centering and vibrant active highlight
 * - Smooth multi-page swipe gesture and tactile micro-segmented page navigation
 */
export function BeUIPaginatedDock({
  items,
  itemsPerPage = 4,
  className = "",
  isVisible = true,
}: BeUIPaginatedDockProps) {
  const [[currentPage, direction], setPage] = useState<[number, number]>([0, 0]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const safePage = Math.min(totalPages - 1, Math.max(0, currentPage));

  const activeItem = items.find((it) => it.active);
  const activeItemId = activeItem?.id;
  const lastActiveIdRef = useRef<string | undefined>(activeItemId);

  // Sincronizar automáticamente la página activa cuando se cambia de pestaña
  useEffect(() => {
    if (activeItemId && activeItemId !== lastActiveIdRef.current) {
      lastActiveIdRef.current = activeItemId;
      const activeIndex = items.findIndex((it) => it.id === activeItemId);
      if (activeIndex !== -1) {
        const targetPage = Math.floor(activeIndex / itemsPerPage);
        if (targetPage >= 0 && targetPage < totalPages && targetPage !== safePage) {
          setPage([targetPage, targetPage > safePage ? 1 : -1]);
        }
      }
    }
  }, [activeItemId, itemsPerPage, totalPages, safePage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touchStartRef.current.x - touch.clientX;
    const diffY = touchStartRef.current.y - touch.clientY;

    // Detectar deslizamiento horizontal nativo de iOS (> 35px y mayor que el vertical)
    if (Math.abs(diffX) > Math.abs(diffY) * 1.3 && Math.abs(diffX) > 35) {
      if (diffX > 0 && safePage < totalPages - 1) {
        setPage([safePage + 1, 1]);
      } else if (diffX < 0 && safePage > 0) {
        setPage([safePage - 1, -1]);
      }
    }
    touchStartRef.current = null;
  };

  const pages: BeUIDockItem[][] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(items.slice(i * itemsPerPage, (i + 1) * itemsPerPage));
  }

  const currentItems = pages[safePage] || [];

  return (
    <nav
      role="navigation"
      aria-label="Navegación inferior estilo Apple Music"
      className={`fixed inset-x-0 bottom-0 z-50 w-full select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
      } ${className}`}
    >
      {/* Barra de menú inferior docked estilo Apple Music con material translúcido */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full bg-white/85 dark:bg-[#121214]/85 backdrop-blur-2xl border-t border-stone-200/80 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] flex flex-col items-center"
      >
        {/* Micro-indicador superior de páginas estilo iOS (si hay más de 1 página) */}
        {totalPages > 1 && (
          <div className="w-full px-4 mb-1 flex items-center justify-between pointer-events-auto">
            {/* Botón flecha izquierda para cambiar página rápido */}
            <button
              type="button"
              onClick={() => {
                if (safePage > 0) setPage([safePage - 1, -1]);
              }}
              disabled={safePage === 0}
              className={`p-1 rounded-full transition-opacity active:scale-90 ${
                safePage === 0 ? "opacity-0 pointer-events-none" : "text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
              title="Página anterior"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Píldoras / Dots indicadores de página estilo Apple */}
            <div className="flex items-center gap-1.5 py-0.5">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (idx !== safePage) {
                      setPage([idx, idx > safePage ? 1 : -1]);
                    }
                  }}
                  title={`Página ${idx + 1}`}
                  aria-label={`Ir a página ${idx + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                    safePage === idx
                      ? "w-5 bg-[#e07a3f] dark:bg-[#f59e0b] shadow-[0_0_8px_rgba(224,122,63,0.4)]"
                      : "w-1.5 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400 dark:hover:bg-stone-600"
                  }`}
                />
              ))}
            </div>

            {/* Botón flecha derecha para cambiar página rápido */}
            <button
              type="button"
              onClick={() => {
                if (safePage < totalPages - 1) setPage([safePage + 1, 1]);
              }}
              disabled={safePage >= totalPages - 1}
              className={`p-1 rounded-full transition-opacity active:scale-90 ${
                safePage >= totalPages - 1 ? "opacity-0 pointer-events-none" : "text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
              title="Página siguiente"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Contenedor animado de pestañas por página */}
        <div className="relative w-full max-w-lg px-2 overflow-hidden min-h-[48px] flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={safePage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 420, damping: 36, mass: 0.8 },
                opacity: { duration: 0.16, ease: "easeOut" },
              }}
              className="w-full grid grid-cols-4 items-center justify-items-center"
            >
              {currentItems.map((item) => {
                const isActive = !!item.active;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.onClick()}
                    title={item.title || item.label}
                    className="relative w-full h-12 flex flex-col items-center justify-center py-1 px-1 rounded-xl select-none group cursor-pointer focus:outline-none transition-transform duration-150 active:scale-90"
                  >
                    {/* Icono con badge */}
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`w-5 h-5 flex items-center justify-center transition-colors duration-200 ${
                          isActive
                            ? "text-[#e07a3f] dark:text-[#f59e0b] scale-105"
                            : "text-stone-500 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200"
                        }`}
                      >
                        {item.icon}
                      </div>

                      {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                        <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-black bg-[#fa2d48] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#121214] shadow-xs">
                          {item.badgeCount > 99 ? "99+" : item.badgeCount}
                        </span>
                      )}
                    </div>

                    {/* Texto estilo Apple Music (San Francisco Typography) */}
                    <span
                      className={`text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-[70px] text-center transition-colors duration-200 ${
                        isActive
                          ? "text-[#e07a3f] dark:text-[#f59e0b] font-bold"
                          : "text-stone-500 dark:text-stone-400 font-medium group-hover:text-stone-800 dark:group-hover:text-stone-200"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}

              {/* Espacios vacíos simétricos si la última página tiene menos de 4 elementos */}
              {Array.from({ length: Math.max(0, itemsPerPage - currentItems.length) }).map(
                (_, i) => (
                  <div
                    key={`empty-slot-${i}`}
                    className="w-full h-12 pointer-events-none"
                    aria-hidden="true"
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
