"use client";

import React, { useRef, useEffect, useState } from "react";
import { setCursorLightConfig, MetalFx, useMetalBend } from "metal-fx";
import MicrosoftExcel from "@thesvg/react/microsoft-excel";
import { X } from "lucide-react";
import { motion } from "framer-motion";

// Disable cursor reflection globally as requested by user
if (typeof window !== "undefined") {
  try {
    setCursorLightConfig({ cursor: false });
  } catch {
    // Ignore in non-browser environments
  }
}

interface MetalFxExcelButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

function InnerMetalButton({ isOpen, onToggle, isMobile }: MetalFxExcelButtonProps) {
  const metalRef = useRef<HTMLDivElement>(null);
  useMetalBend(metalRef);

  const size = isMobile ? 44 : 48;

  return (
    <MetalFx
      ref={metalRef}
      preset="chromatic"
      variant="circle"
      innerShadow
      strength={0.90}
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
      }}
      className="relative z-50 shrink-0 flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label="Exportar datos a Excel"
        title={isOpen ? "Cerrar menú" : "Exportar reportes a Excel (.xlsx)"}
        className="w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 bg-transparent"
      >
        <motion.div
          animate={{
            rotate: isOpen ? 90 : 0,
            scale: isOpen ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 20 }}
          className="relative z-10 flex items-center justify-center select-none"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-rose-400 stroke-[2.4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
          ) : (
            <MicrosoftExcel className="w-5 h-5 sm:w-5.5 sm:h-5.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] transition-transform duration-200" />
          )}
        </motion.div>
      </button>
    </MetalFx>
  );
}

export function MetalFxExcelButton(props: MetalFxExcelButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    const size = props.isMobile ? 44 : 48;
    return (
      <div
        style={{ width: size, height: size, borderRadius: "9999px" }}
        className="relative z-50 shrink-0 flex items-center justify-center bg-[#18181b] shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
      >
        <button
          type="button"
          onClick={props.onToggle}
          className="w-full h-full rounded-full flex items-center justify-center bg-transparent"
        >
          <MicrosoftExcel className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-emerald-400" />
        </button>
      </div>
    );
  }

  return <InnerMetalButton {...props} />;
}

export default MetalFxExcelButton;
