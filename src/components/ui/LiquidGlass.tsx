"use client";

import React, {
  useEffect,
  useRef,
  useId,
  useMemo,
  type ReactNode,
  type CSSProperties,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "react";
import type { LiquidGLLens, LiquidGLOptions } from "liquid-gl";

// Backwards-compatible dummy/helper
export function getDisplacementFilter(): string {
  return "";
}

// ============================================================================
// REACT COMPONENT: LIQUID GLASS CONTAINER (naughtyduk/liquidGL WebGPU/WebGL)
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
  interaction?: "none" | "fluid";
  tint?: string;
}

export function LiquidGlass({
  children,
  className = "",
  radius = 9999,
  depth = 4,
  strength = 28,
  chromaticAberration = 0.02,
  blur = 1.5,
  overflow = "hidden",
  style = {},
  interaction = "none",
  tint,
  ...props
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const safeLensId = useMemo(
    () => "lgl-" + reactId.replace(/[^a-zA-Z0-9_-]/g, ""),
    [reactId]
  );

  const borderRadius = radius >= 9999 ? "9999px" : `${radius}px`;

  useEffect(() => {
    let destroyed = false;
    let lens: LiquidGLLens | LiquidGLLens[] | undefined;

    async function setupLens() {
      if (typeof window === "undefined" || !containerRef.current) return;
      try {
        const mod = await import("liquid-gl");
        const windowWithGL = window as unknown as {
          liquidGL?: (opts?: LiquidGLOptions) => LiquidGLLens | LiquidGLLens[];
        };
        const liquidGL = mod.default || windowWithGL.liquidGL;
        if (!liquidGL || destroyed) return;

        lens = liquidGL({
          engine: "auto",
          snapshot: "body",
          target: `[data-liquid-lens-id="${safeLensId}"]`,
          resolution: 2.0,
          refraction: (strength || 28) * 0.0006,
          bevelDepth: Math.min(0.2, (depth || 4) * 0.02),
          bevelWidth: 0.12,
          frost: blur > 1 ? blur : 0,
          shadow: true,
          specular: true,
          aberration: chromaticAberration ? 0.02 : 0,
          reveal: "none",
          interaction: interaction || "none",
          interactionStrength: 0.45,
          interactionRadius: 0.35,
          interactionViscosity: 0.65,
          tint: tint || null,
          content: false, // Keep React children in real DOM for full interactivity
          on: {
            init(instance: unknown) {
              const typedInst = instance as { el?: HTMLElement } | null;
              if (typedInst?.el) {
                typedInst.el.style.pointerEvents = "auto";
              }
            },
          },
        });
      } catch (err) {
        console.warn("liquidGL init notice:", err);
      }
    }

    setupLens();

    return () => {
      destroyed = true;
      if (lens) {
        if (Array.isArray(lens)) {
          lens.forEach((l) => l.destroy?.());
        } else {
          lens.destroy?.();
        }
      }
    };
  }, [safeLensId, depth, strength, chromaticAberration, blur, interaction, tint]);

  return (
    <div
      ref={containerRef}
      data-liquid-lens-id={safeLensId}
      className={`relative ${
        overflow === "visible" ? "overflow-visible" : "overflow-hidden"
      } select-none ${className}`}
      style={{
        borderRadius,
        backdropFilter: "blur(12px) saturate(180%) brightness(1.06)",
        WebkitBackdropFilter: "blur(12px) saturate(180%) brightness(1.06)",
        boxShadow: `
          inset 0 1.5px 2px rgba(255, 255, 255, 0.75),
          inset 0 -1.5px 2px rgba(255, 255, 255, 0.25),
          0 8px 30px rgba(0, 0, 0, 0.12)
        `,
        ...style,
      }}
      {...props}
    >
      {/* Reflejo especular superior del cristal */}
      <div
        className="pointer-events-none absolute inset-x-2 top-0 h-[1.5px] rounded-full opacity-80"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
        }}
      />
      {/* Contenedor interactivo para children */}
      <div className="relative z-10 w-full h-full pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// REACT COMPONENT: LIQUID GLASS BUTTON (naughtyduk/liquidGL WebGPU/WebGL)
// ============================================================================

export interface LiquidGlassButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
  radius?: number;
  depth?: number;
  strength?: number;
  chromaticAberration?: number;
  blur?: number;
  interaction?: "none" | "fluid";
  tint?: string;
}

