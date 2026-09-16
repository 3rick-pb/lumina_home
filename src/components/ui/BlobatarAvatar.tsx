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

  const borderRadius = background === "circle" 
    ? "9999px" 
    : background === "squircle" 
      ? `${Math.round(size * 0.28)}px` 
      : undefined;

  return (
    <div
      onClick={onClick}
      title={title || (isAdmin ? "Administrador Lumina" : "Cliente Lumina")}
      style={{ 
        width: size, 
        height: size,
        borderRadius 
      }}
      className={`relative shrink-0 flex items-center justify-center select-none overflow-hidden transition-all duration-200 ${
        onClick ? "cursor-pointer hover:scale-105 active:scale-95" : ""
      } ${
        isAdmin 
          ? "ring-1.5 ring-amber-400/60 dark:ring-amber-400/50" 
          : "ring-1 ring-black/5 dark:ring-white/10"
      } ${
        showGlow
          ? isAdmin
            ? "shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            : "shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          : ""
      } ${className}`}
    >
      <Blobatar
        name={seed}
        size={size}
        animate={animate || undefined}
        background={background}
        title={title}
      />
    </div>
  );
}
