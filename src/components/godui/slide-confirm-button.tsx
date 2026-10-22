"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ThinkingOrb } from "thinking-orbs";

export type SlideConfirmVariant = "default" | "destructive";
export type SlideConfirmSize = "sm" | "md" | "lg";
export type SlideConfirmStatus = "idle" | "loading" | "confirmed";

export type SlideConfirmButtonProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> & {
  /**
   * Fires once the thumb is dragged past the threshold. May be async; while the
   * returned promise is pending the thumb shows a spinner (`loading` status).
   * If the promise rejects the control returns to `idle` so the action can be
   * retried.
   */
  onConfirm?: () => void | Promise<unknown>;
  variant?: SlideConfirmVariant;
  size?: SlideConfirmSize;
  /** Fraction of the track (0–1) the thumb must pass to confirm. Default `0.9`. */
  threshold?: number;
  /** Track label. Default `"Slide to confirm"`. */
  label?: React.ReactNode;
  /** Label shown while an async `onConfirm` is pending. Default `"Working…"`. */
  loadingLabel?: React.ReactNode;
  /** Label shown after confirming. Default `"Confirmed"`. */
  confirmedLabel?: React.ReactNode;
  /** Duration in ms to display the confirmed state before triggering onConfirmed. Default `1000`. */
  confirmedDurationMs?: number;
  /** Callback fired after the confirmed state has been displayed for confirmedDurationMs. */
  onConfirmed?: () => void;
  disabled?: boolean;
};

const TRACK_BASE =
  "relative isolate flex select-none items-center overflow-hidden rounded-full border [touch-action:none] [transition:opacity_200ms_ease]";

const trackVariant: Record<SlideConfirmVariant, string> = {
  default: "border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.08]",
  destructive: "border-destructive/30 bg-destructive/10",
};

const fillVariant: Record<SlideConfirmVariant, string> = {
  default: "bg-[#8c9276]/25 dark:bg-[#8c9276]/35",
  destructive: "bg-destructive/25",
};

const thumbVariant: Record<SlideConfirmVariant, string> = {
  default: "bg-[#8c9276] text-white shadow-md hover:bg-[#7b8166]",
  destructive: "bg-destructive text-white",
};

const sizeMap: Record<
  SlideConfirmSize,
  { track: string; thumb: number; pad: number; text: string }
> = {
  sm: { track: "h-10 w-56", thumb: 32, pad: 4, text: "text-xs font-semibold" },
  md: { track: "h-12 w-full", thumb: 40, pad: 4, text: "text-sm font-semibold" },
  lg: { track: "h-14 w-full", thumb: 48, pad: 5, text: "text-base font-semibold" },
};

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="size-5"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const SlideConfirmButton = React.forwardRef<
  HTMLDivElement,
  SlideConfirmButtonProps
