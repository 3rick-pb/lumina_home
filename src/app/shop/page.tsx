"use client";

import React, { useEffect, useState } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { useCatalogStore } from "@/lib/catalogStore";

const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export default function ShopPage({ searchParams }: { searchParams: { category?: string, search?: string } }) {
  const categoryFilter = searchParams.category;
  const searchQuery = searchParams.search;
  const { products } = useCatalogStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    useCatalogStore.persist.rehydrate();
    setIsMounted(true);
  }, []);

  let filteredProducts = products;

  if (categoryFilter) {
    filteredProducts = filteredProducts.filter(p => normalizeText(p.category) === normalizeText(categoryFilter));
  }

  if (searchQuery) {
    const q = normalizeText(searchQuery);
    filteredProducts = filteredProducts.filter(p => 
      normalizeText(p.title).includes(q) || 
      normalizeText(p.category).includes(q) ||
      (p.description && normalizeText(p.description).includes(q))
    );
  }

  if (!isMounted) return null;

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#f8f9fa] relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#8c9276] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="mb-12">
          <h1 className="text-4xl font-display italic font-bold text-gray-900 mb-4">
            {categoryFilter ? `Colección: ${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}` : "Todos los Productos"}
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Descubre nuestra selección de artículos diseñados para convertir tu hogar en tu refugio ideal. 
            Mezcla de estética, comodidad y tecnología.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          <a href="/shop" className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!categoryFilter ? 'bg-white/40 backdrop-blur-xl border border-white/60 text-gray-900 shadow-sm' : 'bg-transparent text-gray-600 border border-gray-200 hover:bg-white/40 hover:backdrop-blur-md'}`}>
            Todos
          </a>
          {["Iluminación", "Aromaterapia", "Home Office", "Textiles", "Gadgets", "Almacenamiento"].map((cat) => (
            <a 
              key={cat} 
              href={`/shop?category=${cat.toLowerCase()}`}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${categoryFilter?.toLowerCase() === cat.toLowerCase() ? 'bg-white/40 backdrop-blur-xl border border-white/60 text-gray-900 shadow-sm' : 'bg-transparent text-gray-600 border border-gray-200 hover:bg-white/40 hover:backdrop-blur-md'}`}
            >
              {cat}
            </a>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-900">No se encontraron productos</h2>
            <p className="text-gray-500 mt-2">Prueba seleccionando otra categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
