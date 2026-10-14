"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getDisplacementFilter, getCapsuleInverseBezelMap } from "./LiquidGlass";

// ============================================================================
// Types
// ============================================================================
export interface LiquidScrubberItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badgeCount?: number;
  title?: string;
  onClick?: () => void;
}

export interface LiquidScrubberNavProps {
  items: LiquidScrubberItem[];
  activeId: string;
  onSelect: (id: string, item: LiquidScrubberItem) => void;
  variant?: "pill" | "dock";
  className?: string;
  activeColor?: string;
}

// Estado físico persistente a nivel de módulo para la barra de navegación del Header:
// Garantiza que la píldora jamás se teletransporte entre cambios de ruta (Home <-> Shop)
const persistedHeaderPhysics = {
  initialized: false,
  leftX: 0,
  rightX: 0,
  velLeftX: 0,
  velRightX: 0,
  extraW: 0,
  extraH: 0,
  refraction: 0,
  glassAlpha: 0,
};

interface TabGeo {
  x: number;
  width: number;
}

/**
 * Apple Liquid Glass Navigation Bar (Header / Nav superior sobre el HERO):
 * - Motor óptico oficial srdavo/liquid-glass con aberración cromática
 * - Resorte asimétrico de doble borde ("Oruga Líquida")
 * - Expansión fluida y refracción óptica con mapa inverso de cápsula
 * - Técnica de doble capa con máscara dinámica bajo la píldora
 */
