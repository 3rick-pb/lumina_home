"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sunrise, Sun, Sunset, CloudMoon, Moon, Clock, Check, Sparkles } from "lucide-react";
import { HeroPhaseId, HeroPhase } from "@/hooks/useHeroTimePhase";

interface HeroTimePillProps {
  phaseId: HeroPhaseId;
  isAuto: boolean;
  formattedTime: string;
  onSelectPhase: (phaseId: HeroPhaseId | "auto") => void;
  phases: Record<HeroPhaseId, HeroPhase>;
  phaseOrder: HeroPhaseId[];
}

const PHASE_ICONS: Record<HeroPhaseId, React.ComponentType<{ className?: string }>> = {
  amanecer: Sunrise,
  mediodia: Sun,
  atardecer: Sunset,
  crepusculo: CloudMoon,
  noche: Moon,
};

export function HeroTimePill({
  phaseId,
  isAuto,
  formattedTime,
  onSelectPhase,
  phases,
  phaseOrder,
}: HeroTimePillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePhase = phases[phaseId];
  const IconComponent = PHASE_ICONS[phaseId] || Sun;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex z-30 select-none">
      {/* Trigger Button: Glass Morphism Pill */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full overflow-hidden border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/15 backdrop-blur-xl text-white text-xs sm:text-xs font-medium shadow-sm transition-all duration-300 group cursor-pointer [isolation:isolate] transform-gpu"
        title="Cambiar hora del día o ver en tiempo real"
      >
        <div 
          className="absolute inset-0 bg-white/5 pointer-events-none transform-gpu"
          style={{ willChange: "transform, backdrop-filter", WebkitBackdropFilter: "blur(16px)" }}
        />

        <span className="relative z-10 flex items-center gap-1.5">
          <IconComponent className="w-3.5 h-3.5 text-amber-300 transition-transform duration-300 group-hover:rotate-12" />
          <span className="font-semibold tracking-wide">{activePhase.label}</span>
          
          <span className="text-white/40 text-[10px]">•</span>

          <span className="text-white/80 font-mono text-[11px]">
            {isAuto ? (formattedTime || "Auto") : "Manual"}
          </span>

          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isAuto ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            }`}
          />
        </span>
      </motion.button>

      {/* Dropdown Menu with Instant Blur & Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-64 rounded-2xl bg-[#14151a]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_1px_rgba(255,255,255,0.2)] p-2 z-50 text-white overflow-hidden transform-gpu"
            style={{ willChange: "transform, opacity" }}
          >
            {/* Header info */}
            <div className="px-2.5 py-1.5 mb-1 border-b border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Iluminación Lumina
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                {formattedTime ? `Hora local: ${formattedTime}` : ""}
              </span>
            </div>

            {/* Auto (Real Time) Mode Button */}
            <button
              type="button"
              onClick={() => {
                onSelectPhase("auto");
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                isAuto
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <div className="leading-tight">Automático (Tiempo Real)</div>
                  <div className="text-[10px] text-white/50">Sincroniza con el reloj de tu ciudad</div>
                </div>
              </div>
              {isAuto && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <div className="my-1 border-t border-white/10" />

            {/* The 5 Phases */}
            <div className="space-y-0.5">
              {phaseOrder.map((key) => {
                const phase = phases[key];
                const ItemIcon = PHASE_ICONS[key] || Sun;
                const isCurrent = !isAuto && phaseId === key;

                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => {
                      onSelectPhase(key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-white/15 text-white font-medium"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className="w-3.5 h-3.5 text-amber-300" />
                      <div>
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span>{phase.label}</span>
                          <span className="text-[10px] text-white/40 font-mono">({phase.timeRange})</span>
                        </div>
                        <div className="text-[10px] text-white/50">{phase.description}</div>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
