"use client";

import React, { useRef, useEffect } from "react";
import { MODE_FRAMES, resolvePreset, scaleRadii, scaleCounts } from "thinking-orbs";

export interface BrandLoadingScreenProps {
  className?: string;
  isFixed?: boolean;
}

/**
 * Renderizador de alta resolución nativa para ThinkingOrb a 132px.
 * Genera el frame vectorial directamente a escala de 132px con soporte Retina (DPR 2x/3x),
 * eliminando por completo cualquier pixelado, distorsión o estiramiento de canvas.
 */
function CrispThinkingOrb({ size = 132 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(3, typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const { mode, speed: baseSpeed, opts: presetOpts } = resolvePreset("working", 64);
    // Densidad y radio de partículas afinados para la escala nativa de 132px
    let opts = scaleRadii(presetOpts, 1.25);
    opts = scaleCounts(opts, 1.15);

    const frameFn = MODE_FRAMES[mode];
    const effSpeed = baseSpeed;

    let rafId = 0;
    let isRunning = true;

    const render = (timeMs: number) => {
      const tSec = (timeMs / 1000) * effSpeed;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const frame = frameFn(size, tSec, opts);

      if (frame.lines && frame.lines.length > 0) {
        for (const l of frame.lines) {
          const alpha = l.a ?? 1;
          const w = Math.min(1, Math.max(0, l.white));
          const g = Math.round(w * 35);
          ctx.strokeStyle = `rgba(${g}, ${g}, ${g}, ${alpha})`;
          ctx.lineWidth = l.w;
          ctx.beginPath();
          ctx.moveTo(l.x1, l.y1);
          ctx.lineTo(l.x2, l.y2);
          ctx.stroke();
        }
      }

      for (const d of frame.dots) {
        const alpha = d.a ?? 1;
        const w = Math.min(1, Math.max(0, d.white));
        // Tinta negra obsidiana profunda de alto contraste con relieve tridimensional
        const g = Math.round(w * 35);
        ctx.fillStyle = `rgba(${g}, ${g}, ${g}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isRunning) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Cargando Lumina"
      className="block select-none"
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Pantalla de carga unificada de la marca Lumina con ThinkingOrb en resolución nativa nítida
 */
export function BrandLoadingScreen({
  className = "",
  isFixed = true,
}: BrandLoadingScreenProps) {
  const containerClass = isFixed
    ? "fixed inset-0 z-[9999]"
    : "relative w-full min-h-[70vh]";

  return (
    <div
      className={`${containerClass} flex items-center justify-center bg-[#fbfaf8] dark:bg-[#121214] transition-all duration-300 select-none ${className}`}
    >
      {/* Ambient background glows */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/[0.08] via-[#8c9276]/[0.09] to-amber-300/[0.06] blur-3xl pointer-events-none animate-pulse duration-1000" />

      {/* Center ThinkingOrb en resolución nativa de 132px (sin reescalado CSS, máxima nitidez Retina) */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <CrispThinkingOrb size={132} />
      </div>
    </div>
  );
}

export default BrandLoadingScreen;