export const LiquidGlassButton = React.forwardRef<
  HTMLButtonElement,
  LiquidGlassButtonProps
>(
  (
    {
      children,
      className = "",
      radius = 9999,
      depth = 4,
      strength = 28,
      chromaticAberration = 0.02,
      blur = 1.5,
      type = "button",
      style = {},
      interaction = "none",
      tint,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(
      forwardedRef,
      () => internalRef.current as HTMLButtonElement
    );

    const reactId = useId();
    const safeLensId = useMemo(
      () => "lgl-btn-" + reactId.replace(/[^a-zA-Z0-9_-]/g, ""),
      [reactId]
    );

    const borderRadius = radius >= 9999 ? "9999px" : `${radius}px`;

    useEffect(() => {
      let destroyed = false;
      let lens: LiquidGLLens | LiquidGLLens[] | undefined;

      async function setupLens() {
        if (typeof window === "undefined" || !internalRef.current) return;
        try {
          const mod = await import("liquid-gl");
          const windowWithGL = window as unknown as {
            liquidGL?: (opts?: LiquidGLOptions) => LiquidGLLens | LiquidGLLens[];
          };
          const liquidGL = mod.default || windowWithGL.liquidGL;
          if (!liquidGL || destroyed) return;

          lens = liquidGL({
            engine: "auto",
            snapshot: "body",
            target: `[data-liquid-lens-id="${safeLensId}"]`,
            resolution: 2.0,
            refraction: (strength || 28) * 0.0006,
            bevelDepth: Math.min(0.2, (depth || 4) * 0.02),
            bevelWidth: 0.12,
            frost: blur > 1 ? blur : 0,
            shadow: true,
            specular: true,
            aberration: chromaticAberration ? 0.02 : 0,
            reveal: "none",
            interaction: interaction || "none",
            tint: tint || null,
            content: false,
            on: {
              init(instance: unknown) {
                const typedInst = instance as { el?: HTMLElement } | null;
                if (typedInst?.el) {
                  typedInst.el.style.pointerEvents = "auto";
                }
              },
            },
          });
        } catch (err) {
          console.warn("liquidGL init notice:", err);
        }
      }

      setupLens();

      return () => {
        destroyed = true;
        if (lens) {
          if (Array.isArray(lens)) {
            lens.forEach((l) => l.destroy?.());
          } else {
            lens.destroy?.();
          }
        }
      };
    }, [safeLensId, depth, strength, chromaticAberration, blur, interaction, tint]);

    return (
      <button
        ref={internalRef}
        type={type}
        data-liquid-lens-id={safeLensId}
        className={`relative overflow-hidden cursor-pointer active:scale-95 transition-all duration-150 flex items-center justify-center select-none ${className}`}
        style={{
          borderRadius,
          backdropFilter: "blur(12px) saturate(180%) brightness(1.06)",
          WebkitBackdropFilter: "blur(12px) saturate(180%) brightness(1.06)",
          boxShadow: `
            inset 0 1.5px 2px rgba(255, 255, 255, 0.75),
            inset 0 -1.5px 2px rgba(255, 255, 255, 0.25),
            0 8px 25px rgba(0, 0, 0, 0.12)
          `,
          ...style,
        }}
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-x-2 top-0 h-[1.5px] rounded-full opacity-80"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
          }}
        />
        <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-auto">
          {children}
        </div>
      </button>
    );
  }
);

LiquidGlassButton.displayName = "LiquidGlassButton";
