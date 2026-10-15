"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Check, PackageX, Package } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useCatalogStore, isAgotadoBadge } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { BeUIActionSwapLabel } from "@/components/ui/BeUIControls";
import { flyToCart } from "@/components/ui/FlyToCartAnimation";

import { normalizeImageUrl } from "@/lib/imageUtils";
import { useLenis } from "lenis/react";

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

export const ProductCard = React.memo(function ProductCard({
  id,
  title,
  price,
  oldPrice,
  discount,
  badge,
  imageUrl,
  colors,
  stock,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const isInBag = useCartStore(
    React.useCallback(
      (state) =>
        state.items.some(
          (item) =>
            !item.isBundle &&
            (item.productId === id || item.product?.id === id)
        ),
      [id]
    )
  );

  const toggleFavorite = useUserStore((state) => state.toggleFavorite);
  const isFavStore = useUserStore(
    React.useCallback((state) => state.favorites.includes(id), [id])
  );

  const [isMounted, setIsMounted] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [heartPop, setHeartPop] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const initialUrl = normalizeImageUrl(imageUrl) || "";
  const [imgSrc, setImgSrc] = React.useState(initialUrl);
  const [imgLoaded, setImgLoaded] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(normalizeImageUrl(imageUrl) || "");
    setImgLoaded(false);
  }, [imageUrl]);

  const isFav = isMounted ? isFavStore : false;
  const isAgotado = isAgotadoBadge(badge) || (stock !== undefined && stock <= 0);
  const showAddedState = (isMounted && isInBag) || isAdding;

  const imgParallaxRef = React.useRef<HTMLDivElement>(null);

  // Movimiento suave Lenis slow-motion para las imágenes de los productos al explorar el catálogo
  useLenis(() => {
    if (!imgParallaxRef.current) return;
    const rect = imgParallaxRef.current.getBoundingClientRect();
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    if (rect.bottom >= -50 && rect.top <= vh + 50) {
      const centerDiff = (rect.top + rect.height / 2) - vh / 2;
      const translateY = centerDiff * 0.07;
      imgParallaxRef.current.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(1.08)`;
    }
  });

  return (
    <Link 
      href={`/product/${id}`} 
      style={{ contain: "layout paint" }}
      className="group flex flex-col bg-transparent transform-gpu"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:rounded-2xl bg-[#f0eee9] dark:bg-zinc-800/60 mb-2.5 sm:mb-4">
        {/* Badges Flotantes - Fondos Sólidos Sin backdrop-blur para Cero Overdraw */}
        {(badge || isAgotado) && (
          <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 transform-gpu text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full z-10 shadow-sm transition-opacity ${
            isAgotado 
              ? "bg-red-50 text-red-600 border border-red-200" 
              : "bg-white/95 dark:bg-zinc-900/85 text-zinc-900 dark:text-white border border-black/5 dark:border-white/10"
          }`}>
            {isAgotado ? "AGOTADO" : badge}
          </div>
        )}

        {/* Botón Favoritos - Fondo Sólido Sin backdrop-blur */}
        <button 
          type="button"
          style={{
            transform: heartPop ? "scale3d(1.25, 1.25, 1)" : undefined,
            transition: "transform 300ms ease-out, background-color 200ms ease, opacity 200ms ease",
          }}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 transform-gpu rounded-full flex items-center justify-center z-10 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 cursor-pointer ${
            isFav 
              ? 'bg-red-500/15 border border-red-500 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' 
              : 'bg-white/95 dark:bg-zinc-900/85 text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800'
          }`}
          onClick={(e) => { 
            e.preventDefault(); 
            setHeartPop(true);
            setTimeout(() => setHeartPop(false), 300);
            toggleFavorite(id);
          }}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${isFav ? 'fill-current scale-110' : ''}`} />
        </button>

        {/* Imagen del Producto - Movimiento suave e inercial Lenis en scroll */}
        {imgSrc ? (
          <div ref={imgParallaxRef} className="relative w-full h-full will-change-transform transform-gpu">
            <Image
              src={imgSrc}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgSrc("")}
              className={`object-cover transition-opacity duration-500 ease-out pointer-events-none select-none transform-gpu ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-500 gap-1.5 p-4 text-center">
            <Package className="w-8 h-8 stroke-1 opacity-50" />
            <span className="text-[11px] font-medium tracking-wide">Sin imagen</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1 px-0.5 sm:px-1">
        <h3 className="text-xs sm:text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-1 mb-1 tracking-tight">{title}</h3>

        {/* Color preview dots */}
        <div className="h-4 sm:h-5 flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
          {colors && colors.length > 0 ? (
            <>
              {colors.slice(0, 5).map((col, idx) => (
                <span
                  key={idx}
                  title={col.name}
                  className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.08)] shrink-0 transition-transform duration-300 ease-out hover:scale-125"
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
              <span className="text-[8px] sm:text-[10px] font-bold text-zinc-900 dark:text-zinc-100 bg-white/95 dark:bg-zinc-900/85 border border-black/5 dark:border-white/10 px-1 sm:px-1.5 py-0.5 rounded-full shadow-2xs">
                {discount}
              </span>
            )}
          </div>
          {stock !== undefined && stock > 0 && stock <= 5 && !isAgotado && (
            <span className="text-[8px] sm:text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              ¡Últimas {stock}!
            </span>
          )}
        </div>
        
        {/* Botón Añadir a la Bolsa - Fondo sólido de alto rendimiento */}
        <button 
          type="button"
          disabled={isAgotado}
          style={{
            transform: isAdding ? "scale3d(0.96, 0.96, 1)" : "scale3d(1, 1, 1)",
            transition: "transform 300ms ease-out, background-color 200ms ease, border-color 200ms ease",
          }}
          className={`mt-auto w-full h-9 sm:h-11 px-3 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center shadow-xs cursor-pointer ${
            isAgotado 
              ? "bg-red-500/10 dark:bg-red-500/10 border-red-500/30 dark:border-red-500/25 text-red-600 dark:text-red-400 cursor-not-allowed" 
              : showAddedState
                ? "bg-emerald-500/15 dark:bg-emerald-400/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                : "bg-white/95 dark:bg-[#1c1c1f] border-black/10 dark:border-white/15 text-gray-900 dark:text-gray-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
          }`}
          onClick={(e) => { 
            e.preventDefault(); 
            if (isAgotado || (isMounted && isInBag)) return;
            flyToCart(e.currentTarget, imageUrl);
            setIsAdding(true);
            setTimeout(() => setIsAdding(false), 750);
            const product = useCatalogStore.getState().products.find(p => p.id === id);
            if (product) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              addItem(product as any, 1, product.colors?.[0]?.name, product.sizes?.[0]);
            }
          }}
        >
          {isAgotado ? (
            <span className="inline-flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="relative inline-flex items-center justify-center w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0">
                <PackageX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
              </span>
              <span className="inline-flex items-center justify-center whitespace-nowrap leading-none" style={{ height: "1.35em" }}>
                Agotado
              </span>
            </span>
          ) : (
            <BeUIActionSwapLabel
              active={showAddedState}
              idleText="Añadir a la Bolsa"
              activeText="Se agregó a la bolsa"
              idleIcon={<ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
              activeIcon={<Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />}
            />
          )}
        </button>
      </div>
    </Link>
  );
});
