"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Check, Star, ChevronDown, Layers, Ruler, Sparkles, Box, CheckCircle2, X } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { useCartStore } from "@/lib/store";
import { useCatalogStore, isAgotadoBadge, ProductCombo } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { useAmbientStore } from "@/lib/ambientStore";
import { ProductLandingView } from "@/components/product/ProductLandingView";
import { ProductBundleSection } from "@/components/product/ProductBundleSection";
import { Isometric3DGallery } from "@/components/product/Isometric3DGallery";
import { EmbeddedCylinderCarousel } from "@/components/product/EmbeddedCylinderCarousel";
import { normalizeImageUrl } from "@/lib/imageUtils";
import { motion } from "framer-motion";

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { products } = useCatalogStore();
  const product = products.find(p => p.id === id);
  const { setCategoryTheme, resetTheme } = useAmbientStore();
  
  if (!product) {
    notFound();
  }

  const isAgotado = isAgotadoBadge(product.badge) || (product.stock !== undefined && product.stock <= 0);
  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);

  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [activeSize, setActiveSize] = useState(product.sizes?.[0] || "");
  const [activeTab, setActiveTab] = useState<'detalles' | 'materiales' | 'dimensiones' | 'envios' | 'cuidados'>('detalles');
  const [selectedCombo, setSelectedCombo] = useState<ProductCombo | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const { addItem, addBundle } = useCartStore();
  const { toggleFavorite, isFavorite, isAuthenticated } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
    if (product?.category) {
      setCategoryTheme(product.category);
    }
    return () => resetTheme();
  }, [product?.category, setCategoryTheme, resetTheme]);

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

  const handleAddToCart = () => {
    if (isAgotado) return;
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

    setTimeout(() => setIsAdding(false), 1500);
  };

  const defaultFallback = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
  const rawImages = (product.images && product.images.length > 0) ? product.images : [product.imageUrl || defaultFallback];
  const images = rawImages.map(img => normalizeImageUrl(img)).filter(Boolean);
  const currentImage = images[activeImage] || images[0] || defaultFallback;
  const isFav = isMounted ? isFavorite(product.id) : false;

  return (
    <div className="relative min-h-screen pt-28 pb-24 bg-transparent">
      {/* Soft Mate Ambient Aura - Lightweight GPU composition without heavy Gaussian blur */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none transform-gpu [contain:strict]">
        <div 
          className="absolute inset-0 opacity-25 transform-gpu"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 30%, rgba(140, 146, 118, 0.25) 0%, rgba(210, 180, 140, 0.12) 45%, transparent 75%)`,
          }}
        />
        {/* Soft matte film */}
        <div className="absolute inset-0 bg-[#fafafa]/80 transform-gpu" />
      </div>

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
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Gallery Section */}
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
              {/* Thumbnails (Vertical on desktop) */}
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar w-full md:w-20 shrink-0">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 h-20 md:w-full md:aspect-square rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2 ${activeImage === idx ? 'border-gray-950 dark:border-white shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill sizes="80px" quality={90} draggable={false} className="object-cover pointer-events-none select-none" />
                  </button>
                ))}
                <button className="relative w-20 h-10 md:w-full rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Main Image - Perfectly Squared 1:1 */}
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-100/50 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-md flex items-center justify-center">
                <Image 
                  src={currentImage}
                  alt={product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  quality={95}
                  draggable={false}
                  className="object-cover transform-gpu pointer-events-none select-none"
                />
                {(product.badge || isAgotado) && (
                  <span className={`absolute top-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-colors ${
                    isAgotado 
                      ? "bg-red-50/60 border border-red-300/80 text-red-600" 
                      : "bg-white/40 dark:bg-black/50 border border-white/60 dark:border-white/20 text-gray-900 dark:text-gray-100"
                  }`}>
                    {isAgotado ? "AGOTADO" : product.badge}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Product Info Section */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Category & Rating */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8c9276]">
                {product.category}
              </span>
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">4.8 (128 reviews)</span>
              </div>
            </div>

            {/* Mixing Fonts as requested */}
            <h1 className="text-4xl md:text-5xl text-gray-900 leading-[1.15] tracking-tight mb-4">
              <span className="font-sans font-bold">{product.title}</span>{" "}
              {product.titleHighlight && (
                <span className="font-display italic font-bold text-[#8c9276]">
                  {product.titleHighlight}
                </span>
              )}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${effectivePrice.toFixed(2)}
              </span>
              {selectedCombo ? (
                selectedCombo.discountPercentage ? (
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm">
                    Combo -{selectedCombo.discountPercentage}%
                  </span>
                ) : null
              ) : (
                <>
                  {product.oldPrice && (
                    <span className="text-lg text-gray-400 line-through font-medium">
                      ${product.oldPrice.toFixed(2)}
                    </span>
                  )}
                  {product.discount && (
                    <span className="px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded">
                      {product.discount}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Disponibilidad en Stock y Garantía */}
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                {product.stock !== undefined && product.stock <= 5 && product.stock > 0 ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300/80 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    ¡Solo quedan {product.stock} unidades en inventario!
                  </span>
                ) : isAgotado ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Agotado temporalmente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    En stock ({product.stock ?? 18} unidades disponibles) · Envío 24/48h
                  </span>
                )}
                {product.warranty && (
                  <span className="text-xs text-gray-500 flex items-center gap-1 font-medium bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8c9276]" /> {product.warranty}
                  </span>
                )}
              </div>
              {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
                <div className="w-full max-w-xs bg-amber-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, (product.stock / 10) * 100))}%` }}
                  />
                </div>
              )}
            </div>

            <p className="text-base text-gray-600 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Color: <span className="font-normal text-gray-600">{product.colors[activeColor]?.name || ''}</span>
                </p>
                <div className="flex flex-wrap gap-2.5 p-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl w-fit shadow-sm">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveColor(idx)}
                      className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 ${
                        activeColor === idx
                          ? 'bg-white shadow-sm ring-2 ring-gray-900 ring-offset-1 text-gray-900 font-semibold'
                          : 'hover:bg-white/60 text-gray-700 font-medium'
                      }`}
                      aria-label={color.name}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shadow-inner shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Variante: <span className="font-normal text-gray-600">{activeSize}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 p-2 bg-white/30 backdrop-blur-md border border-white/60 rounded-2xl w-fit shadow-sm">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setActiveSize(size)}
                      className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeSize === size ? 'bg-white/80 backdrop-blur-lg border border-white/90 shadow-md text-gray-900' : 'border border-transparent text-gray-700 hover:bg-white/40'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Combo Selection in Standard View */}
            {product.combos && product.combos.length > 0 && (
              <div className="mb-8 p-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8c9276]" />
                    Opciones de Paquete & Combos:
                  </p>
                  <span className="text-[10px] font-bold text-emerald-600">Ahorro Preferencial</span>
                </div>

                <div className="space-y-2">
                  {/* Standalone Option */}
                  <div
                    onClick={() => setSelectedCombo(null)}
                    className={`p-3 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all border ${
                      selectedCombo === null
                        ? "bg-white/90 border-gray-900 shadow-sm ring-1 ring-gray-950/20 font-bold"
                        : "border-gray-200/80 hover:bg-white/60 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedCombo === null ? 'bg-gray-900 text-white' : 'border-gray-300'
                      }`}>
                        {selectedCombo === null && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span>Solo esta pieza individual</span>
                    </div>
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                  </div>

                  {/* Configured Combos */}
                  {product.combos.map((combo) => {
                    const isSelected = selectedCombo?.id === combo.id;
                    const companionObjs = products.filter(p => combo.companionProductIds?.includes(p.id));
                    const calculatedTotal = companionObjs.reduce((acc, p) => acc + p.price, product.price);
                    const comboFinalPrice = combo.customPrice || (combo.discountPercentage 
                      ? Number((calculatedTotal * (1 - combo.discountPercentage / 100)).toFixed(2)) 
                      : calculatedTotal);

                    return (
                      <div
                        key={combo.id}
                        onClick={() => setSelectedCombo(combo)}
                        className={`p-3 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all border ${
                          isSelected
                            ? "bg-white/90 border-gray-900 shadow-sm ring-1 ring-gray-950/20 font-bold"
                            : "border-gray-200/80 hover:bg-white/60 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-gray-900 text-white' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">{combo.name}</span>
                            {combo.badge && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                                {combo.badge}
                              </span>
                            )}
                            {combo.description && (
                              <p className="text-[11px] text-gray-500 font-normal mt-0.5">{combo.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="font-bold text-gray-900">${comboFinalPrice.toFixed(2)}</span>
                          {combo.discountPercentage && (
                            <span className="ml-1 text-[10px] text-emerald-600 font-bold">
                              (-{combo.discountPercentage}%)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <button 
                disabled={isAgotado}
                onClick={handleAddToCart}
                className={`flex-1 h-14 backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-2xl font-medium flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden ${
                  isAgotado 
                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-75" 
                    : "bg-white/40 border-white/60 hover:bg-white/60 text-gray-900"
                }`}
              >
                {isAgotado ? (
                  <span className="font-bold text-sm uppercase tracking-wider text-red-600 flex items-center gap-2">
                    <X className="w-4 h-4" /> Producto Agotado
                  </span>
                ) : (
                  <>
                    <span className={`transition-transform duration-300 flex items-center gap-2 ${isAdding ? '-translate-y-12' : 'translate-y-0'}`}>
                      <ShoppingBag className="w-5 h-5" /> Añadir a la Bolsa
                    </span>
                    <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-300 ${isAdding ? 'translate-y-0' : 'translate-y-12'}`}>
                      <Check className="w-6 h-6" /> Añadido a la Bolsa
                    </span>
                  </>
                )}
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(product.id);
                }}
                className={`h-14 w-14 rounded-2xl backdrop-blur-xl border shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center justify-center transition-all shrink-0 ${isFav ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/40 border-white/60 text-gray-700 hover:bg-white/60 hover:text-red-500'}`}
              >
                <Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/40 pt-6">
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Truck className="w-5 h-5 text-gray-700" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-900 uppercase">Envío Gratis</p>
                  <p className="text-[10px] text-gray-600">En pedidos +$99</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <RotateCcw className="w-5 h-5 text-gray-700" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-900 uppercase">Devolución fácil</p>
                  <p className="text-[10px] text-gray-600">30 días política</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <ShieldCheck className="w-5 h-5 text-gray-700" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-900 uppercase">Pago seguro</p>
                  <p className="text-[10px] text-gray-600">100% encriptado</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BLOQUE 2: OFERTA COMPLEMENTARIA O AHORRO POR VOLUMEN (STANDARD VIEW) */}
        <ProductBundleSection
          product={product}
          allProducts={products}
          activeColorName={product.colors?.[activeColor]?.name}
          activeSize={product.sizes && product.sizes.length > 0 ? activeSize : undefined}
          isAgotado={isAgotado}
        />

        {/* Tabs Section */}
        <motion.div 
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.05, margin: "0px 0px -20px 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: "transform, opacity" }}
          className="mt-24 pt-12 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start transform-gpu"
        >
          <div className="lg:col-span-7">
            {/* Tab Navigation */}
            <div className="flex gap-4 md:gap-8 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => setActiveTab('detalles')}
                className={`pb-4 text-sm font-semibold transition-all shrink-0 relative ${activeTab === 'detalles' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Detalles
              </button>
              <button 
                onClick={() => setActiveTab('materiales')}
                className={`pb-4 text-sm font-semibold transition-all shrink-0 relative ${activeTab === 'materiales' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Materiales y Acabados
              </button>
              <button 
                onClick={() => setActiveTab('dimensiones')}
                className={`pb-4 text-sm font-semibold transition-all shrink-0 relative ${activeTab === 'dimensiones' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Dimensiones
              </button>
              <button 
                onClick={() => setActiveTab('envios')}
                className={`pb-4 text-sm font-semibold transition-all shrink-0 relative ${activeTab === 'envios' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Envíos y Garantía
              </button>
              <button 
                onClick={() => setActiveTab('cuidados')}
                className={`pb-4 text-sm font-semibold transition-all shrink-0 relative ${activeTab === 'cuidados' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Cuidados
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'detalles' && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-gray-600 leading-relaxed text-sm">
                  {product.description}
                </p>
                {product.features && product.features.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Aspectos Destacados</h4>
                    <ul className="space-y-2.5">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-[#8c9276] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.howToUse && (
                  <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/70">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>¿Cómo se usa / Aplicaciones recomendadas?</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">
                      {product.howToUse}
                    </p>
                  </div>
                )}
                {product.packageContents && (
                  <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                      <Box className="w-4 h-4 text-gray-700" />
                      <span>¿Qué incluye la caja?</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {product.packageContents}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'materiales' && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-5 bg-stone-50/80 rounded-2xl border border-stone-200/60">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-stone-700" />
                    <span>Composición y Acabados Nobles</span>
                  </div>
                  <p className="text-sm text-stone-800 leading-relaxed font-normal">
                    {product.materials || "Diseñado con materias primas seleccionadas de alta calidad, acabados no tóxicos y procesos sostenibles certificados que garantizan máxima durabilidad y calidez visual."}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200/70 bg-white/70">
                    <p className="text-xs font-bold text-gray-900 mb-1">🌿 Sostenibilidad Certificada</p>
                    <p className="text-xs text-gray-500">Materias primas de procedencia ética y trazable, reduciendo el impacto ecológico.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200/70 bg-white/70">
                    <p className="text-xs font-bold text-gray-900 mb-1">✨ Acabado Artesanal</p>
                    <p className="text-xs text-gray-500">Tratamiento protector sellante contra desgaste diario, rayaduras leves y humedad.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dimensiones' && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-5 bg-gray-50/80 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                    <Ruler className="w-4 h-4 text-gray-700" />
                    <span>Medidas y Peso de la Pieza</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    {product.dimensions || "Dimensiones estándar ergonómicas optimizadas para integración armónica en espacios de hogar y oficina contemporáneos."}
                  </p>
                </div>
                {product.sizes && product.sizes.length > 0 && (
                  <div className="p-4 rounded-xl border border-gray-200/70 bg-white/70">
                    <p className="text-xs font-bold text-gray-900 mb-2">Variantes de tamaño disponibles:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'envios' && (
              <div className="space-y-5 animate-fade-in">
                <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-950 uppercase tracking-wider">
                    <Truck className="w-4 h-4 text-blue-700" />
                    <span>Condiciones de Envío y Despacho</span>
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {product.shipping || "Envío estándar en 24-48 horas laborables. Envío gratuito garantizado en pedidos superiores a $50. Embalaje reforzado anti-impactos para máxima protección de la pieza."}
                  </p>
                </div>

                <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Garantía Oficial</span>
                  </div>
                  <p className="text-sm text-emerald-900 leading-relaxed">
                    {product.warranty || "2 años de garantía oficial ante cualquier defecto de fabricación o fallo prematuro de materiales."}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 text-xs text-gray-600 flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-gray-500 shrink-0" />
                  <span>Devoluciones sencillas y sin complicaciones dentro de los primeros 30 días posteriores a la recepción del pedido.</span>
                </div>
              </div>
            )}

            {activeTab === 'cuidados' && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>Guía de Conservación y Mantenimiento</span>
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {product.careInstructions || "Limpiar periódicamente con un paño de microfibra seco o ligeramente humedecido con agua neutra. No utilizar productos químicos agresivos, disolventes ni estropajos. Mantener alejado de fuentes directas de calor extremo."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-100/50 dark:bg-white/5 shadow-sm border border-gray-200/60 dark:border-white/10 flex items-center justify-center">
             <Image src={images[1] || images[0]} fill sizes="(max-width: 1024px) 100vw, 40vw" quality={95} alt={product.title} className="object-cover" />
          </div>
        </motion.div>

        {/* Carrusel Embebido Cilíndrico 3D (Efecto Video Enveding.mp4) - Renderizado exclusivamente para vista estándar */}
        {product.embeddedCarousel?.enabled !== false && (
          <EmbeddedCylinderCarousel
            config={product.embeddedCarousel}
            productTitle={product.title}
            category={product.category}
            productImages={images}
            className="my-16 sm:my-20"
          />
        )}
        </>
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
            <h3 className="text-2xl font-bold text-gray-900">Te podría gustar</h3>
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
