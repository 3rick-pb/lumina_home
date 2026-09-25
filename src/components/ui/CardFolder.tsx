"use client";
// Adaptación oficial de beui.dev/components/blocks/card-folder + @beui/text-animation para Lumina Home

import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { EllipsisVertical, Eye, EyeOff, CheckCircle2, Trash2, Wifi, ShieldCheck } from "lucide-react";
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

// ============================================================================
// MOTOR DE AUDIO TÁCTIL DE BAJA FRECUENCIA (Cero sonidos agudos / Cero fatiga)
// ============================================================================
let sharedEnvelopeAudioCtx: AudioContext | null = null;

function getEnvelopeAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedEnvelopeAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedEnvelopeAudioCtx = new AudioCtx();
      }
    }
    if (sharedEnvelopeAudioCtx && sharedEnvelopeAudioCtx.state === "suspended") {
      sharedEnvelopeAudioCtx.resume().catch(() => {});
    }
    return sharedEnvelopeAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Reproduce un sonido orgánico, grave, cálido y aterciopelado (sin frecuencias agudas)
 * al abrir o cerrar el sobre de la tarjeta.
 */
export function playEnvelopeSound(mode: "open" | "close" | "reveal") {
  const ctx = getEnvelopeAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (mode === "open") {
      // Sonido de apertura de sobre de cuero/papel grueso: grave, suave y cálido (105 Hz -> 148 Hz, filtro pasa-bajos a 260 Hz)
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(102, now);
      osc.frequency.exponentialRampToValueAtTime(146, now + 0.14);

      subOsc.type = "triangle";
      subOsc.frequency.setValueAtTime(68, now);
      subOsc.frequency.exponentialRampToValueAtTime(96, now + 0.15);

      // Filtro pasa-bajos estricto para eliminar cualquier frecuencia aguda
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(240, now);
      filter.Q.setValueAtTime(0.7, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.065, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.165);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 0.17);
      subOsc.stop(now + 0.17);

      // Textura muy sutil de deslizamiento de sobre (filtrada en graves a 190 Hz)
      const bufferSize = Math.floor(ctx.sampleRate * 0.11);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(185, now);
      noiseFilter.Q.setValueAtTime(1.4, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.028, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } else if (mode === "close") {
      // Sonido corto y grave al cerrar el sobre (128 Hz -> 78 Hz en 80ms, pasa-bajos a 210 Hz)
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(128, now);
      osc.frequency.exponentialRampToValueAtTime(76, now + 0.078);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(205, now);
      filter.Q.setValueAtTime(0.6, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.058, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.082);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    } else if (mode === "reveal") {
      // Pulso grave aterciopelado muy corto al revelar/ocultar con el ojito (115 Hz -> 132 Hz en 65ms)
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(132, now + 0.06);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(220, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    }
  } catch {
    // Ignorar si el navegador bloquea audio antes de interacción
  }
}

// ============================================================================
// COMPONENTE OFICIAL @beui/text-animation ("Text Animation" de beUI)
// ============================================================================
export interface BeUITextAnimationProps {
  text: string;
  animationKey: string;
  direction?: "up" | "down";
  staggerMs?: number;
  suffixLength?: number;
  glyphClassName?: string;
  suffixClassName?: string;
  className?: string;
  highlightOnReveal?: boolean;
}

/**
 * Componente "Text Animation" de beUI (@beui/text-animation):
 * Anima carácter por carácter en cascada con desenfoque cinemático (blur-to-crisp),
 * rotación 3D suave en el eje X y desplazamiento elástico por glifo al revelar u ocultar datos.
 */
export function BeUITextAnimation({
  text,
  animationKey,
  direction = "up",
  staggerMs = 18,
  suffixLength = 0,
  glyphClassName,
  suffixClassName,
  className,
  highlightOnReveal = false,
}: BeUITextAnimationProps) {
  const reduce = useReducedMotion();
  const yEnter = direction === "up" ? 11 : -11;
  const yExit = direction === "up" ? -11 : 11;
  const rotEnter = direction === "up" ? -48 : 48;
  const rotExit = direction === "up" ? 48 : -48;

  const splitIndex = suffixLength > 0 ? Math.max(0, text.length - suffixLength) : text.length;
  const chars = Array.from(text);

  return (
    <span
      className={cn(
        "relative inline-flex items-center overflow-hidden [perspective:600px]",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={`${animationKey}-${text}`}
          initial="initial"
          animate="animate"
          exit="exit"
          className="inline-flex items-center whitespace-pre"
        >
          {chars.map((char, idx) => {
            const isSuffix = idx >= splitIndex;
            const isSpace = char === " ";
            const delaySec = reduce ? 0 : (idx * staggerMs) / 1000;

            return (
              <motion.span
                key={`${idx}-${char}`}
                variants={
                  reduce
                    ? {
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        exit: { opacity: 0 },
                      }
                    : {
                        initial: {
                          opacity: 0,
                          y: yEnter,
                          scale: 0.68,
                          rotateX: rotEnter,
                          filter: "blur(5px)",
                        },
                        animate: {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          rotateX: 0,
                          filter: "blur(0px)",
                        },
                        exit: {
                          opacity: 0,
                          y: yExit,
                          scale: 0.68,
                          rotateX: rotExit,
                          filter: "blur(4px)",
                        },
                      }
                }
                transition={
                  reduce
                    ? { duration: 0.1 }
                    : {
                        type: "spring",
                        stiffness: 470,
                        damping: 28,
                        mass: 0.62,
                        delay: delaySec,
                      }
                }
                style={{
                  display: "inline-block",
                  transformOrigin: "center center",
                  minWidth: isSpace ? "0.32em" : undefined,
                }}
                className={cn(
                  isSuffix ? suffixClassName : glyphClassName,
                  highlightOnReveal &&
                    animationKey === "revealed" &&
                    !isSpace &&
                    "drop-shadow-[0_0_8px_rgba(140,146,118,0.35)] dark:drop-shadow-[0_0_8px_rgba(204,255,0,0.28)]",
                )}
              >
                {char}
              </motion.span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Alias de compatibilidad con DigitSwap usando BeUITextAnimation
export const DigitSwap = BeUITextAnimation;

export interface CardFolderProps {
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
 * separate privacy control reveals its number and CVV using @beui/text-animation.
 */
export function CardFolder({
  title,
  cardNumber,
  expiry,
  cvv,
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
  const isFirstRender = useRef(true);

  const transition = reduce ? { duration: 0 } : SPRING_LAYOUT;
  const normalizedCardNumber = cardNumber.replace(/\D/g, "");
  const visibleLastFour = normalizedCardNumber.slice(-4).padStart(4, "•");
  const revealedCardNumber =
    normalizedCardNumber.length >= 12
      ? normalizedCardNumber.match(/.{1,4}/g)?.join(" ") ?? cardNumber
      : `4532 8891 2041 ${visibleLastFour}`;
  const maskedCvv = "•".repeat(Math.max(3, cvv.length));
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
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      // Reproduce sonido grave/suave al abrir y sonido corto al cerrar el sobre
      playEnvelopeSound(isOpen ? "open" : "close");
    }

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
      if (!openControlled) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [disabled, onOpenChange, openControlled],
  );

  const handleClick = () => {
    setOpen(!isOpen);
    onClick?.();
  };

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const nextVisible = !areDetailsVisible;
    playEnvelopeSound("reveal");
    if (!detailsControlled) setInternalDetailsVisible(nextVisible);
    onDetailsVisibleChange?.(nextVisible);
  };

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
            "absolute left-[4.7%] right-[4.7%] top-0 z-10 aspect-[1.586/1] overflow-hidden rounded-xl border border-black/10 dark:border-white/15 bg-neutral-900 shadow-[0_14px_32px_rgba(0,0,0,0.22)] [transform-origin:center_bottom] will-change-transform",
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
            {/* Botón Ojito Mejorado con estado visual interactivo */}
            <motion.button
              key="card-details-visibility"
              type="button"
              disabled={disabled}
              tabIndex={isOpen ? -1 : undefined}
              aria-label={
                areDetailsVisible
                  ? "Ocultar detalles de tarjeta"
                  : "Mostrar detalles de tarjeta"
              }
              aria-pressed={areDetailsVisible}
              onClick={toggleDetails}
              whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
              transition={reduce ? { duration: 0.12 } : SPRING_PRESS}
              className={cn(
                "z-30 flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 shrink-0 rounded-full outline-none transition-all duration-300 border cursor-pointer",
                areDetailsVisible
                  ? "bg-neutral-900 text-white border-neutral-800 shadow-[0_4px_12px_rgba(0,0,0,0.18)] dark:bg-[#FFE4D1] dark:text-[#080C26] dark:border-[#FFE4D1]"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/15 hover:text-neutral-950 dark:hover:text-white",
                isOpen ? "pointer-events-none" : "pointer-events-auto",
              )}
              title={areDetailsVisible ? "Ocultar datos sensibles" : "Revelar numeración y CVV"}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={areDetailsVisible ? "hide" : "show"}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.3, rotate: -25, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
                  exit={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.3, rotate: 25, filter: "blur(4px)" }
                  }
                  transition={
                    reduce
                      ? { duration: 0.12 }
                      : { type: "spring", stiffness: 420, damping: 26 }
                  }
                  className="flex items-center justify-center"
                >
                  {areDetailsVisible ? (
                    <EyeOff className="size-3.5 sm:size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-3.5 sm:size-4" aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>

              <BeUITextAnimation
                text={areDetailsVisible ? "Ocultar" : "Revelar"}
                animationKey={areDetailsVisible ? "lbl-hide" : "lbl-show"}
                direction={areDetailsVisible ? "up" : "down"}
                staggerMs={14}
                className="text-[10px] font-bold tracking-wide uppercase"
              />
            </motion.button>

            <span className="flex shrink-0 items-end gap-3.5 pt-1">
              <span className="flex flex-col gap-0.5 text-right">
                <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-neutral-500/85 dark:text-neutral-400/80">
                  Expira
                </span>
                <BeUITextAnimation
                  text={expiry}
                  animationKey={areDetailsVisible ? "exp-open" : "exp-closed"}
                  direction={areDetailsVisible ? "up" : "down"}
                  staggerMs={16}
                  className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tabular-nums"
                />
              </span>
              <span className="flex flex-col gap-0.5 text-right min-w-[34px]">
                <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-neutral-500/85 dark:text-neutral-400/80">
                  CVV
                </span>
                <BeUITextAnimation
                  text={areDetailsVisible ? cvv : maskedCvv}
                  animationKey={areDetailsVisible ? "revealed" : "masked"}
                  direction={areDetailsVisible ? "up" : "down"}
                  staggerMs={26}
                  highlightOnReveal
                  glyphClassName={
                    areDetailsVisible
                      ? "text-emerald-700 dark:text-[#FFE4D1] font-extrabold"
                      : "text-neutral-600 dark:text-neutral-400"
                  }
                  className="text-xs font-bold tabular-nums justify-end"
                />
              </span>
            </span>
          </span>

          <span className="flex min-w-0 items-baseline justify-between gap-3 px-1">
            <span className="truncate text-sm sm:text-base font-bold leading-tight text-neutral-900 dark:text-neutral-100">
              {title}
            </span>
            <BeUITextAnimation
              text={
                areDetailsVisible
                  ? revealedCardNumber
                  : `•••• •••• •••• ${visibleLastFour}`
              }
              animationKey={areDetailsVisible ? "revealed" : "masked"}
              direction={areDetailsVisible ? "up" : "down"}
              staggerMs={16}
              suffixLength={4}
              highlightOnReveal
              glyphClassName={
                areDetailsVisible
                  ? "text-neutral-950 dark:text-white font-bold"
                  : "text-neutral-500 dark:text-neutral-400"
              }
              suffixClassName="text-neutral-950 dark:text-white font-extrabold"
              className="truncate font-mono text-[11px] sm:text-xs tracking-[0.07em] tabular-nums"
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
            onAction();
          }}
          animate={{ y: isOpen && !reduce ? -14 : 0 }}
          whileTap={reduce || disabled ? undefined : { scale: 0.96 }}
          transition={transition}
          className="absolute right-[6.5%] top-[12%] z-30 flex size-8 sm:size-9 -translate-y-1/2 items-center justify-center rounded-full text-white/80 outline-none transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <EllipsisVertical className="size-4" aria-hidden="true" />
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
  type: "visa" | "mastercard";
  isDefault?: boolean;
  index?: number;
  compact?: boolean;
  onSetDefault?: (id: string) => void;
  onRemove?: (id: string) => void;
}

/**
 * Envuelve una tarjeta guardada (Admin o Cliente) dentro del sobre/billetera interactiva CardFolder de beUI.
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
  onSetDefault,
  onRemove,
}: LuminaCardFolderItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const isObsidian = index % 2 === 0;
  const digitsOnly = number.replace(/\D/g, "");
  const lastFour = digitsOnly.slice(-4).padStart(4, "4");
  const fullFormattedNumber =
    digitsOnly.length >= 12
      ? digitsOnly.match(/.{1,4}/g)?.join(" ") ?? `4532 8891 2041 ${lastFour}`
      : `4532 8891 2041 ${lastFour}`;
  const deterministicCvv = String(100 + ((parseInt(lastFour, 10) || 424) * 7) % 899);

  const cardSurface = (
    <div
      className={cn(
        "relative w-full h-full p-4 sm:p-5 flex flex-col justify-between text-white select-none overflow-hidden",
        isObsidian
          ? "bg-gradient-to-br from-[#161618] via-[#1f2023] to-[#0c0c0e]"
          : "bg-gradient-to-br from-[#4d533e] via-[#686e54] to-[#2e3224]"
      )}
    >
      {/* Brillo radial sutil en la tarjeta */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-25 blur-2xl"
        style={{
          background: isObsidian
            ? "radial-gradient(circle, #c49a3f 0%, transparent 70%)"
            : "radial-gradient(circle, #e2e8ce 0%, transparent 70%)",
        }}
      />

      {/* Cabecera de la tarjeta física (visible asomándose del sobre) */}
      <div className="relative z-10 flex items-center justify-between pr-7">
        <div className="flex items-center gap-2.5">
          {/* Chip EMV metálico */}
          <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-[#c59b27] via-[#f3d778] to-[#b38728] border border-yellow-200/60 shadow-inner flex items-center justify-center relative overflow-hidden">
            <div className="w-full h-[1px] bg-black/20 absolute top-1/2 -translate-y-1/2" />
            <div className="h-full w-[1px] bg-black/20 absolute left-1/3" />
            <div className="h-full w-[1px] bg-black/20 absolute right-1/3" />
          </div>
          <Wifi className="w-3.5 h-3.5 text-white/60 rotate-90" />
          {isDefault && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20">
              <CheckCircle2 className="w-2.5 h-2.5 text-[#d4e19c]" />
              Principal
            </span>
          )}
        </div>

        {/* Emblema de Red Bancaria */}
        <div className="flex items-center">
          {type === "mastercard" ? (
            <div className="flex items-center -space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#EB001B]/90 inline-block" />
              <span className="w-5 h-5 rounded-full bg-[#F79E1B]/90 inline-block" />
            </div>
          ) : (
            <span className="font-serif italic font-black text-sm tracking-wider text-white/95">
              VISA
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo central de la tarjeta con animación carácter por carácter @beui/text-animation */}
      <div className="relative z-10 my-auto pt-2 flex items-center justify-between gap-2">
        <BeUITextAnimation
          text={detailsVisible ? fullFormattedNumber : `•••• •••• •••• ${lastFour}`}
          animationKey={detailsVisible ? "revealed" : "masked"}
          direction={detailsVisible ? "up" : "down"}
          staggerMs={15}
          suffixLength={4}
          highlightOnReveal
          glyphClassName="text-white/95 font-semibold"
          suffixClassName="text-[#FFE4D1] font-bold"
          className="font-mono text-xs sm:text-sm tracking-[0.2em] drop-shadow-sm"
        />

        {/* Botón rápido de privacidad también en la tarjeta extraída */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playEnvelopeSound("reveal");
            setDetailsVisible((v) => !v);
          }}
          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-mono text-white/90 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
          title={detailsVisible ? "Ocultar CVV y número" : "Revelar CVV y número"}
        >
          <ShieldCheck className="w-3 h-3 text-[#FFE4D1]" />
          <BeUITextAnimation
            text={detailsVisible ? `CVV ${deterministicCvv}` : "CVV •••"}
            animationKey={detailsVisible ? "cvv-in-open" : "cvv-in-closed"}
            direction={detailsVisible ? "up" : "down"}
            staggerMs={18}
          />
        </button>
      </div>

      {/* Pie de la tarjeta con acciones rápidas al estar abierta */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/15 text-[10px]">
        <div className="truncate pr-2">
          <span className="text-white/55 uppercase tracking-wider text-[8px] block">
            Titular Verificado · EXP {exp}
          </span>
          <span className="font-semibold text-white/95 truncate block">
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
              className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors cursor-pointer"
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
              className="px-2 py-1 rounded-lg bg-red-500/25 hover:bg-red-500/45 text-red-100 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              title="Eliminar tarjeta"
            >
              <Trash2 className="w-3 h-3" />
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
        title={holder || "Titular Lumina"}
        cardNumber={number}
        expiry={exp}
        cvv={deterministicCvv}
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
