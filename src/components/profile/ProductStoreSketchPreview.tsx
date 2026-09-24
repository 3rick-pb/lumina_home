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
  Copy,
  Check,
  Download,
  Code2,
  Lock,
} from "lucide-react";
import type { ProductCombo } from "@/lib/catalogStore";

export type ColorVariant = { name: string; hex: string };

export type ProductWizardStep = 0 | 1 | 2 | 3;

export const PRODUCT_WIZARD_STEPS: Array<{
  id: ProductWizardStep;
  shortLabel: string;
  fullLabel: string;
  code: string;
}> = [
  { id: 0, code: "01", shortLabel: "1. Arquitectura", fullLabel: "1. Arquitectura Visual" },
  { id: 1, code: "02", shortLabel: "2. Identidad & Precio", fullLabel: "2. Identidad & Precio" },
  { id: 2, code: "03", shortLabel: "3. Galería & Variantes", fullLabel: "3. Galería & Variantes" },
  { id: 3, code: "04", shortLabel: "4. Ficha & Logística", fullLabel: "4. Ficha & Logística" },
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
      <div className="relative grid grid-cols-4 items-center bg-gray-100/90 dark:bg-[#2a2a2c]/90 p-1 rounded-2xl border border-gray-200/80 dark:border-white/10 backdrop-blur-xl w-full lg:w-auto min-w-[300px] sm:min-w-[560px]">
        {/* Pure GPU CSS Spring Pill Indicator */}
        <div
          style={{
            transform: `translate3d(${activeStep * 100}%, 0, 0)`,
            transition: "transform 480ms cubic-bezier(0.22, 1.35, 0.36, 1)",
          }}
          className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(25%-2px)] rounded-xl bg-gray-900 dark:bg-gray-100 shadow-sm z-0"
        />
        {PRODUCT_WIZARD_STEPS.map((s, idx) => {
          const isCurrent = activeStep === s.id;
          const isDone = stepCompletion?.[idx];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              className={`relative z-10 flex items-center justify-center gap-1.5 text-center px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
                isCurrent
                  ? "text-white dark:text-gray-900 font-bold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <span className="hidden sm:inline">{s.fullLabel}</span>
              <span className="sm:hidden">{s.shortLabel}</span>
              {isDone && !isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c9276] shrink-0" />
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
  const [previewTab, setPreviewTab] = useState<"card" | "detail" | "json">("card");
  const [copiedJson, setCopiedJson] = useState(false);

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
  const readinessPct = Math.round((completedCount / 4) * 100);

  const compiledJsonPayload = JSON.stringify(
    {
      schema: "lumina.catalog.product.v2",
      layoutType,
      title: title.trim() || "Sin título",
      highlight: highlight.trim() || undefined,
      category: category.trim() || "General",
      badge: badge.trim() || undefined,
      pricing: {
        priceUSD: parseFloat(parsedPrice),
        oldPriceUSD: parsedOldPrice ? parseFloat(parsedOldPrice) : undefined,
        discountTag: hasDiscount && calculatedDiscount ? calculatedDiscount : undefined,
      },
      inventory: {
        stock: !isNaN(parsedStock) ? parsedStock : 20,
        status: isOutOfStock ? "OUT_OF_STOCK" : "IN_STOCK",
      },
      media: {
        coverUrl: primaryImg || null,
        galleryCount: 1 + extraImgList.length,
      },
      variants: {
        colors: colorVariants,
        sizes: parsedSizes,
      },
      specs: {
        materials: materials.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        shipping: shipping.trim() || undefined,
        warranty: warranty.trim() || undefined,
        combosCount: combos.length,
      },
    },
    null,
    2
  );

  const handleCopyJson = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(compiledJsonPayload);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    const slug = (title.trim() || "producto-lumina")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const blob = new Blob([compiledJsonPayload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-ficha.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full rounded-[2rem] bg-gray-50/90 dark:bg-[#1a1a1c]/95 border border-gray-200/80 dark:border-white/10 p-4 sm:p-5 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] font-sans">
      {/* Top Preview Header + 3-Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200/80 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#8c9276]/15 text-[#8c9276] border border-[#8c9276]/25 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-display font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Simulador 1:1 en Vivo
              </h4>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#8c9276]/15 text-[#8c9276] border border-[#8c9276]/25">
                {readinessPct}% LISTO
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Previsualización instantánea en catálogo y ficha
            </p>
          </div>
        </div>

        {/* Toggle between Card View, Detail View & JSON Schema */}
        <div className="flex items-center bg-white dark:bg-[#242427] p-1 rounded-xl border border-gray-200/80 dark:border-white/10 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setPreviewTab("card")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              previewTab === "card"
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-bold shadow-2xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Tarjeta
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab("detail")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              previewTab === "detail"
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-bold shadow-2xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Ficha {layoutType === "landing" ? "Landing" : "Estándar"}
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab("json")}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-mono flex items-center gap-1 ${
              previewTab === "json"
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-bold shadow-2xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* PREVIEW MODE A: LIVE STOREFRONT PRODUCT CARD */}
      {previewTab === "card" && (
        <div className="w-full max-w-[315px] mx-auto bg-white dark:bg-[#202022] rounded-[1.75rem] border border-gray-200/80 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all">
          {/* Card Image Frame */}
          <div className="relative aspect-[4/4.2] w-full bg-gray-100 dark:bg-[#2a2a2c] overflow-hidden">
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
                      ? "bg-gray-900/90 text-white"
                      : "bg-white/95 text-gray-900 dark:bg-black/85 dark:text-white border border-black/5 dark:border-white/15"
                  }`}
                >
                  {badge}
                </span>
              )}
              {hasDiscount && calculatedDiscount && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#8c9276] text-white shadow-sm">
                  {calculatedDiscount}
                </span>
              )}
            </div>

            {/* Top-Right Architecture Pill */}
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-black/75 text-white backdrop-blur-md border border-white/15 flex items-center gap-1">
                {layoutType === "landing" ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-[#8c9276]" />
                    <span>Landing</span>
                  </>
                ) : (
                  <>
                    <LayoutTemplate className="w-2.5 h-2.5 text-gray-300" />
                    <span>Estándar</span>
                  </>
                )}
              </span>
            </div>

            {/* Bottom Gallery Thumbnails Indicator */}
            {extraImgList.length > 0 && (
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[9.5px] font-mono font-bold border border-white/15">
                +{extraImgList.length} {extraImgList.length === 1 ? "foto" : "fotos"}
              </div>
            )}
          </div>

          {/* Card Body Details */}
          <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8c9276] truncate">
                  {category || "Colección / Nicho"}
                </span>
                {!isNaN(parsedStock) && parsedStock > 0 && (
                  <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {parsedStock} uds.
                  </span>
                )}
              </div>

              <h3 className="text-sm font-display font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                {title.trim() || "Nombre de la Pieza"}{" "}
                {highlight.trim() && (
                  <span className="font-display italic font-normal text-gray-500 dark:text-gray-400">
                    {highlight.trim()}
                  </span>
                )}
              </h3>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {description.trim() ||
                  "La narrativa curada y las especificaciones técnicas de tu pieza aparecerán aquí."}
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
            <div className="pt-2.5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-gray-900 dark:text-gray-100 font-mono">
                  ${parsedPrice}
                </span>
                {parsedOldPrice && (
                  <span className="text-[11px] text-gray-400 line-through font-mono">
                    ${parsedOldPrice}
                  </span>
                )}
              </div>

              <div
                className={`px-3.5 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 select-none ${
                  isOutOfStock
                    ? "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                    : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-xs"
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>{isOutOfStock ? "Agotado" : "Añadir a la Bolsa"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODE B: ARCHITECTURAL DETAIL / LANDING PAGE SKETCH */}
      {previewTab === "detail" && (
        <div className="rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#8c9276] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>
                Arquitectura:{" "}
                {layoutType === "landing" ? "Landing Page Editorial" : "Ficha de Producto Estándar"}
              </span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {1 + extraImgList.length} {1 + extraImgList.length === 1 ? "activo" : "activos"}
            </span>
          </div>

          {/* Mini Hero Wireframe */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5 aspect-square rounded-xl bg-gray-100 dark:bg-[#2a2a2c] overflow-hidden border border-gray-200/60 dark:border-white/10">
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
                {category || "Nicho / Colección"}
              </span>
              <h5 className="text-xs font-display font-bold text-gray-900 dark:text-gray-100 truncate">
                {title || "Nombre de la Pieza"}
              </h5>
              <div className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
                ${parsedPrice} USD
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {parsedFeatures.slice(0, 2).map((feat, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 truncate max-w-full"
                  >
                    • {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Technical & Logistics Summary Pills */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-white/10 text-[10px]">
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#2a2a2c]/60 border border-gray-200/60 dark:border-white/5">
              <div className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#8c9276]" /> Ficha Técnica
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium truncate mt-0.5">
                {materials.trim() || dimensions.trim() || "Pendiente de especificar"}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#2a2a2c]/60 border border-gray-200/60 dark:border-white/5">
              <div className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                <Truck className="w-3 h-3 text-[#8c9276]" /> Logística & Garantía
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium truncate mt-0.5">
                {shipping.trim() || warranty.trim() || "Despacho nacional estándar"}
              </p>
            </div>
          </div>

          {combos.length > 0 && (
            <div className="p-2.5 rounded-xl bg-[#8c9276]/10 border border-[#8c9276]/25 flex items-center justify-between text-[10px] text-gray-900 dark:text-gray-100 font-semibold">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#8c9276]" /> Combos de Venta Cruzada
              </span>
              <span className="font-mono text-[#8c9276] font-bold">{combos.length} activos</span>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW MODE C: MICRO-SAAS ARTIFACT JSON COMPILER */}
      {previewTab === "json" && (
        <div className="rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8c9276]">
              Esquema JSON Compilado
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 dark:hover:bg-white/10 text-[10px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJson ? "Copiado" : "Copiar"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="px-2.5 py-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>.JSON</span>
              </button>
            </div>
          </div>
          <pre className="text-[10px] font-mono leading-relaxed p-3 rounded-xl bg-gray-50 dark:bg-[#161618] border border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 max-h-[240px] overflow-y-auto select-all">
            {compiledJsonPayload}
          </pre>
        </div>
      )}

      {/* Interactive Checklist of the 4 Areas */}
      <div className="rounded-2xl bg-white/90 dark:bg-[#202022]/90 border border-gray-200/80 dark:border-white/10 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-[10.5px] font-bold text-gray-900 dark:text-gray-100">
          <span>Auditoría de Publicación</span>
          <span className="font-mono text-[#8c9276]">{completedCount}/4 módulos listos</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-[#2a2a2c] overflow-hidden">
          <div
            style={{ width: `${readinessPct}%` }}
            className="h-full rounded-full bg-[#8c9276] transition-all duration-300"
          />
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
                className={`px-2.5 py-2 rounded-xl text-left text-[10px] font-semibold flex items-center justify-between gap-1.5 border transition-all cursor-pointer ${
                  isCurrent
                    ? "border-gray-900 dark:border-gray-100 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-bold shadow-2xs"
                    : "border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-[#2a2a2c]/60 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                <span className="truncate">{s.shortLabel}</span>
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    done
                      ? isCurrent
                        ? "text-[#8c9276]"
                        : "text-emerald-500"
                      : isCurrent
                      ? "text-white/60 dark:text-gray-900/60"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Privacy & Client-Side Invariant Microcopy (from crear-web-micro-saas) */}
        <div className="pt-1.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[9.5px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#8c9276]" />
            <span>Validación local instantánea</span>
          </span>
          <span className="font-mono">UTF-8 • 0ms</span>
        </div>
      </div>
    </div>
  );
}
