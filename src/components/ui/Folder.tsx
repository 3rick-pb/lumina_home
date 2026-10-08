"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Image as ImageIcon, Camera, Sparkles, Folder as FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FolderComponentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  color?: "black" | "white" | "blue" | "amber";
  size?: "xs" | "sm" | "md" | "lg";
  isHovered?: boolean;
}

const sizeDimensions = {
  xs: { width: 150, height: 120, scale: 0.8 },
  sm: { width: 170, height: 135, scale: 0.9 },
  md: { width: 190, height: 150, scale: 1 },
  lg: { width: 230, height: 180, scale: 1.2 },
} as const;

export const FolderComponent = ({
  color = "black",
  size = "md",
  isHovered: controlledHover,
  className,
  ...props
}: FolderComponentProps) => {
  const [internalHover, setInternalHover] = useState(false);
  const active = controlledHover !== undefined ? controlledHover : internalHover;
  const dim = sizeDimensions[size] || sizeDimensions.md;

  // Temas de color de alta fidelidad y contraste para modo oscuro
  const themeStyles = {
    black: {
      back: "bg-gradient-to-br from-[#2a2c3d] via-[#1c1d29] to-[#12131b] border-zinc-700/80 shadow-2xl",
      tab: "bg-[#2a2c3d] border-t border-l border-r border-zinc-600/70",
      flap: "bg-gradient-to-b from-[#252736]/95 via-[#1a1b26]/95 to-[#12131c]/98 border-zinc-600/70",
      flapHighlight: "border-t border-white/20",
      accent: "text-zinc-300",
      badge: "bg-white/10 text-zinc-200 border border-white/10",
      glow: "shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
    },
    blue: {
      back: "bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] border-blue-400/50 shadow-2xl shadow-blue-500/20",
      tab: "bg-[#2563eb] border-t border-l border-r border-blue-300/60",
      flap: "bg-gradient-to-b from-[#3b82f6]/95 via-[#2563eb]/95 to-[#1d4ed8]/98 border-blue-400/50",
      flapHighlight: "border-t border-cyan-200/40",
      accent: "text-cyan-200",
      badge: "bg-white/20 text-white border border-white/20",
      glow: "shadow-[0_8px_32px_rgba(37,99,235,0.35)]",
    },
    amber: {
      back: "bg-gradient-to-br from-[#d97706] via-[#b45309] to-[#78350f] border-amber-400/50 shadow-2xl shadow-amber-500/20",
      tab: "bg-[#d97706] border-t border-l border-r border-amber-300/60",
      flap: "bg-gradient-to-b from-[#f59e0b]/95 via-[#d97706]/95 to-[#b45309]/98 border-amber-400/50",
      flapHighlight: "border-t border-amber-100/40",
      accent: "text-amber-100",
      badge: "bg-white/20 text-white border border-white/20",
      glow: "shadow-[0_8px_32px_rgba(217,119,6,0.35)]",
    },
    white: {
      back: "bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-300 border-zinc-300 shadow-xl",
      tab: "bg-zinc-100 border-t border-l border-r border-zinc-300",
      flap: "bg-gradient-to-b from-white/95 via-zinc-100/95 to-zinc-200/98 border-zinc-300",
      flapHighlight: "border-t border-white/80",
      accent: "text-zinc-700",
      badge: "bg-zinc-800 text-white border border-zinc-700",
      glow: "shadow-[0_8px_24px_rgba(0,0,0,0.15)]",
    },
  }[color] || {
    back: "bg-gradient-to-br from-[#2a2c3d] via-[#1c1d29] to-[#12131b] border-zinc-700/80 shadow-2xl",
    tab: "bg-[#2a2c3d] border-t border-l border-r border-zinc-600/70",
    flap: "bg-gradient-to-b from-[#252736]/95 via-[#1a1b26]/95 to-[#12131c]/98 border-zinc-600/70",
    flapHighlight: "border-t border-white/20",
    accent: "text-zinc-300",
    badge: "bg-white/10 text-zinc-200 border border-white/10",
    glow: "shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
  };

  return (
    <div
      data-slot="folder"
      onMouseEnter={() => setInternalHover(true)}
      onMouseLeave={() => setInternalHover(false)}
      className={cn(
        "relative flex items-center justify-center select-none cursor-pointer",
        className
      )}
      style={{
        width: dim.width,
        height: dim.height,
      }}
      {...props}
    >
      {/* Contenedor con perspectiva 3D para apertura natural */}
      <div 
        className="relative w-full h-full flex items-end justify-center"
        style={{ perspective: 1000 }}
      >
        {/* 1. CARA POSTERIOR DE LA CARPETA (Back plate con solapa superior) */}
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl border transition-all duration-300 flex flex-col justify-start",
            themeStyles.back,
            themeStyles.glow
          )}
        >
          {/* Pestaña superior izquierda de la carpeta */}
          <div 
            className={cn(
              "absolute -top-3 left-2.5 w-16 h-4 rounded-t-lg transition-colors",
              themeStyles.tab
            )}
          />
        </div>

        {/* 2. TARJETAS DE CONTENIDO MULTIMEDIA (Miniaturas estilizadas de fotos) */}
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center pointer-events-none z-10">
          {/* Tarjeta 1 (Izquierda: Foto Twilight Sunset) */}
          <motion.div
            className="absolute rounded-xl overflow-hidden border border-white/30 shadow-2xl p-1 bg-zinc-900/90 backdrop-blur-md"
            style={{ width: dim.width * 0.44, height: dim.height * 0.62 }}
            animate={{
              y: active ? -dim.height * 0.38 : -6,
              x: active ? -dim.width * 0.18 : -8,
              rotate: active ? -13 : -4,
              scale: active ? 1.05 : 0.96,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 22,
            }}
          >
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col justify-between p-1 relative overflow-hidden shadow-inner">
              <div className="flex justify-between items-center text-white/90">
                <Camera className="w-2.5 h-2.5" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
              </div>
              <div className="w-full h-1 bg-white/30 rounded-full" />
            </div>
          </motion.div>

          {/* Tarjeta 3 (Derecha: Foto Golden Hour / Sunny) */}
          <motion.div
            className="absolute rounded-xl overflow-hidden border border-white/30 shadow-2xl p-1 bg-zinc-900/90 backdrop-blur-md"
            style={{ width: dim.width * 0.44, height: dim.height * 0.62 }}
            animate={{
              y: active ? -dim.height * 0.36 : -8,
              x: active ? dim.width * 0.18 : 8,
              rotate: active ? 14 : 5,
              scale: active ? 1.05 : 0.96,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 22,
            }}
          >
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex flex-col justify-between p-1 relative overflow-hidden shadow-inner">
              <div className="flex justify-between items-center text-white/90">
                <Sparkles className="w-2.5 h-2.5" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
              </div>
              <div className="w-full h-1 bg-white/30 rounded-full" />
            </div>
          </motion.div>

          {/* Tarjeta 2 (Centro: Foto Ocean / Aurora - Se eleva más alta) */}
          <motion.div
            className="absolute rounded-xl overflow-hidden border border-white/40 shadow-2xl p-1 bg-zinc-900/95 backdrop-blur-md z-10"
            style={{ width: dim.width * 0.46, height: dim.height * 0.66 }}
            animate={{
              y: active ? -dim.height * 0.50 : -12,
              x: 0,
              rotate: active ? 0 : 0.5,
              scale: active ? 1.08 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 20,
              delay: active ? 0.02 : 0,
            }}
          >
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 flex flex-col justify-between p-1 relative overflow-hidden shadow-inner">
              <div className="flex justify-between items-center text-white/90">
                <ImageIcon className="w-3 h-3" />
                <span className="text-[7px] font-mono font-bold tracking-tight bg-black/30 px-1 py-0.2 rounded text-cyan-100">
                  HD
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="w-3/4 h-1 bg-white/50 rounded-full" />
                <div className="w-1/2 h-0.5 bg-white/30 rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* 3. SOLAPA FRONTAL DE LA CARPETA (Front flap con bisagra 3D) */}
        <motion.div
          className={cn(
            "absolute inset-x-0 bottom-0 rounded-b-2xl rounded-t-xl border backdrop-blur-md z-20 flex flex-col justify-between p-2.5 transition-shadow",
            themeStyles.flap,
            themeStyles.flapHighlight
          )}
          style={{
            height: dim.height * 0.74,
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
          }}
          animate={{
            rotateX: active ? -24 : 0,
            y: active ? 3 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 18,
          }}
        >
          {/* Muesca superior elegante de la solapa */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 opacity-80">
              <FolderIcon className={cn("w-3.5 h-3.5", themeStyles.accent)} />
              <div className="w-8 h-1 rounded-full bg-white/20" />
            </div>
            <div className={cn("w-2 h-2 rounded-full", themeStyles.badge)} />
          </div>

          {/* Borde inferior estilizado */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] font-mono text-zinc-400">
            <span className="w-10 h-0.5 bg-white/10 rounded-full" />
            <span className="w-4 h-0.5 bg-white/10 rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FolderComponent;
export { FolderComponent as Folder };
