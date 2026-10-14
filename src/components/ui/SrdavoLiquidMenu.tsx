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
 * Mapa óptico de cápsula con bordes laterales más gruesos y menisco inverso arriba/abajo:
 * - Centro limpio para el ícono activo.
 * - Fase 1 (profile > 0): curva hacia adentro el borde recto del cuerpo del menú (elimina el corte recto).
 * - Fase 2 (profile < 0 en el labio exterior): invierte el muestreo hacia adentro, creando el reflejo
 *   líquido inverso tanto en los laterales (sobre el ícono vecino) como arriba/abajo (sobre el cuerpo del menú).
 */
function createCapsuleInverseBezelMap(): string {
  if (typeof document === "undefined") return "";
  const W = 256;
  const H = 160;
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
      const cx = Math.max(R, Math.min(W - R, x));
      const cy = R;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      let rChan = 128;
      let gChan = 128;

      if (dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const r = dist / R; // 0 en el centro, 1 en el borde exterior de la cápsula

        // Bordes laterales más gruesos (empiezan en r = 0.40) y bordes superior/inferior desde r = 0.48
        const innerStart = 0.48 - 0.08 * Math.abs(nx);

        if (r > innerStart && r <= 1.02) {
          const t = Math.min(1, (r - innerStart) / (1.0 - innerStart));

          let profile = 0;
          if (t < 0.46) {
            // Fase 1: empuja el borde recto de la barra hacia adentro en curva cóncava limpia
            const u = t / 0.46;
            profile = Math.sin(u * Math.PI) * 0.58;
          } else {
            // Fase 2 (Borde exterior más grueso): pendiente negativa pronunciada -> inversión óptica real
            const v = (t - 0.46) / 0.54;
            profile = -Math.pow(Math.sin(v * Math.PI * 0.5), 1.15) * 1.0;
          }

          // Potencia completa tanto en X (laterales) como en Y (arriba y abajo para el cuerpo del menú)
          rChan = Math.max(
            0,
            Math.min(255, Math.round(128 + nx * profile * 127))
          );
          gChan = Math.max(
            0,
            Math.min(255, Math.round(128 + ny * profile * 122))
          );
        }
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
  const barBgRef = useRef<HTMLDivElement>(null);
  const grayWindowRef = useRef<HTMLDivElement>(null);
  const grayStripRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const menuBodyCloneRef = useRef<HTMLDivElement>(null);
  const blackStripRef = useRef<HTMLDivElement>(null);

  const fgFilterRef = useRef<SVGFilterElement>(null);
  const bgFilterRef = useRef<SVGFilterElement>(null);
  const fgImageRef = useRef<SVGFEImageElement>(null);
  const bgImageRef = useRef<SVGFEImageElement>(null);
  const fgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const bgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeTimer = useRef<number>(0);
  const isFirstMount = useRef<boolean>(true);

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
      const innerW = Math.max(120, (rect?.width || 300) - 8);
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
        s.leftX = nextPillX;
        s.rightX = nextPillX;
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

      // Auto-scroll en los bordes para navegar por los ~10 ítems sin soltar la gota
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

      // 1. Física de Doble Resorte
      const movingRight = s.targetPillX >= (s.leftX + s.rightX) * 0.5;
      const fastStiff = scrubbing ? 0.30 : 0.24;
      const fastDamp = scrubbing ? 0.68 : 0.74;
      const slowStiff = scrubbing ? 0.22 : 0.13;
      const slowDamp = scrubbing ? 0.70 : 0.76;

      const leftStiff = movingRight ? slowStiff : fastStiff;
      const leftDamp = movingRight ? slowDamp : fastDamp;
      const rightStiff = movingRight ? fastStiff : slowStiff;
      const rightDamp = movingRight ? fastDamp : slowDamp;

      s.velLeftX = (s.velLeftX + (s.targetPillX - s.leftX) * leftStiff) * leftDamp;
      s.leftX += s.velLeftX;

      s.velRightX = (s.velRightX + (s.targetPillX - s.rightX) * rightStiff) * rightDamp;
      s.rightX += s.velRightX;

      // 2. Física del carrusel de 10 ítems
      const cStiff = s.mode === "scrolling" ? 0.32 : 0.14;
      const cDamp = s.mode === "scrolling" ? 0.66 : 0.78;
      s.velScrollX = (s.velScrollX + (s.targetScrollX - s.scrollX) * cStiff) * cDamp;
      s.scrollX += s.velScrollX;

      const spanLeft = Math.min(s.leftX, s.rightX);
      const spanRight = Math.max(s.leftX, s.rightX) + s.slotWidth;
      const stretchSpan = spanRight - spanLeft - s.slotWidth;
      const avgSpeed = (Math.abs(s.velLeftX) + Math.abs(s.velRightX)) * 0.5;

      // 3. Expansión de la píldora (+30px de altura y +26px de ancho al elevarse)
      const flightLift = Math.min(12, stretchSpan * 0.36 + avgSpeed * 0.32);
      const targetExtraW = s.elevated ? 26 : Math.min(12, avgSpeed * 0.45);
      const targetExtraH = s.elevated ? 30 : flightLift;

      s.extraW += (targetExtraW - s.extraW) * 0.22;
      s.extraH += (targetExtraH - s.extraH) * 0.22;

      // 4. Escala de refracción más potente (46 al elevarse) para bordes más gruesos y marcados
      const targetRefraction = s.elevated
        ? 46
        : avgSpeed > 0.5 || stretchSpan > 2
        ? Math.min(34, stretchSpan * 1.0 + avgSpeed * 1.5)
        : 0;
      s.refraction += (targetRefraction - s.refraction) * 0.22;

      const totalStripW = items.length * s.slotWidth;
      const fullBarW = s.trackWidth + 8;
      const pillW = Math.max(40, spanRight - spanLeft + s.extraW);
      const pillH = 50 + s.extraH; // En reposo 50px; elevada llega a 80px (sobresaliendo 11px arriba y 11px abajo de la barra de 58px)
      const pillLeft = 4 + spanLeft - s.extraW / 2;
      const pillTop = 4 - s.extraH / 2;

      const wStr = pillW.toFixed(1);
      const hStr = pillH.toFixed(1);
      const scaleStr = s.refraction.toFixed(1);

      if (fgFilterRef.current && fgImageRef.current && fgDisplacementRef.current) {
        fgFilterRef.current.setAttribute("width", wStr);
        fgFilterRef.current.setAttribute("height", hStr);
        fgImageRef.current.setAttribute("width", wStr);
        fgImageRef.current.setAttribute("height", hStr);
        fgDisplacementRef.current.setAttribute("scale", scaleStr);
      }
      if (bgFilterRef.current && bgImageRef.current && bgDisplacementRef.current) {
        bgFilterRef.current.setAttribute("width", wStr);
        bgFilterRef.current.setAttribute("height", hStr);
        bgImageRef.current.setAttribute("width", wStr);
        bgImageRef.current.setAttribute("height", hStr);
        bgDisplacementRef.current.setAttribute("scale", scaleStr);
      }

      // 5. Máscara en el cuerpo exterior del menú (barBgRef) para eliminar la línea horizontal recta bajo el cristal
      if (barBgRef.current) {
        if (s.extraH > 3) {
          const insetCorner = Math.min(14, s.extraH * 0.42);
          const bgHoleLeft = Math.max(0, pillLeft + insetCorner);
          const bgHoleRight = Math.min(fullBarW, pillLeft + pillW - insetCorner);
          const bgMask = `linear-gradient(to right, #000 0px, #000 ${bgHoleLeft}px, transparent ${bgHoleLeft + 4}px, transparent ${bgHoleRight - 4}px, #000 ${bgHoleRight}px, #000 100%)`;
          barBgRef.current.style.maskImage = bgMask;
          barBgRef.current.style.webkitMaskImage = bgMask;
        } else {
          barBgRef.current.style.maskImage = "none";
          barBgRef.current.style.webkitMaskImage = "none";
        }
      }

      // 6. Mover tira gris de íconos y su máscara
      if (grayStripRef.current && grayWindowRef.current) {
        grayStripRef.current.style.width = `${totalStripW}px`;
        grayStripRef.current.style.transform = `translate3d(${-s.scrollX}px, 0, 0)`;

        const holeLeft = Math.max(0, spanLeft - s.extraW / 2 + 3);
        const holeRight = Math.min(s.trackWidth, spanRight + s.extraW / 2 - 3);
        const mask = `linear-gradient(to right, #000 0px, #000 ${holeLeft}px, transparent ${holeLeft + 2}px, transparent ${holeRight - 2}px, #000 ${holeRight}px, #000 100%)`;
        grayWindowRef.current.style.maskImage = mask;
        grayWindowRef.current.style.webkitMaskImage = mask;
      }

      // 7. Posicionar píldora, cuerpo del menú clonado (para refracción arriba/abajo) y tira negra de íconos
      if (pillRef.current && blackStripRef.current && menuBodyCloneRef.current) {
        pillRef.current.style.width = `${pillW}px`;
        pillRef.current.style.height = `${pillH}px`;
        pillRef.current.style.transform = `translate3d(${pillLeft}px, ${pillTop}px, 0)`;

        const innerY = -4 + s.extraH / 2;

        // El clon de la pastilla horizontal del menú dentro del filtro SVG:
        // Así los bordes de arriba y abajo del botón flotante curvan e invierten el cuerpo del menú
        menuBodyCloneRef.current.style.width = `${fullBarW}px`;
        menuBodyCloneRef.current.style.transform = `translate3d(${-pillLeft}px, ${innerY}px, 0)`;
        menuBodyCloneRef.current.style.opacity = s.extraH > 2 ? "1" : "0";

        const innerX = -spanLeft - s.scrollX + s.extraW / 2;
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

    const s = state.current;
    s.startX = e.clientX;
    s.pointerX = e.clientX;
    s.startScrollX = s.scrollX;

    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left - 4;
    const spanLeft = Math.min(s.leftX, s.rightX);
    const spanRight = Math.max(s.leftX, s.rightX) + s.slotWidth;
    const hitActivePill = localX >= spanLeft - 6 && localX <= spanRight + 6;

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
      }, 150);
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
      elevateGlass(false);

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
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter
            ref={fgFilterRef}
            id="srdavo-pill-fg"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="126"
            height="80"
            colorInterpolationFilters="sRGB"
          >
            {bezelMapUrl && (
              <feImage
                ref={fgImageRef}
                href={bezelMapUrl}
                x="0"
                y="0"
                width="126"
                height="80"
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
            ref={bgFilterRef}
            id="srdavo-pill-bg"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="126"
            height="80"
            colorInterpolationFilters="sRGB"
          >
            {bezelMapUrl && (
              <feImage
                ref={bgImageRef}
                href={bezelMapUrl}
                x="0"
                y="0"
                width="126"
                height="80"
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

      {/* Contenedor interactivo del Menú */}
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
        className={`relative flex items-center h-[58px] px-1 rounded-full select-none cursor-pointer ${className}`}
      >
        {/* Cuerpo de pastilla horizontal del menú (se recorta bajo la gota elevada para que no se vea recto) */}
        <div
          ref={barBgRef}
          className="absolute inset-0 rounded-full bg-[#DCDCDC]/88 dark:bg-zinc-800/88 backdrop-blur-md pointer-events-none"
        />

        {/* CAPA 1: Ítems en Gris */}
        <div
          ref={grayWindowRef}
          className="relative z-10 w-full h-full overflow-hidden rounded-full pointer-events-none"
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
                  <span className="text-[12px] leading-tight tracking-tight truncate max-w-[90%]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CAPA 2: Botón Flotante Liquid Glass */}
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
              ? "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.18) 100%)"
              : "rgba(255, 255, 255, 0.66)",
          }}
          className="absolute z-20 rounded-full overflow-hidden pointer-events-none transition-[background] duration-200"
        >
          {/* Ventana óptica que refracta TANTO el cuerpo horizontal del menú (arriba/abajo) COMO los íconos (laterales) */}
          <div
            style={{
              filter: "url(#srdavo-pill-fg)",
            }}
            className="relative w-full h-full overflow-hidden rounded-full"
          >
            {/* Clon sincronizado del cuerpo de pastilla horizontal del menú */}
            <div
              ref={menuBodyCloneRef}
              style={{ willChange: "transform, opacity" }}
              className="absolute top-0 left-0 h-[58px] rounded-full bg-[#DCDCDC]/92 dark:bg-zinc-800/92 border-y border-black/[0.08] dark:border-white/[0.08]"
            />

            {/* Tira de íconos activos en negro */}
            <div
              ref={blackStripRef}
              style={{
                willChange: "transform",
              }}
              className="absolute top-0 left-0 flex h-[58px] items-center"
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
                    <span className="text-[12px] leading-tight tracking-tight truncate max-w-[90%]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bisel especular en overlay */}
          <div
            style={{
              border: isElevated
                ? "1.5px solid rgba(255, 255, 255, 0.94)"
                : "1px solid rgba(255, 255, 255, 0.85)",
              boxShadow: isElevated
                ? `
                  inset 0 4px 8px rgba(255, 255, 255, 0.98),
                  inset 0 -4px 8px rgba(255, 255, 255, 0.90),
                  inset 0 0 14px rgba(255, 255, 255, 0.38),
                  0 12px 28px rgba(0, 0, 0, 0.16)
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
