"use client";

import { useEffect } from "react";

/**
 * useScrollAmbient
 * 
 * Desactivado para eliminar por completo re-renders y caídas de FPS durante el scroll.
 * En celulares, el fondo se mantiene como un lienzo mate estático sin cambios graduales de color.
 */
export function useScrollAmbient(..._args: unknown[]) {
  useEffect(() => {
    // Intencionalmente inactivo para garantizar 0% CPU/GPU overhead en scroll
    return () => {};
  }, []);
}
