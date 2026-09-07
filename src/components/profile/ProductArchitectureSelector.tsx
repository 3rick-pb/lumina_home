"use client";

import React from "react";
import { 
  Sparkles, 
  Layers, 
  ShoppingBag, 
  Check, 
  Trash2, 
  Package, 
  Cpu, 
  MessageSquare
} from "lucide-react";

export interface LandingSpecItem {
  title: string;
  description: string;
  side?: 'left' | 'right';
}

export interface LandingReviewItem {
  author: string;
  role?: string;
  rating: number;
  comment: string;
}

interface ProductArchitectureSelectorProps {
  layoutType: 'standard' | 'landing';
  onLayoutTypeChange: (type: 'standard' | 'landing') => void;
  bundleEnabled: boolean;
  onBundleEnabledChange: (enabled: boolean) => void;
  bundleDiscount: string;
  onBundleDiscountChange: (discount: string) => void;
  landingSpecs: LandingSpecItem[];
  onLandingSpecsChange: (specs: LandingSpecItem[]) => void;
  landingReviews: LandingReviewItem[];
  onLandingReviewsChange: (reviews: LandingReviewItem[]) => void;
}

export function ProductArchitectureSelector({
  layoutType,
  onLayoutTypeChange,
  bundleEnabled,
  onBundleEnabledChange,
  bundleDiscount,
  onBundleDiscountChange,
  landingSpecs,
  onLandingSpecsChange,
  landingReviews,
  onLandingReviewsChange,
}: ProductArchitectureSelectorProps) {
  // Preset defaults for quick fill if empty
  const handleAddDefaultSpecs = () => {
    onLandingSpecsChange([
      { title: "Chasis de Aluminio y Acabado Mate", description: "Estructura aeroespacial ultraligera con recubrimiento texturizado.", side: "left" },
      { title: "Óptica Lumina Difusa 360°", description: "Vidrio opalino templado con microprismas para luz homogénea.", side: "left" },
      { title: "Gestión Térmica Inteligente", description: "Disipador pasivo silencioso que garantiza más de 50.000h de vida útil.", side: "right" },
      { title: "Carga Ultra Rápida USB-C", description: "Control touch capacitivo de 4 temperaturas de calidez.", side: "right" },
    ]);
  };

  const handleAddDefaultReviews = () => {
    onLandingReviewsChange([
      { author: "Valentina M.", role: "Arquitecta de Interiores", rating: 5, comment: "La calidad de los acabados es insuperable. Transforma cualquier rincón." },
      { author: "Carlos E.", role: "Comprador Verificado", rating: 5, comment: "El empaque llegó blindado en 24 horas. Impresiona todavía más en persona." },
      { author: "Sofía R.", role: "Diseñadora de Iluminación", rating: 5, comment: "Lumina cuida cada detalle de textura y temperatura de luz. Maravilloso." },
    ]);
  };

  const handleUpdateSpec = (idx: number, field: keyof LandingSpecItem, val: string) => {
    const updated = [...landingSpecs];
    if (field === 'side') {
      updated[idx] = { ...updated[idx], side: val as 'left' | 'right' };
    } else {
      updated[idx] = { ...updated[idx], [field]: val };
    }
    onLandingSpecsChange(updated);
  };

  const handleRemoveSpec = (idx: number) => {
    onLandingSpecsChange(landingSpecs.filter((_, i) => i !== idx));
  };

  const handleAddEmptySpec = () => {
    onLandingSpecsChange([
      ...landingSpecs,
      { title: "", description: "", side: landingSpecs.length % 2 === 0 ? "left" : "right" }
    ]);
  };

  const handleUpdateReview = (idx: number, field: keyof LandingReviewItem, val: string | number) => {
    const updated = [...landingReviews];
    updated[idx] = { ...updated[idx], [field]: val };
    onLandingReviewsChange(updated);
  };

  const handleRemoveReview = (idx: number) => {
    onLandingReviewsChange(landingReviews.filter((_, i) => i !== idx));
  };

  const handleAddEmptyReview = () => {
    onLandingReviewsChange([
      ...landingReviews,
      { author: "", role: "Comprador Verificado", rating: 5, comment: "" }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SELECTOR VISUAL DE ARQUITECTURAS                                       */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8c9276] dark:text-[#ccff00]" />
              Arquitectura Visual del Producto *
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Escoge la estructura en la que tus clientes experimentarán y comprarán esta pieza.
            </p>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-black px-3 py-1 rounded-full bg-[#8c9276]/15 dark:bg-[#ccff00]/15 text-[#8c9276] dark:text-[#ccff00] border border-[#8c9276]/20 dark:border-[#ccff00]/20">
            {layoutType === 'landing' ? 'Landing Page E-commerce' : 'Product Page Estándar'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* OPCIÓN 1: PRODUCT PAGE (ESTÁNDAR) */}
          <div
            onClick={() => onLayoutTypeChange('standard')}
            className={`relative p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between group ${
              layoutType === 'standard'
                ? 'border-gray-950 dark:border-white bg-white dark:bg-[#202022] shadow-xl ring-2 ring-gray-950/10 dark:ring-white/10'
                : 'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#1a1a1c]/60 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <div>
              {/* Wireframe Sketch: Product Page */}
              <div className="w-full h-28 rounded-xl bg-gray-100/80 dark:bg-black/20 p-2.5 mb-3.5 border border-gray-200/70 dark:border-white/5 flex gap-2.5 items-center overflow-hidden">
                {/* Left: Gallery thumbnails & main image */}
                <div className="flex gap-1.5 h-full w-1/2 items-center">
                  <div className="flex flex-col gap-1 h-full w-3.5 justify-center">
                    <div className="w-full h-3.5 rounded-sm bg-gray-300 dark:bg-white/20" />
                    <div className="w-full h-3.5 rounded-sm bg-gray-300 dark:bg-white/20" />
                    <div className="w-full h-3.5 rounded-sm bg-gray-300 dark:bg-white/20" />
                  </div>
                  <div className="flex-1 h-full rounded-lg bg-gray-300/80 dark:bg-white/20 flex items-center justify-center relative">
                    <div className="w-6 h-6 rounded-full bg-gray-400/40 dark:bg-white/30" />
                  </div>
                </div>
                {/* Right: Buy Box Column */}
                <div className="w-1/2 h-full flex flex-col justify-between py-1">
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-2 rounded bg-gray-500 dark:bg-white/50" />
                    <div className="w-1/2 h-1.5 rounded bg-gray-300 dark:bg-white/20" />
                    <div className="flex gap-1 pt-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-white/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
                    </div>
                  </div>
                  <div className="w-full h-4 rounded-md bg-gray-950 dark:bg-white flex items-center justify-center">
                    <div className="w-10 h-1 rounded bg-white dark:bg-gray-950" />
                  </div>
                  <div className="flex gap-1 pt-1 border-t border-gray-200 dark:border-white/10">
                    <div className="w-1/3 h-1 rounded bg-gray-400 dark:bg-white/30" />
                    <div className="w-1/3 h-1 rounded bg-gray-300 dark:bg-white/20" />
                    <div className="w-1/3 h-1 rounded bg-gray-300 dark:bg-white/20" />
                  </div>
                </div>
              </div>

              {/* Title & Info */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  <h4 className="text-sm font-bold text-gray-950 dark:text-white">
                    Product Page (Estándar)
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-200/70 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  Catálogo
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Galería clásica con zoom, caja de compra flotante y pestañas en acordeón para materiales, dimensiones y envíos.
              </p>
            </div>

            <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400">
                Ideal para: textiles, cerámica y accesorios
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                layoutType === 'standard'
                  ? 'bg-gray-950 dark:bg-white border-gray-950 dark:border-white text-white dark:text-gray-950'
                  : 'border-gray-300 dark:border-white/20'
              }`}>
                {layoutType === 'standard' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* OPCIÓN 2: LANDING PAGE (E-COMMERCE) */}
          <div
            onClick={() => onLayoutTypeChange('landing')}
            className={`relative p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between group ${
              layoutType === 'landing'
                ? 'border-gray-950 dark:border-white bg-white dark:bg-[#202022] shadow-xl ring-2 ring-gray-950/10 dark:ring-white/10'
                : 'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-[#1a1a1c]/60 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <div>
              {/* Wireframe Sketch: Landing Page */}
              <div className="w-full h-28 rounded-xl bg-gray-100/80 dark:bg-black/20 p-2.5 mb-3.5 border border-gray-200/70 dark:border-white/5 flex flex-col justify-between overflow-hidden">
                {/* 1. Hero */}
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-5 rounded-md bg-gray-300/80 dark:bg-white/20" />
                  <div className="flex-1 space-y-0.5">
                    <div className="w-3/4 h-1.5 rounded bg-gray-500 dark:bg-white/50" />
                    <div className="w-1/2 h-1 rounded bg-gray-300 dark:bg-white/20" />
                  </div>
                  <div className="w-10 h-3.5 rounded bg-gray-950 dark:bg-white" />
                </div>
                {/* 2. Bundle Banner */}
                <div className="h-4 rounded-md bg-emerald-500/15 border border-emerald-500/20 px-2 flex items-center justify-between">
                  <div className="flex gap-1 items-center">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600/40" />
                    <span className="text-[8px] text-emerald-600 font-bold leading-none">+</span>
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600/40" />
                  </div>
                  <div className="w-6 h-1.5 rounded bg-emerald-600/60" />
                </div>
                {/* 3. Anatomy Callouts */}
                <div className="flex items-center justify-between gap-1">
                  <div className="space-y-0.5 w-1/3">
                    <div className="w-full h-1 rounded bg-gray-400 dark:bg-white/30" />
                    <div className="w-2/3 h-1 rounded bg-gray-300 dark:bg-white/20" />
                  </div>
                  <div className="w-6 h-6 rounded-full border border-dashed border-[#8c9276] dark:border-[#ccff00] flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400/50 dark:bg-white/40" />
                  </div>
                  <div className="space-y-0.5 w-1/3">
                    <div className="w-full h-1 rounded bg-gray-400 dark:bg-white/30" />
                    <div className="w-2/3 h-1 rounded bg-gray-300 dark:bg-white/20" />
                  </div>
                </div>
                {/* 4. Reviews & Pillars */}
                <div className="flex gap-1 items-center justify-between pt-1 border-t border-gray-200 dark:border-white/10">
                  <div className="w-1/3 h-1.5 rounded bg-amber-400/50" />
                  <div className="w-1/4 h-1.5 rounded bg-gray-300 dark:bg-white/20" />
                  <div className="w-1/4 h-1.5 rounded bg-gray-300 dark:bg-white/20" />
                </div>
              </div>

              {/* Title & Info */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#8c9276] dark:text-[#ccff00]" />
                  <h4 className="text-sm font-bold text-gray-950 dark:text-white">
                    Landing Page (E-commerce)
                  </h4>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Alta Conversión
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Flujo vertical por bloques: Hero Buy Box, pack comprado frecuentemente, anatomía técnica con callouts, reseñas y pilares.
              </p>
            </div>

            <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400">
                Ideal para: lámparas, gadgets y piezas icónicas
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                layoutType === 'landing'
                  ? 'bg-gray-950 dark:bg-white border-gray-950 dark:border-white text-white dark:text-gray-950'
                  : 'border-gray-300 dark:border-white/20'
              }`}>
                {layoutType === 'landing' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CAMPOS ENRIQUECIDOS ADAPTATIVOS DE LANDING PAGE                        */}
      {/* ========================================================================= */}
      {layoutType === 'landing' && (
        <div className="p-5 rounded-3xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/70 dark:border-amber-500/20 space-y-6 animate-fade-in">
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                  Configuración Avanzada de Landing Page
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Personaliza los bloques de conversión. Si no completas algún campo, se usarán valores editoriales premium por defecto.
                </p>
              </div>
            </div>
          </div>

          {/* Bloque A: Pack Comprados Juntos (Bundle) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200/80 dark:border-white/10 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Bloque 2: Paquete Comprados Juntos
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bundleEnabled}
                  onChange={(e) => onBundleEnabledChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600" />
              </label>
            </div>

            {bundleEnabled && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Descuento del Paquete (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={bundleDiscount}
                    onChange={(e) => onBundleDiscountChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100"
                    placeholder="15"
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Lumina sugerirá automáticamente 2 piezas del inventario en armonía cromática y calculará el ahorro.
                </p>
              </div>
            )}
          </div>

          {/* Bloque B: Anatomía Técnica / Callouts */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200/80 dark:border-white/10 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Bloque 3: Anatomía Técnica (Puntos Clave con Pines)
                </span>
              </div>
              <div className="flex gap-2">
                {landingSpecs.length === 0 && (
                  <button
                    type="button"
                    onClick={handleAddDefaultSpecs}
                    className="text-[11px] font-bold text-[#8c9276] hover:underline cursor-pointer"
                  >
                    + Cargar sugerencias
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddEmptySpec}
                  className="px-2.5 py-1 text-[11px] font-bold bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200"
                >
                  + Agregar Punto
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {landingSpecs.map((spec, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Punto 0{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={spec.side || (idx % 2 === 0 ? "left" : "right")}
                        onChange={(e) => handleUpdateSpec(idx, "side", e.target.value)}
                        className="px-2 py-0.5 rounded text-[11px] bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/10 outline-none"
                      >
                        <option value="left">Columna Izquierda</option>
                        <option value="right">Columna Derecha</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={spec.title}
                    onChange={(e) => handleUpdateSpec(idx, "title", e.target.value)}
                    placeholder="Título del componente (ej: Óptica Difusa 360°)"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100"
                  />
                  <textarea
                    rows={2}
                    value={spec.description}
                    onChange={(e) => handleUpdateSpec(idx, "description", e.target.value)}
                    placeholder="Breve descripción técnica..."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bloque C: Reseñas / Social Proof */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200/80 dark:border-white/10 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Bloque 4: Testimonios y Reseñas
                </span>
              </div>
              <div className="flex gap-2">
                {landingReviews.length === 0 && (
                  <button
                    type="button"
                    onClick={handleAddDefaultReviews}
                    className="text-[11px] font-bold text-[#8c9276] hover:underline cursor-pointer"
                  >
                    + Cargar sugerencias
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddEmptyReview}
                  className="px-2.5 py-1 text-[11px] font-bold bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200"
                >
                  + Agregar Reseña
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {landingReviews.map((rev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rev.author}
                        onChange={(e) => handleUpdateReview(idx, "author", e.target.value)}
                        placeholder="Nombre (ej: Carlos E.)"
                        className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold outline-none bg-white dark:bg-[#202022]"
                      />
                      <input
                        type="text"
                        value={rev.role || ""}
                        onChange={(e) => handleUpdateReview(idx, "role", e.target.value)}
                        placeholder="Rol (ej: Comprador Verificado)"
                        className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReview(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={rev.comment}
                    onChange={(e) => handleUpdateReview(idx, "comment", e.target.value)}
                    placeholder="Comentario del cliente..."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 resize-none italic"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
