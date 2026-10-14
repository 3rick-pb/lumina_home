"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// Mapa de desplazamiento exacto estilo srdavo/liquid-glass:
// Bordes refractivos R/G y centro 100% neutro rgb(128,128,128) para que solo curve los bordes de la cápsula
const SRDAVO_CAPSULE_BEZEL_MAP = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120">
    <defs>
      <linearGradient id="edgeX" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgb(255, 128, 128)" />
        <stop offset="18%" stop-color="rgb(128, 128, 128)" />
        <stop offset="82%" stop-color="rgb(128, 128, 128)" />
        <stop offset="100%" stop-color="rgb(0, 128, 128)" />
      </linearGradient>
      <linearGradient id="edgeY" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgb(128, 255, 128)" />
        <stop offset="22%" stop-color="rgb(128, 128, 128)" />
        <stop offset="78%" stop-color="rgb(128, 128, 128)" />
        <stop offset="100%" stop-color="rgb(128, 0, 128)" />
      </linearGradient>
      <filter id="blurBezel">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
    <style>.mix-overlay { mix-blend-mode: overlay; }</style>
    <rect width="240" height="120" rx="60" fill="rgb(128,128,128)" />
    <rect width="240" height="120" rx="60" fill="url(#edgeX)" filter="url(#blurBezel)" />
    <rect width="240" height="120" rx="60" fill="url(#edgeY)" class="mix-overlay" style="mix-blend-mode: overlay" filter="url(#blurBezel)" />
    <rect x="22" y="16" width="196" height="88" rx="44" fill="rgb(128,128,128)" filter="url(#blurBezel)" />
  </svg>
`)}`;

