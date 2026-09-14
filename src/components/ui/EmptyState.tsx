"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  badge?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  badge,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-8 sm:p-14 border border-black/[0.05] dark:border-white/10 bg-gradient-to-b from-white/90 via-[#faf8f4]/80 to-[#f2eee7]/50 dark:from-[#202023]/90 dark:via-[#1a1a1d]/80 dark:to-[#141416]/60 shadow-[0_16px_40px_rgba(0,0,0,0.03)] backdrop-blur-2xl text-center flex flex-col items-center justify-center transition-all ${className}`}
    >
      {/* Ambient Radial Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-amber-500/[0.07] via-[#8c9276]/[0.08] to-amber-300/[0.05] blur-3xl pointer-events-none" />
      <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-black/[0.05] dark:via-white/15 to-transparent pointer-events-none" />

      {/* Optional Badge */}
      {badge && (
        <div className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/10 text-gray-600 dark:text-gray-300 text-[11px] font-semibold tracking-wider uppercase mb-5">
          <Sparkles className="w-3 h-3 text-[#8c9276]" />
          <span>{badge}</span>
        </div>
      )}

      {/* Floating 3D Pedestal with Icon */}
      {Icon && (
        <div className="relative mb-6 group cursor-default">
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black/[0.06] dark:bg-white/[0.05] rounded-full blur-md" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-white via-[#faf7f2] to-[#ede7dc] dark:from-[#2a2a2e] dark:via-[#222226] dark:to-[#1a1a1e] border-2 border-white dark:border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.05)] flex items-center justify-center transition-transform duration-500 hover:scale-105">
            <Icon className="w-9 h-9 sm:w-11 sm:h-11 text-gray-800 dark:text-gray-100 stroke-[1.4]" />
          </div>
        </div>
      )}

      {/* Title & Description */}
      <div className="relative z-10 max-w-md space-y-2 mb-8">
        <h3 className="font-display font-bold text-xl sm:text-2xl text-gray-950 dark:text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        {actionLabel && (
          actionHref ? (
            <Link
              href={actionHref}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md active:scale-95 cursor-pointer text-center"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {actionLabel}
            </button>
          )
        )}

        {secondaryActionLabel && (
          secondaryActionHref ? (
            <Link
              href={secondaryActionHref}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-gray-800 dark:text-gray-200 text-xs font-semibold border border-black/[0.06] dark:border-white/10 transition-all active:scale-95 cursor-pointer text-center"
            >
              {secondaryActionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-gray-800 dark:text-gray-200 text-xs font-semibold border border-black/[0.06] dark:border-white/10 transition-all active:scale-95 cursor-pointer"
            >
              {secondaryActionLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}
