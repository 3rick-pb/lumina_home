"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

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

/**
 * beUI Paginated Mobile Dock Component
 * - Rock-solid, jitter-free floating frosted glass Dock capsule for mobile viewports.
 * - Divides items into pages (e.g. 3 pages of 4 sections: Menú 1, Menú 2, Menú 3).
 * - Fast, silky 220ms sliding animations between pages.
 * - Smooth swipe gestures (left/right) with zero lateral jumping on finger touch.
 * - Distinctive 3-dot page indicator underneath with expanding active pill and direct tap navigation.
 * - Stable state: never blocks or skips Menú 2.
 */
export function BeUIPaginatedDock({
  items,
  itemsPerPage = 4,
  className = "",
}: BeUIPaginatedDockProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Find the currently active item
  const activeItem = items.find((it) => it.active);
  const activeItemId = activeItem?.id;
  const lastActiveIdRef = useRef<string | undefined>(activeItemId);

  // ONLY automatically switch page when the user actually activates a different tab
  // (e.g. clicking a tab button), NEVER when the user is manually browsing pages!
  useEffect(() => {
    if (activeItemId && activeItemId !== lastActiveIdRef.current) {
      lastActiveIdRef.current = activeItemId;
      const activeIndex = items.findIndex((it) => it.id === activeItemId);
      if (activeIndex !== -1) {
        const targetPage = Math.floor(activeIndex / itemsPerPage);
        if (targetPage >= 0 && targetPage < totalPages) {
          setCurrentPage(targetPage);
        }
      }
    }
  }, [activeItemId, items, itemsPerPage, totalPages]);

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

    // Only trigger if primarily a horizontal swipe and exceeds threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        // Swiped right-to-left -> Next page
        setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
      } else {
        // Swiped left-to-right -> Previous page
        setCurrentPage((prev) => Math.max(0, prev - 1));
      }
    }
    touchStartRef.current = null;
  };

  // Group items into pages of `itemsPerPage`
  const pages: BeUIDockItem[][] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(items.slice(i * itemsPerPage, (i + 1) * itemsPerPage));
  }

  return (
    <aside
      aria-label="Navegación móvil"
      className={`fixed bottom-3 inset-x-0 z-50 flex flex-col items-center justify-center px-3 pointer-events-none ${className}`}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 w-full max-w-[340px]">
        {/* Dock Frosted Capsule Container */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] rounded-3xl p-1.5 overflow-hidden relative select-none touch-pan-y"
        >
          {/* Animated Carousel Track (Fast, Snappy, Rock-Solid) */}
          <motion.div
            animate={{ x: `-${currentPage * 100}%` }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex w-full select-none"
          >
            {pages.map((pageItems, pageIdx) => (
              <div
                key={pageIdx}
                className="w-full shrink-0 grid grid-cols-4 gap-1 px-0.5 items-center justify-items-center"
              >
                {pageItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    title={item.title || item.label}
                    className={`relative w-full flex flex-col items-center justify-center h-14 py-1.5 px-0.5 rounded-2xl transition-all duration-200 select-none group cursor-pointer active:scale-90 ${
                      item.active
                        ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950 shadow-md shadow-gray-950/20 dark:shadow-white/20 scale-[1.02]"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-5 h-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
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
                    <span className="text-[9.5px] font-medium tracking-tight mt-1 leading-none truncate max-w-[64px]">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        {/* 3-Dot (or N-dot) Page Indicator underneath the Dock */}
        <div className="flex items-center justify-center gap-2 pt-0.5 pointer-events-auto">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPage(idx)}
              className={`h-1.5 rounded-full transition-all duration-250 cursor-pointer ${
                currentPage === idx
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
