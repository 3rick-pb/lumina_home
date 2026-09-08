"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Check, Plus, Sparkles, Package, TrendingUp } from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";
import { useCartStore } from "@/lib/store";

interface ProductBundleSectionProps {
  product: CatalogProduct;
  allProducts: CatalogProduct[];
  activeColorName?: string;
  activeSize?: string;
  isAgotado?: boolean;
}

export function ProductBundleSection({
  product,
  allProducts,
  activeColorName,
  activeSize = "M",
  isAgotado = false,
}: ProductBundleSectionProps) {
  const { addBundle, addItem } = useCartStore();
  const bundleConfig = product.landingBundle;

  // Determine mode
  const isVolumeTiersMode = bundleConfig?.mode === "volume_tiers";

  // Tier pricing state
  const [selectedTierQty, setSelectedTierQty] = useState<number>(2);

  // Companion candidates: prioritize manually configured companionProductIds, then same category
  const companionCandidates = React.useMemo(() => {
    if (bundleConfig?.companionProductIds && bundleConfig.companionProductIds.length > 0) {
      const found = allProducts.filter((p) => bundleConfig.companionProductIds?.includes(p.id));
      if (found.length > 0) return found;
    }
    const sameCategory = allProducts.filter((p) => p.id !== product.id && p.category === product.category);
    if (sameCategory.length > 0) return sameCategory.slice(0, 2);
    return allProducts.filter((p) => p.id !== product.id).slice(0, 2);
  }, [allProducts, product.id, product.category, bundleConfig?.companionProductIds]);

  const [selectedCompanionIds, setSelectedCompanionIds] = useState<string[]>(() =>
    companionCandidates.map((c) => c.id)
  );

  React.useEffect(() => {
    setSelectedCompanionIds(companionCandidates.map((c) => c.id));
  }, [companionCandidates]);

  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // If bundle is explicitly disabled or no candidates in companion mode, don't render
  if (bundleConfig && bundleConfig.enabled === false) {
    return null;
  }
  if (!isVolumeTiersMode && companionCandidates.length === 0) {
    return null;
  }

  // --- COMPANION CALCULATIONS ---
  const activeCompanions = companionCandidates.filter((p) => selectedCompanionIds.includes(p.id));
  const bundleDiscountPct = bundleConfig?.discountPercentage || 15;
  const companionSubtotal = activeCompanions.reduce((acc, p) => acc + p.price, 0);
  const regularTotal = product.price + companionSubtotal;
  const discountedTotal = Number((regularTotal * (1 - bundleDiscountPct / 100)).toFixed(2));
  const companionSavings = Number((regularTotal - discountedTotal).toFixed(2));

  const toggleCompanion = (id: string) => {
    setSelectedCompanionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCompanionBundle = () => {
    if (isAgotado) return;
    setIsAdding(true);

    const bundleItems = [
      {
        product,
        color: activeColorName,
        size: activeSize,
      },
      ...activeCompanions.map((comp) => ({
        product: comp,
        color: comp.colors?.[0]?.name,
        size: comp.sizes?.[0] || "Estándar",
      })),
    ];

    addBundle({
      bundleName: bundleConfig?.customTitle || "Pack Comprados Juntos",
      bundleBadge: `-${bundleDiscountPct}% DTO`,
      bundleDiscountPercent: bundleDiscountPct,
      bundleCustomPrice: discountedTotal,
      products: bundleItems,
    });

    setTimeout(() => {
      setIsAdding(false);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }, 1000);
  };

  // --- VOLUME TIERS CALCULATIONS ---
  const tierDiscounts: Record<number, number> = { 1: 0, 2: 15, 3: 25 };
  const currentTierDiscount = tierDiscounts[selectedTierQty] || 0;
  const rawTierTotal = product.price * selectedTierQty;
  const finalTierTotal = Number((rawTierTotal * (1 - currentTierDiscount / 100)).toFixed(2));
  const tierSavings = Number((rawTierTotal - finalTierTotal).toFixed(2));

  const handleAddVolumeTier = () => {
    if (isAgotado) return;
    setIsAdding(true);

    if (currentTierDiscount > 0) {
      const tierItems = [];
      for (let i = 0; i < selectedTierQty; i++) {
        tierItems.push({
          product,
          color: activeColorName,
          size: activeSize,
        });
      }
      addBundle({
        bundleName: `Pack Ahorro x${selectedTierQty} Piezas`,
        bundleBadge: `-${currentTierDiscount}% DTO`,
        bundleDiscountPercent: currentTierDiscount,
        bundleCustomPrice: finalTierTotal,
        products: tierItems,
      });
    } else {
      for (let i = 0; i < selectedTierQty; i++) {
        addItem(product, 1, activeColorName, activeSize);
      }
    }

    setTimeout(() => {
      setIsAdding(false);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }, 1000);
  };

  return (
    <section className="my-16 p-6 sm:p-8 rounded-3xl bg-white/60 dark:bg-[#1a1a1c]/60 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-lg transition-all">
      {isVolumeTiersMode ? (
        /* ================= MODO PACKS POR VOLUMEN ================= */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-[#ccff00]">
                  Oferta de Ahorro por Volumen
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 dark:text-white tracking-tight">
                Lleva más piezas y maximiza tu descuento
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Descuento directo aplicado en tu cesta al comprar por paquetes.
              </p>
            </div>

            {currentTierDiscount > 0 && (
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ahorras ${tierSavings.toFixed(2)} en este lote
                </span>
              </div>
            )}
          </div>

          {/* 3 Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Tier 1 */}
            <div
              onClick={() => setSelectedTierQty(1)}
              className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between space-y-3 ${
                selectedTierQty === 1
                  ? "bg-white dark:bg-[#202022] border-gray-950 dark:border-white shadow-md ring-1 ring-gray-950/10"
                  : "bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/5 opacity-75 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">1 Unidad</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200/60 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                    Individual
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-950 dark:text-white">
                  ${product.price.toFixed(2)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Para uso individual en tu espacio.</p>
              </div>
              <div className="pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-semibold">${product.price.toFixed(2)} / ud</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTierQty === 1 ? 'bg-gray-950 text-white' : 'border-gray-300'}`}>
                  {selectedTierQty === 1 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Tier 2 (Most Popular) */}
            <div
              onClick={() => setSelectedTierQty(2)}
              className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between space-y-3 relative ${
                selectedTierQty === 2
                  ? "bg-white dark:bg-[#202022] border-emerald-600 dark:border-emerald-400 shadow-md ring-1 ring-emerald-500/20"
                  : "bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/5 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="absolute -top-3 right-4">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                  Más Popular • -15%
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Pack Duo (2 Uds)
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-black text-gray-950 dark:text-white">
                    ${(product.price * 2 * 0.85).toFixed(2)}
                  </h3>
                  <span className="text-xs text-gray-400 line-through">
                    ${(product.price * 2).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Ideal para dos ambientes o compartir.</p>
              </div>
              <div className="pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-bold">${(product.price * 0.85).toFixed(2)} / ud</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTierQty === 2 ? 'bg-emerald-600 text-white' : 'border-gray-300'}`}>
                  {selectedTierQty === 2 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Tier 3 (Best Value) */}
            <div
              onClick={() => setSelectedTierQty(3)}
              className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between space-y-3 relative ${
                selectedTierQty === 3
                  ? "bg-white dark:bg-[#202022] border-blue-600 dark:border-blue-400 shadow-md ring-1 ring-blue-500/20"
                  : "bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/5 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="absolute -top-3 right-4">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                  Mejor Valor • -25%
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Pack Master (3 Uds)
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-black text-gray-950 dark:text-white">
                    ${(product.price * 3 * 0.75).toFixed(2)}
                  </h3>
                  <span className="text-xs text-gray-400 line-through">
                    ${(product.price * 3).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Máximo ahorro y equipamiento completo.</p>
              </div>
              <div className="pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-blue-600 font-bold">${(product.price * 0.75).toFixed(2)} / ud</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTierQty === 3 ? 'bg-blue-600 text-white' : 'border-gray-300'}`}>
                  {selectedTierQty === 3 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleAddVolumeTier}
              disabled={isAdding || addedSuccess || isAgotado}
              className={`py-3 px-7 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                addedSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-950 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950"
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Lote añadido a la bolsa!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir Lote de {selectedTierQty} unidades (${finalTierTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ================= MODO COMPRADOS JUNTOS (COMPANION) ================= */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-[#ccff00]">
                  Pack Complementario Recomendado
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 dark:text-white tracking-tight">
                Frecuentemente Comprados Juntos
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Combina esta pieza con sus accesorios ideales y obtén un {bundleDiscountPct}% de descuento directo en el lote.
              </p>
            </div>

            {activeCompanions.length > 0 && (
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ahorras ${companionSavings.toFixed(2)} comprando juntos
                </span>
              </div>
            )}
          </div>

          {/* Cards + Plus signs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Main Product */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/10 shadow-xs">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
                <Image
                  src={product.imageUrl || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop"}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Esta pieza</span>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                  {product.title}
                </p>
                <p className="text-xs font-black text-gray-900 dark:text-white">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Companion Products */}
            {companionCandidates.map((companion) => {
              const isChecked = selectedCompanionIds.includes(companion.id);

              return (
                <React.Fragment key={companion.id}>
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </div>

                  <div
                    onClick={() => toggleCompanion(companion.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                      isChecked
                        ? "bg-white dark:bg-[#202022] border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20"
                        : "bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/5 opacity-60 hover:opacity-90"
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
                      <Image
                        src={companion.imageUrl || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop"}
                        alt={companion.title}
                        fill
                        className="object-cover"
                      />
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-md flex items-center justify-center ${
                        isChecked ? "bg-emerald-600 text-white" : "bg-white/80 border border-gray-300"
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-emerald-600 block uppercase">Complemento</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                        {companion.title}
                      </p>
                      <p className="text-xs font-black text-gray-900 dark:text-white">
                        ${companion.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Pricing Summary & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-semibold text-gray-500">Precio total del pack:</span>
              <span className="text-xl font-black text-gray-950 dark:text-white">
                ${discountedTotal.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                ${regularTotal.toFixed(2)}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                -{bundleDiscountPct}% DTO
              </span>
            </div>

            <button
              onClick={handleAddCompanionBundle}
              disabled={isAdding || addedSuccess || isAgotado}
              className={`py-3 px-7 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                addedSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-950 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950"
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Pack añadido a la bolsa!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir Pack Completo al Carrito (${discountedTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
