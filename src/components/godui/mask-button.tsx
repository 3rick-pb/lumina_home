"use client";

import * as React from "react";

export type MaskButtonMask = "nature" | "urban" | "forest";
export type MaskButtonVariant = "primary" | "secondary";
export type MaskButtonSize = "sm" | "md" | "lg";

export interface MaskButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Sprite-sheet mask animated on hover or cooldown to reveal/restore the label */
  mask?: MaskButtonMask;
  variant?: MaskButtonVariant;
  size?: MaskButtonSize;
  /** Whether the button is actively in its cooldown period */
  isCooling?: boolean;
  /** Cooldown duration in milliseconds (default: 3000ms) */
  cooldownDuration?: number;
  /** Callback fired when the cooldown completes */
  onCooldownEnd?: () => void;
}

const MASK_ASSETS: Record<MaskButtonMask, string> = {
  nature: "/godui/mask-nature.png",
  urban: "/godui/mask-nature.png", // fallback to nature asset if needed
  forest: "/godui/mask-nature.png",
};

const maskSteps: Record<MaskButtonMask, { sizeClass: string; steps: number }> = {
  nature: {
    sizeClass: "[mask-size:2300%_100%] [-webkit-mask-size:2300%_100%]",
    steps: 22,
  },
  urban: {
    sizeClass: "[mask-size:3000%_100%] [-webkit-mask-size:3000%_100%]",
    steps: 29,
  },
  forest: {
    sizeClass: "[mask-size:7100%_100%] [-webkit-mask-size:7100%_100%]",
    steps: 70,
  },
};

const sizeClasses: Record<MaskButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl",
  md: "px-4 py-2 text-sm rounded-2xl",
  lg: "px-5 py-2.5 text-base rounded-2xl",
};

export const MaskButton = React.forwardRef<HTMLButtonElement, MaskButtonProps>(
  (
    {
      className = "",
      children,
      mask = "nature",
      variant = "primary",
      size = "md",
      isCooling = false,
      cooldownDuration = 3000,
      onCooldownEnd,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const [localCooling, setLocalCooling] = React.useState(false);
    const [animationKey, setAnimationKey] = React.useState(0);

    const activeCooling = isCooling || localCooling;

    const onCooldownEndRef = React.useRef(onCooldownEnd);
    React.useEffect(() => {
      onCooldownEndRef.current = onCooldownEnd;
    }, [onCooldownEnd]);

    // Preload mask assets immediately on mount
    React.useEffect(() => {
      const asset = MASK_ASSETS[mask] || MASK_ASSETS.nature;
      if (typeof window !== "undefined" && asset) {
        const img = new window.Image();
        img.src = asset;
      }
    }, [mask]);

    const isRunningRef = React.useRef(false);

    // Handle cooldown timer: strictly runs once per cooldown trigger, immune to parent re-renders
    React.useEffect(() => {
      if (activeCooling && !isRunningRef.current) {
        isRunningRef.current = true;
        setAnimationKey((prev) => prev + 1);
        const timer = setTimeout(() => {
          isRunningRef.current = false;
          setLocalCooling(false);
          onCooldownEndRef.current?.();
        }, cooldownDuration);
        return () => {
          clearTimeout(timer);
          isRunningRef.current = false;
        };
      } else if (!activeCooling) {
        isRunningRef.current = false;
      }
    }, [activeCooling, cooldownDuration]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (activeCooling || disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    const cfg = maskSteps[mask] || maskSteps.nature;
    const assetUrl = MASK_ASSETS[mask] || MASK_ASSETS.nature;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || activeCooling}
        onClick={handleClick}
        data-cooling={activeCooling ? "true" : undefined}
        className={`group relative isolate inline-flex cursor-pointer items-center justify-center overflow-hidden font-semibold transition-all duration-200 select-none outline-none [-webkit-tap-highlight-color:transparent] active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 shadow-xs border ${
          /* Base Layer: White in Light Mode / Black in Dark Mode */
          "bg-white text-gray-900 border-gray-200/90 dark:bg-[#121214] dark:text-white dark:border-white/10"
        } ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {/* Base Layer Text (Revealed when top mask clears) */}
        <span className="relative z-0 inline-flex items-center gap-1.5 font-bold">
          {children}
        </span>

        {/* Top Masked Face:
            Light mode: Black with white text
            Dark mode: White with black text
            At rest: Mask is at 0 0 (covering the base)
            When cooling starts: Starts at 100% 0 (wiped away) and animates back to 0 0 over cooldownDuration
        */}
        <span
          key={animationKey}
          aria-hidden="true"
          className={`absolute inset-0 z-[1] inline-flex items-center justify-center font-bold [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat] ${
            /* Top Layer: Black in Light Mode / White in Dark Mode */
            "bg-[#09090b] text-white dark:bg-white dark:text-[#09090b]"
          } ${cfg.sizeClass} ${
            activeCooling
              ? ""
              : "group-hover:opacity-90"
          }`}
          style={{
            maskImage: `url("${assetUrl}")`,
            WebkitMaskImage: `url("${assetUrl}")`,
            ...(activeCooling
              ? {
                  animation: `mask-button-out ${cooldownDuration}ms steps(${cfg.steps}) forwards`,
                  willChange: "mask-position, -webkit-mask-position",
                }
              : {
                  maskPosition: "0% 0",
                  WebkitMaskPosition: "0% 0",
                }),
          }}
        >
          <span className="inline-flex items-center gap-1.5">{children}</span>
        </span>
      </button>
    );
  }
);

MaskButton.displayName = "MaskButton";
