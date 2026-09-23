"use client";

import React, { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  resolvePreset,
  scaleCounts,
  scaleRadii,
  MODE_FRAMES,
  type OrbState,
} from "thinking-orbs";
import { playStepperTickSound } from "@/lib/soundUtils";

/**
 * Giant High-Framerate (60-144 FPS) Thinking Orb Canvas
 * Supports all 9 `thinking-orbs` states including `state="solving"`, rendered at large scale (e.g. 420x420px).
 */
interface FluidGiantThinkingOrbProps {
  size?: number;
  state?: OrbState;
  speed?: number;
  className?: string;
}

export function FluidGiantThinkingOrb({
  size = 420,
  state = "solving",
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

      for (const d of frameData.dots) {
        const alpha = d.a ?? 1;
        const w = Math.min(1, Math.max(0, d.white));
        const brightness = Math.round((1 - w * 0.72) * 255);
        ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, Math.max(1.15, d.r), 0, Math.PI * 2);
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
      aria-label="Thinking Orb Solving Animation"
      className={`block select-none pointer-events-none ${className}`}
      style={{ width: size, height: size, maxWidth: "78vw", maxHeight: "78vw" }}
    />
  );
}

/**
 * Hardware-accelerated 10-digit vertical odometer wheel (0..9).
 * Uses GPU `translate3d` + spring overshoot `cubic-bezier(0.22, 1.35, 0.36, 1)`
 * so digits visibly roll through intermediate values even when OS reduced-motion is enabled.
 */
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

/**
 * beUI Adaptive Stepper (Physical UX with Odometer Drum, Elastic Recoil & Tactile Sound)
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
  const [pulseState, setPulseState] = useState<"idle" | "up" | "down">("idle");
  const [pressedBtn, setPressedBtn] = useState<"none" | "minus" | "plus">("none");

  const triggerPulse = (dir: "up" | "down") => {
    setPulseState(dir);
    playStepperTickSound(dir);
    setTimeout(() => setPulseState("idle"), 320);
  };

  const formatted = value < 10 ? `0${Math.max(0, value)}` : String(Math.max(0, value));
  const chars = formatted.split("");

  const btnDims =
    size === "sm"
      ? "w-7 h-7"
      : size === "lg"
      ? "w-9 h-9"
      : "w-8 h-8";

  const pillDims =
    size === "sm"
      ? "min-w-[48px] h-7 px-2.5 text-xs"
      : size === "lg"
      ? "min-w-[66px] h-9 px-4 text-sm"
      : "min-w-[56px] h-8 px-3.5 text-xs sm:text-sm";

  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      {/* Left Circular Minus Button */}
      <button
        type="button"
        disabled={disabled || disableDecrement}
        onMouseDown={() => setPressedBtn("minus")}
        onMouseUp={() => setPressedBtn("none")}
        onMouseLeave={() => setPressedBtn("none")}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled || disableDecrement) return;
          triggerPulse("down");
          onDecrement();
        }}
        title={decrementTitle}
        style={{
          transform:
            pressedBtn === "minus"
              ? "scale(0.82)"
              : pulseState === "down"
              ? "scale(0.92)"
              : "scale(1)",
          transition: "transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms ease, border-color 200ms ease",
        }}
        className={`${btnDims} rounded-full flex items-center justify-center border shadow-xs cursor-pointer ${
          disabled || disableDecrement
            ? "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-45"
            : "bg-white dark:bg-[#1e1e22] border-gray-200/90 dark:border-white/15 hover:border-gray-400 dark:hover:border-white/35 hover:bg-gray-50 dark:hover:bg-[#2a2a30] text-gray-800 dark:text-gray-100"
        }`}
      >
        <Minus className={iconSize} />
      </button>

      {/* Center Adaptive Value Pill with Physical Odometer Drum & Recoil */}
      <div
        style={{
          transform:
            pulseState === "up"
              ? "translate3d(0, -2.5px, 0) scale(1.07)"
              : pulseState === "down"
              ? "translate3d(0, 2.5px, 0) scale(0.95)"
              : "translate3d(0, 0, 0) scale(1)",
          transition:
            "transform 360ms cubic-bezier(0.22, 1.4, 0.36, 1), box-shadow 300ms ease, border-color 300ms ease",
        }}
        className={`${pillDims} rounded-full bg-white dark:bg-[#18181b] border flex items-center justify-center overflow-hidden font-mono font-bold text-gray-950 dark:text-white ${
          pulseState === "up"
            ? "border-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.22)]"
            : pulseState === "down"
            ? "border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.2)]"
            : "border-gray-200/90 dark:border-white/15 shadow-inner"
        }`}
      >
        <div className="inline-flex items-center justify-center leading-none">
          {chars.map((char, idx) => {
            const num = parseInt(char, 10);
            if (isNaN(num)) {
              return <span key={`sep-${idx}`}>{char}</span>;
            }
            return (
              <OdometerDigitWheel
                key={`slot-${idx}`}
                digit={num}
                delayMs={idx * 30}
              />
            );
          })}
        </div>
      </div>

      {/* Right Circular Plus Button */}
      <button
        type="button"
        disabled={disabled || disableIncrement || value >= max}
        onMouseDown={() => setPressedBtn("plus")}
        onMouseUp={() => setPressedBtn("none")}
        onMouseLeave={() => setPressedBtn("none")}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled || disableIncrement || value >= max) return;
          triggerPulse("up");
          onIncrement();
        }}
        title={incrementTitle}
        style={{
          transform:
            pressedBtn === "plus"
              ? "scale(0.82)"
              : pulseState === "up"
              ? "scale(1.08)"
              : "scale(1)",
          transition: "transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms ease, border-color 200ms ease",
        }}
        className={`${btnDims} rounded-full flex items-center justify-center border shadow-xs cursor-pointer ${
          disabled || disableIncrement || value >= max
            ? "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-45"
            : "bg-white dark:bg-[#1e1e22] border-gray-200/90 dark:border-white/15 hover:border-gray-400 dark:hover:border-white/35 hover:bg-gray-50 dark:hover:bg-[#2a2a30] text-gray-800 dark:text-gray-100"
        }`}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}

