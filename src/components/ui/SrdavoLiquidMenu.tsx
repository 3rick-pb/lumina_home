"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getDisplacementFilter } from "./LiquidGlass";

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
  onSearchClick?: () => void;
  isSearchActive?: boolean;
  visibleCount?: number;
  className?: string;
}

/**
 * Menú Inferior con Liquid Glass de srdavo/liquid-glass aplicado únicamente en el cuerpo del menú.
 * - Cuerpo del menú: Efecto Liquid Glass oficial (feDisplacementMap + aberración cromática + reflejo especular).
 * - Píldora activa: Deslizador orgánico con física de doble resorte (leftX y rightX), nítido y sin distorsión sobre textos o íconos.
 * - Carrusel: 10 ítems (3 visibles), deslizamiento 1:1 sin lag, y discriminador de gestos (swipe vs. hold 200ms).
 */
export function SrdavoLiquidMenu({
  items,
  activeId,
  onSelect,
  onSearchClick,
  isSearchActive = false,
  visibleCount = 3,
  className = "",
}: SrdavoLiquidMenuProps) {
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === activeId));
  const [isElevated, setIsElevated] = useState(false);
  const [isSearchPressed, setIsSearchPressed] = useState(false);
  const [trackDims, setTrackDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hasSvgFilterSupport, setHasSvgFilterSupport] = useState<boolean>(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const grayWindowRef = useRef<HTMLDivElement>(null);
  const grayStripRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const blackStripRef = useRef<HTMLDivElement>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeTimer = useRef<number>(0);

  const state = useRef({
    slotWidth: 100,
    trackWidth: 300,
    leftX: 0,
    rightX: 0,
    velLeftX: 0,
    velRightX: 0,
    targetPillX: 0,
    scrollX: 0,
    targetScrollX: 0,
    velScrollX: 0,
    extraW: 0,
    extraH: 0,
    mode: "idle" as "idle" | "pending" | "scrubbing" | "scrolling",
    elevated: false,
    inFlight: false,
    startX: 0,
    startY: 0,
    startScrollX: 0,
    pointerX: 0,
  });

  // Detectar soporte para filtros SVG en backdrop-filter
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isChromium = /chrome|chromium|edg/.test(ua) && !/iphone|ipad|ipod|firefox|fxios|crios/.test(ua);
      setHasSvgFilterSupport(isChromium);
    }
  }, []);

  // Medir dimensiones del cuerpo del menú para alimentar el generador de filtro de srdavo/liquid-glass
  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);
      if (w > 0 && h > 0) {
        setTrackDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Generar filtro Liquid Glass oficial de srdavo/liquid-glass para el cuerpo del menú
  const bodyFilterUrl = useMemo(() => {
    if (!hasSvgFilterSupport || trackDims.width === 0 || trackDims.height === 0) return null;
    return getDisplacementFilter({
      width: trackDims.width,
      height: trackDims.height,
      radius: 9999,
      depth: 4,
      strength: 28,
      chromaticAberration: 1.5,
    });
  }, [hasSvgFilterSupport, trackDims.width, trackDims.height]);

  const syncLayout = useCallback(
    (immediate = false) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const visibleW = grayWindowRef.current?.clientWidth || Math.max(120, rect.width - 8);
      const slotW = visibleW / visibleCount;

      const s = state.current;
      s.trackWidth = visibleW;
      s.slotWidth = slotW;

      // Si no estamos en scroll manual, sincronizar con la pestaña activa
      if (s.mode !== "scrolling") {
        const maxScroll = Math.max(0, (items.length - visibleCount) * slotW);
        let nextScrollX = s.targetScrollX;
        const activeAbsX = activeIndex * slotW;
        if (activeAbsX < nextScrollX) {
          nextScrollX = activeAbsX;
        } else if (activeAbsX >= nextScrollX + visibleCount * slotW) {
          nextScrollX = activeAbsX - (visibleCount - 1) * slotW;
        }
        nextScrollX = Math.max(0, Math.min(maxScroll, Math.round(nextScrollX / slotW) * slotW));
        const nextPillX = activeAbsX - nextScrollX;

        s.targetScrollX = nextScrollX;
        s.targetPillX = nextPillX;

        if (immediate) {
          s.scrollX = nextScrollX;
          s.leftX = nextPillX;
          s.rightX = nextPillX;
        }
      }
    },
    [activeIndex, items.length, visibleCount]
  );

  useEffect(() => {
    syncLayout(false);
  }, [activeIndex, syncLayout]);

  useEffect(() => {
    syncLayout(true);
    const onResize = () => syncLayout(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncLayout]);

  useEffect(() => {
    let rafId: number;

    const animate = (now: number) => {
      const s = state.current;
      const scrubbing = s.mode === "scrubbing";
      const scrolling = s.mode === "scrolling";

      // Auto-scroll suave de 1 en 1 ícono cuando arrastras la gota al borde
      if (scrubbing && now - edgeTimer.current > 340) {
        const edge = s.slotWidth * 0.22;
        const maxScroll = Math.max(0, (items.length - visibleCount) * s.slotWidth);
        if (s.targetPillX > s.trackWidth - s.slotWidth - edge && s.targetScrollX < maxScroll) {
          s.targetScrollX = Math.min(maxScroll, s.targetScrollX + s.slotWidth);
          edgeTimer.current = now;
        } else if (s.targetPillX < edge && s.targetScrollX > 0) {
          s.targetScrollX = Math.max(0, s.targetScrollX - s.slotWidth);
          edgeTimer.current = now;
        }
      }

      // 1. Física del carrusel de ~10 íconos (inmediato 1:1 al hacer swipe)
      const cStiff = scrolling ? 0.48 : 0.16;
      const cDamp = scrolling ? 0.62 : 0.78;
      s.velScrollX = (s.velScrollX + (s.targetScrollX - s.scrollX) * cStiff) * cDamp;
      s.scrollX += s.velScrollX;

      if (!scrubbing && !s.inFlight) {
        s.targetPillX = activeIndex * s.slotWidth - s.scrollX;
      }

      // 2. Física de Doble Resorte para la píldora activa
      const movingRight = s.targetPillX >= (s.leftX + s.rightX) * 0.5;
      const fastStiff = scrubbing ? 0.32 : scrolling ? 0.55 : 0.24;
      const fastDamp = scrubbing ? 0.68 : scrolling ? 0.60 : 0.75;
      const slowStiff = scrubbing ? 0.24 : scrolling ? 0.55 : 0.12;
      const slowDamp = scrubbing ? 0.70 : scrolling ? 0.60 : 0.77;

      const leftStiff = movingRight ? slowStiff : fastStiff;
      const leftDamp = movingRight ? slowDamp : fastDamp;
      const rightStiff = movingRight ? fastStiff : slowStiff;
      const rightDamp = movingRight ? fastDamp : slowDamp;

      s.velLeftX = (s.velLeftX + (s.targetPillX - s.leftX) * leftStiff) * leftDamp;
      s.leftX += s.velLeftX;

      s.velRightX = (s.velRightX + (s.targetPillX - s.rightX) * rightStiff) * rightDamp;
      s.rightX += s.velRightX;

      const rawSpanLeft = Math.min(s.leftX, s.rightX);
      const rawSpanRight = Math.max(s.leftX, s.rightX) + s.slotWidth;
      const stretchSpan = rawSpanRight - rawSpanLeft - s.slotWidth;

      // 3. Elevación elástica al mantener presionado o al viajar entre pestañas
      const targetExtraW = s.elevated
        ? 12
        : s.inFlight
        ? 8 + Math.min(6, stretchSpan * 0.2)
        : 0;
      const targetExtraH = s.elevated
        ? 24
        : s.inFlight
        ? 16
        : 0;

      s.extraW += (targetExtraW - s.extraW) * 0.24;
      s.extraH += (targetExtraH - s.extraH) * 0.24;

      // 4. Clampeo horizontal seguro para que la píldora no invada el botón de la lupa
      const clampedLeft = Math.max(0, rawSpanLeft);
      const clampedRight = Math.min(s.trackWidth, rawSpanRight);
      const visibleSpanW = clampedRight - clampedLeft;

      const totalStripW = items.length * s.slotWidth;
      const pillW = Math.max(0, visibleSpanW + s.extraW);
      const pillH = 50 + s.extraH;
      const pillLeft = 4 + clampedLeft - s.extraW / 2;
      const pillTop = 4 - s.extraH / 2;

      // Mover tira gris y recortar máscara bajo la píldora
      if (grayStripRef.current && grayWindowRef.current) {
        grayStripRef.current.style.width = `${totalStripW}px`;
        grayStripRef.current.style.transform = `translate3d(${-s.scrollX}px, 0, 0)`;

        if (visibleSpanW > 4) {
          const holeLeft = Math.max(0, clampedLeft - s.extraW / 2 + 3);
          const holeRight = Math.min(s.trackWidth, clampedRight + s.extraW / 2 - 3);
          const mask = `linear-gradient(to right, #000 0px, #000 ${holeLeft}px, transparent ${holeLeft + 2}px, transparent ${holeRight - 2}px, #000 ${holeRight}px, #000 100%)`;
          grayWindowRef.current.style.maskImage = mask;
          grayWindowRef.current.style.webkitMaskImage = mask;
        } else {
          grayWindowRef.current.style.maskImage = "none";
          grayWindowRef.current.style.webkitMaskImage = "none";
        }
      }

      // Posicionar la píldora activa y compensar la tira negra interna al sub-píxel
      if (pillRef.current && blackStripRef.current) {
        const pillOpacity = Math.min(1, Math.max(0, visibleSpanW / (s.slotWidth * 0.35)));
        pillRef.current.style.opacity = pillOpacity.toFixed(2);
        pillRef.current.style.width = `${pillW}px`;
        pillRef.current.style.height = `${pillH}px`;
        pillRef.current.style.transform = `translate3d(${pillLeft}px, ${pillTop}px, 0)`;

        const innerX = -clampedLeft - s.scrollX + s.extraW / 2;
        const innerY = -4 + s.extraH / 2;
        blackStripRef.current.style.width = `${totalStripW}px`;
        blackStripRef.current.style.transform = `translate3d(${innerX}px, ${innerY}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [activeIndex, items.length, visibleCount]);

  const clampPillX = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const { slotWidth, trackWidth } = state.current;
    const raw = clientX - rect.left - 4 - slotWidth / 2;
    return Math.max(0, Math.min(trackWidth - slotWidth, raw));
  };

  const setGlassVisualState = (elevated: boolean, inFlight = false) => {
    state.current.elevated = elevated;
    state.current.inFlight = inFlight;
    setIsElevated(elevated || inFlight);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (flightTimer.current) clearTimeout(flightTimer.current);

    const s = state.current;
    s.startX = e.clientX;
    s.startY = e.clientY;
    s.pointerX = e.clientX;
    s.startScrollX = s.scrollX;
    s.mode = "pending";

    // Solo si mantiene presionado quieto 200ms entra en modo arrastre
    holdTimer.current = setTimeout(() => {
      if (state.current.mode === "pending") {
        state.current.mode = "scrubbing";
        setGlassVisualState(true, false);
        state.current.targetPillX = clampPillX(state.current.pointerX);
      }
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    s.pointerX = e.clientX;
    const dx = e.clientX - s.startX;

    // Si desliza más de 6px antes de los 200ms, es un swipe inmediato del carrusel
    if (s.mode === "pending" && Math.abs(dx) > 6) {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      s.mode = "scrolling";
      setGlassVisualState(false, false);
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

    if (s.mode === "scrolling") {
      // Al soltar tras swipe, encaja al slot más cercano con inercia, NUNCA selecciona pestaña por error
      const inertia = (s.startX - e.clientX) * 0.35;
      const snappedScroll =
        Math.round((s.targetScrollX + inertia) / s.slotWidth) * s.slotWidth;
      s.targetScrollX = Math.max(0, Math.min(maxScroll, snappedScroll));
      setGlassVisualState(false, false);
    } else if (s.mode === "pending") {
      // Tap limpio -> vuelo elástico entre pestañas
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const localClickX = e.clientX - rect.left - 4;
      const absClickX = s.scrollX + localClickX;
      const nextIdx = Math.max(
        0,
        Math.min(items.length - 1, Math.floor(absClickX / s.slotWidth))
      );

      const nextTargetX = nextIdx * s.slotWidth - s.targetScrollX;
      if (nextIdx !== activeIndex) {
        setGlassVisualState(false, true);
        s.targetPillX = nextTargetX;
        if (items[nextIdx]) {
          onSelect(items[nextIdx].id);
          items[nextIdx].onClick?.();
        }
        flightTimer.current = setTimeout(() => {
          setGlassVisualState(false, false);
        }, 340);
      } else {
        setGlassVisualState(false, true);
        if (items[nextIdx]) {
          onSelect(items[nextIdx].id);
          items[nextIdx].onClick?.();
        }
        flightTimer.current = setTimeout(() => {
          setGlassVisualState(false, false);
        }, 200);
      }
    } else if (s.mode === "scrubbing") {
      const absCenter = s.targetScrollX + s.targetPillX + s.slotWidth / 2;
      const nextIdx = Math.max(
        0,
        Math.min(items.length - 1, Math.floor(absCenter / s.slotWidth))
      );

      s.targetPillX = nextIdx * s.slotWidth - s.targetScrollX;
      if (items[nextIdx]) {
        onSelect(items[nextIdx].id);
        items[nextIdx].onClick?.();
      }
      flightTimer.current = setTimeout(() => {
        setGlassVisualState(false, false);
      }, 180);
    }

    s.mode = "idle";
  };

  return (
    <div className={`flex items-center gap-2.5 w-full max-w-full min-w-0 overflow-visible px-1 box-border mx-auto ${className}`}>
      {/* CUERPO DEL MENÚ: CON EL EFECTO LIQUID GLASS OFICIAL DE srdavo/liquid-glass */}
      <div
        ref={trackRef}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
          borderRadius: "9999px",
          backdropFilter: bodyFilterUrl
            ? `blur(0.8px) url('${bodyFilterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
            : "blur(14px) saturate(190%) brightness(1.12)",
          WebkitBackdropFilter: bodyFilterUrl
            ? `blur(0.8px) url('${bodyFilterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
            : "blur(14px) saturate(190%) brightness(1.12)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(240,240,248,0.24) 100%)",
          boxShadow: `
            inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.85),
            inset -1px -1px 1px 0px rgba(255, 255, 255, 0.35),
            inset 0 0 16px 0px rgba(255, 255, 255, 0.12),
            0 10px 30px -4px rgba(0, 0, 0, 0.12)
          `,
          border: "1px solid rgba(255, 255, 255, 0.65)",
        }}
        className="relative flex-1 min-w-0 w-full overflow-visible flex items-center h-[58px] px-1 rounded-full select-none cursor-pointer dark:bg-zinc-900/40 dark:border-white/15"
      >
        {/* Reflejo especular interno de srdavo/liquid-glass */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent" />
        </div>

        {/* CAPA 1: Ítems en Gris */}
        <div
          ref={grayWindowRef}
          className="relative w-full h-full overflow-hidden rounded-full pointer-events-none"
        >
          <div
            ref={grayStripRef}
            className="absolute top-0 left-0 flex h-full items-center will-change-transform"
          >
            {items.map((item) => {
              const badgeVal = item.badge ?? item.badgeCount;
              return (
                <div
                  key={item.id}
                  style={{ width: `${100 / items.length}%` }}
                  className="flex flex-col items-center justify-center gap-0.5 text-black/45 dark:text-white/45 font-semibold"
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
                  <span className="text-[12px] leading-tight tracking-tight truncate max-w-[90%]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CAPA 2: Píldora Activa (Sin filtro de distorsión para nitidez 100% sobre texto e ícono) */}
        <div
          ref={pillRef}
          style={{
            top: 0,
            left: 0,
            willChange: "transform, width, height, opacity",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            background: isElevated
              ? "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.80) 100%)"
              : "rgba(255, 255, 255, 0.88)",
            boxShadow: isElevated
              ? `
                0 6px 18px rgba(0, 0, 0, 0.12),
                inset 0 1.5px 2px rgba(255, 255, 255, 0.98),
                inset 0 -1.5px 2px rgba(255, 255, 255, 0.7)
              `
              : `
                0 2px 6px rgba(0, 0, 0, 0.08),
                inset 0 1px 1.5px rgba(255, 255, 255, 0.95)
              `,
            border: "1px solid rgba(255, 255, 255, 0.92)",
          }}
          className="absolute z-20 rounded-full overflow-hidden pointer-events-none transition-[background,box-shadow,border] duration-150 dark:bg-white/20 dark:border-white/30"
        >
          {/* Contenedor recortado de los íconos activos en negro */}
          <div className="relative w-full h-full overflow-hidden rounded-full">
            <div
              ref={blackStripRef}
              style={{ willChange: "transform" }}
              className="absolute top-0 left-0 flex h-[58px] items-center"
            >
              {items.map((item) => {
                const badgeVal = item.badge ?? item.badgeCount;
                return (
                  <div
                    key={`active-${item.id}`}
                    style={{ width: `${100 / items.length}%` }}
                    className="flex flex-col items-center justify-center gap-0.5 text-zinc-950 dark:text-white font-bold"
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
                    <span className="text-[12px] leading-tight tracking-tight truncate max-w-[90%]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN DE LUPA DE BÚSQUEDA */}
      {onSearchClick && (
        <button
          type="button"
          onClick={onSearchClick}
          onPointerDown={() => setIsSearchPressed(true)}
          onPointerUp={() => setIsSearchPressed(false)}
          onPointerLeave={() => setIsSearchPressed(false)}
          style={{
            backdropFilter: "blur(12px) saturate(180%)",
            WebkitBackdropFilter: "blur(12px) saturate(180%)",
            background: isSearchActive
              ? "rgba(224, 122, 63, 0.95)"
              : isSearchPressed
              ? "rgba(255, 255, 255, 0.65)"
              : "linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(240,240,248,0.24) 100%)",
            boxShadow: isSearchActive
              ? "0 0 24px rgba(224,122,63,0.6), inset 0 2px 4px rgba(255,255,255,0.8)"
              : isSearchPressed
              ? `
                inset 0 2px 4px rgba(255, 255, 255, 0.9),
                0 8px 20px rgba(0, 0, 0, 0.12)
              `
              : `
                inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.85),
                inset -1px -1px 1px 0px rgba(255, 255, 255, 0.35),
                0 10px 26px rgba(0, 0, 0, 0.10)
              `,
            border: isSearchActive
              ? "2px solid rgba(255, 255, 255, 0.9)"
              : "1px solid rgba(255, 255, 255, 0.65)",
            transform: isSearchPressed ? "scale(0.94)" : "scale(1)",
          }}
          className={`relative flex items-center justify-center w-[58px] h-[58px] rounded-full transition-all duration-200 select-none shrink-0 cursor-pointer ${
            isSearchActive ? "text-white" : "text-zinc-900 dark:text-white"
          }`}
          aria-label="Buscar"
        >
          <svg
            className="w-5 h-5 stroke-[2.2]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SrdavoLiquidMenu;
