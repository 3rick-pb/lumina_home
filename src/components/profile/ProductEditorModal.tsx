"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  X, 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Star, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Palette, 
  Truck, 
  ShieldCheck, 
  Ruler, 
  Box, 
  FolderOpen,
  LayoutGrid,
  Columns,
  Eye,
  Tv,
  Smartphone,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import { CatalogProduct, ProductCombo } from "@/lib/catalogStore";
import { FloatingGalleryPhotoPicker } from "./FloatingGalleryPhotoPicker";
import { ColorVariantsManager, ColorVariant } from "../admin/ColorVariantsManager";
import { ProductCombosManager } from "./ProductCombosManager";
import { BeUISelectField, BeUICenterMorphModal } from "@/components/ui/BeUIControls";
import { MacOSScrollbar } from "@/components/ui/MacOSScrollbar";
import { normalizeImageUrl } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export type ProductEditorTab = 'esenciales' | 'fotos' | 'presentacion' | 'ficha';

interface ProductEditorModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  product?: CatalogProduct | null;
  categories: string[];
  badges: string[];
  allProducts: CatalogProduct[];
  onSave: (productData: Partial<CatalogProduct>) => Promise<boolean | void>;
  onOpenFullGallery: () => void;
  onManageNiches?: () => void;
}

