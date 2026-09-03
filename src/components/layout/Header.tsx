"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Menu, Home, Sparkles, Bed, Lamp, User } from "lucide-react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/userStore";
import { CartDrawer } from "@/components/ui/CartDrawer";

import { usePathname, useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { id: "home", label: "Inicio", icon: Home, href: "/" },
  { id: "shop", label: "Todo", icon: Sparkles, href: "/shop" },
  { id: "iluminacion", label: "Iluminación", icon: Lamp, href: "/shop?category=iluminacion" },
  { id: "textiles", label: "Textiles", icon: Bed, href: "/shop?category=textiles" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState("");
  
  const { toggleCart, getTotalItems } = useCartStore();
  const { isAuthenticated } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        <div className="pointer-events-auto flex items-center justify-between p-2 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          
          {/* Logo Section */}
          <Link href="/" className="pl-4 pr-6 flex items-center gap-2 group">
            <span className="font-display italic text-2xl font-bold tracking-tight text-gray-900 group-hover:text-[#8c9276] transition-colors">
              Lumina.
            </span>
          </Link>

          {/* Liquid Glass Navigation */}
          <nav className="hidden md:flex items-center gap-1 relative" onMouseLeave={() => setHoveredTab(null)}>
            {TABS.map((tab) => {
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
            <Link 
              href={isAuthenticated ? '/profile' : '/auth/login'}
              aria-label="Perfil" 
              className="p-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-gray-700 hover:bg-white/60 transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
            >
              <User className="w-5 h-5" />
            </Link>
            
            <form onSubmit={handleSearchSubmit} className="relative group">
              <input 
                type="text" 
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Buscar..."
                className="w-0 transition-all duration-300 group-hover:w-48 group-focus-within:w-48 bg-white/40 backdrop-blur-md border border-transparent group-hover:border-white/60 focus:border-white/60 rounded-full py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none shadow-[0_4px_16px_rgba(0,0,0,0.05)] opacity-0 group-hover:opacity-100 focus:opacity-100"
              />
              <button type="submit" aria-label="Buscar" className="absolute left-0 top-0 p-2.5 rounded-full hover:bg-white/50 text-gray-700 transition-colors z-10">
                <Search className="w-5 h-5" />
              </button>
            </form>
            <button 
              aria-label="Carrito" 
              onClick={toggleCart}
              className="relative p-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-gray-900 hover:bg-white/60 transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#8c9276] text-[10px] font-bold text-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
            
            <button className="md:hidden p-2.5 rounded-full hover:bg-white/50 text-gray-700 ml-2">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