export function LiquidScrubberNav({
  items,
  activeId,
  onSelect,
  className = "",
  activeColor = "text-black dark:text-white",
}: LiquidScrubberNavProps) {
  const [bezelMapUrl, setBezelMapUrl] = useState<string>("");
  const [trackDims, setTrackDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [tabsGeo, setTabsGeo] = useState<TabGeo[]>([]);
  const [hasSvgFilterSupport, setHasSvgFilterSupport] = useState<boolean>(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const grayWindowRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const activeStripRef = useRef<HTMLDivElement>(null);
  const rimOverlayRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fgFilterRef = useRef<SVGFilterElement>(null);
  const fgImageRef = useRef<SVGFEImageElement>(null);
  const fgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);

  const activeIndex = useMemo(() => {
    const idx = items.findIndex((it) => it.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [items, activeId]);

  const state = useRef({
    leftX: persistedHeaderPhysics.leftX,
    rightX: persistedHeaderPhysics.rightX,
    velLeftX: persistedHeaderPhysics.velLeftX,
    velRightX: persistedHeaderPhysics.velRightX,
    targetLeftX: 0,
    targetRightX: 80,
    extraW: persistedHeaderPhysics.extraW,
    extraH: persistedHeaderPhysics.extraH,
    refraction: persistedHeaderPhysics.refraction,
    glassAlpha: persistedHeaderPhysics.glassAlpha,
    mode: "idle" as "idle" | "scrubbing",
    elevated: false,
    startX: 0,
    pointerX: 0,
  });

  // Detección de soporte SVG en backdrop-filter
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isChromium = /chrome|chromium|edg/.test(ua) && !/iphone|ipad|ipod|firefox|fxios|crios/.test(ua);
      setHasSvgFilterSupport(isChromium);
    }
  }, []);

  // Generar mapa óptico de cápsula
  useEffect(() => {
    setBezelMapUrl(getCapsuleInverseBezelMap());
  }, []);

  // Medir dimensiones del track y de cada pestaña
  const measureTabs = useCallback(() => {
    if (!trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const w = Math.ceil(trackRect.width);
    const h = Math.ceil(trackRect.height);
    if (w > 0 && h > 0) {
      setTrackDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    }

    const newGeo: TabGeo[] = [];
    for (let i = 0; i < items.length; i++) {
      const el = tabRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) {
          newGeo.push({
            x: rect.left - trackRect.left,
            width: rect.width,
          });
        }
      }
    }
    if (newGeo.length === items.length) {
      setTabsGeo(newGeo);
    }
  }, [items.length]);

  useEffect(() => {
    measureTabs();
    window.addEventListener("resize", measureTabs);
    const t1 = setTimeout(measureTabs, 60);
    const t2 = setTimeout(measureTabs, 180);
    return () => {
      window.removeEventListener("resize", measureTabs);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measureTabs]);

  // Filtro Liquid Glass para el cuerpo de la barra
  const barFilterUrl = useMemo(() => {
    if (!hasSvgFilterSupport || trackDims.width === 0 || trackDims.height === 0) return null;
    return getDisplacementFilter({
      width: trackDims.width,
      height: trackDims.height,
      radius: 9999,
      depth: 4,
      strength: 22,
      chromaticAberration: 1.4,
    });
  }, [hasSvgFilterSupport, trackDims.width, trackDims.height]);

  // Sincronizar destino geométrico de la pestaña activa
  const updateTargets = useCallback(
    (snapImmediately = false) => {
      if (tabsGeo.length === 0 || !tabsGeo[activeIndex]) return;
      const geo = tabsGeo[activeIndex];
      const s = state.current;

      s.targetLeftX = geo.x;
      s.targetRightX = geo.x + geo.width;

      if (snapImmediately && !persistedHeaderPhysics.initialized) {
        s.leftX = s.targetLeftX;
        s.rightX = s.targetRightX;
        persistedHeaderPhysics.initialized = true;
      }
    },
    [activeIndex, tabsGeo]
  );

  useEffect(() => {
    updateTargets(false);
  }, [activeIndex, tabsGeo, updateTargets]);

  useEffect(() => {
    updateTargets(true);
  }, [updateTargets]);

  // Loop de renderizado y resortes asimétricos Liquid Glass
  useEffect(() => {
    let rafId: number;

    const animate = () => {
      const s = state.current;
      const scrubbing = s.mode === "scrubbing";

      // 1. Doble Resorte Asimétrico ("Oruga Líquida"):
      // El borde delantero se estira rápidamente hacia la nueva pestaña y el trasero lo sigue elásticamente.
      const currentCenter = (s.leftX + s.rightX) * 0.5;
      const targetCenter = (s.targetLeftX + s.targetRightX) * 0.5;
      const movingRight = targetCenter >= currentCenter;

      const fastStiff = scrubbing ? 0.38 : 0.24;
      const fastDamp = scrubbing ? 0.70 : 0.76;
      const slowStiff = scrubbing ? 0.32 : 0.12;
      const slowDamp = scrubbing ? 0.70 : 0.78;

      const leftStiff = movingRight ? slowStiff : fastStiff;
      const leftDamp = movingRight ? slowDamp : fastDamp;
      const rightStiff = movingRight ? fastStiff : slowStiff;
      const rightDamp = movingRight ? fastDamp : slowDamp;

      s.velLeftX = (s.velLeftX + (s.targetLeftX - s.leftX) * leftStiff) * leftDamp;
      s.velRightX = (s.velRightX + (s.targetRightX - s.rightX) * rightStiff) * rightDamp;

      // Limitar velocidad máxima para evitar rebotes exagerados en saltos lejanos (#1 -> #4)
      const maxVel = 18;
      s.velLeftX = Math.max(-maxVel, Math.min(maxVel, s.velLeftX));
      s.velRightX = Math.max(-maxVel, Math.min(maxVel, s.velRightX));

      s.leftX += s.velLeftX;
      s.rightX += s.velRightX;

      // Amortiguación de rebote: nunca permitir que la píldora sobrepase más de 4px el destino
      if (!scrubbing) {
        if (movingRight && s.rightX > s.targetRightX + 4) {
          s.rightX = s.targetRightX + 4;
          s.velRightX *= 0.2;
        } else if (!movingRight && s.leftX < s.targetLeftX - 4) {
          s.leftX = s.targetLeftX - 4;
          s.velLeftX *= 0.2;
        }
      }

      const spanLeft = Math.min(s.leftX, s.rightX);
      const spanRight = Math.max(s.leftX, s.rightX);
      const currentWidth = Math.max(24, spanRight - spanLeft);
      const avgSpeed = (Math.abs(s.velLeftX) + Math.abs(s.velRightX)) * 0.5;
      const distToTarget = Math.abs(targetCenter - currentCenter);

      // 2. Activación automática del cristal líquido transparente en vuelo
      const flightIntensity = Math.min(
        1,
        avgSpeed / 2.8 + distToTarget / 40
      );

      const targetGlassAlpha = s.elevated ? 1 : flightIntensity > 0.08 ? Math.min(1, flightIntensity * 1.15) : 0;
      s.glassAlpha += (targetGlassAlpha - s.glassAlpha) * 0.25;

      // 3. Desborde dinámico vertical y horizontal
      const targetExtraW = s.elevated ? 12 : s.glassAlpha * 10;
      const targetExtraH = s.elevated ? 14 : s.glassAlpha * 10;

      s.extraW += (targetExtraW - s.extraW) * 0.24;
      s.extraH += (targetExtraH - s.extraH) * 0.24;

      const targetRefraction = s.elevated ? 38 : s.glassAlpha * 34;
      s.refraction += (targetRefraction - s.refraction) * 0.25;

      // Guardar en memoria persistente
      persistedHeaderPhysics.leftX = s.leftX;
      persistedHeaderPhysics.rightX = s.rightX;
      persistedHeaderPhysics.velLeftX = s.velLeftX;
      persistedHeaderPhysics.velRightX = s.velRightX;
      persistedHeaderPhysics.extraW = s.extraW;
      persistedHeaderPhysics.extraH = s.extraH;
      persistedHeaderPhysics.refraction = s.refraction;
      persistedHeaderPhysics.glassAlpha = s.glassAlpha;

      const pillW = Math.max(34, currentWidth + s.extraW);
      const pillH = trackDims.height > 0 ? trackDims.height - 6 + s.extraH : 36 + s.extraH;
      const pillLeft = spanLeft - s.extraW / 2;
      const pillTop = 3 - s.extraH / 2;

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

      // Máscara bajo la píldora en la capa base para que los textos nunca se corten
      if (grayWindowRef.current) {
        const holeLeft = Math.max(0, spanLeft - s.extraW / 2 + 2);
        const holeRight = Math.min(trackDims.width || 500, spanRight + s.extraW / 2 - 2);
        const mask = `linear-gradient(to right, #000 0px, #000 ${holeLeft}px, transparent ${holeLeft + 2}px, transparent ${holeRight - 2}px, #000 ${holeRight}px, #000 100%)`;
        grayWindowRef.current.style.maskImage = mask;
        grayWindowRef.current.style.webkitMaskImage = mask;
      }

      // Posicionar píldora flotante e interpolar apariencia de cristal en vivo
      if (pillRef.current && activeStripRef.current && rimOverlayRef.current) {
        pillRef.current.style.width = `${pillW}px`;
        pillRef.current.style.height = `${pillH}px`;
        pillRef.current.style.transform = `translate3d(${pillLeft}px, ${pillTop}px, 0)`;

        const a = s.glassAlpha;
        const topAlpha = (0.48 - a * 0.16).toFixed(3);
        const midAlpha = (0.22 - a * 0.12).toFixed(3);
        const botAlpha = (0.38 - a * 0.14).toFixed(3);
        pillRef.current.style.background = `linear-gradient(180deg, rgba(255,255,255,${topAlpha}) 0%, rgba(255,255,255,${midAlpha}) 50%, rgba(255,255,255,${botAlpha}) 100%)`;

        const filterVal =
          a > 0.05
            ? `blur(${(10 + a * 2).toFixed(1)}px) saturate(${(190 + a * 20).toFixed(0)}%) brightness(1.10)`
            : "blur(10px) saturate(190%) brightness(1.08)";
        pillRef.current.style.backdropFilter = filterVal;
        pillRef.current.style.setProperty("-webkit-backdrop-filter", filterVal);

        rimOverlayRef.current.style.boxShadow =
          a > 0.1
            ? `inset 0 ${(1.5 + a * 1.5).toFixed(1)}px ${(2 + a * 4).toFixed(1)}px rgba(255, 255, 255, 0.98),
               inset 0 -${(1 + a * 2).toFixed(1)}px ${(2 + a * 4).toFixed(1)}px rgba(255, 255, 255, 0.88),
               inset 0 0 ${(10 * a).toFixed(1)}px rgba(255, 255, 255, 0.35),
               0 ${(3 + a * 6).toFixed(1)}px ${(12 + a * 10).toFixed(1)}px rgba(0, 0, 0, ${(0.08 + a * 0.06).toFixed(2)})`
            : "inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(255, 255, 255, 0.5), 0 3px 12px rgba(0, 0, 0, 0.08)";

        const innerX = -spanLeft + s.extraW / 2;
        const innerY = -3 + s.extraH / 2;
        activeStripRef.current.style.transform = `translate3d(${innerX}px, ${innerY}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [trackDims.height, trackDims.width]);

  const clampPillX = (clientX: number, width: number) => {
    if (!trackRef.current) return 0;
    const trackRect = trackRef.current.getBoundingClientRect();
    const rawLeft = clientX - trackRect.left - width / 2;
    return Math.max(0, Math.min(trackRect.width - width, rawLeft));
  };

  const getClosestIndex = (localCenterX: number) => {
    if (!trackRef.current || tabsGeo.length === 0) return 0;
    let closestIdx = 0;
    let minDist = Infinity;
    tabsGeo.forEach((geo, idx) => {
      const tabCenter = geo.x + geo.width / 2;
      const dist = Math.abs(localCenterX - tabCenter);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    return closestIdx;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const s = state.current;
    s.startX = e.clientX;
    s.pointerX = e.clientX;
    s.mode = "scrubbing";
    s.elevated = true;

    const currentW = Math.max(40, tabsGeo[activeIndex]?.width || 75);
    const targetLeft = clampPillX(e.clientX, currentW);
    s.targetLeftX = targetLeft;
    s.targetRightX = targetLeft + currentW;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (s.mode === "scrubbing") {
      s.pointerX = e.clientX;
      const currentW = Math.max(40, tabsGeo[activeIndex]?.width || 75);
      const targetLeft = clampPillX(e.clientX, currentW);
      // Desplazamiento continuo 1:1 sin enganches magnéticos por pasos
      s.targetLeftX = targetLeft;
      s.targetRightX = targetLeft + currentW;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const s = state.current;
    s.elevated = false;
    s.mode = "idle";

    // Al soltar, encajamos al ícono más cercano según el centro del cristal
    if (!trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const localCenterX = e.clientX - trackRect.left;
    const targetIdx = getClosestIndex(localCenterX);

    if (tabsGeo[targetIdx]) {
      const geo = tabsGeo[targetIdx];
      s.targetLeftX = geo.x;
      s.targetRightX = geo.x + geo.width;
    }

    if (items[targetIdx]) {
      onSelect(items[targetIdx].id, items[targetIdx]);
      items[targetIdx].onClick?.();
    }
  };

  return (
    <>
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter
            ref={fgFilterRef}
            id="srdavo-header-pill-fg"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="120"
            height="40"
            colorInterpolationFilters="sRGB"
          >
            {bezelMapUrl && (
              <feImage
                ref={fgImageRef}
                href={bezelMapUrl}
                x="0"
                y="0"
                width="120"
                height="40"
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
        </defs>
      </svg>

      {/* CUERPO DEL TRACK CON LIQUID GLASS REAL */}
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
        className={`relative flex items-center h-[38px] sm:h-[40px] px-1 rounded-full select-none cursor-pointer overflow-visible ${className}`}
      >
        {/* Capa de fondo Liquid Glass para el cuerpo de la barra */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0"
          style={{
            clipPath: "inset(0 round 9999px)",
            WebkitClipPath: "inset(0 round 9999px)",
            backdropFilter: hasSvgFilterSupport && barFilterUrl
              ? `blur(0.8px) url('${barFilterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
              : "blur(16px) saturate(190%) brightness(1.10)",
            WebkitBackdropFilter: hasSvgFilterSupport && barFilterUrl
              ? `blur(0.8px) url('${barFilterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
              : "blur(16px) saturate(190%) brightness(1.10)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(240,240,248,0.14) 100%)",
            boxShadow: `
              inset 1px 1px 1px 0px rgba(255, 255, 255, 0.75),
              inset -1px -1px 1px 0px rgba(255, 255, 255, 0.25),
              0 4px 16px rgba(0, 0, 0, 0.05)
            `,
            border: "1px solid rgba(255, 255, 255, 0.60)",
          }}
        >
          {/* Reflejo especular superior continuo */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-55 bg-gradient-to-b from-white/35 via-white/10 to-transparent rounded-full" />
        </div>

        {/* CAPA 1: Pestañas en tono neutro tenue (con máscara dinámica que desaparece bajo la píldora) */}
        <div
          ref={grayWindowRef}
          className="relative w-full h-full overflow-hidden rounded-full pointer-events-none z-10 flex items-center"
        >
          <div className="flex items-center h-full">
            {items.map((tab, idx) => (
              <div
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-black/45 dark:text-white/45 whitespace-nowrap"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CAPA 2: Píldora Liquid Glass con resorte asimétrico y refracción óptica */}
        <div
          ref={pillRef}
          style={{
            top: 0,
            left: 0,
            willChange: "transform, width, height, background",
          }}
          className="absolute z-20 rounded-full overflow-hidden pointer-events-none"
        >
          {/* Reflejo especular superior continuo en la píldora */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-55 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full z-0" />

          <div
            style={{
              filter: "url(#srdavo-header-pill-fg)",
              WebkitFilter: "url(#srdavo-header-pill-fg)",
            }}
            className="w-full h-full relative"
          >
            {/* Tira activa interna que viaja de forma inversa para mantenerse fija */}
            <div
              ref={activeStripRef}
              style={{
                width: `${trackDims.width || 400}px`,
                height: `${trackDims.height || 40}px`,
                top: 0,
                left: 0,
              }}
              className="absolute flex items-center will-change-transform"
            >
              {items.map((tab, idx) => (
                <div
                  key={`active-${tab.id}`}
                  style={{
                    width: tabsGeo[idx] ? `${tabsGeo[idx].width}px` : "auto",
                    left: tabsGeo[idx] ? `${tabsGeo[idx].x}px` : "auto",
                  }}
                  className={`absolute flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold whitespace-nowrap ${activeColor}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bisel especular de cristal líquido con box-shadow dinámico */}
          <div
            ref={rimOverlayRef}
            className="absolute inset-0 rounded-full pointer-events-none z-10"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.90)",
              boxShadow:
                "inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(255, 255, 255, 0.5), 0 3px 12px rgba(0, 0, 0, 0.08)",
            }}
          />
        </div>
      </div>
    </>
  );
}

export default LiquidScrubberNav;
