"use client";

import React, { useState, useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const themes = {
  black: {
    backFill: "black",
    backInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.37 0",
    backInsetShadow: "inset 0 0 6px 2px rgba(255,255,255,0.37)",
    flapFill: "#292929",
    flapFillOpacity: 0.25,
    flapStroke: "#979797",
    flapInsetColor: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0",
    cardFill: "#F1F1F1",
    cardStroke: "#E0E0E0",
    cardLineFill: "#D4D4D4",
    cardInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0",
  },
  white: {
    backFill: "#ffffff",
    backInsetColor: "0 0 0 0 0.7 0 0 0 0 0.7 0 0 0 0 0.7 0 0 0 0.25 0",
    backInsetShadow: "inset 0 0 6px 2px rgba(178,178,178,0.25)",
    flapFill: "#f5f5f5",
    flapFillOpacity: 0.85,
    flapStroke: "#d4d4d4",
    flapInsetColor: "0 0 0 0 0.6 0 0 0 0 0.6 0 0 0 0 0.6 0 0 0 0.15 0",
    cardFill: "#262626",
    cardStroke: "#404040",
    cardLineFill: "#737373",
    cardInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0",
  },
  blue: {
    backFill: "#50B1FD",
    backInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0",
    backInsetShadow: "inset 0 0 6px 2px rgba(255,255,255,0.35)",
    flapFill: "#3a9ae8",
    flapFillOpacity: 0.45,
    flapStroke: "#7ec8ff",
    flapInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.12 0",
    cardFill: "#F1F1F1",
    cardStroke: "#E0E0E0",
    cardLineFill: "#D4D4D4",
    cardInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0",
  },
} as const;

const sizeScales = {
  xs: 0.42,
  sm: 0.58,
  md: 0.88,
  lg: 1.2,
} as const;

type FolderComponentProps = Omit<React.ComponentProps<"div">, "color"> & {
  color?: "black" | "white" | "blue";
  size?: "xs" | "sm" | "md" | "lg";
  isHovered?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

const BASE_WIDTH = 321;
const BASE_HEIGHT = 270;

const FLAP_PATH =
  "M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z";

const FolderComponent = ({
  color = "blue",
  size = "md",
  isHovered: externalHover,
  isOpen: externalOpen,
  onOpenChange,
  onClick,
  className,
  ...props
}: FolderComponentProps) => {
  const theme = themes[color] ?? themes.blue;
  const scale = sizeScales[size] ?? sizeScales.md;
  const [internalHover, setInternalHover] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const isHovered = externalHover !== undefined ? externalHover : internalHover;
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const uid = useId().replace(/:/g, "_");
  const flapFilterId = `filter0_i_171_13_${uid}`;

  const handleToggle = (e: React.MouseEvent<HTMLDivElement>) => {
    const next = !isOpen;
    if (externalOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
    onClick?.(e);
  };

  return (
    <div
      data-slot="folder"
      className={cn(
        "relative flex items-center justify-center select-none overflow-visible",
        className,
      )}
      {...props}
    >
      <div
        className="relative cursor-pointer select-none"
        style={{
          width: BASE_WIDTH * scale,
          height: BASE_HEIGHT * scale,
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
        onMouseEnter={() => setInternalHover(true)}
        onMouseLeave={() => {
          setInternalHover(false);
          if (externalOpen === undefined) {
            setInternalOpen(false);
          }
          onOpenChange?.(false);
        }}
        onClick={handleToggle}
      >
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
            perspective: 800 * scale,
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              style={{
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
                borderRadius: 25,
                backgroundColor: theme.backFill,
                boxShadow: theme.backInsetShadow,
              }}
            />
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <motion.div
              className="absolute"
              animate={{
                y: isOpen ? -160 : isHovered ? -30 : -10,
                x: isOpen ? 70 : 40,
                rotate: isOpen ? 18 : isHovered ? 14 : 10,
              }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 13,
                delay: isOpen ? 0.1 : isHovered ? 0.12 : 0,
              }}
            >
              <Card id={1} theme={theme} uid={uid} />
            </motion.div>
            <motion.div
              className="absolute"
              animate={{
                y: isOpen ? -180 : isHovered ? -35 : -20,
                x: isOpen ? 0 : 3,
                rotate: isOpen ? -3 : isHovered ? -1 : 2,
              }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 13,
                delay: isOpen ? 0.05 : isHovered ? 0.06 : 0,
              }}
            >
              <Card id={2} theme={theme} uid={uid} />
            </motion.div>
            <motion.div
              className="absolute"
              animate={{
                y: isOpen ? -170 : isHovered ? -44 : -22,
                x: isOpen ? -65 : -40,
                rotate: isOpen ? -14 : isHovered ? -9 : -5,
              }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 13,
                delay: isOpen ? 0 : 0,
              }}
            >
              <Card id={3} theme={theme} uid={uid} />
            </motion.div>
          </div>

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[14.5px]"
            style={{
              transformOrigin: "bottom center",
              transformStyle: "preserve-3d",
              width: 321,
              height: 241,
            }}
            animate={{ rotateX: isOpen ? -55 : isHovered ? -45 : -15 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                clipPath: `path('${FLAP_PATH}')`,
                WebkitClipPath: `path('${FLAP_PATH}')`,
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                willChange: "transform",
              }}
            />
            {/* Franja semitransparente cerca del cierre de la carpeta (visible en hover/zoom, se desvanece al salir) */}
            <motion.div
              className="absolute inset-x-0 top-0 pointer-events-none"
              style={{
                height: 52,
                background: "linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 55%, transparent 100%)",
                clipPath: `path('${FLAP_PATH}')`,
                WebkitClipPath: `path('${FLAP_PATH}')`,
                transform: "translateZ(1px)",
              }}
              animate={{ opacity: isHovered || isOpen ? 1 : 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
            <svg
              className="absolute inset-0"
              width="321"
              height="241"
              viewBox="0 0 321 241"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter={`url(#${flapFilterId})`}>
                <path
                  d={FLAP_PATH}
                  fill={theme.flapFill}
                  fillOpacity={theme.flapFillOpacity}
                />
                <path
                  d="M0.5 216V25C0.5 11.469 11.469 0.5 25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216"
                  stroke={theme.flapStroke}
                  fill="none"
                />
              </g>
              <defs>
                <filter
                  id={flapFilterId}
                  x="-25.4"
                  y="-25.4"
                  width="371.8"
                  height="291.8"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    result="shape"
                  />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset />
                  <feGaussianBlur stdDeviation="2.65" />
                  <feComposite
                    in2="hardAlpha"
                    operator="arithmetic"
                    k2="-1"
                    k3="1"
                  />
                  <feColorMatrix type="matrix" values={theme.flapInsetColor} />
                  <feBlend
                    mode="normal"
                    in2="shape"
                    result="effect1_innerShadow_171_13"
                  />
                </filter>
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FolderComponent;

export { FolderComponent as Folder };
export type { FolderComponentProps };

type Theme = (typeof themes)[keyof typeof themes];

const Card = ({ id, theme, uid }: { id: number; theme: Theme; uid: string }) => {
  const filterId = `filter0_i_card_${id}_${uid}`;
  return (
    <div data-slot="folder-card">
      <svg
        width="164"
        height="214"
        viewBox="0 0 164 214"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#${filterId})`}>
          <rect
            width="163.078"
            height="213.262"
            rx="20"
            fill={theme.cardFill}
          />
        </g>
        <rect
          x="0.5"
          y="0.5"
          width="162.078"
          height="212.262"
          rx="19.5"
          stroke={theme.cardStroke}
        />
        {/* 3 líneas píldora horizontales gruesas idénticas a rareUI oficial */}
        <rect
          x="18"
          y="32"
          width="128"
          height="14"
          rx="7"
          fill={theme.cardLineFill}
        />
        <rect
          x="18"
          y="54"
          width="96"
          height="13"
          rx="6.5"
          fill={theme.cardLineFill}
        />
        <rect
          x="18"
          y="75"
          width="82"
          height="13"
          rx="6.5"
          fill={theme.cardLineFill}
        />
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="166.078"
            height="218.262"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="2"
              operator="erode"
              in="SourceAlpha"
              result={`effect1_innerShadow_${id}`}
            />
            <feOffset dx="3" dy="5" />
            <feGaussianBlur stdDeviation="3.05" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values={theme.cardInsetColor} />
            <feBlend
              mode="normal"
              in2="shape"
              result={`effect1_innerShadow_${id}`}
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
};
