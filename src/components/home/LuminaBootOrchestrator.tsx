"use client";

import React, { useState, useEffect, useRef } from "react";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";

interface LuminaBootOrchestratorProps {
  activeHeroImageUrl: string;
  onReadyToAnimateText: () => void;
  children: React.ReactNode;
}

// Bandera de módulo: el splash de arranque solo se reproduce una vez por sesión de navegación.
// Se resetea al cerrar sesión (via userStore), garantizando que el próximo login lo vea de nuevo.
// sessionStorage key "lumina_booted" es limpiada por userStore en logout para resetear el estado.
let hasBootedThisSession = false;

function isAlreadyBooted(): boolean {
  if (hasBootedThisSession) return true;
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem("lumina_booted") === "true";
  } catch {
    return false;
  }
}

export function LuminaBootOrchestrator({
  activeHeroImageUrl,
  onReadyToAnimateText,
  children,
}: LuminaBootOrchestratorProps) {
  // Si ya booteó esta sesión (navegación interna), empieza directo en "done" para no reproducir
  // la pantalla de carga de nuevo al regresar a / desde /shop, /profile, etc.
  const [phase, setPhase] = useState<"loading" | "fading" | "done">(
    isAlreadyBooted() ? "done" : "loading"
  );

  const onReadyRef = useRef(onReadyToAnimateText);
  useEffect(() => {
    onReadyRef.current = onReadyToAnimateText;
  }, [onReadyToAnimateText]);

  useEffect(() => {
    // Si ya está en "done" (navegación interna de vuelta al home), invocar callback inmediatamente
    if (phase === "done") {
      onReadyRef.current();
      return;
    }

    if (!activeHeroImageUrl) return;

    let isMounted = true;

    // 1. Tiempo mínimo estético (800ms) para que el loader de ThinkingOrb se aprecie con elegancia
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
      onReadyRef.current();

      // Desmontar el splash una vez terminada la transición suave de 1000ms
      setTimeout(() => {
        if (isMounted) {
          hasBootedThisSession = true;
          try { sessionStorage.setItem("lumina_booted", "true"); } catch {}
          setPhase("done");
        }
      }, 1000);
    });

    return () => {
      isMounted = false;
    };
  }, [activeHeroImageUrl]);

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
