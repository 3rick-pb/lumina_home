"use client";

import React, {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useIsPresent,
  type Transition,
  type Variants,
} from "framer-motion";
import {
  MODE_DRAWS,
  resolvePreset,
  scaleCounts,
  scaleRadii,
  type OrbState,
} from "thinking-orbs";
import { playStepperTickSound } from "@/lib/soundUtils";
import { cn } from "@/lib/utils";

// Ensure OS-level `prefers-reduced-motion: reduce` (e.g. on WinterOS) never freezes
// `thinking-orbs` or `beUI` motion components.
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const origMatchMedia = window.matchMedia.bind(window);
  if (!(window.matchMedia as unknown as { __beuiPatched?: boolean }).__beuiPatched) {
    const patched = (query: string): MediaQueryList => {
      const mql = origMatchMedia(query);
      if (typeof query === "string" && query.includes("prefers-reduced-motion")) {
        return new Proxy(mql, {
          get(target, prop) {
            if (prop === "matches") return false;
            const val = Reflect.get(target, prop);
            return typeof val === "function" ? val.bind(target) : val;
          },
        });
      }
      return mql;
    };
    (patched as unknown as { __beuiPatched?: boolean }).__beuiPatched = true;
    window.matchMedia = patched;
  }
}

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

export const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55,
} as const;

// The deliberately elastic separation curve from the official beUI adaptive-stepper reference.
const STEPPER_LIQUID_TRANSITION = {
  duration: 600,
  ease: [0.22, 1.3, 0.71, 1],
} as const satisfies LiquidTransition;

// ============================================================================
// 1. NATIVE `thinking-orbs` MAXIMUM STUDIO QUALITY RENDERER
// Uses `thinking-orbs` official `MODE_DRAWS` engine with full 1.0x `BASE_PROFILES`
// density (600+ 3D depth-sorted dots) and 3x Retina supersampling.
// ============================================================================

const PRESET_64_COUNT_COMPENSATION: Record<OrbState, { count: number; size: number }> = {
  working: { count: 1, size: 1 },
  searching: { count: 0.42, size: 1.15 },
  solving: { count: 0.35, size: 1.05 },
  listening: { count: 0.341, size: 1 },
  connecting: { count: 1.35, size: 0.95 },
  weaving: { count: 0.5, size: 1 },
  composing: { count: 0.25, size: 0.85 },
  breathing: { count: 0.25, size: 0.956 },
  shaping: { count: 0.702, size: 0.395 },
};

interface FluidGiantThinkingOrbProps {
  size?: number;
  state?: OrbState;
  speed?: number;
  className?: string;
}

export function FluidGiantThinkingOrb({
  size = 420,
  state = "solving",
  speed = 1,
  className = "",
}: FluidGiantThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Super-sampled 3x DPR for razor-sharp Retina / 4K vector-like particle edges
    const dpr = Math.min(3, Math.max(2, (typeof window !== "undefined" && window.devicePixelRatio) || 2));
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Resolve `thinking-orbs` preset and restore 100% native 300px BASE_PROFILES density & dot proportion
    // (because `resolvePreset(state, 64)` down-scales dot counts to 0.35x for tiny 64px avatars).
    const { mode, speed: baseSpeed, opts: preset64Opts } = resolvePreset(state, 64);
    const comp = PRESET_64_COUNT_COMPENSATION[state] || { count: 0.35, size: 1.05 };

    // Restore 100% studio master dot density (600+ dots for Rubik "solving") and exact native dot radius
    let masterOpts = scaleCounts(preset64Opts, 1 / comp.count);
    masterOpts = scaleRadii(masterOpts, 1 / comp.size);

    const drawMode = MODE_DRAWS[mode];
    const effSpeed = baseSpeed * speed;

    let rafId = 0;
    let active = true;

    const renderLoop = (now: number) => {
      if (!active) return;
      const tSec = (now / 1000) * effSpeed;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // Official `thinking-orbs` painter (`paintFrame` + `inkColor` + depth z-sort)
      drawMode(ctx, size, tSec, true, masterOpts);

      rafId = window.requestAnimationFrame(renderLoop);
    };

    rafId = window.requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
    };
  }, [size, state, speed]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Thinking Orb ${state}`}
      className={cn("block select-none pointer-events-none", className)}
      style={{ width: size, height: size, maxWidth: "78vw", maxHeight: "78vw" }}
    />
  );
}

// ============================================================================
// 2. OFFICIAL `beUI` LIQUID SVG GOOEY ENGINE (`@beui/adaptive-stepper`)
// Source: https://beui.dev/r/adaptive-stepper.json (`components/motion/liquid.tsx`)
// ============================================================================

type LiquidContextValue = {
  getRoot: () => HTMLDivElement | null;
  getPortal: () => SVGGElement | null;
};

const LiquidContext = createContext<LiquidContextValue | null>(null);

function useLiquidContext() {
  const context = useContext(LiquidContext);
  if (!context) throw new Error("LiquidItem must be used within <Liquid>");
  return context;
}

export type LiquidEase = readonly [number, number, number, number];

export type LiquidTransition = {
  duration?: number;
  ease?: LiquidEase;
};

export interface LiquidProps extends HTMLAttributes<HTMLDivElement> {
  blur?: number;
  contrast?: number;
  fill?: string;
  edgeColor?: string;
  edgeOpacity?: number;
  edgeWidth?: number;
  filterPadding?: number;
}

export const Liquid = forwardRef<HTMLDivElement, LiquidProps>(function Liquid(
  {
    blur = 7,
    contrast = 22,
    fill = "currentColor",
    edgeColor = "rgba(150, 150, 160, 0.45)",
    edgeOpacity = 0.28,
    edgeWidth = 1.1,
    filterPadding = 24,
    className,
    style,
    children,
    ...props
  },
  forwardedRef: Ref<HTMLDivElement>
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ width: 192, height: 42 });
  const filterId = `liquid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const intercept = Math.round((0.5 - contrast * (5 / 12)) * 100) / 100;
  const padding = Math.ceil(blur * 3 + filterPadding);

  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      (rootRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [forwardedRef]
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const next = {
        width: root.offsetWidth || 192,
        height: root.offsetHeight || 42,
      };
      setSize((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const context = useMemo<LiquidContextValue>(
    () => ({
      getRoot: () => rootRef.current,
      getPortal: () => portalRef.current,
    }),
    []
  );

  return (
    <div
      {...props}
      ref={setRootRef}
      className={cn("relative isolate", className)}
      style={style}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 z-0 size-full overflow-visible"
      >
        <defs>
          <filter
            id={filterId}
            x={-padding}
            y={-padding}
            width={size.width + padding * 2}
            height={size.height + padding * 2}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={blur}
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrast} ${intercept}`}
              result="goo"
            />
            <feComposite
              in="SourceGraphic"
              in2="goo"
              operator="atop"
              result="shape"
            />
            {edgeWidth > 0 ? (
              <>
                <feColorMatrix
                  in="shape"
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -29.5"
                  result="solid-shape"
                />
                <feMorphology
                  in="solid-shape"
                  operator="erode"
                  radius={edgeWidth}
                  result="inset-shape"
                />
                <feComposite
                  in="solid-shape"
                  in2="inset-shape"
                  operator="out"
                  result="edge-mask"
                />
                <feFlood
                  floodColor={edgeColor}
                  floodOpacity={edgeOpacity}
                  result="edge-color"
                />
                <feComposite
                  in="edge-color"
                  in2="edge-mask"
                  operator="in"
                  result="edge"
                />
                <feMerge>
                  <feMergeNode in="shape" />
                  <feMergeNode in="edge" />
                </feMerge>
              </>
            ) : null}
          </filter>
        </defs>
        <g ref={portalRef} fill={fill} filter={`url(#${filterId})`} />
      </svg>
      <LiquidContext.Provider value={context}>
        {children}
      </LiquidContext.Provider>
    </div>
  );
});

type LiquidBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};

export interface LiquidItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  transition?: LiquidTransition;
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function solveCubicBezier([x1, y1, x2, y2]: LiquidEase) {
  return (progress: number) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;

    let lower = 0;
    let upper = 1;
    for (let index = 0; index < 20; index++) {
      const time = (lower + upper) / 2;
      const inverse = 1 - time;
      const x =
        3 * inverse * inverse * time * x1 +
        3 * inverse * time * time * x2 +
        time ** 3;
      if (x < progress) lower = time;
      else upper = time;
    }

    const time = (lower + upper) / 2;
    const inverse = 1 - time;
    return (
      3 * inverse * inverse * time * y1 +
      3 * inverse * time * time * y2 +
      time ** 3
    );
  };
}

