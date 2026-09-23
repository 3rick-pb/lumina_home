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
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

  if (value !== prevValueRef.current) {
    const nextDir = value > prevValueRef.current ? 1 : -1;
    prevValueRef.current = value;
    if (direction !== nextDir) {
      setDirection(nextDir);
    }
  }

  const atMin = disableDecrement || value <= min;
  const atMax = disableIncrement || value >= max;
  const distance = (direction || 1) * 40;

  // Verbatim 216px x 48px internal coordinate system from @beui/adaptive-stepper
  // (https://beui.dev/r/adaptive-stepper.json & Video Referencia.mp4)
  // Scaled cleanly via outer CSS transform so the SVG gooey filter (blur=6, contrast=22,
  // 16px resting gap = 64 - 48) retains 100% original beUI liquid physics.
  const scale = size === "lg" ? 0.84 : size === "sm" ? 0.58 : 0.65;
  const outerW = Math.round(216 * scale);
  const outerH = Math.round(48 * scale);

  const centerGeometry =
    atMin && atMax
      ? { x: 0, width: 216 }
      : atMin
      ? { x: 0, width: 152 }
      : atMax
      ? { x: 64, width: 152 }
      : { x: 64, width: 88 };

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
          {/* 1. LEFT DECREMENT BUTTON (`-`) */}
          <LiquidItem
            x={atMin ? 32 : 0}
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
                setDirection(-1);
                playStepperTickSound("down");
                onDecrement();
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
            x={atMax ? 136 : 168}
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
                setDirection(1);
                playStepperTickSound("up");
                onIncrement();
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
