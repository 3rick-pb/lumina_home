"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import {
  resolvePreset,
  scaleCounts,
  scaleRadii,
  MODE_FRAMES,
  type OrbState,
} from "thinking-orbs";

// Ensure 60-144 FPS animations run even if OS prefers-reduced-motion is enabled (e.g., WinterOS)
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const origMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query: string): MediaQueryList => {
    if (query && query.includes("prefers-reduced-motion")) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList;
    }
    return origMatchMedia(query);
  };
}

/**
 * Giant High-Framerate (60-144 FPS) Thinking Orb Canvas
 * Renders the 3D dotted sphere from `thinking-orbs` at large scale (e.g. 400x400px)
 * with an unconditional requestAnimationFrame loop and zero 1-second freezes.
 */
interface FluidGiantThinkingOrbProps {
  size?: number;
  state?: OrbState;
  speed?: number;
  className?: string;
}

export function FluidGiantThinkingOrb({
  size = 420,
  state = "searching",
  speed = 1.15,
  className = "",
}: FluidGiantThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { mode, speed: baseSpeed, opts: presetOpts } = resolvePreset(state, 64);
    const scaledCounts = scaleCounts(presetOpts, 1.35);
    const radiusFactor = Math.max(1, size / 68);
    const opts = scaleRadii(scaledCounts, radiusFactor);
    const frameFn = MODE_FRAMES[mode];
    const effSpeed = baseSpeed * speed;

    let rafId = 0;
    let active = true;
    const startTime = performance.now();

    const renderLoop = (now: number) => {
      if (!active) return;
      const tSec = ((now - startTime) / 1000) * effSpeed;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const frameData = frameFn(size, tSec, opts);

      // Paint subtle connecting lines if mode produces them
      if (frameData.lines && frameData.lines.length > 0) {
        for (const l of frameData.lines) {
          const alpha = l.a ?? 1;
          const w = Math.min(1, Math.max(0, l.white));
          const g = Math.round((1 - w * 0.65) * 255);
          ctx.strokeStyle = `rgba(${g},${g},${g},${alpha * 0.85})`;
          ctx.lineWidth = Math.max(1, l.w * (size / 140));
          ctx.beginPath();
          ctx.moveTo(l.x1, l.y1);
          ctx.lineTo(l.x2, l.y2);
          ctx.stroke();
        }
      }

      // Paint 3D depth-sorted dots
      for (const d of frameData.dots) {
        const alpha = d.a ?? 1;
        const w = Math.min(1, Math.max(0, d.white));
        const brightness = Math.round((1 - w * 0.72) * 255);
        ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, Math.max(1.1, d.r), 0, Math.PI * 2);
        ctx.fill();
      }

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
      aria-label="Thinking Orb Animation"
      className={`block select-none pointer-events-none ${className}`}
      style={{ width: size, height: size, maxWidth: "78vw", maxHeight: "78vw" }}
    />
  );
}

