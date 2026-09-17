"use client";

import React from "react";
import { Layers, Image as ImageIcon, Sparkles, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryStyleSelectorProps {
  galleryStyle: 'traditional' | 'isometric_3d';
  onGalleryStyleChange: (style: 'traditional' | 'isometric_3d') => void;
  photosCount: number;
}

export function ProductGalleryStyleSelector({
  galleryStyle = 'traditional',
  onGalleryStyleChange,
  photosCount = 1,
}: ProductGalleryStyleSelectorProps) {
  const isComplete = photosCount >= 6;

  return (
    <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-black/20 border border-gray-200/80 dark:border-white/10 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200/80 dark:border-white/10">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8c9276]" />
            Estilo Visual de la Galería Multimedia
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Selecciona la experiencia interactiva con la que los compradores explorarán las fotos de esta pieza.
          </p>
        </div>
        <span className={cn(
          "self-start sm:self-auto text-[11px] font-bold px-3 py-1 rounded-full border",
          galleryStyle === 'isometric_3d'
            ? "bg-[#8c9276]/15 text-[#8c9276] border-[#8c9276]/30 font-mono"
            : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10"
        )}>
          {galleryStyle === 'isometric_3d' ? '3D Isométrica (Instagram)' : 'Tradicional'}
        </span>
      </div>

      {/* Two Style Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        
        {/* OPTS 1: TRADICIONAL */}
        <div
          onClick={() => onGalleryStyleChange('traditional')}
          className={cn(
            "relative p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between group",
            galleryStyle === 'traditional'
              ? "border-gray-950 dark:border-white bg-white dark:bg-[#202022] shadow-lg ring-2 ring-gray-950/10 dark:ring-white/10"
              : "border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#1a1a1c]/60 hover:border-gray-300 dark:hover:border-white/20"
          )}
        >
          <div>
            {/* Wireframe Sketch: Traditional Gallery */}
            <div className="w-full h-28 rounded-xl bg-gray-100/90 dark:bg-black/30 p-2.5 mb-3 border border-gray-200/80 dark:border-white/5 flex gap-2 items-center overflow-hidden">
              {/* Left: Thumbnail Strip */}
              <div className="flex flex-col gap-1 w-6 justify-center">
                <div className="w-full h-5 rounded-sm bg-gray-400 dark:bg-white/30" />
                <div className="w-full h-5 rounded-sm bg-gray-300 dark:bg-white/20" />
                <div className="w-full h-5 rounded-sm bg-gray-300 dark:bg-white/20" />
              </div>
              {/* Center: Main Image */}
              <div className="flex-1 h-full rounded-lg bg-gray-200/90 dark:bg-white/10 flex items-center justify-center relative border border-black/5">
                <ImageIcon className="w-6 h-6 text-gray-400 dark:text-white/30" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-gray-500" />
                Galería Tradicional
              </h4>
              {galleryStyle === 'traditional' && (
                <div className="w-4 h-4 rounded-full bg-gray-950 dark:bg-white flex items-center justify-center">
                  <Check className="w-3 h-3 text-white dark:text-gray-950" />
                </div>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Foto principal grande con selector vertical/horizontal de miniaturas. Ideal para catálogos convencionales de 1 a 10 fotos.
            </p>
          </div>
        </div>

        {/* OPTS 2: 3D ISOMÉTRICA (EFECTO INSTAGRAM) */}
        <div
          onClick={() => onGalleryStyleChange('isometric_3d')}
          className={cn(
            "relative p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between group",
            galleryStyle === 'isometric_3d'
              ? "border-[#8c9276] bg-white dark:bg-[#202022] shadow-xl ring-2 ring-[#8c9276]/20"
              : "border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#1a1a1c]/60 hover:border-gray-300 dark:hover:border-white/20"
          )}
        >
          <div>
            {/* Wireframe Sketch: 3D Isometric Stack (Bosquejo ilustrativo) */}
            <div className="w-full h-28 rounded-xl bg-[#111210] p-2 mb-3 border border-white/10 relative overflow-hidden flex items-center justify-center">
              {/* Perspective Wireframe Mockup */}
              <div 
                className="relative w-36 h-20"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(44deg) rotateZ(-26deg) scale(0.85)",
                }}
              >
                {/* Bottom-left stacked cards */}
                <div className="absolute -left-7 top-7 w-16 h-22 rounded-xl bg-[#2a2c27] border border-white/20 shadow-md" />
                <div className="absolute -left-5 top-5 w-16 h-22 rounded-xl bg-[#3e4534] border border-[#7a8065] shadow-md" />
                <div className="absolute -left-3 top-3 w-16 h-22 rounded-xl bg-[#f4f4ee] border border-black/20 shadow-md" />

                {/* Active middle card */}
                <div className="absolute left-1 top-0 w-18 h-24 rounded-xl bg-[#8c9276] border-2 border-white/40 shadow-xl flex flex-col items-center justify-center">
                  <div className="w-12 h-14 rounded-lg bg-black/25 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Upcoming diagonal cards */}
                <div className="absolute left-14 -top-6 w-16 h-22 rounded-xl bg-[#1e201b] border border-white/20 opacity-70 shadow-md" />
                <div className="absolute left-24 -top-11 w-15 h-20 rounded-xl bg-[#8c9276]/60 border border-white/10 opacity-40 shadow-md" />
              </div>

              {/* Badge on wireframe sketch */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/15 text-[9px] font-mono font-bold text-[#ccff00]">
                6 FOTOS REQUERIDAS
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#8c9276]" />
                Galería 3D Isométrica
              </h4>
              {galleryStyle === 'isometric_3d' && (
                <div className="w-4 h-4 rounded-full bg-[#8c9276] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Mazo de tarjetas 3D en perspectiva isométrica con física elástica y navegación táctil/swipe (estilo Instagram).
            </p>
          </div>
        </div>
      </div>

      {/* Bosquejo Detallado & Validación de Fotos cuando se activa el Modo 3D */}
      {galleryStyle === 'isometric_3d' && (
        <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-[#18181b] border border-[#8c9276]/30 space-y-3 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-gray-900 dark:text-white">
                  Bosquejo de Arquitectura: 6 Fotos Isométricas
                </h5>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  Las 6 fotos se organizan dinámicamente: las vistas previas forman una pila física en la esquina inferior izquierda, la foto activa se sitúa en el centro 3D y las siguientes flotan en diagonal.
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className={cn(
              "px-3 py-1.5 rounded-xl border text-[11px] font-bold font-mono shrink-0 flex items-center gap-1.5",
              isComplete
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/60"
            )}>
              {isComplete ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{photosCount}/6 Fotos Listas</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{photosCount}/6 Fotos Cargadas</span>
                </>
              )}
            </div>
          </div>

          {!isComplete && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
              💡 <strong>Nota del efecto:</strong> Agrega las {6 - photosCount} fotos faltantes en la sección de imágenes (imagen principal + URLs adicionales) para completar las 6 vistas requeridas para la experiencia 3D fluida.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductGalleryStyleSelector;
