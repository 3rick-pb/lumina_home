"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useThemeStore, ThemeMode, getResolvedTheme } from "@/lib/themeStore";
import { useUserStore } from "@/lib/userStore";
import { getDisplacementFilter, getCapsuleInverseBezelMap } from "./LiquidGlass";

/* ============================================================================
 * Official @beui/theme-toggle (variant="circle-blur") View Transition Styles
 * ============================================================================ */
const BEUI_CIRCLE_BLUR_STYLE_ID = "beui-theme-toggle-circle-blur-vt";
const BEUI_CIRCLE_BLUR_CSS = `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

html[data-beui-vt] *,
html[data-beui-vt] *::before,
html[data-beui-vt] *::after {
  transition-duration: 0ms !important;
  transition-delay: 0ms !important;
}

html[data-beui-vt="circle-blur"]::view-transition-new(root) {
  animation: beui-circle-blur-reveal 680ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes beui-circle-blur-reveal {
  from {
    clip-path: circle(0% at var(--beui-vt-origin, 50% 50%));
    filter: blur(8px);
  }
  to {
    clip-path: circle(150% at var(--beui-vt-origin, 50% 50%));
    filter: blur(0px);
  }
}
`;

function ensureCircleBlurStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(BEUI_CIRCLE_BLUR_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = BEUI_CIRCLE_BLUR_STYLE_ID;
  style.textContent = BEUI_CIRCLE_BLUR_CSS;
  document.head.appendChild(style);
}

export function executeCircleBlurThemeTransition(
  nextMode: ThemeMode,
  setMode: (mode: ThemeMode, userId?: string) => void,
  userId?: string,
  event?: React.MouseEvent<HTMLElement>,
  anchorEl?: HTMLElement | null
) {
  ensureCircleBlurStyles();

  if (typeof document === "undefined") {
    setMode(nextMode, userId);
    return;
  }

  const html = document.documentElement;
  const targetEl = anchorEl || (event?.currentTarget as HTMLElement | null);
  let originX = window.innerWidth / 2;
  let originY = window.innerHeight / 2;

  if (event && event.clientX > 0 && event.clientY > 0) {
    originX = event.clientX;
    originY = event.clientY;
  } else if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
  }

  html.style.setProperty("--beui-vt-origin", `${originX}px ${originY}px`);

  const applyUpdate = () => {
    flushSync(() => {
      setMode(nextMode, userId);
    });
    // Never apply .dark to <html> so storefront routes (/shop, /, Header, Footer) never flash dark.
    // Dark Mode is strictly scoped via wrapper <div className="dark"> inside Mi Perfil and CartDrawer.
    html.classList.remove("dark");
    html.style.colorScheme = "light";
  };

  type DocumentWithVT = Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  const docWithVT = document as DocumentWithVT;

  if (typeof docWithVT.startViewTransition !== "function") {
    applyUpdate();
    return;
  }

  html.dataset.beuiVt = "circle-blur";
  try {
    const vt = docWithVT.startViewTransition(() => {
      applyUpdate();
    });
    vt.finished.finally(() => {
      delete html.dataset.beuiVt;
    });
  } catch {
    delete html.dataset.beuiVt;
    applyUpdate();
  }
}

/* ============================================================================
 * @beui/theme-toggle (variant="circle-blur") Standalone Icon Button
 * ============================================================================ */
export interface BeUIThemeToggleCircleBlurProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function BeUIThemeToggleCircleBlur({
  className = "",
  size = "md",
  showLabel = false,
}: BeUIThemeToggleCircleBlurProps) {
  const { mode, setMode } = useThemeStore();
  const user = useUserStore((state) => state.user);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    ensureCircleBlurStyles();
  }, []);

  const isDark = getResolvedTheme(mode) === "dark";

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextMode: ThemeMode = isDark ? "light" : "dark";
    executeCircleBlurThemeTransition(nextMode, setMode, user?.id, e, btnRef.current);
  };

  const sizeClasses =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : "h-10 w-10 text-sm";

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleToggle}
      title={isDark ? "Cambiar a modo Claro (Circle Blur)" : "Cambiar a modo Oscuro (Circle Blur)"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`group relative inline-flex items-center justify-center rounded-full border border-gray-200/80 dark:border-white/15 bg-white/90 dark:bg-[#161920]/90 text-gray-900 dark:text-white shadow-sm hover:border-gray-300 dark:hover:border-amber-400/50 hover:shadow-md active:scale-95 transition-all cursor-pointer select-none ${
        showLabel ? "px-3.5 py-2 gap-2.5 h-10" : sizeClasses
      } ${className}`}
    >
      {/* @beui/action-swap Icon Blur Swap (Sun <-> Moon) */}
      <span className="relative inline-grid place-items-center w-5 h-5">
        <span
          aria-hidden={isDark || undefined}
          style={{
            transform: isDark ? "scale(0.5) rotate(-60deg)" : "scale(1) rotate(0deg)",
            opacity: isDark ? 0 : 1,
            filter: isDark ? "blur(4px)" : "blur(0px)",
            transition:
              "transform 380ms cubic-bezier(0.22, 1.3, 0.36, 1), opacity 240ms ease, filter 240ms ease",
          }}
          className="col-start-1 row-start-1 flex items-center justify-center text-amber-500"
        >
          <Sun className="w-4 h-4 fill-amber-500/20" />
        </span>
        <span
          aria-hidden={!isDark || undefined}
          style={{
            transform: isDark ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(60deg)",
            opacity: isDark ? 1 : 0,
            filter: isDark ? "blur(0px)" : "blur(4px)",
            transition:
              "transform 380ms cubic-bezier(0.22, 1.3, 0.36, 1), opacity 240ms ease, filter 240ms ease",
          }}
          className="col-start-1 row-start-1 flex items-center justify-center text-amber-400"
        >
          <Moon className="w-4 h-4 fill-amber-400/20" />
        </span>
      </span>

      {showLabel && (
        <span className="text-xs font-bold tracking-tight">
          {isDark ? "Oscuro" : "Claro"}
        </span>
      )}
    </button>
  );
}

/* ============================================================================
 * Apple Liquid Glass ThemeToggle Control (Claro, Auto, Oscuro)
 * ============================================================================ */
