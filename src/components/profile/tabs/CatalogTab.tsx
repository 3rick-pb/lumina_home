"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Plus, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { useCatalogStore, CatalogProduct, isAgotadoBadge } from "@/lib/catalogStore";
import { normalizeSearchText } from "@/lib/utils";
import { CloudSyncStatus } from "../CloudSyncStatus";

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
            <Package className="w-5 h-5 text-[#8c9276]" /> Control Total del Inventario
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {products.length} productos activos • Valor total: ${totalInventoryValue.toFixed(2)}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
          <select 
            value={catalogCategoryFilter} 
            onChange={e => setCatalogCategoryFilter(e.target.value)}
            className="text-xs font-semibold bg-gray-100 dark:bg-[#3a3a3c] px-3 py-2 rounded-xl outline-none border border-gray-200 dark:border-white/10 flex-1 sm:flex-initial"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <button 
            onClick={onOpenCreateProduct}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-800 shadow-sm dark:shadow-none flex-1 sm:flex-initial"
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
          <tbody className="divide-y divide-gray-100">
            {filteredCatalog.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-[#2c2c2e]/70 transition-colors">
                <td className="py-3 px-2 flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#3a3a3c] shrink-0">
                    <Image src={p.imageUrl} alt={p.title} fill sizes="40px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{p.title}</p>
                    <p className="text-[11px] text-gray-400 italic">{p.titleHighlight || "Estándar"}</p>
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
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                      {p.discount}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  {p.badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isAgotadoBadge(p.badge)
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {p.badge}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onOpenEditProduct(p)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
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
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    </div>
  );
}
