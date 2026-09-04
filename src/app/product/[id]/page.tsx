"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Check, Star, ChevronDown, Layers, Ruler, Sparkles, Box, CheckCircle2 } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { useCartStore } from "@/lib/store";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { useAmbientStore } from "@/lib/ambientStore";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const { products } = useCatalogStore();
  const product = products.find(p => p.id === params.id);
  const { setCategoryTheme, resetTheme } = useAmbientStore();
  
  if (!product) {
    notFound();
  }

  const relatedProducts = products.filter(p => p.id !== product.id).slice(0, 4);

  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [activeSize, setActiveSize] = useState(product.sizes?.[0] || "M");
  const [activeTab, setActiveTab] = useState<'detalles' | 'materiales' | 'dimensiones' | 'envios' | 'cuidados'>('detalles');
  const [isAdding, setIsAdding] = useState(false);
  
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite, isAuthenticated } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
    if (product?.category) {
      setCategoryTheme(product.category);
    }
    return () => resetTheme();
  }, [product?.category, setCategoryTheme, resetTheme]);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product, 1, product.colors?.[activeColor]?.name, activeSize);
    setTimeout(() => setIsAdding(false), 1500);
  };

  const defaultFallback = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
  const rawImages = (product.images && product.images.length > 0) ? product.images : [product.imageUrl || defaultFallback];
  const images = rawImages.filter(Boolean);
  const currentImage = images[activeImage] || images[0] || defaultFallback;
  const isFav = isMounted ? isFavorite(product.id) : false;

  return (
    <div className="relative min-h-screen pt-28 pb-24 bg-transparent">
      {/* Soft Mate Ambient Aura */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <Image
          src={currentImage}
          alt="Ambient Aura"
          fill
          className="object-cover blur-[180px] saturate-[1.1] opacity-25 transition-all duration-1000 z-10"
        />
        {/* Soft matte film */}
        <div className="absolute inset-0 bg-[#fafafa]/60 backdrop-blur-[50px] z-20" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Gallery Section */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-full">
            {/* Thumbnails (Vertical on desktop) */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar w-full md:w-20 shrink-0">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-24 md:w-full md:h-28 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 border-2 ${activeImage === idx ? 'border-gray-900 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                </button>
              ))}
              <button className="relative w-20 h-10 md:w-full rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors">
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative w-full aspect-[4/5] md:aspect-[3/4] md:h-auto rounded-2xl overflow-hidden bg-gray-100/50">
              <Image 
                src={currentImage}
                alt={product.title}
                fill
                priority
                className="object-cover transition-opacity duration-500"
              />
            </div>
          </div>

          {/* Product Details Section (Velora Style) */}
          <div className="lg:col-span-5 flex flex-col justify-start pt-2">
            
            <div className="mb-4">
              {product.badge && (
                <span className="px-3 py-1 rounded bg-gray-100 text-xs font-semibold text-gray-800">
                  {product.badge}
                </span>
              )}
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

            {/* Reviews */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-gray-900">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current opacity-50" />
              </div>
              <span className="text-sm text-gray-500 font-medium">4.8 (128 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
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
            </div>

            {/* Disponibilidad en Stock y Garantía */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {product.stock !== undefined && product.stock <= 5 && product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  ¡Solo quedan {product.stock} unidades en almacén!
                </span>
              ) : product.stock === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Agotado temporalmente
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  En stock ({product.stock ?? 18} disponibles) · Envío 24/48h
                </span>
              )}
              {product.warranty && (
                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8c9276]" /> {product.warranty}
                </span>
              )}
            </div>

            <p className="text-base text-gray-600 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Color: <span className="font-normal text-gray-600">{product.colors[activeColor].name}</span>
                </p>
                <div className="flex gap-3 p-2 bg-white/30 backdrop-blur-md border border-white/60 rounded-full w-fit shadow-sm">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveColor(idx)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${activeColor === idx ? 'ring-2 ring-gray-900 ring-offset-2 ring-offset-transparent' : 'hover:scale-110 border border-white/50'}`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                    />
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

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <button 
                onClick={handleAddToCart}
                className="flex-1 h-14 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/60 text-gray-900 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden"
              >
                <span className={`transition-transform duration-300 flex items-center gap-2 ${isAdding ? '-translate-y-12' : 'translate-y-0'}`}>
                  <ShoppingBag className="w-5 h-5" /> Añadir al carrito
                </span>
                <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-300 ${isAdding ? 'translate-y-0' : 'translate-y-12'}`}>
                  <Check className="w-6 h-6" /> Añadido
                </span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (!isAuthenticated) return;
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

        {/* Tabs Section */}
        <div className="mt-24 pt-12 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
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
                Dimensiones y Peso
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
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
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
                    <span>Garantía Oficial Lumina</span>
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

          <div className="lg:col-span-5 relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200/60">
             <Image src={images[1] || images[0]} fill alt={product.title} className="object-cover" />
          </div>
        </div>

        {/* You May Also Like */}
        <div className="mt-24 pt-12 border-t border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Te podría gustar</h3>
            <Link href="#" className="text-sm font-semibold text-gray-900 flex items-center gap-1 hover:underline underline-offset-4">
              Ver todo &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} {...prod} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
