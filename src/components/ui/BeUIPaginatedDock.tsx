"use client";

import React from "react";
import { SrdavoLiquidMenu } from "@/components/ui/SrdavoLiquidMenu";

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

/**
 * Minimalist Monochromatic Liquid Glass Floating Dock
 * - Based strictly on srdavo/liquid-glass capsule bezel displacement architecture
 * - Real Liquid Glass on both the menu bar (#srdavo-bar-glass) and circular search orb (#srdavo-lupa-glass)
 * - Zero-lag carousel scrolling (6px gesture discriminator) and dual-spring in-flight liquid stretching
 * - 3 visible items with edge auto-scroll & safe boundary clipping
 */
export function BeUIPaginatedDock({
  items,
  itemsPerPage = 3,
  className = "",
  isVisible = true,
  onSearchClick,
  isSearchActive = false,
}: BeUIPaginatedDockProps) {
  const activeItem = items.find((it) => it.active);
  const activeItemId = activeItem?.id || items[0]?.id || "";

  return (
    <nav
      role="navigation"
      aria-label="Navegación inferior flotante Liquid Glass"
      className={`fixed inset-x-0 bottom-3 sm:bottom-4 z-50 flex flex-col items-center pointer-events-none select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
      } ${className}`}
    >
      <div className="w-[calc(100%-1.25rem)] max-w-[420px] pointer-events-auto">
        <SrdavoLiquidMenu
          items={items.map((it) => ({
            id: it.id,
            label: it.label,
            badge: it.badgeCount,
            badgeCount: it.badgeCount,
            icon: it.icon,
            onClick: it.onClick,
          }))}
          activeId={activeItemId}
          visibleCount={itemsPerPage || 3}
          onSelect={(id) => {
            const chosen = items.find((it) => it.id === id);
            chosen?.onClick?.();
          }}
          onSearchClick={onSearchClick}
          isSearchActive={isSearchActive}
        />
      </div>
    </nav>
  );
}

export default BeUIPaginatedDock;
