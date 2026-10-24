"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";
import { forceResetScroll } from "@/components/layout/ScrollToTop";
import { useBootStore } from "@/lib/bootStore";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

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
  const { setBootPhase, hasBootedInSpa } = useBootStore();
  const [mounted, setMounted] = useState(false);

  // Si ya booteó en la memoria de la SPA (navegación interna), empieza directo en "done"
  // para no reproducir la pantalla de carga de nuevo al regresar a / desde /shop, /profile, etc.
  const [phase, setPhase] = useState<"loading" | "fading" | "done">(() => {
    return hasBootedInSpa() ? "done" : "loading";
  });

  const onReadyRef = useRef(onReadyToAnimateText);
  useEffect(() => {
    onReadyRef.current = onReadyToAnimateText;
  }, [onReadyToAnimateText]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Forzar reseteo de scroll al inicio en el arranque previo a la pintura
  useIsomorphicLayoutEffect(() => {
    forceResetScroll();
  }, []);

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
      (img as any).fetchPriority = "high";
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

    // 3. Esperar decodificación tipográfica (evita FOUT y saltos visuales en el título caligráfico)
    const fontPromise =
      typeof document !== "undefined" && document.fonts && document.fonts.ready
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();

    // 4. Límite máximo de seguridad (2200ms) para nunca bloquear conexiones lentas
    const safetyTimeout = new Promise<void>((resolve) =>
      setTimeout(resolve, 2200)
    );

    Promise.race([
      Promise.all([minAestheticTime, decodeHeroImage, fontPromise]),
      safetyTimeout,
    ]).then(() => {
      if (!isMounted) return;

      // Esperar un frame de rAF para que la GPU pinte el frame antes del fade-out
      requestAnimationFrame(() => {
        if (!isMounted) return;

        // Iniciar el desvanecimiento ultra suave de 1000ms y notificar a los componentes sincronizados (Header, etc.)
        setPhase("fading");
        setBootPhase("fading");
        // Disparar la animación caligráfica "Espacios diseñados para perdurar" justo al abrirse el telón
        onReadyRef.current();

        // Desmontar el splash una vez terminada la transición suave de 1000ms
        setTimeout(() => {
          if (isMounted) {
            setPhase("done");
            setBootPhase("done");
          }
        }, 1000);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [activeHeroImageUrl, phase, setBootPhase]);

  const overlayElement =
    phase !== "done" ? (
      <div
        style={{ willChange: "opacity" }}
        className={`fixed inset-0 z-[99999] transition-opacity duration-1000 ease-in-out ${
          phase === "fading"
            ? "opacity-0 pointer-events-none"
            : "opacity-100 pointer-events-auto"
        }`}
      >
        <BrandLoadingScreen isFixed={true} />
      </div>
    ) : null;

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* El Hero y la tienda se renderizan debajo desde el milisegundo 0 */}
      {children}

      {/* Pantalla de carga clásica única de corrido: desvanecimiento suave de 1000ms sin corte brusco.
          En el cliente montado se portaliza directamente a document.body para garantizar que quede por
          encima de cualquier stacking context (incluyendo navegación fija y barras de scroll).
          En SSR se renderiza inline como fallback inicial de frame 0. */}
      {mounted && typeof document !== "undefined" && overlayElement
        ? createPortal(overlayElement, document.body)
        : overlayElement}
    </div>
  );
}
