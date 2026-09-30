"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/ui/ProductCard";
import { Percent, Truck, ShieldCheck, ArrowRight, RotateCcw, Lock } from "lucide-react";
import Link from "next/link";
import { useCatalogStore } from "@/lib/catalogStore";
import { useAmbientStore } from "@/lib/ambientStore";
import { supabase } from "@/lib/supabase";
import { ProximitySidebar } from "@/components/ui/proximity-sidebar";
import { CatalogScrollToTopButton } from "@/components/ui/CatalogScrollToTopButton";
import { HandwrittenHeroTitle } from "@/components/home/HandwrittenHeroTitle";

const HOME_SECTIONS = [
  { id: "hero-section", label: "Inicio", level: 1 as const },
  { id: "catalog-categories", label: "Explora el Catálogo", level: 2 as const },
  { id: "catalog-popular", label: "Productos Populares", level: 2 as const },
  { id: "envios-garantias", label: "Envíos & Garantías", level: 3 as const },
];

const NICHE_METADATA_MAP: Record<string, { subtitle: string; img: string; defaultPrice: string }> = {
  "aromaterapia": { 
    subtitle: "Difusores & esencias", 
    img: "https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $29"
  },
  "iluminacion": { 
    subtitle: "Lámparas de ambiente", 
    img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $89"
  },
  "home office": { 
    subtitle: "Ergonomía & orden", 
    img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $49"
  },
  "textiles": { 
    subtitle: "Lino y lana natural", 
    img: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $39"
  },
  "gadgets": { 
    subtitle: "Tecnología minimalista", 
    img: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $120"
  },
  "almacenamiento": { 
    subtitle: "Cestas & orden", 
    img: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $34"
  },
  "ceramica": { 
    subtitle: "Vajilla de autor", 
    img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $25"
  },
  "decoracion": { 
    subtitle: "Esculturas & jarrones", 
    img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $45"
  },
  "cocina": { 
    subtitle: "Ritual barista", 
    img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $29"
  },
  "bienestar": { 
    subtitle: "Calma & descanso", 
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
    defaultPrice: "desde $35"
  }
};

const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const TRUST_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  ShieldCheck,
  RotateCcw,
  Percent,
  Lock,
};

interface TrustBadgeItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}

const DEFAULT_TRUST_BADGES: TrustBadgeItem[] = [
  {
    icon: Truck,
    title: "Envíos a todo EC",
    subtitle: "A todo el país",
  },
  {
    icon: ShieldCheck,
    title: "2 años de garantía",
    subtitle: "Calidad certificada",
  },
  {
    icon: RotateCcw,
    title: "Devoluciones 30 días",
    subtitle: "Sin complicaciones",
  },
  {
    icon: Percent,
    title: "Financiación 0%",
    subtitle: "Hasta 12 cuotas",
  },
  {
    icon: Lock,
    title: "Pagos seguros",
    subtitle: "100% cifrado SSL",
  },
];

