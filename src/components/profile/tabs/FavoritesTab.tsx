"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useUserStore, syncFavoritesToCloud } from "@/lib/userStore";
import { useCatalogStore } from "@/lib/catalogStore";
import { useCartStore } from "@/lib/store";
import { CloudSyncStatus } from "../CloudSyncStatus";

export function FavoritesTab() {
  const { favorites, toggleFavorite, user } = useUserStore();
  const { products } = useCatalogStore();
  const { addItem, setIsOpen: setCartOpen } = useCartStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncFavorites = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await syncFavoritesToCloud(user?.id, favorites);
    } catch {
      setSyncError("Error al sincronizar favoritos");
    } finally {
      setIsSyncing(false);
    }
  };

  const favoritedProductsList = useMemo(() => {
    return products.filter(p => favorites.includes(p.id));
  }, [products, favorites]);

  return (
    <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <CloudSyncStatus
              isSyncing={isSyncing}
              syncError={syncError}
              onSave={handleSyncFavorites}
              saveLabel="Guardar en nube"
              savedLabel="Guardado en nube"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" /> Piezas Guardadas en Favoritos
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Colección personal de artículos que has marcado con el corazón.</p>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#3a3a3c] px-3 py-1 rounded-full self-start sm:self-auto">
          {favoritedProductsList.length} guardados
        </span>
      </div>

      {favoritedProductsList.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-gray-50/50 dark:bg-[#2a2a2c]/50 rounded-3xl border border-gray-100 dark:border-white/5">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-400 mx-auto flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Aún no tienes favoritos guardados</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Explora nuestra tienda y haz clic en el corazón de cualquier pieza para guardarla aquí.
          </p>
          <Link href="/shop" className="inline-block px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none">
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favoritedProductsList.map((prod) => (
            <div key={prod.id} className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-100 dark:border-white/5 p-4 shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none transition-shadow flex flex-col justify-between">
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-50 dark:bg-[#2a2a2c]">
                <Image 
                  src={prod.imageUrl} 
                  alt={prod.title} 
                  fill 
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
                <button 
                  onClick={() => toggleFavorite(prod.id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-[#202022]/90 text-red-500 shadow-sm dark:shadow-none hover:scale-110 transition-transform"
                  title="Quitar de favoritos"
                >
                  <Heart className="w-4 h-4 fill-red-500" />
                </button>
              </div>

              <div>
                <p className="text-[11px] font-bold text-[#8c9276] uppercase tracking-wider">{prod.category}</p>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mt-0.5 line-clamp-1">{prod.title}</h4>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-base mt-1">${prod.price.toFixed(2)}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex gap-2">
                <Link 
                  href={`/product/${prod.id}`}
                  className="flex-1 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3a3a3c] rounded-xl hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
                >
                  Ver Ficha
                </Link>
                <button 
                  onClick={() => {
                    addItem(prod);
                    setCartOpen(true);
                  }}
                  className="py-2 px-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
                  title="Añadir a la bolsa"
                >
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
