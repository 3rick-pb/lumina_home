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
}

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.96,
    filter: "blur(2px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    scale: 0.96,
    filter: "blur(2px)",
  }),
};

/**
 * beUI Paginated Mobile Dock Component
 * - 100% Symmetrical layout: 4 equal 25% columns per page.
 * - Divided into REAL individual pages (isolated views via AnimatePresence) with ZERO icon leakage/peeking.
 * - Leaves unused column slots completely empty without stretching.
 * - Silky smooth spring page transitions with organic inertia in both directions (forward and backward).
 * - Floating active motion pill (layoutId) for fluid, glitch-free active tab transitions (no white-on-white artifacts).
 * - Rock-solid touch detection with touch-manipulation to eliminate dropped mobile clicks.
 * - Distinctive dots page indicator underneath with active pill expansion.
 */
export function BeUIPaginatedDock({
  items,
  itemsPerPage = 4,
  className = "",
}: BeUIPaginatedDockProps) {
  const [[currentPage, direction], setPage] = useState<[number, number]>([0, 0]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Ensure currentPage is clamped if items change
  const safePage = Math.min(totalPages - 1, Math.max(0, currentPage));

  // Track active item and only sync page when user genuinely switches tabs
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
  }, [activeItemId, items, itemsPerPage, totalPages, safePage]);

  // Clean, rock-solid touch swipe detection (No lateral jumping on touch down)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touchStartRef.current.x - touch.clientX;
    const diffY = touchStartRef.current.y - touch.clientY;

    if (Math.abs(diffX) > Math.abs(diffY) * 1.35 && Math.abs(diffX) > 30) {
      if (diffX > 0 && safePage < totalPages - 1) {
        // Swiped right-to-left -> Advance to Next page
        setPage([safePage + 1, 1]);
      } else if (diffX < 0 && safePage > 0) {
        // Swiped left-to-right -> Return to Previous page
        setPage([safePage - 1, -1]);
      }
    }
    touchStartRef.current = null;
  };

  // Group items into separate real pages
  const pages: BeUIDockItem[][] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(items.slice(i * itemsPerPage, (i + 1) * itemsPerPage));
  }

  const currentItems = pages[safePage] || [];

  return (
    <aside
      aria-label="Navegación móvil"
      className={`fixed bottom-3 inset-x-0 z-50 flex flex-col items-center justify-center px-3 pointer-events-none ${className}`}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 w-full max-w-[340px]">
        {/* Dock Frosted Capsule Container (Fixed symmetrical padding) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] rounded-3xl px-2 py-1.5 overflow-hidden relative select-none touch-pan-y"
        >
          {/* Real Page View (Only the active page renders, zero bleeding between pages) */}
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
                  x: { type: "spring", stiffness: 340, damping: 32, mass: 0.8 },
                  opacity: { duration: 0.22, ease: "easeOut" },
                  scale: { duration: 0.22, ease: "easeOut" },
                  filter: { duration: 0.22, ease: "easeOut" },
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
                    className="relative w-full flex flex-col items-center justify-center h-14 py-1.5 px-0.5 rounded-2xl select-none group cursor-pointer touch-manipulation focus:outline-none"
                  >
                    {/* Floating Spring Active Pill (beUI Dock UX) */}
                    {item.active && (
                      <motion.div
                        layoutId="beui-dock-active-pill"
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 35,
                        }}
                        className="absolute inset-0 bg-gray-950 dark:bg-white rounded-2xl shadow-md shadow-gray-950/20 dark:shadow-white/20 z-0"
                      />
                    )}

                    {/* Content positioned above the active pill */}
                    <div className="relative z-10 flex flex-col items-center justify-center w-full">
                      <div className="relative">
                        <div
                          className={`w-5 h-5 flex items-center justify-center transition-colors duration-200 ${
                            item.active
                              ? "text-white dark:text-gray-950"
                              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                          }`}
                        >
                          {item.icon}
                        </div>
                        {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                          <span
                            className={`absolute -top-1 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#18181b] ${
                              item.active
                                ? "bg-[#8c9276] text-white dark:bg-[#18181b] dark:text-white"
                                : "bg-rose-500 text-white shadow-xs"
                            }`}
                          >
                            {item.badgeCount > 99 ? "99+" : item.badgeCount}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[9.5px] font-medium tracking-tight mt-1 leading-none truncate max-w-[64px] transition-colors duration-200 ${
                          item.active
                            ? "text-white dark:text-gray-950 font-semibold"
                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Symmetrical empty placeholders for unused slots (Leaves empty spaces without stretching) */}
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
                  ? "w-6 bg-gray-900 dark:bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
                  : "w-1.5 bg-gray-400/50 dark:bg-white/25 hover:bg-gray-600 dark:hover:bg-white/50"
              }`}
              aria-label={`Ir a página ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
