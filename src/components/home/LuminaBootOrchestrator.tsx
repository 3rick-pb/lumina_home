"use client";

import React, { useState, useEffect } from "react";
import { LuminaBrandEmblem } from "@/components/ui/LuminaBrandEmblem";

interface LuminaBootOrchestratorProps {
  activeHeroImageUrl: string;
  onReadyToAnimateText: () => void;
  children: React.ReactNode;
}

export function LuminaBootOrchestrator({
  activeHeroImageUrl,
  onReadyToAnimateText,
  children,
}: LuminaBootOrchestratorProps) {
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    if (!activeHeroImageUrl) return;

    let isMounted = true;

    // 1. Tiempo mínimo estético (800ms) para que el loader clásico se aprecie de corrido
    const minAestheticTime = new Promise<void>((resolve) =>
      setTimeout(resolve, 800)
    );

    // 2. Descarga y decodificación real en GPU de la imagen del Hero de la hora actual
    const decodeHeroImage = new Promise<void>((resolve) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = activeHeroImageUrl;

      const done = () => resolve();

      if (typeof img.decode === "function") {
        img
          .decode()
          .then(done)
          .catch(() => {
            if (img.complete) done();
            else {
              img.onload = done;
              img.onerror = done;
            }
          });
      } else {
        img.onload = done;
        img.onerror = done;
      }
    });

    // 3. Límite máximo de seguridad (2200ms) para nunca bloquear conexiones lentas
    const safetyTimeout = new Promise<void>((resolve) =>
      setTimeout(resolve, 2200)
    );

    Promise.race([
      Promise.all([minAestheticTime, decodeHeroImage]),
      safetyTimeout,
    ]).then(() => {
      if (!isMounted) return;

      // Iniciar el desvanecimiento ultra suave de 1000ms
      setPhase("fading");
      // Disparar la animación caligráfica "Espacios diseñados para perdurar" justo al abrirse el telón
      onReadyToAnimateText();

      // Desmontar el splash una vez terminada la transición suave de 1000ms
      setTimeout(() => {
        if (isMounted) setPhase("done");
      }, 1000);
    });

    return () => {
      isMounted = false;
    };
  }, [activeHeroImageUrl, onReadyToAnimateText]);

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* El Hero y la tienda se renderizan debajo desde el milisegundo 0 */}
      {children}

      {/* Pantalla de carga clásica única de corrido: desvanecimiento suave de 1000ms sin corte brusco */}
      {phase !== "done" && (
        <div
          style={{ willChange: "opacity" }}
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#fbfaf8] dark:bg-[#121214] transition-opacity duration-1000 ease-in-out select-none ${
            phase === "fading"
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
          }`}
        >
          {/* Ambient background glows */}
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/[0.08] via-[#8c9276]/[0.09] to-amber-300/[0.06] blur-3xl pointer-events-none animate-pulse duration-1000" />
          
          {/* Center Luxury Monogram Capsule - Animación clásica con el anillo giratorio */}
          <div className="relative z-10 flex flex-col items-center gap-5 p-8 rounded-3xl border border-black/[0.04] dark:border-white/10 bg-white/70 dark:bg-[#1c1c1f]/70 shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
            {/* Animated Brand Ring con efecto girando al rededor */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl border-2 border-black/[0.06] dark:border-white/10" />
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-[#8c9276] dark:border-t-amber-400 animate-spin" />
              <div className="w-10 h-10 rounded-xl bg-[#080C26] text-[#FFE4D1] border border-[#FFE4D1]/30 flex items-center justify-center shadow-md shadow-black/50 select-none">
                <LuminaBrandEmblem size={24} />
              </div>
            </div>

            {/* Brand Caption */}
            <div className="text-center space-y-1">
              <p className="font-display font-semibold text-sm tracking-widest uppercase text-gray-900 dark:text-gray-100">
                LUMINA
              </p>
            </div>

            {/* Shimmering Line Indicator */}
            <div className="w-32 h-[2px] bg-black/[0.06] dark:bg-white/10 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#8c9276] dark:via-amber-400 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
