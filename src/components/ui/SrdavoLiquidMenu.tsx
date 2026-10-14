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
  onSearchClick?: () => void;
  isSearchActive?: boolean;
  visibleCount?: number;
  className?: string;
}

/**
 * Generador de mapas de desplazamiento SDF basados en srdavo/liquid-glass:
 * - "pill-fg": Bordes laterales más gruesos (bezelStart = 0.54) con inversión óptica para íconos vecinos.
 * - "pill-bg": Refractor completo (X e Y) para el backdrop de la píldora flotante.
 * - "bar": Mapa de refracción de cápsula ancha para el cuerpo del menú principal.
 * - "orb": Mapa de lente circular para el botón de la lupa de búsqueda.
 */
function createSrdavoDisplacementMap(
  type: "pill-fg" | "pill-bg" | "bar" | "orb"
): string {
  if (typeof document === "undefined") return "";
  const W = type === "bar" ? 360 : type === "orb" ? 128 : 256;
  const H = 128;
  const R = H / 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(W, H);
  const data = img.data;

  const bezelStart = type === "bar" ? 0.62 : type === "orb" ? 0.48 : 0.54;
  const bezelSpan = 1.0 - bezelStart;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cx = Math.max(R, Math.min(W - R, x));
      const cy = R;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const r = dist / R;

      let rChan = 128;
      let gChan = 128;

      if (r > bezelStart && r <= 1.04 && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const t = Math.min(1, (r - bezelStart) / bezelSpan);

        let profile = 0;
        if (t < 0.58) {
          const u = t / 0.58;
          profile = -Math.sin(u * Math.PI) * 0.78;
        } else {
          const v = (t - 0.58) / 0.42;
          profile = Math.pow(Math.sin(v * Math.PI * 0.5), 1.35) * 1.0;
        }

        rChan = Math.max(
          0,
          Math.min(255, Math.round(128 + nx * profile * 127))
        );

        if (type === "pill-fg") {
          const lateralWeight = 0.35 + 0.65 * Math.abs(nx);
          gChan = Math.max(
            0,
            Math.min(255, Math.round(128 + ny * profile * lateralWeight * 68))
          );
        } else {
          gChan = Math.max(
            0,
            Math.min(255, Math.round(128 - ny * profile * 127))
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
  onSearchClick,
  isSearchActive = false,
  visibleCount = 3,
  className = "",
}: SrdavoLiquidMenuProps) {
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === activeId));
  const [isElevated, setIsElevated] = useState(false);
  const [isSearchPressed, setIsSearchPressed] = useState(false);

  const [maps, setMaps] = useState<{
    fg: string;
    bg: string;
    bar: string;
    orb: string;
  }>({ fg: "", bg: "", bar: "", orb: "" });

  const trackRef = useRef<HTMLDivElement>(null);
  const grayWindowRef = useRef<HTMLDivElement>(null);
  const grayStripRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const blackStripRef = useRef<HTMLDivElement>(null);

  const fgFilterRef = useRef<SVGFilterElement>(null);
  const bgFilterRef = useRef<SVGFilterElement>(null);
  const barFilterRef = useRef<SVGFilterElement>(null);
  const fgImageRef = useRef<SVGFEImageElement>(null);
  const bgImageRef = useRef<SVGFEImageElement>(null);
  const barImageRef = useRef<SVGFEImageElement>(null);
  const fgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const bgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);

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
    refraction: 0,
    mode: "idle" as "idle" | "pending" | "scrubbing" | "scrolling",
    elevated: false,
    inFlight: false,
    startX: 0,
    startY: 0,
    startScrollX: 0,
    pointerX: 0,
  });

  useEffect(() => {
    setMaps({
      fg: createSrdavoDisplacementMap("pill-fg"),
      bg: createSrdavoDisplacementMap("pill-bg"),
      bar: createSrdavoDisplacementMap("bar"),
      orb: createSrdavoDisplacementMap("orb"),
    });
  }, []);

  const syncLayout = useCallback(
    (immediate = false) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const visibleW = grayWindowRef.current?.clientWidth || Math.max(120, rect.width - 8);
      const slotW = visibleW / visibleCount;

      const s = state.current;
      s.trackWidth = visibleW;
      s.slotWidth = slotW;

      if (barFilterRef.current && barImageRef.current) {
        const bw = rect.width.toFixed(1);
        const bh = rect.height.toFixed(1);
        barFilterRef.current.setAttribute("width", bw);
        barFilterRef.current.setAttribute("height", bh);
        barImageRef.current.setAttribute("width", bw);
        barImageRef.current.setAttribute("height", bh);
      }

      // Si estamos haciendo scroll manual, no forzar el salto de página hasta seleccionar
      if (s.mode !== "scrolling") {
        const maxScroll = Math.max(0, (items.length - visibleCount) * slotW);
        // Asegurar que el ícono activo sea visible dentro de la ventana actual
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

      // Auto-scroll suave de 1 en 1 ícono cuando mantienes la gota en el borde
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

      // 1. Física del carrusel de ~10 íconos (1:1 inmediato al deslizar con el dedo, sin lag)
      const cStiff = scrolling ? 0.48 : 0.16;
      const cDamp = scrolling ? 0.62 : 0.78;
      s.velScrollX = (s.velScrollX + (s.targetScrollX - s.scrollX) * cStiff) * cDamp;
      s.scrollX += s.velScrollX;

      // Si no está arrastrando la gota, la píldora sigue la posición de su ícono activo respecto al scroll
      if (!scrubbing && !s.inFlight) {
        s.targetPillX = activeIndex * s.slotWidth - s.scrollX;
      }

      // 2. Física de Doble Resorte para la píldora (efecto oruga líquida al tocar otro ícono)
      const movingRight = s.targetPillX >= (s.leftX + s.rightX) * 0.5;
      const fastStiff = scrubbing ? 0.32 : scrolling ? 0.55 : 0.24;
      const fastDamp = scrubbing ? 0.68 : scrolling ? 0.60 : 0.75;
      const slowStiff = scrubbing ? 0.24 : scrolling ? 0.55 : 0.11;
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

      // 3. Elevación y desborde tanto al mantener presionado como al viajar con un toque (inFlight)
      const activeGlass = s.elevated || s.inFlight;
      const targetExtraW = s.elevated
        ? 12
        : s.inFlight
        ? 8 + Math.min(6, stretchSpan * 0.2)
        : 0;
      const targetExtraH = s.elevated
        ? 28
        : s.inFlight
        ? 22
        : 0;

      s.extraW += (targetExtraW - s.extraW) * 0.24;
      s.extraH += (targetExtraH - s.extraH) * 0.24;

      // 4. Potencia de refracción en los bordes
      const targetRefraction = activeGlass ? 44 : 0;
      s.refraction += (targetRefraction - s.refraction) * 0.24;

      // 5. Clampeo horizontal para que la píldora NUNCA se salga sobre la lupa al hacer scroll
      const clampedLeft = Math.max(0, rawSpanLeft);
      const clampedRight = Math.min(s.trackWidth, rawSpanRight);
      const visibleSpanW = clampedRight - clampedLeft;

      const totalStripW = items.length * s.slotWidth;
      const pillW = Math.max(0, visibleSpanW + s.extraW);
      const pillH = 50 + s.extraH;
      const pillLeft = 4 + clampedLeft - s.extraW / 2;
      const pillTop = 4 - s.extraH / 2;

      const wStr = Math.max(1, pillW).toFixed(1);
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

      // Mover tira gris de fondo y recortar máscara bajo la píldora
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

      // Posicionar píldora y compensar tira negra interna
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

    // Solo si mantiene presionado quieto durante 200ms se activa el arrastre de la gota Liquid Glass.
    // Así cualquier swipe inmediato mueve el carrusel sin lag ni confusión.
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

    // Si desliza el dedo más de 6px antes de los 200ms -> es un Swipe del carrusel 100% fluido
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
      // Al terminar de deslizar el carrusel: encaja al slot más cercano con inercia, NUNCA selecciona un ícono por error
      const inertia = (s.startX - e.clientX) * 0.35;
      const snappedScroll =
        Math.round((s.targetScrollX + inertia) / s.slotWidth) * s.slotWidth;
      s.targetScrollX = Math.max(0, Math.min(maxScroll, snappedScroll));
      setGlassVisualState(false, false);
    } else if (s.mode === "pending") {
      // Toque limpio (Tap) sobre un ícono -> Vuelo Líquido con estiramiento y refracción activa
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
        // Activar el cristal líquido durante el vuelo entre el ícono viejo y el nuevo
        setGlassVisualState(false, true);
        s.targetPillX = nextTargetX;
        if (items[nextIdx]) {
          onSelect(items[nextIdx].id);
          items[nextIdx].onClick?.();
        }
        flightTimer.current = setTimeout(() => {
          setGlassVisualState(false, false);
        }, 380);
      } else {
        // Pequeño pulso líquido si toca el ícono que ya estaba activo
        setGlassVisualState(false, true);
        if (items[nextIdx]) {
          onSelect(items[nextIdx].id);
          items[nextIdx].onClick?.();
        }
        flightTimer.current = setTimeout(() => {
          setGlassVisualState(false, false);
        }, 220);
      }
    } else if (s.mode === "scrubbing") {
      // Soltó después de arrastrar la gota manteniendo presionado
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
    <>
      {/* Filtros SVG de srdavo/liquid-glass para los 3 elementos: Barra, Píldora y Lupa */}
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* 1. Filtro del frente de la píldora (íconos activos) */}
          <filter
            ref={fgFilterRef}
            id="srdavo-pill-fg"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="120"
            height="78"
            colorInterpolationFilters="sRGB"
          >
            {maps.fg && (
              <feImage
                ref={fgImageRef}
                href={maps.fg}
                x="0"
                y="0"
                width="120"
                height="78"
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

          {/* 2. Filtro de fondo de la píldora */}
          <filter
            ref={bgFilterRef}
            id="srdavo-pill-bg"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="120"
            height="78"
            colorInterpolationFilters="sRGB"
          >
            {maps.bg && (
              <feImage
                ref={bgImageRef}
                href={maps.bg}
                x="0"
                y="0"
                width="120"
                height="78"
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

          {/* 3. Filtro Liquid Glass para el Cuerpo del Menú */}
          <filter
            ref={barFilterRef}
            id="srdavo-bar-glass"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="320"
            height="58"
            colorInterpolationFilters="sRGB"
          >
            {maps.bar && (
              <feImage
                ref={barImageRef}
                href={maps.bar}
                x="0"
                y="0"
                width="320"
                height="58"
                preserveAspectRatio="none"
                result="barMap"
              />
            )}
            <feDisplacementMap
              in="SourceGraphic"
              in2="barMap"
              scale="24"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* 4. Filtro Liquid Glass para el Botón Circular de la Lupa */}
          <filter
            id="srdavo-lupa-glass"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="58"
            height="58"
            colorInterpolationFilters="sRGB"
          >
            {maps.orb && (
              <feImage
                href={maps.orb}
                x="0"
                y="0"
                width="58"
                height="58"
                preserveAspectRatio="none"
                result="orbMap"
              />
            )}
            <feDisplacementMap
              in="SourceGraphic"
              in2="orbMap"
              scale={isSearchPressed ? "36" : "24"}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Contenedor General: Cuerpo del Menú + Botón de Lupa de Búsqueda */}
      <div className={`flex items-center gap-2.5 w-full max-w-full min-w-0 overflow-visible px-1 box-border mx-auto ${className}`}>
        {/* CUERPO DEL MENÚ CON LIQUID GLASS REAL (srdavo-bar-glass) */}
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
            backdropFilter: "url(#srdavo-bar-glass) blur(8px) saturate(180%)",
            WebkitBackdropFilter: "url(#srdavo-bar-glass) blur(8px) saturate(180%)",
            background:
              "linear-gradient(180deg, rgba(245,245,250,0.42) 0%, rgba(225,225,232,0.26) 100%)",
            boxShadow: `
              inset 0 1.5px 3px rgba(255, 255, 255, 0.9),
              inset 0 -1.5px 3px rgba(255, 255, 255, 0.55),
              0 10px 30px rgba(0, 0, 0, 0.10)
            `,
            border: "1px solid rgba(255, 255, 255, 0.7)",
          }}
          className="relative flex-1 min-w-0 w-full overflow-visible flex items-center h-[58px] px-1 rounded-full select-none cursor-pointer"
        >
          {/* Reflejo especular superior característico de srdavo/liquid-glass */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full z-0" />

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

          {/* CAPA 2: Píldora Activa Liquid Glass */}
          <div
            ref={pillRef}
            style={{
              top: 0,
              left: 0,
              willChange: "transform, width, height, opacity",
              backdropFilter: isElevated
                ? "url(#srdavo-pill-bg) blur(1px) saturate(190%)"
                : "blur(6px)",
              WebkitBackdropFilter: isElevated
                ? "url(#srdavo-pill-bg) blur(1px) saturate(190%)"
                : "blur(6px)",
              background: isElevated
                ? "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.18) 100%)"
                : "rgba(255, 255, 255, 0.72)",
            }}
            className="absolute z-20 rounded-full overflow-hidden pointer-events-none transition-[background] duration-150"
          >
            <div
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

            <div
              style={{
                border: isElevated
                  ? "1.5px solid rgba(255, 255, 255, 0.95)"
                  : "1px solid rgba(255, 255, 255, 0.88)",
                boxShadow: isElevated
                  ? `
                    inset 0 3.5px 7px rgba(255, 255, 255, 0.98),
                    inset 0 -3.5px 7px rgba(255, 255, 255, 0.88),
                    inset 0 0 12px rgba(255, 255, 255, 0.35),
                    0 12px 28px rgba(0, 0, 0, 0.15)
                  `
                  : "inset 0 1px 2px rgba(255, 255, 255, 0.92), 0 2px 6px rgba(0, 0, 0, 0.05)",
              }}
              className="absolute inset-0 rounded-full pointer-events-none transition-[border,box-shadow] duration-150"
            />
          </div>
        </div>

        {/* BOTÓN DE LUPA DE BÚSQUEDA CON LIQUID GLASS REAL (srdavo-lupa-glass) */}
        {onSearchClick && (
          <button
            type="button"
            onClick={onSearchClick}
            onPointerDown={() => setIsSearchPressed(true)}
            onPointerUp={() => setIsSearchPressed(false)}
            onPointerLeave={() => setIsSearchPressed(false)}
            style={{
              backdropFilter: "url(#srdavo-lupa-glass) blur(6px) saturate(180%)",
              WebkitBackdropFilter: "url(#srdavo-lupa-glass) blur(6px) saturate(180%)",
              background: isSearchActive
                ? "rgba(224, 122, 63, 0.95)"
                : isSearchPressed
                ? "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.32) 100%)"
                : "linear-gradient(180deg, rgba(250,250,255,0.46) 0%, rgba(230,230,238,0.28) 100%)",
              boxShadow: isSearchActive
                ? "0 0 24px rgba(224,122,63,0.6), inset 0 2px 4px rgba(255,255,255,0.8)"
                : isSearchPressed
                ? `
                  inset 0 3px 6px rgba(255, 255, 255, 0.98),
                  inset 0 -3px 6px rgba(255, 255, 255, 0.9),
                  0 10px 24px rgba(0, 0, 0, 0.16)
                `
                : `
                  inset 0 1.5px 3px rgba(255, 255, 255, 0.92),
                  inset 0 -1.5px 3px rgba(255, 255, 255, 0.6),
                  0 10px 26px rgba(0, 0, 0, 0.10)
                `,
              border: isSearchActive
                ? "2px solid rgba(255, 255, 255, 0.9)"
                : "1px solid rgba(255, 255, 255, 0.78)",
              transform: isSearchPressed ? "scale(1.08)" : "scale(1)",
            }}
            className={`relative flex items-center justify-center w-[58px] h-[58px] rounded-full transition-all duration-200 select-none shrink-0 cursor-pointer ${
              isSearchActive ? "text-white" : "text-zinc-900 dark:text-white"
            }`}
            aria-label="Buscar"
          >
            {/* Reflejo especular superior característico de srdavo/liquid-glass */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full" />
            <svg
              className="w-5 h-5 stroke-[2.2] relative z-10"
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
    </>
  );
}

export default SrdavoLiquidMenu;
