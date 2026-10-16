"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Check, Star, ChevronDown, Layers, Ruler, Sparkles, Box, CheckCircle2, X, Maximize2, Award, Zap } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { BeUIActionSwapLabel } from "@/components/ui/BeUIControls";
import { useCartStore } from "@/lib/store";
import { useCatalogStore, isAgotadoBadge, ProductCombo, CatalogProduct } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { useAmbientStore } from "@/lib/ambientStore";
import { ProductLandingView } from "@/components/product/ProductLandingView";
import { ProductCinematicView } from "@/components/product/ProductCinematicView";
import { ProductBentoView } from "@/components/product/ProductBentoView";
import { ProductBundleSection } from "@/components/product/ProductBundleSection";
import { Isometric3DGallery } from "@/components/product/Isometric3DGallery";
import { EmbeddedCylinderCarousel } from "@/components/product/EmbeddedCylinderCarousel";
import { ProductStorytellingShowcase } from "@/components/product/ProductStorytellingShowcase";
import { normalizeImageUrl } from "@/lib/imageUtils";
import { motion } from "framer-motion";
import { flyToCart } from "@/components/ui/FlyToCartAnimation";

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { products, isLoading, fetchProducts } = useCatalogStore();

  const decodedId = React.useMemo(() => {
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }, [id]);

  const product = React.useMemo(() => {
    return products.find(p => p.id === id || p.id === decodedId);
  }, [products, id, decodedId]);

  // Ensure catalog products are fetched on hard page reload or direct URL visits
  React.useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [products.length, fetchProducts]);

  // While store is hydrating or fetching products, show luxury spinner (prevent premature 404)
  if (isLoading || (products.length === 0 && !product)) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#8c9276] border-t-transparent animate-spin" />
          <p className="text-xs uppercase tracking-wider text-gray-500 font-sans">Cargando artículo...</p>
        </div>
      </div>
    );
  }

  // Only trigger 404 when products have loaded and ID is genuinely not found
  if (!product) {
    notFound();
  }

  return <ProductDetailContent product={product} products={products} />;
}

