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

  // Detección de dirección de scroll vertical y gestos táctiles (Scroll Down -> Colapsar en la lupa; Scroll Up -> Desplegar)
  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;
    let touchStartY = 0;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const delta = currentY - lastY;

          // Cerca de la parte superior siempre expandido
          if (currentY < 45) {
            setIsCollapsed(false);
          } else if (delta > 10 && currentY > 70) {
            // Scroll hacia abajo: colapsar menú dentro de la lupa derecha
            setIsCollapsed(true);
          } else if (delta < -8) {
            // Scroll hacia arriba: volver a modo normal
            setIsCollapsed(false);
          }

          lastY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY || 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0]?.clientY || 0;
      const touchDelta = currentTouchY - touchStartY;
      const currentScrollY = window.scrollY;

      // Si el dedo desliza hacia arriba (página baja)
      if (touchDelta < -16 && currentScrollY > 70) {
        setIsCollapsed(true);
      } else if (touchDelta > 14) {
        // Si el dedo desliza hacia abajo (página sube)
        setIsCollapsed(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
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
