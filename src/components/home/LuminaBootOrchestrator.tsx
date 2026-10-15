"use client";

import React, { useState, useEffect } from "react";

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
  const [progress, setProgress] = useState(15);
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    // Si ya cargó en esta sesión, mostrar directo sin repetir el splash
    if (typeof window !== "undefined" && sessionStorage.getItem("lumina_booted") === "1") {
      setPhase("done");
      onReadyToAnimateText();
      return;
    }

    if (!activeHeroImageUrl) return;

    let isMounted = true;

    // Simulación suave de barra de progreso hasta el 85% mientras decodifica el Hero
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 85 ? prev + 8 : prev));
    }, 120);

    // 1. Tiempo mínimo estético (950ms) para que el loader no parpadee brusco
    const minAestheticTime = new Promise<void>((resolve) =>
      setTimeout(resolve, 950)
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

    // 3. Límite máximo de seguridad (2400ms) para nunca bloquear conexiones lentas
    const safetyTimeout = new Promise<void>((resolve) =>
      setTimeout(resolve, 2400)
    );

    Promise.race([
      Promise.all([minAestheticTime, decodeHeroImage]),
      safetyTimeout,
    ]).then(() => {
      clearInterval(progressInterval);
      if (!isMounted) return;

      // Completar barra al 100% e iniciar el desvanecimiento suave
      setProgress(100);
      try {
        sessionStorage.setItem("lumina_booted", "1");
      } catch {}

      setTimeout(() => {
        if (!isMounted) return;
        setPhase("fading");
        // Disparar la animación caligráfica "Espacios diseñados para perdurar" justo al abrirse el telón
        onReadyToAnimateText();

        // Desmontar el splash una vez terminada la transición de 700ms
        setTimeout(() => {
          if (isMounted) setPhase("done");
        }, 700);
      }, 120);
    });

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [activeHeroImageUrl, onReadyToAnimateText]);

  return (
    <div className="relative min-h-screen bg-[#FAF8F5]">
      {/* El Hero y la tienda se renderizan debajo desde el milisegundo 0 */}
      {children}

      {/* Pantalla de carga superpuesta con desvanecimiento suave */}
      {phase !== "done" && (
        <div
          style={{ willChange: "opacity, transform" }}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF8F5] transition-all duration-700 ease-out ${
            phase === "fading"
              ? "opacity-0 scale-[1.02] pointer-events-none"
              : "opacity-100 scale-100"
          }`}
        >
          <div className="flex flex-col items-center gap-4 px-8 py-7 rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-black/[0.04]">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-black/10 text-lg font-serif font-semibold text-zinc-900">
              L
            </div>
            <span className="text-[11px] font-semibold tracking-[0.28em] text-zinc-700 uppercase">
              LUMINA
            </span>
            <div className="w-28 h-[3px] rounded-full bg-zinc-200 overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-zinc-900 transition-all duration-200 ease-out rounded-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
