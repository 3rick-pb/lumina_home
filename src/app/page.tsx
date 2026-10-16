"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/ui/ProductCard";
import { Percent, Truck, ShieldCheck, ArrowRight, RotateCcw, Lock, PackageSearch, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCatalogStore } from "@/lib/catalogStore";
import { useAmbientStore } from "@/lib/ambientStore";
import { supabase } from "@/lib/supabase";
import { ProximitySidebar } from "@/components/ui/proximity-sidebar";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { HandwrittenHeroTitle } from "@/components/home/HandwrittenHeroTitle";
import { useHeroTimePhase } from "@/hooks/useHeroTimePhase";
import { DynamicHeroBackground } from "@/components/hero/DynamicHeroBackground";
import { LuminaBootOrchestrator } from "@/components/home/LuminaBootOrchestrator";

const HOME_SECTIONS = [
  { id: "hero-section", label: "Inicio", level: 1 as const },
  { id: "catalog-categories", label: "Explora el Catálogo", level: 2 as const },
  { id: "catalog-popular", label: "Productos Populares", level: 2 as const },
  { id: "envios-garantias", label: "Envíos & Rastreo", level: 3 as const },
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
  PackageSearch,
};

const mobileBadgeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    scale: 0.98,
  }),
};

interface TrustBadgeItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}

