"use client";

import React, { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { motion } from "framer-motion";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useThemeStore, ThemeMode, getResolvedTheme } from "@/lib/themeStore";
import { useUserStore } from "@/lib/userStore";

/* ============================================================================
 * Official @beui/theme-toggle (variant="circle-blur") View Transition Styles
 * ============================================================================ */
const BEUI_CIRCLE_BLUR_STYLE_ID = "beui-theme-toggle-circle-blur-vt";
const BEUI_CIRCLE_BLUR_CSS = `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

html[data-beui-vt] *,
html[data-beui-vt] *::before,
html[data-beui-vt] *::after {
  transition-duration: 0ms !important;
  transition-delay: 0ms !important;
}

html[data-beui-vt="circle-blur"]::view-transition-new(root) {
  animation: beui-circle-blur-reveal 680ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes beui-circle-blur-reveal {
  from {
    clip-path: circle(0% at var(--beui-vt-origin, 50% 50%));
    filter: blur(8px);
  }
  to {
    clip-path: circle(150% at var(--beui-vt-origin, 50% 50%));
    filter: blur(0px);
  }
}
`;

function ensureCircleBlurStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(BEUI_CIRCLE_BLUR_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = BEUI_CIRCLE_BLUR_STYLE_ID;
  style.textContent = BEUI_CIRCLE_BLUR_CSS;
  document.head.appendChild(style);
}

export function executeCircleBlurThemeTransition(
  nextMode: ThemeMode,
  setMode: (mode: ThemeMode, userId?: string) => void,
  userId?: string,
  event?: React.MouseEvent<HTMLElement>,
  anchorEl?: HTMLElement | null
) {
  ensureCircleBlurStyles();

  const nextResolved: "light" | "dark" = getResolvedTheme(nextMode);

  if (typeof document === "undefined") {
    setMode(nextMode, userId);
    return;
  }

  const html = document.documentElement;
  const targetEl = anchorEl || (event?.currentTarget as HTMLElement | null);
  let originX = window.innerWidth / 2;
  let originY = window.innerHeight / 2;

  if (event && event.clientX > 0 && event.clientY > 0) {
    originX = event.clientX;
    originY = event.clientY;
  } else if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
  }

  html.style.setProperty("--beui-vt-origin", `${originX}px ${originY}px`);

  const applyUpdate = () => {
    flushSync(() => {
      setMode(nextMode, userId);
    });
    // Never apply .dark to <html> so storefront routes (/shop, /, Header, Footer) never flash dark.
    // Dark Mode is strictly scoped via wrapper <div className="dark"> inside Mi Perfil and CartDrawer.
    html.classList.remove("dark");
    html.style.colorScheme = "light";
  };

  type DocumentWithVT = Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  const docWithVT = document as DocumentWithVT;

  if (typeof docWithVT.startViewTransition !== "function") {
    applyUpdate();
    return;
  }

  html.dataset.beuiVt = "circle-blur";
  try {
    const vt = docWithVT.startViewTransition(() => {
      applyUpdate();
    });
    vt.finished.finally(() => {
      delete html.dataset.beuiVt;
    });
  } catch {
    delete html.dataset.beuiVt;
    applyUpdate();
  }
}

/* ============================================================================
 * @beui/theme-toggle (variant="circle-blur") Standalone Icon Button
 * ============================================================================ */
export interface BeUIThemeToggleCircleBlurProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function BeUIThemeToggleCircleBlur({
  className = "",
  size = "md",
  showLabel = false,
}: BeUIThemeToggleCircleBlurProps) {
  const { mode, setMode } = useThemeStore();
  const user = useUserStore((state) => state.user);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    ensureCircleBlurStyles();
  }, []);

  const isDark = getResolvedTheme(mode) === "dark";

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextMode: ThemeMode = isDark ? "light" : "dark";
    executeCircleBlurThemeTransition(nextMode, setMode, user?.id, e, btnRef.current);
  };

  const sizeClasses =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : "h-10 w-10 text-sm";

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleToggle}
      title={isDark ? "Cambiar a modo Claro (Circle Blur)" : "Cambiar a modo Oscuro (Circle Blur)"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`group relative inline-flex items-center justify-center rounded-full border border-gray-200/80 dark:border-white/15 bg-white/90 dark:bg-[#161920]/90 text-gray-900 dark:text-white shadow-sm hover:border-gray-300 dark:hover:border-[#ccff00]/50 hover:shadow-md active:scale-95 transition-all cursor-pointer select-none ${
        showLabel ? "px-3.5 py-2 gap-2.5 h-10" : sizeClasses
      } ${className}`}
    >
      {/* @beui/action-swap Icon Blur Swap (Sun <-> Moon) */}
      <span className="relative inline-grid place-items-center w-5 h-5">
        <span
          aria-hidden={isDark || undefined}
          style={{
            transform: isDark ? "scale(0.5) rotate(-60deg)" : "scale(1) rotate(0deg)",
            opacity: isDark ? 0 : 1,
            filter: isDark ? "blur(4px)" : "blur(0px)",
            transition:
              "transform 380ms cubic-bezier(0.22, 1.3, 0.36, 1), opacity 240ms ease, filter 240ms ease",
          }}
          className="col-start-1 row-start-1 flex items-center justify-center text-amber-500"
        >
          <Sun className="w-4 h-4 fill-amber-500/20" />
        </span>
        <span
          aria-hidden={!isDark || undefined}
          style={{
            transform: isDark ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(60deg)",
            opacity: isDark ? 1 : 0,
            filter: isDark ? "blur(0px)" : "blur(4px)",
            transition:
              "transform 380ms cubic-bezier(0.22, 1.3, 0.36, 1), opacity 240ms ease, filter 240ms ease",
          }}
          className="col-start-1 row-start-1 flex items-center justify-center text-[#ccff00]"
        >
          <Moon className="w-4 h-4 fill-[#ccff00]/20" />
        </span>
      </span>

      {showLabel && (
        <span className="text-xs font-bold tracking-tight">
          {isDark ? "Oscuro" : "Claro"}
        </span>
      )}
    </button>
  );
}

/* ============================================================================
 * ThemeToggle Control with Circle-Blur View Transition (@beui/theme-toggle)
 * ============================================================================ */
export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    ensureCircleBlurStyles();
  }, []);

  const options: { id: ThemeMode; icon: React.ElementType; label: string }[] = [
    { id: "light", icon: Sun, label: "Claro" },
    { id: "auto", icon: Sparkles, label: "Auto" },
    { id: "dark", icon: Moon, label: "Oscuro" },
  ];

  return (
    <div className="relative flex items-center bg-[#e5e5e5]/80 dark:bg-[#1a1a1a]/80 backdrop-blur-3xl rounded-full p-1.5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.06),inset_0_4px_4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_12px_rgba(0,0,0,0.4),inset_0_4px_4px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/5 w-full max-w-[340px] transition-colors duration-500 select-none">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = mode === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={(e) =>
              executeCircleBlurThemeTransition(
                option.id,
                setMode,
                user?.id,
                e,
                e.currentTarget
              )
            }
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold transition-colors duration-300 cursor-pointer rounded-full ${
              isActive
                ? "text-gray-950 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-knob"
                className="absolute inset-0 rounded-full bg-white dark:bg-[#2c2c2e] shadow-[0_3px_12px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_3px_12px_rgba(0,0,0,0.4)] border border-black/[0.04] dark:border-white/10"
                initial={false}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Icon
                className={`w-4 h-4 transition-colors duration-300 ${
                  isActive ? "text-amber-500 dark:text-[#ccff00]" : ""
                }`}
              />
              <span className="tracking-wide">{option.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