export default function Home() {
  const { products, categories } = useCatalogStore();
  const { setCategoryTheme, resetTheme } = useAmbientStore();
  const [isMounted, setIsMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [trustBadges, setTrustBadges] = useState<TrustBadgeItem[]>(DEFAULT_TRUST_BADGES);
  const [categoryMeta, setCategoryMeta] = useState<Record<string, { subtitle?: string; description?: string }>>({});

  const heroRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);

  // Derive the 2 mobile-priority trust badges for small screens
  const mobileTrustBadges = useMemo(() => {
    const envios = trustBadges.find(b => b.title.toLowerCase().includes("env")) || trustBadges[0];
    const pagos = trustBadges.find(b => b.title.toLowerCase().includes("pago") || b.title.toLowerCase().includes("segur")) || trustBadges[trustBadges.length - 1];
    return [envios, pagos].filter(Boolean);
  }, [trustBadges]);

  // Derive dynamic category cards strictly from active categories in store
  const dynamicCategories = useMemo(() => {
    return categories.map((catName) => {
      const norm = normalizeText(catName);
      const meta = NICHE_METADATA_MAP[norm];
      const dbMeta = categoryMeta[norm];

      const catProducts = products.filter(p => normalizeText(p.category) === norm);
      let priceText = meta?.defaultPrice || "Colección activa";
      const validPrices = catProducts
        .map(p => Number(p.price))
        .filter(val => !isNaN(val) && isFinite(val) && val > 0);
      if (validPrices.length > 0) {
        const minPrice = Math.min(...validPrices);
        priceText = `desde $${minPrice.toFixed(0)}`;
      }

      const img = meta?.img || catProducts[0]?.imageUrl || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop";
      const subtitle = dbMeta?.subtitle || meta?.subtitle || "Colección exclusiva";

      return {
        name: catName,
        subtitle,
        price: priceText,
        img
      };
    });
  }, [categories, products, categoryMeta]);

  useEffect(() => {
    setIsMounted(true);

    // 1. Fetch trust badges from Supabase store_trust_badges table
    const fetchTrustBadges = async () => {
      try {
        const { data, error } = await supabase
          .from('store_trust_badges')
          .select('title, subtitle, icon_name')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          setTrustBadges(data.map(item => ({
            title: item.title,
            subtitle: item.subtitle,
            icon: TRUST_ICON_MAP[item.icon_name] || ShieldCheck,
          })));
        }
      } catch (err) {
        console.warn("Could not load store_trust_badges from Supabase:", err);
      }
    };

    // 2. Fetch category metadata from Supabase categories table
    const fetchCategoriesMeta = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name, subtitle, description')
          .eq('is_active', true);
        if (!error && data && data.length > 0) {
          const map: Record<string, { subtitle?: string; description?: string }> = {};
          data.forEach(c => {
            map[normalizeText(c.name)] = { subtitle: c.subtitle || undefined, description: c.description || undefined };
          });
          setCategoryMeta(map);
        }
      } catch (err) {
        console.warn("Could not load categories meta from Supabase:", err);
      }
    };

    fetchTrustBadges();
    fetchCategoriesMeta();
  }, []);

  // Continuous bidirectional scroll position tracking to smoothly shift ambient matte glow both down and up
  useEffect(() => {
    if (!isMounted) return;

    let rafId: number | null = null;

    const updateThemeOnScroll = () => {
      rafId = null;
      const scrollY = window.scrollY;

      // 1. Top of page / Hero section (scrolled back up)
      if (scrollY < 180) {
        resetTheme();
        return;
      }

      // 2. Check section positions relative to viewport focal trigger
      const popRect = popularRef.current?.getBoundingClientRect();
      const catRect = categoriesRef.current?.getBoundingClientRect();
      const focalY = window.innerHeight * 0.45;

      if (popRect && popRect.top <= focalY) {
        // Scrolled down into Popular Products or past it to the bottom
        setCategoryTheme(activeFilter === "Todos" ? "iluminacion" : activeFilter);
      } else if (catRect && catRect.top <= focalY) {
        // Inside Categories section
        setCategoryTheme("aromaterapia");
      } else {
        // Scrolled back up into Hero / Trust badges
        resetTheme();
      }
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateThemeOnScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateThemeOnScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isMounted, activeFilter, setCategoryTheme, resetTheme]);

  const displayProducts = isMounted ? products : [];
  
  const filteredProducts = activeFilter === "Todos"
    ? displayProducts
    : displayProducts.filter(p => normalizeText(p.category) === normalizeText(activeFilter));

  return (
    <>
      {/* Hero Section */}
      <section 
        id="hero-section" 
        ref={heroRef} 
        className="relative min-h-[calc(100svh-2.5rem)] sm:min-h-[calc(100dvh-4rem)] flex flex-col justify-between sm:justify-center overflow-hidden bg-brand-900"
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none [contain:paint]">
          <Image 
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000&auto=format&fit=crop" 
            alt="Interior elegante" 
            fill 
            sizes="100vw" 
            className="object-cover pointer-events-none select-none" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-transparent pointer-events-none" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 pt-20 pb-4 sm:pt-20 sm:pb-10 [@media(min-height:760px)]:pt-28 [@media(min-height:760px)]:pb-14 [@media(min-height:860px)]:pt-36 [@media(min-height:860px)]:pb-16 flex-1 flex flex-col justify-between sm:justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl transform-gpu flex-1 flex flex-col justify-between sm:justify-center"
          >
            {/* Bloque superior (Píldora, Título, Subtítulo): Centrado y ordenado en la zona superior */}
            <div className="flex flex-col justify-center my-auto sm:my-0">
              {/* Tag Pill with Instant Hardware-Accelerated Glass Blur */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="relative inline-flex self-start items-center px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full overflow-hidden border border-white/25 text-xs sm:text-sm font-medium text-white mb-2.5 sm:mb-2.5 [@media(min-height:760px)]:mb-4 [@media(min-height:860px)]:mb-6 shadow-sm [isolation:isolate] transform-gpu select-none"
              >
                <div 
                  className="absolute inset-0 bg-white/15 backdrop-blur-xl pointer-events-none transform-gpu"
                  style={{ willChange: "transform, backdrop-filter", WebkitBackdropFilter: "blur(16px)" }}
                />
                <span className="relative z-10">Artículos premium para tu hogar</span>
              </motion.div>

              <HandwrittenHeroTitle />
              
              <p className="mt-3 sm:mt-2.5 [@media(min-height:760px)]:mt-4 [@media(min-height:860px)]:mt-6 text-sm sm:text-xs md:text-base [@media(min-height:760px)]:md:text-lg text-gray-200/90 leading-relaxed max-w-lg font-light">
                Soluciones de estética, comodidad y tecnología pensadas para cada rincón que habitas.
              </p>
            </div>
            
            {/* Bloque inferior de botones: Más abajo, apegados a la barra de garantías, gruesos como antes */}
            <div className="mt-auto sm:mt-4 [@media(min-height:760px)]:mt-6 [@media(min-height:860px)]:mt-8 pb-3 sm:pb-0 flex flex-col sm:flex-row gap-2.5 sm:gap-2.5 sm:gap-3.5">
              <Link 
                href="/shop" 
                className="relative overflow-hidden w-full sm:w-auto rounded-full bg-white/40 hover:bg-white/50 active:bg-white/60 border border-white/60 hover:border-white/80 text-white px-6 sm:px-5 [@media(min-height:760px)]:px-7 py-4 sm:py-2.5 [@media(min-height:760px)]:py-3 flex items-center justify-center gap-2 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] transform-gpu group cursor-pointer select-none min-h-[50px] sm:min-h-0"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-medium text-sm sm:text-xs md:text-base text-white drop-shadow-sm">
                  Ver catálogo <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>

              <a 
                href="#catalog-popular" 
                className="relative overflow-hidden w-full sm:w-auto rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] border border-white/30 hover:border-white/50 text-white px-6 sm:px-5 [@media(min-height:760px)]:px-7 py-4 sm:py-2.5 [@media(min-height:760px)]:py-3 flex items-center justify-center backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] transform-gpu group cursor-pointer select-none min-h-[50px] sm:min-h-0"
              >
                <span className="relative z-10 font-medium text-sm sm:text-xs md:text-base text-white drop-shadow-sm">
                  Filtrar por categoría
                </span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges Bar (Centered exactly at 50% across the division seam on all devices) */}
      <div
        id="envios-garantias"
        className="relative z-30 -translate-y-1/2 -mb-7 sm:-mb-9 lg:-mb-10 container mx-auto px-4 sm:px-6 md:px-8 scroll-mt-36"
        style={{ transform: "translateY(-50%)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-[#1e1e20] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.02)] p-2.5 sm:p-3.5 md:p-4"
        >

          {/* ── Mobile / Pantallas pequeñas (< lg): Solo 2 badges compactos en una sola fila ── */}
          <div className="grid grid-cols-2 lg:hidden items-center">
            {mobileTrustBadges.map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center gap-2 sm:gap-2.5 px-2 relative select-none"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#8c9276]/10 dark:bg-[#8c9276]/20 text-[#8c9276] dark:text-[#a8b092] flex items-center justify-center shrink-0">
                  <badge.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 tracking-tight leading-tight truncate">
                    {badge.title}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 font-normal leading-tight truncate">
                    {badge.subtitle}
                  </p>
                </div>
                {idx === 0 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-200/70 dark:bg-white/10" />
                )}
              </div>
            ))}
          </div>

          {/* ── Desktop / Pantallas normales (≥ lg): Todas las 5 garantías de la manera normal ── */}
          <div className="hidden lg:grid lg:grid-cols-5 items-center">
            {trustBadges.map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 xl:gap-3 justify-center relative group px-2 select-none"
              >
                <div className="w-9 h-9 rounded-xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 text-[#8c9276] dark:text-[#a8b092] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-2xs">
                  <badge.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 select-none">
                  <p className="text-xs xl:text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight leading-snug whitespace-nowrap">
                    {badge.title}
                  </p>
                  <p className="text-[10px] xl:text-[11px] text-gray-400 font-normal leading-tight whitespace-nowrap">
                    {badge.subtitle}
                  </p>
                </div>
                {idx < trustBadges.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-px bg-gray-200/80 dark:bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>


      {/* Immersive Background Wrapper for Catalog Sections */}
      <div className="relative overflow-hidden bg-transparent">

        {/* Categories Section */}
        <section 
          id="catalog-categories" 
          ref={categoriesRef} 
          className="py-24 relative z-10 scroll-mt-36"
        >
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "transform, opacity" }}
              className="flex items-end justify-between mb-8 sm:mb-12 transform-gpu"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-sans font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Explora el <span className="font-display italic text-accent-700 dark:text-[#8c9276]">Catálogo</span>
                </h2>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Encuentra la pieza perfecta para tu rincón favorito.</p>
              </div>
            </motion.div>
            
            <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${
              dynamicCategories.length <= 4 
                ? "md:grid-cols-2 lg:grid-cols-4" 
                : "md:grid-cols-3 lg:grid-cols-5"
            }`}>
              {dynamicCategories.map((cat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  style={{ willChange: "transform, opacity" }}
                  className="transform-gpu"
                >
                  <Link 
                    href={`/shop?category=${cat.name.toLowerCase()}`} 
                    scroll={true}
                    onClick={() => {
                      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                    }}
                    onMouseEnter={() => setCategoryTheme(cat.name)}
                    onMouseLeave={() => setCategoryTheme("aromaterapia")}
                    className="group relative h-[240px] sm:h-[300px] md:h-[320px] rounded-2xl overflow-hidden block shadow-sm border border-black/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
                  >
                    <Image src={cat.img} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform duration-700 group-hover:scale-105" alt={cat.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-3 sm:p-5 flex items-end justify-between">
                      <div>
                        <span className="text-white/60 text-[10px] sm:text-[11px] font-light uppercase tracking-wider block mb-0.5">{cat.subtitle}</span>
                        <h3 className="text-white font-medium text-base sm:text-lg leading-tight">{cat.name}</h3>
                        <p className="text-white/80 text-xs font-light mt-0.5 sm:mt-1">{cat.price}</p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors shrink-0 ml-2">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Products Section */}
        <section 
          id="catalog-popular" 
          ref={popularRef} 
          className="py-16 sm:py-20 relative z-10 scroll-mt-36"
        >
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "transform, opacity" }}
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 sm:mb-12 gap-4 sm:gap-6 transform-gpu"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-sans font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Productos <span className="font-display italic text-accent-700 dark:text-[#8c9276]">Populares</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Selección destacada para transformar cada espacio.</p>
              </div>

              {/* Dynamic Interactive Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full lg:w-auto hide-scrollbar">
                {["Todos", ...categories].map((filter) => {
                  const isActive = activeFilter === filter;
                  return (
                    <button 
                      key={filter}
                      onClick={() => {
                        setActiveFilter(filter);
                        if (filter === "Todos") resetTheme();
                        else setCategoryTheme(filter);
                      }}
                      onMouseEnter={() => {
                        if (filter !== "Todos") setCategoryTheme(filter);
                      }}
                      className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-white/60 dark:bg-white/15 backdrop-blur-xl border border-white/80 dark:border-white/20 text-gray-900 dark:text-gray-100 shadow-md shadow-black/5' 
                          : 'bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </motion.div>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-white/50 dark:border-white/10">
                <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">No hay productos en esta categoría por el momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredProducts.slice(0, 8).map((product, idx) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: (idx % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    style={{ willChange: "transform, opacity" }}
                    className="transform-gpu"
                    onMouseEnter={() => setCategoryTheme(product.category)}
                    onMouseLeave={() => setCategoryTheme(activeFilter === "Todos" ? "iluminacion" : activeFilter)}
                  >
                    <ProductCard {...product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Rare UI Proximity Sidebar (Lateral derecho para desktop) */}
      <div className="hidden lg:block fixed right-3 xl:right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
        <ProximitySidebar sections={HOME_SECTIONS} side="right" />
      </div>

      {/* Floating Centered Scroll-To-Top Button for Catalog */}
      <CatalogScrollToTopButton threshold={450} className="bottom-6 sm:bottom-8" />
    </>
  );
}