>(
  (
    {
      onConfirm,
      onConfirmed,
      confirmedDurationMs = 1000,
      variant = "default",
      size = "md",
      threshold = 0.85,
      label = "Slide to confirm",
      loadingLabel = "Working…",
      confirmedLabel = "Confirmed",
      disabled = false,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const reduce = useReducedMotion() ?? false;
    const dims = sizeMap[size];
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [maxX, setMaxX] = React.useState(0);
    const [status, setStatus] = React.useState<SlideConfirmStatus>("idle");
    const statusRef = React.useRef(status);
    statusRef.current = status;

    const mounted = React.useRef(true);
    React.useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    const x = useMotionValue(0);
    const labelOpacity = useTransform(x, [0, Math.max(1, maxX * 0.6)], [1, 0]);
    // Fill is a rounded pill the same height as the thumb, trailing it from the left.
    const fillWidth = useTransform(x, (v) => v + dims.thumb);

    React.useLayoutEffect(() => {
      const el = trackRef.current;
      if (!el) return;
      const measure = () => {
        const usable = el.clientWidth - dims.thumb - dims.pad * 2;
        setMaxX(Math.max(0, usable));
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [dims.thumb, dims.pad]);

    const settleBack = () => {
      animate(
        x,
        0,
        reduce
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 500, damping: 40 },
      );
    };

    const confirm = async () => {
      animate(x, maxX, { type: "spring", stiffness: 500, damping: 40 });
      let result: unknown;
      try {
        result = onConfirm?.();
      } catch {
        // Synchronous throw — treat like a rejected action and reset.
        setStatus("idle");
        settleBack();
        return;
      }
      // If onConfirm is async, show a spinner in the thumb until it settles.
      if (result && typeof (result as { then?: unknown }).then === "function") {
        setStatus("loading");
        try {
          await result;
        } catch {
          // Action failed — return to idle so it can be retried.
          if (!mounted.current) return;
          setStatus("idle");
          settleBack();
          return;
        }
        if (!mounted.current) return;
      }
      setStatus("confirmed");
      if (onConfirmed) {
        setTimeout(() => {
          if (mounted.current) {
            onConfirmed();
          }
        }, confirmedDurationMs);
      }
    };

    const handleDragEnd = () => {
      if (statusRef.current !== "idle") return;
      if (maxX > 0 && x.get() >= maxX * threshold) confirm();
      else settleBack();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || statusRef.current !== "idle") return;
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        confirm();
      }
    };

    const confirmed = status === "confirmed";
    const loading = status === "loading";
    const busy = confirmed || loading;

    const restingFootprint = dims.thumb + dims.pad * 2;

    return (
      <div
        ref={forwardedRef}
        data-status={status}
        className={cn(
          TRACK_BASE,
          trackVariant[variant],
          dims.track,
          dims.text,
          disabled ? "pointer-events-none opacity-50" : "",
          className
        )}
        {...props}
      >
        <div ref={trackRef} className="absolute inset-0" aria-hidden="true" />

        {/* Fill trailing the thumb — a rounded pill matching the thumb height. */}
        <motion.div
          aria-hidden="true"
          className={cn("absolute rounded-full", fillVariant[variant])}
          style={{
            top: dims.pad,
            bottom: dims.pad,
            left: dims.pad,
            width: fillWidth,
          }}
        />

        {/* Idle label — centered, footprint reserved on both sides. */}
        <motion.span
          style={{
            opacity: busy ? 0 : labelOpacity,
            paddingLeft: restingFootprint,
            paddingRight: restingFootprint,
          }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center whitespace-nowrap font-medium text-gray-700 dark:text-gray-200 tracking-wide select-none"
        >
          {label}
        </motion.span>
        {busy && (
          <span
            style={{
              paddingLeft: restingFootprint,
              paddingRight: restingFootprint,
            }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center whitespace-nowrap font-semibold text-gray-950 dark:text-white tracking-wide select-none"
          >
            {loading ? loadingLabel : confirmedLabel}
          </span>
        )}

        {/* Draggable thumb. */}
        <motion.button
          type="button"
          aria-label={typeof label === "string" ? label : "Slide to confirm"}
          disabled={disabled}
          drag={busy || disabled ? false : "x"}
          dragConstraints={{ left: 0, right: maxX }}
          dragElastic={0.04}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onKeyDown={handleKeyDown}
          style={{ x, width: dims.thumb, height: dims.thumb, margin: dims.pad }}
          className={cn(
            "relative z-20 inline-flex shrink-0 cursor-grab items-center justify-center rounded-full shadow-sm active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c9276]/40",
            thumbVariant[variant]
          )}
        >
          {loading ? (
            <div className="flex items-center justify-center scale-90">
              <ThinkingOrb state="working" size={20} />
            </div>
          ) : confirmed ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-5"
              aria-hidden="true"
            >
              <motion.path
                d="M5 12.5 10 17.5 19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            </svg>
          ) : (
            <ArrowIcon />
          )}
        </motion.button>
      </div>
    );
  },
);
SlideConfirmButton.displayName = "SlideConfirmButton";

export { SlideConfirmButton };
