"use client";
// Adaptación oficial de beui.dev/components/blocks/card-folder + @beui/text-animation para Lumina Home

import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { EllipsisVertical, Eye, EyeOff, CheckCircle2, Trash2, Wifi } from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { playCardEnvelopeSound } from "@/lib/soundUtils";
import { useDeviceUnlock } from "@/hooks/useDeviceUnlock";
import { NetworkBrandLogo, resolveCardNetwork } from "./UnifiedWalletSystem";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Export alias so any external caller (e.g. CartDrawer) continues working seamlessly
export const playEnvelopeSound = (mode: "open" | "close" | "reveal") => {
  if (mode === "open" || mode === "close") {
    playCardEnvelopeSound(mode);
  }
};

// Constantes de física y curvas de animación beUI
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.9,
} as const;
export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
} as const;

const PURSE_MORPH_TRANSITION = {
  duration: 0.28,
  ease: EASE_IN_OUT,
} as const;
const PURSE_REDUCED_TRANSITION = {
  duration: 0.16,
  ease: EASE_OUT,
} as const;

const SCRAMBLE_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$?#%&";

export interface DigitSwapProps {
  value: string;
  animationKey: string;
  direction?: "up" | "down";
  suffixLength?: number;
  glyphClassName?: string;
  suffixClassName?: string;
  className?: string;
}

/**
 * Componente "Text Animation" de beUI (referencia efect.mp4: "Runnin6 J?2 6UUX0T" / "PreR9SG5C $QU 1MDJ$Z"):
 * Resuelve los caracteres progresivamente de izquierda a derecha pasando por glifos alfanuméricos
 * y símbolos ($ ? #) al revelar u ocultar el número de tarjeta, CVV y fecha de expiración.
 */
