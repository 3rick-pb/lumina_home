"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCatalogStore } from "@/lib/catalogStore";
import { normalizeSearchText as normalizeText } from "@/lib/utils";
import { ProximitySidebar } from "@/components/ui/proximity-sidebar";

const SHOP_SECTIONS = [
  { id: "shop-header", label: "Catálogo", level: 1 as const },
  { id: "shop-products", label: "Galería de Artículos", level: 2 as const },
];

export default function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string, search?: string }> }) {
  const resolvedSearchParams = React.use(searchParams);
  const categoryFilter = resolvedSearchParams.category;
  const searchQuery = resolvedSearchParams.search;
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
        <motion.div 
          id="shop-header"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: "transform, opacity" }}
          className="mb-8 sm:mb-12 transform-gpu scroll-mt-36"
        >
          <h1 className="text-2xl sm:text-4xl font-display italic font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            {categoryFilter ? `Colección: ${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}` : "Todos los Productos"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            Descubre nuestra selección de artículos diseñados para convertir tu hogar en tu refugio ideal. 
            Mezcla de estética, comodidad y tecnología.
          </p>
        </motion.div>

        <motion.div 
          id="shop-categories"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: "transform, opacity" }}
          className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-10 overflow-x-auto pb-2 hide-scrollbar transform-gpu scroll-mt-36"
        >
          <Link href="/shop" className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${!categoryFilter ? 'bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/15 text-gray-900 dark:text-gray-100 shadow-sm' : 'bg-transparent text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 hover:backdrop-blur-md'}`}>
            Todos
          </Link>
          {categories.map((cat) => (
            <Link 
              key={cat} 
              href={`/shop?category=${cat.toLowerCase()}`}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${categoryFilter?.toLowerCase() === cat.toLowerCase() ? 'bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/15 text-gray-900 dark:text-gray-100 shadow-sm' : 'bg-transparent text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 hover:backdrop-blur-md'}`}
            >
              {cat}
            </Link>
          ))}
        </motion.div>

        <div id="shop-products" className="scroll-mt-36">
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
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05, margin: "0px 0px -20px 0px" }}
                  transition={{ duration: 0.5, delay: (idx % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{ willChange: "transform, opacity" }}
                  className="transform-gpu"
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rare UI Proximity Sidebar (Lateral derecho para desktop) */}
      <div className="hidden lg:block fixed right-3 xl:right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
        <ProximitySidebar sections={SHOP_SECTIONS} side="right" />
      </div>
    </div>
  );
}
