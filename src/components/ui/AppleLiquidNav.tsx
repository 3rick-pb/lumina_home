"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// Mapa de lente convexa SVG para refracción y separación cromática RGB en los bordes
const CONVEX_LENS_MAP = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgb(128,128,255)" />
        <stop offset="65%" stop-color="rgb(128,128,220)" />
        <stop offset="88%" stop-color="rgb(210,70,128)" />
        <stop offset="100%" stop-color="rgb(255,0,128)" />
      </radialGradient>
    </defs>
    <rect width="200" height="200" rx="100" fill="url(#g)" />
  </svg>
`)}`;

export interface NavItem {
  id: string;
  label: string;
  badge?: number;
  badgeCount?: number;
  icon: React.ReactNode;
  onClick?: () => void;
}

export interface AppleLiquidNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  visibleCount?: number;
  className?: string;
}

export function AppleLiquidNav({
  items,
  activeId,
  onSelect,
  visibleCount = 3,
  className = "",
}: AppleLiquidNavProps) {
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === activeId));
  const [isGlassActive, setIsGlassActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const baseStripRef = useRef<HTMLDivElement>(null);
  const dropletRef = useRef<HTMLDivElement>(null);
  const lensStripRef = useRef<HTMLDivElement>(null);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeCooldownRef = useRef<number>(0);

  // Estado del motor físico a 60/120fps
  const phys = useRef({
    slotWidth: 100,
    innerWidth: 300,
    // Posición de la gota dentro de la ventana visible (0 a 2 * slotWidth)
    dropletX: 0,
    targetDropletX: 0,
    velDropletX: 0,
    // Desplazamiento del carrusel de 10 ítems (múltiplos de slotWidth)
    scrollX: 0,
    targetScrollX: 0,
    velScrollX: 0,
    // Escala elástica de la gota
    scaleX: 1,
    scaleY: 1,
    // Interacción
    mode: "idle" as "idle" | "pending" | "scrubbing" | "scrolling",
    startX: 0,
    startScrollX: 0,
    pointerX: 0,
  });

  // Medir contenedor y sincronizar con el tab activo
  const measureAndSync = useCallback(
    (snapImmediately = false) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pad = 12; // 6px padding izq + 6px der
      const innerW = rect.width - pad;
      const slotW = innerW / visibleCount;

      const p = phys.current;
      p.innerWidth = innerW;
      p.slotWidth = slotW;

      // Calcular en qué página de 3 está el ítem activo
      const maxStartIndex = Math.max(0, items.length - visibleCount);
      const pageStartIndex = Math.min(
        maxStartIndex,
        Math.floor(activeIndex / visibleCount) * visibleCount
      );

      const newTargetScrollX = pageStartIndex * slotW;
      const localIndex = activeIndex - pageStartIndex;
      const newTargetDropletX = localIndex * slotW;

      p.targetScrollX = newTargetScrollX;
      p.targetDropletX = newTargetDropletX;

      if (snapImmediately) {
        p.scrollX = newTargetScrollX;
        p.dropletX = newTargetDropletX;
      }
    },
    [activeIndex, items.length, visibleCount]
  );

  useEffect(() => {
    measureAndSync(true);
    const onResize = () => measureAndSync(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureAndSync]);

  // Motor de física continua (Resorte para Gota + Resorte para Carrusel de 10 ítems)
  useEffect(() => {
    let raf: number;

    const loop = (now: number) => {
      const p = phys.current;
      const isScrubbing = p.mode === "scrubbing";

      // Auto-scroll cuando arrastras la gota al borde izquierdo o derecho
      if (isScrubbing && now - edgeCooldownRef.current > 420) {
        const edgeZone = p.slotWidth * 0.28;
        const maxScroll = Math.max(0, (items.length - visibleCount) * p.slotWidth);

        if (p.targetDropletX > p.innerWidth - p.slotWidth - edgeZone && p.targetScrollX < maxScroll) {
          p.targetScrollX = Math.min(maxScroll, p.targetScrollX + p.slotWidth * visibleCount);
          edgeCooldownRef.current = now;
        } else if (p.targetDropletX < edgeZone && p.targetScrollX > 0) {
          p.targetScrollX = Math.max(0, p.targetScrollX - p.slotWidth * visibleCount);
          edgeCooldownRef.current = now;
        }
      }

      // 1. Física de la Gota
      const dStiff = isScrubbing ? 0.28 : 0.16;
      const dDamp = isScrubbing ? 0.68 : 0.75;
      p.velDropletX = (p.velDropletX + (p.targetDropletX - p.dropletX) * dStiff) * dDamp;
      p.dropletX += p.velDropletX;

      // 2. Física del Carrusel de ~10 ítems
      const sStiff = p.mode === "scrolling" ? 0.35 : 0.14;
      const sDamp = p.mode === "scrolling" ? 0.65 : 0.78;
      p.velScrollX = (p.velScrollX + (p.targetScrollX - p.scrollX) * sStiff) * sDamp;
      p.scrollX += p.velScrollX;

      // 3. Deformación líquida proporcional a la velocidad
      const speed = Math.min(Math.abs(p.velDropletX), 26);
      const stretchX = speed * 0.012;
      const squishY = speed * 0.006;

      const baseScaleX = isScrubbing ? 1.15 : 1.0;
      const baseScaleY = isScrubbing ? 1.25 : 1.0; // Sobresale por arriba y abajo al pulsar

      p.scaleX += (baseScaleX + stretchX - p.scaleX) * 0.22;
      p.scaleY += (Math.max(0.92, baseScaleY - squishY) - p.scaleY) * 0.22;

      const stripTotalWidth = items.length * p.slotWidth;

      // Aplicar transformaciones aceleradas por GPU
      if (baseStripRef.current) {
        baseStripRef.current.style.width = `${stripTotalWidth}px`;
        baseStripRef.current.style.transform = `translate3d(${-p.scrollX}px, 0, 0)`;
      }

      if (dropletRef.current && lensStripRef.current) {
        dropletRef.current.style.width = `${p.slotWidth}px`;
        dropletRef.current.style.transform = `translate3d(${6 + p.dropletX}px, 0, 0) scale(${p.scaleX}, ${p.scaleY})`;

        // SINCRONIZACIÓN QUIRÚRGICA: Compensa tanto la posición de la gota como el scroll de los 10 ítems
        const zoom = isScrubbing ? 1.15 : 1.0;
        const invX = (1 / p.scaleX) * zoom;
        const invY = (1 / p.scaleY) * zoom;
        lensStripRef.current.style.width = `${stripTotalWidth}px`;
        lensStripRef.current.style.transform = `scale(${invX}, ${invY}) translate3d(${-(p.dropletX + p.scrollX)}px, 0, 0)`;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [items.length, visibleCount]);

  const clampDropletX = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const { slotWidth, innerWidth } = phys.current;
    const raw = clientX - rect.left - 6 - slotWidth / 2;
    return Math.max(0, Math.min(innerWidth - slotWidth, raw));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const p = phys.current;
    p.startX = e.clientX;
    p.pointerX = e.clientX;
    p.startScrollX = p.scrollX;

    // Verificar si el usuario tocó directamente sobre la gota actual
    const rect = e.currentTarget.getBoundingClientRect();
    const touchLocalX = e.clientX - rect.left - 6;
    const touchedOnDroplet =
      touchLocalX >= p.dropletX - 8 && touchLocalX <= p.dropletX + p.slotWidth + 8;

    if (touchedOnDroplet) {
      p.mode = "scrubbing";
      setIsGlassActive(true);
      p.targetDropletX = clampDropletX(e.clientX);
    } else {
      p.mode = "pending";
      // Si mantiene pulsado 140ms sin hacer swipe rápido, invoca la gota hacia su dedo
      holdTimerRef.current = setTimeout(() => {
        if (phys.current.mode === "pending") {
          phys.current.mode = "scrubbing";
          setIsGlassActive(true);
          phys.current.targetDropletX = clampDropletX(phys.current.pointerX);
        }
      }, 140);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = phys.current;
    p.pointerX = e.clientX;
    const deltaX = e.clientX - p.startX;

    if (p.mode === "pending" && Math.abs(deltaX) > 10) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      p.mode = "scrolling";
    }

    if (p.mode === "scrubbing") {
      p.targetDropletX = clampDropletX(e.clientX);
    } else if (p.mode === "scrolling") {
      const maxScroll = Math.max(0, (items.length - visibleCount) * p.slotWidth);
      p.targetScrollX = Math.max(0, Math.min(maxScroll, p.startScrollX - deltaX));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const p = phys.current;
    const maxScroll = Math.max(0, (items.length - visibleCount) * p.slotWidth);
    const pageWidth = p.slotWidth * visibleCount;

    if (p.mode === "scrolling") {
      // Encajar el carrusel en bloques exactos de 3 en 3
      const deltaX = e.clientX - p.startX;
      let targetPage = Math.round(p.startScrollX / pageWidth);
      if (deltaX < -35) targetPage += 1;
      if (deltaX > 35) targetPage -= 1;

      p.targetScrollX = Math.max(0, Math.min(maxScroll, targetPage * pageWidth));
      // Mantener la gota en su ítem real
      p.targetDropletX = activeIndex * p.slotWidth - p.targetScrollX;
    } else if (p.mode === "scrubbing" || p.mode === "pending") {
      // Si fue un toque simple o soltó la gota, calcular a cuál de los ~10 ítems cayó
      const finalDropletX = p.mode === "pending" ? clampDropletX(e.clientX) : p.targetDropletX;
      const absoluteX = p.targetScrollX + finalDropletX + p.slotWidth / 2;
      const chosenIndex = Math.max(
        0,
        Math.min(items.length - 1, Math.floor(absoluteX / p.slotWidth))
      );

      p.targetDropletX = chosenIndex * p.slotWidth - p.targetScrollX;
      if (items[chosenIndex]) {
        onSelect(items[chosenIndex].id);
        items[chosenIndex].onClick?.();
      }
    }

    p.mode = "idle";
    setIsGlassActive(false);
  };

  return (
    <>
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="apple-liquid-glass-10" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feImage href={CONVEX_LENS_MAP} result="lens" preserveAspectRatio="none" />
            <feDisplacementMap in="SourceGraphic" in2="lens" scale="20" xChannelSelector="R" yChannelSelector="G" result="r" />
            <feColorMatrix in="r" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rOut" />
            <feDisplacementMap in="SourceGraphic" in2="lens" scale="12" xChannelSelector="R" yChannelSelector="G" result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gOut" />
            <feDisplacementMap in="SourceGraphic" in2="lens" scale="5" xChannelSelector="R" yChannelSelector="G" result="b" />
            <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bOut" />
            <feBlend in="rOut" in2="gOut" mode="screen" result="rg" />
            <feBlend in="rg" in2="bOut" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* Cápsula Principal (sin overflow-hidden para que la gota sobresalga arriba y abajo al pulsar) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
        className={`relative flex items-center h-16 px-1.5 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.12)] select-none ${className}`}
      >
        {/* Ventana que recorta la tira base de 10 ítems a los 3 visibles */}
        <div className="relative w-full h-full overflow-hidden rounded-full pointer-events-none">
          <div
            ref={baseStripRef}
            className="flex h-full items-center will-change-transform"
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{ width: `${100 / items.length}%` }}
                className="flex flex-col items-center justify-center gap-0.5 text-zinc-800 dark:text-zinc-200"
              >
                <div className="relative flex items-center justify-center">
                  {item.icon}
                  {typeof (item.badge ?? item.badgeCount) === "number" &&
                  (item.badge ?? item.badgeCount)! > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 text-[9px] font-black text-white bg-rose-500 rounded-full flex items-center justify-center shadow-xs">
                      {(item.badge ?? item.badgeCount)! > 99 ? "99+" : (item.badge ?? item.badgeCount)}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10.5px] font-medium tracking-tight truncate max-w-[90%] mt-0.5">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GOTA DE LIQUID GLASS (Contiene el clon de los 10 ítems en azul + lupa) */}
        <div
          ref={dropletRef}
          style={{
            top: "5px",
            bottom: "5px",
            left: 0,
            willChange: "transform, width",
            backdropFilter: isGlassActive
              ? "url(#apple-liquid-glass-10) blur(1.5px) saturate(200%)"
              : "blur(8px) saturate(150%)",
            WebkitBackdropFilter: isGlassActive
              ? "url(#apple-liquid-glass-10) blur(1.5px) saturate(200%)"
              : "blur(8px) saturate(150%)",
            background: isGlassActive
              ? "radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0.3) 100%)"
              : "rgba(255, 255, 255, 0.85)",
            boxShadow: isGlassActive
              ? `
                inset 0 2px 3px rgba(255, 255, 255, 0.98),
                inset 0 -2px 3px rgba(255, 255, 255, 0.8),
                inset 3px 0 6px rgba(0, 170, 255, 0.38),
                inset -3px 0 6px rgba(255, 120, 50, 0.38),
                0 12px 28px rgba(0, 0, 0, 0.22)
              `
              : "inset 0 1px 1.5px rgba(255, 255, 255, 0.9), 0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
          className="absolute z-20 rounded-full overflow-hidden pointer-events-none transition-[background,box-shadow] duration-200 dark:bg-zinc-800/85"
        >
          <div
            ref={lensStripRef}
            style={{
              filter: isGlassActive ? "url(#apple-liquid-glass-10)" : "none",
              transformOrigin: "left center",
              willChange: "transform",
            }}
            className="absolute top-[-5px] bottom-[-5px] left-0 flex h-16 items-center bg-white/35 dark:bg-white/10"
          >
            {items.map((item) => (
              <div
                key={`lens-${item.id}`}
                style={{ width: `${100 / items.length}%` }}
                className="flex flex-col items-center justify-center gap-0.5 text-[#0066FF] dark:text-[#38bdf8] font-bold"
              >
                <div className="relative flex items-center justify-center">
                  {item.icon}
                  {typeof (item.badge ?? item.badgeCount) === "number" &&
                  (item.badge ?? item.badgeCount)! > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 text-[9px] font-black text-white bg-rose-500 rounded-full flex items-center justify-center shadow-xs">
                      {(item.badge ?? item.badgeCount)! > 99 ? "99+" : (item.badge ?? item.badgeCount)}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10.5px] font-bold tracking-tight truncate max-w-[90%] mt-0.5">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
