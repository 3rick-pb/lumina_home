"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "@/components/ui/LiquidGlass";
import { LiquidScrubberNav } from "@/components/ui/LiquidScrubberNav";

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
  itemsPerPage = 3,
  className = "",
  isVisible = true,
  onSearchClick,
  isSearchActive = false,
}: BeUIPaginatedDockProps) {
  const [[currentPage, direction], setPage] = useState<[number, number]>([0, 0]);

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
        <LiquidGlass
          radius={9999}
          depth={3}
          strength={16}
          chromaticAberration={1.0}
          blur={1.2}
          overflow="hidden"
          className="flex items-center justify-center gap-1.5 mb-1.5 pointer-events-auto select-none px-3 py-0.5 rounded-full bg-white/40 dark:bg-black/40 border border-white/40 dark:border-white/10 shadow-xs"
        >
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
                    : "w-1.5 bg-stone-400/50 dark:stone-600 hover:bg-stone-500"
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
        </LiquidGlass>
      )}

      {/* Contenedor Flotante iOS: Menú de Pestañas + Lupa Circular Externa */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-[calc(100%-1.25rem)] max-w-[420px] pointer-events-auto">
        {/* Cápsula Flotante Liquid Glass de las Pestañas */}
        <LiquidGlass
          radius={9999}
          depth={5}
          strength={28}
          chromaticAberration={1.8}
          blur={1.5}
          overflow="visible"
          className="flex-1 min-w-0 h-[56px] p-[2px] rounded-full border border-white/80 dark:border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.15)] bg-white/50 dark:bg-[#16161a]/60 flex items-center justify-center relative"
        >
          {/* Contenedor animado de pestañas por página */}
          <div className="relative w-full h-full overflow-visible flex items-center">
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
                className="w-full h-full flex items-center justify-center overflow-visible"
              >
                <LiquidScrubberNav
                  items={currentItems}
                  activeId={activeItemId || ""}
                  variant="dock"
                  className="w-full h-full"
                  activeColor="text-black dark:text-white"
                  gridCols={itemsPerPage}
                  onSwipePage={(dir) => {
                    if (dir === 1 && safePage < totalPages - 1) {
                      setPage([safePage + 1, 1]);
                    } else if (dir === -1 && safePage > 0) {
                      setPage([safePage - 1, -1]);
                    }
                  }}
                  onSelect={(id, item) => {
                    item.onClick?.();
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </LiquidGlass>

        {/* Botón Circular de Búsqueda FUERA DEL MENÚ (Isla flotante Liquid Glass) */}
        {onSearchClick && (
          <LiquidGlassButton
            type="button"
            onClick={onSearchClick}
            radius={9999}
            depth={5}
            strength={28}
            chromaticAberration={1.8}
            blur={1.5}
            title="Buscar pedidos, marcas o piezas..."
            aria-label="Abrir buscador"
            className={`relative w-[56px] h-[56px] rounded-full shrink-0 flex items-center justify-center border border-white/80 dark:border-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.16)] transition-all duration-300 active:scale-90 group ${
              isSearchActive
                ? "bg-[#e07a3f] text-white border-2 border-white/90 shadow-[0_0_24px_rgba(224,122,63,0.6)]"
                : "bg-white/55 dark:bg-[#16161a]/65 text-stone-900 dark:text-stone-100"
            }`}
          >
            <Search
              className={`w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-115 stroke-[2.3px] ${
                isSearchActive
                  ? "text-white"
                  : "text-stone-800 dark:text-stone-100 group-hover:text-[#e07a3f] dark:group-hover:text-[#f59e0b]"
              }`}
            />
          </LiquidGlassButton>
        )}
      </div>
    </nav>
  );
}
