"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";

const BEUI_SPRING_PRESS = {
  type: "spring" as const,
  stiffness: 520,
  damping: 24,
  mass: 0.6,
};

const BEUI_ELASTIC_EASE: [number, number, number, number] = [0.22, 1.3, 0.71, 1];

export interface BeUIAdaptiveStepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disableDecrement?: boolean;
  disableIncrement?: boolean;
  incrementTitle?: string;
  decrementTitle?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * beUI Adaptive Stepper (https://beui.dev/components/motion/adaptive-stepper)
 * Features tactile spring-pressed action pills, dynamic layout adaptation,
 * and a directional motion-blurred rolling digit ticker.
 */
export function BeUIAdaptiveStepper({
  value,
  onDecrement,
  onIncrement,
  disableDecrement = false,
  disableIncrement = false,
  incrementTitle = "Aumentar cantidad",
  decrementTitle = "Disminuir cantidad",
  size = "md",
  className = "",
}: BeUIAdaptiveStepperProps) {
  const prevValueRef = useRef(value);
  const direction: -1 | 0 | 1 =
    value === prevValueRef.current ? 0 : value > prevValueRef.current ? 1 : -1;

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const formattedValue = value < 10 ? `0${value}` : String(value);
  const btnSize = size === "sm" ? "w-7 h-7" : "w-8 h-8";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-3.5 h-3.5";

  return (
    <motion.div
      layout
      transition={{ duration: 0.35, ease: BEUI_ELASTIC_EASE }}
      className={`inline-flex items-center bg-gray-100/90 dark:bg-white/[0.08] rounded-full p-1 border border-black/[0.06] dark:border-white/15 shadow-2xs backdrop-blur-md select-none ${className}`}
      role="group"
      aria-label="Selector de cantidad"
    >
      {/* Decrement Pill */}
      <motion.button
        type="button"
        onClick={onDecrement}
        disabled={disableDecrement}
        whileHover={disableDecrement ? undefined : { scale: 1.06 }}
        whileTap={disableDecrement ? undefined : { scale: 0.86 }}
        transition={BEUI_SPRING_PRESS}
        title={decrementTitle}
        className={`${btnSize} rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
          disableDecrement
            ? "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 border-transparent cursor-not-allowed opacity-45"
            : "bg-white dark:bg-[#2c2c30] hover:bg-gray-50 dark:hover:bg-[#38383d] text-gray-800 dark:text-gray-100 border-black/[0.05] dark:border-white/10 shadow-2xs"
        }`}
      >
        <Minus className={iconSize} strokeWidth={2.4} />
      </motion.button>

      {/* Rolling Value Slot */}
      <output
        aria-live="polite"
        aria-atomic="true"
        className="relative grid min-w-[2.5rem] px-1.5 place-items-center overflow-hidden font-mono font-bold text-xs sm:text-sm tabular-nums text-gray-900 dark:text-gray-100 leading-none"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            initial={{
              opacity: 0.25,
              filter: "blur(2.5px)",
              y: direction === 0 ? 0 : direction * 14,
              scale: 0.88,
            }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              filter: "blur(2.5px)",
              y: direction === 0 ? 0 : -direction * 14,
              scale: 0.88,
              transition: { duration: 0.14, ease: "easeOut" },
            }}
            transition={{
              duration: 0.24,
              ease: BEUI_ELASTIC_EASE,
            }}
            className="col-start-1 row-start-1 block will-change-[transform,filter,opacity]"
          >
            {formattedValue}
          </motion.span>
        </AnimatePresence>
      </output>

      {/* Increment Pill */}
      <motion.button
        type="button"
        onClick={onIncrement}
        disabled={disableIncrement}
        whileHover={disableIncrement ? undefined : { scale: 1.06 }}
        whileTap={disableIncrement ? undefined : { scale: 0.86 }}
        transition={BEUI_SPRING_PRESS}
        title={incrementTitle}
        className={`${btnSize} rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
          disableIncrement
            ? "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 border-transparent cursor-not-allowed opacity-45"
            : "bg-white dark:bg-[#2c2c30] hover:bg-gray-50 dark:hover:bg-[#38383d] text-gray-800 dark:text-gray-100 border-black/[0.05] dark:border-white/10 shadow-2xs"
        }`}
      >
        <Plus className={iconSize} strokeWidth={2.4} />
      </motion.button>
    </motion.div>
  );
}

export interface BeUIRollingPriceProps {
  amount: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * beUI Number Animation (https://beui.dev/components/motion/number)
 * Rolls monetary amounts smoothly when quantity or discounts change.
 */
export function BeUIRollingPrice({
  amount,
  prefix = "$",
  suffix = "",
  className = "",
}: BeUIRollingPriceProps) {
  const prevAmountRef = useRef(amount);
  const direction: -1 | 0 | 1 =
    amount === prevAmountRef.current ? 0 : amount > prevAmountRef.current ? 1 : -1;

  useEffect(() => {
    prevAmountRef.current = amount;
  }, [amount]);

  const formatted = `${prefix}${amount.toFixed(2)}${suffix}`;

  return (
    <span className={`inline-grid place-items-center overflow-hidden tabular-nums ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={formatted}
          initial={{
            opacity: 0.3,
            filter: "blur(2px)",
            y: direction === 0 ? 0 : direction * 12,
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
          }}
          exit={{
            opacity: 0,
            filter: "blur(2px)",
            y: direction === 0 ? 0 : -direction * 12,
            transition: { duration: 0.12, ease: "easeOut" },
          }}
          transition={{
            duration: 0.22,
            ease: BEUI_ELASTIC_EASE,
          }}
          className="col-start-1 row-start-1 will-change-[transform,filter,opacity]"
        >
          {formatted}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
