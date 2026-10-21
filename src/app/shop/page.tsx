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

  // Velo degradado inferior de color puro CSS verde bosque (0% GPU overhead, 120 FPS):
  // En la sección de todos los nichos (/shop), siempre visible desde arriba (sin Hero) y suavizado a opacity-25 al llegar abajo del todo para leer el copyright
  const [isNearBottom, setIsNearBottom] = React.useState(false);
  const isNearBottomRef = React.useRef(false);
  const gradientRafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      if (gradientRafRef.current !== null) return;
      gradientRafRef.current = window.requestAnimationFrame(() => {
        gradientRafRef.current = null;
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

        // Comprobar si llegamos exactamente abajo del todo (zona copyright / fin de página)
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const distFromBottom = scrollHeight - (scrollY + window.innerHeight);
        const atBottom = distFromBottom < 160;

        if (atBottom !== isNearBottomRef.current) {
          isNearBottomRef.current = atBottom;
          setIsNearBottom(atBottom);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
          <h1 className="text-2xl sm:text-4xl font-sans font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            {canonicalCategoryName ? (
              <>Colección <span className="font-display italic text-accent-700 dark:text-[#8c9276]">{canonicalCategoryName}</span></>
            ) : (
              <>Todos los <span className="font-display italic text-accent-700 dark:text-[#8c9276]">Productos</span></>
            )}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            Descubre nuestra selección de artículos diseñados para convertir tu hogar en tu refugio ideal. 
            Mezcla de estética, comodidad y tecnología.
          </p>
        </motion.div>

        {/* Barra de Filtros / Nichos: Mismo diseño editorial con tonos bosque y animación de la página principal */}
        <motion.div 
          id="shop-categories"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: "transform, opacity" }}
          className="relative w-full mb-8 sm:mb-10 transform-gpu scroll-mt-36"
        >
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap py-1.5 px-1 w-full">
            <Link 
              href="/shop" 
              className={`relative px-4 sm:px-5 py-2 rounded-full whitespace-nowrap cursor-pointer shrink-0 select-none transition-all duration-150 active:scale-95 ${
                !categoryFilter 
                  ? 'bg-[#242c1c] dark:bg-[#e5ecdb] text-[#f5f8f0] dark:text-[#182012] shadow-sm ring-1 ring-black/10 dark:ring-white/20' 
                  : 'bg-[#f3f0e8]/80 dark:bg-[#1f251c]/70 text-[#48533d] dark:text-[#c4cec0] hover:bg-[#eae5da] dark:hover:bg-[#283024] hover:text-gray-950 dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08]'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-display tracking-wide font-medium">
                Todos
                {!categoryFilter && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-[#526437] shrink-0" />
                )}
              </span>
            </Link>
            {categories.map((cat) => {
              const isSelected = categoryFilter ? normalizeText(categoryFilter) === normalizeText(cat) : false;
              return (
                <Link 
                  key={cat} 
                  href={`/shop?category=${encodeURIComponent(cat.toLowerCase())}`}
                  className={`relative px-4 sm:px-5 py-2 rounded-full whitespace-nowrap cursor-pointer shrink-0 select-none transition-all duration-150 active:scale-95 ${
                    isSelected 
                      ? 'bg-[#242c1c] dark:bg-[#e5ecdb] text-[#f5f8f0] dark:text-[#182012] shadow-sm ring-1 ring-black/10 dark:ring-white/20' 
                      : 'bg-[#f3f0e8]/80 dark:bg-[#1f251c]/70 text-[#48533d] dark:text-[#c4cec0] hover:bg-[#eae5da] dark:hover:bg-[#283024] hover:text-gray-950 dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm font-display tracking-wide font-medium">
                    {cat}
                    {isSelected && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-[#526437] shrink-0" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
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
                <div key={product.id}>
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
      <CatalogScrollToTopButton />

      {/* Velo degradado verde bosque brandeado desde abajo hacia arriba (Puro CSS, 0% costo GPU, 120 FPS) */}
      <div
        aria-hidden="true"
        className={`fixed bottom-0 left-0 right-0 h-44 sm:h-56 lg:h-64 pointer-events-none z-30 transition-opacity duration-700 ease-out ${
          isNearBottom ? "opacity-25" : "opacity-100"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(16, 22, 13, 0.98) 0%, rgba(16, 22, 13, 0.92) 12%, rgba(16, 22, 13, 0.80) 24%, rgba(16, 22, 13, 0.62) 38%, rgba(16, 22, 13, 0.42) 52%, rgba(16, 22, 13, 0.25) 66%, rgba(16, 22, 13, 0.12) 79%, rgba(16, 22, 13, 0.03) 90%, transparent 100%)",
        }}
      />
    </div>
  );
}
