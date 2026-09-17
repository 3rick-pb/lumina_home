"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Compass, 
  Sparkles, 
  Clock, 
  Layers, 
  RotateCcw, 
  Check, 
  Image as ImageIcon,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmbeddedCarouselConfig, EmbeddedCarouselSlide } from "@/lib/catalogStore";

interface EmbeddedCarouselConfiguratorProps {
  config?: EmbeddedCarouselConfig;
  onChange: (newConfig: EmbeddedCarouselConfig) => void;
  productImages?: string[];
  productImagesCount?: number;
  productTitle?: string;
  category?: string;
}

interface CardArchetype {
  theme: "photo_overlay" | "dark_typography" | "split_numbers" | "framed" | "minimal_date";
  name: string;
  tabLabel: string;
  defaultTag: string;
  defaultSubtitle: string;
  code?: string;
  desc: string;
}

const CARD_ARCHETYPES: CardArchetype[] = [
  {
    theme: "photo_overlay",
    name: "01 • Foto Editorial",
    tabLabel: "01 Editorial",
    defaultTag: "EDICIÓN",
    defaultSubtitle: "VISTA PRINCIPAL",
    desc: "Fotografía a sangrado con badge y perspectiva visual",
  },
  {
    theme: "dark_typography",
    name: "02 • Tipografía Carbón",
    tabLabel: "02 Tipografía",
    defaultTag: "DISEÑO",
    defaultSubtitle: "ACABADO DE AUTOR",
    code: "PIEZA DESTACADA",
    desc: "Fondo carbón de autor con tipografía monoespaciada",
  },
  {
    theme: "split_numbers",
    name: "03 • Split Bicolor",
    tabLabel: "03 Split",
    defaultTag: "DETALLE",
    defaultSubtitle: "PERSPECTIVA Y TEXTURA",
    code: "ORIGINAL",
    desc: "Mitad foto de textura y mitad distintivo editorial",
  },
  {
    theme: "framed",
    name: "04 • Marco Geométrico",
    tabLabel: "04 Geometría",
    defaultTag: "GEOMETRÍA",
    defaultSubtitle: "PROPORCIÓN Y EQUILIBRIO",
    desc: "Encuadre de autor con isotipo concéntrico dinámico",
  },
  {
    theme: "photo_overlay",
    name: "05 • Passepartout Tonal",
    tabLabel: "05 Passepartout",
    defaultTag: "ATMÓSFERA",
    defaultSubtitle: "ESPACIO Y ARMONÍA",
    desc: "Fotografía con marco tonal y perspectiva de espacio",
  },
  {
    theme: "minimal_date",
    name: "06 • Edición Destacada",
    tabLabel: "06 Destacada",
    defaultTag: "COLECCIÓN",
    defaultSubtitle: "PIEZA DE CATÁLOGO",
    code: "ESENCIAL",
    desc: "Gran formato tipográfico con sello de catálogo",
  },
];

const PRESET_SPEEDS = [
  { label: "2.5s Rápido", val: 2.5 },
  { label: "3.5s Óptimo", val: 3.5 },
  { label: "5.0s Relajado", val: 5 },
  { label: "7.0s Pausado", val: 7 },
];

