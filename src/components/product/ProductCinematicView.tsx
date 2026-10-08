"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Maximize2,
  Layers,
  Box,
  RotateCcw
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";
import { cn } from "@/lib/utils";
import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

interface ProductCinematicViewProps {
  product: CatalogProduct;
  allProducts: CatalogProduct[];
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
  effectivePrice?: number;
}

export function ProductCinematicView({
  product,
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
  effectivePrice
}: ProductCinematicViewProps) {
  const currentPhoto = images[activeImage] || images[0] || product.imageUrl;
  const currentFinish = product.colors?.[activeColor] || { name: "Estándar", hex: "#18181b" };
  const priceToDisplay = effectivePrice ?? product.price;

  const nextImage = () => {
    setActiveImage((activeImage + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImage((activeImage - 1 + images.length) % images.length);
  };

  return (
    <div className={cn("w-full min-h-[90vh] text-zinc-900 dark:text-zinc-100 py-6 sm:py-10 space-y-12 select-none", spaceMono.className)}>
      {/* 1. CINEMATIC HERO: PANTALLA MONUMENTAL CON LUZ AMBIENTAL */}
      <div className="relative w-full rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-[#0c0c12] border border-white/10 shadow-2xl p-6 sm:p-10 lg:p-14 flex flex-col justify-between min-h-[70vh] lg:min-h-[80vh]">
        
        {/* Glow dinámico de fondo matched con el acabado del producto */}
        <div 
          style={{ backgroundColor: currentFinish.hex || "#3b82f6" }}
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-700"
        />
        <div 
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none"
        />

        {/* Top Header Editorial */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {product.badge || product.category || "Edición Exclusiva"}
              </span>
              <span className="text-[11px] text-zinc-400 tracking-wider">
                CINEMATIC EDITION
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              {product.title}
            </h1>
            {product.titleHighlight && (
              <p className="text-sm sm:text-base text-zinc-400 italic">
                {product.titleHighlight}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                ${priceToDisplay.toFixed(2)} <span className="text-xs text-zinc-400">USD</span>
              </div>
              {product.oldPrice && (
                <div className="text-xs text-zinc-500 line-through">
                  ${product.oldPrice.toFixed(2)} USD {product.discount && `(${product.discount})`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Centro: Escaparate Monumental con Navegación Táctil */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-6 sm:py-10">
          <div className="relative max-w-2xl w-full aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhoto}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <img
                  src={currentPhoto}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] rounded-2xl"
                />
              </motion.div>
            </AnimatePresence>

            {/* Flechas de Navegación Cinemáticas */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xl z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xl z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Barra Inferior del Escaparate: Reel de Miniaturas + Selector de Acabado */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 pt-6 border-t border-white/10">
          {/* Reel de fotos en miniatura */}
          {images.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto max-w-full pb-2 md:pb-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 active:scale-95",
                    activeImage === idx
                      ? "border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] scale-105"
                      : "border-white/10 opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Selector de acabado de color */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">
                Acabado: {currentFinish.name}
              </span>
              <div className="flex items-center gap-2">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveColor(idx)}
                    style={{ backgroundColor: c.hex }}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform active:scale-90 cursor-pointer",
                      activeColor === idx
                        ? "border-white ring-2 ring-blue-500/80 scale-110 shadow-lg"
                        : "border-white/30 hover:scale-105"
                    )}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Botón Flotante de Compra */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAgotado || isAdding}
            className={cn(
              "py-3.5 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-xl flex items-center gap-2 shrink-0 disabled:opacity-40",
              isAgotado 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-white hover:bg-zinc-200 text-zinc-950 shadow-[0_0_25px_rgba(255,255,255,0.25)]"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isAgotado ? "Agotado Temporalmente" : isAdding ? "Añadido a la Bolsa" : "Añadir a la Bolsa"}</span>
          </button>
        </div>
      </div>

      {/* 2. NARRATIVA EDITORIAL & ESPECIFICACIONES DE ESTUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Descripción Editorial */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-[2rem] bg-white/70 dark:bg-[#121218]/70 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Manifiesto del Producto</span>
          </div>
          <p className="text-base sm:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200">
            {product.description}
          </p>

          {product.features && product.features.length > 0 && (
            <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Puntos Clave de Ingeniería
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ficha Técnica de Lujo */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-[2rem] bg-white/70 dark:bg-[#121218]/70 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Ficha Técnica de Estudio</span>
          </div>

          <div className="space-y-3 text-xs divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {product.materials && (
              <div className="pt-2 flex justify-between items-center">
                <span className="text-zinc-500">Materiales:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{product.materials}</span>
              </div>
            )}
            {product.dimensions && (
              <div className="pt-2 flex justify-between items-center">
                <span className="text-zinc-500">Dimensiones:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{product.dimensions}</span>
              </div>
            )}
            {product.warranty && (
              <div className="pt-2 flex justify-between items-center">
                <span className="text-zinc-500">Garantía:</span>
                <span className="font-bold text-emerald-500">{product.warranty}</span>
              </div>
            )}
            {product.shipping && (
              <div className="pt-2 flex justify-between items-center">
                <span className="text-zinc-500">Envío:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{product.shipping}</span>
              </div>
            )}
            <div className="pt-2 flex justify-between items-center">
              <span className="text-zinc-500">Disponibilidad:</span>
              <span className="font-bold text-blue-500">
                {product.stock && product.stock > 0 ? `${product.stock} unidades listas para despacho` : "Bajo Pedido"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
