"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";

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
  isCollapsed?: boolean;
  visibleCount?: number;
  className?: string;
}

// Estado físico persistente a nivel de módulo:
// Garantiza que aunque la página de Lumina re-monte el menú al cambiar de pestaña,
// la píldora nunca se teletransporte y siempre viaje desde su coordenada anterior.
const persistedPhysics = {
  initialized: false,
  leftX: 0,
  rightX: 0,
  velLeftX: 0,
  velRightX: 0,
  scrollX: 0,
  targetScrollX: 0,
  velScrollX: 0,
  extraW: 0,
  extraH: 0,
  refraction: 0,
  glassAlpha: 0,
};

let cachedBezelMapUrl = "";

/**
 * Mapa óptico de cápsula (srdavo/liquid-glass):
 * - Centro plano (rgb(128,128,128)) para que el ícono, badge y texto se vean limpios.
 * - Bisel lateral grueso con inversión en el labio exterior para curvar los íconos al pasar.
 */
function getCapsuleInverseBezelMap(): string {
  if (typeof document === "undefined") return "";
  if (cachedBezelMapUrl) return cachedBezelMapUrl;

  const W = 256;
  const H = 128;
  const R = H / 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(W, H);
  const data = img.data;

  const bezelStart = 0.56;
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

      if (r > bezelStart && r <= 1.02 && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const t = Math.min(1, (r - bezelStart) / bezelSpan);

        let profile = 0;
        if (t < 0.58) {
          const u = t / 0.58;
          profile = -Math.sin(u * Math.PI) * 0.76;
        } else {
          const v = (t - 0.58) / 0.42;
          profile = Math.pow(Math.sin(v * Math.PI * 0.5), 1.35) * 1.0;
        }

        // Desvanecimiento suave en el borde exterior (r >= 0.88) para que la refracción vuelva
        // exactamente a 128 (desplazamiento 0) en el perímetro, eliminando cualquier línea horizontal
        const edgeFade = r >= 0.88 ? Math.max(0, 1 - (r - 0.88) / 0.12) : 1;
        profile = profile * edgeFade;

        const lateralWeight = 0.35 + 0.65 * Math.abs(nx);
        rChan = Math.max(
          0,
          Math.min(255, Math.round(128 + nx * profile * 127))
        );
        gChan = Math.max(
          0,
          Math.min(255, Math.round(128 + ny * profile * lateralWeight * 68))
        );
      }

      const idx = (y * W + x) * 4;
      data[idx] = rChan;
      data[idx + 1] = gChan;
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  cachedBezelMapUrl = canvas.toDataURL("image/png");
  return cachedBezelMapUrl;
}

export function SrdavoLiquidMenu({
  items,
  activeId,
  onSelect,
  onSearchClick,
  isSearchActive = false,
  isCollapsed = false,
  visibleCount = 3,
  className = "",
}: SrdavoLiquidMenuProps) {
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === activeId));
  const [bezelMapUrl, setBezelMapUrl] = useState<string>("");
  const [isSearchPressed, setIsSearchPressed] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const grayWindowRef = useRef<HTMLDivElement>(null);
  const grayStripRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const blackStripRef = useRef<HTMLDivElement>(null);
  const rimOverlayRef = useRef<HTMLDivElement>(null);
  const pillBackingRef = useRef<HTMLDivElement>(null);

  // Badge indicador flotante de porcentaje (números pequeños en tipografía monospace)
  const percentBadgeRef = useRef<HTMLDivElement>(null);
  const percentValueRef = useRef<HTMLSpanElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showPercentBadge = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (percentBadgeRef.current) {
      percentBadgeRef.current.style.opacity = "1";
    }
  }, []);

  const scheduleHidePercentBadge = useCallback((delayMs = 1800) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      if (percentBadgeRef.current) {
        percentBadgeRef.current.style.opacity = "0";
      }
    }, delayMs);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isCollapsed && percentBadgeRef.current) {
      percentBadgeRef.current.style.opacity = "0";
    }
  }, [isCollapsed]);

  const fgFilterRef = useRef<SVGFilterElement>(null);
  const bgFilterRef = useRef<SVGFilterElement>(null);
  const fgImageRef = useRef<SVGFEImageElement>(null);
  const bgImageRef = useRef<SVGFEImageElement>(null);
  const fgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const bgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeEnteredTime = useRef<number>(0);
  const currentEdge = useRef<"left" | "right" | null>(null);
  const lastFrameTime = useRef<number>(0);

  const state = useRef({
    slotWidth: 100,
    trackWidth: 300,
    leftX: persistedPhysics.leftX,
    rightX: persistedPhysics.rightX,
    velLeftX: persistedPhysics.velLeftX,
    velRightX: persistedPhysics.velRightX,
    targetPillX: 0,
    scrollX: persistedPhysics.scrollX,
    targetScrollX: persistedPhysics.targetScrollX,
    velScrollX: persistedPhysics.velScrollX,
    extraW: persistedPhysics.extraW,
    extraH: persistedPhysics.extraH,
    refraction: persistedPhysics.refraction,
    glassAlpha: persistedPhysics.glassAlpha,
    mode: "idle" as "idle" | "pending" | "scrubbing" | "scrolling",
    elevated: false,
    startX: 0,
    startScrollX: 0,
    pointerX: 0,
  });


  // Generar mapa óptico de cápsula para refracción de bordes en el filtro de la píldora
  useEffect(() => {
    setBezelMapUrl(getCapsuleInverseBezelMap());
  }, []);

  // Medir geometría y calcular destino sin destruir la posición actual del resorte
  const updateTargets = useCallback(
    (snapImmediately = false) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const innerW = grayWindowRef.current?.clientWidth || Math.max(120, rect.width - 8);
      const slotW = innerW / visibleCount;

      const s = state.current;
      s.trackWidth = innerW;
      s.slotWidth = slotW;

      // Si no estamos en scroll manual libre, calcular la página y posición de destino
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

        if (snapImmediately && !persistedPhysics.initialized) {
          s.scrollX = nextScrollX;
          s.leftX = nextPillX;
          s.rightX = nextPillX;
          persistedPhysics.initialized = true;
        }
      }
    },
    [activeIndex, items.length, visibleCount]
  );

  // Cuando cambia activeIndex (por un toque o navegación), SOLO actualizamos el objetivo (snapImmediately = false)
  // para que los resortes viajen suavemente desde la coordenada anterior hasta la nueva
  useEffect(() => {
    updateTargets(false);
    showPercentBadge();
    scheduleHidePercentBadge(1800);
  }, [activeIndex, updateTargets, showPercentBadge, scheduleHidePercentBadge]);

  // Snap inicial único al montar la app o al redimensionar la ventana
  useEffect(() => {
    updateTargets(true);
    const onResize = () => {
      persistedPhysics.initialized = false;
      updateTargets(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateTargets]);

  useEffect(() => {
    let rafId: number;
    lastFrameTime.current = 0;

    const animate = (now: number) => {
      const s = state.current;
      const scrubbing = s.mode === "scrubbing";

      if (!lastFrameTime.current) lastFrameTime.current = now;
      const dt = Math.min(0.04, Math.max(0.001, (now - lastFrameTime.current) / 1000));
      lastFrameTime.current = now;

      // Auto-scroll controlado en los bordes al mantener arrastrada la gota:
      // 1. Debe mantenerse en el borde continuamente durante 0.76s (760ms) antes de iniciar el desplazamiento.
      // 2. Transcurridos los 0.76s, se desplaza a velocidad constante, más ágil (~240 px/s).
      if (scrubbing) {
        const edgeMargin = Math.min(12, s.slotWidth * 0.12);
        const maxScroll = Math.max(0, (items.length - visibleCount) * s.slotWidth);
        let activeEdge: "left" | "right" | null = null;

        if (s.targetPillX >= s.trackWidth - s.slotWidth - edgeMargin && s.targetScrollX < maxScroll - 0.5) {
          activeEdge = "right";
        } else if (s.targetPillX <= edgeMargin && s.targetScrollX > 0.5) {
          activeEdge = "left";
        }

        if (activeEdge !== null) {
          if (currentEdge.current !== activeEdge) {
            currentEdge.current = activeEdge;
            edgeEnteredTime.current = now;
          } else {
            const dwellTime = now - edgeEnteredTime.current;
            if (dwellTime >= 500) {
              const scrollSpeed = 300; // px/segundo constante, más ágil y fluido
              const delta = scrollSpeed * dt;

              if (activeEdge === "right") {
                s.targetScrollX = Math.min(maxScroll, s.targetScrollX + delta);
              } else {
                s.targetScrollX = Math.max(0, s.targetScrollX - delta);
              }
              s.scrollX = s.targetScrollX;
              s.velScrollX = 0;
              showPercentBadge();
            }
          }
        } else {
          currentEdge.current = null;
          edgeEnteredTime.current = 0;
        }
      } else {
        currentEdge.current = null;
        edgeEnteredTime.current = 0;
      }

      // 1. Física de Doble Resorte Asimétrico (Oruga Líquida):
      // El borde delantero sale rápido hacia el nuevo ícono y el trasero lo sigue con elasticidad,
      // estirando la cápsula entre ambos botones durante el trayecto y contrayéndola al aterrizar.
      const centerPos = (s.leftX + s.rightX) * 0.5;
      const movingRight = s.targetPillX >= centerPos;

      const fastStiff = scrubbing ? 0.30 : 0.28;
      const fastDamp = scrubbing ? 0.68 : 0.72;
      const slowStiff = scrubbing ? 0.22 : 0.11;
      const slowDamp = scrubbing ? 0.70 : 0.75;

      const leftStiff = movingRight ? slowStiff : fastStiff;
      const leftDamp = movingRight ? slowDamp : fastDamp;
      const rightStiff = movingRight ? fastStiff : slowStiff;
      const rightDamp = movingRight ? fastDamp : slowDamp;

      s.velLeftX = (s.velLeftX + (s.targetPillX - s.leftX) * leftStiff) * leftDamp;
      s.leftX += s.velLeftX;

      s.velRightX = (s.velRightX + (s.targetPillX - s.rightX) * rightStiff) * rightDamp;
      s.rightX += s.velRightX;

      // 2. Física del carrusel de ~10 ítems (1:1 inmediato al deslizar con el dedo)
      const cStiff = s.mode === "scrolling" ? 0.44 : 0.16;
      const cDamp = s.mode === "scrolling" ? 0.62 : 0.78;
      s.velScrollX = (s.velScrollX + (s.targetScrollX - s.scrollX) * cStiff) * cDamp;
      s.scrollX += s.velScrollX;

      const spanLeft = Math.min(s.leftX, s.rightX);
      const spanRight = Math.max(s.leftX, s.rightX) + s.slotWidth;
      const stretchSpan = Math.max(0, spanRight - spanLeft - s.slotWidth);
      const avgSpeed = (Math.abs(s.velLeftX) + Math.abs(s.velRightX)) * 0.5;
      const distToTarget = Math.abs(s.targetPillX - centerPos);

      // 3. Activación automática del cristal líquido durante el vuelo de un toque simple (flightIntensity)
      const flightIntensity = Math.min(
        1,
        stretchSpan / Math.max(1, s.slotWidth * 0.32) +
          avgSpeed / 3.2 +
          distToTarget / Math.max(1, s.slotWidth * 0.65)
      );

      const targetGlassAlpha = s.elevated ? 1 : flightIntensity > 0.08 ? Math.min(1, flightIntensity * 1.15) : 0;
      s.glassAlpha += (targetGlassAlpha - s.glassAlpha) * 0.25;

      // 4. Desborde vertical y horizontal tanto al mantener pulsado como al viajar con un toque
      const targetExtraW = s.elevated ? 22 : s.glassAlpha * 16;
      const targetExtraH = s.elevated ? 28 : s.glassAlpha * 22;

      s.extraW += (targetExtraW - s.extraW) * 0.24;
      s.extraH += (targetExtraH - s.extraH) * 0.24;

      // 5. Potencia de refracción en los bordes proporcional a glassAlpha
      const targetRefraction = s.elevated ? 42 : s.glassAlpha * 38;
      s.refraction += (targetRefraction - s.refraction) * 0.25;

      // Guardar en memoria persistente para sobrevivir re-montados de componente
      persistedPhysics.leftX = s.leftX;
      persistedPhysics.rightX = s.rightX;
      persistedPhysics.velLeftX = s.velLeftX;
      persistedPhysics.velRightX = s.velRightX;
      persistedPhysics.scrollX = s.scrollX;
      persistedPhysics.targetScrollX = s.targetScrollX;
      persistedPhysics.velScrollX = s.velScrollX;
      persistedPhysics.extraW = s.extraW;
      persistedPhysics.extraH = s.extraH;
      persistedPhysics.refraction = s.refraction;
      persistedPhysics.glassAlpha = s.glassAlpha;

      const totalStripW = items.length * s.slotWidth;
      const pillW = Math.max(40, spanRight - spanLeft + s.extraW);
      const pillH = 50 + s.extraH;
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

      // 6. Actualizar porcentaje de posición horizontal en vivo (0% a 100%)
      if (percentValueRef.current) {
        const totalItems = items.length;
        if (totalItems > 1) {
          const totalTrackSpan = Math.max(1, (totalItems - 1) * s.slotWidth);
          const currentAbsPos = s.scrollX + Math.min(s.leftX, s.rightX);
          const rawProgress = currentAbsPos / totalTrackSpan;
          const pct = Math.min(100, Math.max(0, Math.round(rawProgress * 100)));
          percentValueRef.current.textContent = `${pct}%`;
        }
      }

      // Mover tira gris de fondo y actualizar máscara bajo la píldora
      if (grayStripRef.current && grayWindowRef.current) {
        grayStripRef.current.style.width = `${totalStripW}px`;
        grayStripRef.current.style.transform = `translate3d(${-s.scrollX}px, 0, 0)`;

        const holeLeft = Math.max(0, spanLeft - s.extraW / 2 + 3);
        const holeRight = Math.min(s.trackWidth, spanRight + s.extraW / 2 - 3);
        const mask = `linear-gradient(to right, #000 0px, #000 ${holeLeft}px, transparent ${holeLeft + 2}px, transparent ${holeRight - 2}px, #000 ${holeRight}px, #000 100%)`;
        grayWindowRef.current.style.maskImage = mask;
        grayWindowRef.current.style.webkitMaskImage = mask;
      }

      // Posicionar píldora, interpolar su transparencia de cristal en vivo y alinear la tira negra interna
      if (pillRef.current && blackStripRef.current && rimOverlayRef.current) {
        pillRef.current.style.width = `${pillW}px`;
        pillRef.current.style.height = `${pillH}px`;
        pillRef.current.style.transform = `translate3d(${pillLeft}px, ${pillTop}px, 0)`;

        // Interpolación continua entre Reposo Mate (glassAlpha = 0) y Cristal Líquido (glassAlpha = 1)
        const a = s.glassAlpha;

        if (pillBackingRef.current) {
          pillBackingRef.current.style.opacity = s.elevated ? "0.98" : "0";
        }

        const topAlpha = (0.42 - a * 0.16).toFixed(3);
        const midAlpha = (0.12 - a * 0.08).toFixed(3);
        const botAlpha = (0.30 - a * 0.14).toFixed(3);
        pillRef.current.style.background = `linear-gradient(180deg, rgba(255,255,255,${topAlpha}) 0%, rgba(255,255,255,${midAlpha}) 50%, rgba(255,255,255,${botAlpha}) 100%)`;
        const filterVal =
          a > 0.05
            ? `blur(${(12 + a * 2).toFixed(1)}px) saturate(${(200 + a * 20).toFixed(0)}%) brightness(1.08)`
            : "blur(12px) saturate(200%) brightness(1.06)";
        pillRef.current.style.backdropFilter = filterVal;
        pillRef.current.style.setProperty("-webkit-backdrop-filter", filterVal);

        rimOverlayRef.current.style.boxShadow =
          a > 0.1
            ? `inset 0 ${(1.5 + a * 2).toFixed(1)}px ${(2 + a * 5).toFixed(1)}px rgba(255, 255, 255, 0.98),
               inset 0 -${(1 + a * 2.5).toFixed(1)}px ${(2 + a * 5).toFixed(1)}px rgba(255, 255, 255, 0.88),
               inset 0 0 ${(12 * a).toFixed(1)}px rgba(255, 255, 255, 0.35),
               0 ${(4 + a * 8).toFixed(1)}px ${(14 + a * 14).toFixed(1)}px rgba(0, 0, 0, ${(0.08 + a * 0.08).toFixed(2)})`
            : "inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(255, 255, 255, 0.5), 0 4px 14px rgba(0, 0, 0, 0.08)";

        const innerX = -spanLeft - s.scrollX + s.extraW / 2;
        const innerY = -4 + s.extraH / 2;
        blackStripRef.current.style.width = `${totalStripW}px`;
        blackStripRef.current.style.transform = `translate3d(${innerX}px, ${innerY}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [items.length, visibleCount, showPercentBadge]);

  const clampPillX = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const { slotWidth, trackWidth } = state.current;
    const raw = clientX - rect.left - 4 - slotWidth / 2;
    return Math.max(0, Math.min(trackWidth - slotWidth, raw));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    if (holdTimer.current) clearTimeout(holdTimer.current);
    edgeEnteredTime.current = 0;
    currentEdge.current = null;

    const s = state.current;
    s.startX = e.clientX;
    s.pointerX = e.clientX;
    s.startScrollX = s.scrollX;
    showPercentBadge();

    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left - 4;
    const spanLeft = Math.min(s.leftX, s.rightX);
    const spanRight = Math.max(s.leftX, s.rightX) + s.slotWidth;
    const hitActivePill = localX >= spanLeft - 4 && localX <= spanRight + 4;

    if (hitActivePill) {
      s.mode = "scrubbing";
      s.elevated = true;
      s.targetPillX = clampPillX(e.clientX);
    } else {
      s.mode = "pending";
      // Si mantiene presionado más de 170ms sobre otro ícono, invoca la burbuja hacia el dedo.
      // Si suelta antes (toque directo), handlePointerUp dispara el vuelo elástico inmediato.
      holdTimer.current = setTimeout(() => {
        if (state.current.mode === "pending") {
          state.current.mode = "scrubbing";
          state.current.elevated = true;
          state.current.targetPillX = clampPillX(state.current.pointerX);
          showPercentBadge();
        }
      }, 170);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    s.pointerX = e.clientX;
    const dx = e.clientX - s.startX;

    if (s.mode === "pending" && Math.abs(dx) > 8) {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      s.mode = "scrolling";
      s.elevated = false;
      edgeEnteredTime.current = 0;
      currentEdge.current = null;
      showPercentBadge();
    }

    if (s.mode === "scrubbing") {
      s.targetPillX = clampPillX(e.clientX);
      showPercentBadge();
    } else if (s.mode === "scrolling") {
      const maxScroll = Math.max(0, (items.length - visibleCount) * s.slotWidth);
      s.targetScrollX = Math.max(0, Math.min(maxScroll, s.startScrollX - dx));
      showPercentBadge();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    scheduleHidePercentBadge(1800);
    edgeEnteredTime.current = 0;
    currentEdge.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const s = state.current;
    const maxScroll = Math.max(0, (items.length - visibleCount) * s.slotWidth);

    if (s.mode === "scrolling") {
      const inertia = (s.startX - e.clientX) * 0.35;
      const snappedScroll =
        Math.round((s.targetScrollX + inertia) / s.slotWidth) * s.slotWidth;
      s.targetScrollX = Math.max(0, Math.min(maxScroll, snappedScroll));
      s.elevated = false;
    } else if (s.mode === "pending" || s.mode === "scrubbing") {
      s.elevated = false;

      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const targetLocalX =
        s.mode === "pending"
          ? e.clientX - rect.left - 4
          : s.targetPillX + s.slotWidth / 2;

      const absTargetX = s.targetScrollX + targetLocalX;
      const nextIdx = Math.max(
        0,
        Math.min(items.length - 1, Math.floor(absTargetX / s.slotWidth))
      );

      // Snap de la cuadrícula al terminar el arrastre
      let nextScrollX = Math.round(s.targetScrollX / s.slotWidth) * s.slotWidth;
      const activeAbsX = nextIdx * s.slotWidth;
      if (activeAbsX < nextScrollX) {
        nextScrollX = activeAbsX;
      } else if (activeAbsX >= nextScrollX + visibleCount * s.slotWidth) {
        nextScrollX = activeAbsX - (visibleCount - 1) * s.slotWidth;
      }
      nextScrollX = Math.max(0, Math.min(maxScroll, nextScrollX));

      s.targetScrollX = nextScrollX;
      s.targetPillX = activeAbsX - nextScrollX;

      // Damos un impulso inicial al borde delantero en toques directos para que el estiramiento sea inmediato
      if (s.mode === "pending" && nextIdx !== activeIndex) {
        const dir = s.targetPillX > s.leftX ? 1 : -1;
        if (dir > 0) {
          s.velRightX += 6;
        } else {
          s.velLeftX -= 6;
        }
      }

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
            width="120"
            height="78"
            colorInterpolationFilters="sRGB"
          >
            {bezelMapUrl && (
              <feImage
                ref={fgImageRef}
                href={bezelMapUrl}
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
            {bezelMapUrl && (
              <feImage
                ref={bgImageRef}
                href={bezelMapUrl}
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
        </defs>
      </svg>

      {/* Contenedor General: Cuerpo del Menú + Botón de Lupa de Búsqueda */}
      <div
        className={`flex items-center justify-end gap-2.5 w-full max-w-full min-w-0 overflow-visible px-1 box-border mx-auto ${className}`}
      >
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
            transformOrigin: "right center",
            transition: isCollapsed
              ? "transform 540ms cubic-bezier(0.4, 0, 0.15, 1), opacity 220ms 280ms ease-out"
              : "transform 580ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out",
          }}
          className={`relative flex-1 min-w-0 flex items-center h-[58px] px-1 rounded-full select-none cursor-pointer ${
            isCollapsed
              ? "scale-x-0 scale-y-[0.35] translate-x-[42px] opacity-0 pointer-events-none"
              : "scale-100 translate-x-0 opacity-100 pointer-events-auto"
          }`}
        >
          {/* INDICADOR FLOTANTE DE PORCENTAJE (AL LADO IZQUIERDO, ARRIBA DEL PRIMER ÍCONO) */}
          <div
            ref={percentBadgeRef}
            style={{
              left: `calc(100% / (${visibleCount} * 2))`,
              opacity: 0,
              willChange: "opacity",
            }}
            className="absolute -top-7 -translate-x-1/2 z-50 pointer-events-none select-none transition-opacity duration-350 ease-out"
          >
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-950/85 dark:bg-white/90 text-white dark:text-zinc-950 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-white/20 dark:border-black/10">
              <span
                ref={percentValueRef}
                className="font-mono tabular-nums text-[10.5px] font-bold tracking-tight"
              >
                0%
              </span>
            </div>
          </div>
          {/* CAPA DE CRISTAL LÍQUIDO DEL CUERPO (estrictamente recortada a la cápsula perfecta sin esquinas cuadradas) */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0"
            style={{
              clipPath: "inset(0 round 9999px)",
              WebkitClipPath: "inset(0 round 9999px)",
              backdropFilter: "blur(14px) saturate(220%) contrast(1.06) brightness(1.04)",
              WebkitBackdropFilter: "blur(14px) saturate(220%) contrast(1.06) brightness(1.04)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.20) 100%)",
              boxShadow: `
                inset 0 1.5px 2px 0px rgba(255, 255, 255, 0.95),
                inset 0 -1.5px 2px 0px rgba(255, 255, 255, 0.45),
                inset 1.5px 0 3px 0px rgba(255, 255, 255, 0.60),
                inset -1.5px 0 3px 0px rgba(255, 255, 255, 0.60),
                inset 0 0 16px 0px rgba(255, 255, 255, 0.16),
                0 12px 36px 0px rgba(0, 0, 0, 0.12),
                0 4px 12px 0px rgba(0, 0, 0, 0.06)
              `,
              border: "1px solid rgba(255, 255, 255, 0.72)",
            }}
          >
            {/* Reflejo especular superior característico de srdavo/liquid-glass */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[48%] opacity-70 bg-gradient-to-b from-white/50 via-white/12 to-transparent rounded-full" />
          </div>

          {/* CAPA 1: Ítems en Gris */}
          <div
            ref={grayWindowRef}
            className="relative w-full h-full overflow-hidden rounded-full pointer-events-none z-10"
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

          {/* CAPA 2: Píldora Liquid Glass con vuelo asimétrico y cristal dinámico */}
          <div
            ref={pillRef}
            style={{
              top: 0,
              left: 0,
              willChange: "transform, width, height, background",
            }}
            className="absolute z-40 rounded-full overflow-hidden pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          >
            {/* Base sólida que tapa al 100% las líneas de 0.9px del marco exterior al mantener presionado */}
            <div
              ref={pillBackingRef}
              className="pointer-events-none absolute inset-0 rounded-full bg-white/95 dark:bg-[#1a1a20]/95 z-0"
              style={{
                opacity: 0,
                willChange: "opacity",
              }}
            />

            {/* Reflejo especular superior continuo en la píldora */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-55 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full z-10" />

            <div
              style={{
                filter: "url(#srdavo-pill-fg)",
              }}
              className="relative w-full h-full overflow-hidden rounded-full z-20"
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
              ref={rimOverlayRef}
              style={{
                border: "1.2px solid rgba(255, 255, 255, 0.9)",
              }}
              className="absolute inset-0 rounded-full pointer-events-none transition-[box-shadow,border] duration-150 z-30"
            />
          </div>

          {/* Marco exterior 0.9px perfectamente redondeado sin distorsión ni artefactos horizontales */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full border-[0.9px] border-[#18181b] dark:border-white/30 z-30"
            style={{ borderRadius: 9999 }}
            aria-hidden="true"
          />
        </div>

        {/* BOTÓN DE LUPA DE BÚSQUEDA CON LIQUID GLASS REAL */}
        {onSearchClick && (
          <button
            type="button"
            onClick={onSearchClick}
            onPointerDown={() => setIsSearchPressed(true)}
            onPointerUp={() => setIsSearchPressed(false)}
            onPointerLeave={() => setIsSearchPressed(false)}
            style={{
              clipPath: "inset(0 round 9999px)",
              WebkitClipPath: "inset(0 round 9999px)",
              backdropFilter: isSearchActive
                ? "blur(12px)"
                : "blur(14px) saturate(220%) contrast(1.06) brightness(1.04)",
              WebkitBackdropFilter: isSearchActive
                ? "blur(12px)"
                : "blur(14px) saturate(220%) contrast(1.06) brightness(1.04)",
              background: isSearchActive
                ? "rgba(224, 122, 63, 0.95)"
                : isSearchPressed
                ? "linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(240,240,248,0.24) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(240,240,248,0.14) 100%)",
              boxShadow: isSearchActive
                ? "0 0 24px rgba(224,122,63,0.6), inset 0 2px 4px rgba(255,255,255,0.8)"
                : isSearchPressed
                ? `
                  inset 0 3px 6px rgba(255, 255, 255, 0.98),
                  inset 0 -3px 6px rgba(255, 255, 255, 0.9),
                  0 10px 24px rgba(0, 0, 0, 0.16)
                `
                : `
                  inset 0 1.5px 2px 0px rgba(255, 255, 255, 0.95),
                  inset 0 -1.5px 2px 0px rgba(255, 255, 255, 0.45),
                  inset 0 0 14px 0px rgba(255, 255, 255, 0.18),
                  0 10px 26px rgba(0, 0, 0, 0.10)
                `,
              border: isSearchActive
                ? "2px solid rgba(255, 255, 255, 0.9)"
                : "1px solid rgba(255, 255, 255, 0.76)",
              transform: isSearchPressed
                ? "scale(1.08)"
                : isCollapsed
                ? "scale(1.07)"
                : "scale(1)",
              transition:
                "transform 540ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 400ms ease, background 300ms ease",
            }}
            className={`relative pointer-events-auto flex items-center justify-center w-[58px] h-[58px] rounded-full overflow-hidden select-none shrink-0 cursor-pointer ${
              isSearchActive ? "text-white" : "text-zinc-900 dark:text-white"
            } ${isCollapsed ? "shadow-[0_12px_36px_rgba(0,0,0,0.22)] ring-1 ring-black/10 dark:ring-white/20" : ""}`}
            aria-label="Buscar"
          >
            {/* Reflejo especular superior característico de srdavo/liquid-glass */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[48%] opacity-70 bg-gradient-to-b from-white/50 via-white/12 to-transparent rounded-full" />
            <svg
              className="w-5 h-5 stroke-[2.2] relative z-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            {/* Marco exterior 0.9px perfectamente redondeado sin distorsión */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full border-[0.9px] border-[#18181b] dark:border-white/30 z-20"
              style={{ borderRadius: 9999 }}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </>
  );
}

export default SrdavoLiquidMenu;