export function EmbeddedCarouselConfigurator({
  config = {
    enabled: true,
    title: "Atmósfera & Edición Visual",
    subtitle: "Perspectiva sensorial y atmósfera espacial de esta pieza",
    autoplaySpeed: 3.5,
  },
  onChange,
  productImages = [],
  productImagesCount = 1,
  productTitle = "",
  category = "Colección",
}: EmbeddedCarouselConfiguratorProps) {
  const isEnabled = config.enabled !== false;
  const currentTitle = config.title ?? "Atmósfera & Edición Visual";
  const currentSubtitle = config.subtitle ?? "Perspectiva sensorial y atmósfera espacial de esta pieza";
  const currentSpeed = config.autoplaySpeed ?? 3.5;

  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);

  // Helper to calculate the 6 effective slides
  const getEffectiveSlides = (): EmbeddedCarouselSlide[] => {
    return CARD_ARCHETYPES.map((archetype, idx) => {
      const existing = config.slides?.[idx];
      const fallbackImg = productImages[idx % (productImages.length || 1)] || "";
      return {
        image: existing?.image !== undefined && existing.image !== "" ? existing.image : fallbackImg,
        tag: existing?.tag !== undefined && existing.tag !== "" ? existing.tag : (idx === 0 && category ? category : archetype.defaultTag),
        title: existing?.title ?? "", // empty means defaults to productTitle
        subtitle: existing?.subtitle !== undefined && existing.subtitle !== "" ? existing.subtitle : archetype.defaultSubtitle,
        code: existing?.code ?? archetype.code,
        theme: archetype.theme,
      };
    });
  };

  const effectiveSlides = getEffectiveSlides();
  const currentCard = effectiveSlides[selectedCardIdx] || effectiveSlides[0];
  const currentArchetype = CARD_ARCHETYPES[selectedCardIdx] || CARD_ARCHETYPES[0];
  const hasCustomSlides = Boolean(config.slides && config.slides.length === 6);

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

  const handleUpdateCardField = (field: keyof EmbeddedCarouselSlide, value: string) => {
    const updated = [...effectiveSlides];
    updated[selectedCardIdx] = {
      ...updated[selectedCardIdx],
      [field]: value,
    };
    onChange({
      ...config,
      slides: updated,
    });
  };

  const handleResetCurrentCard = () => {
    const updated = [...effectiveSlides];
    const arch = CARD_ARCHETYPES[selectedCardIdx];
    const fallbackImg = productImages[selectedCardIdx % (productImages.length || 1)] || "";
    updated[selectedCardIdx] = {
      image: fallbackImg,
      tag: selectedCardIdx === 0 && category ? category : arch.defaultTag,
      title: "",
      subtitle: arch.defaultSubtitle,
      code: arch.code,
      theme: arch.theme,
    };
    onChange({
      ...config,
      slides: updated,
    });
  };

  const handleResetAllToAuto = () => {
    onChange({
      ...config,
      slides: undefined,
    });
  };

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

          {/* Section Titles Inputs */}
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
                placeholder="Ej: Perspectiva sensorial y atmósfera espacial de esta pieza"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-white dark:bg-[#202023] text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Speed Configuration */}
          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8c9276]" />
                Velocidad de rotación continua
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

          {/* Interactive 6-Card Customizer */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181916] border border-gray-200 dark:border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/70 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#8c9276]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    Personalización Interactiva de las 6 Tarjetas 3D
                  </span>
                  {hasCustomSlides ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#8c9276]/15 text-[#8c9276] font-bold">
                      Personalizado
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      Curaduría Automática
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Selecciona una tarjeta para personalizar su etiqueta superior, título en pantalla, subtítulo y foto asignada con vista previa en tiempo real.
                </p>
              </div>

              {hasCustomSlides && (
                <button
                  type="button"
                  onClick={handleResetAllToAuto}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors self-start sm:self-auto cursor-pointer"
                  title="Restablecer todas las tarjetas a textos automáticos"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restablecer a automático
                </button>
              )}
            </div>

            {/* Card Selector Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CARD_ARCHETYPES.map((arch, idx) => {
                const isSelected = selectedCardIdx === idx;
                const slide = effectiveSlides[idx];
                const isCardCustomized = Boolean(config.slides?.[idx]);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCardIdx(idx)}
                    className={cn(
                      "p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden",
                      isSelected
                        ? "border-[#8c9276] bg-[#8c9276]/10 ring-2 ring-[#8c9276]/30 shadow-sm"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50/50 dark:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={cn(
                        "text-[10px] font-mono font-bold",
                        isSelected ? "text-[#8c9276]" : "text-gray-500 dark:text-gray-400"
                      )}>
                        0{idx + 1}
                      </span>
                      {isCardCustomized && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8c9276]" title="Tarjeta personalizada" />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {arch.tabLabel.replace(/^\d+\s*/, "")}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {slide.tag || arch.defaultTag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Card Editor & Live Preview Row */}
            <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Form Controls Column */}
              <div className="lg:col-span-8 space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-gray-200/60 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                      Editando: {currentArchetype.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({currentArchetype.desc})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCurrentCard}
                    className="text-[10px] font-semibold text-gray-400 hover:text-[#8c9276] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Valores sugeridos
                  </button>
                </div>

                {/* Tag / Badge */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                    Etiqueta / Badge Superior
                  </label>
                  <input
                    type="text"
                    value={currentCard.tag || ""}
                    onChange={(e) => handleUpdateCardField("tag", e.target.value)}
                    placeholder={`Ej: ${currentArchetype.defaultTag}`}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-stone-50 dark:bg-[#18181b] text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Título que se Muestra en Pantalla
                    </label>
                    <span className="text-[10px] text-gray-400 italic">
                      {currentCard.title ? "Personalizado" : "Automático (Nombre del producto)"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentCard.title || ""}
                    onChange={(e) => handleUpdateCardField("title", e.target.value)}
                    placeholder={productTitle || "Nombre del producto (por defecto)"}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-stone-50 dark:bg-[#18181b] text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Si lo dejas vacío, mostrará el nombre del producto en el carrusel 3D.
                  </p>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                    Subtítulo / Perspectiva
                  </label>
                  <input
                    type="text"
                    value={currentCard.subtitle || ""}
                    onChange={(e) => handleUpdateCardField("subtitle", e.target.value)}
                    placeholder={`Ej: ${currentArchetype.defaultSubtitle}`}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 text-xs outline-none focus:border-[#8c9276] bg-stone-50 dark:bg-[#18181b] text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Image Picker */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Fotografía de esta Tarjeta
                  </label>

                  {productImages.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400">
                        Selecciona una de las fotos subidas del producto ({Math.max(productImages.length, productImagesCount)} disponibles):
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        {productImages.map((imgUrl, pIdx) => {
                          const isImgSelected = currentCard.image === imgUrl;
                          return (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleUpdateCardField("image", imgUrl)}
                              className={cn(
                                "relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0",
                                isImgSelected
                                  ? "border-[#8c9276] ring-2 ring-[#8c9276]/30 scale-105"
                                  : "border-gray-200 dark:border-white/10 hover:border-gray-400 opacity-70 hover:opacity-100"
                              )}
                              title="Asignar foto a esta tarjeta"
                            >
                              <Image
                                src={imgUrl}
                                alt="Foto producto"
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                              {isImgSelected && (
                                <div className="absolute inset-0 bg-[#8c9276]/40 flex items-center justify-center text-white">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <input
                      type="text"
                      value={currentCard.image || ""}
                      onChange={(e) => handleUpdateCardField("image", e.target.value)}
                      placeholder="O ingresa URL de imagen externa: https://..."
                      className="w-full px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-[11px] outline-none focus:border-[#8c9276] bg-stone-50 dark:bg-[#18181b] text-gray-600 dark:text-gray-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Live Card Mini-Preview Column */}
              <div className="lg:col-span-4 flex flex-col items-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1 self-start">
                  <Sparkles className="w-3 h-3 text-[#8c9276]" />
                  Vista Previa en Vivo
                </div>

                <div className="relative w-full max-w-[200px] h-[200px] rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 shadow-lg select-none">
                  {/* Archetype Preview Rendering */}
                  {currentArchetype.theme === "dark_typography" ? (
                    <div className="relative w-full h-full bg-[#121310] text-white p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono tracking-widest text-[#8c9276] uppercase font-bold">
                          {currentCard.tag || currentArchetype.defaultTag}
                        </span>
                        <span className="text-[8px] font-mono text-white/40 uppercase">
                          0{selectedCardIdx + 1}
                        </span>
                      </div>
                      <p className="text-xs font-mono font-black tracking-wider text-white uppercase text-center line-clamp-2 my-auto">
                        {currentCard.title || productTitle || "NOMBRE DEL PRODUCTO"}
                      </p>
                      <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[8px] font-mono text-white/50 uppercase">
                        <span>{currentCard.subtitle || currentArchetype.defaultSubtitle}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8c9276]" />
                      </div>
                    </div>
                  ) : currentArchetype.theme === "split_numbers" ? (
                    <div className="relative w-full h-full flex bg-[#e8eae0] dark:bg-[#20221c] text-gray-900 dark:text-white">
                      <div className="relative w-[45%] h-full bg-stone-300 overflow-hidden">
                        {currentCard.image ? (
                          <Image
                            src={currentCard.image}
                            alt="Miniatura"
                            fill
                            sizes="100px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="w-[55%] h-full p-2.5 flex flex-col justify-between font-mono text-right">
                        <span className="text-[7px] text-gray-500 uppercase font-bold tracking-wider">
                          {currentCard.tag || currentArchetype.defaultTag}
                        </span>
                        <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white line-clamp-2 my-auto">
                          {currentCard.title || productTitle || "PRODUCTO"}
                        </p>
                        <span className="text-[7px] font-bold text-[#8c9276] uppercase tracking-wider">
                          DISEÑO ORIGINAL
                        </span>
                      </div>
                    </div>
                  ) : currentArchetype.theme === "framed" ? (
                    <div className="relative w-full h-full bg-[#4e5544] p-2 flex flex-col justify-between text-white">
                      <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-black/30">
                        {currentCard.image ? (
                          <Image
                            src={currentCard.image}
                            alt="Miniatura"
                            fill
                            sizes="180px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="pt-1 flex items-center justify-between text-[8px] font-mono">
                        <span className="font-bold truncate uppercase">{currentCard.title || productTitle || "PRODUCTO"}</span>
                        <span className="text-white/60">{currentCard.tag || "AUTOR"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full overflow-hidden bg-black/50">
                      {currentCard.image ? (
                        <Image
                          src={currentCard.image}
                          alt="Miniatura"
                          fill
                          sizes="180px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 p-3 flex flex-col justify-between text-white font-mono">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase bg-white/20 backdrop-blur-md border border-white/20">
                            {currentCard.tag || currentArchetype.defaultTag}
                          </span>
                          <Maximize2 className="w-3 h-3 text-white/70" />
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold uppercase line-clamp-1">
                            {currentCard.title || productTitle || "PRODUCTO"}
                          </h5>
                          <p className="text-[8px] text-white/70 uppercase truncate">
                            {currentCard.subtitle || currentArchetype.defaultSubtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmbeddedCarouselConfigurator;
