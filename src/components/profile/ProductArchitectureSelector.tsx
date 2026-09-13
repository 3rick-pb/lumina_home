"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { 
  Sparkles, 
  Layers, 
  ShoppingBag, 
  Check, 
  Trash2, 
  Package, 
  Cpu, 
  MessageSquare,
  Search,
  Move,
  TrendingUp
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";

export interface LandingSpecItem {
  title: string;
  description: string;
  side?: 'left' | 'right';
  pinX?: number;
  pinY?: number;
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
  productImage?: string;
  allProducts?: CatalogProduct[];
  bundleEnabled: boolean;
  onBundleEnabledChange: (enabled: boolean) => void;
  bundleMode?: 'companion' | 'volume_tiers' | 'care_pass';
  onBundleModeChange?: (mode: 'companion' | 'volume_tiers' | 'care_pass') => void;
  bundleDiscount: string;
  onBundleDiscountChange: (discount: string) => void;
  bundleCompanionIds?: string[];
  onBundleCompanionIdsChange?: (ids: string[]) => void;
  landingSpecs: LandingSpecItem[];
  onLandingSpecsChange: (specs: LandingSpecItem[]) => void;
  landingReviews: LandingReviewItem[];
  onLandingReviewsChange: (reviews: LandingReviewItem[]) => void;
  howToUse?: string;
  onHowToUseChange?: (val: string) => void;
}

const DEFAULT_PIN_POSITIONS = [
  { x: 28, y: 32 },
  { x: 72, y: 28 },
  { x: 30, y: 70 },
  { x: 70, y: 68 },
];