export function ProductEditorModal({
  open,
  onClose,
  mode,
  product,
  categories,
  badges,
  allProducts,
  onSave,
  onOpenFullGallery,
  onManageNiches,
}: ProductEditorModalProps) {
  const [activeTab, setActiveTab] = useState<ProductEditorTab>('esenciales');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  // Estados del Formulario
  const [title, setTitle] = useState("");
  const [highlight, setHighlight] = useState("");
  const [category, setCategory] = useState("");
  const [badge, setBadge] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [calculatedDiscount, setCalculatedDiscount] = useState("");
  const [stock, setStock] = useState("20");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");

  // Fotografías seleccionadas visualmente (array de URLs limpias)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // Experiencia de Presentación (Formatos Creativos)
  const [layoutType, setLayoutType] = useState<'standard' | 'landing' | 'cinematic' | 'bento'>('standard');
  const [galleryStyle, setGalleryStyle] = useState<'traditional' | 'isometric_3d' | 'carousel_flow' | 'stack_cards'>('traditional');

  // Variantes de Acabado & Tallas
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([
    { name: "Negro Grafito", hex: "#18181B" }
  ]);
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState("");

  // Ficha Técnica & Logística (Opcional)
  const [materials, setMaterials] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [shipping, setShipping] = useState("");
  const [warranty, setWarranty] = useState("");
  const [packageContents, setPackageContents] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [combos, setCombos] = useState<ProductCombo[]>([]);

  const prevOpenRef = useRef(false);
  const prevProductIdRef = useRef<string | null>(null);

  // Inicializar estado según creación o edición (Solo al abrir o cambiar de producto)
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    const switchedProduct = open && mode === 'edit' && product?.id !== prevProductIdRef.current;
    prevOpenRef.current = open;
    if (product) prevProductIdRef.current = product.id;

    if (!open) return;
    if (!justOpened && !switchedProduct) return;

    setFormError(null);
    setFormSuccess(null);
    setActiveTab('esenciales');

    if (mode === 'edit' && product) {
      setTitle(product.title || "");
      setHighlight(product.titleHighlight || "");
      setCategory(product.category || (categories[0] || "General"));
      setBadge(product.badge || "");
      setPrice(product.price ? product.price.toString() : "");
      if (product.oldPrice && product.oldPrice > 0) {
        setHasDiscount(true);
        setOldPrice(product.oldPrice.toString());
        setCalculatedDiscount(product.discount || "");
      } else {
        setHasDiscount(false);
        setOldPrice("");
        setCalculatedDiscount("");
      }
      setStock(product.stock !== undefined ? product.stock.toString() : "20");
      setDescription(product.description || "");
      setFeatures(product.features && product.features.length > 0 ? product.features.join("\n") : "");

      // Fotografías
      const imgs: string[] = [];
      if (product.imageUrl) imgs.push(product.imageUrl);
      if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
          if (!imgs.includes(img)) imgs.push(img);
        });
      }
      setSelectedPhotos(imgs);

      // Presentación
      setLayoutType(product.layoutType || 'standard');
      setGalleryStyle(product.galleryStyle || 'traditional');

      // Colores y Tallas
      if (product.colors && product.colors.length > 0) {
        setColorVariants(product.colors);
      } else {
        setColorVariants([{ name: "Negro Grafito", hex: "#18181B" }]);
      }
      if (product.sizes && product.sizes.length > 0) {
        setHasSizes(true);
        setSizes(product.sizes.join(", "));
      } else {
        setHasSizes(false);
        setSizes("");
      }

      // Extras
      setMaterials(product.materials || "");
      setDimensions(product.dimensions || "");
      setShipping(product.shipping || "");
      setWarranty(product.warranty || "");
      setPackageContents(product.packageContents || "");
      setCareInstructions(product.careInstructions || "");
      setCombos(product.combos || []);
    } else {
      // Modo Crear
      setTitle("");
      setHighlight("");
      setCategory(categories[0] || "General");
      setBadge("");
      setPrice("");
      setOldPrice("");
      setHasDiscount(false);
      setCalculatedDiscount("");
      setStock("20");
      setDescription("");
      setFeatures("");
      setSelectedPhotos([]);
      setLayoutType('standard');
      setGalleryStyle('traditional');
      setColorVariants([{ name: "Negro Grafito", hex: "#18181B" }]);
      setHasSizes(false);
      setSizes("");
      setMaterials("");
      setDimensions("");
      setShipping("");
      setWarranty("");
      setPackageContents("");
      setCareInstructions("");
      setCombos([]);
    }
  }, [open, mode, product, categories]);

  // Recalcular descuento
  const handlePriceUpdate = (newPrice: string, newOldPrice: string, discActive: boolean) => {
    setPrice(newPrice);
    setOldPrice(newOldPrice);
    if (discActive && newPrice && newOldPrice) {
      const p = parseFloat(newPrice);
      const op = parseFloat(newOldPrice);
      if (op > p && op > 0) {
        const pct = Math.round(((op - p) / op) * 100);
        setCalculatedDiscount(`-${pct}%`);
        return;
      }
    }
    setCalculatedDiscount("");
  };

  // Manejo de fotos añadidas desde la ventana flotante
  const handlePhotosAddedFromPicker = (newUrls: string[]) => {
    const updated = [...selectedPhotos];
    newUrls.forEach(url => {
      const clean = normalizeImageUrl(url);
      if (clean && !updated.includes(clean)) {
        updated.push(clean);
      }
    });
    setSelectedPhotos(updated);
  };

  // Quitar una foto de la bandeja
  const handleRemovePhoto = (idxToRemove: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, idx) => idx !== idxToRemove));
  };

  // Establecer una foto como portada principal
  const handleSetCoverPhoto = (idxToCover: number) => {
    if (idxToCover === 0) return;
    const target = selectedPhotos[idxToCover];
    const rest = selectedPhotos.filter((_, idx) => idx !== idxToCover);
    setSelectedPhotos([target, ...rest]);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validación ágil de esenciales
    if (!title.trim()) {
      setActiveTab('esenciales');
      setFormError("Ingresa el Nombre del Producto.");
      return;
    }
    if (!price.trim() || !(parseFloat(price) > 0)) {
      setActiveTab('esenciales');
      setFormError("Ingresa un precio válido.");
      return;
    }
    if (selectedPhotos.length === 0) {
      setActiveTab('fotos');
      setFormError("Selecciona al menos una fotografía de la Galería de Fotos como portada.");
      return;
    }

    setIsSubmitting(true);

    try {
      const coverUrl = selectedPhotos[0];
      const galleryUrls = selectedPhotos;

      const payload: Partial<CatalogProduct> = {
        title: title.trim(),
        titleHighlight: highlight.trim() || undefined,
        category: category.trim() || categories[0] || "General",
        badge: badge.trim() || undefined,
        price: parseFloat(price) || 0,
        oldPrice: hasDiscount && oldPrice ? parseFloat(oldPrice) : null,
        discount: hasDiscount && calculatedDiscount ? calculatedDiscount : undefined,
        stock: parseInt(stock, 10) || 20,
        description: description.trim(),
        features: features.trim() ? features.split("\n").map(f => f.trim()).filter(Boolean) : undefined,
        imageUrl: coverUrl,
        images: galleryUrls,
        layoutType,
        galleryStyle,
        colors: colorVariants.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), hex: c.hex.trim() || "#18181B" })),
        sizes: hasSizes && sizes.trim() ? sizes.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        materials: materials.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        shipping: shipping.trim() || undefined,
        warranty: warranty.trim() || undefined,
        packageContents: packageContents.trim() || undefined,
        careInstructions: careInstructions.trim() || undefined,
        combos: combos.length > 0 ? combos : undefined,
      };

      await onSave(payload);
      setFormSuccess(mode === 'create' ? "¡Producto publicado con éxito!" : "¡Cambios guardados con éxito!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar el producto.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <BeUICenterMorphModal
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
        hyperOSLandscapeOnMobile={true}
        className="max-w-5xl w-full p-0 overflow-hidden !rounded-[2.5rem] border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div
          data-lenis-prevent="true"
          className={cn(
            "w-full flex flex-col flex-1 min-h-0 bg-[#fafafc] dark:bg-[#0e0e14] overflow-hidden font-mono select-none",
            spaceMono.className
          )}
        >
          {/* 1. TOP HEADER: Barra de Navegación por Pestañas Claras (Sin estrés) */}
          <div className="px-5 sm:px-7 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#12121a]/90 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    {mode === 'create' ? "NUEVO REGISTRO" : "MODO EDICIÓN"}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {mode === 'create' ? "Añadir Producto al Catálogo" : `Editar: ${title || "Producto"}`}
                </h2>
              </div>
            </div>

            {/* Pestañas de Navegación del Editor */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs self-start md:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab('esenciales')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 active:scale-95",
                  activeTab === 'esenciales'
                    ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                1. Esenciales
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fotos')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95",
                  activeTab === 'fotos'
                    ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span>2. Fotos</span>
                <span className={cn(
                  "w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold",
                  selectedPhotos.length > 0 ? "bg-blue-500 text-white" : "bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                )}>
                  {selectedPhotos.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presentacion')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95",
                  activeTab === 'presentacion'
                    ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>3. Experiencia UX</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ficha')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 active:scale-95",
                  activeTab === 'ficha'
                    ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                4. Extras
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="hidden md:flex p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-90 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes de Alerta / Éxito */}
          {formError && (
            <div className="mx-6 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="mx-6 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* 2. BODY CONTENT: Flujo sin estrés según pestaña activa */}
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
            <div className="relative flex-1 min-h-0 overflow-hidden">
              <div 
                ref={modalScrollRef}
                data-lenis-prevent="true"
                className="w-full h-full overflow-y-auto p-5 sm:p-7 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain"
              >
            
            {/* PESTAÑA 1: ESENCIALES (Solo lo verdaderamente importante) */}
            {activeTab === 'esenciales' && (
              <div className="space-y-5 animate-fade-in">
                {/* Nombre y Subtítulo */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Lámpara de Mesa Eclipse LED"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Subtítulo / Destacado Itálico (Opcional)
                      </label>
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => setHighlight(e.target.value)}
                        placeholder="Ej: Cerámica Artesanal, Luz Cálida 2700K"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Categoría y Badge */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Nicho / Categoría *
                        </label>
                        {onManageNiches && (
                          <button
                            type="button"
                            onClick={onManageNiches}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            + Gestionar Nichos
                          </button>
                        )}
                      </div>
                      <BeUISelectField
                        value={category}
                        onChange={setCategory}
                        options={categories.map(c => ({ value: c, label: c }))}
                        placeholder="Selecciona categoría..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Badge Comercial (Etiqueta Flotante)
                      </label>
                      <BeUISelectField
                        value={badge}
                        onChange={setBadge}
                        options={[
                          { value: "", label: "Sin Badge" },
                          ...badges.map(b => ({ value: b, label: b }))
                        ]}
                        placeholder="Sin Badge"
                      />
                    </div>
                  </div>
                </div>

                {/* Precio, Oferta y Stock */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Precios y Existencias
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">¿Tiene descuento?</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !hasDiscount;
                          setHasDiscount(next);
                          handlePriceUpdate(price, oldPrice, next);
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                          hasDiscount ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-xs",
                          hasDiscount ? "left-5" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        {hasDiscount ? "Precio con Descuento ($) *" : "Precio de Venta ($) *"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => handlePriceUpdate(e.target.value, oldPrice, hasDiscount)}
                        placeholder="49.99"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {hasDiscount ? (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Precio Original Antes ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={oldPrice}
                            onChange={(e) => handlePriceUpdate(price, e.target.value, hasDiscount)}
                            placeholder="69.99"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Ahorro Calculado
                          </label>
                          <div className="px-3.5 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                            <span>{calculatedDiscount || "0%"}</span>
                            <TrendingDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Unidades en Stock
                        </label>
                        <input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="20"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Descripción y Viñetas */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Descripción Comercial del Producto
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe la esencia de esta pieza, su diseño, iluminación y por qué enamorará al cliente..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Características Destacadas (Una por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={features}
                      onChange={(e) => setFeatures(e.target.value)}
                      placeholder="Acabado mate antihuellas&#10;Eficiencia energética A+++&#10;Control táctil capacitivo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: FOTOGRAFÍAS (100% Visual desde la Galería de Fotos - Cero Enlaces de Texto) */}
            {activeTab === 'fotos' && (
              <div className="space-y-6 animate-fade-in">
                {/* Barra de Acciones de Fotos */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      <span>Fotografías de la Pieza ({selectedPhotos.length})</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Selecciona fotos directamente de tus carpetas sincronizadas en la Galería de Fotos.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Botón Flotante para Abrir Selector de Fotos */}
                    <button
                      type="button"
                      onClick={() => setShowGalleryPicker(true)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Añadir de Galería de Fotos</span>
                    </button>

                    {/* Botón para Abrir la Galería de Fotos completa */}
                    <button
                      type="button"
                      onClick={onOpenFullGallery}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs border border-zinc-200 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      title="Abrir la Galería de Fotos para cambiar de carpeta o ver fotos en HD"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span className="hidden sm:inline">Ir a Galería de Fotos</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </button>
                  </div>
                </div>

                {/* Bandeja Visual de Fotografías */}
                {selectedPhotos.length === 0 ? (
                  <div 
                    onClick={() => setShowGalleryPicker(true)}
                    className="p-12 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 text-center flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-colors bg-white/40 dark:bg-[#12121a]/40"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        No has seleccionado fotografías para este producto
                      </h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Haz clic aquí para abrir la ventana flotante y seleccionar las fotos de tu carpeta de Galería de Fotos.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGalleryPicker(true)}
                      className="mt-2 py-2 px-5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                    >
                      Seleccionar Fotos Ahora
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedPhotos.map((url, idx) => {
                      const isCover = idx === 0;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "group relative rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between bg-white dark:bg-[#14141c]",
                            isCover 
                              ? "ring-2 ring-blue-500 border-blue-500 shadow-md" 
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                          )}
                        >
                          {/* Contenedor de Imagen */}
                          <div className="aspect-square w-full relative bg-black/5 dark:bg-black/30 overflow-hidden">
                            <img
                              src={url}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Badge de Portada */}
                            {isCover ? (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                <span>PORTADA</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCoverPhoto(idx)}
                                className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 hover:bg-black/90 text-white text-[9px] font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                              >
                                Hacer Portada
                              </button>
                            )}

                            {/* Botón Quitar */}
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md active:scale-90"
                              title="Quitar foto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-2.5 text-center text-[10px] text-zinc-500 font-bold border-t border-zinc-100 dark:border-zinc-800">
                            {isCover ? "Foto Principal de Portada" : `Galería • Foto #${idx + 1}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: EXPERIENCIA VISUAL & CREATIVIDAD (Formatos únicos de presentación) */}
            {activeTab === 'presentacion' && (
              <div className="space-y-6 animate-fade-in">
                {/* 1. Selector de Arquitectura de Presentación */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Formato de Presentación en Tienda (Layout de Página)</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Elige cómo vivirán los clientes la experiencia al entrar a este producto. No somos una tienda más del montón.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Opción 1: Estándar Estudio */}
                    <div
                      onClick={() => setLayoutType('standard')}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]",
                        layoutType === 'standard'
                          ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">01 // CLÁSICO</span>
                          {layoutType === 'standard' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Estudio Minimalista
                        </h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Ficha limpia inspirada en Apple Store, con galería a la izquierda y ficha flotante a la derecha.
                        </p>
                      </div>
                    </div>

                    {/* Opción 2: Editorial Landing */}
                    <div
                      onClick={() => setLayoutType('landing')}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]",
                        layoutType === 'landing'
                          ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">02 // KEYNOTE</span>
                          {layoutType === 'landing' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Landing Editorial
                        </h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Página completa de lanzamiento con anatomía con pines interactivos, reviews y ofertas en bundle.
                        </p>
                      </div>
                    </div>

                    {/* Opción 3: Lookbook Cinemático */}
                    <div
                      onClick={() => setLayoutType('cinematic')}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]",
                        layoutType === 'cinematic'
                          ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">03 // INMERSIVO</span>
                          {layoutType === 'cinematic' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Lookbook Cinemático
                        </h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Fotografía monumental, iluminación ambiental de fondo, modo noche e impacto visual de lujo.
                        </p>
                      </div>
                    </div>

                    {/* Opción 4: Bento Hardware Showcase */}
                    <div
                      onClick={() => setLayoutType('bento')}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]",
                        layoutType === 'bento'
                          ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">04 // BENTO</span>
                          {layoutType === 'bento' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Bento Showcase
                        </h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Mosaico interactivo Bento con tarjetas de macro zoom, especificaciones de ingeniería y compra rápida.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Selector de Estilo de Galería Multimedia */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>Estilo Interactivo de la Galería Multimedia</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Cómo interactúan los visitantes con las fotos de esta pieza.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div
                      onClick={() => setGalleryStyle('traditional')}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                        galleryStyle === 'traditional'
                          ? "border-blue-600 bg-blue-50/15 dark:bg-blue-950/20 shadow-sm"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Galería Estudio (Tradicional)</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Miniaturas táctiles y visor de gran formato.</p>
                      </div>
                      {galleryStyle === 'traditional' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>

                    <div
                      onClick={() => setGalleryStyle('isometric_3d')}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                        galleryStyle === 'isometric_3d'
                          ? "border-blue-600 bg-blue-50/15 dark:bg-blue-950/20 shadow-sm"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">3D Isométrica (Instagram)</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Cubo 3D giratorio con profundidad espacial interactiva.</p>
                      </div>
                      {galleryStyle === 'isometric_3d' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  </div>
                </div>

                {/* 3. Colores y Acabados */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Variantes de Acabado y Colores
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      {colorVariants.length} acabados activos
                    </span>
                  </div>
                  <ColorVariantsManager
                    colors={colorVariants}
                    onChange={setColorVariants}
                  />
                </div>

                {/* 4. Tallas y Tamaños */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Tallas o Medidas (Opcional)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">¿Aplica medidas?</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !hasSizes;
                          setHasSizes(next);
                          if (!next) setSizes("");
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                          hasSizes ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-xs",
                          hasSizes ? "left-5" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>

                  {hasSizes ? (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Tallas o Dimensiones Disponibles (Separadas por comas)
                      </label>
                      <input
                        type="text"
                        value={sizes}
                        onChange={(e) => setSizes(e.target.value)}
                        placeholder="Ej: Chico (25cm), Mediano (45cm), Grande (60cm)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      Producto de dimensión estándar única (sin selector de tallas).
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 4: FICHA TÉCNICA, LOGÍSTICA & COMBOS (Opcional) */}
            {activeTab === 'ficha' && (
              <div className="space-y-5 animate-fade-in">
                {/* Materiales y Dimensiones */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Materiales y Fabricación (Opcional)
                      </label>
                      <input
                        type="text"
                        value={materials}
                        onChange={(e) => setMaterials(e.target.value)}
                        placeholder="Ej: Cerámica artesanal cocida a 1250°C, latón macizo"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Dimensiones y Peso (Opcional)
                      </label>
                      <input
                        type="text"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        placeholder="Ej: 32 x 18 x 18 cm · Peso neto: 1.4 kg"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Envíos y Garantía */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Tiempos y Condiciones de Envío (Opcional)
                      </label>
                      <input
                        type="text"
                        value={shipping}
                        onChange={(e) => setShipping(e.target.value)}
                        placeholder="Ej: Entrega en 24-48h con seguro contra roturas"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Garantía Oficial (Opcional)
                      </label>
                      <input
                        type="text"
                        value={warranty}
                        onChange={(e) => setWarranty(e.target.value)}
                        placeholder="Ej: 2 años de garantía de fábrica"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Combos y Venta Cruzada */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                  <div className="pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Combos y Paquetes de Venta Cruzada (Opcional)
                    </h4>
                  </div>
                  <ProductCombosManager
                    combos={combos}
                    onChange={setCombos}
                    allProducts={allProducts}
                    currentProductPrice={parseFloat(price) || 0}
                  />
                </div>
              </div>
            )}

              </div>
              {/* Authentic macOS Sequoia Floating Overlay Scrollbar */}
              <MacOSScrollbar containerRef={modalScrollRef} insetTop={14} insetBottom={14} insetRight={3} />
            </div>

            {/* 3. FOOTER INFERIOR FIJO: Botones de Acción Intuitivos */}
            <div className="px-5 sm:px-7 py-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#12121a]/95 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                {activeTab !== 'esenciales' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'ficha') setActiveTab('presentacion');
                      else if (activeTab === 'presentacion') setActiveTab('fotos');
                      else if (activeTab === 'fotos') setActiveTab('esenciales');
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Anterior
                  </button>
                )}

                {activeTab !== 'ficha' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'esenciales') setActiveTab('fotos');
                      else if (activeTab === 'fotos') setActiveTab('presentacion');
                      else if (activeTab === 'presentacion') setActiveTab('ficha');
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors cursor-pointer"
                  >
                    Siguiente
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting 
                      ? "Guardando..." 
                      : mode === 'create' ? "Publicar en Tienda" : "Guardar Cambios"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </BeUICenterMorphModal>

      {/* Modal Flotante de Selección de Fotos desde la Carpeta de Google Drive */}
      <FloatingGalleryPhotoPicker
        open={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onSelectPhotos={handlePhotosAddedFromPicker}
        onOpenFullGallery={onOpenFullGallery}
        title="Seleccionar Fotos para el Producto"
        allowMultiple={true}
      />
    </>
  );
}
