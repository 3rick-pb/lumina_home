"use client";

import { useEffect } from "react";

/**
 * UrlPreviewInhibitor
 * Inhabilita la barra flotante nativa del navegador en la esquina inferior izquierda
 * (URL status preview) al pasar el cursor sobre cualquier enlace de la web.
 */
export function UrlPreviewInhibitor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Al entrar con el cursor a un enlace, ocultamos el href del atributo DOM para que el navegador
    // no dibuje la burbuja de URL en la esquina inferior izquierda, preservando la navegación y el cursor.
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (href && !anchor.dataset.hiddenHref) {
        anchor.dataset.hiddenHref = href;
        anchor.removeAttribute("href");
        anchor.style.cursor = "pointer";
      }
    };

    // Al salir con el cursor, restauramos el href si es necesario
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.dataset.hiddenHref) return;

      anchor.setAttribute("href", anchor.dataset.hiddenHref);
      delete anchor.dataset.hiddenHref;
    };

    // Al hacer clic o presionar, restauramos el href inmediatamente para que la navegación se ejecute limpia
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.dataset.hiddenHref) return;

      anchor.setAttribute("href", anchor.dataset.hiddenHref);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.dataset.hiddenHref) return;

      anchor.setAttribute("href", anchor.dataset.hiddenHref);
    };

    document.addEventListener("mouseover", handleMouseOver, { capture: true, passive: true });
    document.addEventListener("mouseout", handleMouseOut, { capture: true, passive: true });
    document.addEventListener("mousedown", handlePointerDown, { capture: true, passive: true });
    document.addEventListener("click", handleClick, { capture: true, passive: true });

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, { capture: true });
      document.removeEventListener("mouseout", handleMouseOut, { capture: true });
      document.removeEventListener("mousedown", handlePointerDown, { capture: true });
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}
