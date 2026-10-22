"use client";

import React, { useRef, useEffect, useState } from "react";
import { setCursorLightConfig, MetalFx, useMetalBend, resumeShared, pauseShared, redrawInstance } from "metal-fx";
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

  // Keep WebGL chromatic loop smooth and continuously rendering without freezing
  useEffect(() => {
    const keepLoopAlive = () => {
      try {
        pauseShared();
        resumeShared();
        const canvas = metalRef.current?.querySelector("canvas.metal-fx-canvas") as HTMLCanvasElement | null;
        if (canvas) {
          redrawInstance(canvas);
        }
      } catch {
        // Safe fallback
      }
    };

    keepLoopAlive();

    const onFocus = () => keepLoopAlive();
    const onVis = () => {
      if (!document.hidden) keepLoopAlive();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", onFocus);

    // Continuous heartbeat ensuring the chromatic loop never halts or pauses unexpectedly
    const interval = setInterval(keepLoopAlive, 500);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onFocus);
      clearInterval(interval);
    };
  }, []);

  const size = isMobile ? 44 : 48;

  return (
    <div
      onPointerEnter={() => {
        try {
          resumeShared();
          const canvas = metalRef.current?.querySelector("canvas.metal-fx-canvas") as HTMLCanvasElement | null;
          if (canvas) redrawInstance(canvas);
        } catch {}
      }}
      className="inline-flex items-center justify-center shrink-0"
    >
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
    </div>
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
