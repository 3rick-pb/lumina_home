"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, PanInfo } from "framer-motion";

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
 * - Floating frosted macOS / beUI Dock capsule designed for mobile / small viewports.
 * - Divides items into pages (e.g. 3 pages of 4 sections).
 * - Smooth horizontal swipe / drag gestures with fluid spring animation.
 * - Distinctive 3-dot (or N-dot) pagination indicator underneath with expanding active pill.
 * - Automatically keeps the active tab's page in view.
 */
export function BeUIPaginatedDock({
  items,
  itemsPerPage = 4,
  className = "",
}: BeUIPaginatedDockProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Automatically switch page when active item changes
  useEffect(() => {
    const activeIndex = items.findIndex((it) => it.active);
    if (activeIndex !== -1) {
      const targetPage = Math.floor(activeIndex / itemsPerPage);
      if (targetPage >= 0 && targetPage < totalPages) {
        setCurrentPage(targetPage);
      }
    }
  }, [items, itemsPerPage, totalPages]);

  // Framer-motion drag gesture handler
  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 35;
    const velocityThreshold = 220;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swiped right-to-left -> Advance to next page
      setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swiped left-to-right -> Return to previous page
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  };

  // Direct touch handlers for bulletproof mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    } else if (diff < -40) {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
    touchStartX.current = null;
  };

  // Group items into chunks of `itemsPerPage`
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
          className="w-full bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] rounded-3xl p-1.5 overflow-hidden relative select-none"
        >
          {/* Animated Carousel Track */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={handleDragEnd}
            animate={{ x: `-${currentPage * 100}%` }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 32,
              mass: 0.8,
            }}
            className="flex w-full cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {pages.map((pageItems, pageIdx) => (
              <div
                key={pageIdx}
                className="w-full shrink-0 grid grid-cols-4 gap-1 px-0.5 items-center justify-items-center"
              >
                {pageItems.map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={item.onClick}
                    title={item.title || item.label}
                    className={`relative w-full flex flex-col items-center justify-center h-14 py-1.5 px-0.5 rounded-2xl transition-all duration-300 select-none group cursor-pointer ${
                      item.active
                        ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950 shadow-md shadow-gray-950/20 dark:shadow-white/20 scale-[1.02]"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-5 h-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
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
                  </motion.button>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        {/* 3-Dot (or N-dot) Page Indicator underneath the Dock */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5 pointer-events-auto">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPage(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentPage === idx
                  ? "w-5 bg-gray-900 dark:bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
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