export function ProductArchitectureSelector({
  layoutType,
  onLayoutTypeChange,
  productImage,
  allProducts = [],
  bundleEnabled,
  onBundleEnabledChange,
  bundleMode = 'companion',
  onBundleModeChange,
  bundleDiscount,
  onBundleDiscountChange,
  bundleCompanionIds = [],
  onBundleCompanionIdsChange,
  landingSpecs,
  onLandingSpecsChange,
  landingReviews,
  onLandingReviewsChange,
  howToUse = "",
  onHowToUseChange,
}: ProductArchitectureSelectorProps) {
  const [selectedPinIndex, setSelectedPinIndex] = useState<number>(0);
  const [companionSearch, setCompanionSearch] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddDefaultSpecs = () => {
    onLandingSpecsChange([
      { title: "Chasis de Aluminio y Acabado Mate", description: "Estructura aeroespacial ultraligera con recubrimiento texturizado.", side: "left", pinX: 28, pinY: 32 },
      { title: "Óptica Lumina Difusa 360°", description: "Vidrio opalino templado con microprismas para luz homogénea.", side: "left", pinX: 30, pinY: 70 },
      { title: "Gestión Térmica Inteligente", description: "Disipador pasivo silencioso que garantiza más de 50.000h de vida útil.", side: "right", pinX: 72, pinY: 28 },
      { title: "Carga Ultra Rápida USB-C", description: "Control touch capacitivo de 4 temperaturas de calidez.", side: "right", pinX: 70, pinY: 68 },
    ]);
  };

  const handleAddDefaultReviews = () => {
    onLandingReviewsChange([
      { author: "Valentina M.", role: "Arquitecta de Interiores", rating: 5, comment: "La calidad de los acabados es insuperable. Transforma cualquier rincón." },
      { author: "Carlos E.", role: "Comprador Verificado", rating: 5, comment: "El empaque llegó blindado en 24 horas. Impresiona todavía más en persona." },
      { author: "Sofía R.", role: "Diseñadora de Iluminación", rating: 5, comment: "Lumina cuida cada detalle de textura y temperatura de luz. Maravilloso." },
    ]);
  };

  const handleUpdateSpec = (idx: number, field: keyof LandingSpecItem, val: string | number) => {
    const updated = [...landingSpecs];
    if (field === 'side') {
      updated[idx] = { ...updated[idx], side: val as 'left' | 'right' };
    } else {
      updated[idx] = { ...updated[idx], [field]: val };
    }
    onLandingSpecsChange(updated);
  };

  const handleRemoveSpec = (idx: number) => {
    const updated = landingSpecs.filter((_, i) => i !== idx);
    onLandingSpecsChange(updated);
    if (selectedPinIndex >= updated.length) {
      setSelectedPinIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleAddEmptySpec = () => {
    const nextIdx = landingSpecs.length;
    const defaultPos = DEFAULT_PIN_POSITIONS[nextIdx % DEFAULT_PIN_POSITIONS.length];
    onLandingSpecsChange([
      ...landingSpecs,
      { 
        title: "", 
        description: "", 
        side: nextIdx % 2 === 0 ? "left" : "right",
        pinX: defaultPos.x,
        pinY: defaultPos.y
      }
    ]);
    setSelectedPinIndex(nextIdx);
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

  // Canvas click to move active pin
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (landingSpecs.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(5, Math.min(95, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

    const targetIdx = selectedPinIndex < landingSpecs.length ? selectedPinIndex : 0;
    const updated = [...landingSpecs];
    updated[targetIdx] = {
      ...updated[targetIdx],
      pinX: x,
      pinY: y,
    };
    onLandingSpecsChange(updated);
  };

  const toggleCompanion = (id: string) => {
    if (!onBundleCompanionIdsChange) return;
    const isSelected = bundleCompanionIds.includes(id);
    onBundleCompanionIdsChange(
      isSelected ? bundleCompanionIds.filter(item => item !== id) : [...bundleCompanionIds, id]
    );
  };

  const filteredCompanions = allProducts.filter(p =>
    p.title.toLowerCase().includes(companionSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(companionSearch.toLowerCase())
  );

  const fallbackCanvasImage = productImage || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";

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
            {layoutType === 'landing' ? 'Mayor Descripción' : 'Product Page Estándar'}
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
                Galería clásica con zoom, caja de compra directa y pestañas en acordeón para materiales, dimensiones y envíos.
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

          {/* OPCIÓN 2: MAYOR DESCRIPCIÓN (LANDING PAGE) */}
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
                    Mayor Descripción
                  </h4>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Detallado
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Flujo inmersivo vertical: Hero Buy Box, bundle complementario, pines interactivos de anatomía, guía de uso y reseñas.
              </p>
            </div>

            <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400">
                Ideal para: consolas, lámparas, audio y piezas insignia
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
      {/* 2. BLOQUE 2: OFERTA COMPLEMENTARIA O AHORRO POR VOLUMEN (AMBAS VISTAS)    */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/70 dark:border-emerald-500/20 space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                  Bloque 2: Oferta Complementaria o Ahorro por Volumen
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Estándar & Detallado
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Configura paquetes de ahorro o productos accesorios sugeridos para aumentar el valor medio del pedido.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
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
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200/80 dark:border-white/10 space-y-4 shadow-sm">
            {/* Mode Selector */}
            {onBundleModeChange && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Modo de este bloque:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onBundleModeChange('companion')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bundleMode === 'companion'
                        ? 'border-gray-950 dark:border-white bg-gray-50 dark:bg-white/10 font-bold'
                        : 'border-gray-200 dark:border-white/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs">Comprados Juntos (Accesorios Reales)</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-normal">
                      Elige productos específicos del catálogo para acompañar esta pieza.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onBundleModeChange('volume_tiers')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bundleMode === 'volume_tiers'
                        ? 'border-gray-950 dark:border-white bg-gray-50 dark:bg-white/10 font-bold'
                        : 'border-gray-200 dark:border-white/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs">Packs de Ahorro por Volumen (Tier Pricing)</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-normal">
                      Ideal si no tienes accesorios: Lleva 1, 2 (-15%) o 3 piezas (-25%).
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Companion Products Picker if mode is 'companion' */}
            {bundleMode === 'companion' && onBundleCompanionIdsChange && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Selecciona los productos complementarios reales para este combo:
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {bundleCompanionIds.length} seleccionados
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={companionSearch}
                    onChange={e => setCompanionSearch(e.target.value)}
                    placeholder="Buscar por nombre o categoría..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022]"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 p-1 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200/60 dark:border-white/5">
                  {filteredCompanions.slice(0, 15).map(prod => {
                    const isChecked = bundleCompanionIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleCompanion(prod.id)}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-white dark:bg-[#202022] shadow-sm border border-gray-950/20 dark:border-white/20"
                            : "hover:bg-gray-100 dark:hover:bg-white/5 opacity-80"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 text-gray-900 rounded cursor-pointer"
                          />
                          <span className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">
                            {prod.title}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                          ${prod.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discount input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
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
                Aparecerá en badge destacado calculando el ahorro exacto en dólares.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. CAMPOS ENRIQUECIDOS ADAPTATIVOS DE LANDING PAGE                        */}
      {/* ========================================================================= */}
      {layoutType === 'landing' && (
        <div className="p-5 rounded-3xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/70 dark:border-amber-500/20 space-y-6 animate-fade-in">
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                  Configuración de Mayor Descripción
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Personaliza los bloques inmersivos. Si dejas campos vacíos, se aplicarán contenidos de diseño editorial por defecto.
                </p>
              </div>
            </div>
          </div>

          {/* Bloque: ¿Cómo se usa? / Aplicaciones recomendadas */}
          {onHowToUseChange && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200/80 dark:border-white/10 space-y-2 shadow-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                ¿Cómo se usa / Aplicaciones Recomendadas? (Se usa)
              </label>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Describe para qué escenarios, espacios o rutinas está concebida esta pieza.
              </p>
              <textarea
                rows={2}
                value={howToUse}
                onChange={e => onHowToUseChange(e.target.value)}
                placeholder="Ej: Ideal para sesiones nocturnas de juego o trabajo; se conecta vía USB-C o Bluetooth y ofrece iluminación ambiental graduable..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>
          )}

          {/* Bloque B: Anatomía Técnica con Editor Interactivo de Pines en Vivo */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200/80 dark:border-white/10 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Bloque 3: Anatomía Técnica & Editor de Pines
                </span>
              </div>
              <div className="flex items-center gap-2">
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

            {/* INTERACTIVE PIN PLACEMENT CANVAS */}
            {landingSpecs.length > 0 && (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200/70 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Colocación Interactiva de Pines sobre el Producto
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Haz clic en cualquier parte de la foto para mover el pin seleccionado
                  </span>
                </div>

                {/* Active Pin Selector Tabs */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {landingSpecs.map((spec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPinIndex(idx)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        selectedPinIndex === idx
                          ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md scale-105"
                          : "bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10"
                      }`}
                    >
                      <span>Pin 0{idx + 1}</span>
                      <span className="text-[10px] opacity-70">
                        ({spec.pinX ?? DEFAULT_PIN_POSITIONS[idx % 4]?.x ?? 50}%, {spec.pinY ?? DEFAULT_PIN_POSITIONS[idx % 4]?.y ?? 50}%)
                      </span>
                    </button>
                  ))}
                </div>

                {/* Interactive Clickable Canvas */}
                <div className="flex justify-center py-2">
                  <div
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="relative w-full max-w-[340px] aspect-square sm:aspect-[4/5] rounded-3xl overflow-hidden border-2 border-dashed border-[#8c9276]/40 dark:border-[#ccff00]/40 shadow-xl cursor-crosshair group select-none bg-gray-100 dark:bg-black/40"
                    title="Haz clic para ubicar el pin seleccionado aquí"
                  >
                    <Image
                      src={fallbackCanvasImage}
                      alt="Vista de Colocación de Pines"
                      fill
                      sizes="(max-width: 640px) 100vw, 340px"
                      className="object-cover pointer-events-none"
                    />

                    {/* Overlay Grid hint */}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors pointer-events-none" />

                    {/* Render Each Pin */}
                    {landingSpecs.map((spec, idx) => {
                      const posX = spec.pinX ?? DEFAULT_PIN_POSITIONS[idx % 4]?.x ?? 50;
                      const posY = spec.pinY ?? DEFAULT_PIN_POSITIONS[idx % 4]?.y ?? 50;
                      const isSelected = selectedPinIndex === idx;

                      return (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPinIndex(idx);
                          }}
                          style={{ left: `${posX}%`, top: `${posY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                        >
                          <div className={`relative flex items-center justify-center transition-transform ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
                            <span className={`animate-ping absolute inline-flex h-7 w-7 rounded-full opacity-60 ${
                              isSelected ? 'bg-blue-500' : 'bg-[#8c9276]'
                            }`} />
                            <span className={`relative inline-flex rounded-full h-6 w-6 text-[10px] font-black items-center justify-center shadow-2xl border-2 ${
                              isSelected 
                                ? 'bg-blue-600 border-white text-white ring-2 ring-blue-500/50' 
                                : 'bg-gray-950 dark:bg-white text-white dark:text-gray-950 border-white/80'
                            }`}>
                              {idx + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-black/70 text-white backdrop-blur-md shadow-lg">
                        🎯 Haz clic en el punto deseado para mover el Pin 0{selectedPinIndex + 1}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Spec Cards Inputs */}
            <div className="space-y-2.5">
              {landingSpecs.map((spec, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedPinIndex(idx)}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 cursor-pointer ${
                    selectedPinIndex === idx
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-sm"
                      : "bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        selectedPinIndex === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-white/20 text-gray-800 dark:text-gray-200'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Punto 0{idx + 1} • Coordenadas: ({spec.pinX ?? 50}%, {spec.pinY ?? 50}%)
                      </span>
                    </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSpec(idx);
                        }}
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