function ProductDetailContent({ product, products }: { product: CatalogProduct; products: CatalogProduct[] }) {
  const isAgotado = isAgotadoBadge(product.badge) || (product.stock !== undefined && product.stock <= 0);
  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);

  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [activeSize, setActiveSize] = useState(product.sizes?.[0] || "");
  const [activeTab, setActiveTab] = useState<'detalles' | 'materiales' | 'dimensiones' | 'envios'>('detalles');
  const [showZoom, setShowZoom] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<ProductCombo | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const { addItem, addBundle } = useCartStore();
  const { toggleFavorite, isFavorite, isAuthenticated } = useUserStore();
  const { setProductAmbient, resetProductAmbient } = useAmbientStore();
  const [isMounted, setIsMounted] = useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
    const activeHex = product?.colors?.[activeColor]?.hex;
    if (product) {
      setProductAmbient({
        category: product.category,
        colorHex: activeHex,
      });
    }
    return () => resetProductAmbient();
  }, [product?.id, product?.category, activeColor, product?.colors, setProductAmbient, resetProductAmbient]);

  const effectivePrice = React.useMemo(() => {
    if (!selectedCombo) return product.price;
    if (selectedCombo.customPrice) return selectedCombo.customPrice;
    const companionObjs = products.filter(p => selectedCombo.companionProductIds?.includes(p.id));
    const rawTotal = companionObjs.reduce((acc, p) => acc + p.price, product.price);
    if (selectedCombo.discountPercentage) {
      return Number((rawTotal * (1 - selectedCombo.discountPercentage / 100)).toFixed(2));
    }
    return rawTotal;
  }, [selectedCombo, product.price, products]);

  const isInBag = useCartStore((state) =>
    state.items.some((item) => !item.isBundle && (item.productId === product.id || item.product?.id === product.id))
  );
  const showAddedState = (isMounted && !selectedCombo && isInBag) || isAdding;

  const handleAddToCart = () => {
    if (isAgotado) return;
    if (!selectedCombo && isInBag) return;
    setIsAdding(true);

    const hasProductSizes = Boolean(product.sizes && product.sizes.length > 0);

    if (selectedCombo) {
      const companions = products.filter(p => selectedCombo.companionProductIds?.includes(p.id));
      const bundleProductsList = [
        {
          product,
          color: product.colors?.[activeColor]?.name,
          size: hasProductSizes ? activeSize : undefined,
        },
        ...companions.map(c => ({
          product: c,
          color: c.colors?.[0]?.name,
          size: c.sizes && c.sizes.length > 0 ? c.sizes[0] : undefined,
        })),
      ];

      addBundle({
        bundleName: selectedCombo.name,
        bundleBadge: selectedCombo.badge || (selectedCombo.discountPercentage ? `-${selectedCombo.discountPercentage}% DTO` : undefined),
        bundleDiscountPercent: selectedCombo.discountPercentage,
        bundleCustomPrice: effectivePrice,
        products: bundleProductsList,
      });
    } else {
      addItem(
        product, 
        1, 
        product.colors?.[activeColor]?.name, 
        hasProductSizes ? activeSize : undefined
      );
    }

    setTimeout(() => setIsAdding(false), 1000);
  };

  const defaultFallback = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
  const rawImages = (product.images && product.images.length > 0) ? product.images : [product.imageUrl || defaultFallback];
  const images = rawImages.map(img => normalizeImageUrl(img)).filter(Boolean);
  const currentImage = images[activeImage] || images[0] || defaultFallback;
  const isFav = isMounted ? isFavorite(product.id) : false;

  return (
    <div className="relative min-h-screen pt-28 pb-24 bg-transparent">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {product.layoutType === "landing" ? (
          <ProductLandingView
            product={product}
            allProducts={products}
            currentImage={currentImage}
            images={images}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            activeSize={activeSize}
            setActiveSize={setActiveSize}
            handleAddToCart={handleAddToCart}
            isAdding={isAdding}
            isAgotado={isAgotado}
          />
        ) : product.layoutType === "cinematic" ? (
          <ProductCinematicView
            product={product}
            allProducts={products}
            images={images}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            activeSize={activeSize}
            setActiveSize={setActiveSize}
            handleAddToCart={handleAddToCart}
            isAdding={isAdding}
            isAgotado={isAgotado}
            effectivePrice={effectivePrice}
          />
        ) : product.layoutType === "bento" ? (
          <ProductBentoView
            product={product}
            allProducts={products}
            images={images}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            activeSize={activeSize}
            setActiveSize={setActiveSize}
            handleAddToCart={handleAddToCart}
            isAdding={isAdding}
            isAgotado={isAgotado}
            effectivePrice={effectivePrice}
          />
        ) : (
          <>
            {/* ========================================================================= */}
            {/* DISEÑO A: 01 // ESTUDIO MINIMALISTA (ESTILO RETAIL CONTEMPORÁNEO / VELORA) */}
            {/* ========================================================================= */}

            {/* SECCIÓN 1: BUY BOX SUPERIOR EN 2 COLUMNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
              
              {/* Columna Izquierda: Galería con Tira Vertical de 4 miniaturas y Zoom */}
              {product.galleryStyle === "isometric_3d" ? (
                <div className="lg:col-span-7">
                  <Isometric3DGallery 
                    images={images}
                    title={product.title}
                    category={product.category}
                    autoplay={product.galleryAutoplay ?? true}
                    autoplaySpeed={product.galleryAutoplaySpeed ?? 4}
                  />
                </div>
              ) : (
                <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-full">
                  {/* Tira vertical con 4 miniaturas cuadradas redondeadas y botón circular con flecha abajo */}
                  <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar w-full md:w-20 shrink-0">
                    {images.slice(0, 4).map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`relative w-18 h-18 md:w-full md:aspect-square rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2 cursor-pointer ${
                          activeImage === idx 
                            ? 'border-zinc-950 dark:border-white shadow-md scale-105' 
                            : 'border-zinc-200/80 dark:border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image 
                          src={img} 
                          alt={`Miniatura ${idx + 1}`} 
                          fill 
                          sizes="80px" 
                          quality={90} 
                          draggable={false} 
                          className="object-cover pointer-events-none select-none" 
                        />
                      </button>
                    ))}
                    
                    {/* Botón circular con flecha abajo */}
                    <button 
                      type="button"
                      onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                      className="w-10 h-10 md:w-full md:aspect-square rounded-full md:rounded-2xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center shrink-0 hover:bg-zinc-200 dark:hover:bg-white/20 transition-all active:scale-95 cursor-pointer border border-zinc-200/80 dark:border-white/10 shadow-xs"
                      title="Siguiente imagen"
                    >
                      <ChevronDown className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                    </button>
                  </div>

                  {/* Fotografía principal en formato vertical grande con botón circular de lupa (zoom) */}
                  <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-zinc-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-lg flex items-center justify-center group">
                    <Image 
                      src={currentImage}
                      alt={product.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      priority
                      quality={95}
                      draggable={false}
                      className="object-cover transform-gpu pointer-events-none select-none transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Badge de estado en esquina superior izquierda */}
                    {(product.badge || isAgotado) && (
                      <span className={`absolute top-5 left-5 z-10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors ${
                        isAgotado 
                          ? "bg-red-50/80 border border-red-300 text-red-600" 
                          : "bg-white/80 dark:bg-black/60 border border-white/60 dark:border-white/20 text-zinc-900 dark:text-zinc-100"
                      }`}>
                        {isAgotado ? "AGOTADO" : product.badge}
                      </span>
                    )}

                    {/* Botón circular de lupa (zoom) en la esquina inferior derecha */}
                    <button
                      type="button"
                      onClick={() => setShowZoom(true)}
                      className="absolute bottom-5 right-5 z-10 w-11 h-11 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 shadow-md backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-zinc-200/80 dark:border-zinc-700 cursor-pointer"
                      title="Ampliar fotografía (Zoom)"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Columna Derecha: Información y Compra */}
              <div className="lg:col-span-5 flex flex-col justify-start pt-1 space-y-6">
                
                {/* 1) Píldora superior gris clara con badge de producto */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 shadow-xs">
                    {isAgotado ? "Agotado" : product.badge || "New Arrival"}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276]">
                    {product.category}
                  </span>
                </div>

                {/* 2) Título en tipografía grande y negrita + fila de 5 estrellas con promedio y cantidad de reseñas */}
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold text-gray-950 dark:text-white leading-[1.15] tracking-tight">
                    <span>{product.title}</span>{" "}
                    {product.titleHighlight && (
                      <span className="font-display italic font-medium text-[#8c9276]">
                        {product.titleHighlight}
                      </span>
                    )}
                  </h1>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">4.8</span>
                    <span className="text-xs text-gray-500 font-medium">(128 reseñas)</span>
                  </div>
                </div>

                {/* 3) Precio actual grande en negrita, precio original tachado en gris y píldora negra con porcentaje de descuento */}
                <div className="flex items-baseline gap-3 pb-2 border-b border-zinc-200/80 dark:border-white/10">
                  <span className="text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                    ${effectivePrice.toFixed(2)}
                  </span>
                  {product.oldPrice && product.oldPrice > effectivePrice && (
                    <span className="text-xl text-gray-400 dark:text-gray-500 line-through font-medium">
                      ${product.oldPrice.toFixed(2)}
                    </span>
                  )}
                  {product.discount ? (
                    <span className="px-2.5 py-1 bg-black text-white text-xs font-black rounded-lg uppercase tracking-wider shadow-sm">
                      {product.discount.includes("OFF") ? product.discount : `${product.discount} OFF`}
                    </span>
                  ) : product.oldPrice && product.oldPrice > effectivePrice ? (
                    <span className="px-2.5 py-1 bg-black text-white text-xs font-black rounded-lg uppercase tracking-wider shadow-sm">
                      {Math.round(((product.oldPrice - effectivePrice) / product.oldPrice) * 100)}% OFF
                    </span>
                  ) : null}
                </div>

                {/* 4) Párrafo corto de resumen (2-3 líneas) */}
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                  {product.description || "Pieza de diseño contemporáneo concebida para una experiencia táctil y visual excepcional, integrando materiales sostenibles de alta durabilidad en cualquier estancia moderna."}
                </p>

                {/* 5) Selector de 'Color / Acabado' */}
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                      Color / Acabado: <span className="font-semibold text-gray-500 dark:text-gray-400">{product.colors[activeColor]?.name || ''}</span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color, idx) => {
                        const isActive = activeColor === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveColor(idx)}
                            className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
                              isActive 
                                ? 'ring-2 ring-gray-950 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-110 shadow-sm' 
                                : 'hover:scale-105 border border-black/10'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6) Selector de 'Medidas / Tamaño' */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                        Medidas / Tamaño:
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('dimensiones')}
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline underline-offset-4 cursor-pointer font-medium"
                      >
                        Guía de medidas
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {product.sizes.map((size) => {
                        const isActive = activeSize === size;
                        return (
                          <button
                            key={size}
                            onClick={() => setActiveSize(size)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm'
                                : 'bg-white/80 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7) Fila de acción: Botón principal negro sólido + Botón corazón favoritos */}
                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={isAgotado}
                    onClick={(e) => {
                      flyToCart(e.currentTarget, currentImage);
                      handleAddToCart();
                    }}
                    className={`flex-1 h-14 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl cursor-pointer ${
                      isAgotado 
                        ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" 
                        : "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 active:scale-[0.98]"
                    }`}
                  >
                    {isAgotado ? (
                      <span className="uppercase tracking-wider text-red-500 flex items-center gap-2">
                        <X className="w-4 h-4" /> Producto Agotado
                      </span>
                    ) : (
                      <BeUIActionSwapLabel
                        active={showAddedState}
                        idleText="Añadir al Carrito"
                        activeText="Se agregó a la bolsa"
                        idleIcon={<ShoppingBag className="w-5 h-5" />}
                        activeIcon={<Check className="w-5 h-5 text-emerald-600" />}
                      />
                    )}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(product.id);
                    }}
                    className={`h-14 w-14 rounded-2xl border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      isFav 
                        ? 'bg-red-500/10 border-red-500 text-red-500 shadow-sm' 
                        : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-zinc-400'
                    }`}
                    title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                  >
                    <Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* 8) Fila inferior de 3 sellos de confianza: Envío Nacional, Devolución Fácil, Pago Seguro */}
                <div className="grid grid-cols-3 gap-2.5 border-t border-zinc-200/80 dark:border-white/10 pt-5">
                  <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5">
                    <Truck className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                    <div>
                      <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">Envío Nacional</p>
                      <p className="text-[10px] text-zinc-500">En pedidos +$99</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5">
                    <RotateCcw className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                    <div>
                      <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">Devolución Fácil</p>
                      <p className="text-[10px] text-zinc-500">Garantía de 30 días</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5">
                    <ShieldCheck className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                    <div>
                      <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">Pago Seguro</p>
                      <p className="text-[10px] text-zinc-500">100% encriptado</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SECCIÓN 2: BLOQUE EDITORIAL CON PESTAÑAS + FOTOGRAFÍA MACRO 50/50 */}
            <motion.div 
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.05, margin: "0px 0px -20px 0px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "transform, opacity" }}
              className="mt-20 sm:mt-24 pt-12 border-t border-zinc-200/80 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start transform-gpu"
            >
              {/* Columna Izquierda: Barra horizontal de 4 pestañas interactivas + 5 características destacadas */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Barra horizontal de 4 pestañas interactivas */}
                <div className="flex gap-4 md:gap-8 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto hide-scrollbar">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('detalles')}
                    className={`pb-3.5 text-xs sm:text-sm transition-all shrink-0 cursor-pointer ${
                      activeTab === 'detalles' 
                        ? 'text-zinc-950 dark:text-white font-bold border-b-2 border-zinc-950 dark:border-white' 
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-semibold'
                    }`}
                  >
                    Detalles
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('materiales')}
                    className={`pb-3.5 text-xs sm:text-sm transition-all shrink-0 cursor-pointer ${
                      activeTab === 'materiales' 
                        ? 'text-zinc-950 dark:text-white font-bold border-b-2 border-zinc-950 dark:border-white' 
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-semibold'
                    }`}
                  >
                    Materiales
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('dimensiones')}
                    className={`pb-3.5 text-xs sm:text-sm transition-all shrink-0 cursor-pointer ${
                      activeTab === 'dimensiones' 
                        ? 'text-zinc-950 dark:text-white font-bold border-b-2 border-zinc-950 dark:border-white' 
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-semibold'
                    }`}
                  >
                    Dimensiones
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('envios')}
                    className={`pb-3.5 text-xs sm:text-sm transition-all shrink-0 cursor-pointer ${
                      activeTab === 'envios' 
                        ? 'text-zinc-950 dark:text-white font-bold border-b-2 border-zinc-950 dark:border-white' 
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-semibold'
                    }`}
                  >
                    Envío y Garantía
                  </button>
                </div>

                {/* Contenido de la pestaña activa */}
                <div className="min-h-[140px]">
                  {activeTab === 'detalles' && (
                    <div className="space-y-4 animate-fade-in">
                      <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">
                        {product.description || "Pieza diseñada bajo los más exigentes estándares de estética contemporánea y ergonomía funcional."}
                      </p>
                      {product.packageContents && (
                        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-400">
                          <strong className="text-zinc-900 dark:text-zinc-100 font-bold block mb-1">Contenido del paquete:</strong>
                          {product.packageContents}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'materiales' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-zinc-50 dark:bg-white/[0.03] rounded-2xl border border-zinc-200/60 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          <Layers className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                          <span>Composición y Fabricación Noble</span>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                          {product.materials || "Cerámica de alta densidad cocida a 1250°C, aleaciones de aluminio anodizado y base protectora de corcho natural libre de resinas sintéticas."}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'dimensiones' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 bg-zinc-50 dark:bg-white/[0.03] rounded-2xl border border-zinc-200/60 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          <Ruler className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                          <span>Medidas y Peso de la Pieza</span>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                          {product.dimensions || "32 x 18 x 18 cm · Peso aproximado: 1.4 kg · Optimizado para distribución armónica sobre repisas, escritorios y mesas auxiliares."}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'envios' && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="p-4 bg-zinc-50 dark:bg-white/[0.03] rounded-2xl border border-zinc-200/60 dark:border-white/5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                          <span>Despacho y Tiempos de Entrega</span>
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {product.shipping || "Envío estándar en 24-48 horas laborables. Envío gratuito en compras superiores a $99. Embalaje reforzado anti-impactos."}
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-50 dark:bg-white/[0.03] rounded-2xl border border-zinc-200/60 dark:border-white/5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                          <span>Garantía Oficial de 2 Años</span>
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {product.warranty || "Garantía de sustitución completa por 2 años contra cualquier fallo prematuro de materiales o ensamble."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5 Características Destacadas con Íconos Vectoriales */}
                <div className="pt-4 border-t border-zinc-200/70 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-3.5">
                    Características Destacadas
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      product.features?.[0] || "Acabados nobles tratados contra rayaduras y oxidación",
                      product.features?.[1] || "Artesanía de precisión con ensamblaje manual individual",
                      product.features?.[2] || "Consumo energético ultra eficiente de bajo impacto térmico",
                      product.features?.[3] || "Conexión universal USB-C con protección contra sobretensión",
                      product.features?.[4] || "Base estabilizadora antideslizante protectora de superficies"
                    ].map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-white shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Columna Derecha: Fotografía Macro/Textura Enmarcada con Badge Flotante */}
              <div className="lg:col-span-5 relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 shadow-lg group">
                <Image 
                  src={images[1] || images[0]} 
                  fill 
                  sizes="(max-width: 1024px) 100vw, 45vw" 
                  quality={95} 
                  alt={`Macro ${product.title}`} 
                  className="object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none select-none" 
                />
                
                {/* Badge Flotante */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-black/80 backdrop-blur-md text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-white/10 shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Detalle Macro & Textura</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Modal de Zoom (Lightbox) */}
        {showZoom && (
          <div 
            onClick={() => setShowZoom(false)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          >
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowZoom(false)}
                className="absolute top-2 right-2 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Cerrar zoom"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="relative w-full h-full">
                <Image
                  src={currentImage}
                  alt={product.title}
                  fill
                  sizes="90vw"
                  quality={100}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* You May Also Like */}
        <motion.div 
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.05, margin: "0px 0px -20px 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: "transform, opacity" }}
          className="mt-24 pt-12 border-t border-gray-200 transform-gpu"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">También te podría interesar</h3>
            <Link href="/shop" className="text-sm font-semibold text-gray-900 flex items-center gap-1 hover:underline underline-offset-4">
              Ver todo &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((prod, idx) => (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.05, margin: "0px 0px -20px 0px" }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{ willChange: "transform, opacity" }}
                className="transform-gpu"
              >
                <ProductCard {...prod} />
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