export function DigitSwap({
  value,
  animationKey,
  suffixLength = 0,
  glyphClassName,
  suffixClassName,
  className,
}: DigitSwapProps) {
  const reduce = useReducedMotion();
  const safeValue = String(value || "");
  const [displayValue, setDisplayValue] = useState(safeValue);
  const triggerSignature = `${animationKey}::${safeValue}`;
  const prevTriggerRef = useRef(triggerSignature);

  useEffect(() => {
    if (prevTriggerRef.current === triggerSignature) {
      return;
    }
    prevTriggerRef.current = triggerSignature;

    if (reduce) {
      setDisplayValue(safeValue);
      return;
    }

    const targetChars = Array.from(safeValue);
    const totalSteps = 14;
    const intervalMs = 28;
    let step = 0;

    const buildScrambledFrame = (currentStep: number) => {
      const progress = currentStep / totalSteps;
      const resolvedCount = Math.floor(progress * targetChars.length);

      return targetChars
        .map((ch, idx) => {
          if (ch === " ") return " ";
          if (idx < resolvedCount) return ch;
          const randIdx = Math.floor(Math.random() * SCRAMBLE_CHARSET.length);
          return SCRAMBLE_CHARSET[randIdx];
        })
        .join("");
    };

    // Primer frame inmediato al hacer clic en el ojito
    setDisplayValue(buildScrambledFrame(1));

    const timer = setInterval(() => {
      step += 1;
      if (step >= totalSteps) {
        clearInterval(timer);
        setDisplayValue(value);
      } else {
        setDisplayValue(buildScrambledFrame(step));
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [triggerSignature, value, reduce]);

  const splitIndex =
    suffixLength > 0 ? Math.max(0, displayValue.length - suffixLength) : displayValue.length;
  const prefixPart = displayValue.slice(0, splitIndex);
  const suffixPart = displayValue.slice(splitIndex);

  return (
    <span className={cn("relative inline-flex items-center overflow-hidden", className)}>
      <span className="inline-flex items-center whitespace-pre">
        <span className={glyphClassName}>{prefixPart}</span>
        {suffixPart ? <span className={suffixClassName}>{suffixPart}</span> : null}
      </span>
    </span>
  );
}

export interface CardFolderProps {
  cardId?: string;
  title: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  card: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  detailsVisible?: boolean;
  defaultDetailsVisible?: boolean;
  onDetailsVisibleChange?: (visible: boolean) => void;
  onClick?: () => void;
  onAction?: () => void;
  ariaLabel?: string;
  actionLabel?: string;
  disabled?: boolean;
  className?: string;
  cardClassName?: string;
}

/**
 * A landscape card tucked into an animated folder sleeve. Pressing the folder
 * lifts the card forward while the purse compresses into its bottom seam; a
 * separate privacy control reveals its number, expiry and CVV.
 */
export function CardFolder({
  cardId,
  title,
  cardNumber,
  expiry,
  cvv: _cvv,
  card,
  open,
  defaultOpen = false,
  onOpenChange,
  detailsVisible,
  defaultDetailsVisible = false,
  onDetailsVisibleChange,
  onClick,
  onAction,
  ariaLabel,
  actionLabel,
  disabled = false,
  className,
  cardClassName,
}: CardFolderProps) {
  const reduce = useReducedMotion();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalDetailsVisible, setInternalDetailsVisible] = useState(
    defaultDetailsVisible,
  );
  const openControlled = open !== undefined;
  const detailsControlled = detailsVisible !== undefined;
  const isOpen = open ?? internalOpen;
  const areDetailsVisible = detailsVisible ?? internalDetailsVisible;
  const transition = reduce ? { duration: 0 } : SPRING_LAYOUT;
  const safeCardNumber = String(cardNumber || "4532889120414444");
  const normalizedCardNumber = safeCardNumber.replace(/\D/g, "");
  const visibleLastFour = (normalizedCardNumber.slice(-4) || "4444").padStart(4, "•");
  const revealedCardNumber =
    normalizedCardNumber.length >= 12
      ? normalizedCardNumber.match(/.{1,4}/g)?.join(" ") ?? safeCardNumber
      : `4532 8891 2041 ${visibleLastFour}`;
  const maskedCvv = "•••";
  const revealedCvv = "---";
  const defaultAriaLabel = `${isOpen ? "Cerrar" : "Abrir"} ${title}, tarjeta terminada en ${visibleLastFour}, expira ${expiry}`;
  const progress = useMotionValue(isOpen ? 1 : 0);
  const cardTransform = useTransform(progress, (value) => {
    const boundedProgress = Math.min(1, Math.max(0, value));
    const lift = Math.sin(Math.PI * boundedProgress);
    return `translateY(${-8 * lift}%) scale(${1 + 0.01 * lift})`;
  });
  const backTransform = useTransform(
    progress,
    [0, 1],
    ["translateY(0%) scaleY(1)", "translateY(18%) scaleY(0.18)"],
  );
  const frontTransform = useTransform(
    progress,
    [0, 1],
    ["translateY(0%) rotateX(0deg)", "translateY(18%) rotateX(-72deg)"],
  );
  const purseOpacity = useTransform(progress, [0, 0.76, 1], [1, 1, 0]);

  useEffect(() => {
    const controls = animate(
      progress,
      isOpen ? 1 : 0,
      reduce ? { duration: 0 } : PURSE_MORPH_TRANSITION,
    );
    return () => controls.stop();
  }, [isOpen, progress, reduce]);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (disabled) return;
      playCardEnvelopeSound(nextOpen ? "open" : "close");
      if (!openControlled) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [disabled, onOpenChange, openControlled],
  );

  const handleClick = () => {
    setOpen(!isOpen);
    onClick?.();
  };

  const { isUnlocking, requestCardUnlock } = useDeviceUnlock();

  const handleReveal = useCallback(() => {
    if (!detailsControlled) setInternalDetailsVisible(true);
    onDetailsVisibleChange?.(true);
  }, [detailsControlled, onDetailsVisibleChange]);

  const handleHide = useCallback(() => {
    if (!detailsControlled) setInternalDetailsVisible(false);
    onDetailsVisibleChange?.(false);
  }, [detailsControlled, onDetailsVisibleChange]);

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    requestCardUnlock(
      cardId || cardNumber || title,
      areDetailsVisible,
      handleReveal,
      handleHide
    );
  };

  // Auto-Lock al minimizar o cambiar de app (Visibility API - Regla 5.3)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && areDetailsVisible) {
        handleHide();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [areDetailsVisible, handleHide]);

  return (
    <div
      data-open={isOpen ? "true" : "false"}
      data-details-visible={areDetailsVisible ? "true" : "false"}
      className={cn(
        "relative aspect-[1029/592] w-full max-w-[24rem] select-none [perspective:1200px] [--background:#F6F5F2] [--foreground:#141413] dark:[--background:#1A1A1D] dark:[--foreground:#F5F5F3]",
        className,
      )}
    >
      <motion.button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel ?? defaultAriaLabel}
        aria-expanded={isOpen}
        onClick={handleClick}
        whileTap={reduce || disabled ? undefined : { scale: 0.97 }}
        transition={reduce ? { duration: 0 } : SPRING_PRESS}
        className="absolute inset-0 block w-full h-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[#8c9276] focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <motion.span
          data-slot="card-folder-back"
          aria-hidden="true"
          initial={false}
          animate={reduce ? { opacity: isOpen ? 0 : 1 } : undefined}
          transition={PURSE_REDUCED_TRANSITION}
          style={
            reduce
              ? undefined
              : { opacity: purseOpacity, transform: backTransform }
          }
          className="absolute inset-x-0 bottom-0 top-[10%] rounded-2xl border border-black/10 dark:border-white/10 bg-[#ECEAE4] dark:bg-[#141416] shadow-inner [transform-origin:center_bottom]"
        />

        <motion.span
          aria-hidden="true"
          initial={false}
          animate={
            reduce ? { transform: "translateY(0%) scale(1)" } : undefined
          }
          style={reduce ? undefined : { transform: cardTransform }}
          className={cn(
            "absolute left-[4.7%] right-[4.7%] top-0 z-10 aspect-[1.586/1] overflow-hidden rounded-[22px] bg-transparent shadow-[0_14px_32px_rgba(0,0,0,0.22)] [transform-origin:center_bottom] will-change-transform",
            cardClassName,
          )}
        >
          {card}
        </motion.span>
      </motion.button>

      <motion.span
        aria-hidden={isOpen}
        inert={isOpen ? true : undefined}
        initial={false}
        animate={reduce ? { opacity: isOpen ? 0 : 1 } : undefined}
        transition={PURSE_REDUCED_TRANSITION}
        style={
          reduce
            ? undefined
            : { opacity: purseOpacity, transform: frontTransform }
        }
        className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 z-20 [backface-visibility:hidden] [transform-origin:center_bottom]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 384 110"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible drop-shadow-[0_-6px_16px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_-8px_20px_rgba(0,0,0,0.45)]"
        >
          <path
            d="M0 17C15 7 31 4 49 4H87C110 4 126 17 144 32L158 44C176 59 206 59 225 43L240 30C257 16 271 4 295 4H335C354 4 370 8 384 18V94C384 103 377 110 368 110H16C7 110 0 103 0 94Z"
            fill="var(--background)"
            stroke="var(--foreground)"
            strokeOpacity="0.12"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M10 21C22 13 35 11 51 11H85C105 11 120 23 137 37L153 50C175 68 208 68 231 49L246 36C262 23 275 11 297 11H333C350 11 363 14 374 22V89C374 97 369 101 360 101H24C15 101 10 96 10 89Z"
            fill="none"
            stroke="var(--foreground)"
            strokeDasharray="5 5"
            strokeLinecap="round"
            strokeOpacity="0.22"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <span className="absolute inset-x-[5%] inset-y-0 z-10 flex min-w-0 flex-col justify-between py-3.5 sm:py-4">
          <span className="flex items-start justify-between pr-2">
            <motion.button
              key="card-details-visibility"
              type="button"
              disabled={disabled || isUnlocking}
              tabIndex={isOpen ? -1 : undefined}
              aria-label={
                areDetailsVisible
                  ? "Ocultar detalles de tarjeta"
                  : isUnlocking
                  ? "Verificando identidad..."
                  : "Mostrar detalles de tarjeta"
              }
              aria-pressed={areDetailsVisible}
              onClick={toggleDetails}
              whileTap={reduce || disabled ? undefined : { scale: 0.94 }}
              transition={reduce ? { duration: 0.12 } : SPRING_PRESS}
              className={cn(
                "z-30 flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full text-neutral-500 dark:text-neutral-400 outline-none transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8c9276] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
                isOpen ? "pointer-events-none" : "pointer-events-auto",
                isUnlocking && "animate-pulse text-[#8c9276] dark:text-[#a3aa8c] bg-[#8c9276]/10 dark:bg-white/10"
              )}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={isUnlocking ? "unlocking" : areDetailsVisible ? "hide" : "show"}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
                  }
                  transition={
                    reduce
                      ? { duration: 0.12 }
                      : { type: "spring", duration: 0.3, bounce: 0 }
                  }
                  className={cn("flex items-center justify-center", isUnlocking && "animate-pulse")}
                >
                  {areDetailsVisible ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye
                      className={cn("size-4 transition-all duration-300", isUnlocking && "scale-105 opacity-80")}
                      aria-hidden="true"
                    />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <span className="flex shrink-0 items-end gap-3.5 pt-1.5">
              <span className="flex flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-500/80 dark:text-neutral-400/75">
                  Expira
                </span>
                <DigitSwap
                  value={expiry}
                  animationKey={areDetailsVisible ? "revealed" : "masked"}
                  direction={areDetailsVisible ? "up" : "down"}
                  className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums"
                />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-500/80 dark:text-neutral-400/75">
                  CVV
                </span>
                <DigitSwap
                  value={areDetailsVisible ? revealedCvv : maskedCvv}
                  animationKey={areDetailsVisible ? "revealed" : "masked"}
                  direction={areDetailsVisible ? "up" : "down"}
                  className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums"
                />
              </span>
            </span>
          </span>

          <span className="flex min-w-0 items-baseline justify-between gap-2 px-1">
            <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-bold leading-tight text-neutral-900 dark:text-neutral-100 pr-1.5">
              {title}
            </span>
            <DigitSwap
              value={
                areDetailsVisible
                  ? revealedCardNumber
                  : `•••• •••• •••• ${visibleLastFour}`
              }
              animationKey={areDetailsVisible ? "revealed" : "masked"}
              direction={areDetailsVisible ? "up" : "down"}
              suffixLength={4}
              glyphClassName={
                areDetailsVisible
                  ? "text-neutral-900 dark:text-neutral-100"
                  : cn(
                      "text-neutral-500 dark:text-neutral-400 transition-all duration-300",
                      isUnlocking && "animate-pulse opacity-60 text-[#8c9276] dark:text-[#a3aa8c]"
                    )
              }
              suffixClassName={cn(
                "text-neutral-900 dark:text-neutral-100 font-bold transition-all duration-300",
                isUnlocking && "animate-pulse opacity-75"
              )}
              className="shrink-0 font-mono text-[11px] sm:text-xs tracking-[0.04em] sm:tracking-[0.06em] tabular-nums"
            />
          </span>
        </span>
      </motion.span>

      {onAction ? (
        <motion.button
          type="button"
          disabled={disabled}
          aria-label={actionLabel ?? `Opciones para ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            playCardEnvelopeSound(!isOpen ? "open" : "close");
            onAction();
          }}
          animate={{ y: isOpen && !reduce ? -14 : 0 }}
          whileTap={reduce || disabled ? undefined : { scale: 0.96 }}
          transition={transition}
          className="absolute right-[6.5%] top-[12%] z-30 flex size-7 sm:size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 dark:bg-black/40 backdrop-blur-md border border-white/20 text-white/90 outline-none transition-all hover:bg-black/50 hover:text-white focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <EllipsisVertical className="size-3.5 sm:size-4" aria-hidden="true" />
        </motion.button>
      ) : null}
    </div>
  );
}

export interface LuminaCardFolderItemProps {
  id: string;
  holder: string;
  number: string;
  exp: string;
  type: "visa" | "mastercard" | string;
  isDefault?: boolean;
  index?: number;
  compact?: boolean;
  design?: "carbon" | "holo" | "navy" | string;
  onSetDefault?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export type SkeuomorphicCardTheme = "carbon" | "holo" | "navy" | "cobalt" | "emerald";

export interface SkeuomorphicThemeConfig {
  id: SkeuomorphicCardTheme;
  name: string;
  tierLabel: string;
  background: string;
  border: string;
  textColor: string;
  subtextColor: string;
  pillClass: string;
  isHolo?: boolean;
}

export const SKEUOMORPHIC_THEMES: Record<string, SkeuomorphicThemeConfig> = {
  carbon: {
    id: "carbon",
    name: "Signature Black",
    tierLabel: "SIGNATURE BLACK",
    background:
      "radial-gradient(circle at 86% 24%, rgba(235, 0, 27, 0.42) 0%, rgba(247, 158, 27, 0.18) 38%, transparent 64%), linear-gradient(170deg, #2d2e33 0%, #17181c 100%)",
    border: "1.8px solid rgba(255, 255, 255, 0.92)",
    textColor: "#ffffff",
    subtextColor: "rgba(255, 255, 255, 0.75)",
    pillClass: "bg-red-500/25 text-red-200 border-red-400/30",
  },
  holo: {
    id: "holo",
    name: "Holo Prism",
    tierLabel: "HOLO PRISM",
    background:
      "linear-gradient(102deg, #e5e7ec 0%, #f1f2f6 48%, #cad4e4 100%)",
    border: "1.8px solid #ffffff",
    textColor: "#1d1d1f",
    subtextColor: "#52525b",
    pillClass: "bg-neutral-900/15 text-neutral-900 border-neutral-900/20",
    isHolo: true,
  },
  navy: {
    id: "navy",
    name: "Horizon Gold",
    tierLabel: "HORIZON GOLD",
    background:
      "radial-gradient(circle at 78% 40%, rgba(249, 115, 22, 0.92) 0%, rgba(180, 83, 9, 0.62) 38%, transparent 70%), linear-gradient(110deg, #19233c 0%, #26365c 46%, #7c3f20 100%)",
    border: "1.8px solid rgba(255, 255, 255, 0.92)",
    textColor: "#ffffff",
    subtextColor: "rgba(255, 255, 255, 0.75)",
    pillClass: "bg-black/25 text-amber-200 border border-amber-200/30",
  },
  cobalt: {
    id: "cobalt",
    name: "Centurion Cobalt",
    tierLabel: "CENTURION COBALT",
    background:
      "radial-gradient(circle at 84% 24%, rgba(56, 189, 248, 0.48) 0%, rgba(37, 99, 235, 0.32) 42%, transparent 70%), linear-gradient(135deg, #0b1d3a 0%, #173b7a 52%, #081226 100%)",
    border: "1.8px solid rgba(255, 255, 255, 0.92)",
    textColor: "#ffffff",
    subtextColor: "rgba(255, 255, 255, 0.75)",
    pillClass: "bg-sky-500/25 text-sky-200 border-sky-400/30",
  },
  emerald: {
    id: "emerald",
    name: "Imperial Emerald",
    tierLabel: "IMPERIAL EMERALD",
    background:
      "radial-gradient(circle at 82% 26%, rgba(16, 185, 129, 0.45) 0%, rgba(217, 119, 6, 0.22) 44%, transparent 70%), linear-gradient(135deg, #072c24 0%, #0d473b 52%, #041915 100%)",
    border: "1.8px solid rgba(255, 255, 255, 0.92)",
    textColor: "#ffffff",
    subtextColor: "rgba(255, 255, 255, 0.75)",
    pillClass: "bg-emerald-500/25 text-emerald-200 border-emerald-400/30",
  },
};

/**
 * Envuelve una tarjeta guardada (Admin o Cliente) dentro del sobre/billetera interactiva CardFolder de beUI
 * adaptando 1:1 el estilo skeuomórfico de la nueva billetera 3D (Signature Black, Holo Prism, Horizon Gold).
 */
export function LuminaCardFolderItem({
  id,
  holder,
  number,
  exp,
  type,
  isDefault = false,
  index = 0,
  compact = false,
  design,
  onSetDefault,
  onRemove,
}: LuminaCardFolderItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const resolvedNetwork = resolveCardNetwork(type || design, number);

  // Mapear el diseño skeuomórfico exacto de la billetera según diseño explícito o red bancaria
  let effectiveTheme: string = "carbon";
  if (design === "holo" || design === "holographic") {
    effectiveTheme = "holo";
  } else if (design === "navy") {
    effectiveTheme = "navy";
  } else if (design === "carbon" || design === "obsidian") {
    effectiveTheme = "carbon";
  } else if (design === "cobalt") {
    effectiveTheme = "cobalt";
  } else if (design === "emerald") {
    effectiveTheme = "emerald";
  } else {
    // Si no se especifica, asociar con el tema oficial de la red bancaria
    if (resolvedNetwork === "visa") effectiveTheme = "holo";
    else if (resolvedNetwork === "mastercard") effectiveTheme = "carbon";
    else if (resolvedNetwork === "discover") effectiveTheme = "navy";
    else if (resolvedNetwork === "american-express") effectiveTheme = "cobalt";
    else if (resolvedNetwork === "diners-club") effectiveTheme = "emerald";
    else {
      const cycle = ["carbon", "holo", "navy"];
      effectiveTheme = cycle[index % 3];
    }
  }

  const themeConfig = SKEUOMORPHIC_THEMES[effectiveTheme] || SKEUOMORPHIC_THEMES.carbon;
  const isHolo = effectiveTheme === "holo";
  const textColor = themeConfig.textColor;
  const subtextColor = themeConfig.subtextColor;

  const safeNumber = String(number || "4532889120414444");
  const digitsOnly = safeNumber.replace(/\D/g, "");
  const lastFour = (digitsOnly.slice(-4) || "4444").padStart(4, "4");

  const cardSurface = (
    <div
      className="relative w-full h-full p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden rounded-[22px]"
      style={{
        background: themeConfig.background,
        border: themeConfig.border,
        color: textColor,
        boxShadow: "0 -4px 18px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Textura de ruido sutil realista sobre las tarjetas */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Brillo iridiscente adicional para Holo Prism */}
      {isHolo && (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background:
              "linear-gradient(125deg, rgba(255,255,255,0.45) 0%, transparent 40%, rgba(255,255,255,0.2) 70%, transparent 100%)",
          }}
        />
      )}

      {/* Cabecera de la tarjeta física: Chip + Contactless + Principal a la izquierda | Brand a la derecha (con margen para el menú de 3 puntos) */}
      <div className="relative z-10 flex items-center justify-between pr-8 sm:pr-10">
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Chip EMV metálico */}
          <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-[#c59b27] via-[#f3d778] to-[#b38728] border border-yellow-200/80 shadow-inner flex items-center justify-center relative overflow-hidden shrink-0">
            <div className="w-full h-[1px] bg-black/25 absolute top-1/2 -translate-y-1/2" />
            <div className="h-full w-[1px] bg-black/25 absolute left-1/3" />
            <div className="h-full w-[1px] bg-black/25 absolute right-1/3" />
          </div>
          <Wifi className={cn("w-3.5 h-3.5 rotate-90 shrink-0", isHolo ? "text-neutral-700" : "text-white/70")} />
          {isDefault && (
            <span className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 backdrop-blur-md border border-emerald-400/30 shrink-0 shadow-xs">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
              Principal
            </span>
          )}
        </div>

        {/* Emblema oficial de Red Bancaria desde thesvg.org */}
        <div className="flex items-center shrink-0">
          <NetworkBrandLogo
            network={resolvedNetwork}
            compact
            darkText={isHolo}
          />
        </div>
      </div>

      {/* Cuerpo central de la tarjeta: Tier Badge de colección de lujo + Dígitos animados beUI (se descubre al abrir el sobre CardFolder) */}
      <div className="relative z-10 flex flex-col justify-center my-auto pt-1 sm:pt-2">
        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
          <span
            className={cn(
              "text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-0.5 rounded-full backdrop-blur-md border inline-block shadow-xs",
              themeConfig.pillClass
            )}
          >
            {themeConfig.tierLabel}
          </span>
        </div>
        <p
          className="font-mono text-xs sm:text-sm tracking-[0.22em] font-semibold drop-shadow-sm"
          style={{ color: textColor }}
        >
          <DigitSwap
            value={detailsVisible ? `•••• •••• •••• ${lastFour}` : `•••• •••• •••• ${lastFour}`}
            animationKey={detailsVisible ? "revealed" : "masked"}
          />
        </p>
      </div>

      {/* Pie de la tarjeta con acciones rápidas al estar abierta */}
      <div
        className={cn(
          "relative z-10 flex items-center justify-between pt-2 border-t text-[10px] gap-2",
          isHolo ? "border-neutral-300/80" : "border-white/15"
        )}
      >
        <div className="min-w-0 flex-1 truncate pr-2">
          <span
            className="uppercase tracking-wider text-[8px] block font-medium"
            style={{ color: subtextColor }}
          >
            Titular Verificado
          </span>
          <span
            className="font-bold truncate block text-xs"
            style={{ color: textColor }}
          >
            {holder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isDefault && onSetDefault && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(id);
              }}
              className={cn(
                "px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap",
                isHolo
                  ? "bg-neutral-900/10 hover:bg-neutral-900/20 text-neutral-900 border border-neutral-900/15"
                  : "bg-white/15 hover:bg-white/25 text-white border border-white/15"
              )}
            >
              Hacer principal
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
              className={cn(
                "px-2 py-1 rounded-lg text-[9px] sm:text-[10px] flex items-center gap-1 font-semibold transition-colors cursor-pointer whitespace-nowrap",
                isHolo
                  ? "bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 border border-red-500/25"
                  : "bg-red-500/25 hover:bg-red-500/45 text-red-100 border border-red-400/20"
              )}
              title="Eliminar tarjeta"
            >
              <Trash2 className="w-3 h-3 shrink-0" />
              {!compact && <span>Eliminar</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full">
      <CardFolder
        cardId={id}
        title={holder || "Titular Lumina"}
        cardNumber={number}
        expiry={exp}
        cvv="---"
        open={isOpen}
        onOpenChange={setIsOpen}
        detailsVisible={detailsVisible}
        onDetailsVisibleChange={setDetailsVisible}
        onAction={() => setIsOpen((prev) => !prev)}
        actionLabel={isOpen ? "Guardar en el sobre" : "Extraer tarjeta del sobre"}
        card={cardSurface}
        className={compact ? "max-w-[21rem]" : "max-w-[24rem]"}
      />
    </div>
  );
}