export interface LiquidTabItem {
  id: string;
  label: string;
  badge?: number;
  badgeCount?: number;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface SrdavoLiquidMenuProps {
  items: LiquidTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  visibleCount?: number;
  className?: string;
}

export function SrdavoLiquidMenu({
  items,
  activeId,
  onSelect,
  visibleCount = 3,
  className = "",
}: SrdavoLiquidMenuProps) {
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === activeId));
  const [isElevated, setIsElevated] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const grayStripRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const blackStripRef = useRef<HTMLDivElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeTimer = useRef<number>(0);
  const isFirstMount = useRef<boolean>(true);

  const state = useRef({
    slotWidth: 100,
    trackWidth: 300,
    pillX: 0,
    targetPillX: 0,
    velPillX: 0,
    scrollX: 0,
    targetScrollX: 0,
    velScrollX: 0,
    scaleX: 1,
    scaleY: 1,
    refractionScale: 0,
    mode: "idle" as "idle" | "pending" | "scrubbing" | "scrolling",
    elevated: false,
    startX: 0,
    startScrollX: 0,
    pointerX: 0,
  });

  const syncLayout = useCallback(
    (immediate = false) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const innerW = Math.max(120, (rect?.width || 300) - 8); // 4px padding por lado (px-1 = 4px)
      const slotW = innerW / visibleCount;

      const s = state.current;
      s.trackWidth = innerW;
      s.slotWidth = slotW;

      const maxStart = Math.max(0, items.length - visibleCount);
      const pageStart = Math.min(
        maxStart,
        Math.floor(activeIndex / visibleCount) * visibleCount
      );

      const nextScrollX = pageStart * slotW;
      const nextPillX = (activeIndex - pageStart) * slotW;

      s.targetScrollX = nextScrollX;
      s.targetPillX = nextPillX;

      if (immediate) {
        s.scrollX = nextScrollX;
        s.pillX = nextPillX;
      }
    },
    [activeIndex, items.length, visibleCount]
  );

  useEffect(() => {
    if (isFirstMount.current) {
      syncLayout(true);
      isFirstMount.current = false;
    } else {
      syncLayout(false);
    }
  }, [syncLayout]);

  useEffect(() => {
    const onResize = () => syncLayout(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncLayout]);

  // Motor físico de 60/120fps: controla posición, estiramiento y nivel de refracción del borde
  useEffect(() => {
    let rafId: number;

    const animate = (now: number) => {
      const s = state.current;
      const scrubbing = s.mode === "scrubbing";

      // Auto-scroll suave en los bordes si tienes ~10 íconos y mantienes la gota en el extremo
      if (scrubbing && now - edgeTimer.current > 400) {
        const edge = s.slotWidth * 0.25;
        const maxScroll = Math.max(0, (items.length - visibleCount) * s.slotWidth);
        if (s.targetPillX > s.trackWidth - s.slotWidth - edge && s.targetScrollX < maxScroll) {
          s.targetScrollX = Math.min(maxScroll, s.targetScrollX + s.slotWidth * visibleCount);
          edgeTimer.current = now;
        } else if (s.targetPillX < edge && s.targetScrollX > 0) {
          s.targetScrollX = Math.max(0, s.targetScrollX - s.slotWidth * visibleCount);
          edgeTimer.current = now;
        }
      }

      // Resorte de la píldora
      const pStiff = scrubbing ? 0.26 : 0.15;
      const pDamp = scrubbing ? 0.68 : 0.76;
      s.velPillX = (s.velPillX + (s.targetPillX - s.pillX) * pStiff) * pDamp;
      s.pillX += s.velPillX;

      // Resorte del carrusel de 10 ítems
      const cStiff = s.mode === "scrolling" ? 0.32 : 0.14;
      const cDamp = s.mode === "scrolling" ? 0.66 : 0.78;
      s.velScrollX = (s.velScrollX + (s.targetScrollX - s.scrollX) * cStiff) * cDamp;
      s.scrollX += s.velScrollX;

      // Velocidad para estirar la cápsula horizontalmente
      const speed = Math.min(Math.abs(s.velPillX), 30);
      const stretchX = speed * 0.014;

      // En reposo: scale(1, 1) dentro de la barra. Elevada: sobresale arriba, abajo y a los lados
      const targetScaleX = (s.elevated ? 1.12 : 1.0) + stretchX;
      const targetScaleY = s.elevated ? 1.32 : 1.0;

      s.scaleX += (targetScaleX - s.scaleX) * 0.2;
      s.scaleY += (targetScaleY - s.scaleY) * 0.2;

      // Escala de refracción del filtro SVG: 0 en reposo y 28 cuando está elevada/moviéndose
      const targetRefraction = s.elevated || speed > 0.4 ? 28 : 0;
      s.refractionScale += (targetRefraction - s.refractionScale) * 0.18;

      if (displacementRef.current) {
        displacementRef.current.setAttribute("scale", s.refractionScale.toFixed(1));
      }

      const totalStripW = items.length * s.slotWidth;

      // 1. Mover tira gris de fondo
      if (grayStripRef.current) {
        grayStripRef.current.style.width = `${totalStripW}px`;
        grayStripRef.current.style.transform = `translate3d(${-s.scrollX}px, 0, 0)`;
      }

      // 2. Mover píldora de cristal y contra-mover tira negra interna para recorte exacto
      if (pillRef.current && blackStripRef.current) {
        pillRef.current.style.width = `${s.slotWidth}px`;
        pillRef.current.style.transform = `translate3d(${4 + s.pillX}px, 0, 0) scale(${s.scaleX}, ${s.scaleY})`;

        const zoom = s.elevated ? 1.06 : 1.0;
        const invX = (1 / s.scaleX) * zoom;
        const invY = (1 / s.scaleY) * zoom;

        blackStripRef.current.style.width = `${totalStripW}px`;
        blackStripRef.current.style.transform = `scale(${invX}, ${invY}) translate3d(${-(s.pillX + s.scrollX)}px, 0, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [items.length, visibleCount]);

  const clampPillX = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const { slotWidth, trackWidth } = state.current;
    const raw = clientX - rect.left - 4 - slotWidth / 2;
    return Math.max(0, Math.min(trackWidth - slotWidth, raw));
  };

  const elevateGlass = (active: boolean) => {
    state.current.elevated = active;
    setIsElevated(active);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    if (settleTimer.current) clearTimeout(settleTimer.current);

    const s = state.current;
    s.startX = e.clientX;
    s.pointerX = e.clientX;
    s.startScrollX = s.scrollX;

    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left - 4;
    const hitActivePill =
      localX >= s.pillX - 6 && localX <= s.pillX + s.slotWidth + 6;

    if (hitActivePill) {
      s.mode = "scrubbing";
      elevateGlass(true);
      s.targetPillX = clampPillX(e.clientX);
    } else {
      s.mode = "pending";
      holdTimer.current = setTimeout(() => {
        if (state.current.mode === "pending") {
          state.current.mode = "scrubbing";
          elevateGlass(true);
          state.current.targetPillX = clampPillX(state.current.pointerX);
        }
      }, 130);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    s.pointerX = e.clientX;
    const dx = e.clientX - s.startX;

    if (s.mode === "pending" && Math.abs(dx) > 10) {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      s.mode = "scrolling";
    }

    if (s.mode === "scrubbing") {
      s.targetPillX = clampPillX(e.clientX);
    } else if (s.mode === "scrolling") {
      const maxScroll = Math.max(0, (items.length - visibleCount) * s.slotWidth);
      s.targetScrollX = Math.max(0, Math.min(maxScroll, s.startScrollX - dx));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const s = state.current;
    const maxScroll = Math.max(0, (items.length - visibleCount) * s.slotWidth);
    const pageW = s.slotWidth * visibleCount;

    if (s.mode === "scrolling") {
      const dx = e.clientX - s.startX;
      let page = Math.round(s.startScrollX / pageW);
      if (dx < -35) page += 1;
      if (dx > 35) page -= 1;

      s.targetScrollX = Math.max(0, Math.min(maxScroll, page * pageW));
      s.targetPillX = activeIndex * s.slotWidth - s.targetScrollX;
      elevateGlass(false);
    } else if (s.mode === "scrubbing" || s.mode === "pending") {
      // Si fue un clic directo, inflar brevemente durante el viaje y desinflar al llegar
      if (s.mode === "pending") {
        elevateGlass(true);
        settleTimer.current = setTimeout(() => elevateGlass(false), 260);
      } else {
        elevateGlass(false);
      }

      const finalX = s.mode === "pending" ? clampPillX(e.clientX) : s.targetPillX;
      const absCenter = s.targetScrollX + finalX + s.slotWidth / 2;
      const nextIdx = Math.max(
        0,
        Math.min(items.length - 1, Math.floor(absCenter / s.slotWidth))
      );

      s.targetPillX = nextIdx * s.slotWidth - s.targetScrollX;
      if (items[nextIdx]) {
        onSelect(items[nextIdx].id);
        items[nextIdx].onClick?.();
      }
    }

    s.mode = "idle";
  };

  return (
    <>
      {/* Filtro SVG de srdavo/liquid-glass: deforma únicamente los bordes curvos de la cápsula */}
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter
            id="srdavo-capsule-glass"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={SRDAVO_CAPSULE_BEZEL_MAP}
              result="bezelMap"
              preserveAspectRatio="none"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="bezelMap"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Pista Gris Base (Cápsula gris clara bg-black/[0.07], sin recorte de desbordamiento exterior) */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
        className={`relative flex items-center h-14 px-1 rounded-full bg-black/[0.07] dark:bg-white/[0.08] backdrop-blur-md select-none cursor-pointer ${className}`}
      >
        {/* CAPA 1: Ítems en Gris Medio (Lo que se ve fuera de la píldora) */}
        <div className="relative w-full h-full overflow-hidden rounded-full pointer-events-none">
          <div ref={grayStripRef} className="flex h-full items-center will-change-transform">
            {items.map((item) => {
              const badgeVal = item.badge ?? item.badgeCount;
              return (
                <div
                  key={item.id}
                  style={{ width: `${100 / items.length}%` }}
                  className="flex flex-col items-center justify-center gap-0.5 text-black/40 dark:text-white/40 font-semibold"
                >
                  {item.icon && (
                    <div className="relative flex items-center justify-center">
                      {item.icon}
                      {typeof badgeVal === "number" && badgeVal > 0 ? (
                        <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 text-[9px] font-black text-white bg-rose-500 rounded-full flex items-center justify-center shadow-xs">
                          {badgeVal > 99 ? "99+" : badgeVal}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <span className="text-[11px] tracking-tight truncate max-w-[90%]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CAPA 2: Píldora Liquid Glass (Reposo dentro de la barra vs. Elevada transparente con bisel) */}
        <div
          ref={pillRef}
          style={{
            top: "4px",
            bottom: "4px",
            left: 0,
            willChange: "transform, width",
            backdropFilter: isElevated
              ? "url(#srdavo-capsule-glass) blur(0.5px)"
              : "blur(4px)",
            WebkitBackdropFilter: isElevated
              ? "url(#srdavo-capsule-glass) blur(0.5px)"
              : "blur(4px)",
            background: isElevated
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(255, 255, 255, 0.58)",
            border: isElevated
              ? "1.5px solid rgba(255, 255, 255, 0.9)"
              : "1px solid rgba(255, 255, 255, 0.85)",
            boxShadow: isElevated
              ? `
                inset 0 2px 4px rgba(255, 255, 255, 0.95),
                inset 0 -2px 4px rgba(255, 255, 255, 0.85),
                0 10px 24px rgba(0, 0, 0, 0.12)
              `
              : "inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
          className="absolute z-20 rounded-full overflow-hidden pointer-events-none transition-[background,box-shadow,border] duration-200"
        >
          {/* Interior de la píldora: Ítems en Negro Puro (#000) pasados por el filtro de borde de srdavo */}
          <div
            ref={blackStripRef}
            style={{
              filter: "url(#srdavo-capsule-glass)",
              transformOrigin: "left center",
              willChange: "transform",
            }}
            className="absolute top-[-4px] bottom-[-4px] left-0 flex h-14 items-center"
          >
            {items.map((item) => {
              const badgeVal = item.badge ?? item.badgeCount;
              return (
                <div
                  key={`active-${item.id}`}
                  style={{ width: `${100 / items.length}%` }}
                  className="flex flex-col items-center justify-center gap-0.5 text-black dark:text-white font-bold"
                >
                  {item.icon && (
                    <div className="relative flex items-center justify-center">
                      {item.icon}
                      {typeof badgeVal === "number" && badgeVal > 0 ? (
                        <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 text-[9px] font-black text-white bg-rose-500 rounded-full flex items-center justify-center shadow-xs">
                          {badgeVal > 99 ? "99+" : badgeVal}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <span className="text-[11px] tracking-tight truncate max-w-[90%]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default SrdavoLiquidMenu;
