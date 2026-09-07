"use client";

import React, { useState } from "react";
import Image from "next/image";
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
  Leaf 
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/userStore";

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
  isAgotado,
}: ProductLandingViewProps) {
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useUserStore();
  const isFav = isFavorite(product.id);

  // Bundle state
  const companionCandidates = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 2);

  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>(
    companionCandidates.map((c) => c.id)
  );
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [bundleSuccess, setBundleSuccess] = useState(false);

  // Quantity state
  const [quantity, setQuantity] = useState(1);

  // Active callout spotlight pin
  const [hoveredSpecIndex, setHoveredSpecIndex] = useState<number | null>(null);

  // Fallback defaults for landing specs if not set in product
  const defaultSpecs = [
    {
      title: "Chasis de Aluminio y Acabado Mate",
      description: "Estructura aeroespacial ultraligera anodizada resistente a corrosión y marcas de huellas.",
      side: "left" as const,
    },
    {
      title: "Óptica Lumina Difusa 360°",
      description: "Difusor de vidrio opalino tratado térmicamente para dispersión uniforme sin deslumbramiento.",
      side: "left" as const,
    },
    {
      title: "Gestión Térmica & Consumo Inteligente",
      description: "Disipación pasiva silenciosa que prolonga la vida útil de los componentes por más de 50.000 horas.",
      side: "right" as const,
    },
    {
      title: "Conectividad & Carga Ultra Rápida",
      description: "Protocolo USB-C PD universal integrado con selector touch de 4 temperaturas de luz.",
      side: "right" as const,
    },
  ];

  const specs = (product.landingSpecs && product.landingSpecs.length > 0)
    ? product.landingSpecs
    : defaultSpecs;

  const leftSpecs = specs.filter((s, idx) => (s.side ? s.side === "left" : idx % 2 === 0));
  const rightSpecs = specs.filter((s, idx) => (s.side ? s.side === "right" : idx % 2 !== 0));

  // Fallback reviews
  const defaultReviews = [
    {
      author: "Valentina M.",
      role: "Arquitecta de Interiores",
      rating: 5,
      comment: "La calidad de los acabados es sencillamente insuperable. Transforma cualquier rincón y la iluminación es de una calidez excepcional.",
    },
    {
      author: "Carlos E.",
      role: "Comprador Verificado",
      rating: 5,
      comment: "El empaque llegó blindado en 24 horas. El diseño en persona impresiona todavía más que en las fotos. Compra 10 de 10.",
    },
    {
      author: "Sofía R.",
      role: "Diseñadora de Iluminación",
      rating: 5,
      comment: "Lumina cuida los detalles mínimos: el peso, el tacto mate, la temperatura de color. Ya es la pieza central de mi estudio.",
    },
  ];

  const reviews = (product.landingReviews && product.landingReviews.length > 0)
    ? product.landingReviews
    : defaultReviews;

  // Fallback benefits
  const defaultBenefits = [
    {
      title: "Materiales Sostenibles Certificados",
      description: "Trazabilidad mineral y aleaciones reciclables con cero emisiones netas en proceso de fundición.",
      icon: Leaf,
    },
    {
      title: "2 Años de Garantía Lumina Care",
      description: "Cobertura completa ante cualquier anomalía de funcionamiento con sustitución directa y sin trámites.",
      icon: Award,
    },
    {
      title: "Eficiencia Energética Superior",
      description: "Controladores LED de última generación que ahorran hasta un 85% de energía comparado con estándares tradicionales.",
      icon: Zap,
    },
    {
      title: "Ingeniería Sonora Silenciosa",
      description: "Componentes electrónicos libres de zumbidos de alta frecuencia probados en cámaras anecoicas.",
      icon: Sparkles,
    },
  ];

  const benefits = (product.landingBenefits && product.landingBenefits.length > 0)
    ? product.landingBenefits.map((b, i) => ({
        ...b,
        icon: defaultBenefits[i % defaultBenefits.length].icon,
      }))
    : defaultBenefits;

  // Calculate bundle pricing
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

  const handleAddBundleToCart = () => {
    if (isAgotado) return;
    setIsAddingBundle(true);
    // Add main product
    addItem(product, 1, product.colors?.[activeColor]?.name, activeSize);
    // Add companion products
    bundleCompanionProducts.forEach((comp) => {
      addItem(comp, 1, comp.colors?.[0]?.name, comp.sizes?.[0] || "Estándar");
    });
    setTimeout(() => {
      setIsAddingBundle(false);
      setBundleSuccess(true);
      setTimeout(() => setBundleSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-28 lg:space-y-36">
      {/* ========================================================================= */}
      {/* BLOCK 1: HERO BUY BOX (High-Conversion Layout)                            */}
      {/* ========================================================================= */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Gallery Column (Desktop: Left, Mobile: Top) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-full">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar w-full md:w-20 shrink-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-24 md:w-full md:h-28 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2 ${
                    activeImage === idx
                      ? "border-gray-950 dark:border-white shadow-md scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`${product.title} vista ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>

            {/* Main Stage Image */}
            <div className="relative w-full aspect-[4/5] md:aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-b from-black/[0.02] to-black/[0.06] dark:from-white/[0.03] dark:to-white/[0.08] border border-black/5 dark:border-white/10 shadow-2xl group">
              <Image
                src={currentImage}
                alt={product.title}
                fill
                priority
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              
              {/* Badge Overlay */}
              {product.badge && (
                <div className="absolute top-5 left-5 z-10">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm backdrop-blur-md ${
                      isAgotado
                        ? "bg-red-500/90 text-white"
                        : "bg-gray-950/80 dark:bg-white/90 text-white dark:text-gray-950"
                    }`}
                  >
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Quick Favorite Button */}
              <button
                onClick={() => toggleFavorite(product.id)}
                className={`absolute top-5 right-5 z-10 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
                  isFav
                    ? "bg-red-50 text-red-500 border border-red-200"
                    : "bg-white/80 dark:bg-[#1a1a1c]/80 text-gray-700 dark:text-gray-200 hover:scale-110"
                }`}
                title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
              >
                <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Buy Box Column */}
          <div className="lg:col-span-5 flex flex-col justify-start pt-1 space-y-6">
            
            {/* Category Breadcrumb */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-[#ccff00]">
                {product.category}
              </span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <div className="flex items-center gap-1.5 text-amber-500">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  4.9 (142 reseñas)
                </span>
              </div>
            </div>

            {/* Title with mixed font styling */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-gray-950 dark:text-white leading-[1.15] tracking-tight font-bold">
              <span>{product.title}</span>{" "}
              {product.titleHighlight && (
                <span className="font-display italic font-medium text-[#8c9276] dark:text-[#ccff00]">
                  {product.titleHighlight}
                </span>
              )}
            </h1>

            {/* Pricing Section */}
            <div className="flex items-baseline gap-3 pb-2 border-b border-gray-200/80 dark:border-white/10">
              <span className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
                ${product.price.toFixed(2)}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-xl text-gray-400 dark:text-gray-500 line-through">
                  ${product.oldPrice.toFixed(2)}
                </span>
              )}
              {product.discount && (
                <span className="px-2.5 py-1 text-xs font-black tracking-wide rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {product.discount}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {product.description ||
                "Una obra magistral de ingeniería de diseño contemporáneo, concebida para brindar una experiencia sensorial envolvente y enriquecer cualquier entorno con elegancia atemporal."}
            </p>

            {/* Variants: Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Acabado / Color: <span className="font-normal text-gray-500">{product.colors[activeColor]?.name}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveColor(idx)}
                      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        activeColor === idx
                          ? "border-gray-950 dark:border-white bg-gray-950/5 dark:bg-white/10 text-gray-950 dark:text-white shadow-sm"
                          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variants: Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Formato / Dimensiones:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSize(s)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        activeSize === s
                          ? "border-gray-950 dark:border-white bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-sm"
                          : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart Actions */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity Counter */}
                <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-2xl bg-white/80 dark:bg-[#202022] p-1 shadow-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Main CTA */}
                <button
                  onClick={() => {
                    if (isAgotado) return;
                    for (let i = 0; i < quantity; i++) {
                      handleAddToCart();
                    }
                  }}
                  disabled={isAgotado || isAdding}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-sm sm:text-base tracking-wide transition-all shadow-xl ${
                    isAgotado
                      ? "bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed"
                      : isAdding
                      ? "bg-emerald-600 text-white shadow-emerald-500/20 scale-[0.99]"
                      : "bg-gray-950 dark:bg-white text-white dark:text-gray-950 hover:opacity-90 shadow-gray-950/20 dark:shadow-white/10 active:scale-[0.98]"
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>¡Añadido a la bolsa!</span>
                    </>
                  ) : isAgotado ? (
                    <span>Agotado Temporalmente</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>Añadir a la bolsa • ${(product.price * quantity).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-white/5 text-center">
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                  <Truck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Envío 24/48h</span>
                  <span className="text-[10px] text-gray-400">Gratis sobre $50</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Garantía Oficial</span>
                  <span className="text-[10px] text-gray-400">2 Años Lumina</span>
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
      {/* BLOCK 2: FREQUENTLY BOUGHT TOGETHER (Bundle Pack Offer)                   */}
      {/* ========================================================================= */}
      {companionCandidates.length > 0 && (
        <section className="relative p-6 sm:p-10 rounded-[2.5rem] bg-white/70 dark:bg-[#1a1a1c]/70 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-[#ccff00]">
                  Pack Complementario Recomendado
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 dark:text-white tracking-tight mt-1">
                  Comprados juntos frecuentemente
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Combina estas piezas diseñadas en sintonía y ahorra un {bundleDiscountPct}% en el conjunto.
                </p>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ahorras ${bundleSavings.toFixed(2)} al comprar el paquete
                </span>
              </div>
            </div>

            {/* Interactive Products Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Product Visual Connectors */}
              <div className="md:col-span-8 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
                
                {/* Main Product Thumbnail */}
                <div className="flex-1 min-w-[140px] p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-white/5">
                    <Image src={currentImage} alt={product.title} fill className="object-cover" />
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{product.title}</p>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">${product.price.toFixed(2)}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-[#8c9276] dark:text-[#ccff00]">Este artículo</span>
                </div>

                {/* Connector + */}
                {companionCandidates.map((comp) => (
                  <React.Fragment key={comp.id}>
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold">
                      <Plus className="w-4 h-4" />
                    </div>

                    <div 
                      onClick={() => toggleBundleProduct(comp.id)}
                      className={`flex-1 min-w-[140px] p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        selectedBundleIds.includes(comp.id)
                          ? "bg-gray-50 dark:bg-white/5 border-gray-950 dark:border-white ring-1 ring-gray-950 dark:ring-white"
                          : "bg-gray-50/40 dark:bg-white/[0.02] border-gray-200/40 dark:border-white/5 opacity-60"
                      }`}
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-white/5">
                        <Image src={comp.imageUrl} alt={comp.title} fill className="object-cover" />
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            checked={selectedBundleIds.includes(comp.id)}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-gray-900 focus:ring-0 cursor-pointer"
                          />
                        </div>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{comp.title}</p>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">${comp.price.toFixed(2)}</p>
                      <span className="inline-block mt-1 text-[10px] text-gray-400">Pieza complementaria</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Total Calculation & CTA */}
              <div className="md:col-span-4 p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex flex-col justify-center space-y-4">
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
                    Incluye {1 + bundleCompanionProducts.length} artículos seleccionados
                  </p>
                </div>

                <button
                  onClick={handleAddBundleToCart}
                  disabled={isAddingBundle || bundleSuccess}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
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
                      <span>Añadir paquete completo</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* BLOCK 3: TECHNICAL ANATOMY / KEY COMPONENTS SPOTLIGHT                     */}
      {/* ========================================================================= */}
      <section className="relative">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-[#ccff00]">
            Ingeniería de Precisión
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            Anatomía del Producto
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Cada curva, material y componente ha sido meticulosamente calibrado para una durabilidad y rendimiento óptimos.
          </p>
        </div>

        {/* 3-Column Visual Layout (Left Specs - Center Visual - Right Specs) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          
          {/* Left Column Specs */}
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
            {leftSpecs.map((spec, idx) => {
              const specNumber = `0${idx + 1}`;
              const isHovered = hoveredSpecIndex === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredSpecIndex(idx)}
                  onMouseLeave={() => setHoveredSpecIndex(null)}
                  className={`p-6 rounded-2xl transition-all duration-300 border ${
                    isHovered
                      ? "bg-white dark:bg-[#202022] border-gray-950 dark:border-white shadow-xl translate-x-2"
                      : "bg-white/60 dark:bg-[#1a1a1c]/60 border-gray-200/70 dark:border-white/10 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-black flex items-center justify-center shrink-0">
                      {specNumber}
                    </span>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">
                      {spec.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-10">
                    {spec.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Center Product Visual with Pulsing Pins */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center order-1 lg:order-2">
            <div className="relative w-full max-w-[340px] aspect-square sm:aspect-[4/5] rounded-[3rem] overflow-hidden bg-gradient-to-b from-[#8c9276]/10 to-transparent dark:from-[#ccff00]/10 border border-black/5 dark:border-white/10 shadow-2xl p-4 flex items-center justify-center group">
              
              {/* Circular Halo Ring */}
              <div className="absolute inset-8 rounded-full border border-dashed border-[#8c9276]/30 dark:border-[#ccff00]/30 animate-spin-slow pointer-events-none" />

              <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden">
                <Image
                  src={images[1] || currentImage}
                  alt="Anatomía del Producto"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Pulsing Interactive Pointer Pins */}
              <div className="absolute top-[28%] left-[22%] z-20">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8c9276] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-gray-950 text-white dark:bg-white dark:text-gray-950 text-[10px] font-black items-center justify-center shadow-lg cursor-pointer">
                    1
                  </span>
                </span>
              </div>

              <div className="absolute bottom-[32%] right-[22%] z-20">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8c9276] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-gray-950 text-white dark:bg-white dark:text-gray-950 text-[10px] font-black items-center justify-center shadow-lg cursor-pointer">
                    2
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column Specs */}
          <div className="lg:col-span-4 space-y-6 order-3">
            {rightSpecs.map((spec, idx) => {
              const globalIndex = leftSpecs.length + idx;
              const specNumber = `0${globalIndex + 1}`;
              const isHovered = hoveredSpecIndex === globalIndex;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredSpecIndex(globalIndex)}
                  onMouseLeave={() => setHoveredSpecIndex(null)}
                  className={`p-6 rounded-2xl transition-all duration-300 border ${
                    isHovered
                      ? "bg-white dark:bg-[#202022] border-gray-950 dark:border-white shadow-xl -translate-x-2"
                      : "bg-white/60 dark:bg-[#1a1a1c]/60 border-gray-200/70 dark:border-white/10 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-black flex items-center justify-center shrink-0">
                      {specNumber}
                    </span>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">
                      {spec.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-10">
                    {spec.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOCK 4: SOCIAL PROOF / WHAT OUR CUSTOMERS SAY                            */}
      {/* ========================================================================= */}
      <section className="relative">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-[#ccff00]">
            Experiencias Reales
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            Lo que dicen nuestros clientes
          </h2>
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">4.9 / 5</span>
            <span className="text-sm text-gray-400">• Satisfacción garantizada</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-white/70 dark:bg-[#1a1a1c]/70 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-lg flex flex-col justify-between space-y-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-full bg-[#8c9276]/20 dark:bg-[#ccff00]/20 text-[#8c9276] dark:text-[#ccff00] font-black text-sm flex items-center justify-center">
                  {rev.author.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-gray-950 dark:text-white">{rev.author}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                  </div>
                  <p className="text-[11px] text-gray-400">{rev.role || "Comprador Verificado"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOCK 5: WHY CHOOSE US / BRAND VALUE PROPOSITIONS                         */}
      {/* ========================================================================= */}
      <section className="relative p-8 sm:p-14 rounded-[3rem] bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1a1c] dark:to-[#202022] border border-gray-200/80 dark:border-white/10 shadow-2xl">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276] dark:text-[#ccff00]">
              Compromiso Lumina
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              ¿Por qué elegir Lumina?
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Diseño sin obsolescencia, servicio sin fricción y una devoción obsesiva por los acabados nobles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((ben, idx) => {
              const IconComp = ben.icon || Sparkles;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/5 space-y-3.5 transition-all duration-300 hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 flex items-center justify-center shadow-md">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white leading-snug">
                    {ben.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {ben.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
}
