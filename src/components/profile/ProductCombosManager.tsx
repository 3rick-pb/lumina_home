"use client";

import React, { useState } from "react";
import { 
  Package, 
  Plus, 
  Trash2, 
  Sparkles, 
  Percent, 
  DollarSign, 
  Search
} from "lucide-react";
import { CatalogProduct, ProductCombo } from "@/lib/catalogStore";

interface ProductCombosManagerProps {
  combos: ProductCombo[];
  onChange: (combos: ProductCombo[]) => void;
  allProducts: CatalogProduct[];
  currentProductPrice: number;
}

export function ProductCombosManager({
  combos,
  onChange,
  allProducts,
  currentProductPrice,
}: ProductCombosManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [comboName, setComboName] = useState("");
  const [comboBadge, setComboBadge] = useState("Más Popular");
  const [comboDesc, setComboDesc] = useState("");
  const [discountPct, setDiscountPct] = useState("20");
  const [customPrice, setCustomPrice] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [customItemsText, setCustomItemsText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const handleAddSuggestedCombo = (type: 'duo' | 'complete') => {
    if (type === 'duo') {
      const companion = allProducts.slice(0, 1)[0];
      const newCombo: ProductCombo = {
        id: `combo-${Date.now()}`,
        name: "Combo Esencial Duo",
        badge: "Ahorro 15%",
        description: "El producto principal junto a su accesorio indispensable con descuento preferente.",
        companionProductIds: companion ? [companion.id] : [],
        discountPercentage: 15,
      };
      onChange([...combos, newCombo]);
    } else {
      const companions = allProducts.slice(0, 2);
      const newCombo: ProductCombo = {
        id: `combo-${Date.now()}`,
        name: "Pack Coleccionista Deluxe",
        badge: "Mejor Valor",
        description: "Set maestro de experiencia completa con kit de complementos de alta gama.",
        companionProductIds: companions.map(c => c.id),
        discountPercentage: 25,
      };
      onChange([...combos, newCombo]);
    }
  };

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboName.trim()) return;

    const companionTitles = customItemsText.trim()
      ? customItemsText.split(",").map(s => s.trim()).filter(Boolean)
      : undefined;

    const newCombo: ProductCombo = {
      id: `combo-${Date.now()}`,
      name: comboName.trim(),
      badge: comboBadge.trim() || undefined,
      description: comboDesc.trim() || undefined,
      companionProductIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      companionTitles,
      discountPercentage: discountPct ? parseInt(discountPct, 10) : undefined,
      customPrice: customPrice ? parseFloat(customPrice) : undefined,
    };

    onChange([...combos, newCombo]);
    // Reset form
    setComboName("");
    setComboBadge("Más Popular");
    setComboDesc("");
    setDiscountPct("20");
    setCustomPrice("");
    setSelectedProductIds([]);
    setCustomItemsText("");
    setIsAdding(false);
  };

  const handleRemoveCombo = (id: string) => {
    onChange(combos.filter(c => c.id !== id));
  };

  const toggleCompanionProduct = (prodId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const filteredCatalog = allProducts.filter(p => 
    p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="p-5 rounded-3xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#8c9276] dark:text-[#ccff00]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Venta en Combos y Paquetes de Ahorro
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Crea combos con nombres atractivos y descuentos especiales para vender más piezas juntas (disponible en ambas vistas).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {combos.length === 0 && !isAdding && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAddSuggestedCombo('duo')}
                className="text-[11px] font-bold text-[#8c9276] dark:text-[#ccff00] hover:underline"
              >
                + Combo Duo (-15%)
              </button>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button
                type="button"
                onClick={() => handleAddSuggestedCombo('complete')}
                className="text-[11px] font-bold text-[#8c9276] dark:text-[#ccff00] hover:underline"
              >
                + Pack Deluxe (-25%)
              </button>
            </div>
          )}
          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="px-3 py-1.5 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Combo</span>
            </button>
          )}
        </div>
      </div>

      {/* Existing Combos List */}
      {combos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {combos.map((combo) => {
            const companionObjs = allProducts.filter(p => combo.companionProductIds?.includes(p.id));
            const calculatedTotal = companionObjs.reduce((acc, p) => acc + p.price, currentProductPrice);
            const finalPrice = combo.customPrice || (combo.discountPercentage 
              ? Number((calculatedTotal * (1 - combo.discountPercentage / 100)).toFixed(2)) 
              : calculatedTotal);

            return (
              <div
                key={combo.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-gray-950 dark:text-white line-clamp-1">
                      {combo.name}
                    </span>
                    {combo.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        {combo.badge}
                      </span>
                    )}
                  </div>

                  {combo.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                      {combo.description}
                    </p>
                  )}

                  {/* Included items breakdown */}
                  <div className="pt-1.5 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Artículos incluidos:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-white/5 font-semibold text-gray-700 dark:text-gray-300">
                        Pieza principal
                      </span>
                      {companionObjs.map(comp => (
                        <span key={comp.id} className="px-2 py-0.5 rounded text-[10px] bg-[#8c9276]/10 text-[#8c9276] dark:text-[#ccff00] font-semibold">
                          + {comp.title}
                        </span>
                      ))}
                      {combo.companionTitles?.map((title, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-semibold">
                          + {title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400">Precio combo: </span>
                    <span className="text-sm font-black text-gray-950 dark:text-white">
                      ${finalPrice.toFixed(2)}
                    </span>
                    {combo.discountPercentage && (
                      <span className="ml-1 text-[10px] font-bold text-emerald-600">
                        (-{combo.discountPercentage}%)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCombo(combo.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Eliminar combo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Combo Form Modal / Inline Box */}
      {isAdding && (
        <form onSubmit={handleSaveCombo} className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border-2 border-dashed border-gray-300 dark:border-white/20 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8c9276] dark:text-[#ccff00]" />
              Nuevo Combo Personalizado
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Combo *
              </label>
              <input
                required
                type="text"
                value={comboName}
                onChange={e => setComboName(e.target.value)}
                placeholder="Ej: Pack Master Pro, Kit Gamer Deluxe"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Badge Promocional
              </label>
              <input
                type="text"
                value={comboBadge}
                onChange={e => setComboBadge(e.target.value)}
                placeholder="Ej: Más Popular, Ahorro 20%, Edición Especial"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Descripción o beneficio del combo
            </label>
            <input
              type="text"
              value={comboDesc}
              onChange={e => setComboDesc(e.target.value)}
              placeholder="Ej: Llévate el lote completo con envío prioritario y accesorios oficiales incluidos."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Descuento del Paquete (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={discountPct}
                  onChange={e => setDiscountPct(e.target.value)}
                  placeholder="20"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100"
                />
                <Percent className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                O Precio Especial Fijo ($ Opcional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  placeholder="Dejar vacío para calcular automático"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100"
                />
                <DollarSign className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Catalog Companions Picker */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Selecciona productos del catálogo incluidos en este combo:
              </label>
              <span className="text-[10px] text-gray-400">
                {selectedProductIds.length} seleccionados
              </span>
            </div>

            {/* Quick search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Buscar accesorios o productos para el combo..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022]"
              />
            </div>

            {/* Catalog Grid Scroll */}
            <div className="max-h-36 overflow-y-auto space-y-1 p-1 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200/60 dark:border-white/5">
              {filteredCatalog.slice(0, 15).map(prod => {
                const isChecked = selectedProductIds.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => toggleCompanionProduct(prod.id)}
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

          {/* Direct Accessories text */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              O escribe accesorios incluidos (separados por coma):
            </label>
            <input
              type="text"
              value={customItemsText}
              onChange={e => setCustomItemsText(e.target.value)}
              placeholder="Ej: Cable USB-C Blindado 2m, Base de Carga Rápida, Funda de Cuero"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none bg-white dark:bg-[#202022]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-bold shadow-md hover:opacity-90"
            >
              Guardar Combo
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