/**
 * beUI Number Animation — Digit Swap Odometer (Video Referencia.mp4 @ 00:17)
 * Every price change physically rolls each individual digit column with staggered spring physics.
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

/**
 * beUI Action Swap — Cascade Dual-Track Slot Roll (Video Referencia.mp4 @ 00:18)
 * Physically rolls each character vertically left-to-right with staggered cubic-bezier spring timing.
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
  const maxLen = Math.max(idleText.length, activeText.length);
  const paddedIdle = idleText.padEnd(maxLen, " ");
  const paddedActive = activeText.padEnd(maxLen, " ");

  return (
    <span className={`inline-flex items-center justify-center gap-2 ${className}`}>
      {/* Dual-State Icon Slot */}
      <span className="relative inline-flex items-center justify-center w-5 h-5 overflow-hidden shrink-0">
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
            transform: active ? "translate3d(0, 0%, 0) scale(1.1)" : "translate3d(0, 120%, 0) scale(0.5)",
            opacity: active ? 1 : 0,
            filter: active ? "blur(0px)" : "blur(3px)",
            transition: "transform 420ms cubic-bezier(0.22, 1.3, 0.36, 1) 40ms, opacity 280ms ease 40ms, filter 280ms ease",
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {activeIcon}
        </span>
      </span>

      {/* Letter-by-Letter Staggered Cascade Slot Roll */}
      <span className="inline-flex items-center overflow-hidden" style={{ height: "1.35em" }}>
        {Array.from({ length: maxLen }).map((_, idx) => {
          const idleChar = paddedIdle[idx] || " ";
          const activeChar = paddedActive[idx] || " ";
          const delay = idx * 15;

          return (
            <span
              key={idx}
              className="relative inline-flex flex-col overflow-hidden"
              style={{
                height: "1.35em",
                lineHeight: "1.35em",
              }}
            >
              <span
                style={{
                  transform: active ? "translate3d(0, -100%, 0)" : "translate3d(0, 0%, 0)",
                  transition: `transform 460ms cubic-bezier(0.22, 1.28, 0.36, 1) ${delay}ms`,
                  willChange: "transform",
                }}
                className="flex flex-col"
              >
                <span className="inline-block whitespace-pre" style={{ height: "1.35em" }}>
                  {idleChar}
                </span>
                <span className="inline-block whitespace-pre font-bold" style={{ height: "1.35em" }}>
                  {activeChar}
                </span>
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