/**
 * beUI Adaptive Stepper (Exact match to Video Referencia.mp4 @ 00:19)
 * Circular '-' and '+' buttons flanking a spring-animated capsule whose digits roll vertically with motion blur.
 */
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
  max = 999,
  disabled = false,
  disableIncrement = false,
  disableDecrement = false,
  onIncrement,
  onDecrement,
  size = "md",
  incrementTitle = "Aumentar",
  decrementTitle = "Disminuir",
}: BeUIAdaptiveStepperProps) {
  const prevValueRef = useRef<number>(value);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (value > prevValueRef.current) {
      setDirection(1);
    } else if (value < prevValueRef.current) {
      setDirection(-1);
    }
    prevValueRef.current = value;
  }, [value]);

  const formatted = String(Math.max(0, value));
  const chars = formatted.split("");

  const btnDims =
    size === "sm"
      ? "w-7 h-7"
      : size === "lg"
      ? "w-9 h-9"
      : "w-8 h-8";

  const pillDims =
    size === "sm"
      ? "min-w-[46px] h-7 px-2.5 text-xs"
      : size === "lg"
      ? "min-w-[64px] h-9 px-4 text-sm"
      : "min-w-[54px] h-8 px-3.5 text-xs sm:text-sm";

  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <MotionConfig reducedMotion="never">
      <div className="inline-flex items-center gap-1.5 select-none">
        {/* Left Circular Minus Button */}
        <motion.button
          type="button"
          whileHover={disabled || disableDecrement ? undefined : { scale: 1.06 }}
          whileTap={disabled || disableDecrement ? undefined : { scale: 0.86 }}
          transition={{ type: "spring", stiffness: 540, damping: 24 }}
          disabled={disabled || disableDecrement}
          onClick={(e) => {
            e.stopPropagation();
            if (disabled || disableDecrement) return;
            onDecrement();
          }}
          title={decrementTitle}
          className={`${btnDims} rounded-full flex items-center justify-center border border-gray-200/90 dark:border-white/15 shadow-xs transition-colors cursor-pointer ${
            disabled || disableDecrement
              ? "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-45"
              : "bg-white dark:bg-[#1e1e22] hover:bg-gray-50 dark:hover:bg-[#2a2a30] text-gray-800 dark:text-gray-100"
          }`}
        >
          <Minus className={iconSize} />
        </motion.button>

        {/* Center Adaptive Value Pill with Rolling Digits */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={`${pillDims} rounded-full bg-white dark:bg-[#18181b] border border-gray-200/90 dark:border-white/15 shadow-inner flex items-center justify-center overflow-hidden font-mono font-bold text-gray-950 dark:text-white`}
        >
          <div className="inline-flex items-center justify-center">
            {chars.map((char, idx) => (
              <span
                key={`step-slot-${idx}`}
                className="relative inline-flex justify-center overflow-hidden leading-none"
                style={{ width: "0.64em", height: "1.2em" }}
              >
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.span
                    key={`${idx}-${char}`}
                    custom={direction}
                    initial={{
                      y: direction * 15,
                      opacity: 0,
                      filter: "blur(3px)",
                      scale: 0.85,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      filter: "blur(0px)",
                      scale: 1,
                    }}
                    exit={{
                      y: direction * -15,
                      opacity: 0,
                      filter: "blur(3px)",
                      scale: 0.85,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 520,
                      damping: 28,
                      mass: 0.55,
                    }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                </AnimatePresence>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right Circular Plus Button */}
        <motion.button
          type="button"
          whileHover={disabled || disableIncrement || value >= max ? undefined : { scale: 1.06 }}
          whileTap={disabled || disableIncrement || value >= max ? undefined : { scale: 0.86 }}
          transition={{ type: "spring", stiffness: 540, damping: 24 }}
          disabled={disabled || disableIncrement || value >= max}
          onClick={(e) => {
            e.stopPropagation();
            if (disabled || disableIncrement || value >= max) return;
            onIncrement();
          }}
          title={incrementTitle}
          className={`${btnDims} rounded-full flex items-center justify-center border border-gray-200/90 dark:border-white/15 shadow-xs transition-colors cursor-pointer ${
            disabled || disableIncrement || value >= max
              ? "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-45"
              : "bg-white dark:bg-[#1e1e22] hover:bg-gray-50 dark:hover:bg-[#2a2a30] text-gray-800 dark:text-gray-100"
          }`}
        >
          <Plus className={iconSize} />
        </motion.button>
      </div>
    </MotionConfig>
  );
}

/**
 * beUI Number Animation — Digit Swap (Exact match to Video Referencia.mp4 @ 00:17)
 * Fixed-slot digits that roll on change with controllable direction, stagger, and blur motion.
 */
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
  const prevRef = useRef<number>(amount);
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    if (amount > prevRef.current) setDir(1);
    else if (amount < prevRef.current) setDir(-1);
    prevRef.current = amount;
  }, [amount]);

  const formatted = `${prefix}${amount.toFixed(2)}`;
  const chars = formatted.split("");

  return (
    <MotionConfig reducedMotion="never">
      <span className={`inline-flex items-baseline overflow-hidden ${className}`}>
        {chars.map((ch, i) => {
          const isDigit = /[0-9]/.test(ch);
          if (!isDigit) {
            return (
              <span key={`sep-${i}`} className="inline-block">
                {ch}
              </span>
            );
          }
          return (
            <span
              key={`digit-col-${i}`}
              className="relative inline-flex justify-center overflow-hidden leading-none"
              style={{ width: "0.61em", height: "1.12em" }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={`${i}-${ch}`}
                  initial={{ y: dir * 15, opacity: 0, filter: "blur(2.5px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: dir * -15, opacity: 0, filter: "blur(2.5px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 30,
                    mass: 0.55,
                    delay: i * 0.014,
                  }}
                  className="inline-block"
                >
                  {ch}
                </motion.span>
              </AnimatePresence>
            </span>
          );
        })}
        {suffix && <span className="ml-1">{suffix}</span>}
      </span>
    </MotionConfig>
  );
}

/**
 * beUI Action Swap — Cascade CTA (Exact match to Video Referencia.mp4 @ 00:18)
 * Letter-by-letter slot roll with blur motion when swapping between idle and active states.
 */
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
  const currentText = active ? activeText : idleText;
  const currentIcon = active ? activeIcon : idleIcon;
  const letters = currentText.split("");

  return (
    <MotionConfig reducedMotion="never">
      <span className={`inline-flex items-center justify-center gap-2 ${className}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={active ? "icon-active" : "icon-idle"}
            initial={{ scale: 0.5, opacity: 0, filter: "blur(4px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.5, opacity: 0, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 520, damping: 28 }}
            className="inline-flex items-center shrink-0"
          >
            {currentIcon}
          </motion.span>
        </AnimatePresence>

        <span className="inline-flex items-center overflow-hidden py-0.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {letters.map((char, idx) => (
              <motion.span
                key={`${active ? "act" : "idl"}-${idx}-${char}`}
                initial={{ y: 14, opacity: 0, filter: "blur(3px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -14, opacity: 0, filter: "blur(3px)" }}
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 30,
                  delay: idx * 0.012,
                }}
                className="inline-block whitespace-pre"
              >
                {char}
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
      </span>
    </MotionConfig>
  );
}