export function LiquidItem({
  children,
  x,
  y,
  width,
  height,
  radius = Math.min(width, height) / 2,
  transition,
  className,
  style,
  ...props
}: LiquidItemProps) {
  const context = useLiquidContext();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [blob, setBlob] = useState<SVGRectElement | null>(null);
  const currentRef = useRef<LiquidBox | null>(null);
  const duration = transition?.duration ?? 600;
  const ease = transition?.ease ?? STEPPER_LIQUID_TRANSITION.ease;
  const [x1, y1, x2, y2] = ease;

  useLayoutEffect(() => {
    const portal = context.getPortal();
    if (!portal) return;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.style.transformBox = "fill-box";
    rect.style.transformOrigin = "center";
    rect.style.willChange = "transform";
    portal.append(rect);
    setBlob(rect);

    return () => {
      rect.remove();
    };
  }, [context]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !blob || !context.getRoot()) return;

    const target = { x, y, width, height, radius };
    const write = (box: LiquidBox) => {
      const transform = `translate(${box.x}px, ${box.y}px)`;
      wrapper.style.transform = transform;
      wrapper.style.width = `${box.width}px`;
      wrapper.style.height = `${box.height}px`;
      blob.style.transform = transform;
      blob.setAttribute("width", String(box.width));
      blob.setAttribute("height", String(box.height));
      blob.setAttribute("rx", String(box.radius));
    };

    const from = currentRef.current;
    if (!from || duration === 0) {
      currentRef.current = target;
      write(target);
      return;
    }

    const easing = solveCubicBezier([x1, y1, x2, y2]);
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = easing(progress);
      const current = {
        x: mix(from.x, target.x, eased),
        y: mix(from.y, target.y, eased),
        width: mix(from.width, target.width, eased),
        height: mix(from.height, target.height, eased),
        radius: mix(from.radius, target.radius, eased),
      };
      currentRef.current = current;
      write(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [blob, context, duration, height, radius, width, x, x1, x2, y, y1, y2]);

  return (
    <div
      {...props}
      ref={wrapperRef}
      className={cn("absolute left-0 top-0 z-10", className)}
      style={{ ...style, willChange: "transform, width, height" }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// 3. OFFICIAL `beUI` ADAPTIVE STEPPER (`@beui/adaptive-stepper`)
// Exact match to Video Referencia.mp4 @ 00:19 - 00:20:
// - Fixed outer footprint (`192px x 40px` or `216px x 48px`)
// - At minimum (`value <= min`, e.g. `1`), the `(-)` circle fuses into the
//   center value capsule with the `<Liquid>` SVG gooey bridge, expanding the
//   value pill to the left (`[   1   ]  (+)`).
// - When incremented (`1 -> 2`), the `(-)` circle separates out to the left
//   with the elastic liquid gooey stretch (`(-)  [ 2 ]  (+)`) while the
//   number rolls vertically with motion blur!
// - At maximum (`value >= max`), the `(+)` circle fuses into the right of the
//   center value capsule (`(-)  [  max  ]`).
// - On intermediate steps (`2 -> 3`), the value rolls vertically AND the
//   liquid capsule performs a tactile elastic recoil toward the clicked side.
// ============================================================================

interface BeUIAdaptiveStepperProps {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  disableIncrement?: boolean;
  disableDecrement?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "sm" | "md" | "lg";
  incrementTitle?: string;
  decrementTitle?: string;
}

export function BeUIAdaptiveStepper({
  value,
  min = 1,
  max = 99,
  disabled = false,
  disableIncrement = false,
  disableDecrement = false,
  onIncrement,
  onDecrement,
  size = "md",
  incrementTitle = "Aumentar",
  decrementTitle = "Disminuir",
}: BeUIAdaptiveStepperProps) {
  const prevValueRef = useRef(value);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  // Liquid droplet state: emits a metaball droplet from the clicked button (`+` or `-`)
  // across the 16px gap into the center `[value]` capsule so the button and center capsule
  // physically unite and pass a liquid droplet on every click.
  const [dropletState, setDropletState] = useState<{
    dir: -1 | 0 | 1;
    phase: "idle" | "bridge" | "absorb";
  }>({ dir: 0, phase: "idle" });
  const dropletTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      dropletTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  if (value !== prevValueRef.current) {
    const nextDir = value > prevValueRef.current ? 1 : -1;
    prevValueRef.current = value;
    if (direction !== nextDir) {
      setDirection(nextDir);
    }
  }

  const triggerLiquidTransfer = (dir: -1 | 1, callback: () => void) => {
    dropletTimersRef.current.forEach((id) => window.clearTimeout(id));
    dropletTimersRef.current = [];

    setDirection(dir);
    playStepperTickSound(dir === 1 ? "up" : "down");

    // Phase 1 ("bridge"): Droplet emerges from the clicked `+` or `-` button while
    // the center capsule reaches out to unite with the button across the 16px gap
    setDropletState({ dir, phase: "bridge" });
    callback();

    // Phase 2 ("absorb"): Droplet detaches from the button and flows into the center capsule
    const t1 = window.setTimeout(() => {
      setDropletState({ dir, phase: "absorb" });
    }, 105);

    // Phase 3 ("idle"): Settle cleanly back into the 3 separated islands
    const t2 = window.setTimeout(() => {
      setDropletState({ dir: 0, phase: "idle" });
    }, 440);

    dropletTimersRef.current.push(t1, t2);
  };

  const atMin = disableDecrement || value <= min;
  const atMax = disableIncrement || value >= max;
  const distance = (direction || 1) * 40;

  // Verbatim 216px x 48px internal coordinate system from @beui/adaptive-stepper
  // (https://beui.dev/r/adaptive-stepper.json & Video Referencia.mp4)
  const scale = size === "lg" ? 0.84 : size === "sm" ? 0.58 : 0.65;
  const outerW = Math.round(216 * scale);
  const outerH = Math.round(48 * scale);

  const baseCenterGeometry =
    atMin && atMax
      ? { x: 0, width: 216 }
      : atMin
      ? { x: 0, width: 152 }
      : atMax
      ? { x: 64, width: 152 }
      : { x: 64, width: 88 };

  // When a droplet is bridging from `+` (dir === 1) or `-` (dir === -1), the center pill
  // reaches slightly toward the clicked button to fuse with the droplet, then swells as it absorbs it.
  const centerGeometry = useMemo(() => {
    if (dropletState.phase === "bridge" && !atMin && !atMax) {
      if (dropletState.dir === 1) {
        return { x: 64, width: 100 }; // Reaches right toward `+`
      }
      if (dropletState.dir === -1) {
        return { x: 52, width: 100 }; // Reaches left toward `-`
      }
    }
    if (dropletState.phase === "absorb" && !atMin && !atMax) {
      return { x: 62, width: 92 }; // Slight swell as droplet merges into center
    }
    return baseCenterGeometry;
  }, [dropletState, atMin, atMax, baseCenterGeometry]);

  // Coordinates of the travelling liquid droplet inside the 216x48 SVG Gooey field
  const dropletX = useMemo(() => {
    const restCenter = baseCenterGeometry.x + (baseCenterGeometry.width - 36) / 2;
    if (dropletState.phase === "bridge") {
      return dropletState.dir === 1 ? 156 : 24;
    }
    if (dropletState.phase === "absorb") {
      return dropletState.dir === 1 ? 96 : 84;
    }
    return restCenter;
  }, [dropletState, baseCenterGeometry]);

  return (
    <div
      style={{ width: outerW, height: outerH }}
      className="relative inline-block select-none shrink-0"
    >
      <fieldset
        aria-label={`Cantidad: ${value}`}
        style={{
          width: 216,
          height: 48,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="relative isolate m-0 border-0 p-0 text-[#f3f3f6] dark:text-[#232329]"
      >
        <Liquid
          blur={6}
          contrast={22}
          fill="currentColor"
          edgeColor="rgba(160, 160, 175, 0.45)"
          edgeOpacity={0.35}
          edgeWidth={1}
          className="size-full"
        >
          {/* LIQUID DROPLET BRIDGE ITEM: Travels from `+` or `-` into the center `[value]` pill */}
          <LiquidItem
            x={dropletX}
            y={6}
            width={36}
            height={36}
            radius={18}
            transition={{
              duration: dropletState.phase === "bridge" ? 110 : 340,
              ease: [0.22, 1.3, 0.71, 1],
            }}
          >
            <span aria-hidden="true" className="block size-full pointer-events-none" />
          </LiquidItem>

          {/* 1. LEFT DECREMENT BUTTON (`-`) */}
          <LiquidItem
            x={atMin ? 32 : dropletState.phase === "bridge" && dropletState.dir === -1 ? 8 : 0}
            y={0}
            width={48}
            height={48}
            radius={24}
            transition={STEPPER_LIQUID_TRANSITION}
          >
            <motion.button
              type="button"
              aria-label={decrementTitle}
              aria-hidden={atMin || undefined}
              tabIndex={atMin ? -1 : 0}
              disabled={disabled || atMin}
              title={decrementTitle}
              whileTap={disabled || atMin ? undefined : { scale: 0.94 }}
              transition={SPRING_PRESS}
              onClick={(e) => {
                e.stopPropagation();
                if (disabled || atMin) return;
                triggerLiquidTransfer(-1, onDecrement);
              }}
              className={cn(
                "grid size-full place-items-center rounded-full text-gray-900 dark:text-gray-100 outline-none transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer disabled:pointer-events-none",
                atMin && "pointer-events-none"
              )}
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{
                  opacity: atMin ? 0 : 1,
                  scale: atMin ? 0.6 : 1,
                  filter: atMin ? "blur(3px)" : "blur(0px)",
                }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              >
                <Minus className="w-5 h-5 stroke-[2.2]" />
              </motion.span>
            </motion.button>
          </LiquidItem>

          {/* 2. CENTER ADAPTIVE VALUE PILL */}
          <LiquidItem
            x={centerGeometry.x}
            y={0}
            width={centerGeometry.width}
            height={48}
            radius={24}
            transition={STEPPER_LIQUID_TRANSITION}
          >
            <output
              aria-live="polite"
              aria-atomic="true"
              className="flex size-full min-w-0 items-center justify-center overflow-hidden rounded-full px-5 text-xl font-semibold tabular-nums text-gray-950 dark:text-white pointer-events-none"
            >
              <span className="sr-only">{value}</span>
              <span
                aria-hidden="true"
                className="relative grid min-h-[1.2em] min-w-[1.5ch] place-items-center overflow-hidden leading-none"
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={value}
                    initial={{
                      opacity: 0.25,
                      filter: "blur(2.5px)",
                      y: `${distance}%`,
                    }}
                    animate={{
                      opacity: 1,
                      filter: "blur(0px)",
                      y: "0%",
                    }}
                    exit={{
                      opacity: 0,
                      filter: "blur(2.5px)",
                      y: `${-distance}%`,
                      transition: {
                        duration: 0.14,
                        ease: EASE_OUT,
                      },
                    }}
                    transition={{
                      duration: 0.2,
                      ease: EASE_OUT,
                    }}
                    className="col-start-1 row-start-1 will-change-[transform,filter,opacity]"
                  >
                    {value}
                  </motion.span>
                </AnimatePresence>
              </span>
            </output>
          </LiquidItem>

          {/* 3. RIGHT INCREMENT BUTTON (`+`) */}
          <LiquidItem
            x={atMax ? 136 : dropletState.phase === "bridge" && dropletState.dir === 1 ? 160 : 168}
            y={0}
            width={48}
            height={48}
            radius={24}
            transition={STEPPER_LIQUID_TRANSITION}
          >
            <motion.button
              type="button"
              aria-label={incrementTitle}
              aria-hidden={atMax || undefined}
              tabIndex={atMax ? -1 : 0}
              disabled={disabled || atMax}
              title={incrementTitle}
              whileTap={disabled || atMax ? undefined : { scale: 0.94 }}
              transition={SPRING_PRESS}
              onClick={(e) => {
                e.stopPropagation();
                if (disabled || atMax) return;
                triggerLiquidTransfer(1, onIncrement);
              }}
              className={cn(
                "grid size-full place-items-center rounded-full text-gray-900 dark:text-gray-100 outline-none transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer disabled:pointer-events-none",
                atMax && "pointer-events-none"
              )}
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{
                  opacity: atMax ? 0 : 1,
                  scale: atMax ? 0.6 : 1,
                  filter: atMax ? "blur(3px)" : "blur(0px)",
                }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              >
                <Plus className="w-5 h-5 stroke-[2.2]" />
              </motion.span>
            </motion.button>
          </LiquidItem>
        </Liquid>
      </fieldset>
    </div>
  );
}

// ============================================================================
// 4. OFFICIAL `beUI` DIGIT SWAP (`@beui/digit-swap`)
// Source: https://beui.dev/r/digit-swap.json (`components/motion/digit-swap.tsx`)
// ============================================================================

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function OdometerDigitWheel({
  digit,
  delayMs = 0,
}: {
  digit: number;
  delayMs?: number;
}) {
  const [isRolling, setIsRolling] = useState(false);
  const prevDigitRef = useRef(digit);

  useEffect(() => {
    if (digit !== prevDigitRef.current) {
      prevDigitRef.current = digit;
      setIsRolling(true);
      const t = setTimeout(() => setIsRolling(false), 460 + delayMs);
      return () => clearTimeout(t);
    }
  }, [digit, delayMs]);

  return (
    <span
      className="relative inline-block overflow-hidden align-baseline"
      style={{
        width: "0.62em",
        height: "1.22em",
        verticalAlign: "bottom",
      }}
    >
      <span
        className="flex flex-col items-center w-full"
        style={{
          height: "12.2em",
          transform: `translate3d(0, -${digit * 1.22}em, 0)`,
          transition: `transform 520ms cubic-bezier(0.22, 1.35, 0.36, 1) ${delayMs}ms, filter 280ms ease ${delayMs}ms`,
          filter: isRolling ? "blur(1.1px)" : "blur(0px)",
          willChange: "transform, filter",
        }}
      >
        {DIGITS.map((num) => (
          <span
            key={num}
            className="flex items-center justify-center select-none"
            style={{ height: "1.22em", lineHeight: "1.22em" }}
          >
            {num}
          </span>
        ))}
      </span>
    </span>
  );
}

interface BeUIRollingPriceProps {
  amount: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function BeUIRollingPrice({
  amount,
  prefix = "$",
  suffix = "",
  className = "",
}: BeUIRollingPriceProps) {
  const [highlight, setHighlight] = useState(false);
  const prevAmountRef = useRef(amount);

  useEffect(() => {
    if (Math.abs(amount - prevAmountRef.current) > 0.001) {
      prevAmountRef.current = amount;
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 450);
      return () => clearTimeout(t);
    }
  }, [amount]);

  const formatted = `${prefix}${amount.toFixed(2)}`;
  const chars = formatted.split("");

  return (
    <span
      style={{
        transform: highlight ? "scale(1.04)" : "scale(1)",
        transition: "transform 360ms cubic-bezier(0.22, 1.35, 0.36, 1), color 300ms ease",
      }}
      className={`inline-flex items-baseline ${className}`}
    >
      {chars.map((ch, i) => {
        const num = parseInt(ch, 10);
        if (isNaN(num)) {
          return (
            <span key={`sym-${i}`} className="inline-block">
              {ch}
            </span>
          );
        }
        return (
          <OdometerDigitWheel
            key={`price-digit-${chars.length - i}`}
            digit={num}
            delayMs={i * 25}
          />
        );
      })}
      {suffix && <span className="ml-1">{suffix}</span>}
    </span>
  );
}

// ============================================================================
// 5. OFFICIAL `beUI` ACTION SWAP CASCADE (`@beui/action-swap-cascade`)
// Source: https://beui.dev/r/action-swap-cascade.json
// ============================================================================

interface BeUIActionSwapLabelProps {
  active: boolean;
  idleText: string;
  activeText: string;
  idleIcon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  className?: string;
}

export function BeUIActionSwapLabel({
  active,
  idleText,
  activeText,
  idleIcon,
  activeIcon,
  className = "",
}: BeUIActionSwapLabelProps) {
  return (
    <span className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 ${className}`}>
      {/* Dual-State Icon Slot */}
      <span className="relative inline-flex items-center justify-center w-4 h-4 sm:w-[18px] sm:h-[18px] overflow-hidden shrink-0">
        <span
          style={{
            transform: active ? "translate3d(0, -120%, 0) scale(0.5)" : "translate3d(0, 0%, 0) scale(1)",
            opacity: active ? 0 : 1,
            filter: active ? "blur(3px)" : "blur(0px)",
            transition: "transform 420ms cubic-bezier(0.22, 1.3, 0.36, 1), opacity 280ms ease, filter 280ms ease",
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {idleIcon}
        </span>
        <span
          style={{
            transform: active ? "translate3d(0, 0%, 0) scale(1.05)" : "translate3d(0, 120%, 0) scale(0.5)",
            opacity: active ? 1 : 0,
            filter: active ? "blur(0px)" : "blur(3px)",
            transition: "transform 420ms cubic-bezier(0.22, 1.3, 0.36, 1) 40ms, opacity 280ms ease 40ms, filter 280ms ease",
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {activeIcon}
        </span>
      </span>

      {/* Two Independent Centered Layers for Natural Typography Kerning + Letter-by-Letter Cascade */}
      <span
        className="relative inline-grid place-items-center overflow-hidden leading-none"
        style={{ height: "1.35em" }}
      >
        {/* Idle Text Layer */}
        <span
          aria-hidden={active || undefined}
          className="col-start-1 row-start-1 inline-flex items-center justify-center whitespace-nowrap"
        >
          {Array.from(idleText).map((ch, idx) => {
            const delayMs = idx * 12;
            return (
              <span
                key={`idle-${idx}`}
                style={{
                  transform: active ? "translate3d(0, -115%, 0)" : "translate3d(0, 0%, 0)",
                  opacity: active ? 0 : 1,
                  filter: active ? "blur(2.5px)" : "blur(0px)",
                  transition: `transform 400ms cubic-bezier(0.22, 1.3, 0.36, 1) ${delayMs}ms, opacity 240ms ease ${delayMs}ms, filter 240ms ease ${delayMs}ms`,
                }}
                className="inline-block whitespace-pre"
              >
                {ch}
              </span>
            );
          })}
        </span>

        {/* Active Text Layer */}
        <span
          aria-hidden={!active || undefined}
          className="col-start-1 row-start-1 inline-flex items-center justify-center whitespace-nowrap"
        >
          {Array.from(activeText).map((ch, idx) => {
            const delayMs = idx * 12;
            return (
              <span
                key={`active-${idx}`}
                style={{
                  transform: active ? "translate3d(0, 0%, 0)" : "translate3d(0, 115%, 0)",
                  opacity: active ? 1 : 0,
                  filter: active ? "blur(0px)" : "blur(2.5px)",
                  transition: `transform 400ms cubic-bezier(0.22, 1.3, 0.36, 1) ${delayMs}ms, opacity 240ms ease ${delayMs}ms, filter 240ms ease ${delayMs}ms`,
                }}
                className="inline-block whitespace-pre"
              >
                {ch}
              </span>
            );
          })}
        </span>
      </span>
    </span>
  );
}

/* ============================================================================
 * 5. @beui/loader (variant="metaballs")
 * Official SVG Metaballs Gooey Loader for Login & Action States
 * ============================================================================ */

const METABALL_SPLIT_MS = 1350;

export interface BeUILoaderMetaballsProps {
  size?: number;
  className?: string;
  color?: string;
}

export function BeUILoaderMetaballs({ size = 24, className, color = "currentColor" }: BeUILoaderMetaballsProps) {
  const rawId = useId();
  const filterId = `beui-metaball-goo-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const leftBallRef = useRef<SVGCircleElement>(null);
  const rightBallRef = useRef<SVGCircleElement>(null);
  const bridgeBallRef = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    let raf: number;
    const t0 = performance.now();

    const frame = (now: number) => {
      const progress = ((now - t0) % METABALL_SPLIT_MS) / METABALL_SPLIT_MS;
      // Smooth 0 -> 1 -> 0 wave: 0 = 1 merged center circle (●), 1 = 2 separated side-by-side circles (● ●)
      const wave = Math.sin(progress * Math.PI);
      const easeSplit = Math.pow(wave, 1.25);

      // Horizontal distance from center (0 = merged at cx=50, 23.5 = separated at cx=26.5 & cx=73.5)
      const offset = easeSplit * 23.5;
      // Radius contracts slightly as 1 circle splits into 2 equal circles (conservation of area)
      const r = 15.8 - easeSplit * 2.6;

      leftBallRef.current?.setAttribute("cx", (50 - offset).toFixed(2));
      leftBallRef.current?.setAttribute("r", r.toFixed(2));

      rightBallRef.current?.setAttribute("cx", (50 + offset).toFixed(2));
      rightBallRef.current?.setAttribute("r", r.toFixed(2));

      // Liquid stretching tendon during separation/re-entry before snapping into 2 clean spheres
      const tendonStrength = Math.max(0, Math.sin(easeSplit * Math.PI) * (1 - Math.max(0, (easeSplit - 0.68) * 3.1)));
      bridgeBallRef.current?.setAttribute("rx", (tendonStrength * 14.5).toFixed(2));
      bridgeBallRef.current?.setAttribute("ry", (tendonStrength * 7.2).toFixed(2));

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("shrink-0 overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5.8" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} fill={color}>
        <circle ref={leftBallRef} cx="50" cy="50" r="15.8" />
        <ellipse ref={bridgeBallRef} cx="50" cy="50" rx="0" ry="0" />
        <circle ref={rightBallRef} cx="50" cy="50" r="15.8" />
      </g>
    </svg>
  );
}

/* ============================================================================
 * 6. @beui/select
 * Official Gooey Pinch-Off Border-Radius Select with Staggered Option Reveal
 * ============================================================================ */

const SELECT_BORDER_RADIUS = 16;
const SELECT_DURATION = 0.25;
const SELECT_EASE: [number, number, number, number] = [0.77, 0, 0.175, 1];
const SELECT_STAGGER = 0.025;
const SELECT_GAP = 8;

const selectTriggerVariants = {
  open: {
    borderBottomLeftRadius: [SELECT_BORDER_RADIUS, 0, SELECT_BORDER_RADIUS],
    borderBottomRightRadius: [SELECT_BORDER_RADIUS, 0, SELECT_BORDER_RADIUS],
    transition: { duration: SELECT_DURATION, ease: SELECT_EASE, times: [0, 0.4, 1] },
  },
  closed: {
    borderBottomLeftRadius: [SELECT_BORDER_RADIUS, 0, SELECT_BORDER_RADIUS],
    borderBottomRightRadius: [SELECT_BORDER_RADIUS, 0, SELECT_BORDER_RADIUS],
    transition: { duration: SELECT_DURATION, ease: SELECT_EASE, times: [0, 0.6, 1] },
  },
};

const selectMenuVariants = {
  open: {
    opacity: 1,
    y: [-1, SELECT_GAP],
    scale: [0.95, 1],
    borderTopLeftRadius: [0, SELECT_BORDER_RADIUS],
    borderTopRightRadius: [0, SELECT_BORDER_RADIUS],
    transition: {
      duration: SELECT_DURATION,
      ease: SELECT_EASE,
      borderTopLeftRadius: { duration: SELECT_DURATION, ease: SELECT_EASE, times: [0.4, 1] },
      borderTopRightRadius: { duration: SELECT_DURATION, ease: SELECT_EASE, times: [0.4, 1] },
      delayChildren: 0.05,
      staggerChildren: SELECT_STAGGER,
    },
  },
  closed: {
    opacity: [1, 1, 0],
    y: [SELECT_GAP, -1, -1],
    scale: [1, 0.95, 0.95],
    borderTopLeftRadius: [SELECT_BORDER_RADIUS, 0, SELECT_BORDER_RADIUS],
    borderTopRightRadius: [SELECT_BORDER_RADIUS, 0, SELECT_BORDER_RADIUS],
    transition: {
      duration: SELECT_DURATION,
      ease: SELECT_EASE,
      times: [0, 0.6, 1],
      staggerChildren: SELECT_STAGGER,
      staggerDirection: -1,
    },
  },
};

const selectItemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  closed: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.12, ease: "easeIn" as const },
  },
};

export interface BeUISelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface BeUISelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | BeUISelectOption)[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function BeUISelectField({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className,
  triggerClassName,
  disabled = false,
}: BeUISelectFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: BeUISelectOption[] = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt
      ),
    [options]
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((opt) => opt.value === value),
    [normalizedOptions, value]
  );

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        variants={selectTriggerVariants}
        initial={false}
        animate={open ? "open" : "closed"}
        style={{
          borderTopLeftRadius: SELECT_BORDER_RADIUS,
          borderTopRightRadius: SELECT_BORDER_RADIUS,
          borderBottomLeftRadius: SELECT_BORDER_RADIUS,
          borderBottomRightRadius: SELECT_BORDER_RADIUS,
        }}
        className={cn(
          "flex w-full items-center justify-between gap-2.5 border border-gray-200 dark:border-white/15 bg-white dark:bg-[#161920] px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white shadow-sm transition-colors hover:border-gray-300 dark:hover:border-[#ccff00]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ccff00]/40 cursor-pointer select-none",
          open && "border-gray-900/30 dark:border-[#ccff00]/60 ring-2 ring-gray-900/5 dark:ring-[#ccff00]/15",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          <span className={cn("truncate", !selectedOption && "text-gray-400 dark:text-gray-500")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: SELECT_DURATION, ease: SELECT_EASE }}
          className="inline-flex shrink-0 text-gray-500 dark:text-gray-400"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            variants={selectMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
              borderBottomLeftRadius: SELECT_BORDER_RADIUS,
              borderBottomRightRadius: SELECT_BORDER_RADIUS,
              transformOrigin: "top center",
            }}
            className="absolute left-0 right-0 z-[120] overflow-hidden border border-gray-200/90 dark:border-white/15 bg-white/95 dark:bg-[#12151c]/95 backdrop-blur-2xl p-1.5 text-gray-900 dark:text-white shadow-[0_20px_50px_rgba(0,0,0,0.28)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
          >
            <div className="max-h-60 overflow-y-auto overscroll-contain space-y-0.5 pr-0.5 custom-scrollbar">
              {normalizedOptions.map((item) => {
                const isSelected = item.value === value;
                return (
                  <motion.div
                    key={item.value}
                    role="option"
                    aria-selected={isSelected}
                    variants={selectItemVariants}
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors",
                      isSelected
                        ? "bg-gray-900 text-white dark:bg-[#ccff00] dark:text-gray-950 font-bold shadow-sm"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                    )}
                  >
                    <span className="truncate flex items-center gap-2">
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </span>
                    {isSelected && (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 ml-2"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================================
 * 7. @beui/center-morph-modal
 * Official Center Morph Modal (`clipPath: inset(48% 48% 48% 48% round 30px)` -> `inset(0% 0% 0% 0% round 30px)`)
 * ============================================================================ */

const CENTER_MORPH_BACKDROP_VARIANTS = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const CENTER_MORPH_MODAL_VARIANTS = {
  closed: {
    clipPath: "inset(48% 48% 48% 48% round 30px)",
    scale: 0.9,
    opacity: 0,
  },
  open: {
    clipPath: "inset(0% 0% 0% 0% round 30px)",
    scale: 1,
    opacity: 1,
  },
};

const CENTER_MORPH_TRANSITION = {
  duration: 0.43,
  ease: [0.2, 0, 0.2, 1] as const,
};

export interface BeUICenterMorphModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function BeUICenterMorphModal({
  open,
  onOpenChange,
  children,
  className,
}: BeUICenterMorphModalProps) {
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!open) {
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overscroll-behavior");
      document.documentElement.classList.remove(
        "lumina-modal-lock-scroll",
        "lumina-add-card-scroll-lock"
      );
      return;
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.classList.add("lumina-modal-lock-scroll");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChangeRef.current(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overscroll-behavior");
      document.documentElement.classList.remove(
        "lumina-modal-lock-scroll",
        "lumina-add-card-scroll-lock"
      );
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <style>{`
            html.lumina-modal-lock-scroll,
            html.lumina-modal-lock-scroll body {
              overflow: hidden !important;
              overscroll-behavior: none !important;
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            html.lumina-modal-lock-scroll::-webkit-scrollbar,
            html.lumina-modal-lock-scroll body::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
          `}</style>
          <motion.div
            variants={CENTER_MORPH_BACKDROP_VARIANTS}
            initial="closed"
            animate="open"
            exit="closed"
            transition={CENTER_MORPH_TRANSITION}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={CENTER_MORPH_MODAL_VARIANTS}
            initial="closed"
            animate="open"
            exit="closed"
            transition={CENTER_MORPH_TRANSITION}
            className={cn(
              "relative z-10 w-full max-w-2xl rounded-[30px] overflow-hidden shadow-2xl will-change-[clip-path,transform,opacity]",
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
 * 8. @beui/expandable-action-bar (Lateral Rightwards Expandable Sidebar for PC & Tablets)
 * Expands laterally to the right on pointer hover or tablet tap toggle
 * ============================================================================ */

const SIDEBAR_EXPAND_SPRING = {
  type: "spring" as const,
  duration: 0.38,
  bounce: 0.1,
};

const SIDEBAR_LABEL_TRANSITION = {
  opacity: { duration: 0.2 },
  x: { type: "spring" as const, duration: 0.35, bounce: 0.08 },
};

export interface BeUISidebarNavItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badgeCount?: number;
  alertDot?: boolean;
  accentColor?: "lime" | "default";
}

export interface BeUILateralExpandableSidebarProps {
  brandHref?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  brandLogo?: React.ReactNode;
  isAdmin?: boolean;
  topSpecialItem?: BeUISidebarNavItem;
  primaryItems: BeUISidebarNavItem[];
  secondaryItems?: BeUISidebarNavItem[];
  footerSlot?: (isExpanded: boolean) => React.ReactNode;
  className?: string;
}

export function BeUILateralExpandableSidebar({
  brandHref = "/",
  brandTitle = "Lumina",
  brandSubtitle,
  brandLogo,
  isAdmin = false,
  topSpecialItem,
  primaryItems,
  secondaryItems = [],
  footerSlot,
  className,
}: BeUILateralExpandableSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const isExpanded = isHovered || isPinned;

  const renderNavButton = (item: BeUISidebarNavItem, isSpecialLime = false) => {
    const isHighlighted = hoveredItemId === item.id;
    return (
      <motion.button
        key={item.id}
        type="button"
        onClick={item.onClick}
        onMouseEnter={() => setHoveredItemId(item.id)}
        onMouseLeave={() => setHoveredItemId(null)}
        className={cn(
          "relative w-full h-11 rounded-2xl flex items-center px-3 gap-3.5 transition-colors duration-200 cursor-pointer select-none group overflow-hidden",
          item.active
            ? isSpecialLime
              ? "bg-[#ccff00] text-gray-950 font-bold shadow-[0_6px_20px_rgba(204,255,0,0.28)]"
              : "bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-semibold shadow-md"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        )}
      >
        {/* @beui/expandable-action-bar shared hover highlight pill */}
        {!item.active && isHighlighted && (
          <motion.span
            layoutId="beui-sidebar-hover-pill"
            className="absolute inset-0 rounded-2xl bg-gray-100/90 dark:bg-white/[0.07] -z-10"
            transition={SIDEBAR_EXPAND_SPRING}
          />
        )}

        {/* Active left indicator accent */}
        {item.active && !isSpecialLime && (
          <motion.span
            layoutId="beui-sidebar-active-bar"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#ccff00]"
            transition={SIDEBAR_EXPAND_SPRING}
          />
        )}

        {/* Fixed 28px Icon Column so icons never jump horizontally */}
        <span className="relative w-7 h-7 flex items-center justify-center shrink-0">
          {item.icon}

          {/* Collapsed badge / alert dot */}
          {!isExpanded && item.alertDot && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[8px] font-extrabold flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-[#121316]">
              !
            </span>
          )}
          {!isExpanded && !item.alertDot && item.badgeCount !== undefined && item.badgeCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm",
                item.active
                  ? "bg-[#ccff00] text-gray-950"
                  : "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              )}
            >
              {item.badgeCount}
            </span>
          )}
        </span>

        {/* Lateral Expanded Label & Badges */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={SIDEBAR_LABEL_TRANSITION}
              className="flex-1 min-w-0 flex items-center justify-between gap-2 overflow-hidden whitespace-nowrap"
            >
              <div className="text-left truncate">
                <span className="block text-xs sm:text-[13px] tracking-tight truncate">
                  {item.label}
                </span>
                {item.subtitle && (
                  <span
                    className={cn(
                      "block text-[10px] font-normal truncate",
                      item.active
                        ? isSpecialLime
                          ? "text-gray-900/75"
                          : "text-white/70 dark:text-gray-700"
                        : "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {item.subtitle}
                  </span>
                )}
              </div>

              {item.alertDot && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[9px] font-extrabold uppercase shrink-0">
                  Pendiente
                </span>
              )}
              {!item.alertDot && item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                    item.active
                      ? isSpecialLime
                        ? "bg-gray-950 text-[#ccff00]"
                        : "bg-[#ccff00] text-gray-950"
                      : "bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-300"
                  )}
                >
                  {item.badgeCount}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    /* Reserved 80px footprint in flex row; motion.aside is relative in normal flow so it stretches full height and overflows rightwards on hover */
    <div
      className={cn(
        "hidden md:flex relative w-[80px] shrink-0 self-stretch z-40 select-none overflow-visible",
        className
      )}
    >
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 256 : 76 }}
        transition={SIDEBAR_EXPAND_SPRING}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredItemId(null);
        }}
        className={cn(
          "relative min-h-full shrink-0 flex flex-col justify-between py-6 px-3 rounded-3xl bg-white/95 dark:bg-[#1e1e20]/95 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 transition-shadow duration-300 overflow-hidden",
          isExpanded
            ? "shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.75)] ring-1 ring-black/5 dark:ring-[#ccff00]/20"
            : "shadow-[0_12px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
        )}
      >
        {/* Top Brand + Tablet/Mouse Pin Toggle */}
        <div className="flex flex-col gap-2.5 w-full">
          <div className="flex items-center justify-between px-0.5 mb-1">
            <a
              href={brandHref}
              className="flex items-center gap-3 group focus:outline-none min-w-0"
              title="Volver a la tienda Lumina"
            >
              {brandLogo ? (
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[#1c1b18] via-[#121210] to-[#080808] border border-[#c49a3f]/50 dark:border-[#c49a3f]/60 flex items-center justify-center shadow-lg shadow-[#c49a3f]/15 group-hover:border-[#e0be70] group-hover:scale-105 transition-all shrink-0">
                  {brandLogo}
                </div>
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 flex items-center justify-center font-serif font-bold text-lg shadow-md group-hover:scale-105 transition-transform shrink-0">
                  L.
                </div>
              )}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={SIDEBAR_LABEL_TRANSITION}
                    className="min-w-0 overflow-hidden whitespace-nowrap"
                  >
                    <span className="block font-serif font-bold text-base text-gray-900 dark:text-white tracking-tight truncate">
                      {brandTitle}
                    </span>
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-[#ccff00]">
                      {brandSubtitle || (isAdmin ? "Panel Ejecutivo" : "Mi Espacio")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </a>

            {/* Pin / Expand Toggle Button for Tablet & Mouse Users */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={() => setIsPinned((prev) => !prev)}
                  title={isPinned ? "Desfijar menú lateral" : "Fijar menú desplegado"}
                  className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0",
                    isPinned
                      ? "bg-[#ccff00] text-gray-950 shadow-sm"
                      : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {isPinned ? (
                      <path d="m15 18-6-6 6-6" />
                    ) : (
                      <path d="m9 18 6-6-6-6" />
                    )}
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full h-[1px] bg-gray-200/70 dark:bg-white/[0.06] my-0.5" />

          {/* Special Admin / Top Action Item */}
          {topSpecialItem && (
            <>
              {renderNavButton(topSpecialItem, true)}
              <div className="w-full h-[1px] bg-gray-200/70 dark:bg-white/[0.06] my-0.5" />
            </>
          )}

          {/* Primary Navigation Items */}
          <nav className="flex flex-col gap-1 w-full">
            {primaryItems.map((item) => renderNavButton(item, false))}
          </nav>

          {/* Secondary Navigation Items */}
          {secondaryItems.length > 0 && (
            <>
              <div className="w-full h-[1px] bg-gray-200/70 dark:bg-white/[0.06] my-0.5" />
              <nav className="flex flex-col gap-1 w-full">
                {secondaryItems.map((item) => renderNavButton(item, false))}
              </nav>
            </>
          )}
        </div>

        {/* Bottom User Profile & Quick Actions Footer */}
        {footerSlot && (
          <div className="w-full pt-2 border-t border-gray-200/70 dark:border-white/[0.06]">
            {footerSlot(isExpanded)}
          </div>
        )}
      </motion.aside>
    </div>
  );
}

/* ============================================================================
 * 9. @beui/expandable-tabs (Mobile Bottom Navigation Bar for Small Screens)
 * Official Expandable Tabs with dynamic label width measurement & spring pills
 * ============================================================================ */

const MOBILE_TAB_SPRING = {
  type: "spring" as const,
  duration: 0.45,
  bounce: 0.05,
};

const MOBILE_LABEL_OPEN = {
  opacity: { duration: 0.2, delay: 0.08 },
  x: { type: "spring" as const, duration: 0.35, bounce: 0.05, delay: 0.04 },
};

const MOBILE_LABEL_CLOSE = {
  opacity: { duration: 0.12 },
  x: { duration: 0.15 },
};

export interface BeUIMobileTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badgeCount?: number;
  alertDot?: boolean;
  isSpecialLime?: boolean;
}

export interface BeUIMobileExpandableTabsProps {
  items: BeUIMobileTabItem[];
  trailingAction?: React.ReactNode;
  className?: string;
}

export function BeUIMobileExpandableTabs({
  items,
  trailingAction,
  className,
}: BeUIMobileExpandableTabsProps) {
  return (
    <nav
      aria-label="Navegación móvil expandible"
      className={cn(
        "fixed bottom-3 inset-x-2.5 sm:inset-x-4 z-40 md:hidden bg-white/95 dark:bg-[#16171a]/95 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 rounded-full px-1.5 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.75)] flex items-center justify-between gap-0.5 overflow-hidden select-none",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.active;

        return (
          <motion.button
            key={item.id}
            layout
            type="button"
            onClick={item.onClick}
            transition={MOBILE_TAB_SPRING}
            title={item.label}
            className={cn(
              "relative flex h-9 sm:h-10 items-center justify-center overflow-hidden rounded-full cursor-pointer select-none transition-colors duration-200",
              isActive
                ? item.isSpecialLime
                  ? "shrink-0 px-2.5 sm:px-3.5 gap-1.5 bg-[#ccff00] text-gray-950 font-bold shadow-[0_0_14px_rgba(204,255,0,0.35)]"
                  : "shrink-0 px-2.5 sm:px-3.5 gap-1.5 bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-bold shadow-md"
                : "flex-1 min-w-[24px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <motion.span layout="position" className="relative flex items-center justify-center shrink-0">
              {item.icon}
              {!isActive && item.alertDot && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white dark:ring-[#16171a]" />
              )}
              {!isActive && !item.alertDot && item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[13px] h-3.5 px-0.5 rounded-full bg-[#8c9276] dark:bg-[#ccff00] text-white dark:text-gray-950 text-[8px] font-black flex items-center justify-center">
                  {item.badgeCount > 99 ? "99+" : item.badgeCount}
                </span>
              )}
            </motion.span>

            <AnimatePresence initial={false}>
              {isActive && (
                <motion.span
                  key={`${item.id}-label`}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={MOBILE_TAB_SPRING}
                  className="overflow-hidden whitespace-nowrap text-[11px] sm:text-xs font-bold tracking-tight"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}

      {trailingAction && (
        <div className="flex-1 min-w-[24px] flex items-center justify-center shrink-0">
          {trailingAction}
        </div>
      )}
    </nav>
  );
}

/* ============================================================================
 * 10. @beui/animated-badge (Official Animated Badge for 3-State Order Transitions)
 * Source: https://beui.dev/r/animated-badge.json (`components/motion/animated-badge.tsx`)
 * ============================================================================ */

export type AnimatedBadgeStatus =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "loading";

export type AnimatedBadgeSize = "sm" | "md";

export interface BeUIAnimatedBadgeProps {
  status?: AnimatedBadgeStatus;
  size?: AnimatedBadgeSize;
  children?: ReactNode;
  icon?: ReactNode;
  showIcon?: boolean;
  pulse?: boolean;
  contentKey?: string | number;
  className?: string;
}

const ANIMATED_BADGE_STATUS_CLASS: Record<AnimatedBadgeStatus, string> = {
  neutral:
    "border-gray-200 dark:border-white/15 bg-gray-100/90 dark:bg-white/10 text-gray-700 dark:text-gray-300",
  info: "border-blue-500/35 bg-blue-500/12 text-blue-700 dark:text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.12)]",
  success:
    "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.14)]",
  warning:
    "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.14)]",
  danger: "border-rose-500/35 bg-rose-500/12 text-rose-700 dark:text-rose-400",
  loading: "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:text-amber-400",
};

const ANIMATED_BADGE_SIZE_CLASS: Record<AnimatedBadgeSize, string> = {
  sm: "h-6 gap-1.5 px-2.5 text-[11px]",
  md: "h-7 gap-2 px-3 text-xs",
};

const BADGE_ICON_ROLL_VARIANTS: Variants = {
  initial: {
    opacity: 0.72,
    y: "80%",
    scale: 0.92,
    rotate: -8,
    filter: "blur(6px)",
  },
  animate: {
    opacity: 1,
    y: "0%",
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    transition: {
      y: { type: "spring", stiffness: 210, damping: 24, mass: 0.85 },
      scale: { type: "spring", stiffness: 250, damping: 24, mass: 0.75 },
      rotate: { duration: 0.28, ease: EASE_OUT },
      opacity: { duration: 0.28, ease: EASE_OUT },
      filter: { duration: 0.42, ease: EASE_OUT },
    },
  },
  exit: {
    opacity: 0.5,
    y: "-80%",
    scale: 0.96,
    rotate: 8,
    filter: "blur(6px)",
    transition: { duration: 0.22, ease: EASE_OUT },
  },
};

const BADGE_TEXT_ROLL_VARIANTS: Variants = {
  initial: { opacity: 0.76, y: "85%", filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: "0%",
    filter: "blur(0px)",
    transition: {
      y: { type: "spring", stiffness: 210, damping: 24, mass: 0.85 },
      opacity: { duration: 0.3, ease: EASE_OUT },
      filter: { duration: 0.42, ease: EASE_OUT },
    },
  },
  exit: {
    opacity: 0.5,
    y: "-85%",
    filter: "blur(6px)",
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

export function BeUIAnimatedBadge({
  status = "neutral",
  size = "sm",
  children,
  icon,
  showIcon = true,
  pulse = false,
  contentKey,
  className,
}: BeUIAnimatedBadgeProps) {
  const resolvedContentKey =
    contentKey ??
    (typeof children === "string" || typeof children === "number"
      ? children
      : status);

  return (
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.7 }}
      className={cn(
        "relative inline-flex shrink-0 items-center overflow-hidden whitespace-nowrap rounded-full border font-semibold tabular-nums select-none",
        "transition-colors duration-300",
        ANIMATED_BADGE_STATUS_CLASS[status],
        ANIMATED_BADGE_SIZE_CLASS[size],
        className
      )}
    >
      {pulse && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-current opacity-10"
          animate={{ scale: [0.94, 1.08, 0.94], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {showIcon && (
        <span className="relative z-10 inline-flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={String(resolvedContentKey)}
              aria-hidden
              data-badge-icon
              variants={BADGE_ICON_ROLL_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="inline-flex items-center justify-center will-change-transform"
            >
              {icon ?? (
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    status === "success"
                      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                      : status === "info"
                      ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                      : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                  )}
                />
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
      {children != null && (
        <span className="relative z-10 inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={String(resolvedContentKey)}
              data-badge-label
              variants={BADGE_TEXT_ROLL_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="inline-block will-change-transform"
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </motion.span>
  );
}

/* ============================================================================
 * 11. @beui/popover (Official Gooey Liquid-Neck Popover)
 * Source: https://beui.dev/r/popover.json (`components/motion/popover.tsx`)
 * The panel oozes out of the trigger through an SVG goo filter with a liquid neck.
 * ============================================================================ */

interface PopoverRect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

interface PopoverGeo {
  layerW: number;
  layerH: number;
  left: number;
  top: number;
  trigger: PopoverRect;
  panel: PopoverRect;
}

function buildPopoverGeo(
  tW: number,
  tH: number,
  cW: number,
  cH: number,
  side: "top" | "bottom",
  align: "start" | "center" | "end",
  gap: number,
  panelRadius: number
): PopoverGeo {
  const py = side === "bottom" ? tH + gap : -(gap + cH);
  const px = align === "start" ? 0 : align === "end" ? tW - cW : (tW - cW) / 2;

  const left = Math.min(0, px);
  const top = Math.min(0, py);
  const layerW = Math.max(tW, px + cW) - left;
  const layerH = Math.max(tH, py + cH) - top;
  const triggerRadius = Math.min(tH / 2, panelRadius);

  return {
    layerW,
    layerH,
    left,
    top,
    trigger: { x: -left, y: -top, w: tW, h: tH, r: triggerRadius },
    panel: { x: px - left, y: py - top, w: cW, h: cH, r: panelRadius },
  };
}

function popoverInsetFor(rect: PopoverRect, layerW: number, layerH: number) {
  const top = Math.max(0, rect.y);
  const right = Math.max(0, layerW - (rect.x + rect.w));
  const bottom = Math.max(0, layerH - (rect.y + rect.h));
  const left = Math.max(0, rect.x);
  return `inset(${top.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${left.toFixed(1)}px round ${rect.r.toFixed(1)}px)`;
}

function popoverRoundedRectPath(rect: PopoverRect) {
  const radius = Math.max(0, Math.min(rect.r, rect.w / 2, rect.h / 2));
  const n = (value: number) => value.toFixed(2);
  const x1 = rect.x;
  const y1 = rect.y;
  const x2 = rect.x + rect.w;
  const y2 = rect.y + rect.h;
  const arc = `A${n(radius)} ${n(radius)} 0 0 1`;

  return (
    `M${n(x1 + radius)} ${n(y1)}` +
    `H${n(x2 - radius)}${arc} ${n(x2)} ${n(y1 + radius)}` +
    `V${n(y2 - radius)}${arc} ${n(x2 - radius)} ${n(y2)}` +
    `H${n(x1 + radius)}${arc} ${n(x1)} ${n(y2 - radius)}` +
    `V${n(y1 + radius)}${arc} ${n(x1 + radius)} ${n(y1)}Z`
  );
}

function popoverTriggerCutout(geo: PopoverGeo) {
  const layer = { x: 0, y: 0, w: geo.layerW, h: geo.layerH, r: 0 };
  return `path(evenodd, "${popoverRoundedRectPath(layer)} ${popoverRoundedRectPath(geo.trigger)}")`;
}

export interface BeUIPopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  panelRadius?: number;
  gooStrength?: number;
  className?: string;
  panelClassName?: string;
}

export function BeUIPopover({
  open: controlledOpen,
  onOpenChange,
  trigger,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 12,
  panelRadius = 18,
  gooStrength = 7,
  className,
  panelClassName,
}: BeUIPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const gooId = `beui-popover-goo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const blobRef = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef<HTMLDivElement | null>(null);

  const [portalReady, setPortalReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [layout, setLayout] = useState<{
    trigger: { left: number; top: number; width: number; height: number };
    content: { width: number; height: number };
  } | null>(null);
  const [resolvedSide, setResolvedSide] = useState<"top" | "bottom">(side);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const measureLayout = useCallback(() => {
    const trig = triggerRef.current;
    const cont = contentRef.current;
    if (!trig || !cont) return;
    const rect = trig.getBoundingClientRect();
    const cW = cont.offsetWidth || 190;
    const cH = cont.offsetHeight || 136;

    // Smart viewport flip if near bottom of screen
    const spaceBelow = typeof window !== "undefined" ? window.innerHeight - rect.bottom : 300;
    const nextSide = side === "bottom" && spaceBelow < cH + 24 ? "top" : side;
    setResolvedSide(nextSide);

    setLayout({
      trigger: {
        left: rect.left,
        top: rect.top,
        width: rect.width || 110,
        height: rect.height || 28,
      },
      content: {
        width: cW,
        height: cH,
      },
    });
  }, [side]);

  useLayoutEffect(() => {
    if (!portalReady) return;
    measureLayout();
    if (!open && progress === 0) return;
    window.addEventListener("scroll", measureLayout, true);
    window.addEventListener("resize", measureLayout);
    return () => {
      window.removeEventListener("scroll", measureLayout, true);
      window.removeEventListener("resize", measureLayout);
    };
  }, [portalReady, open, progress, measureLayout]);

  // Spring morph animation (GOO_OPEN_SPRING / GOO_CLOSE_SPRING)
  useEffect(() => {
    let raf = 0;
    const startVal = progress;
    const targetVal = open ? 1 : 0;
    if (Math.abs(targetVal - startVal) < 0.001) return;

    const durationMs = open ? 290 : 210;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Spring overshoot easing matching GOO_OPEN_SPRING (bounce: 0.15)
      const eased = open
        ? 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 0.85)
        : 1 - Math.pow(1 - t, 2.6);
      const nextP = startVal + (targetVal - startVal) * Math.max(0, Math.min(1.04, eased));
      setProgress(t >= 1 ? targetVal : nextP);
      if (t < 1) {
        raf = window.requestAnimationFrame(step);
      }
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Light-dismiss on outside pointerdown or Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [open, setOpen]);

  const geo = useMemo(
    () =>
      buildPopoverGeo(
        layout?.trigger.width ?? 110,
        layout?.trigger.height ?? 28,
        layout?.content.width ?? 190,
        layout?.content.height ?? 136,
        resolvedSide,
        align,
        sideOffset,
        panelRadius
      ),
    [layout, resolvedSide, align, sideOffset, panelRadius]
  );

  const clampedP = Math.max(0, Math.min(1, progress));
  const currentRect: PopoverRect = {
    x: geo.trigger.x + (geo.panel.x - geo.trigger.x) * clampedP,
    y: geo.trigger.y + (geo.panel.y - geo.trigger.y) * clampedP,
    w: geo.trigger.w + (geo.panel.w - geo.trigger.w) * clampedP,
    h: geo.trigger.h + (geo.panel.h - geo.trigger.h) * clampedP,
    r: geo.trigger.r + (geo.panel.r - geo.trigger.r) * clampedP,
  };
  const currentClip = popoverInsetFor(currentRect, geo.layerW, geo.layerH);

  return (
    <div
      ref={triggerRef}
      onClick={(e) => {
        e.stopPropagation();
        measureLayout();
        setOpen(!open);
      }}
      className={cn("relative inline-flex items-center isolate cursor-pointer", className)}
    >
      {trigger}

      {portalReady &&
        (open || progress > 0.01) &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-beui-popover-portal=""
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-none fixed left-0 top-0 z-[9999] isolate size-0"
            style={{
              visibility: layout ? "visible" : "hidden",
              transform: `translate3d(${layout?.trigger.left ?? 0}px, ${layout?.trigger.top ?? 0}px, 0)`,
            }}
          >
            {/* Official @beui/popover SVG Goo Filter */}
            <svg aria-hidden width="0" height="0" className="absolute">
              <defs>
                <filter id={gooId} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation={gooStrength} result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                    result="goo"
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
              </defs>
            </svg>

            {/* Goo Body: Static Trigger Pill + Morphing Liquid Neck Blob */}
            <div
              aria-hidden
              className="pointer-events-none absolute z-[-1]"
              style={{
                left: geo.left,
                top: geo.top,
                width: geo.layerW,
                height: geo.layerH,
                filter: `url(#${gooId})`,
                clipPath: popoverTriggerCutout(geo),
              }}
            >
              <div
                className="absolute bg-white dark:bg-[#1e1e22] shadow-lg"
                style={{
                  left: geo.trigger.x,
                  top: geo.trigger.y,
                  width: geo.trigger.w,
                  height: geo.trigger.h,
                  borderRadius: geo.trigger.r,
                }}
              />
              <div
                ref={blobRef}
                className="absolute inset-0 bg-white dark:bg-[#1e1e22] shadow-2xl border border-gray-200/80 dark:border-white/15"
                style={{
                  clipPath: currentClip,
                }}
              />
            </div>

            {/* Clipped Interactive Panel Content */}
            <div
              className="pointer-events-none absolute z-10"
              style={{
                left: geo.left,
                top: geo.top,
                width: geo.layerW,
                height: geo.layerH,
              }}
            >
              <div
                ref={clipRef}
                className="absolute inset-0"
                style={{
                  clipPath: currentClip,
                  pointerEvents: open ? "auto" : "none",
                }}
              >
                <div
                  ref={contentRef}
                  role="dialog"
                  style={{
                    position: "absolute",
                    left: geo.panel.x,
                    top: geo.panel.y,
                  }}
                  className={cn(
                    "w-max min-w-[192px] rounded-[18px] bg-white/95 dark:bg-[#1e1e22]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-gray-900 dark:text-gray-100 outline-none",
                    panelClassName
                  )}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/* ============================================================================
 * 12. BeUIOrderStatusSelector (Combines @beui/popover + @beui/animated-badge)
 * Used in both Vista General (`OverviewTab`) & Historial Completo (`OrdersTab`)
 * ============================================================================ */

export type LuminaOrderStatus = "Procesando" | "Enviado" | "Entregado";

const ORDER_STATUS_META: Record<
  LuminaOrderStatus,
  {
    badgeStatus: AnimatedBadgeStatus;
    label: string;
    subtitle: string;
    dotColor: string;
  }
> = {
  Procesando: {
    badgeStatus: "warning",
    label: "Procesando",
    subtitle: "En preparación / taller",
    dotColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  },
  Enviado: {
    badgeStatus: "info",
    label: "Enviado",
    subtitle: "En tránsito a destino",
    dotColor: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
  },
  Entregado: {
    badgeStatus: "success",
    label: "Entregado",
    subtitle: "Recibido por el cliente",
    dotColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  },
};

export interface OrderTrackingDispatchMeta {
  trackingNumber: string;
  trackingUrl: string;
  carrierName?: string;
}

const CARRIER_PRESETS = [
  {
    name: "Servientrega",
    prefix: "SRV",
    url: "https://www.servientrega.com.ec/Tracking",
  },
  {
    name: "Urbano Express",
    prefix: "URB",
    url: "https://www.urbano.com.ec/",
  },
  {
    name: "LaarCourier",
    prefix: "LAR",
    url: "https://www.laarcourier.com/",
  },
  {
    name: "Tramaco Express",
    prefix: "TRM",
    url: "https://www.tramaco.com.ec/",
  },
  {
    name: "DHL Express",
    prefix: "DHL",
    url: "https://www.dhl.com/ec-es/home/rastreo.html",
  },
  {
    name: "FedEx",
    prefix: "FDX",
    url: "https://www.fedex.com/es-ec/tracking.html",
  },
];

export interface BeUIOrderStatusSelectorProps {
  status: LuminaOrderStatus;
  isAdmin: boolean;
  onUpdateStatus?: (
    nextStatus: LuminaOrderStatus,
    trackingInfo?: OrderTrackingDispatchMeta
  ) => void;
  initialTrackingNumber?: string;
  initialTrackingUrl?: string;
  initialCarrierName?: string;
  orderId?: string;
  size?: AnimatedBadgeSize;
  align?: "start" | "center" | "end";
}

export function BeUIOrderStatusSelector({
  status,
  isAdmin,
  onUpdateStatus,
  initialTrackingNumber = "",
  initialTrackingUrl = "",
  initialCarrierName = "",
  orderId,
  size = "sm",
  align = "center",
}: BeUIOrderStatusSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [carrierName, setCarrierName] = useState(initialCarrierName || "Servientrega");
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(
    initialTrackingUrl || "https://www.servientrega.com.ec/Tracking"
  );
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrackingNumber) setTrackingNumber(initialTrackingNumber);
    if (initialTrackingUrl) setTrackingUrl(initialTrackingUrl);
    if (initialCarrierName) setCarrierName(initialCarrierName);
  }, [initialTrackingNumber, initialTrackingUrl, initialCarrierName]);

  const currentMeta = ORDER_STATUS_META[status] || ORDER_STATUS_META.Procesando;

  if (!isAdmin || !onUpdateStatus) {
    return (
      <BeUIAnimatedBadge
        status={currentMeta.badgeStatus}
        size={size}
        pulse={status === "Procesando"}
        contentKey={status}
      >
        {status}
      </BeUIAnimatedBadge>
    );
  }

  const handleSelectStatusOption = (opt: LuminaOrderStatus) => {
    playStepperTickSound("up");
    setPopoverOpen(false);
    if (opt === status && opt !== "Enviado") return;

    // When transitioning to "Enviado", require Carrier Tracking Code + Carrier URL
    if (opt === "Enviado") {
      setTrackingError(null);
      if (!trackingNumber) {
        const preset = CARRIER_PRESETS.find((c) => c.name === carrierName) || CARRIER_PRESETS[0];
        setCarrierName(preset.name);
        setTrackingUrl(trackingUrl || preset.url);
      }
      setTrackingModalOpen(true);
      return;
    }

    onUpdateStatus(opt);
  };

  const handleConfirmShippedDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanCode = trackingNumber.trim().toUpperCase();
    let cleanUrl = trackingUrl.trim();

    if (!cleanCode || cleanCode.length < 4) {
      setTrackingError("Ingresa el código de rastreo (guía) asignado por la transportadora.");
      return;
    }
    if (!cleanUrl) {
      setTrackingError("Ingresa el enlace web de la transportadora donde el cliente rastreará su guía.");
      return;
    }
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setTrackingError(null);
    setTrackingModalOpen(false);
    onUpdateStatus("Enviado", {
      trackingNumber: cleanCode,
      trackingUrl: cleanUrl,
      carrierName: carrierName.trim() || "Transportadora",
    });
  };

  return (
    <>
      <BeUIPopover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        align={align}
        sideOffset={10}
        panelRadius={18}
        gooStrength={7}
        trigger={
          <div className="group inline-flex items-center">
            <BeUIAnimatedBadge
              status={currentMeta.badgeStatus}
              size={size}
              pulse={status === "Procesando"}
              contentKey={status}
              className="pr-2.5 cursor-pointer hover:brightness-95 dark:hover:brightness-110 active:scale-95 transition-transform"
            >
              <span className="inline-flex items-center gap-1.5">
                <span>{status}</span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 opacity-70 transition-transform duration-300",
                    popoverOpen && "rotate-180"
                  )}
                />
              </span>
            </BeUIAnimatedBadge>
          </div>
        }
      >
        <div className="w-[210px] space-y-1">
          <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-[9.5px] font-mono uppercase tracking-widest text-gray-400 font-bold">
              Estado de Envío
            </span>
          </div>
          {(["Procesando", "Enviado", "Entregado"] as const).map((opt) => {
            const meta = ORDER_STATUS_META[opt];
            const isSelected = status === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectStatusOption(opt);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer group",
                  isSelected
                    ? "bg-gray-900/5 dark:bg-white/10 font-bold"
                    : "hover:bg-gray-100/80 dark:hover:bg-white/[0.06]"
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <BeUIAnimatedBadge
                    status={meta.badgeStatus}
                    size="sm"
                    pulse={opt === "Procesando"}
                    contentKey={opt}
                  >
                    {opt}
                  </BeUIAnimatedBadge>
                  {opt === "Enviado" && (
                    <span className="text-[9.5px] text-gray-400 dark:text-gray-500 pl-1">
                      Solicita guía y enlace
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-5 h-5 rounded-full bg-gray-900 dark:bg-[#ccff00] text-white dark:text-gray-950 flex items-center justify-center shadow-xs"
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </motion.span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </BeUIPopover>

      {/* Admin Carrier Tracking Code & URL Modal when changing status to "Enviado" */}
      {typeof document !== "undefined" &&
        createPortal(
          <BeUICenterMorphModal
            open={trackingModalOpen}
            onOpenChange={setTrackingModalOpen}
            className="max-w-lg"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/10 rounded-[2rem] shadow-[0_28px_80px_rgba(0,0,0,0.4)] overflow-hidden p-6 sm:p-7 text-left"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/10">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-1.5">
                    Despacho Logístico · Estado Enviado
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white tracking-tight">
                    Asignar Código de Rastreo y Transportadora
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {orderId ? `Orden #${orderId} · ` : ""}Estos datos actualizarán la tarjeta en Google/Apple Wallet del cliente y habilitarán el rastreo directo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setTrackingModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 border border-black/[0.06] dark:border-white/15 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmShippedDispatch} className="mt-5 space-y-4">
                {/* Carrier Presets */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    1. Selecciona o escribe la Transportadora
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {CARRIER_PRESETS.map((preset) => {
                      const active = carrierName.toLowerCase() === preset.name.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setCarrierName(preset.name);
                            setTrackingUrl(preset.url);
                            if (!trackingNumber) {
                              setTrackingNumber(
                                `${preset.prefix}-${Math.floor(1000000 + Math.random() * 9000000)}`
                              );
                            }
                          }}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border",
                            active
                              ? "bg-gray-950 dark:bg-[#ccff00] text-white dark:text-gray-950 border-gray-950 dark:border-[#ccff00] shadow-xs"
                              : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:border-gray-400"
                          )}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="Nombre de la transportadora (ej. Servientrega)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50/70 dark:bg-white/[0.04] text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8c9276]"
                  />
                </div>

                {/* Tracking Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      2. Código de Rastreo (Guía de Envío) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const preset =
                          CARRIER_PRESETS.find(
                            (c) => c.name.toLowerCase() === carrierName.toLowerCase()
                          ) || CARRIER_PRESETS[0];
                        setTrackingNumber(
                          `${preset.prefix}-${Math.floor(1000000 + Math.random() * 9000000)}`
                        );
                      }}
                      className="text-[10px] font-bold text-[#8c9276] dark:text-[#ccff00] hover:underline cursor-pointer"
                    >
                      Autogenerar guía sugerida
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                    placeholder="Ej: SRV-84920143"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#141417] text-sm font-mono font-bold text-gray-900 dark:text-white uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Carrier Tracking URL */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    3. Enlace Web de la Transportadora *
                  </label>
                  <input
                    type="url"
                    required
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://www.servientrega.com.ec/Tracking"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#141417] text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-1">
                    Al hacer clic en el Tag del código de rastreo en el Resumen de Pedido o en su tarjeta Wallet, el cliente será redirigido a este enlace.
                  </p>
                </div>

                {trackingError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs font-semibold text-red-600 dark:text-red-300">
                    {trackingError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setTrackingModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Confirmar Envío y Notificar Wallet</span>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            </div>
          </BeUICenterMorphModal>,
          document.body
        )}
    </>
  );
}

/* ============================================================================
 * 13. @beui/animated-cta-button (Official Animated CTA Button for Shopping Bag)
 * Source: https://beui.dev (`Animated CTA Buttons`)
 * ============================================================================ */

export interface BeUIAnimatedCtaButtonProps {
  label: string;
  subLabel?: string;
  priceBadge?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BeUIAnimatedCtaButton({
  label,
  subLabel,
  priceBadge,
  onClick,
  disabled = false,
  className,
}: BeUIAnimatedCtaButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.985 }}
      transition={SPRING_PRESS}
      className={cn(
        "group relative w-full h-[60px] rounded-[22px] p-1.5 bg-gray-950 dark:bg-[#16171a] text-white border border-gray-900 dark:border-[#ccff00]/35 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.35)] dark:shadow-[0_16px_44px_-10px_rgba(204,255,0,0.18)] overflow-hidden cursor-pointer select-none flex items-center justify-between",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Expanding / Morphing Lime/Olive Capsule Background from @beui/animated-cta-button */}
      <motion.div
        initial={false}
        animate={{
          width: hovered ? "calc(100% - 12px)" : "52px",
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          mass: 0.7,
        }}
        className="absolute right-1.5 top-1.5 bottom-1.5 rounded-[17px] bg-gradient-to-r from-[#8c9276] via-[#9da485] to-[#b5bd9b] dark:from-[#ccff00] dark:via-[#d8ff33] dark:to-[#b8e600] shadow-[0_4px_20px_rgba(140,146,118,0.45)] dark:shadow-[0_4px_24px_rgba(204,255,0,0.4)] z-0"
      />

      {/* Ambient Shimmer Sweep */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.10),transparent_60%)] z-0" />

      {/* Left / Main Content with Rolling Dual-Layer Typography */}
      <div className="relative z-10 flex items-center justify-between flex-1 pl-4 pr-14 min-w-0">
        <div className="flex flex-col items-start text-left min-w-0">
          {subLabel && (
            <span
              className={cn(
                "text-[9.5px] font-extrabold uppercase tracking-[0.2em] transition-colors duration-300",
                hovered
                  ? "text-white/90 dark:text-gray-950/75"
                  : "text-[#b5bd9b] dark:text-[#ccff00]"
              )}
            >
              {subLabel}
            </span>
          )}
          <div className="relative h-5 overflow-hidden flex items-center">
            <motion.span
              animate={{ y: hovered ? "-100%" : "0%", opacity: hovered ? 0 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="block text-sm sm:text-[15px] font-extrabold tracking-tight text-white"
            >
              {label}
            </motion.span>
            <motion.span
              animate={{ y: hovered ? "0%" : "100%", opacity: hovered ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute inset-0 flex items-center text-sm sm:text-[15px] font-extrabold tracking-tight text-white dark:text-gray-950"
            >
              {label}
            </motion.span>
          </div>
        </div>

        {priceBadge && (
          <motion.span
            animate={{
              scale: hovered ? 1.03 : 1,
            }}
            transition={SPRING_SWAP}
            className={cn(
              "ml-3 px-3 py-1 rounded-xl text-xs sm:text-sm font-black tracking-tight border transition-colors duration-300 shrink-0",
              hovered
                ? "bg-black/20 dark:bg-gray-950/15 text-white dark:text-gray-950 border-white/25 dark:border-gray-950/20"
                : "bg-white/10 dark:bg-white/[0.07] text-white dark:text-[#ccff00] border-white/10"
            )}
          >
            {priceBadge}
          </motion.span>
        )}
      </div>

      {/* Right Sliding Arrow Capsule */}
      <div className="relative z-10 w-[48px] h-[48px] rounded-[16px] flex items-center justify-center shrink-0 text-white dark:text-gray-950">
        <div className="relative w-5 h-5 overflow-hidden flex items-center justify-center">
          <motion.svg
            animate={{
              x: hovered ? 24 : 0,
              opacity: hovered ? 0 : 1,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </motion.svg>
          <motion.svg
            animate={{
              x: hovered ? 0 : -24,
              opacity: hovered ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </motion.svg>
        </div>
      </div>
    </motion.button>
  );
}






