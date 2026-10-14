"use client";

import React from "react";
import { Search } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlass";
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
 * - Monochromatic: Light gray track bg-black/[0.07], medium gray items text-black/40 outside, pure black text-black inside
 * - Curved capsule bezel refraction only on edges, 100% flat and crisp center
 * - Resting vs. Elevated states with scale(1.12, 1.32) vertical bulge upon hold/drag
 * - 3 visible items with smooth spring scrubbing, edge auto-scroll & 3-by-3 block swipe
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
      {/* Contenedor Flotante iOS: Menú de Pestañas Monocromático + Lupa Circular Externa */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-[calc(100%-1.25rem)] max-w-[420px] pointer-events-auto">
        {/* Cápsula Flotante con efecto srdavo Liquid Glass monocromático exacto */}
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
          className="flex-1 min-w-0"
          onSelect={(id) => {
            const chosen = items.find((it) => it.id === id);
            chosen?.onClick?.();
          }}
        />

        {/* Botón Circular de Búsqueda FUERA DEL MENÚ (Isla flotante Liquid Glass monocromática) */}
        {onSearchClick && (
          <LiquidGlassButton
            type="button"
            onClick={onSearchClick}
            radius={9999}
            depth={5}
            strength={24}
            chromaticAberration={0}
            blur={1.5}
            title="Buscar pedidos, marcas o piezas..."
            aria-label="Abrir buscador"
            className={`relative w-[56px] h-[56px] rounded-full shrink-0 flex items-center justify-center border border-white/70 dark:border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all duration-300 active:scale-90 group ${
              isSearchActive
                ? "bg-[#e07a3f] text-white border-2 border-white/90 shadow-[0_0_24px_rgba(224,122,63,0.6)]"
                : "bg-white/70 dark:bg-zinc-900/70 text-stone-900 dark:text-stone-100"
            }`}
          >
            <Search
              className={`w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-115 stroke-[2.3px] ${
                isSearchActive
                  ? "text-white"
                  : "text-stone-800 dark:text-stone-100 group-hover:text-black dark:group-hover:text-white"
              }`}
            />
          </LiquidGlassButton>
        )}
      </div>
    </nav>
  );
}

export default BeUIPaginatedDock;
