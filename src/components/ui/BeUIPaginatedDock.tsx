"use client";

import React, { useState, useEffect } from "react";
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
 * - Auto-collapse into the right search orb when scrolling down for extra reading space, auto-expand on scroll up
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detección de dirección de scroll vertical ultra-fluida con histeresis y RAF (sin lag)
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let accumulatedDelta = 0;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;

        // Cerca del tope superior (< 45px): siempre expandido
        if (currentY < 45) {
          setIsCollapsed(false);
          accumulatedDelta = 0;
        } else {
          // Si cambia la dirección del scroll, reiniciar acumulador
          if ((delta > 0 && accumulatedDelta < 0) || (delta < 0 && accumulatedDelta > 0)) {
            accumulatedDelta = 0;
          }
          accumulatedDelta += delta;

          // Scroll hacia abajo continuo (> 16px): colapsar para dar espacio de lectura
          if (accumulatedDelta > 16 && currentY > 60) {
            setIsCollapsed(true);
          }
          // Scroll hacia arriba continuo (< -12px): re-abrir suavemente
          else if (accumulatedDelta < -12) {
            setIsCollapsed(false);
          }
        }

        lastScrollY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav
      role="navigation"
      aria-label="Navegación inferior flotante Liquid Glass"
      className={`fixed inset-x-0 bottom-3 sm:bottom-4 z-50 flex flex-col items-center pointer-events-none select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
      } ${className}`}
    >
      <div className="w-[calc(100%-1.25rem)] max-w-[420px] pointer-events-none flex justify-end">
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
          isCollapsed={isCollapsed && !isSearchActive}
        />
      </div>
    </nav>
  );
}

export default BeUIPaginatedDock;
