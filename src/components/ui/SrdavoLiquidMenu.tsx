"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

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

/**
 * Genera un mapa de desplazamiento SDF de cápsula exacta (estilo srdavo/liquid-glass):
 * - Centro (r <= 0.46): rgb(128,128,128) -> 0 distorsión (ícono central 100% quieto y nítido).
 * - Bisel interior (0.46 < r < 0.76): estira suavemente hacia afuera siguiendo el arco semicircular.
 * - Labio exterior (0.76 <= r <= 1.0): invierte el vector normal creando el reflejo inverso en los bordes izq/der.
 */
function createCapsuleInverseBezelMap(): string {
  if (typeof document === "undefined") return "";
  const W = 240;
  const H = 120;
  const R = H / 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(W, H);
  const data = img.data;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Punto más cercano en la espina central de la cápsula
      const cx = Math.max(R, Math.min(W - R, x));
      const cy = R;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const r = dist / R; // 0 en el centro, 1 en el borde exacto de la cápsula

      let rChan = 128;
      let gChan = 128;

      if (r > 0.44 && r <= 1.08 && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const t = Math.min(1, (r - 0.44) / 0.56);

        let profile = 0;
        if (t < 0.68) {
          // Fase 1: curvatura convexa interna hacia el borde
          const u = t / 0.68;
          profile = -Math.sin(u * Math.PI) * 0.65;
        } else {
          // Fase 2: inversión óptica en el labio exterior (efecto inverso al tocar el ícono vecino)
          const v = (t - 0.68) / 0.32;
          profile = Math.sin(v * Math.PI * 0.5) ** 1.6 * 1.0;
        }

        rChan = Math.max(0, Math.min(255, Math.round(128 + nx * profile * 127)));
        gChan = Math.max(0, Math.min(255, Math.round(128 + ny * profile * 127)));
      }

      const idx = (y * W + x) * 4;
      data[idx] = rChan;
      data[idx + 1] = gChan;
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
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
  const [bezelMapUrl, setBezelMapUrl] = useState<string>("");

  const trackRef = useRef<HTMLDivElement>(null);
  const grayWindowRef = useRef<HTMLDivElement>(null);
  const grayStripRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const lensViewportRef = useRef<HTMLDivElement>(null);
  const blackStripRef = useRef<HTMLDivElement>(null);
  const fgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const bgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);

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
    extraW: 0,
    extraH: 0,
    refraction: 0,
    mode: "idle" as "idle" | "pending" | "scrubbing" | "scrolling",
    elevated: false,
    startX: 0,
    startScrollX: 0,
    pointerX: 0,
  });

  useEffect(() => {
    setBezelMapUrl(createCapsuleInverseBezelMap());
  }, []);

  const syncLayout = useCallback(
    (immediate = false) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const innerW = Math.max(120, (rect?.width || 300) - 8); // 4px padding lateral
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

  useEffect(() => {
    let rafId: number;

    const animate = (now: number) => {
      const s = state.current;
      const scrubbing = s.mode === "scrubbing";

      // Auto-scroll en bordes para recorrer los ~10 íconos mientras arrastras la píldora
      if (scrubbing && now - edgeTimer.current > 400) {
        const edge = s.slotWidth * 0.24;
        const maxScroll = Math.max(0, (items.length - visibleCount) * s.slotWidth);
        if (s.targetPillX > s.trackWidth - s.slotWidth - edge && s.targetScrollX < maxScroll) {
          s.targetScrollX = Math.min(maxScroll, s.targetScrollX + s.slotWidth * visibleCount);
          edgeTimer.current = now;
        } else if (s.targetPillX < edge && s.targetScrollX > 0) {
          s.targetScrollX = Math.max(0, s.targetScrollX - s.slotWidth * visibleCount);
          edgeTimer.current = now;
        }
      }

      // 1. Física de resorte de la píldora
      const pStiff = scrubbing ? 0.26 : 0.15;
      const pDamp = scrubbing ? 0.68 : 0.76;
      s.velPillX = (s.velPillX + (s.targetPillX - s.pillX) * pStiff) * pDamp;
      s.pillX += s.velPillX;

      // 2. Física de resorte del carrusel de 10 ítems
      const cStiff = s.mode === "scrolling" ? 0.32 : 0.14;
      const cDamp = s.mode === "scrolling" ? 0.66 : 0.78;
      s.velScrollX = (s.velScrollX + (s.targetScrollX - s.scrollX) * cStiff) * cDamp;
      s.scrollX += s.velScrollX;

      // 3. Expansión geométrica en píxeles (SIN scale() para no levantar el ícono ni el texto)
      const speed = Math.min(Math.abs(s.velPillX), 28);
      const targetExtraW = (s.elevated ? 14 : 0) + speed * 0.95;
      const targetExtraH = (s.elevated ? 14 : 0) - Math.min(4, speed * 0.15);

      s.extraW += (targetExtraW - s.extraW) * 0.22;
      s.extraH += (targetExtraH - s.extraH) * 0.22;

      // 4. Intensidad de refracción en los bordes laterales (0 en reposo, 34 al interactuar)
      const targetRefraction = s.elevated || speed > 0.35 ? 34 : 0;
      s.refraction += (targetRefraction - s.refraction) * 0.2;

      const scaleStr = s.refraction.toFixed(1);
      if (fgDisplacementRef.current) fgDisplacementRef.current.setAttribute("scale", scaleStr);
      if (bgDisplacementRef.current) bgDisplacementRef.current.setAttribute("scale", scaleStr);

      const totalStripW = items.length * s.slotWidth;
      const pillW = s.slotWidth + s.extraW;
      const pillH = 48 + s.extraH; // 48px alto base dentro de barra de 56px
      const pillLeft = 4 + s.pillX - s.extraW / 2;
      const pillTop = 4 - s.extraH / 2;

      // Mover tira gris de fondo y recortar máscara bajo la píldora para que NUNCA se duplique el ícono
      if (grayStripRef.current && grayWindowRef.current) {
        grayStripRef.current.style.width = `${totalStripW}px`;
        grayStripRef.current.style.transform = `translate3d(${-s.scrollX}px, 0, 0)`;

        const holeLeft = Math.max(0, s.pillX - s.extraW / 2 + 2);
        const holeRight = Math.min(s.trackWidth, s.pillX + s.slotWidth + s.extraW / 2 - 2);
        const mask = `linear-gradient(to right, #000 0px, #000 ${holeLeft}px, transparent ${holeLeft + 2}px, transparent ${holeRight - 2}px, #000 ${holeRight}px, #000 100%)`;
        grayWindowRef.current.style.maskImage = mask;
        grayWindowRef.current.style.webkitMaskImage = mask;
      }

      // Posicionar píldora y compensar la tira negra interna al sub-píxel (0 levantamiento vertical)
      if (pillRef.current && blackStripRef.current) {
        pillRef.current.style.width = `${pillW}px`;
        pillRef.current.style.height = `${pillH}px`;
        pillRef.current.style.transform = `translate3d(${pillLeft}px, ${pillTop}px, 0)`;

        const innerX = -s.pillX - s.scrollX + s.extraW / 2;
        const innerY = -4 + s.extraH / 2;
        blackStripRef.current.style.width = `${totalStripW}px`;
        blackStripRef.current.style.transform = `translate3d(${innerX}px, ${innerY}px, 0)`;
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
      {/* Filtros SVG dimensionados al 100% de la píldora (objectBoundingBox) para que los bordes izq/der siempre refracten */}
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter
            id="srdavo-pill-fg"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            {bezelMapUrl && (
              <feImage
                href={bezelMapUrl}
                x="0%"
                y="0%"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="bezelMap"
              />
            )}
            <feDisplacementMap
              ref={fgDisplacementRef}
              in="SourceGraphic"
              in2="bezelMap"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter
            id="srdavo-pill-bg"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            {bezelMapUrl && (
              <feImage
                href={bezelMapUrl}
                x="0%"
                y="0%"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="bezelMap"
              />
            )}
            <feDisplacementMap
              ref={bgDisplacementRef}
              in="SourceGraphic"
              in2="bezelMap"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Pista Gris Base */}
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
        }}
        className={`relative flex items-center h-14 px-1 rounded-full bg-[#DCDCDC]/85 dark:bg-zinc-800/85 backdrop-blur-md select-none cursor-pointer ${className}`}
      >
        {/* CAPA 1: Ítems en Gris (Con máscara automática bajo la píldora para evitar doble ícono) */}
        <div
          ref={grayWindowRef}
          className="relative w-full h-full overflow-hidden rounded-full pointer-events-none"
        >
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
                  <span className="text-[12px] tracking-tight truncate max-w-[90%]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CAPA 2: Píldora Liquid Glass */}
        <div
          ref={pillRef}
          style={{
            top: 0,
            left: 0,
            willChange: "transform, width, height",
            backdropFilter: isElevated
              ? "url(#srdavo-pill-bg) blur(1px)"
              : "blur(6px)",
            WebkitBackdropFilter: isElevated
              ? "url(#srdavo-pill-bg) blur(1px)"
              : "blur(6px)",
            background: isElevated
              ? "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.16) 100%)"
              : "rgba(255, 255, 255, 0.65)",
          }}
          className="absolute z-20 rounded-full overflow-hidden pointer-events-none transition-[background] duration-200"
        >
          {/* Ventana óptica del tamaño exacto de la píldora: aquí actúa el filtro de bordes izq/der */}
          <div
            ref={lensViewportRef}
            style={{
              filter: "url(#srdavo-pill-fg)",
            }}
            className="relative w-full h-full overflow-hidden rounded-full"
          >
            <div
              ref={blackStripRef}
              style={{
                willChange: "transform",
              }}
              className="absolute top-0 left-0 flex h-14 items-center"
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
                    <span className="text-[12px] tracking-tight truncate max-w-[90%]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bisel especular en overlay separado para no alterar el box-model ni mover los íconos */}
          <div
            style={{
              border: isElevated
                ? "1.5px solid rgba(255, 255, 255, 0.92)"
                : "1px solid rgba(255, 255, 255, 0.85)",
              boxShadow: isElevated
                ? `
                  inset 0 3px 6px rgba(255, 255, 255, 0.95),
                  inset 0 -3px 6px rgba(255, 255, 255, 0.85),
                  inset 0 0 10px rgba(255, 255, 255, 0.35),
                  0 10px 24px rgba(0, 0, 0, 0.14)
                `
                : "inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
            className="absolute inset-0 rounded-full pointer-events-none transition-[border,box-shadow] duration-200"
          />
        </div>
      </div>
    </>
  );
}

export default SrdavoLiquidMenu;
