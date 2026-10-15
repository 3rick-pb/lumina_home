"use client";

import { memo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { HERO_PHASES, HeroPhaseId } from "@/hooks/useHeroTimePhase";

export interface DynamicHeroBackgroundProps {
  activePhaseId?: HeroPhaseId;
  displayedPeriod?: HeroPhaseId | null;
  previousPeriod?: HeroPhaseId | null;
  isHeroReady?: boolean;
}

/**
 * DynamicHeroBackground:
 * - Doble buffer para transición suave entre fases
 * - Movimiento suave e inercial slow-motion con Lenis y listener táctil adaptativo
 * - Degradado original brand-900 verde bosque suave
 */
export const DynamicHeroBackground = memo(function DynamicHeroBackground({
  activePhaseId,
  displayedPeriod,
  previousPeriod,
  isHeroReady = true,
}: DynamicHeroBackgroundProps) {
  // Resuelve la temporalidad activa y la previa del doble buffer
  const effectivePeriod = displayedPeriod !== undefined ? displayedPeriod : activePhaseId;
  const prevPeriod = previousPeriod ?? null;

  const activePhase = isHeroReady && effectivePeriod ? HERO_PHASES[effectivePeriod] : null;
  const prevPhase = prevPeriod ? HERO_PHASES[prevPeriod] : null;

  const heroParallaxRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // Efecto de desplazamiento suave (parallax) para la imagen del Hero:
  // - Activo en TODOS los dispositivos: Celulares, Tablets y Desktops.
  // - En móviles y pantallas táctiles: adaptado ergonómicamente a la velocidad y distancia de arrastre del dedo (ratio 0.16) para que se mueva con elegancia natural sin dar tirones.
  // - En laptops/desktops con ratón/trackpad: desplazamiento slow-motion inercial (ratio 0.28).
  // - Sincronizado a través de requestAnimationFrame con el VSYNC del display (120Hz / 60Hz nativos) para garantizar CERO lag y CERO caídas de FPS.
  const applyParallax = (currentScroll: number) => {
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (!heroParallaxRef.current) return;
      if (typeof window === "undefined") return;

      const vh = window.innerHeight || 800;
      if (currentScroll <= vh * 1.35) {
        const isMobileOrTouch =
          window.innerWidth < 768 ||
          (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
        const factor = isMobileOrTouch ? 0.16 : 0.28;
        const slowTranslateY = currentScroll * factor;
        heroParallaxRef.current.style.transform = `translate3d(0, ${slowTranslateY.toFixed(1)}px, 0)`;
      }
    });
  };

  // 1. Lenis scroll listener
  useLenis(({ scroll }) => {
    applyParallax(scroll);
  });

  // 2. Listener nativo pasivo de respaldo para asegurar activación instantánea al arrastrar con el dedo en cualquier celular
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      applyParallax(window.scrollY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [contain:paint] bg-brand-900">
      {/* Contenedor con movimiento suave e inercial Lenis y escala estática en GPU */}
      <div ref={heroParallaxRef} className="absolute inset-0 pointer-events-none select-none will-change-transform transform-gpu scale-[1.06] origin-center">
        {/* 1. Capa de Fondo (Doble Buffer - Imagen Anterior durante transición) */}
        {prevPhase && (
          <div
            key={`hero-buffer-prev-${prevPhase.id}`}
            className="absolute inset-0 z-0 pointer-events-none select-none transform-gpu"
          >
            <img
              src={prevPhase.imageSrc}
              alt={`Lumina Home - ${prevPhase.label}`}
              decoding="async"
              className="w-full h-full object-cover pointer-events-none select-none transform-gpu"
            />
          </div>
        )}

        {/* 2. Capa Frontal Activa (Doble Buffer - Imagen Nueva con Crossfade de 700ms) */}
        {activePhase && (
          <motion.div
            key={`hero-buffer-active-${activePhase.id}`}
            initial={prevPhase ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 pointer-events-none select-none transition-opacity duration-700 ease-out transform-gpu"
          >
            <img
              src={activePhase.imageSrc}
              alt={`Lumina Home - ${activePhase.label}`}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover pointer-events-none select-none transform-gpu"
            />
          </motion.div>
        )}
      </div>

      {/* 3. Original Lumina Brand Gradient Overlay (matches Original.png 100%) */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-transparent pointer-events-none z-20" />
    </div>
  );
});
