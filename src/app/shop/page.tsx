"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCatalogStore } from "@/lib/catalogStore";
import { useAmbientStore } from "@/lib/ambientStore";
import { useScrollAmbient } from "@/lib/useScrollAmbient";
import { normalizeSearchText as normalizeText } from "@/lib/utils";
import { ProximitySidebar } from "@/components/ui/proximity-sidebar";
import { CatalogScrollToTopButton } from "@/components/ui/CatalogScrollToTopButton";
import { useBrand } from "@/core";

const SHOP_SECTIONS = [
  { id: "shop-header", label: "Catálogo", level: 1 as const },
  { id: "shop-products", label: "Galería de Artículos", level: 2 as const },
];

export default function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string, search?: string }> }) {
  const brand = useBrand();
  const resolvedSearchParams = React.use(searchParams);
  const categoryFilter = resolvedSearchParams.category;
  const searchQuery = resolvedSearchParams.search;
  const { products, categories } = useCatalogStore();
  const { setCategoryTheme, resetTheme } = useAmbientStore();

  // Resolve canonical category name from store categories (e.g. "iluminacion" -> "Iluminación")
  const canonicalCategoryName = React.useMemo(() => {
    if (!categoryFilter) return null;
    const norm = normalizeText(categoryFilter);
    const found = categories.find(c => normalizeText(c) === norm);
    return found || (categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1));
  }, [categoryFilter, categories]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    if (canonicalCategoryName) {
      setCategoryTheme(canonicalCategoryName);
    } else {
      resetTheme();
    }
    return () => resetTheme();
  }, [canonicalCategoryName, setCategoryTheme, resetTheme]);

  // Desktop pointer hover handlers (strictly bypassed on mobile/touch screens to prevent lag & confusion)
  const handlePointerEnterCategory = (catName: string) => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setCategoryTheme(catName);
    }
  };

  const handlePointerLeaveCategory = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      if (canonicalCategoryName) setCategoryTheme(canonicalCategoryName);
      else resetTheme();
    }
  };

  const filteredProducts = React.useMemo(() => {
    let list = products;
    if (categoryFilter) {
      const cat = normalizeText(categoryFilter);
      list = list.filter(p => normalizeText(p.category) === cat);
    }
    if (searchQuery) {
      const q = normalizeText(searchQuery);
      list = list.filter(p => 
        normalizeText(p.title).includes(q) || 
        normalizeText(p.category).includes(q) ||
        (p.description && normalizeText(p.description).includes(q))
      );
    }
    return list;
  }, [products, categoryFilter, searchQuery]);

  // Mobile/touch scroll-driven ambient theme transition
  useScrollAmbient("[data-ambient-category]", [categoryFilter, searchQuery, filteredProducts]);

  // Velo degradado inferior de color puro CSS verde bosque (0% GPU overhead, 120 FPS)
  const [showCatalogGradient, setShowCatalogGradient] = React.useState(false);
  const showCatalogGradientRef = React.useRef(false);
  const gradientRafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      if (gradientRafRef.current !== null) return;
      gradientRafRef.current = window.requestAnimationFrame(() => {
        gradientRafRef.current = null;
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const shouldShow = scrollY > 120;
        if (shouldShow !== showCatalogGradientRef.current) {
          showCatalogGradientRef.current = shouldShow;
          setShowCatalogGradient(shouldShow);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (gradientRafRef.current !== null) {
        window.cancelAnimationFrame(gradientRafRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-24 bg-transparent relative">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div 
          id="shop-header"
          data-ambient-category={canonicalCategoryName ? canonicalCategoryName.toLowerCase() : "default"}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: "transform, opacity" }}
          className="mb-8 sm:mb-12 transform-gpu scroll-mt-36"
        >
          <h1 className="text-2xl sm:text-4xl font-display italic font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            {canonicalCategoryName ? `Colección: ${canonicalCategoryName}` : "Todos los Productos"}
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
          {categories.map((cat) => {
            const isSelected = categoryFilter ? normalizeText(categoryFilter) === normalizeText(cat) : false;
            return (
              <Link 
                key={cat} 
                href={`/shop?category=${encodeURIComponent(cat.toLowerCase())}`}
                onMouseEnter={() => handlePointerEnterCategory(cat)}
                onMouseLeave={handlePointerLeaveCategory}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${isSelected ? 'bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/15 text-gray-900 dark:text-gray-100 shadow-sm' : 'bg-transparent text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 hover:backdrop-blur-md'}`}
              >
                {cat}
              </Link>
            );
          })}
        </motion.div>

        <div id="shop-products" className="scroll-mt-36">
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              badge={`Catálogo ${brand.shortName}`}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  data-ambient-category={product.category.toLowerCase()}
                  onMouseEnter={() => handlePointerEnterCategory(product.category)}
                  onMouseLeave={handlePointerLeaveCategory}
                >
                  <ProductCard {...product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rare UI Proximity Sidebar (Lateral derecho para desktop) */}
      <div className="hidden lg:block fixed right-3 xl:right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
        <ProximitySidebar sections={SHOP_SECTIONS} side="right" />
      </div>

      {/* Floating Centered Scroll-To-Top Button for Catalog */}
      <CatalogScrollToTopButton className="bottom-6 sm:bottom-8" />

      {/* Velo degradado verde bosque brandeado desde abajo hacia arriba (Puro CSS, 0% costo GPU, 120 FPS) */}
      <div
        aria-hidden="true"
        className={`fixed bottom-0 left-0 right-0 h-28 sm:h-36 lg:h-44 pointer-events-none z-30 transition-opacity duration-500 ease-out ${
          showCatalogGradient ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(30, 38, 24, 0.90) 0%, rgba(30, 38, 24, 0.45) 45%, rgba(30, 38, 24, 0.10) 75%, transparent 100%)",
        }}
      />
    </div>
  );
}
