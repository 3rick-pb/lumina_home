"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Plus, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { useCatalogStore, CatalogProduct, isAgotadoBadge } from "@/lib/catalogStore";
import { normalizeSearchText } from "@/lib/utils";
import { CloudSyncStatus } from "../CloudSyncStatus";
import { 
  BeUISelectField, 
  BeUICenterMorphModal, 
  requestMobileLandscapeFullscreen 
} from "@/components/ui/BeUIControls";
import { GoogleDriveSettingsCard, GoogleDriveIcon } from "../GoogleDriveSettingsCard";
import { useGoogleDriveStore } from "@/lib/googleDriveStore";

interface CatalogTabProps {
  searchQuery?: string;
  onOpenCreateProduct: () => void;
  onOpenEditProduct: (prod: CatalogProduct) => void;
  onDeleteProduct: (prod: CatalogProduct) => void;
}

export function CatalogTab({
  searchQuery = "",
  onOpenCreateProduct,
  onOpenEditProduct,
  onDeleteProduct
}: CatalogTabProps) {
  const { products, categories, fetchProducts, isLoading } = useCatalogStore();
  const { settings: driveSettings } = useGoogleDriveStore();
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncInventory = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await fetchProducts();
    } catch {
      setSyncError("Error al sincronizar inventario");
    } finally {
      setIsSyncing(false);
    }
  };

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.price || 0), 0);
  }, [products]);

  const filteredCatalog = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return products.filter(p => {
      const matchCat = catalogCategoryFilter === "all" || normalizeSearchText(p.category) === normalizeSearchText(catalogCategoryFilter);
      const matchQuery = !q || 
        normalizeSearchText(p.title).includes(q) || 
        normalizeSearchText(p.category).includes(q) ||
        (p.description && normalizeSearchText(p.description).includes(q));
      return matchCat && matchQuery;
    });
  }, [products, catalogCategoryFilter, searchQuery]);

  return (
    <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <CloudSyncStatus
              isSyncing={isSyncing || isLoading}
              syncError={syncError}
              onSave={handleSyncInventory}
              saveLabel="Guardar en nube"
              savedLabel="Guardado en nube"
            />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Control Total del Inventario
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {products.length} productos activos • Valor total: ${totalInventoryValue.toFixed(2)}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
          {/* Google Drive Media Cloud Button immediately to the left of category combobox */}
          <button
            type="button"
            onClick={() => setShowDriveModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-blue-500/25 bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            title="Fotoproductos"
          >
            <GoogleDriveIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Fotoproductos</span>
            <span className="sm:hidden">Fotos</span>
            {driveSettings.isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
            )}
          </button>

          <div className="w-56 min-w-[200px] flex-1 sm:flex-initial">
            <BeUISelectField
              value={catalogCategoryFilter}
              onChange={setCatalogCategoryFilter}
              options={[
                { value: "all", label: "Todas las categorías" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              placeholder="Todas las categorías"
            />
          </div>

          <button 
            onClick={() => {
              requestMobileLandscapeFullscreen();
              onOpenCreateProduct();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-800 shadow-sm dark:shadow-none flex-1 sm:flex-initial cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Crear Producto
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
              <th className="pb-3 px-2">Producto</th>
              <th className="pb-3 px-2">Categoría</th>
              <th className="pb-3 px-2">Precio</th>
              <th className="pb-3 px-2">Descuento</th>
              <th className="pb-3 px-2">Badge</th>
              <th className="pb-3 px-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredCatalog.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-[#2c2c2e]/70 transition-colors">
                <td className="py-3 px-2 flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#3a3a3c] shrink-0 flex items-center justify-center">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.title} fill sizes="40px" className="object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-gray-400 opacity-60" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{p.title}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">{p.titleHighlight || "Estándar"}</p>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 font-medium text-[11px]">
                    {p.category}
                  </span>
                </td>
                <td className="py-3 px-2 font-bold text-gray-900 dark:text-gray-100">${p.price.toFixed(2)}</td>
                <td className="py-3 px-2">
                  {p.discount ? (
                    <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-100 dark:border-red-900/40">
                      {p.discount}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  {p.badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isAgotadoBadge(p.badge)
                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"
                    }`}>
                      {p.badge}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        requestMobileLandscapeFullscreen();
                        onOpenEditProduct(p);
                      }}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Editar producto"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <Link 
                      href={`/product/${p.id}`}
                      className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] rounded-lg transition-colors"
                      title="Ver en tienda"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => onDeleteProduct(p)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Fotoproductos (@beui/center-morph-modal with exact product-detail morph animation) */}
      <BeUICenterMorphModal
        open={showDriveModal}
        onOpenChange={setShowDriveModal}
        className="max-w-4xl w-full"
      >
        <GoogleDriveSettingsCard onClose={() => setShowDriveModal(false)} />
      </BeUICenterMorphModal>
    </div>
  );
}
