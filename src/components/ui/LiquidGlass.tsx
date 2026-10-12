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
  const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  const safeDepth = Math.max(1, Math.min(depth, Math.min(width, height) / 4));

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
    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
      <rect x="0" y="0" height="${height}" width="${width}" fill="url(#Y)" class="mix" />
      <rect x="0" y="0" height="${height}" width="${width}" fill="url(#X)" class="mix" />
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

function getDisplacementFilter({
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

  const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="displace" color-interpolation-filters="sRGB">
        <feImage x="0" y="0" height="${height}" width="${width}" href="${displacementMapUrl}" result="displacementMap" />
        <feDisplacementMap
          transform-origin="center"
          in="SourceGraphic"
          in2="displacementMap"
          scale="${strength + chromaticAberration * 2}"
          xChannelSelector="R"
          yChannelSelector="G"
        />
        <feColorMatrix
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="displacedR"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="displacementMap"
          scale="${strength + chromaticAberration}"
          xChannelSelector="R"
          yChannelSelector="G"
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="displacedG"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="displacementMap"
          scale="${strength}"
          xChannelSelector="R"
          yChannelSelector="G"
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          result="displacedB"
        />
        <feBlend in="displacedR" in2="displacedG" mode="screen"/>
        <feBlend in2="displacedB" mode="screen"/>
      </filter>
    </defs>
  </svg>`;

  const result = "data:image/svg+xml;utf8," + encodeURIComponent(svg) + "#displace";
  if (filterCache.size > 100) filterCache.clear();
  filterCache.set(cacheKey, result);
  return result;
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

  const dynamicGlassStyle: CSSProperties = useMemo(() => {
    const baseBorderRadius = radius >= 9999 ? "9999px" : `${radius}px`;

    if (hasSvgFilterSupport && filterUrl) {
      return {
        ...style,
        borderRadius: baseBorderRadius,
        backdropFilter: `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) brightness(1.08) saturate(1.4)`,
        WebkitBackdropFilter: `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) brightness(1.08) saturate(1.4)`,
        boxShadow: `
          inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.82),
          inset -1px -1px 1px 0px rgba(255, 255, 255, 0.35),
          inset 0 0 16px 0px rgba(255, 255, 255, 0.12),
          0 10px 30px -4px rgba(0, 0, 0, 0.12)
        `,
      };
    }

    return {
      ...style,
      borderRadius: baseBorderRadius,
      backdropFilter: `blur(${blur * 10}px) saturate(190%)`,
      WebkitBackdropFilter: `blur(${blur * 10}px) saturate(190%)`,
      boxShadow: `
        inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.8),
        inset -1px -1px 1px 0px rgba(255, 255, 255, 0.25),
        0 8px 25px -4px rgba(0, 0, 0, 0.1)
      `,
    };
  }, [style, radius, hasSvgFilterSupport, filterUrl, blur]);

  return (
    <div
      ref={elementRef}
      className={`relative overflow-hidden transition-all duration-200 select-none ${className}`}
      style={dynamicGlassStyle}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent"
        style={{
          borderTopLeftRadius: radius >= 9999 ? "9999px" : `${radius}px`,
          borderTopRightRadius: radius >= 9999 ? "9999px" : `${radius}px`,
        }}
      />
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
        const isChromium = /chrome|chromium|crios|edg/.test(ua) && !/firefox|fxios/.test(ua);
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

    const dynamicGlassStyle: CSSProperties = useMemo(() => {
      const baseBorderRadius = radius >= 9999 ? "9999px" : `${radius}px`;

      if (hasSvgFilterSupport && filterUrl) {
        return {
          ...style,
          borderRadius: baseBorderRadius,
          backdropFilter: `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) brightness(1.08) saturate(1.4)`,
          WebkitBackdropFilter: `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) brightness(1.08) saturate(1.4)`,
          boxShadow: `
            inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.82),
            inset -1px -1px 1px 0px rgba(255, 255, 255, 0.35),
            inset 0 0 16px 0px rgba(255, 255, 255, 0.12),
            0 10px 30px -4px rgba(0, 0, 0, 0.12)
          `,
        };
      }

      return {
        ...style,
        borderRadius: baseBorderRadius,
        backdropFilter: `blur(${blur * 10}px) saturate(190%)`,
        WebkitBackdropFilter: `blur(${blur * 10}px) saturate(190%)`,
        boxShadow: `
          inset 1px 1.5px 1px 0px rgba(255, 255, 255, 0.8),
          inset -1px -1px 1px 0px rgba(255, 255, 255, 0.25),
          0 8px 25px -4px rgba(0, 0, 0, 0.1)
        `,
      };
    }, [style, radius, hasSvgFilterSupport, filterUrl, blur]);

    return (
      <button
        ref={internalRef}
        type={type}
        className={`relative overflow-hidden cursor-pointer active:scale-95 hover:scale-105 transition-all duration-150 flex items-center justify-center select-none ${className}`}
        style={dynamicGlassStyle}
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-60 bg-gradient-to-b from-white/40 via-white/10 to-transparent"
          style={{
            borderTopLeftRadius: radius >= 9999 ? "9999px" : `${radius}px`,
            borderTopRightRadius: radius >= 9999 ? "9999px" : `${radius}px`,
          }}
        />
        {children}
      </button>
    );
  }
);

LiquidGlassButton.displayName = "LiquidGlassButton";
