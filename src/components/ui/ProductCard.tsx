"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  discount?: string;
  badge?: string;
  imageUrl: string;
}

export function ProductCard({ id, title, price, oldPrice, discount, badge, imageUrl }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite, isAuthenticated } = useUserStore();
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [imgSrc, setImgSrc] = React.useState(imageUrl || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop");
  const isFav = isMounted ? isFavorite(id) : false;

  return (
    <Link href={`/product/${id}`} className="group flex flex-col bg-transparent">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 mb-4">
        {badge && (
          <div className="absolute top-3 left-3 bg-white/40 backdrop-blur-md border border-white/60 text-gray-900 text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm">
            {badge}
          </div>
        )}
        <button 
          className={`absolute top-3 right-3 w-8 h-8 backdrop-blur-md border rounded-full flex items-center justify-center transition-all z-10 shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 ${isFav ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/40 border-white/60 text-gray-600 hover:text-red-500 hover:bg-white/60'}`}
          onClick={(e) => { 
            e.preventDefault(); 
            if (!isAuthenticated) return;
            toggleFavorite(id);
          }}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        <Image
          src={imgSrc}
          alt={title}
          fill
          onError={() => setImgSrc("https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop")}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      
      <div className="flex flex-col flex-1 px-1">
        <h3 className="text-base font-medium text-gray-900 line-clamp-1 mb-1">{title}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
          {oldPrice && (
            <span className="text-sm text-gray-400 line-through">${oldPrice.toFixed(2)}</span>
          )}
          {discount && (
            <span className="text-[10px] font-bold text-gray-900 bg-white/40 backdrop-blur-md border border-white/60 px-1.5 py-0.5 rounded-full shadow-sm">
              {discount}
            </span>
          )}
        </div>
        
        <button 
          className="mt-auto w-full py-2.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 text-gray-900 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/60 transition-all shadow-sm"
          onClick={(e) => { 
            e.preventDefault(); 
            const product = useCatalogStore.getState().products.find(p => p.id === id);
            if (product) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              addItem(product as any, 1, product.colors?.[0]?.name, product.sizes?.[0]);
            }
          }}
        >
          <ShoppingBag className="w-4 h-4" /> Añadir rápido
        </button>
      </div>
    </Link>
  );
}
