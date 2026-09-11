"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, Menu, Home, Sparkles, User, X, ArrowRight, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/userStore";
import { useCatalogStore } from "@/lib/catalogStore";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";
import { useAvatarSettingsStore } from "@/lib/avatarSettingsStore";
import dynamic from 'next/dynamic';
const CartDrawer = dynamic(() => import('@/components/ui/CartDrawer').then(mod => ({ default: mod.CartDrawer })), {
  ssr: false
});
import { usePathname, useRouter } from "next/navigation";
import { normalizeSearchText } from "@/lib/utils";
import { getSavedNicheSlots, getNicheIconByName, type NicheSlotConfig, DEFAULT_NICHE_SLOTS } from "@/lib/nicheIcons";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [nicheSlots, setNicheSlots] = useState<NicheSlotConfig[]>(DEFAULT_NICHE_SLOTS);
  const [activeTab, setActiveTab] = useState("home");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { toggleCart, getTotalItems } = useCartStore();
  const { isAuthenticated, user } = useUserStore();
  const { showAvatarInNavbar } = useAvatarSettingsStore();
  const { products, categories } = useCatalogStore();
  const [isMounted, setIsMounted] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
    setNicheSlots(getSavedNicheSlots());

    const handleUpdate = () => {
      setNicheSlots(getSavedNicheSlots());
    };
    window.addEventListener("lumina_header_niches_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("lumina_header_niches_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const navTabs = useMemo(() => {
    const slot1 = nicheSlots[0] || DEFAULT_NICHE_SLOTS[0];
    const slot2 = nicheSlots[1] || DEFAULT_NICHE_SLOTS[1];
    const Icon1 = getNicheIconByName(slot1.iconName);
    const Icon2 = getNicheIconByName(slot2.iconName);

    return [
      { id: "home", label: "Inicio", icon: Home, href: "/" },
      { id: "shop", label: "Todo", icon: Sparkles, href: "/shop" },
      { id: slot1.category || "niche1", label: slot1.label, icon: Icon1, href: `/shop?category=${encodeURIComponent(slot1.category)}` },
      { id: slot2.category || "niche2", label: slot2.label, icon: Icon2, href: `/shop?category=${encodeURIComponent(slot2.category)}` },
    ];
  }, [nicheSlots]);

  // Sync "Inicio" (home) tab selection with the URL pathname
  useEffect(() => {
    if (pathname === "/") {
      setActiveTab("home");
    } else if (pathname === "/shop") {
      if (typeof window !== "undefined") {
        const search = window.location.search;
        const slot1Cat = nicheSlots[0]?.category?.toLowerCase();
        const slot2Cat = nicheSlots[1]?.category?.toLowerCase();
        if (slot1Cat && search.includes(`category=${slot1Cat}`)) setActiveTab(slot1Cat);
        else if (slot2Cat && search.includes(`category=${slot2Cat}`)) setActiveTab(slot2Cat);
        else setActiveTab("shop");
      }
    }
  }, [pathname, nicheSlots]);

  // Real-time product search matches (accent/diacritic insensitive)
  const matchedProducts = useMemo(() => {
    if (!searchVal.trim()) return [];
    const q = normalizeSearchText(searchVal);
    return products.filter(p => 
      normalizeSearchText(p.title).includes(q) || 
      normalizeSearchText(p.category).includes(q) ||
      (p.description && normalizeSearchText(p.description).includes(q))
    ).slice(0, 4);
  }, [products, searchVal]);

  // Real-time category matches (accent/diacritic insensitive)
  const matchedCategories = useMemo(() => {
    if (!searchVal.trim()) return [];
    const q = normalizeSearchText(searchVal);
    return categories.filter(c => normalizeSearchText(c).includes(q)).slice(0, 3);
  }, [categories, searchVal]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    }
  };

  // Do not render floating navigation pill on auth, profile, or admin dashboard pages
  if (pathname?.startsWith("/auth") || pathname?.startsWith("/profile") || pathname?.startsWith("/admin")) {
    return null;
  }

  const totalItems = isMounted ? getTotalItems() : 0;

  return (
    <>
      <CartDrawer />
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between p-2 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative">
          
          {/* Logo Section */}
          <Link href="/" className="pl-4 pr-6 flex items-center gap-2 group">
            <span className="font-display italic text-2xl font-bold tracking-tight text-gray-900 group-hover:text-[#8c9276] transition-colors">
              Lumina.
            </span>
          </Link>

          {/* Liquid Glass Navigation */}
          <nav className="hidden md:flex items-center gap-1 relative" onMouseLeave={() => setHoveredTab(null)}>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isHovered = hoveredTab === tab.id;
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => setActiveTab(tab.id)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-300",
                    isActive ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {/* Active Indicator (Liquid Pill) */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  
                  {/* Hover Indicator (Subtle Drop) */}
                  {!isActive && isHovered && (
                    <motion.div
                      layoutId="hover-pill"
                      className="absolute inset-0 rounded-full bg-white/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}

                  <Icon className="relative z-10 w-4 h-4" />
                  <span className="relative z-10">{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 pl-4 pr-2">
            
            {/* Profile Link */}
            <Link 
              href={isAuthenticated ? '/profile' : '/auth/login'}
              aria-label="Perfil" 
              className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-gray-700 hover:bg-white/60 transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0 overflow-hidden"
              title={isAuthenticated ? `Mi Perfil (${user?.name || 'Cuenta'})` : "Iniciar Sesión"}
            >
              {isAuthenticated && user && showAvatarInNavbar ? (
                <BlobatarAvatar
                  name={user.id || user.email || user.name}
                  size={32}
                  animate="hover"
                  background="circle"
                  role={user.role}
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </Link>
            
            {/* Interactive Live Search in Pill */}
            <div className="relative flex items-center group">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input 
                  type="text" 
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Buscar en catálogo..."
                  className={cn(
                    "h-10 transition-all duration-300 rounded-full pl-10 text-xs text-gray-900 placeholder:text-gray-500 outline-none bg-white/50 backdrop-blur-md border border-white/60 focus:bg-white/90 focus:border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.05)]",
                    searchVal 
                      ? "w-36 sm:w-64 pr-8 opacity-100" 
                      : "w-10 pr-0 opacity-0 group-hover:w-36 sm:group-hover:w-56 group-hover:pr-8 group-hover:opacity-100 focus:w-36 sm:focus:w-64 focus:pr-8 focus:opacity-100 cursor-pointer focus:cursor-text"
                  )}
                />
                
                <button 
                  type="submit" 
                  aria-label="Buscar" 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-gray-950 transition-colors z-10 pointer-events-auto"
                >
                  <Search className="w-4 h-4" />
                </button>

                {searchVal && (
                  <button 
                    type="button"
                    onClick={() => setSearchVal("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors z-10"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Floating Live Quick Search Results Dropdown */}
              {searchVal.trim().length > 0 && (
                <div className="absolute -right-8 sm:right-0 top-full mt-3 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.14)] p-4 space-y-3 z-50 animate-fade-in text-xs text-gray-900 pointer-events-auto">
                  
                  {/* Header info */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <span>Resultados en tiempo real</span>
                    <button 
                      onClick={() => setSearchVal("")} 
                      className="text-gray-400 hover:text-gray-700 normal-case font-medium text-xs"
                    >
                      Cerrar
                    </button>
                  </div>

                  {/* Matching Categories */}
                  {matchedCategories.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Colecciones</span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedCategories.map(cat => (
                          <Link 
                            key={cat}
                            href={`/shop?category=${cat.toLowerCase()}`}
                            onClick={() => setSearchVal("")}
                            className="px-3 py-1 rounded-full bg-gray-100 hover:bg-[#8c9276]/15 hover:text-[#8c9276] text-gray-700 font-semibold text-[11px] transition-colors flex items-center gap-1.5"
                          >
                            <Layers className="w-3 h-3 text-[#8c9276]" /> {cat}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Products */}
                  {matchedProducts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Piezas ({matchedProducts.length})
                      </span>
                      <div className="space-y-1">
                        {matchedProducts.map(prod => (
                          <Link 
                            key={prod.id} 
                            href={`/product/${prod.id}`}
                            onClick={() => setSearchVal("")}
                            className="flex items-center justify-between p-2 rounded-2xl hover:bg-gray-50/90 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                <Image src={prod.imageUrl} alt={prod.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-[#8c9276] uppercase tracking-wider block">
                                  {prod.category}
                                </span>
                                <h4 className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-[#8c9276] transition-colors">
                                  {prod.title}
                                </h4>
                                <p className="text-xs font-extrabold text-gray-900 mt-0.5">${Number(prod.price || 0).toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="p-1.5 text-gray-300 group-hover:text-gray-800 rounded-xl transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {matchedProducts.length === 0 && matchedCategories.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-500">
                      No encontramos piezas para <span className="font-semibold text-gray-800">&quot;{searchVal}&quot;</span>.
                    </div>
                  )}

                  {/* Bottom View All Link */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <Link 
                      href={`/shop?search=${encodeURIComponent(searchVal)}`}
                      onClick={() => setSearchVal("")}
                      className="font-semibold text-[#8c9276] hover:underline flex items-center gap-1"
                    >
                      Ver todo en tienda &rarr;
                    </Link>
                    <span className="text-[10px] text-gray-400">{products.length} productos en catálogo</span>
                  </div>

                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button 
              aria-label="Carrito" 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                toggleCart({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                });
              }}
              className="relative p-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-gray-900 hover:bg-white/60 transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.05)] shrink-0"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#8c9276] text-[10px] font-bold text-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
            
            {/* Mobile Navigation Toggle Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-full hover:bg-white/50 text-gray-700 ml-1 transition-colors cursor-pointer shrink-0"
              aria-label={isMobileMenuOpen ? "Cerrar menú móvil" : "Abrir menú móvil"}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Floating Liquid Glass Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pointer-events-auto absolute top-full mt-3 inset-x-4 max-w-sm mx-auto bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-4 z-50 md:hidden space-y-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <span>Navegación Lumina</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-semibold"
                >
                  Cerrar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer",
                        isActive
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-gray-50/90 hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