const DEFAULT_TRUST_BADGES: TrustBadgeItem[] = [
  {
    icon: Truck,
    title: "Envíos nacionales",
    subtitle: "A todo el país",
  },
  {
    icon: PackageSearch,
    title: "Sigue tu paquete",
    subtitle: "Paso a paso en tiempo real",
  },
  {
    icon: RotateCcw,
    title: "Devoluciones 10 días",
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
  const heroTime = useHeroTimePhase();
  const [isMounted, setIsMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [trustBadges, setTrustBadges] = useState<TrustBadgeItem[]>(DEFAULT_TRUST_BADGES);
  const [categoryMeta, setCategoryMeta] = useState<Record<string, { subtitle?: string; description?: string }>>({});
  
  // Sincronización precisa de la animación caligráfica con el fade-out del splash
  const [startHeroAnimation, setStartHeroAnimation] = useState(false);
  const [showAllNicheFilters, setShowAllNicheFilters] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);

  // Derive the 2 mobile pages of trust badges
  const mobileBadgePages = useMemo(() => {
    const envios = trustBadges.find(b => b.title.toLowerCase().includes("env")) || trustBadges[0];
    const tracking = trustBadges.find(b => 
      b.title.toLowerCase().includes("paquete") || 
      b.title.toLowerCase().includes("sigue") || 
      b.title.toLowerCase().includes("rastr")
    ) || trustBadges[1];
    const devolucion = trustBadges.find(b => 
      b.title.toLowerCase().includes("devoluc") || 
      b.title.toLowerCase().includes("retur")
    ) || trustBadges[2];
    const pagos = trustBadges.find(b => 
      b.title.toLowerCase().includes("pago") || 
      b.title.toLowerCase().includes("segur") ||
      b.title.toLowerCase().includes("ssl")
    ) || trustBadges[4] || trustBadges[3];

    const page1 = [envios, tracking].filter(Boolean);
    const page2 = [devolucion, pagos].filter(Boolean);

    return [page1, page2];
  }, [trustBadges]);

  const [[mobileBadgePage, mobileBadgeDirection], setMobileBadgePage] = useState<[number, number]>([0, 0]);
  const badgeTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleBadgeTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    badgeTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleBadgeTouchEnd = (e: React.TouchEvent) => {
    if (!badgeTouchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = badgeTouchStartRef.current.x - touch.clientX;
    const diffY = badgeTouchStartRef.current.y - touch.clientY;

    if (Math.abs(diffX) > Math.abs(diffY) * 1.2 && Math.abs(diffX) > 25) {
      if (diffX > 0 && mobileBadgePage < mobileBadgePages.length - 1) {
        setMobileBadgePage([mobileBadgePage + 1, 1]);
      } else if (diffX < 0 && mobileBadgePage > 0) {
        setMobileBadgePage([mobileBadgePage - 1, -1]);
      }
    }
    badgeTouchStartRef.current = null;
  };

  // Derive dynamic category cards
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

    const fetchTrustBadges = async () => {
      try {
        const { data, error } = await supabase
          .from('store_trust_badges')
          .select('id, title, subtitle, icon_name')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: TrustBadgeItem[] = [];
          const seenTitles = new Set<string>();

          for (const item of data) {
            const lowerId = (item.id || "").toLowerCase();
            const lowerTitle = (item.title || "").toLowerCase();

            if (lowerId === 'support' || lowerTitle.includes('soporte') || lowerTitle.includes('vip')) {
              continue;
            }

            if (lowerId === 'warranty' || lowerTitle.includes('garant')) {
              continue;
            }

            let title = item.title;
            let subtitle = item.subtitle || "";
            let iconComponent = TRUST_ICON_MAP[item.icon_name] || ShieldCheck;

            if (lowerId.includes('shipping') || lowerTitle.includes('envio') || lowerTitle.includes('envío') || lowerTitle.includes('nacion')) {
              title = "Envíos nacionales";
              subtitle = subtitle || "A todo el país";
              iconComponent = Truck;
            } else if (lowerId.includes('track') || lowerTitle.includes('sigue') || lowerTitle.includes('paquete')) {
              title = "Sigue tu paquete";
              subtitle = "Paso a paso en tiempo real";
              iconComponent = PackageSearch;
            } else if (lowerId.includes('return') || lowerTitle.includes('devoluc')) {
              title = "Devoluciones 10 días";
              subtitle = subtitle || "Sin complicaciones";
              iconComponent = RotateCcw;
            } else if (lowerId.includes('financ') || lowerTitle.includes('cuota')) {
              title = "Financiación 0%";
              subtitle = subtitle || "Hasta 12 cuotas";
              iconComponent = Percent;
            } else if (lowerId.includes('pay') || lowerId.includes('sec') || lowerTitle.includes('pago') || lowerTitle.includes('segur') || lowerTitle.includes('ssl')) {
              title = "Pagos seguros";
              subtitle = subtitle || "100% cifrado SSL";
              iconComponent = Lock;
            }

            const normTitle = normalizeText(title);
            if (!seenTitles.has(normTitle)) {
              seenTitles.add(normTitle);
              mapped.push({
                title,
                subtitle,
                icon: iconComponent,
              });
            }
          }

          if (mapped.length > 0) {
            setTrustBadges(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not load store_trust_badges from Supabase:", err);
      }
    };

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

  // Velo degradado inferior de color puro CSS (0% costo GPU):
  // Aparece suavemente al hacer scroll hacia abajo para explorar el catálogo y desaparece al subir al Hero
  const [showCatalogGradient, setShowCatalogGradient] = useState(false);
  const showCatalogGradientRef = useRef(false);
  const gradientRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      if (gradientRafRef.current !== null) return;
      gradientRafRef.current = window.requestAnimationFrame(() => {
        gradientRafRef.current = null;
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const shouldShow = scrollY > 400;
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

  const handlePointerEnterCategory = (catName: string) => {
    setCategoryTheme(catName);
  };

  const handlePointerLeaveCategory = (fallback = "default") => {
    if (fallback === "default") resetTheme();
    else setCategoryTheme(fallback);
  };

  const displayProducts = isMounted ? products : [];
  
  const filteredProducts = activeFilter === "Todos"
    ? displayProducts
    : displayProducts.filter(p => normalizeText(p.category) === normalizeText(activeFilter));

  const activeHeroImageUrl = heroTime.currentPhase?.imageSrc || "/images/hero/Medio_Dia.jpg";

  return (
    <LuminaBootOrchestrator
      activeHeroImageUrl={activeHeroImageUrl}
      onReadyToAnimateText={() => setStartHeroAnimation(true)}
    >
      {/* Hero Section */}
      <section 
        id="hero-section" 
        ref={heroRef} 
        data-ambient-category="default"
        className="relative min-h-[calc(100svh-2.5rem)] sm:min-h-[calc(100dvh-4rem)] flex flex-col justify-between sm:justify-center overflow-hidden bg-brand-900"
      >
        <DynamicHeroBackground 
          activePhaseId={heroTime.phaseId}
          displayedPeriod={heroTime.displayedPeriod}
          previousPeriod={heroTime.previousPeriod}
          isHeroReady={heroTime.isHeroReady}
        />

        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 pt-20 pb-4 sm:pt-20 sm:pb-10 [@media(min-height:760px)]:pt-28 [@media(min-height:760px)]:pb-14 [@media(min-height:860px)]:pt-36 [@media(min-height:860px)]:pb-16 flex-1 flex flex-col justify-between sm:justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl transform-gpu flex-1 flex flex-col justify-between sm:justify-center"
          >
            {/* Bloque superior */}
            <div className="flex flex-col justify-center my-auto sm:my-0">
              <div className="flex items-center gap-2 mb-2.5 sm:mb-2.5 [@media(min-height:760px)]:mb-4 [@media(min-height:860px)]:mb-6 flex-wrap">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="relative inline-flex items-center px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full overflow-hidden border border-white/25 text-xs sm:text-sm font-medium text-white shadow-sm [isolation:isolate] transform-gpu select-none"
                >
                  <div 
                    className="absolute inset-0 bg-white/15 backdrop-blur-xl pointer-events-none transform-gpu"
                    style={{ willChange: "transform, backdrop-filter", WebkitBackdropFilter: "blur(16px)" }}
                  />
                  <span className="relative z-10">Artículos premium para tu hogar</span>
                </motion.div>
              </div>

              {/* Título Caligráfico sincronizado exactamente con la apertura del telón */}
              <HandwrittenHeroTitle isReady={startHeroAnimation && heroTime.isHeroReady} />
              
              <p className="mt-3 sm:mt-2.5 [@media(min-height:760px)]:mt-4 [@media(min-height:860px)]:mt-6 text-sm sm:text-xs md:text-base [@media(min-height:760px)]:md:text-lg text-gray-200/90 leading-relaxed max-w-lg font-light">
                Soluciones de estética, comodidad y tecnología pensadas para cada rincón que habitas.
              </p>
            </div>
            
            {/* Bloque inferior de botones */}
            <div className="mt-auto sm:mt-4 [@media(min-height:760px)]:mt-6 [@media(min-height:860px)]:mt-8 pb-3 sm:pb-0 flex flex-col sm:flex-row gap-2.5 sm:gap-3.5">
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

      {/* Trust Badges Bar */}
      <div
        id="envios-garantias"
        className="relative z-30 -translate-y-1/2 -mb-8 sm:-mb-10 lg:-mb-10 container mx-auto px-4 sm:px-6 md:px-8 scroll-mt-36"
        style={{ transform: "translateY(-50%)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-[#1e1e20] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.02)] py-4 px-3 sm:py-5 sm:px-4 md:py-4.5 md:px-5 lg:py-4 lg:px-4"
        >
          {/* Mobile badges */}
          <div 
            className="lg:hidden select-none touch-pan-y"
            onTouchStart={handleBadgeTouchStart}
            onTouchEnd={handleBadgeTouchEnd}
          >
            <div className="relative overflow-hidden min-h-[46px] sm:min-h-[50px] flex items-center">
              <AnimatePresence mode="popLayout" initial={false} custom={mobileBadgeDirection}>
                <motion.div
                  key={mobileBadgePage}
                  custom={mobileBadgeDirection}
                  variants={mobileBadgeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 360, damping: 32, mass: 0.8 },
                    opacity: { duration: 0.2, ease: "easeOut" },
                  }}
                  className="w-full grid grid-cols-2 items-center"
                >
                  {(mobileBadgePages[mobileBadgePage] || []).map((badge, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center gap-2.5 sm:gap-3.5 px-2 relative select-none"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 text-[#8c9276] dark:text-[#a8b092] flex items-center justify-center shrink-0 shadow-2xs">
                        <badge.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight leading-tight truncate">
                          {badge.title}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-400 font-normal leading-tight mt-0.5 truncate">
                          {badge.subtitle}
                        </p>
                      </div>
                      {idx === 0 && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 sm:h-9 w-px bg-gray-200/80 dark:bg-white/10" />
                      )}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-2.5 pb-0.5 pointer-events-auto">
              {mobileBadgePages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (idx !== mobileBadgePage) {
                      setMobileBadgePage([idx, idx > mobileBadgePage ? 1 : -1]);
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    mobileBadgePage === idx
                      ? "w-6 bg-gray-900 dark:bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
                      : "w-1.5 bg-gray-400/50 dark:bg-white/25 hover:bg-gray-600 dark:hover:bg-white/50"
                  }`}
                  aria-label={`Página ${idx + 1} de garantías`}
                />
              ))}
            </div>
          </div>

          {/* Desktop badges */}
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

      {/* Catalog Sections Wrapper */}
      <div className="relative bg-transparent">

        {/* Categories Section (Bento superior) */}
        <section 
          id="catalog-categories" 
          ref={categoriesRef} 
          className="py-20 sm:py-24 relative z-10 scroll-mt-36"
        >
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {dynamicCategories.slice(0, 4).map((cat, idx) => (
                <div
                  key={idx}
                  data-ambient-category={cat.name.toLowerCase()}
                  className="transform-gpu"
                >
                  <Link 
                    href={`/shop?category=${cat.name.toLowerCase()}`} 
                    scroll={true}
                    onClick={() => {
                      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                    }}
                    onMouseEnter={() => handlePointerEnterCategory(cat.name)}
                    onMouseLeave={() => handlePointerLeaveCategory("default")}
                    className="group relative h-[240px] sm:h-[300px] md:h-[320px] rounded-2xl overflow-hidden block shadow-xs border border-black/5 transition-transform duration-300 ease-out hover:-translate-y-1 transform-gpu"
                  >
                    <Image 
                      src={cat.img} 
                      fill 
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" 
                      loading="lazy"
                      decoding="async"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] transform-gpu" 
                      alt={cat.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-3 sm:p-5 flex items-end justify-between">
                      <div>
                        <span className="text-white/60 text-[10px] sm:text-[11px] font-light uppercase tracking-wider block mb-0.5">{cat.subtitle}</span>
                        <h3 className="text-white font-medium text-base sm:text-lg leading-tight">{cat.name}</h3>
                        <p className="text-white/80 text-xs font-light mt-0.5 sm:mt-1">{cat.price}</p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/30 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors shrink-0 ml-2">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}

              {/* Quinta Tarjeta: Flecha interactiva hacia la sección "TODO" (catálogo completo) */}
              <div className="col-span-2 sm:col-span-1 transform-gpu">
                <Link 
                  href="/shop" 
                  scroll={true}
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                  }}
                  onMouseEnter={() => handlePointerEnterCategory("default")}
                  onMouseLeave={() => handlePointerLeaveCategory("default")}
                  className="group relative h-[160px] sm:h-[300px] md:h-[320px] rounded-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 md:p-6 bg-gradient-to-br from-[#242c1d] via-[#1a2114] to-[#10150d] dark:from-[#1b2216] dark:via-[#13190f] dark:to-[#0b0e09] border border-white/10 shadow-xs transition-transform duration-300 ease-out hover:-translate-y-1 transform-gpu cursor-pointer"
                >
                  {/* Glow sutil verde bosque brandeado Lumina */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(140,146,118,0.22),transparent_70%)] pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[#cbd4b7] text-[10px] sm:text-[11px] font-medium uppercase tracking-widest">
                      Colección Global
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/90 font-mono">
                      TODO
                    </span>
                  </div>

                  <div className="relative z-10 flex items-end justify-between mt-auto">
                    <div>
                      <h3 className="text-white font-display italic text-xl sm:text-2xl lg:text-3xl leading-tight">
                        Ver Todo
                      </h3>
                      <p className="text-gray-300/80 text-[11px] sm:text-xs font-light mt-0.5 sm:mt-1">
                        Todas las piezas
                      </p>
                    </div>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-gray-950 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#8c9276] group-hover:text-white transition-all duration-300 shadow-md shrink-0 ml-2">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </div>
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
            {/* Header: Título y descripción en 1 sola línea, con la barra de nichos en una capa/nivel inferior */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "transform, opacity" }}
              className="flex flex-col mb-8 sm:mb-10 gap-4 sm:gap-5 transform-gpu"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-sans font-medium text-gray-900 dark:text-gray-100 mb-1 whitespace-nowrap">
                  Productos <span className="font-display italic text-accent-700 dark:text-[#8c9276]">Populares</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                  Selección destacada para transformar cada espacio.
                </p>
              </div>

              {/* Barra de Filtros / Nichos Rediseñada: 5 primeros + Botón Ver más interactivo */}
              <div className="relative w-full">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap py-1 px-0.5 w-full">
                  {(showAllNicheFilters ? ["Todos", ...categories] : ["Todos", ...categories].slice(0, 5)).map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                      <button 
                        key={filter}
                        type="button"
                        onClick={() => {
                          setActiveFilter(filter);
                          if (filter === "Todos") resetTheme();
                          else setCategoryTheme(filter);
                        }}
                        onMouseEnter={() => {
                          if (filter !== "Todos") handlePointerEnterCategory(filter);
                        }}
                        className={`relative px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out cursor-pointer shrink-0 select-none ${
                          isActive 
                            ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md shadow-black/10 dark:shadow-white/10 ring-1 ring-black/10 dark:ring-white/20 scale-[1.02]' 
                            : 'bg-white/80 dark:bg-[#1e1e20]/80 backdrop-blur-md text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08] hover:bg-white dark:hover:bg-[#252528] hover:shadow-xs active:scale-95'
                        }`}
                      >
                        {filter}
                        {isActive && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 ml-1.5 align-middle" />
                        )}
                      </button>
                    );
                  })}

                  {/* Botón Ver más / Ver menos si hay más de 5 nichos */}
                  {(["Todos", ...categories].length > 5) && (
                    <button
                      type="button"
                      onClick={() => setShowAllNicheFilters(!showAllNicheFilters)}
                      className="group relative px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-out cursor-pointer shrink-0 flex items-center gap-1.5 bg-[#8c9276]/15 dark:bg-[#8c9276]/25 text-[#3e482b] dark:text-[#d4dbbe] border border-[#8c9276]/30 dark:border-[#8c9276]/40 hover:bg-[#8c9276]/25 dark:hover:bg-[#8c9276]/35 active:scale-95 shadow-2xs"
                    >
                      <span>
                        {showAllNicheFilters 
                          ? "Ver menos" 
                          : `Ver más (+${["Todos", ...categories].length - 5})`}
                      </span>
                      <ChevronDown 
                        className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${
                          showAllNicheFilters ? "rotate-180" : "group-hover:translate-y-0.5"
                        }`} 
                      />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs">
                <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">No hay productos en esta categoría por el momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredProducts.slice(0, 8).map((product) => (
                  <div 
                    key={product.id}
                    data-ambient-category={product.category.toLowerCase()}
                    className="transform-gpu"
                    onMouseEnter={() => handlePointerEnterCategory(product.category)}
                    onMouseLeave={() => handlePointerLeaveCategory(activeFilter === "Todos" ? "default" : activeFilter)}
                  >
                    <ProductCard {...product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Rare UI Proximity Sidebar (Desktop) */}
      <div className="hidden lg:block fixed right-3 xl:right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
        <ProximitySidebar sections={HOME_SECTIONS} side="right" />
      </div>

      {/* Botón flotante '+ Volver arriba' aislado en la raíz del viewport */}
      <BackToTopButton threshold={600} />

      {/* Velo degradado verde bosque brandeado desde abajo hacia arriba (Puro CSS, 0% costo GPU, 120 FPS) */}
      <div
        aria-hidden="true"
        className={`fixed bottom-0 left-0 right-0 h-36 sm:h-48 lg:h-56 pointer-events-none z-30 transition-opacity duration-700 ease-out ${
          showCatalogGradient ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(20, 27, 16, 0.96) 0%, rgba(20, 27, 16, 0.75) 25%, rgba(20, 27, 16, 0.40) 55%, rgba(20, 27, 16, 0.10) 80%, transparent 100%)",
        }}
      />
    </LuminaBootOrchestrator>
  );
}
