"use client";

import React from "react";
import { Blobatar } from "@blobatar/react";

export interface BlobatarAvatarProps {
  name?: string | null;
  size?: number;
  animate?: "hover" | "always";
  background?: "squircle" | "circle" | "square" | false;
  role?: "ADMIN" | "USER" | string;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
  showGlow?: boolean;
}

export function BlobatarAvatar({
  name,
  size = 40,
  animate = "hover",
  background = "squircle",
  role,
  className = "",
  title,
  onClick,
  showGlow = false,
}: BlobatarAvatarProps) {
  // Ensure a stable, non-empty string seed for deterministic avatar generation
  const seed = (name && name.trim().length > 0) ? name.trim() : "lumina-client";

  const isAdmin = role === "ADMIN";

  return (
    <div
      onClick={onClick}
      title={title || (isAdmin ? "Administrador Lumina" : "Cliente Lumina")}
      style={{ width: size, height: size }}
      className={`relative shrink-0 flex items-center justify-center select-none transition-transform duration-200 ${
        onClick ? "cursor-pointer hover:scale-105 active:scale-95" : ""
      } ${
        showGlow
          ? isAdmin
            ? "shadow-[0_0_16px_rgba(245,158,11,0.28)]"
            : "shadow-[0_0_16px_rgba(16,185,129,0.22)]"
          : ""
      } ${className}`}
    >
      <div 
        className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden"
        style={{
          borderRadius: background === "circle" ? "9999px" : background === "squircle" ? `${Math.round(size * 0.32)}px` : undefined
        }}
      >
        <Blobatar
          name={seed}
          size={size}
          animate={animate || undefined}
          background={background}
          title={title}
        />
      </div>

      {/* Role Ring Indicator for Admins */}
      {isAdmin && (
        <span 
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[1.5px] rounded-2xl border border-amber-400/50 dark:border-amber-400/40 shadow-xs"
          style={{
            borderRadius: background === "circle" ? "9999px" : background === "squircle" ? `${Math.round(size * 0.36)}px` : undefined
          }}
        />
      )}
    </div>
  );
}
