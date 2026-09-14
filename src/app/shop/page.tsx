"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCatalogStore } from "@/lib/catalogStore";
import { normalizeSearchText as normalizeText } from "@/lib/utils";

export default function ShopPage({ searchParams }: { searchParams: { category?: string, search?: string } }) {
  const categoryFilter = searchParams.category;
  const searchQuery = searchParams.search;
  const { products, categories } = useCatalogStore();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [categoryFilter, searchQuery]);

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

  return (
    <div className="min-h-screen pt-32 pb-24 bg-transparent relative">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-display italic font-bold text-gray-900 mb-3 sm:mb-4">
            {categoryFilter ? `Colección: ${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}` : "Todos los Productos"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Descubre nuestra selección de artículos diseñados para convertir tu hogar en tu refugio ideal. 
            Mezcla de estética, comodidad y tecnología.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-10 overflow-x-auto pb-2 hide-scrollbar">
          <Link href="/shop" className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${!categoryFilter ? 'bg-white/40 backdrop-blur-xl border border-white/60 text-gray-900 shadow-sm' : 'bg-transparent text-gray-600 border border-gray-200 hover:bg-white/40 hover:backdrop-blur-md'}`}>
            Todos
          </Link>
          {categories.map((cat) => (
            <Link 
              key={cat} 
              href={`/shop?category=${cat.toLowerCase()}`}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${categoryFilter?.toLowerCase() === cat.toLowerCase() ? 'bg-white/40 backdrop-blur-xl border border-white/60 text-gray-900 shadow-sm' : 'bg-transparent text-gray-600 border border-gray-200 hover:bg-white/40 hover:backdrop-blur-md'}`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            badge="Catálogo Lumina"
            title={searchQuery ? `Sin resultados para "${searchQuery}"` : "No encontramos productos en esta colección"}
            description={
              searchQuery
                ? "No existen artículos que coincidan exactamente con tu búsqueda. Prueba con otro término o restablece los filtros para ver todas las piezas."
                : "Actualmente no hay artículos disponibles en la categoría seleccionada. Explora nuestras otras colecciones o revisa nuestro catálogo completo."
            }
            actionLabel="Ver Todo el Catálogo"
            actionHref="/shop"
            secondaryActionLabel={categoryFilter || searchQuery ? "Limpiar Filtros" : undefined}
            secondaryActionHref={categoryFilter || searchQuery ? "/shop" : undefined}
            className="my-10"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