const THEME_OPTIONS: { id: ThemeMode; icon: React.ElementType; label: string; activeColor: string }[] = [
  { id: "light", icon: Sun, label: "Claro", activeColor: "text-amber-500" },
  { id: "auto", icon: Sparkles, label: "Auto", activeColor: "text-amber-400" },
  { id: "dark", icon: Moon, label: "Oscuro", activeColor: "text-indigo-400" },
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();
  const user = useUserStore((state) => state.user);
  const isDark = getResolvedTheme(mode) === "dark";

  const [bezelMapUrl, setBezelMapUrl] = useState<string>("");
  const [trackDims, setTrackDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hasSvgFilterSupport, setHasSvgFilterSupport] = useState<boolean>(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const grayWindowRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const activeStripRef = useRef<HTMLDivElement>(null);
  const rimOverlayRef = useRef<HTMLDivElement>(null);

  const fgFilterRef = useRef<SVGFilterElement>(null);
  const fgImageRef = useRef<SVGFEImageElement>(null);
  const fgDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);

  const activeIndex = Math.max(0, THEME_OPTIONS.findIndex((o) => o.id === mode));

  const state = useRef({
    slotWidth: 100,
    trackWidth: 300,
    leftX: 0,
    rightX: 0,
    velLeftX: 0,
    velRightX: 0,
    targetPillX: 0,
    extraW: 0,
    extraH: 0,
    refraction: 0,
    glassAlpha: 0,
    mode: "idle" as "idle" | "scrubbing",
    elevated: false,
    initialized: false,
  });

  // Detectar soporte para filtros SVG
  useEffect(() => {
    ensureCircleBlurStyles();
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

  // Medir dimensiones del contenedor para el filtro Liquid Glass
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

  // Filtro Liquid Glass para el cuerpo de la barra
  const barFilterUrl = useMemo(() => {
    if (!hasSvgFilterSupport || trackDims.width === 0 || trackDims.height === 0) return null;
    return getDisplacementFilter({
      width: trackDims.width,
      height: trackDims.height,
      radius: 9999,
      depth: 4,
      strength: 24,
      chromaticAberration: 1.5,
    });
  }, [hasSvgFilterSupport, trackDims.width, trackDims.height]);

  // Actualizar targets geométricos
  const updateTargets = useCallback(
    (snapImmediately = false) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const innerW = Math.max(90, rect.width - 8);
      const slotW = innerW / 3;

      const s = state.current;
      s.trackWidth = innerW;
      s.slotWidth = slotW;

      const nextPillX = activeIndex * slotW;
      s.targetPillX = nextPillX;

      if (snapImmediately || !s.initialized) {
        s.leftX = nextPillX;
        s.rightX = nextPillX;
        s.initialized = true;
      }
    },
    [activeIndex]
  );

  useEffect(() => {
    updateTargets(false);
  }, [activeIndex, updateTargets]);

  useEffect(() => {
    updateTargets(true);
    const onResize = () => updateTargets(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateTargets]);

  // Loop de física y render imperativo Liquid Glass
  useEffect(() => {
    let rafId: number;

    const animate = () => {
      const s = state.current;
      const scrubbing = s.mode === "scrubbing";

      // 1. Doble Resorte Asimétrico ("Oruga Líquida")
      const centerPos = (s.leftX + s.rightX) * 0.5;
      const movingRight = s.targetPillX >= centerPos;

      const fastStiff = scrubbing ? 0.32 : 0.28;
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

      const spanLeft = Math.min(s.leftX, s.rightX);
      const spanRight = Math.max(s.leftX, s.rightX) + s.slotWidth;
      const stretchSpan = Math.max(0, spanRight - spanLeft - s.slotWidth);
      const avgSpeed = (Math.abs(s.velLeftX) + Math.abs(s.velRightX)) * 0.5;
      const distToTarget = Math.abs(s.targetPillX - centerPos);

      // 2. Activación del cristal líquido en vuelo
      const flightIntensity = Math.min(
        1,
        stretchSpan / Math.max(1, s.slotWidth * 0.32) +
          avgSpeed / 3.0 +
          distToTarget / Math.max(1, s.slotWidth * 0.65)
      );

      const targetGlassAlpha = s.elevated ? 1 : flightIntensity > 0.08 ? Math.min(1, flightIntensity * 1.15) : 0;
      s.glassAlpha += (targetGlassAlpha - s.glassAlpha) * 0.25;

      // 3. Desborde dinámico de la píldora
      const targetExtraW = s.elevated ? 14 : s.glassAlpha * 12;
      const targetExtraH = s.elevated ? 16 : s.glassAlpha * 12;

      s.extraW += (targetExtraW - s.extraW) * 0.24;
      s.extraH += (targetExtraH - s.extraH) * 0.24;

      const targetRefraction = s.elevated ? 38 : s.glassAlpha * 34;
      s.refraction += (targetRefraction - s.refraction) * 0.25;

      const pillW = Math.max(36, spanRight - spanLeft + s.extraW);
      const pillH = trackDims.height > 0 ? trackDims.height - 8 + s.extraH : 38 + s.extraH;
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

      // Máscara bajo la píldora en la capa base
      if (grayWindowRef.current) {
        const holeLeft = Math.max(0, spanLeft - s.extraW / 2 + 3);
        const holeRight = Math.min(s.trackWidth, spanRight + s.extraW / 2 - 3);
        const mask = `linear-gradient(to right, #000 0px, #000 ${holeLeft}px, transparent ${holeLeft + 2}px, transparent ${holeRight - 2}px, #000 ${holeRight}px, #000 100%)`;
        grayWindowRef.current.style.maskImage = mask;
        grayWindowRef.current.style.webkitMaskImage = mask;
      }

      // Posicionar la píldora y alinear la capa activa interna
      if (pillRef.current && activeStripRef.current && rimOverlayRef.current) {
        pillRef.current.style.width = `${pillW}px`;
        pillRef.current.style.height = `${pillH}px`;
        pillRef.current.style.transform = `translate3d(${pillLeft}px, ${pillTop}px, 0)`;

        const a = s.glassAlpha;
        if (isDark) {
          const topAlpha = (0.28 - a * 0.10).toFixed(3);
          const midAlpha = (0.12 - a * 0.06).toFixed(3);
          const botAlpha = (0.22 - a * 0.08).toFixed(3);
          pillRef.current.style.background = `linear-gradient(180deg, rgba(255,255,255,${topAlpha}) 0%, rgba(55,55,60,${midAlpha}) 50%, rgba(38,38,44,${botAlpha}) 100%)`;
        } else {
          const topAlpha = (0.46 - a * 0.16).toFixed(3);
          const midAlpha = (0.20 - a * 0.12).toFixed(3);
          const botAlpha = (0.36 - a * 0.15).toFixed(3);
          pillRef.current.style.background = `linear-gradient(180deg, rgba(255,255,255,${topAlpha}) 0%, rgba(255,255,255,${midAlpha}) 50%, rgba(255,255,255,${botAlpha}) 100%)`;
        }

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
        const innerY = -4 + s.extraH / 2;
        activeStripRef.current.style.transform = `translate3d(${innerX}px, ${innerY}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [trackDims.height, isDark]);

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
    const s = state.current;
    s.mode = "scrubbing";
    s.elevated = true;
    s.targetPillX = clampPillX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (s.mode === "scrubbing") {
      s.targetPillX = clampPillX(e.clientX);
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

    const nextIdx = Math.max(0, Math.min(2, Math.round(s.targetPillX / s.slotWidth)));
    s.targetPillX = nextIdx * s.slotWidth;

    if (nextIdx !== activeIndex) {
      const dir = s.targetPillX > s.leftX ? 1 : -1;
      if (dir > 0) s.velRightX += 5;
      else s.velLeftX -= 5;

      const nextOption = THEME_OPTIONS[nextIdx];
      if (nextOption) {
        executeCircleBlurThemeTransition(
          nextOption.id,
          setMode,
          user?.id,
          e as unknown as React.MouseEvent<HTMLElement>,
          e.currentTarget
        );
      }
    }
  };

  return (
    <>
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter
            ref={fgFilterRef}
            id="srdavo-theme-pill-fg"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="120"
            height="48"
            colorInterpolationFilters="sRGB"
          >
            {bezelMapUrl && (
              <feImage
                ref={fgImageRef}
                href={bezelMapUrl}
                x="0"
                y="0"
                width="120"
                height="48"
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

      {/* CUERPO DEL SELECTOR CON LIQUID GLASS REAL (srdavo-bar-glass) */}
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
        className="relative w-full max-w-[340px] h-[48px] px-1 rounded-full flex items-center select-none cursor-pointer overflow-visible"
      >
        {/* CAPA DE CRISTAL LÍQUIDO DEL CUERPO (recortada a la cápsula sin esquinas cuadradas) */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0"
          style={{
            clipPath: "inset(0 round 9999px)",
            WebkitClipPath: "inset(0 round 9999px)",
            backdropFilter: hasSvgFilterSupport && barFilterUrl
              ? `blur(0.8px) url('${barFilterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
              : "blur(18px) saturate(190%) brightness(1.10)",
            WebkitBackdropFilter: hasSvgFilterSupport && barFilterUrl
              ? `blur(0.8px) url('${barFilterUrl}') blur(1.5px) brightness(1.08) saturate(1.45)`
              : "blur(18px) saturate(190%) brightness(1.10)",
            background: isDark
              ? "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(20,20,24,0.48) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(240,240,248,0.24) 100%)",
            boxShadow: isDark
              ? `
                inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.25),
                inset -1px -1px 1px 0px rgba(255, 255, 255, 0.08),
                inset 0 0 16px 0px rgba(255, 255, 255, 0.04),
                0 10px 30px rgba(0, 0, 0, 0.40)
              `
              : `
                inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.88),
                inset -1px -1px 1px 0px rgba(255, 255, 255, 0.35),
                inset 0 0 16px 0px rgba(255, 255, 255, 0.12),
                0 10px 30px rgba(0, 0, 0, 0.08)
              `,
            border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(255, 255, 255, 0.72)",
          }}
        >
          {/* Reflejo especular superior característico de srdavo/liquid-glass */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full" />
        </div>

        {/* CAPA 1: Opciones en tono tenue (con máscara dinámica que desaparece bajo la píldora) */}
        <div
          ref={grayWindowRef}
          className="relative w-full h-full overflow-hidden rounded-full pointer-events-none z-10"
        >
          <div className="flex h-full w-full items-center">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  style={{ width: "33.3333%" }}
                  className="flex items-center justify-center gap-2 text-black/45 dark:text-white/45 font-semibold text-[13px]"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{option.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CAPA 2: Píldora Liquid Glass con vuelo asimétrico y refracción óptica */}
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
              filter: "url(#srdavo-theme-pill-fg)",
              WebkitFilter: "url(#srdavo-theme-pill-fg)",
            }}
            className="w-full h-full relative"
          >
            {/* Tira activa interna que viaja de forma inversa para mantenerse fija */}
            <div
              ref={activeStripRef}
              style={{
                width: `${trackDims.width || 300}px`,
                height: `${trackDims.height || 48}px`,
                top: 0,
                left: 0,
              }}
              className="absolute flex items-center will-change-transform"
            >
              {THEME_OPTIONS.map((option, idx) => {
                const Icon = option.icon;
                const isCurrent = idx === activeIndex;
                return (
                  <div
                    key={option.id}
                    style={{ width: "33.3333%" }}
                    className={`flex items-center justify-center gap-2 text-[13px] font-bold ${
                      isCurrent ? "text-gray-950 dark:text-white" : "text-black/60 dark:text-white/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? option.activeColor : ""}`} />
                    <span>{option.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bisel especular de cristal líquido con box-shadow dinámico */}
          <div
            ref={rimOverlayRef}
            className="absolute inset-0 rounded-full pointer-events-none z-10"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.85)",
              boxShadow:
                "inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(255, 255, 255, 0.5), 0 3px 12px rgba(0, 0, 0, 0.08)",
            }}
          />
        </div>
      </div>
    </>
  );
}

