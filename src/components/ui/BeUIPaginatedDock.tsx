"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

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
  onSearchClick?: () => void;
  isSearchActive?: boolean;
}

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    scale: 0.96,
  }),
};

/**
 * Apple iOS 26 Liquid Glass Floating Dock
 * - Floating pill capsule hovering above the bottom edge with refractive liquid glass material
 * - Translucent backdrop blur with dual specular highlights (inset borders)
 * - Oval glass highlight behind active tab (like Apple Music Library pill)
 * - Dedicated circular Search button on the right edge
 * - Tactile micro-page indicators and smooth horizontal swipe navigation
 */
export function BeUIPaginatedDock({
  items,
  itemsPerPage = 4,
  className = "",
  isVisible = true,
  onSearchClick,
  isSearchActive = false,
}: BeUIPaginatedDockProps) {
  const [[currentPage, direction], setPage] = useState<[number, number]>([0, 0]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const safePage = Math.min(totalPages - 1, Math.max(0, currentPage));

  const activeItem = items.find((it) => it.active);
  const activeItemId = activeItem?.id;
  const lastActiveIdRef = useRef<string | undefined>(activeItemId);

  // Sincronizar automáticamente la página activa cuando se cambia de pestaña externamente
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

    // Detectar deslizamiento horizontal de iOS (> 30px y mayor que el vertical)
    if (Math.abs(diffX) > Math.abs(diffY) * 1.2 && Math.abs(diffX) > 30) {
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
      aria-label="Navegación inferior flotante estilo Apple Music iOS 26"
      className={`fixed inset-x-0 bottom-3 sm:bottom-4 z-50 flex flex-col items-center pointer-events-none select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-16 opacity-0"
      } ${className}`}
    >
      {/* Micro-indicador superior de páginas estilo iOS (si hay más de 1 página) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-1.5 pointer-events-auto select-none px-3 py-0.5 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xs">
          {safePage > 0 && (
            <button
              type="button"
              onClick={() => setPage([safePage - 1, -1])}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors p-0.5 active:scale-90"
              title="Página anterior"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}

          <div className="flex items-center gap-1 py-0.5">
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
                    ? "w-4 bg-[#e07a3f] dark:bg-[#f59e0b] shadow-[0_0_8px_rgba(224,122,63,0.5)]"
                    : "w-1.5 bg-stone-400/50 dark:bg-stone-600 hover:bg-stone-500"
                }`}
              />
            ))}
          </div>

          {safePage < totalPages - 1 && (
            <button
              type="button"
              onClick={() => setPage([safePage + 1, 1])}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors p-0.5 active:scale-90"
              title="Página siguiente"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Contenedor Flotante iOS 26: Menú de Pestañas + Lupa Circular Externa */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-[calc(100%-1.25rem)] max-w-[420px] pointer-events-auto">
        {/* Cápsula Flotante Liquid Glass de las Pestañas */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 min-w-0 h-[64px] px-2 py-1.5 rounded-full bg-white/60 dark:bg-[#16161a]/65 backdrop-blur-3xl border border-white/75 dark:border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.15),inset_0_1.5px_2px_rgba(255,255,255,0.85),inset_0_-1px_1.5px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1.5px_2px_rgba(255,255,255,0.22),inset_0_-1px_1.5px_rgba(0,0,0,0.4)] flex items-center justify-center"
        >
          {/* Contenedor animado de pestañas por página */}
          <div className="relative w-full h-full overflow-hidden flex items-center">
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
                className="w-full grid grid-cols-4 items-center justify-items-stretch gap-1 px-1 h-full"
              >
                {currentItems.map((item) => {
                  const isActive = !!item.active;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.onClick()}
                      title={item.title || item.label}
                      className="relative w-full h-[50px] flex flex-col items-center justify-center py-1 px-0.5 rounded-full select-none group cursor-pointer focus:outline-none transition-transform duration-150 active:scale-95"
                    >
                      {/* Píldora activa plana sin sombras (simétrica y nítida) */}
                      {isActive && (
                        <motion.div
                          layoutId="beui-dock-active-pill"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          className="absolute inset-0 rounded-full bg-white dark:bg-white/20 border border-stone-200/80 dark:border-white/25 -z-0 pointer-events-none"
                        />
                      )}

                      {/* Icono con badge */}
                      <div className="relative z-10 flex items-center justify-center">
                        <div
                          className={`w-5 h-5 flex items-center justify-center transition-all duration-200 ${
                            isActive
                              ? "text-[#c25e1a] dark:text-[#f59e0b] scale-110 stroke-[2.4px]"
                              : "text-stone-700 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white"
                          }`}
                        >
                          {item.icon}
                        </div>

                        {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                          <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-black bg-[#fa2d48] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#16161a] shadow-xs">
                            {item.badgeCount > 99 ? "99+" : item.badgeCount}
                          </span>
                        )}
                      </div>

                      {/* Texto de alto contraste para lectura perfecta */}
                      <span
                        className={`relative z-10 text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-[68px] text-center transition-colors duration-200 ${
                          isActive
                            ? "text-[#c25e1a] dark:text-[#f59e0b] font-black"
                            : "text-stone-800 dark:text-stone-100 font-bold group-hover:text-stone-950 dark:group-hover:text-white"
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

        {/* Botón Circular de Búsqueda FUERA DEL MENÚ (Isla flotante simétrica en altura) */}
        {onSearchClick && (
          <button
            type="button"
            onClick={onSearchClick}
            title="Buscar pedidos, marcas o piezas..."
            aria-label="Abrir buscador"
            className={`relative w-[64px] h-[64px] rounded-full shrink-0 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group ${
              isSearchActive
                ? "bg-[#e07a3f] text-white border-2 border-white/80 shadow-[0_0_24px_rgba(224,122,63,0.6)]"
                : "bg-white/70 dark:bg-[#16161a]/70 hover:bg-white/90 dark:hover:bg-[#202026] active:bg-white/95 border border-white/80 dark:border-white/25 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.16),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-1px_1.5px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1.5px_2px_rgba(255,255,255,0.25)] text-stone-900 dark:text-stone-100"
            }`}
          >
            <Search
              className={`w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-115 stroke-[2.3px] ${
                isSearchActive
                  ? "text-white"
                  : "text-stone-800 dark:text-stone-100 group-hover:text-[#e07a3f] dark:group-hover:text-[#f59e0b]"
              }`}
            />
          </button>
        )}
      </div>
    </nav>
  );
}
