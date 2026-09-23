"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useCatalogStore, isAgotadoBadge } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";

import { normalizeImageUrl } from "@/lib/imageUtils";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  discount?: string;
  badge?: string;
  imageUrl: string;
  colors?: { name: string; hex: string }[];
  stock?: number;
}

export function ProductCard({ id, title, price, oldPrice, discount, badge, imageUrl, colors, stock }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite, isAuthenticated } = useUserStore();
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const initialUrl = normalizeImageUrl(imageUrl) || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
  const [imgSrc, setImgSrc] = React.useState(initialUrl);

  React.useEffect(() => {
    setImgSrc(normalizeImageUrl(imageUrl) || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop");
  }, [imageUrl]);

  const isFav = isMounted ? isFavorite(id) : false;
  const isAgotado = isAgotadoBadge(badge) || (stock !== undefined && stock <= 0);

  return (
    <Link href={`/product/${id}`} className="group flex flex-col bg-transparent transform-gpu">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/5 mb-2.5 sm:mb-4">
        {(badge || isAgotado) && (
          <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 backdrop-blur-sm transform-gpu text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full z-10 shadow-sm transition-colors ${
            isAgotado 
              ? "bg-red-50/70 border border-red-300/80 text-red-600" 
              : "bg-white/60 dark:bg-black/60 border border-white/70 dark:border-white/20 text-gray-900 dark:text-gray-100"
          }`}>
            {isAgotado ? "AGOTADO" : badge}
          </div>
        )}
        <button 
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 backdrop-blur-sm transform-gpu border rounded-full flex items-center justify-center transition-all z-10 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 ${isFav ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/60 dark:bg-black/60 border-white/70 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-white/80 dark:hover:bg-white/20'}`}
          onClick={(e) => { 
            e.preventDefault(); 
            toggleFavorite(id);
          }}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        <Image
          src={imgSrc}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          draggable={false}
          onError={() => setImgSrc("https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop")}
          className="object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none transform-gpu"
        />
      </div>
      
      <div className="flex flex-col flex-1 px-0.5 sm:px-1">
        <h3 className="text-xs sm:text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-1 mb-1 tracking-tight">{title}</h3>

        {/* Real interactive color preview dots with fixed height to guarantee vertical alignment symmetry across cards */}
        <div className="h-4 sm:h-5 flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
          {colors && colors.length > 0 ? (
            <>
              {colors.slice(0, 5).map((col, idx) => (
                <span
                  key={idx}
                  title={col.name}
                  className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.08)] shrink-0 transition-transform hover:scale-125"
                  style={{ backgroundColor: col.hex }}
                />
              ))}
              {colors.length > 5 && (
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">+{colors.length - 5}</span>
              )}
            </>
          ) : (
            <span
              title="Acabado estándar"
              className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-black/15 dark:border-white/15 bg-stone-300/60 dark:bg-stone-600/60 shadow-2xs shrink-0"
            />
          )}
        </div>

        <div className="flex items-baseline justify-between gap-1 mb-2.5 sm:mb-3 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-gray-100">${Number(price || 0).toFixed(2)}</span>
            {oldPrice && (
              <span className="text-[11px] sm:text-sm text-gray-400 dark:text-gray-500 line-through">${Number(oldPrice || 0).toFixed(2)}</span>
            )}
            {discount && (
              <span className="text-[8px] sm:text-[10px] font-bold text-gray-900 dark:text-gray-100 bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 px-1 sm:px-1.5 py-0.5 rounded-full shadow-sm">
                {discount}
              </span>
            )}
          </div>
          {stock !== undefined && stock > 0 && stock <= 5 && !isAgotado && (
            <span className="text-[8px] sm:text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse shrink-0">
              ¡Últimas {stock}!
            </span>
          )}
        </div>
        
        <button 
          disabled={isAgotado}
          className={`mt-auto w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl backdrop-blur-md border text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-sm ${
            isAgotado 
              ? "bg-gray-100/90 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 cursor-not-allowed" 
              : "bg-white/40 dark:bg-white/10 border-white/60 dark:border-white/15 text-gray-900 dark:text-gray-100 hover:bg-white/60 dark:hover:bg-white/20 active:scale-[0.98]"
          }`}
          onClick={(e) => { 
            e.preventDefault(); 
            if (isAgotado) return;
            const product = useCatalogStore.getState().products.find(p => p.id === id);
            if (product) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              addItem(product as any, 1, product.colors?.[0]?.name, product.sizes?.[0]);
            }
          }}
        >
          {isAgotado ? (
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-600">Agotado</span>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span className="inline sm:hidden">Añadir</span>
              <span className="hidden sm:inline">Añadir rápido</span>
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
