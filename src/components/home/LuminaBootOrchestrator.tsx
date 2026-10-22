"use client";

import React, { useState, useEffect } from "react";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";

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
  // El boot splash screen solo se reproduce una única vez por sesión de navegación (frío).
  // Si el usuario ya inició sesión o está navegando internamente, no se repite desde 0.
  const [phase, setPhase] = useState<"loading" | "fading" | "done">(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("lumina_booted") === "true") {
      return "done";
    }
    return "loading";
  });

  useEffect(() => {
    if (phase === "done") {
      onReadyToAnimateText();
      return;
    }

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

      try {
        sessionStorage.setItem("lumina_booted", "true");
      } catch {}

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
  }, [activeHeroImageUrl, onReadyToAnimateText, phase]);

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* El Hero y la tienda se renderizan debajo desde el milisegundo 0 */}
      {children}

      {/* Pantalla de carga clásica única de corrido: desvanecimiento suave de 1000ms sin corte brusco */}
      {phase !== "done" && (
        <div
          style={{ willChange: "opacity" }}
          className={`fixed inset-0 z-[9999] transition-opacity duration-1000 ease-in-out ${
            phase === "fading"
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
          }`}
        >
          <BrandLoadingScreen isFixed={true} />
        </div>
      )}
    </div>
  );
}
