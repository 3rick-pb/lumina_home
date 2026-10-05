"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    scale: 0.97,
  }),
};

const getItemIconAnimation = (id: string) => {
  switch (id) {
    case "overview":
      return "group-hover:scale-120 group-hover:rotate-6 group-hover:-translate-y-0.5 group-active:scale-90";
    case "orders":
      return "group-hover:scale-120 group-hover:-translate-y-1 group-active:scale-90";
    case "cards":
      return "group-hover:scale-120 group-hover:-rotate-12 group-hover:-translate-y-0.5 group-active:scale-90";
    case "favorites":
      return "group-hover:scale-125 group-hover:text-rose-500 group-hover:-translate-y-0.5 group-active:scale-90";
    case "loyalty":
      return "group-hover:scale-120 group-hover:rotate-6 group-hover:-translate-y-0.5 group-active:scale-90";
    case "catalog":
      return "group-hover:scale-120 group-hover:-translate-y-1 group-active:scale-90";
    case "niches":
      return "group-hover:scale-120 group-hover:rotate-6 group-hover:-translate-y-1 group-active:scale-90";
    case "analytics":
      return "group-hover:scale-120 group-hover:rotate-90 group-hover:text-amber-500 group-active:scale-90";
    case "cart_alerts":
      return "group-hover:scale-120 group-hover:rotate-12 group-hover:-translate-y-0.5 group-active:scale-90";
    case "integrations":
      return "group-hover:scale-120 group-hover:rotate-6 group-hover:-translate-y-0.5 group-active:scale-90";
    case "settings":
      return "group-hover:scale-120 group-hover:rotate-90 group-hover:-translate-y-0.5 group-active:scale-90";
    case "store":
      return "group-hover:scale-120 group-hover:-translate-y-0.5 group-active:scale-90";
    default:
      return "group-hover:scale-115 group-hover:-translate-y-0.5 group-active:scale-90";
  }
};

/**
 * beUI Paginated Mobile Dock Component
 * - Ultra-high contrast luxury liquid glass capsule matching Lumina's brand.
 * - Perfectly legible text over light or dark backgrounds.
 * - Symmetrical 4-slot layout with isolated pages.
 * - Individual spring active pills without cross-page shared layout bugs.
 * - Responsive micro-interactions on hover and active touch.
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

    // Detect deliberate horizontal swipe (> 40px and predominantly horizontal)
    if (Math.abs(diffX) > Math.abs(diffY) * 1.5 && Math.abs(diffX) > 40) {
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
    <aside
      aria-label="Navegación de secciones"
      className={`fixed bottom-3 inset-x-0 z-50 flex flex-col items-center justify-center px-3 pointer-events-none transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95 pointer-events-none"
      } ${className}`}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 w-full max-w-[340px]">
        {/* Dock Frosted Capsule Container (High-Contrast Liquid Glass) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-3xl border border-black/10 dark:border-white/15 shadow-[0_16px_45px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.65)] rounded-[28px] sm:rounded-full px-2 py-1.5 overflow-hidden relative select-none touch-pan-y"
        >
          {/* Real Page View */}
          <div className="relative w-full overflow-hidden min-h-[58px] flex items-center justify-center">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.div
                key={safePage}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 350, damping: 32, mass: 0.8 },
                  opacity: { duration: 0.18, ease: "easeOut" },
                  scale: { duration: 0.18, ease: "easeOut" },
                }}
                className="w-full grid grid-cols-4 gap-1 items-center justify-items-center select-none"
              >
                {currentItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onClick();
                    }}
                    title={item.title || item.label}
                    className={`relative w-full flex flex-col items-center justify-center h-14 py-1.5 px-0.5 rounded-2xl select-none group cursor-pointer touch-manipulation focus:outline-none transition-all duration-200 ${
                      item.active ? "scale-105" : "hover:scale-105 active:scale-95"
                    }`}
                  >
                    {/* Active Pill (Stable, smooth spring animation) */}
                    {item.active && (
                      <motion.div
                        initial={{ scale: 0.88, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 480,
                          damping: 32,
                        }}
                        className="absolute inset-0 bg-gray-950 dark:bg-white rounded-2xl shadow-md shadow-gray-950/20 dark:shadow-white/15 z-0"
                      />
                    )}

                    {/* Content positioned above the active pill */}
                    <div className="relative z-10 flex flex-col items-center justify-center w-full">
                      <div className="relative">
                        <div
                          className={`w-5 h-5 flex items-center justify-center transition-all duration-200 ${getItemIconAnimation(item.id)} ${
                            item.active
                              ? "text-white dark:text-gray-950"
                              : "text-stone-700 dark:text-stone-300 group-hover:text-gray-950 dark:group-hover:text-white"
                          }`}
                        >
                          {item.icon}
                        </div>
                        {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                          <span
                            className={`absolute -top-1 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#18181b] ${
                              item.active
                                ? "bg-amber-500 text-white dark:bg-[#18181b] dark:text-white"
                                : "bg-rose-500 text-white shadow-xs"
                            }`}
                          >
                            {item.badgeCount > 99 ? "99+" : item.badgeCount}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold tracking-tight mt-1 leading-none truncate max-w-[66px] transition-colors duration-200 ${
                          item.active
                            ? "text-white dark:text-gray-950 font-bold"
                            : "text-stone-700 dark:text-stone-300 group-hover:text-gray-950 dark:group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Symmetrical empty placeholders for unused slots */}
                {Array.from({ length: Math.max(0, itemsPerPage - currentItems.length) }).map(
                  (_, i) => (
                    <div
                      key={`empty-slot-${i}`}
                      className="w-full h-14 pointer-events-none"
                      aria-hidden="true"
                    />
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dots Page Indicator underneath the Dock */}
        <div className="flex items-center justify-center gap-2 pt-0.5 pointer-events-auto">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (idx !== safePage) {
                  setPage([idx, idx > safePage ? 1 : -1]);
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                safePage === idx
                  ? "w-6 bg-gray-950 dark:bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
                  : "w-1.5 bg-gray-400/60 dark:bg-white/30 hover:bg-gray-700 dark:hover:bg-white/60"
              }`}
              aria-label={`Ir a página ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
