"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
  type CSSProperties,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "react";

// ============================================================================
// SVG DISPLACEMENT & CHROMATIC ABERRATION ENGINE (srdavo / Apple WWDC)
// ============================================================================

const filterCache = new Map<string, string>();

interface DisplacementParams {
  height: number;
  width: number;
  radius: number;
  depth: number;
}

interface FilterParams extends DisplacementParams {
  strength?: number;
  chromaticAberration?: number;
}

function getDisplacementMap({ height, width, radius, depth }: DisplacementParams): string {
  // Para cápsulas completas (como el dock móvil, buscador y header),
  // usamos el mapa óptico de bisel continuo sin costuras (getCapsuleInverseBezelMap)
  if (radius >= 9999 || radius >= Math.min(width, height) / 2 - 1) {
    const capsuleMap = getCapsuleInverseBezelMap();
    if (capsuleMap) return capsuleMap;
  }

  const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  const safeDepth = Math.max(1, depth);

  const y1 = Math.max(0, Math.ceil((safeRadius / height) * 15));
  const y2 = Math.min(100, Math.floor(100 - (safeRadius / height) * 15));
  const x1 = Math.max(0, Math.ceil((safeRadius / width) * 15));
  const x2 = Math.min(100, Math.floor(100 - (safeRadius / width) * 15));

  const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>.mix { mix-blend-mode: screen; }</style>
    <defs>
      <linearGradient id="Y" x1="0" x2="0" y1="${y1}%" y2="${y2}%">
        <stop offset="0%" stop-color="#0F0" />
        <stop offset="100%" stop-color="#000" />
      </linearGradient>
      <linearGradient id="X" x1="${x1}%" x2="${x2}%" y1="0" y2="0">
        <stop offset="0%" stop-color="#F00" />
        <stop offset="100%" stop-color="#000" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="#808080" />
    <rect x="0" y="0" height="${height}" width="${width}" rx="${safeRadius}" ry="${safeRadius}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" rx="${safeRadius}" ry="${safeRadius}" fill="#000080" />
      <rect x="0" y="0" height="${height}" width="${width}" rx="${safeRadius}" ry="${safeRadius}" fill="url(#Y)" class="mix" />
      <rect x="0" y="0" height="${height}" width="${width}" rx="${safeRadius}" ry="${safeRadius}" fill="url(#X)" class="mix" />
      <rect
        x="${safeDepth}"
        y="${safeDepth}"
        height="${Math.max(1, height - 2 * safeDepth)}"
        width="${Math.max(1, width - 2 * safeDepth)}"
        fill="#808080"
        rx="${safeRadius}"
        ry="${safeRadius}"
        filter="blur(${safeDepth}px)"
      />
    </g>
  </svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export function getDisplacementFilter({
  height,
  width,
  radius,
  depth,
  strength = 32,
  chromaticAberration = 1.8,
}: FilterParams): string {
  const cacheKey = `${width}x${height}_r${radius}_d${depth}_s${strength}_c${chromaticAberration}`;
  const cached = filterCache.get(cacheKey);
  if (cached) return cached;

  const displacementMapUrl = getDisplacementMap({ height, width, radius, depth });

  // En CSS backdrop-filter, usar feBlend mode="screen" genera un velo blanco lechoso debido
  // a la premultiplicación de alfa en el compositor GPU (Skia / Chromium).
  // Para preservar el cristal líquido 100% puro y transparente con refracción óptica real,
  // aplicamos feDisplacementMap directamente en el SourceGraphic, con coordenadas exactas (0, 0, width, height)
  // sin relleno transparente exterior que genere líneas de corte o artefactos horizontales.
  const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="displace" x="0" y="0" width="${width}" height="${height}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feImage x="0" y="0" height="${height}" width="${width}" href="${displacementMapUrl}" result="displacementMap" preserveAspectRatio="none" />
        <feDisplacementMap
          transform-origin="center"
          in="SourceGraphic"
          in2="displacementMap"
          scale="${strength}"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>`;

  const result = "data:image/svg+xml;utf8," + encodeURIComponent(svg) + "#displace";
  if (filterCache.size > 100) filterCache.clear();
  filterCache.set(cacheKey, result);
  return result;
}

let cachedCapsuleBezelMapUrl = "";

/**
 * Mapa óptico de cápsula (srdavo/liquid-glass):
 * - Centro plano (rgb(128,128,128)) para que el ícono, badge y texto se vean limpios.
 * - Bisel lateral grueso con curvatura fluida que se desvanece suavemente a 128 en el perímetro exterior.
 */
export function getCapsuleInverseBezelMap(): string {
  if (typeof document === "undefined") return "";
  if (cachedCapsuleBezelMapUrl) return cachedCapsuleBezelMapUrl;

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
  cachedCapsuleBezelMapUrl = canvas.toDataURL("image/png");
  return cachedCapsuleBezelMapUrl;
}

// ============================================================================
// REACT COMPONENT: LIQUID GLASS (DIV CONTAINER)
// ============================================================================

export interface LiquidGlassProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  radius?: number;
  depth?: number;
  strength?: number;
  chromaticAberration?: number;
  blur?: number;
  overflow?: "hidden" | "visible";
  style?: CSSProperties;
}

export function LiquidGlass({
  children,
  className = "",
  radius = 9999,
  depth = 4,
  strength = 28,
  chromaticAberration = 1.6,
  blur = 1.5,
  overflow = "hidden",
  style = {},
  ...props
}: LiquidGlassProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hasSvgFilterSupport, setHasSvgFilterSupport] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isChromium = /chrome|chromium|crios|edg/.test(ua) && !/firefox|fxios/.test(ua);
      setHasSvgFilterSupport(isChromium);
    }
  }, []);

  useEffect(() => {
    if (!elementRef.current) return;
    const el = elementRef.current;

    const updateDims = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);
      if (w > 0 && h > 0) {
        setDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    };

    updateDims();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateDims());
      ro.observe(el);
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, []);

  const filterUrl = useMemo(() => {
    if (!hasSvgFilterSupport || dims.width === 0 || dims.height === 0) return null;
    return getDisplacementFilter({
      width: dims.width,
      height: dims.height,
      radius,
      depth,
      strength,
      chromaticAberration,
    });
  }, [hasSvgFilterSupport, dims.width, dims.height, radius, depth, strength, chromaticAberration]);

  const baseBorderRadius = radius >= 9999 ? "9999px" : `${radius}px`;

  const dynamicGlassStyle: CSSProperties = useMemo(() => {
    const defaultShadow = hasSvgFilterSupport && filterUrl
      ? `
          inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.82),
          inset -1px -1px 1px 0px rgba(255, 255, 255, 0.35),
          inset 0 0 16px 0px rgba(255, 255, 255, 0.12),
          0 10px 30px -4px rgba(0, 0, 0, 0.12)
        `
      : `
          inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.8),
          inset -1px -1px 1px 0px rgba(255, 255, 255, 0.25),
          0 8px 25px -4px rgba(0, 0, 0, 0.1)
        `;

    const baseStyle: CSSProperties = {
      borderRadius: baseBorderRadius,
      backdropFilter: hasSvgFilterSupport && filterUrl
        ? `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) brightness(1.08) saturate(1.4)`
        : `blur(${blur * 12}px) saturate(190%) brightness(1.12)`,
      WebkitBackdropFilter: hasSvgFilterSupport && filterUrl
        ? `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) brightness(1.08) saturate(1.4)`
        : `blur(${blur * 12}px) saturate(190%) brightness(1.12)`,
      boxShadow: defaultShadow,
    };

    return {
      ...baseStyle,
      ...style,
    };
  }, [style, baseBorderRadius, hasSvgFilterSupport, filterUrl, blur]);

  return (
    <div
      ref={elementRef}
      className={`relative ${overflow === "visible" ? "overflow-visible" : "overflow-hidden"} select-none ${className}`}
      style={dynamicGlassStyle}
      {...props}
    >
      {/* Internal highlight clipped to shape */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ borderRadius: baseBorderRadius }}
      >
        <div className="absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent" />
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// REACT COMPONENT: LIQUID GLASS BUTTON (WITH OPTICAL REFRACTION)
// ============================================================================

export interface LiquidGlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
  radius?: number;
  depth?: number;
  strength?: number;
  chromaticAberration?: number;
  blur?: number;
}

export const LiquidGlassButton = React.forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
  (
    {
      children,
      className = "",
      radius = 9999,
      depth = 4,
      strength = 28,
      chromaticAberration = 1.6,
      blur = 1.5,
      type = "button",
      style = {},
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(forwardedRef, () => internalRef.current as HTMLButtonElement);

    const [dims, setDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [hasSvgFilterSupport, setHasSvgFilterSupport] = useState<boolean>(false);

    useEffect(() => {
      if (typeof navigator !== "undefined") {
        const ua = navigator.userAgent.toLowerCase();
        const isChromium = /chrome|chromium|edg/.test(ua) && !/iphone|ipad|ipod|firefox|fxios|crios/.test(ua);
        setHasSvgFilterSupport(isChromium);
      }
    }, []);

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      const updateDims = () => {
        const rect = el.getBoundingClientRect();
        const w = Math.ceil(rect.width);
        const h = Math.ceil(rect.height);
        if (w > 0 && h > 0) {
          setDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
        }
      };

      updateDims();

      let ro: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => updateDims());
        ro.observe(el);
      }

      return () => {
        if (ro) ro.disconnect();
      };
    }, []);

    const filterUrl = useMemo(() => {
      if (!hasSvgFilterSupport || dims.width === 0 || dims.height === 0) return null;
      return getDisplacementFilter({
        width: dims.width,
        height: dims.height,
        radius,
        depth,
        strength,
        chromaticAberration,
      });
    }, [hasSvgFilterSupport, dims.width, dims.height, radius, depth, strength, chromaticAberration]);

    const baseBorderRadius = radius >= 9999 ? "9999px" : `${radius}px`;

    const dynamicGlassStyle: CSSProperties = useMemo(() => {
      const defaultShadow = hasSvgFilterSupport && filterUrl
        ? `
            inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.82),
            inset -1px -1px 1px 0px rgba(255, 255, 255, 0.35),
            inset 0 0 16px 0px rgba(255, 255, 255, 0.12),
            0 10px 30px -4px rgba(0, 0, 0, 0.12)
          `
        : `
            inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.8),
            inset -1px -1px 1px 0px rgba(255, 255, 255, 0.25),
            0 8px 25px -4px rgba(0, 0, 0, 0.1)
          `;

      const baseStyle: CSSProperties = {
        borderRadius: baseBorderRadius,
        backdropFilter: hasSvgFilterSupport && filterUrl
          ? `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) brightness(1.08) saturate(1.4)`
          : `blur(${blur * 12}px) saturate(190%) brightness(1.12)`,
        WebkitBackdropFilter: hasSvgFilterSupport && filterUrl
          ? `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) brightness(1.08) saturate(1.4)`
          : `blur(${blur * 12}px) saturate(190%) brightness(1.12)`,
        boxShadow: defaultShadow,
      };

      return {
        ...baseStyle,
        ...style,
      };
    }, [style, baseBorderRadius, hasSvgFilterSupport, filterUrl, blur]);

    return (
      <button
        ref={internalRef}
        type={type}
        className={`relative overflow-hidden cursor-pointer active:scale-95 hover:scale-105 transition-all duration-150 flex items-center justify-center select-none ${className}`}
        style={dynamicGlassStyle}
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: baseBorderRadius }}
        >
          <div className="absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent" />
        </div>
        {children}
      </button>
    );
  }
);

LiquidGlassButton.displayName = "LiquidGlassButton";
