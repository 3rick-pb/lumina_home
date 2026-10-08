"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Check, 
  Layers, 
  Box, 
  Maximize2,
  Package,
  Ruler,
  CheckCircle2
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalogStore";
import { cn } from "@/lib/utils";
import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

interface ProductBentoViewProps {
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

export function ProductBentoView({
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
}: ProductBentoViewProps) {
  const currentPhoto = images[activeImage] || images[0] || product.imageUrl;
  const currentFinish = product.colors?.[activeColor] || { name: "Estándar", hex: "#18181b" };
  const priceToDisplay = effectivePrice ?? product.price;

  return (
    <div className={cn("w-full py-6 sm:py-10 text-zinc-900 dark:text-zinc-100 select-none", spaceMono.className)}>
      {/* CUADRÍCULA BENTO GRID INTERACTIVA (Apple Hardware Showcase) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        
        {/* BENTO TILE 1: FOTO PRINCIPAL HERO (md:col-span-8, row-span-2) */}
        <div className="md:col-span-8 relative rounded-[2.5rem] bg-zinc-100/80 dark:bg-[#101016] border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm group min-h-[460px] sm:min-h-[540px]">
          {/* Tag superior */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {product.badge || "BENTO SHOWCASE"}
            </span>
            <span className="text-[11px] text-zinc-400">
              VISTA {activeImage + 1} DE {images.length}
            </span>
          </div>

          {/* Imagen Central en Gran Formato */}
          <div className="relative z-10 my-auto flex items-center justify-center py-6">
            <motion.img
              key={currentPhoto}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              src={currentPhoto}
              alt={product.title}
              className="max-h-[380px] w-auto max-w-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>

          {/* Mini-dock inferior de selección de foto */}
          {images.length > 1 && (
            <div className="relative z-10 flex items-center gap-2 overflow-x-auto pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 active:scale-95",
                    activeImage === idx
                      ? "border-blue-500 shadow-md scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BENTO TILE 2: IDENTIFICACIÓN & ACCIÓN DE COMPRA (md:col-span-4) */}
        <div className="md:col-span-4 rounded-[2.5rem] bg-zinc-900 text-white dark:bg-[#161620] border border-zinc-800 p-6 sm:p-7 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold">
              {product.category}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              {product.title}
            </h1>
            {product.titleHighlight && (
              <p className="text-xs text-zinc-400 italic">
                {product.titleHighlight}
              </p>
            )}

            <div className="pt-2">
              <div className="text-3xl font-bold text-white tracking-tight">
                ${priceToDisplay.toFixed(2)} <span className="text-xs text-zinc-400">USD</span>
              </div>
              {product.oldPrice && (
                <p className="text-xs text-zinc-400 line-through mt-0.5">
                  ${product.oldPrice.toFixed(2)} USD {product.discount && `(${product.discount})`}
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAgotado || isAdding}
              className={cn(
                "w-full py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2",
                isAgotado
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-white hover:bg-zinc-100 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAgotado ? "Agotado" : isAdding ? "Añadido con Éxito" : "Añadir a la Bolsa"}</span>
            </button>

            <p className="text-[10px] text-zinc-400 text-center">
              Despacho asegurado • Garantía oficial Lumina
            </p>
          </div>
        </div>

        {/* BENTO TILE 3: SELECTOR DE ACABADOS & COLORES (md:col-span-4) */}
        {product.colors && product.colors.length > 0 && (
          <div className="md:col-span-4 rounded-[2rem] bg-white dark:bg-[#121218] border border-zinc-200/90 dark:border-zinc-800/90 p-6 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Acabados Disponibles
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {currentFinish.name}
              </span>
            </div>

            <div className="py-4 flex items-center gap-3">
              {product.colors.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveColor(idx)}
                  style={{ backgroundColor: c.hex }}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 transition-transform active:scale-90 cursor-pointer shadow-xs",
                    activeColor === idx
                      ? "border-blue-500 ring-2 ring-blue-500/40 scale-110"
                      : "border-zinc-300 dark:border-zinc-700 hover:scale-105"
                  )}
                  title={c.name}
                />
              ))}
            </div>

            <p className="text-[11px] text-zinc-500">
              Gama de acabados arquitectónicos de alta durabilidad.
            </p>
          </div>
        )}

        {/* BENTO TILE 4: ESPECIFICACIONES TÉCNICAS (md:col-span-8) */}
        <div className="md:col-span-8 rounded-[2rem] bg-white dark:bg-[#121218] border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Especificaciones & Materiales
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-500">
              {product.stock && product.stock > 0 ? `${product.stock} en inventario` : "Disponible"}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {product.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {product.materials && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Material</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
                  {product.materials}
                </span>
              </div>
            )}
            {product.dimensions && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Medidas</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
                  {product.dimensions}
                </span>
              </div>
            )}
            {product.warranty && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Garantía</span>
                <span className="text-xs font-bold text-emerald-500 truncate block mt-0.5">
                  {product.warranty}
                </span>
              </div>
            )}
            {product.shipping && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Envío</span>
                <span className="text-xs font-bold text-blue-500 truncate block mt-0.5">
                  {product.shipping}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
