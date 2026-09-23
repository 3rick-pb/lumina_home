"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Sparkles,
  Layers,
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  Tag,
  Eye,
  LayoutTemplate,
} from "lucide-react";
import type { ProductCombo } from "@/lib/catalogStore";

export type ColorVariant = { name: string; hex: string };

export type ProductWizardStep = 0 | 1 | 2 | 3;

export const PRODUCT_WIZARD_STEPS: Array<{
  id: ProductWizardStep;
  shortLabel: string;
  fullLabel: string;
}> = [
  { id: 0, shortLabel: "1. Formato", fullLabel: "1. Formato Visual" },
  { id: 1, shortLabel: "2. Info Principal", fullLabel: "2. Información Principal" },
  { id: 2, shortLabel: "3. Galería y Color", fullLabel: "3. Galería y Variantes" },
  { id: 3, shortLabel: "4. Ficha y Envío", fullLabel: "4. Ficha y Logística" },
];

export function ProductWizardStepHeader({
  activeStep,
  onStepChange,
  onSelectStep,
  stepCompletion,
}: {
  activeStep: ProductWizardStep;
  onStepChange?: (step: ProductWizardStep) => void;
  onSelectStep?: (step: ProductWizardStep) => void;
  stepCompletion?: boolean[];
}) {
  const handleSelect = (step: ProductWizardStep) => {
    onStepChange?.(step);
    onSelectStep?.(step);
  };

  return (
    <div className="flex items-center justify-center w-full lg:w-auto">
      <div className="relative grid grid-cols-4 items-center bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-full border border-black/[0.05] dark:border-white/10 backdrop-blur-xl w-full lg:w-auto min-w-[300px] sm:min-w-[540px]">
        {/* Pure GPU CSS Spring Pill Indicator (Silent, identical to Bolsa de Compras) */}
        <div
          style={{
            transform: `translate3d(${activeStep * 100}%, 0, 0)`,
            transition: "transform 480ms cubic-bezier(0.22, 1.35, 0.36, 1)",
          }}
          className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(25%-2px)] rounded-full bg-white dark:bg-[#27272a] shadow-[0_2px_10px_rgba(0,0,0,0.09)] z-0"
        />
        {PRODUCT_WIZARD_STEPS.map((s, idx) => {
          const isCurrent = activeStep === s.id;
          const isDone = stepCompletion?.[idx];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              className={`relative z-10 flex items-center justify-center gap-1.5 text-center px-2 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
                isCurrent
                  ? "text-gray-950 dark:text-white font-bold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <span className="hidden sm:inline">{s.fullLabel}</span>
              <span className="sm:hidden">{s.shortLabel}</span>
              {isDone && !isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ProductStoreSketchPreviewProps {
  layoutType: "standard" | "landing";
  title: string;
  highlight: string;
  category: string;
  badge: string;
  imageUrl: string;
  extraImages: string;
  price: string;
  oldPrice: string;
  hasDiscount: boolean;
  calculatedDiscount: string;
  description: string;
  features: string;
  colorVariants: ColorVariant[];
  hasSizes: boolean;
  sizes: string;
  materials: string;
  dimensions: string;
  stock: string;
  shipping: string;
  warranty: string;
  combos: ProductCombo[];
  activeStep: ProductWizardStep;
  onSelectStep: (step: ProductWizardStep) => void;
  normalizeImageUrl: (url: string) => string;
}

export function ProductStoreSketchPreview({
  layoutType,
  title,
  highlight,
  category,
  badge,
  imageUrl,
  extraImages,
  price,
  oldPrice,
  hasDiscount,
  calculatedDiscount,
  description,
  features,
  colorVariants,
  hasSizes,
  sizes,
  materials,
  dimensions,
  stock,
  shipping,
  warranty,
  combos,
  activeStep,
  onSelectStep,
  normalizeImageUrl,
}: ProductStoreSketchPreviewProps) {
  const [previewTab, setPreviewTab] = useState<"card" | "detail">("card");

  const primaryImg = imageUrl.trim()
    ? normalizeImageUrl(imageUrl.trim().split(/[\n,]+/)[0])
    : "";
  const extraImgList = extraImages
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"))
    .map(normalizeImageUrl);

  const parsedPrice = parseFloat(price) > 0 ? parseFloat(price).toFixed(2) : "0.00";
  const parsedOldPrice =
    hasDiscount && parseFloat(oldPrice) > parseFloat(price)
      ? parseFloat(oldPrice).toFixed(2)
      : "";
  const parsedSizes = hasSizes
    ? sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const parsedFeatures = features
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  const parsedStock = parseInt(stock, 10);
  const isOutOfStock =
    badge.toLowerCase().includes("agotado") || (!isNaN(parsedStock) && parsedStock <= 0);

  // Completion indicators per area
  const stepDone = [
    Boolean(layoutType),
    Boolean(title.trim() && category.trim() && parseFloat(price) > 0 && description.trim()),
    Boolean(primaryImg && colorVariants.length > 0),
    Boolean(materials.trim() || dimensions.trim() || shipping.trim() || warranty.trim() || stock.trim()),
  ];
  const completedCount = stepDone.filter(Boolean).length;

  return (
    <div className="flex flex-col h-full rounded-3xl bg-stone-100/80 dark:bg-[#161618] border border-gray-200/90 dark:border-white/10 p-4 sm:p-5 space-y-4">
      {/* Top Preview Header + Mode Switcher */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#FF5E00]/15 text-[#FF5E00] flex items-center justify-center shrink-0">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
              Bosquejo en Vivo • Tienda
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Así se verá tu producto al publicarse
            </p>
          </div>
        </div>

        {/* Toggle between Card View & Detail Architecture View */}
        <div className="flex items-center bg-white dark:bg-[#222225] p-0.5 rounded-full border border-gray-200/80 dark:border-white/10 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setPreviewTab("card")}
            className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
              previewTab === "card"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-bold"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Tarjeta
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab("detail")}
            className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
              previewTab === "detail"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-bold"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Ficha {layoutType === "landing" ? "Landing" : "Estándar"}
          </button>
        </div>
      </div>

      {/* PREVIEW MODE A: LIVE STOREFRONT PRODUCT CARD */}
      {previewTab === "card" ? (
        <div className="w-full max-w-[310px] mx-auto bg-white dark:bg-[#202022] rounded-[26px] border border-gray-200/80 dark:border-white/10 shadow-xl overflow-hidden flex flex-col transition-all">
          {/* Card Image Frame */}
          <div className="relative aspect-[4/4.3] w-full bg-stone-100 dark:bg-[#2a2a2d] overflow-hidden">
            {primaryImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImg}
                alt={title || "Vista previa"}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-gray-500 gap-2">
                <Package className="w-9 h-9 stroke-[1.4] text-gray-300 dark:text-gray-600" />
                <span className="text-[11px] font-medium">
                  Agrega la URL de imagen en el Paso 3 para previsualizar la portada
                </span>
              </div>
            )}

            {/* Top-Left Badges (Marketing Badge + Discount) */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
              {badge && (
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm backdrop-blur-md ${
                    isOutOfStock
                      ? "bg-stone-900/90 text-white"
                      : "bg-white/95 text-gray-950 dark:bg-black/85 dark:text-white border border-black/5 dark:border-white/15"
                  }`}
                >
                  {badge}
                </span>
              )}
              {hasDiscount && calculatedDiscount && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5E00] text-white shadow-sm">
                  {calculatedDiscount}
                </span>
              )}
            </div>

            {/* Top-Right Architecture Pill */}
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-black/70 text-white backdrop-blur-md border border-white/15 flex items-center gap-1">
                {layoutType === "landing" ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-[#ccff00]" />
                    <span>Landing</span>
                  </>
                ) : (
                  <>
                    <LayoutTemplate className="w-2.5 h-2.5 text-sky-300" />
                    <span>Estándar</span>
                  </>
                )}
              </span>
            </div>

            {/* Bottom Gallery Thumbnails Indicator */}
            {extraImgList.length > 0 && (
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[9.5px] font-mono font-bold border border-white/15">
                +{extraImgList.length} {extraImgList.length === 1 ? "foto" : "fotos"}
              </div>
            )}
          </div>

          {/* Card Body Details */}
          <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8c9276] dark:text-[#cbd1b2] truncate">
                  {category || "Categoría"}
                </span>
                {!isNaN(parsedStock) && parsedStock > 0 && (
                  <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {parsedStock} en stock
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                {title.trim() || "Nombre del Producto"}{" "}
                {highlight.trim() && (
                  <span className="font-serif italic font-normal text-gray-500 dark:text-gray-400">
                    {highlight.trim()}
                  </span>
                )}
              </h3>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {description.trim() ||
                  "La descripción breve y elegante de tu pieza aparecerá aquí en la tienda."}
              </p>
            </div>

            {/* Color Swatches & Size Chips */}
            {(colorVariants.length > 0 || parsedSizes.length > 0) && (
              <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-white/5">
                {colorVariants.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {colorVariants.slice(0, 5).map((cv, i) => (
                      <span
                        key={i}
                        title={cv.name}
                        style={{ backgroundColor: cv.hex || "#111827" }}
                        className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/25 shadow-2xs"
                      />
                    ))}
                    {colorVariants.length > 5 && (
                      <span className="text-[9.5px] text-gray-400 font-mono">
                        +{colorVariants.length - 5}
                      </span>
                    )}
                  </div>
                ) : (
                  <span />
                )}

                {parsedSizes.length > 0 && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    {parsedSizes.slice(0, 3).map((sz, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[9px] font-semibold text-gray-600 dark:text-gray-300"
                      >
                        {sz}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Price Row + Simulated Add to Bag Button */}
            <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-gray-950 dark:text-white font-mono">
                    ${parsedPrice}
                  </span>
                  {parsedOldPrice && (
                    <span className="text-[11px] text-gray-400 line-through font-mono">
                      ${parsedOldPrice}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`px-3.5 py-2 rounded-full text-[11px] font-bold flex items-center gap-1.5 select-none ${
                  isOutOfStock
                    ? "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                    : "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-sm"
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>{isOutOfStock ? "Agotado" : "Añadir a la Bolsa"}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PREVIEW MODE B: ARCHITECTURAL DETAIL / LANDING PAGE SKETCH */
        <div className="rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#FF5E00] flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>
                Estructura:{" "}
                {layoutType === "landing" ? "Landing Page Especial" : "Ficha de Producto Estándar"}
              </span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {1 + extraImgList.length} {1 + extraImgList.length === 1 ? "imagen" : "imágenes"}
            </span>
          </div>

          {/* Mini Hero Wireframe */}
          <div className="grid grid-cols-12 gap-2.5 items-center">
            <div className="col-span-5 aspect-square rounded-xl bg-stone-100 dark:bg-[#2a2a2d] overflow-hidden border border-gray-200/60 dark:border-white/10">
              {primaryImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primaryImg} alt="Hero" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="col-span-7 space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8c9276]">
                {category || "Categoría"}
              </span>
              <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {title || "Nombre del Producto"}
              </h5>
              <div className="text-xs font-mono font-black text-[#FF5E00]">${parsedPrice} USD</div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {parsedFeatures.slice(0, 2).map((feat, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 truncate max-w-full"
                  >
                    • {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Technical & Logistics Summary Pills */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-white/10 text-[10px]">
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5">
              <div className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Ficha Técnica
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium truncate mt-0.5">
                {materials.trim() || dimensions.trim() || "Sin especificar"}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5">
              <div className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                <Truck className="w-3 h-3 text-sky-500" /> Envío / Garantía
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium truncate mt-0.5">
                {shipping.trim() || warranty.trim() || "Entrega estándar"}
              </p>
            </div>
          </div>

          {combos.length > 0 && (
            <div className="p-2 rounded-xl bg-[#FF5E00]/10 border border-[#FF5E00]/25 flex items-center justify-between text-[10px] text-[#FF5E00] font-semibold">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> Combos de Venta Cruzada
              </span>
              <span>{combos.length} activos</span>
            </div>
          )}
        </div>
      )}

      {/* Interactive Checklist of the 4 Areas */}
      <div className="rounded-2xl bg-white/80 dark:bg-[#202022]/80 border border-gray-200/70 dark:border-white/10 p-3 space-y-2">
        <div className="flex items-center justify-between text-[10.5px] font-bold text-gray-700 dark:text-gray-200">
          <span>Progreso del Producto</span>
          <span className="font-mono text-[#FF5E00]">{completedCount}/4 áreas listas</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRODUCT_WIZARD_STEPS.map((s, idx) => {
            const done = stepDone[idx];
            const isCurrent = activeStep === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStep(s.id)}
                className={`px-2.5 py-1.5 rounded-xl text-left text-[10px] font-semibold flex items-center justify-between gap-1.5 border transition-all cursor-pointer ${
                  isCurrent
                    ? "border-[#FF5E00] bg-[#FF5E00]/10 text-gray-900 dark:text-white"
                    : "border-gray-200/70 dark:border-white/10 bg-stone-50/70 dark:bg-white/[0.02] text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                <span className="truncate">{s.shortLabel}</span>
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    done
                      ? "text-emerald-500"
                      : isCurrent
                      ? "text-[#FF5E00]"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
