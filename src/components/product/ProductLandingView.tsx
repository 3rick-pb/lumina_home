"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShoppingBag, 
  Heart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Check, 
  Star, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Award, 
  Leaf, 
  Box, 
  Layers,
  Eye,
  Play,
  ArrowRight,
  Maximize2,
  X
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/userStore";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeImageUrl } from "@/lib/imageUtils";
import { Isometric3DGallery } from "./Isometric3DGallery";
import { ProductCard } from "@/components/ui/ProductCard";
import { flyToCart } from "@/components/ui/FlyToCartAnimation";

interface ProductLandingViewProps {
  product: CatalogProduct;
  allProducts: CatalogProduct[];
  currentImage: string;
  images: string[];
  activeImage: number;
  setActiveImage: (idx: number) => void;
  activeColor: number;
  setActiveColor: (idx: number) => void;
  activeSize: string;
  setActiveSize: (size: string) => void;
  handleAddToCart: () => void;
  isAdding: boolean;
  isAgotado: boolean;
}

export function ProductLandingView({
  product,
  allProducts,
  currentImage,
  images,
  activeImage,
  setActiveImage,
  activeColor,
  setActiveColor,
  activeSize,
  setActiveSize,
  handleAddToCart,
  isAdding,
  isAgotado: isAgotadoProp,
}: ProductLandingViewProps) {
  const isAgotado = isAgotadoProp || (product.stock !== undefined && product.stock <= 0);
  const { addItem, addBundle, setIsOpen: setCartOpen } = useCartStore();
  const isInBag = useCartStore((state) =>
    state.items.some((item) => !item.isBundle && (item.productId === product.id || item.product?.id === product.id))
  );
  const { toggleFavorite, isFavorite } = useUserStore();
  const isFav = isFavorite(product.id);

  // Lightbox / Zoom modal state
  const [showZoom, setShowZoom] = useState(false);

  // Selected volume tier quantity: 1, 2, or 3
  const [selectedTierQty, setSelectedTierQty] = useState<number>(2);

  // General quantity selector
  const [quantity, setQuantity] = useState(1);

  // Active callout spotlight pin index (0 to 5)
  const [hoveredSpecIndex, setHoveredSpecIndex] = useState<number | null>(null);

  // Feedback states
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [tierSuccess, setTierSuccess] = useState(false);
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [bundleSuccess, setBundleSuccess] = useState(false);

  // Active UGC modal preview
  const [activeUgcModal, setActiveUgcModal] = useState<number | null>(null);

  // Volume tier discounts & pricing
  const tierDiscounts: Record<number, number> = { 1: 0, 2: 15, 3: 25 };
  const currentTierDiscount = tierDiscounts[selectedTierQty] || 0;
  const singleUnitPrice = product.price;
  const tierUnitPrice = Number((singleUnitPrice * (1 - currentTierDiscount / 100)).toFixed(2));
  const tierTotalPrice = Number((tierUnitPrice * selectedTierQty * quantity).toFixed(2));
  const rawTierTotal = singleUnitPrice * selectedTierQty * quantity;
  const tierSavings = Number((rawTierTotal - tierTotalPrice).toFixed(2));

  // Handle Add Volume Tier to Cart
  const handleAddTierToCart = (e?: React.MouseEvent) => {
    if (isAgotado) return;
    flyToCart(e?.currentTarget, images[0] || product.imageUrl);
    setIsAddingTier(true);

    if (currentTierDiscount > 0) {
      const tierItems = [];
      for (let i = 0; i < selectedTierQty; i++) {
        tierItems.push({
          product,
          color: product.colors?.[activeColor]?.name,
          size: activeSize || undefined,
        });
      }
      for (let q = 0; q < quantity; q++) {
        addBundle({
          bundleName: `Pack Ahorro x${selectedTierQty} Piezas`,
          bundleBadge: `-${currentTierDiscount}% EXTRA`,
          bundleDiscountPercent: currentTierDiscount,
          bundleCustomPrice: tierUnitPrice * selectedTierQty,
          products: tierItems,
        });
      }
    } else {
      for (let i = 0; i < selectedTierQty * quantity; i++) {
        addItem(product, 1, product.colors?.[activeColor]?.name, activeSize || undefined);
      }
    }

    setTimeout(() => {
      setIsAddingTier(false);
      setTierSuccess(true);
      setTimeout(() => setTierSuccess(false), 2500);
    }, 800);
  };

  // Handle Buy Now (adds to cart & opens cart drawer immediately)
  const handleBuyNow = (e?: React.MouseEvent) => {
    if (isAgotado) return;
    handleAddTierToCart(e);
    setTimeout(() => {
      setCartOpen(true);
    }, 400);
  };

  // =========================================================================
  // SECTION 2: BUNDLE COMPANION CANDIDATES (Always 2 companions => 3 items)
  // =========================================================================
  const companionCandidates = useMemo(() => {
    let list: CatalogProduct[] = [];
    if (product.landingBundle?.companionProductIds && product.landingBundle.companionProductIds.length > 0) {
      list = allProducts.filter(p => product.landingBundle?.companionProductIds?.includes(p.id));
    }
    if (list.length < 2) {
      const sameCategory = allProducts.filter(p => p.id !== product.id && p.category === product.category && !list.some(item => item.id === p.id));
      list = [...list, ...sameCategory];
    }
    if (list.length < 2) {
      const others = allProducts.filter(p => p.id !== product.id && !list.some(item => item.id === p.id));
      list = [...list, ...others];
    }
    return list.slice(0, 2);
  }, [allProducts, product.id, product.category, product.landingBundle?.companionProductIds]);

  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>(() =>
    companionCandidates.map((c) => c.id)
  );

  React.useEffect(() => {
    setSelectedBundleIds(companionCandidates.map((c) => c.id));
  }, [companionCandidates]);

  const bundleCompanionProducts = companionCandidates.filter((p) =>
    selectedBundleIds.includes(p.id)
  );
  const bundleDiscountPct = product.landingBundle?.discountPercentage || 15;
  const companionTotal = bundleCompanionProducts.reduce((acc, p) => acc + p.price, 0);
  const regularBundleTotal = product.price + companionTotal;
  const discountedBundleTotal = Number((regularBundleTotal * (1 - bundleDiscountPct / 100)).toFixed(2));
  const bundleSavings = Number((regularBundleTotal - discountedBundleTotal).toFixed(2));

  const toggleBundleProduct = (id: string) => {
    setSelectedBundleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddBundleToCart = (e?: React.MouseEvent) => {
    if (isAgotado) return;
    flyToCart(e?.currentTarget, images[0] || product.imageUrl);
    setIsAddingBundle(true);

    const bundleItems = [
      {
        product,
        color: product.colors?.[activeColor]?.name,
        size: activeSize || undefined,
      },
      ...bundleCompanionProducts.map((comp) => ({
        product: comp,
        color: comp.colors?.[0]?.name,
        size: comp.sizes?.[0] || "Estándar",
      })),
    ];

    addBundle({
      bundleName: product.landingBundle?.customTitle || "Pack Comprados Juntos",
      bundleBadge: `-${bundleDiscountPct}% DTO`,
      bundleDiscountPercent: bundleDiscountPct,
      bundleCustomPrice: discountedBundleTotal,
      products: bundleItems,
    });

    setTimeout(() => {
      setIsAddingBundle(false);
      setBundleSuccess(true);
      setTimeout(() => setBundleSuccess(false), 3000);
    }, 1000);
  };

  // =========================================================================
  // SECTION 3: 6 TECHNICAL SPECS (3 Left, 3 Right) & Central Anatomy Image
  // =========================================================================
  const anatomyImage = (product.landingAnatomyImage && product.landingAnatomyImage.trim())
    ? normalizeImageUrl(product.landingAnatomyImage.trim())
    : (images[1] || currentImage);

  const defaultSpecs = [
    {
      title: "CHASIS DE ALUMINIO Y ACABADO MATE",
      description: "Estructura aeroespacial ultraligera anodizada resistente a corrosión y marcas de huellas.",
      side: "left" as const,
      pinX: 25,
      pinY: 28,
      icon: ShieldCheck,
    },
    {
      title: "ÓPTICA DIFUSA 360°",
      description: "Difusor de vidrio opalino tratado térmicamente para dispersión uniforme sin deslumbramiento.",
      side: "left" as const,
      pinX: 20,
      pinY: 50,
      icon: Sparkles,
    },
    {
      title: "GESTIÓN TÉRMICA EFICIENTE",
      description: "Disipación pasiva silenciosa que prolonga la vida útil de los componentes por más de 50.000 horas.",
      side: "left" as const,
      pinX: 28,
      pinY: 74,
      icon: Leaf,
    },
    {
      title: "CONTROL TÁCTIL INTUITIVO",
      description: "Sensor capacitivo integrado con regulación suave de intensidad y temperatura lumínica.",
      side: "right" as const,
      pinX: 75,
      pinY: 28,
      icon: Zap,
    },
    {
      title: "CONECTIVIDAD USB-C PD",
      description: "Batería de polímero de litio con carga ultra rápida y autonomía de hasta 24 horas continuas.",
      side: "right" as const,
      pinX: 80,
      pinY: 50,
      icon: Box,
    },
    {
      title: "BASE DE APOYO SOSTENIBLE",
      description: "Apoyo de alta densidad anti-rayaduras que garantiza máxima estabilidad sobre cualquier superficie.",
      side: "right" as const,
      pinX: 72,
      pinY: 74,
      icon: Award,
    },
  ];

  const fullSpecs = useMemo(() => {
    if (product.landingSpecs && product.landingSpecs.length >= 6) {
      return product.landingSpecs.slice(0, 6).map((spec, i) => ({
        ...spec,
        title: spec.title.toUpperCase(),
        side: i < 3 ? ("left" as const) : ("right" as const),
        pinX: spec.pinX ?? defaultSpecs[i].pinX,
        pinY: spec.pinY ?? defaultSpecs[i].pinY,
        icon: defaultSpecs[i].icon,
      }));
    }
    if (product.landingSpecs && product.landingSpecs.length > 0) {
      const merged = product.landingSpecs.map((s, i) => ({
        ...s,
        title: s.title.toUpperCase(),
        side: i < 3 ? ("left" as const) : ("right" as const),
        pinX: s.pinX ?? defaultSpecs[i]?.pinX ?? 50,
        pinY: s.pinY ?? defaultSpecs[i]?.pinY ?? 50,
        icon: defaultSpecs[i]?.icon || ShieldCheck,
      }));
      while (merged.length < 6) {
        merged.push(defaultSpecs[merged.length]);
      }
      return merged;
    }
    return defaultSpecs;
  }, [product.landingSpecs]);

  const leftSpecs = fullSpecs.slice(0, 3);
  const rightSpecs = fullSpecs.slice(3, 6);

  // =========================================================================
  // SECTION 4: UGC STORIES (4 items, 9:16 aspect ratio)
  // =========================================================================
  const ugcStories = [
    {
      author: "Valentina M.",
      role: "Arquitecta de Interiores",
      city: "Madrid, ES",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=720&q=80",
      quote: "La calidez lumínica y la pureza del aluminio cambiaron totalmente mi estudio de diseño. Pieza definitiva.",
      rating: 5,
    },
    {
      author: "Carlos E.",
      role: "Diseñador Industrial",
      city: "Buenos Aires, AR",
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=720&q=80",
      quote: "Acabado anodizado impecable. Llegó en 24 horas perfectamente protegido. Una compra 10 de 10.",
      rating: 5,
    },
    {
      author: "Sofía R.",
      role: "Diseñadora de Iluminación",
      city: "Ciudad de México, MX",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=720&q=80",
      quote: "Lumina cuida los detalles mínimos: el peso, el tacto mate y el confort visual sin deslumbramientos.",
      rating: 5,
    },
    {
      author: "Julián Morales",
      role: "Comprador Verificado",
      city: "Bogotá, CO",
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=720&q=80",
      quote: "Elegí el pack de 2 unidades para las mesas de noche y la sincronización ambiental es maravillosa.",
      rating: 5,
    },
  ];

  // =========================================================================
  // SECTION 5: TRENDING PRODUCTS (3 items)
  // =========================================================================
  const trendingProducts = useMemo(() => {
    const sameCat = allProducts.filter(p => p.id !== product.id && p.category === product.category);
    if (sameCat.length >= 3) return sameCat.slice(0, 3);
    const others = allProducts.filter(p => p.id !== product.id);
    return others.slice(0, 3);
  }, [allProducts, product.id, product.category]);

  // =========================================================================
  // SECTION 6: ZIG-ZAG BENEFITS (3 rows)
  // =========================================================================
  const zigZagBenefits = [
    {
      number: "01",
      title: "Manufactura Artesanal & Materiales Nobles",
      description: "Cada pieza se mecaniza individualmente a partir de aleaciones de aluminio aeroespacial reciclado, complementado con difusores de vidrio soplado artesanal. Diseñado para resistir décadas sin envejecer.",
      highlights: ["Aleación aeroespacial anticorrosión", "Cero plásticos de un solo uso en empaque"],
      image: images[0] || product.imageUrl,
    },
    {
      number: "02",
      title: "Iluminación Circadiana de Alta Fidelidad (CRI 95+)",
      description: "Nuestra ingeniería óptica recrea la progresión de la luz natural diurna, reduciendo la fatiga ocular y promoviendo el bienestar circadiano. Con regulación táctil ultrasuave y sin parpadeo.",
      highlights: ["Control táctil intuitivo multifunción", "Espectro continuo con bajo consumo energético"],
      image: images[1] || images[0] || product.imageUrl,
    },
    {
      number: "03",
      title: "Garantía Oficial Lumina Care de 2 Años",
      description: "Tu inversión está blindada por nuestra garantía directa sin intermediarios. Cobertura completa ante cualquier incidencia técnica con sustitución inmediata y asistencia técnica de por vida.",
      highlights: ["Sustitución directa express sin fricción", "Soporte personalizado por especialistas"],
      image: images[2] || images[0] || product.imageUrl,
    },
  ];

  return (
    <div className="space-y-24 lg:space-y-32">
      
      {/* ========================================================================= */}
      {/* SECCIÓN 1: HERO DE CONVERSIÓN CON SELECTOR DE PACKS                       */}
      {/* ========================================================================= */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Columna Izquierda: Galería con Foto Principal y 4 Miniaturas */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {product.galleryStyle === "isometric_3d" ? (
              <Isometric3DGallery 
                images={images}
                title={product.title}
                category={product.category}
                autoplay={product.galleryAutoplay ?? true}
                autoplaySpeed={product.galleryAutoplaySpeed ?? 4}
              />
            ) : (
              <>
                {/* Foto Principal Cuadrada/Vertical con botón Zoom y Favorito */}
                <div className="relative w-full aspect-[4/5] sm:aspect-square rounded-3xl overflow-hidden bg-gradient-to-b from-black/[0.02] to-black/[0.06] dark:from-white/[0.03] dark:to-white/[0.08] border border-black/5 dark:border-white/10 shadow-2xl group flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src={currentImage}
                        alt={product.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                        quality={95}
                        draggable={false}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none select-none"
                      />
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Badge de Estado */}
                  {(product.badge || isAgotado) && (
                    <div className="absolute top-5 left-5 z-10">
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm backdrop-blur-md transition-colors ${
                          isAgotado
                            ? "bg-red-50/80 dark:bg-red-950/60 border border-red-300 text-red-600 dark:text-red-400"
                            : "bg-white/70 dark:bg-black/60 border border-white/60 dark:border-white/20 text-gray-900 dark:text-white"
                        }`}
                      >
                        {isAgotado ? "AGOTADO" : product.badge}
                      </span>
                    </div>
                  )}

                  {/* Botón Favorito */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`absolute top-5 right-5 z-10 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 cursor-pointer ${
                      isFav
                        ? "bg-red-50 text-red-500 border border-red-200"
                        : "bg-white/80 dark:bg-[#1a1a1c]/80 text-gray-700 dark:text-gray-200 hover:scale-110 border border-black/5 dark:border-white/10"
                    }`}
                    title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                  >
                    <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
                  </button>

                  {/* Botón Lupa Zoom */}
                  <button
                    onClick={() => setShowZoom(true)}
                    className="absolute bottom-5 right-5 z-10 w-11 h-11 rounded-full bg-white/90 dark:bg-[#1a1a1c]/90 text-gray-800 dark:text-white flex items-center justify-center shadow-lg border border-black/5 dark:border-white/10 opacity-90 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                    title="Ampliar fotografía"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Fila Horizontal de 4 Miniaturas */}
                <div className="grid grid-cols-4 gap-3">
                  {images.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 border-2 cursor-pointer ${
                        activeImage === idx
                          ? "border-gray-950 dark:border-white shadow-md scale-102"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={img} alt={`${product.title} vista ${idx + 1}`} fill sizes="120px" quality={90} className="object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Columna Derecha: Información, Urgencia, Packs y Acciones */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-5">
            
            {/* Categoría y Estrellas */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-amber-400">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 text-amber-500">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  4.9 (142 reseñas)
                </span>
              </div>
            </div>

            {/* Título Principal */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-gray-950 dark:text-white leading-[1.12] tracking-tight font-bold">
              <span>{product.title}</span>{" "}
              {product.titleHighlight && (
                <span className="font-display italic font-medium text-[#8c9276] dark:text-amber-400">
                  {product.titleHighlight}
                </span>
              )}
            </h1>

            {/* Texto de Urgencia en Rojo/Ámbar */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-semibold w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              {product.stock !== undefined && product.stock <= 5 && product.stock > 0
                ? `Alta demanda: solo quedan ${product.stock} unidades en stock`
                : "Alta demanda: últimas unidades en stock para despacho inmediato"}
            </div>

            {/* Precio con Etiqueta Roja de Ahorro */}
            <div className="flex items-baseline gap-3 pb-3 border-b border-gray-200/80 dark:border-white/10">
              <span className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
                ${tierUnitPrice.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">/ unidad</span>
              {currentTierDiscount > 0 ? (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ${singleUnitPrice.toFixed(2)}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-black tracking-wide rounded-lg bg-red-600 text-white shadow-xs">
                    {currentTierDiscount}% OFF
                  </span>
                </>
              ) : product.oldPrice && product.oldPrice > product.price ? (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ${Number(product.oldPrice || 0).toFixed(2)}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-black tracking-wide rounded-lg bg-red-600 text-white shadow-xs">
                    {product.discount || "AHORRO"}
                  </span>
                </>
              ) : null}
            </div>

            {/* Párrafo Corto */}
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {product.description ||
                "Una obra magistral de ingeniería de diseño contemporáneo, concebida para brindar una experiencia sensorial envolvente y enriquecer cualquier entorno con elegancia atemporal."}
            </p>

            {/* SELECTOR VISUAL DE OPCIONES DE PAQUETE / VOLUMEN (3 Tarjetas Verticales) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8c9276] dark:text-amber-400" />
                  Opciones de Paquete / Volumen:
                </label>
                {currentTierDiscount > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Ahorras ${tierSavings.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Tarjeta 1: 1 Unidad */}
                <div
                  onClick={() => setSelectedTierQty(1)}
                  className={`p-3 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between text-left ${
                    selectedTierQty === 1
                      ? "bg-white dark:bg-[#202022] border-gray-950 dark:border-white shadow-md ring-1 ring-gray-950/20"
                      : "bg-gray-50/70 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      1 Unidad
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-gray-950 dark:text-white">
                      ${singleUnitPrice.toFixed(2)}
                    </h3>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-medium">Estándar</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedTierQty === 1 ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950' : 'border-gray-300'}`}>
                      {selectedTierQty === 1 && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>

                {/* Tarjeta 2: Pack de 2 (MÁS POPULAR) */}
                <div
                  onClick={() => setSelectedTierQty(2)}
                  className={`p-3 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between text-left relative ${
                    selectedTierQty === 2
                      ? "bg-white dark:bg-[#202022] border-red-600 dark:border-red-500 shadow-md ring-1 ring-red-500/20"
                      : "bg-gray-50/70 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
                      MÁS POPULAR
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
                      Pack de 2
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-gray-950 dark:text-white">
                      ${(singleUnitPrice * 0.85).toFixed(2)}
                      <span className="text-[10px] text-gray-400 font-normal"> /ud</span>
                    </h3>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">-15% OFF</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedTierQty === 2 ? 'bg-red-600 text-white' : 'border-gray-300'}`}>
                      {selectedTierQty === 2 && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>

                {/* Tarjeta 3: Pack de 3 */}
                <div
                  onClick={() => setSelectedTierQty(3)}
                  className={`p-3 rounded-2xl cursor-pointer border-2 transition-all flex flex-col justify-between text-left ${
                    selectedTierQty === 3
                      ? "bg-white dark:bg-[#202022] border-gray-950 dark:border-white shadow-md ring-1 ring-gray-950/20"
                      : "bg-gray-50/70 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      Pack de 3
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-gray-950 dark:text-white">
                      ${(singleUnitPrice * 0.75).toFixed(2)}
                      <span className="text-[10px] text-gray-400 font-normal"> /ud</span>
                    </h3>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">-25% OFF</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedTierQty === 3 ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950' : 'border-gray-300'}`}>
                      {selectedTierQty === 3 && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Variantes: Colores si existen */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Color / Acabado: <span className="font-normal text-gray-500">{product.colors[activeColor]?.name || ''}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveColor(idx)}
                      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        activeColor === idx
                          ? "border-gray-950 dark:border-white bg-gray-950/5 dark:bg-white/10 text-gray-950 dark:text-white ring-1 ring-gray-950 dark:ring-white"
                          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variantes: Tamaños si existen */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Medidas / Formato:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSize(s)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        activeSize === s
                          ? "border-gray-950 dark:border-white bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-xs"
                          : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Cantidad (- 1 +) y Dos Botones Lado a Lado */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3">
                {/* Selector - 1 + */}
                <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-2xl bg-white/80 dark:bg-[#202022] p-1 shadow-xs shrink-0">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-9 text-center font-bold text-sm text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => product.stock !== undefined ? Math.min(product.stock, q + 1) : q + 1)}
                    disabled={product.stock !== undefined && quantity >= product.stock}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 transition-colors font-bold cursor-pointer ${
                      product.stock !== undefined && quantity >= product.stock
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-gray-100 dark:hover:bg-white/10"
                    }`}
                  >
                    +
                  </button>
                </div>

                {/* Dos Botones Lado a Lado: "Comprar Ahora" (Sólido) y "Añadir al Carrito" (Borde) */}
                <div className="flex-1 grid grid-cols-2 gap-2.5">
                  {/* Botón Comprar Ahora (Sólido) */}
                  <button
                    onClick={handleBuyNow}
                    disabled={isAgotado}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                      isAgotado
                        ? "bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed"
                        : "bg-gray-950 dark:bg-white text-white dark:text-gray-950 hover:opacity-90 active:scale-98"
                    }`}
                  >
                    <span>Comprar Ahora</span>
                  </button>

                  {/* Botón Añadir al Carrito (Borde) */}
                  <button
                    onClick={handleAddTierToCart}
                    disabled={isAgotado}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                      isAgotado
                        ? "border-gray-200 dark:border-white/10 text-gray-400 cursor-not-allowed"
                        : tierSuccess
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-950 dark:border-white text-gray-950 dark:text-white hover:bg-gray-950/5 dark:hover:bg-white/10 active:scale-98"
                    }`}
                  >
                    {tierSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Añadido!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Añadir al Carrito</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Fila de Confianza */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-white/5 text-center">
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                  <Truck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Envío 24/48h</span>
                  <span className="text-[10px] text-gray-400">Gratis sobre $50</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Garantía Oficial</span>
                  <span className="text-[10px] text-gray-400">2 Años de Garantía</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                  <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Devoluciones</span>
                  <span className="text-[10px] text-gray-400">30 Días sin cargo</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: "COMPRADOS JUNTOS FRECUENTEMENTE" / COMBO BUNDLE               */}
      {/* ========================================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="relative p-6 sm:p-10 rounded-[2.5rem] bg-gray-50/80 dark:bg-[#151517] backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xl overflow-hidden"
      >
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-amber-400">
                02 // Combo Bundle
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight mt-1">
                Comprados Juntos Frecuentemente
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ahorra llevando el conjunto completo. Diseñados en perfecta sintonía geométrica y lumínica.
              </p>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                Ahorras ${bundleSavings.toFixed(2)} en este paquete
              </span>
            </div>
          </div>

          {/* 3 Tarjetas en Fila separadas por signos + */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-8 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
              {/* Tarjeta 1: Producto Principal */}
              <div className="flex-1 min-w-[140px] p-3.5 rounded-2xl bg-white dark:bg-[#1c1c1f] border border-gray-200/80 dark:border-white/10 shadow-sm">
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-white/5">
                  <Image src={currentImage} alt={product.title} fill sizes="160px" className="object-cover" />
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{product.title}</p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">${product.price.toFixed(2)}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-[#8c9276] dark:text-amber-400">Este artículo</span>
              </div>

              {/* Signo + */}
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-200/70 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold">
                <Plus className="w-4 h-4" />
              </div>

              {/* Tarjeta 2: Companion 1 */}
              {companionCandidates[0] && (
                <div 
                  onClick={() => toggleBundleProduct(companionCandidates[0].id)}
                  className={`flex-1 min-w-[140px] p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    selectedBundleIds.includes(companionCandidates[0].id)
                      ? "bg-white dark:bg-[#1c1c1f] border-gray-950 dark:border-white shadow-sm ring-1 ring-gray-950 dark:ring-white"
                      : "bg-white/40 dark:bg-white/[0.02] border-gray-200/40 dark:border-white/5 opacity-60"
                  }`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-white/5">
                    <Image src={companionCandidates[0].imageUrl} alt={companionCandidates[0].title} fill sizes="160px" className="object-cover" />
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={selectedBundleIds.includes(companionCandidates[0].id)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-gray-900 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{companionCandidates[0].title}</p>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">${companionCandidates[0].price.toFixed(2)}</p>
                  <span className="inline-block mt-1 text-[10px] text-gray-400">Pieza complementaria</span>
                </div>
              )}

              {/* Signo + */}
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-200/70 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold">
                <Plus className="w-4 h-4" />
              </div>

              {/* Tarjeta 3: Companion 2 */}
              {companionCandidates[1] && (
                <div 
                  onClick={() => toggleBundleProduct(companionCandidates[1].id)}
                  className={`flex-1 min-w-[140px] p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    selectedBundleIds.includes(companionCandidates[1].id)
                      ? "bg-white dark:bg-[#1c1c1f] border-gray-950 dark:border-white shadow-sm ring-1 ring-gray-950 dark:ring-white"
                      : "bg-white/40 dark:bg-white/[0.02] border-gray-200/40 dark:border-white/5 opacity-60"
                  }`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-white/5">
                    <Image src={companionCandidates[1].imageUrl} alt={companionCandidates[1].title} fill sizes="160px" className="object-cover" />
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={selectedBundleIds.includes(companionCandidates[1].id)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-gray-900 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{companionCandidates[1].title}</p>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">${companionCandidates[1].price.toFixed(2)}</p>
                  <span className="inline-block mt-1 text-[10px] text-gray-400">Pieza complementaria</span>
                </div>
              )}

            </div>

            {/* Panel de Compra del Bundle */}
            <div className="md:col-span-4 p-5 rounded-2xl bg-white dark:bg-[#1c1c1f] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-center space-y-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Precio total del paquete:</span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-3xl font-black text-gray-950 dark:text-white">
                    ${discountedBundleTotal.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${regularBundleTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  Ahorra llevando el conjunto completo (-{bundleDiscountPct}%)
                </p>
              </div>

              <button
                onClick={handleAddBundleToCart}
                disabled={isAddingBundle || bundleSuccess}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  bundleSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-950 dark:bg-white text-white dark:text-gray-950 hover:opacity-90 active:scale-98"
                }`}
              >
                {bundleSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Paquete añadido a la bolsa!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Comprar Paquete Completo</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* SECCIÓN 3: DIAGRAMA RADIAL DE ANATOMÍA / MATERIALES DE LA PIEZA           */}
      {/* ========================================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-amber-400">
            03 // Diagrama Radial de Ingeniería
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            Anatomía & Materiales de la Pieza
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Pasa el cursor por los 6 bloques o por los pines numerados para descubrir cada tecnología y material.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center max-w-6xl mx-auto">
          
          {/* 3 Bloques a la Izquierda (01, 02, 03) */}
          <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
            {leftSpecs.map((spec, idx) => {
              const specNumber = `0${idx + 1}`;
              const isHovered = hoveredSpecIndex === idx;
              const IconComp = spec.icon || ShieldCheck;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredSpecIndex(idx)}
                  onMouseLeave={() => setHoveredSpecIndex(null)}
                  className={`p-5 rounded-2xl transition-all duration-300 border cursor-pointer ${
                    isHovered
                      ? "bg-white dark:bg-[#202022] border-gray-950 dark:border-white shadow-xl translate-x-2 ring-1 ring-gray-950/20"
                      : "bg-white/60 dark:bg-[#1a1a1c]/60 border-gray-200/70 dark:border-white/10 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                      isHovered ? 'bg-[#8c9276] dark:bg-amber-400 text-gray-950' : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-400">{specNumber}</span>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-950 dark:text-white uppercase tracking-tight">
                        {spec.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-11">
                    {spec.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Círculo Central con Halo Suave y 6 Pines Conectores */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center order-1 lg:order-2 my-6 lg:my-0">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full flex items-center justify-center">
              
              {/* Halo Suave */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8c9276]/20 via-amber-400/15 to-transparent blur-2xl pointer-events-none" />
              
              {/* Anillo exterior decorativo */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#8c9276]/40 dark:border-amber-400/30 animate-spin-slow pointer-events-none" />
              <div className="absolute inset-3 rounded-full border border-gray-300/60 dark:border-white/10 pointer-events-none" />

              {/* Imagen Central en Círculo */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-[#202022] group">
                <Image
                  src={anatomyImage}
                  alt="Anatomía del Producto"
                  fill
                  sizes="260px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized={typeof anatomyImage === 'string' && anatomyImage.startsWith('http')}
                />
              </div>

              {/* 6 Pines Conectores Numerados */}
              {fullSpecs.map((spec, idx) => {
                const posX = spec.pinX ?? defaultSpecs[idx]?.pinX ?? 50;
                const posY = spec.pinY ?? defaultSpecs[idx]?.pinY ?? 50;
                const isHovered = hoveredSpecIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredSpecIndex(idx)}
                    onMouseLeave={() => setHoveredSpecIndex(null)}
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform duration-300"
                  >
                    <div className={`relative flex items-center justify-center transition-transform ${isHovered ? 'scale-125' : 'hover:scale-110'}`}>
                      <span className={`animate-ping absolute inline-flex h-7 w-7 rounded-full opacity-75 ${
                        isHovered ? 'bg-[#8c9276] dark:bg-amber-400' : 'bg-gray-400'
                      }`} />
                      <span className={`relative inline-flex rounded-full h-6 w-6 text-[10px] font-black items-center justify-center shadow-xl border-2 transition-colors ${
                        isHovered
                          ? 'bg-[#8c9276] dark:bg-amber-400 text-gray-950 border-white'
                          : 'bg-gray-950 dark:bg-white text-white dark:text-gray-950 border-white/80'
                      }`}>
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 Bloques a la Derecha (04, 05, 06) */}
          <div className="lg:col-span-4 space-y-4 order-3">
            {rightSpecs.map((spec, idx) => {
              const globalIndex = idx + 3;
              const specNumber = `0${globalIndex + 1}`;
              const isHovered = hoveredSpecIndex === globalIndex;
              const IconComp = spec.icon || Zap;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredSpecIndex(globalIndex)}
                  onMouseLeave={() => setHoveredSpecIndex(null)}
                  className={`p-5 rounded-2xl transition-all duration-300 border cursor-pointer ${
                    isHovered
                      ? "bg-white dark:bg-[#202022] border-gray-950 dark:border-white shadow-xl -translate-x-2 ring-1 ring-gray-950/20"
                      : "bg-white/60 dark:bg-[#1a1a1c]/60 border-gray-200/70 dark:border-white/10 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                      isHovered ? 'bg-[#8c9276] dark:bg-amber-400 text-gray-950' : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-400">{specNumber}</span>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-950 dark:text-white uppercase tracking-tight">
                        {spec.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-11">
                    {spec.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* SECCIÓN 4: "LO QUE DICEN NUESTROS CLIENTES" - GALERÍA VISUAL UGC 9:16      */}
      {/* ========================================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-amber-400">
            04 // Galería Visual UGC
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">4.9 / 5</span>
            <span className="text-sm text-gray-400">• Galería de historias verificadas</span>
          </div>
        </div>

        {/* Carrusel Horizontal de 4 Tarjetas Verticales en Proporción 9:16 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {ugcStories.map((story, idx) => (
            <div
              key={idx}
              className="relative aspect-[9/16] rounded-3xl overflow-hidden group shadow-lg border border-black/5 dark:border-white/10 bg-gray-900 transition-all duration-300 hover:shadow-2xl"
            >
              {/* Foto de ambiente/cliente en formato vertical 9:16 */}
              <Image
                src={story.image}
                alt={story.author}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradiente Oscuro para Legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

              {/* Botón Circular de Visualización */}
              <button
                onClick={() => setActiveUgcModal(idx)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                title="Ver historia"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Badge de Verificado Arriba a la Izquierda */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{story.city}</span>
              </div>

              {/* Información y Cita Abajo */}
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-2.5 z-10 text-white">
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(story.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-gray-200 leading-relaxed italic line-clamp-3">
                  &ldquo;{story.quote}&rdquo;
                </p>
                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{story.author}</p>
                    <p className="text-[10px] text-gray-400">{story.role}</p>
                  </div>
                  <button
                    onClick={() => setActiveUgcModal(idx)}
                    className="text-[10px] font-bold text-[#8c9276] dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* SECCIÓN 5: "PRODUCTOS EN TENDENCIA"                                       */}
      {/* ========================================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-6xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-amber-400">
              05 // Catálogo Curado
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight mt-1">
              Productos en Tendencia
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Otras piezas icónicas de la colección diseñadas para convivir en armonía.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white hover:text-[#8c9276] dark:hover:text-amber-400 transition-colors"
          >
            <span>Ver catálogo completo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grilla de 3 Columnas con Tarjetas de Producto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingProducts.map((trendProd) => (
            <ProductCard key={trendProd.id} {...trendProd} />
          ))}
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* SECCIÓN 6: "¿POR QUÉ ELEGIR ESTA PIEZA?" - BENEFICIOS EN ZIG-ZAG 1-2-3     */}
      {/* ========================================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-6xl mx-auto space-y-16"
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-amber-400">
            06 // Pilares de Excelencia
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            ¿Por Qué Elegir Esta Pieza?
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Tres razones fundamentales que definen la durabilidad, bienestar y valor de manufactura Lumina.
          </p>
        </div>

        {/* 3 Filas Alternadas en Zig-Zag */}
        <div className="space-y-16 lg:space-y-24">
          
          {/* Fila 1: Número 01, Título y Texto a la Izquierda + Imagen Circular con Ondas a la Derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-5xl sm:text-6xl font-black text-[#8c9276]/30 dark:text-amber-400/30">
                {zigZagBenefits[0].number}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight">
                {zigZagBenefits[0].title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {zigZagBenefits[0].description}
              </p>
              <div className="space-y-2 pt-2">
                {zigZagBenefits[0].highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-gray-300/50 dark:border-white/10 animate-ping opacity-25" />
                <div className="absolute inset-3 rounded-full border border-dashed border-[#8c9276]/40 dark:border-amber-400/30 animate-spin-slow pointer-events-none" />
                <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-[#202022] group">
                  <Image src={zigZagBenefits[0].image} alt={zigZagBenefits[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Fila 2: Imagen Circular a la Izquierda + Número 02, Título y Texto a la Derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 flex items-center justify-center order-2 lg:order-1">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-gray-300/50 dark:border-white/10 animate-ping opacity-25" />
                <div className="absolute inset-3 rounded-full border border-dashed border-[#8c9276]/40 dark:border-amber-400/30 animate-spin-slow pointer-events-none" />
                <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-[#202022] group">
                  <Image src={zigZagBenefits[1].image} alt={zigZagBenefits[1].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
              <span className="text-5xl sm:text-6xl font-black text-[#8c9276]/30 dark:text-amber-400/30">
                {zigZagBenefits[1].number}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight">
                {zigZagBenefits[1].title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {zigZagBenefits[1].description}
              </p>
              <div className="space-y-2 pt-2">
                {zigZagBenefits[1].highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 3: Número 03, Título y Texto a la Izquierda + Imagen Circular a la Derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-5xl sm:text-6xl font-black text-[#8c9276]/30 dark:text-amber-400/30">
                {zigZagBenefits[2].number}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight">
                {zigZagBenefits[2].title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {zigZagBenefits[2].description}
              </p>
              <div className="space-y-2 pt-2">
                {zigZagBenefits[2].highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-gray-300/50 dark:border-white/10 animate-ping opacity-25" />
                <div className="absolute inset-3 rounded-full border border-dashed border-[#8c9276]/40 dark:border-amber-400/30 animate-spin-slow pointer-events-none" />
                <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-[#202022] group">
                  <Image src={zigZagBenefits[2].image} alt={zigZagBenefits[2].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX DE ZOOM                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showZoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowZoom(false)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10 cursor-zoom-out"
          >
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-4xl aspect-square max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={currentImage}
                alt={product.title}
                fill
                quality={100}
                className="object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE HISTORIA UGC                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeUgcModal !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveUgcModal(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          >
            <button
              onClick={() => setActiveUgcModal(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md aspect-[9/16] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black flex flex-col justify-end"
            >
              <Image
                src={ugcStories[activeUgcModal].image}
                alt={ugcStories[activeUgcModal].author}
                fill
                quality={95}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
              <div className="relative z-10 p-6 space-y-3 text-white">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(ugcStories[activeUgcModal].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-gray-200 leading-relaxed italic">
                  &ldquo;{ugcStories[activeUgcModal].quote}&rdquo;
                </p>
                <div className="pt-3 border-t border-white/20 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{ugcStories[activeUgcModal].author}</p>
                    <p className="text-xs text-gray-400">{ugcStories[activeUgcModal].role} • {ugcStories[activeUgcModal].city}</p>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verificado</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
