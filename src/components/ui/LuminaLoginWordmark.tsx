"use client";

import React from "react";
import Image from "next/image";

interface LuminaLoginWordmarkProps {
  className?: string;
}

/**
 * Renderiza el logotipo tipográfico exacto de Lumina ("Lumina" con ligadura caligráfica en la 'u'
 * y serifas Didone de alto contraste) tal cual la referencia oficial de marca para el Login.
 */
export function LuminaLoginWordmark({ className = "" }: LuminaLoginWordmarkProps) {
  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      aria-label="Lumina"
    >
      <Image
        src="/brand/lumina-wordmark.png"
        alt="Lumina"
        width={1058}
        height={272}
        priority
        className="w-[215px] sm:w-[255px] h-auto object-contain dark:invert"
      />
    </div>
  );
}
