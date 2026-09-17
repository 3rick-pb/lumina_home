"use client";

import React, { useState } from "react";
import { 
  Compass, 
  Sparkles, 
  Clock, 
  Layers, 
  Plus, 
  Trash2, 
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmbeddedCarouselConfig, EmbeddedCarouselSlide } from "@/lib/catalogStore";

interface EmbeddedCarouselConfiguratorProps {
  config?: EmbeddedCarouselConfig;
  onChange: (newConfig: EmbeddedCarouselConfig) => void;
  productImagesCount?: number;
}

export function EmbeddedCarouselConfigurator({
  config = {
    enabled: true,
    title: "Atmósfera & Edición Visual",
    subtitle: "Perspectiva sensorial y atmósfera espacial de esta pieza",
    autoplaySpeed: 3.5,
  },
  onChange,
  productImagesCount = 1,
}: EmbeddedCarouselConfiguratorProps) {
  const [isCustomMode, setIsCustomMode] = useState(
    Boolean(config.slides && config.slides.length > 0)
  );

  const isEnabled = config.enabled !== false;
  const currentTitle = config.title ?? "Atmósfera & Edición Visual";
  const currentSubtitle = config.subtitle ?? "Perspectiva sensorial y atmósfera espacial de esta pieza";
  const currentSpeed = config.autoplaySpeed ?? 3.5;
  const currentSlides = config.slides ?? [];

  const handleToggleEnabled = () => {
    onChange({
      ...config,
      enabled: !isEnabled,
    });
  };

  const handleTitleChange = (title: string) => {
    onChange({
      ...config,
      title,
    });
  };

  const handleSubtitleChange = (subtitle: string) => {
    onChange({
      ...config,
      subtitle,
    });
  };

  const handleSpeedChange = (speed: number) => {
    onChange({
      ...config,
      autoplaySpeed: speed,
    });
  };

  const handleAddSlide = () => {
    const newSlide: EmbeddedCarouselSlide = {
      image: "",
      tag: "EDICIÓN",
      title: "VISTA EDITORIAL",
      subtitle: "LUMINA HOME",
      theme: "photo_overlay",
    };
    onChange({
      ...config,
      slides: [...currentSlides, newSlide],
    });
  };

  const handleRemoveSlide = (idx: number) => {
    const updated = currentSlides.filter((_, i) => i !== idx);
    onChange({
      ...config,
      slides: updated.length > 0 ? updated : undefined,
    });
  };

  const handleUpdateSlide = (idx: number, updated: Partial<EmbeddedCarouselSlide>) => {
    const next = currentSlides.map((s, i) => (i === idx ? { ...s, ...updated } : s));
    onChange({
      ...config,
      slides: next,
    });
  };

  const PRESET_SPEEDS = [
    { label: "2.5s Rápido", val: 2.5 },
    { label: "3.5s Óptimo", val: 3.5 },
    { label: "5.0s Relajado", val: 5 },
    { label: "7.0s Pausado", val: 7 },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-black/20 border border-gray-200/80 dark:border-white/10 space-y-4">
      {/* Header with Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80 dark:border-white/10">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center shrink-0 mt-0.5">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Carrusel Embebido Cilíndrico 3D
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#8c9276]/15 text-[#8c9276] border border-[#8c9276]/30 font-bold">
                Efecto Video
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Sección inmersiva a lo ancho de la ficha donde las imágenes pasan curvándose a lo largo de un cilindro horizontal 3D.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {isEnabled ? "Activado" : "Desactivado"}
          </span>
          <button
            type="button"
            onClick={handleToggleEnabled}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              isEnabled ? "bg-[#8c9276]" : "bg-gray-300 dark:bg-gray-700"
            )}
            role="switch"
            aria-checked={isEnabled}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                isEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {isEnabled && (
        <div className="space-y-4 animate-fade-in">
          {/* Wireframe Preview of Cylinder Ribbon */}
          <div className="w-full h-24 rounded-xl bg-[#0f100e] p-2 border border-white/10 relative overflow-hidden flex items-center justify-center">
            <div 
              className="relative flex items-center justify-center gap-2"
              style={{ perspective: 600, transformStyle: "preserve-3d" }}
            >
              <div 
                className="w-12 h-14 rounded-lg bg-[#3e4534] border border-white/20 opacity-40 shadow-sm"
                style={{ transform: "rotateY(35deg) translateZ(-20px)" }}
              />
              <div 
                className="w-14 h-16 rounded-xl bg-[#1e201b] border border-[#8c9276] opacity-70 shadow-md"
                style={{ transform: "rotateY(18deg) translateZ(-8px)" }}
              />
              <div 
                className="w-16 h-18 rounded-xl bg-[#8c9276] border-2 border-white/60 shadow-xl flex items-center justify-center text-white"
                style={{ transform: "rotateY(0deg) translateZ(10px)" }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div 
                className="w-14 h-16 rounded-xl bg-[#e8eae0] border border-black/20 opacity-70 shadow-md"
                style={{ transform: "rotateY(-18deg) translateZ(-8px)" }}
              />
              <div 
                className="w-12 h-14 rounded-lg bg-[#252723] border border-white/20 opacity-40 shadow-sm"
                style={{ transform: "rotateY(-35deg) translateZ(-20px)" }}
              />
            </div>

            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/15 text-[9px] font-mono font-bold text-[#ccff00]">
              CURVATURA 3D CILÍNDRICA
            </div>
          </div>

          {/* Titles Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Título de la Sección Embebida
              </label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej: Atmósfera & Edición Visual"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-white dark:bg-[#202023] text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Subtítulo Descriptivo
              </label>
              <input
                type="text"
                value={currentSubtitle}
                onChange={(e) => handleSubtitleChange(e.target.value)}
                placeholder="Ej: Perspectiva sensorial y atmósfera espacial"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-white dark:bg-[#202023] text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Speed Configuration */}
          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8c9276]" />
                Velocidad de rotación automática
              </label>
              <span className="text-xs font-mono font-bold text-[#8c9276] px-2 py-0.5 rounded-md bg-[#8c9276]/10 border border-[#8c9276]/20">
                {currentSpeed}s por tarjeta
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_SPEEDS.map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => handleSpeedChange(preset.val)}
                  className={cn(
                    "text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                    currentSpeed === preset.val
                      ? "bg-[#8c9276] text-white border-[#8c9276] shadow-sm"
                      : "bg-white dark:bg-[#1f2022] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Mode Selector: Autopilot vs Custom */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#8c9276]" />
                Modo de Generación de Tarjetas
              </label>
              <button
                type="button"
                onClick={() => {
                  if (isCustomMode) {
                    setIsCustomMode(false);
                    onChange({ ...config, slides: undefined });
                  } else {
                    setIsCustomMode(true);
                    if (currentSlides.length === 0) {
                      handleAddSlide();
                    }
                  }
                }}
                className="text-[11px] font-semibold text-[#8c9276] hover:underline cursor-pointer"
              >
                {isCustomMode ? "← Volver a Curaduría Automática" : "+ Configurar tarjetas personalizadas"}
              </button>
            </div>

            {!isCustomMode ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Curaduría Automática Inteligente Activa
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  El sistema genera automáticamente las 6 tarjetas editoriales en curva 3D utilizando las fotos del producto ({productImagesCount} fotos disponibles) y los sellos de autor de Lumina Home (Madrid/Sevilla, split 0034-0095, marco passepartout y fecha 2026/NOV) idénticas al video de referencia.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-mono">
                    {currentSlides.length} tarjetas personalizadas configuradas
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#8c9276] px-2.5 py-1 rounded-lg border border-[#8c9276]/30 bg-[#8c9276]/10 hover:bg-[#8c9276]/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Añadir tarjeta
                  </button>
                </div>

                {currentSlides.map((slide, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#1a1b18] border border-gray-200 dark:border-white/10 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-gray-900 dark:text-white">
                        Tarjeta 0{sIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlide(sIdx)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Eliminar tarjeta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-gray-500 font-semibold mb-1">
                          URL de Imagen
                        </label>
                        <input
                          type="text"
                          value={slide.image}
                          onChange={(e) => handleUpdateSlide(sIdx, { image: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-stone-50 dark:bg-[#202022]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold mb-1">
                          Etiqueta / Tag
                        </label>
                        <input
                          type="text"
                          value={slide.tag || ""}
                          onChange={(e) => handleUpdateSlide(sIdx, { tag: e.target.value })}
                          placeholder="Ej: MADRID, THU"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-stone-50 dark:bg-[#202022]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold mb-1">
                          Título Principal
                        </label>
                        <input
                          type="text"
                          value={slide.title || ""}
                          onChange={(e) => handleUpdateSlide(sIdx, { title: e.target.value })}
                          placeholder="Ej: BARCELONA, NORTH AVE"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-stone-50 dark:bg-[#202022]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold mb-1">
                          Subtítulo / Serie
                        </label>
                        <input
                          type="text"
                          value={slide.subtitle || ""}
                          onChange={(e) => handleUpdateSlide(sIdx, { subtitle: e.target.value })}
                          placeholder="Ej: 0034 — 0095"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-stone-50 dark:bg-[#202022]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmbeddedCarouselConfigurator;
