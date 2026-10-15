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
import { CatalogProduct, ProductCombo, LandingSpec, LandingReview, LandingBenefit, LandingBundle } from "@/lib/catalogStore";
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

// Helper de Autocompletado inteligente para bloques según descripción y título del producto
export function getAutoFillData(currentTitle: string, currentCategory: string, currentDesc: string) {
  const prodTitle = currentTitle.trim() || "Pieza de Diseño Lumina";
  const cat = currentCategory.trim() || "Iluminación";
  const descInfo = currentDesc.trim() ? currentDesc.trim() : `Pieza icónica de ${cat.toLowerCase()} Lumina`;

  const specs: LandingSpec[] = [
    {
      title: "Chasis Aeroespacial Anodizado",
      description: `Estructura forjada de alta precisión tratada térmicamente para máxima durabilidad en ${prodTitle.toLowerCase()} (${descInfo.slice(0, 40)}...).`,
      side: "left",
      pinX: 26,
      pinY: 30,
    },
    {
      title: "Óptica Difusa de Cristal Puro",
      description: "Dispersión volumétrica homogénea de 360° con recubrimiento que previene deslumbramientos.",
      side: "left",
      pinX: 28,
      pinY: 65,
    },
    {
      title: "Módulo Térmico Silencioso",
      description: "Disipación pasiva silenciosa que prolonga la vida útil de los componentes por más de 50.000 horas.",
      side: "left",
      pinX: 30,
      pinY: 82,
    },
    {
      title: "Sensor Táctil Capacitivo",
      description: "Control continuo milimétrico y ajuste instantáneo de temperatura con respuesta inmediata.",
      side: "right",
      pinX: 74,
      pinY: 28,
    },
    {
      title: "Conectividad Ultra Rápida USB-C",
      description: "Protocolo reversible de carga y alimentación con microcontrolador de protección contra sobretensión.",
      side: "right",
      pinX: 72,
      pinY: 66,
    },
    {
      title: "Base Amortiguada Antideslizante",
      description: "Apoyo en corcho natural de alta densidad para máxima estabilidad sin marcar superficies delicadas.",
      side: "right",
      pinX: 68,
      pinY: 84,
    },
  ];

  const reviews: LandingReview[] = [
    {
      author: "Valentina Montes",
      role: "Arquitecta de Interiores",
      rating: 5,
      comment: `La presencia de ${prodTitle} en el espacio es sublime. La textura y calidez de los acabados superaron con creces nuestras expectativas.`,
    },
    {
      author: "Carlos E. Salgado",
      role: "Comprador Verificado",
      rating: 5,
      comment: "Llegó al día siguiente perfectamente blindado. El peso, la solidez y el tacto mate transmiten una calidad de primer nivel.",
    },
    {
      author: "Sofía R. Delgado",
      role: "Diseñadora de Iluminación",
      rating: 5,
      comment: "Cuidaron hasta el último milímetro: la temperatura de color y el difusor no cansan la vista durante jornadas de trabajo intenso.",
    },
    {
      author: "Mateo Villagómez",
      role: "Coleccionista de Diseño",
      rating: 5,
      comment: "Una inversión impecable. Combina funcionalidad cotidiana con una estética arquitectónica y sobria.",
    },
  ];

  const benefits: LandingBenefit[] = [
    {
      title: "Artesanía & Precisión Industrial",
      description: `Cada unidad de ${prodTitle} es ensamblada e inspeccionada bajo tolerancias milimétricas antes de ser sellada.`,
    },
    {
      title: "Sostenibilidad & Trazabilidad Ética",
      description: "Materiales nobles 100% reciclables con cero emisiones tóxicas y embalaje de pulpa vegetal biodegradable.",
    },
    {
      title: "2 Años de Garantía Lumina Care",
      description: "Sustitución directa y soporte técnico prioritario sin formularios tediosos ni complicaciones.",
    },
  ];

  return { specs, reviews, benefits };
}

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

  // Datos dinámicos para plantillas de alta conversión (01 Estudio, 02 Landing, 03 Lookbook, 04 Bento)
  const [landingSpecs, setLandingSpecs] = useState<LandingSpec[]>([]);
  const [landingReviews, setLandingReviews] = useState<LandingReview[]>([]);
  const [landingBenefits, setLandingBenefits] = useState<LandingBenefit[]>([]);
  const [landingBundle, setLandingBundle] = useState<LandingBundle>({ enabled: true, mode: 'volume_tiers', discountPercentage: 15 });
  const [landingAnatomyImage, setLandingAnatomyImage] = useState<string>("");
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);

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
    setAutoFillNotice(null);
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

      // Contenido Dinámico de Plantilla
      setLandingSpecs(product.landingSpecs || []);
      setLandingReviews(product.landingReviews || []);
      setLandingBenefits(product.landingBenefits || []);
      setLandingBundle(product.landingBundle || { enabled: true, mode: 'volume_tiers', discountPercentage: 15 });
      setLandingAnatomyImage(product.landingAnatomyImage || "");
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
      setLandingSpecs([]);
      setLandingReviews([]);
      setLandingBenefits([]);
      setLandingBundle({ enabled: true, mode: 'volume_tiers', discountPercentage: 15 });
      setLandingAnatomyImage("");
    }
  }, [open, mode, product, categories]);

  // Autocompletar dinámico de bloques según descripción y datos comerciales
  const handleAutoFillTemplate = () => {
    const data = getAutoFillData(title, category, description);
    setLandingSpecs(data.specs);
    setLandingReviews(data.reviews);
    setLandingBenefits(data.benefits);
    if (!landingAnatomyImage && selectedPhotos.length > 1) {
      setLandingAnatomyImage(selectedPhotos[1]);
    } else if (!landingAnatomyImage && selectedPhotos.length > 0) {
      setLandingAnatomyImage(selectedPhotos[0]);
    }
    setAutoFillNotice("¡Bloques autocompletados con éxito según la información del producto!");
    setTimeout(() => setAutoFillNotice(null), 4000);
  };

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

  // Validación estricta: todos los campos requeridos deben estar completos para poder guardar/publicar
  const isFormComplete = useMemo(() => {
    if (!title.trim()) return false;
    if (!category.trim()) return false;
    if (!price.trim() || !(parseFloat(price) > 0)) return false;
    if (!stock.trim() || parseInt(stock, 10) < 0) return false;
    if (!description.trim()) return false;
    if (selectedPhotos.length === 0) return false;
    if (hasSizes && !sizes.trim()) return false;
    if (hasDiscount && (!oldPrice.trim() || !(parseFloat(oldPrice) > parseFloat(price)))) return false;
    return true;
  }, [title, category, price, stock, description, selectedPhotos, hasSizes, sizes, hasDiscount, oldPrice]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validación completa y navegación guiada a la pestaña correspondiente
    if (!title.trim()) {
      setActiveTab('esenciales');
      setFormError("Ingresa el Nombre del Producto.");
      return;
    }
    if (!category.trim()) {
      setActiveTab('esenciales');
      setFormError("Selecciona una Categoría para el producto.");
      return;
    }
    if (!price.trim() || !(parseFloat(price) > 0)) {
      setActiveTab('esenciales');
      setFormError("Ingresa un precio válido mayor a 0.");
      return;
    }
    if (hasDiscount && (!oldPrice.trim() || !(parseFloat(oldPrice) > parseFloat(price)))) {
      setActiveTab('esenciales');
      setFormError("El precio original antes de descuento debe ser mayor que el precio de venta.");
      return;
    }
    if (!stock.trim() || parseInt(stock, 10) < 0) {
      setActiveTab('esenciales');
      setFormError("Ingresa la cantidad de unidades en inventario.");
      return;
    }
    if (!description.trim()) {
      setActiveTab('esenciales');
      setFormError("Ingresa una descripción comercial para el producto.");
      return;
    }
    if (selectedPhotos.length === 0) {
      setActiveTab('fotos');
      setFormError("Selecciona al menos una fotografía de la Galería de Fotos como portada.");
      return;
    }
    if (hasSizes && !sizes.trim()) {
      setActiveTab('presentacion');
      setFormError("Especifica las tallas disponibles o desmarca la opción.");
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
        landingSpecs: landingSpecs.length > 0 ? landingSpecs : undefined,
        landingReviews: landingReviews.length > 0 ? landingReviews : undefined,
        landingBenefits: landingBenefits.length > 0 ? landingBenefits : undefined,
        landingBundle: landingBundle ? landingBundle : undefined,
        landingAnatomyImage: landingAnatomyImage.trim() || undefined,
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
        className="max-w-5xl w-full p-0 overflow-hidden !rounded-[2.5rem] border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl h-[92vh] max-h-[92vh] flex flex-col"
      >
        <div
          data-lenis-prevent="true"
          className={cn(
            "w-full flex flex-col flex-1 min-h-0 bg-[#fafafc] dark:bg-[#0e0e14] overflow-hidden font-mono select-none",
            spaceMono.className
          )}
        >
          {/* 1. TOP HEADER: Barra de Navegación por Pestañas Claras (Sin estrés) */}
          <div className="px-3.5 sm:px-7 py-2.5 sm:py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#12121a]/90 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 shrink-0">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                      {mode === 'create' ? "NUEVO REGISTRO" : "MODO EDICIÓN"}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate max-w-[210px] sm:max-w-none">
                    {mode === 'create' ? "Añadir Producto" : `Editar: ${title || "Producto"}`}
                  </h2>
                </div>
              </div>

              {/* Close Button on Mobile (visible in top-right) */}
              <button
                type="button"
                onClick={onClose}
                className="flex md:hidden p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-90 shrink-0"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de Navegación del Editor */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900/80 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs overflow-x-auto no-scrollbar max-w-full gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('esenciales')}
                className={cn(
                  "px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold transition-all cursor-pointer shrink-0 active:scale-95 whitespace-nowrap",
                  activeTab === 'esenciales'
                    ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                1. Plantilla & Esenciales *
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fotos')}
                className={cn(
                  "px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 whitespace-nowrap",
                  activeTab === 'fotos'
                    ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span>2. Fotos *</span>
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
                  "px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 whitespace-nowrap",
                  activeTab === 'presentacion'
                    ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>3. Contenido de Plantilla</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ficha')}
                className={cn(
                  "px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold transition-all cursor-pointer shrink-0 active:scale-95 whitespace-nowrap",
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
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes de Alerta / Éxito */}
          {formError && (
            <div className="mx-3.5 sm:mx-6 mt-2.5 sm:mt-3 p-2.5 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="mx-3.5 sm:mx-6 mt-2.5 sm:mt-3 p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* 2. BODY CONTENT: Flujo sin estrés según pestaña activa */}
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="relative flex-1 min-h-0 overflow-hidden">
              <div 
                ref={modalScrollRef}
                data-lenis-prevent="true"
                onWheel={(e) => {
                  e.stopPropagation();
                }}
                className="h-full w-full overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain"
              >
            
            {/* PESTAÑA 1: PLANTILLA & ESENCIALES (Solo lo verdaderamente importante) */}
            {activeTab === 'esenciales' && (
              <div className="space-y-4 sm:space-y-5 animate-fade-in">
                {/* 1. Selector de Arquitectura de Presentación (Layout de Página) */}
                <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Formato de Presentación en Tienda (Layout de Página) *</span>
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Elige cómo vivirán los clientes la experiencia al abrir este producto en la tienda.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900 w-fit">
                      PASO 1 • SELECCIÓN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                    {/* Opción 1: Estudio Minimalista */}
                    <div
                      onClick={() => setLayoutType('standard')}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]",
                        layoutType === 'standard'
                          ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">01 // CLÁSICO</span>
                          {layoutType === 'standard' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Estudio Minimalista
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-relaxed">
                          3 secciones limpias: Buy Box 2 col con tira vertical y zoom, bloque 50/50 con pestañas y productos relacionados.
                        </p>
                      </div>
                    </div>

                    {/* Opción 2: Editorial Landing */}
                    <div
                      onClick={() => setLayoutType('landing')}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]",
                        layoutType === 'landing'
                          ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">02 // KEYNOTE</span>
                          {layoutType === 'landing' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Landing Editorial
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-relaxed">
                          6 secciones: Hero con volumen 1/2/3 uds, combo bundle, anatomía 360° con 6 pines, carrusel UGC 9:16 y zig-zag 1-2-3.
                        </p>
                      </div>
                    </div>

                    {/* Opción 3: Lookbook Cinemático */}
                    <div
                      onClick={() => setLayoutType('cinematic')}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]",
                        layoutType === 'cinematic'
                          ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">03 // INMERSIVO</span>
                          {layoutType === 'cinematic' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Lookbook Cinemático
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-relaxed">
                          Fotografía monumental, iluminación ambiental de fondo y tipografía editorial de gran impacto visual.
                        </p>
                      </div>
                    </div>

                    {/* Opción 4: Bento Hardware Showcase */}
                    <div
                      onClick={() => setLayoutType('bento')}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]",
                        layoutType === 'bento'
                          ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#14141c]"
                      )}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">04 // BENTO</span>
                          {layoutType === 'bento' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Bento Showcase
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-relaxed">
                          Mosaico interactivo Bento con tarjetas modulares de macro zoom, especificaciones técnicas y compra rápida.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nombre y Subtítulo */}
                <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
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

                  <div className={cn(
                    "grid gap-3 sm:gap-4",
                    hasDiscount ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"
                  )}>
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

                    {hasDiscount && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Precio Original Antes ($) *
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
                    )}

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Unidades en Stock *
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="20"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Descripción y Viñetas */}
                <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Descripción Comercial del Producto *
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

            {/* PESTAÑA 3: CONTENIDO DE PLANTILLA DINÁMICA */}
            {activeTab === 'presentacion' && (
              <div className="space-y-5 animate-fade-in">
                {/* 1. Header con Indicador de Plantilla y Botón de Autocompletado */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {layoutType === 'standard'
                          ? "01 // ESTUDIO MINIMALISTA"
                          : layoutType === 'landing'
                          ? "02 // LANDING EDITORIAL"
                          : layoutType === 'cinematic'
                          ? "03 // LOOKBOOK CINEMÁTICO"
                          : "04 // BENTO SHOWCASE"}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      Campos Dinámicos de la Plantilla
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Personaliza los bloques específicos de esta plantilla para maximizar la conversión en la tienda.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFillTemplate}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                    title="Rellena automáticamente los campos con base en el título y descripción"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Autocompletar bloques según descripción</span>
                  </button>
                </div>

                {/* Banner de Feedback de Autocompletado */}
                {autoFillNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{autoFillNotice}</span>
                  </div>
                )}

                {/* ================================================================= */}
                {/* PLANTILLA 01: ESTUDIO MINIMALISTA                                */}
                {/* ================================================================= */}
                {layoutType === 'standard' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                      <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                        <strong className="font-bold">Estructura Fija de 3 Secciones:</strong> Esta plantilla renderiza limpiamente 
                        (1) Buy Box de 2 columnas con galería vertical de miniaturas y zoom en foto principal, 
                        (2) Bloque 50/50 editorial con 4 pestañas interactivas (Detalles, Materiales, Dimensiones, Envío y Garantía) y foto macro, 
                        y (3) Cuadrícula de 4 productos relacionados (&ldquo;También te podría interesar&rdquo;).
                      </p>
                    </div>

                    {/* Selector de Estilo de Galería Multimedia */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
                          <Layers className="w-4 h-4 text-blue-500" />
                          <span>Estilo de Galería Multimedia</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Selecciona cómo interactuarán los clientes con la galería de fotos.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setGalleryStyle('traditional')}
                          className={cn(
                            "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between",
                            galleryStyle === 'traditional'
                              ? "border-blue-600 bg-blue-50/15 dark:bg-blue-950/20 shadow-xs"
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c]"
                          )}
                        >
                          <div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Galería Estudio (Tira Vertical + Zoom)</p>
                            <p className="text-[10px] text-zinc-500">Columna de 4 miniaturas y visor vertical de alta resolución.</p>
                          </div>
                          {galleryStyle === 'traditional' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>

                        <div
                          onClick={() => setGalleryStyle('isometric_3d')}
                          className={cn(
                            "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between",
                            galleryStyle === 'isometric_3d'
                              ? "border-blue-600 bg-blue-50/15 dark:bg-blue-950/20 shadow-xs"
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c]"
                          )}
                        >
                          <div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">3D Isométrica Interactiva</p>
                            <p className="text-[10px] text-zinc-500">Cubo tridimensional giratorio con profundidad espacial.</p>
                          </div>
                          {galleryStyle === 'isometric_3d' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                      </div>
                    </div>

                    {/* Colores y Acabados */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Variantes de Acabado y Colores
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          {colorVariants.length} acabados activos
                        </span>
                      </div>
                      <ColorVariantsManager colors={colorVariants} onChange={setColorVariants} />
                    </div>

                    {/* Tallas y Medidas */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Tallas o Medidas (Opcional)
                        </span>
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
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-xs",
                              hasSizes ? "left-5" : "left-1"
                            )}
                          />
                        </button>
                      </div>

                      {hasSizes ? (
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Tallas o Medidas Disponibles (Separadas por comas)
                          </label>
                          <input
                            type="text"
                            value={sizes}
                            onChange={(e) => setSizes(e.target.value)}
                            placeholder="Ej: S, M, L o Estándar, Grande (60cm)"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">
                          Producto de formato estándar único (sin selector de medidas).
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ================================================================= */}
                {/* PLANTILLA 02: LANDING EDITORIAL (6 SECCIONES DE ALTA CONVERSIÓN) */}
                {/* ================================================================= */}
                {layoutType === 'landing' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                      <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                        <strong className="font-bold">Estructura Fija de 6 Secciones:</strong> Esta plantilla renderiza
                        (1) Hero con selector de volumen (1 ud, 2 uds &ldquo;Más Popular&rdquo;, 3 uds &ldquo;Mejor Valor&rdquo;), 
                        (2) Combo bundle &ldquo;Comprados frecuentemente juntos&rdquo;, 
                        (3) Diagrama de Anatomía Técnica 360° con 6 puntos explicativos y pines interactivos, 
                        (4) Carrusel de historias UGC en tarjetas 9:16, 
                        (5) Cuadrícula de 3 columnas de productos en tendencia, 
                        y (6) Filas zig-zag de beneficios 1-2-3.
                      </p>
                    </div>

                    {/* SECCIÓN 2: Configuración del Combo Bundle */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                            Sección 2 • Combo Bundle (&ldquo;Comprados frecuentemente juntos&rdquo;)
                          </span>
                          <p className="text-[11px] text-zinc-500">Ofrece un lote con descuento con artículos de la misma categoría.</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {landingBundle.discountPercentage || 15}% Descuento
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Título del Combo / Bundle
                          </label>
                          <input
                            type="text"
                            value={landingBundle.customTitle || ""}
                            onChange={(e) => setLandingBundle({ ...landingBundle, customTitle: e.target.value })}
                            placeholder="Ej: Pack Dúo Comprados Juntos"
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Porcentaje de Descuento del Paquete (%)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="50"
                            value={landingBundle.discountPercentage || 15}
                            onChange={(e) => setLandingBundle({ ...landingBundle, discountPercentage: parseInt(e.target.value, 10) || 15 })}
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN 3: Anatomía Técnica 360° (6 Puntos Explicativos) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                            Sección 3 • Diagrama Radial de Anatomía 360° (6 Puntos & Pines)
                          </span>
                          <p className="text-[11px] text-zinc-500">
                            6 especificaciones de ingeniería con pines interactivos posicionados sobre el producto.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 w-fit">
                          {landingSpecs.length || 6} Puntos
                        </span>
                      </div>

                      {/* Imagen dedicada de Anatomía */}
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Imagen para el Diagrama de Anatomía (URL)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={landingAnatomyImage}
                            onChange={(e) => setLandingAnatomyImage(e.target.value)}
                            placeholder="URL de fotografía limpia (por defecto usa la 2da foto de la galería)"
                            className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                          />
                          {selectedPhotos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setLandingAnatomyImage(selectedPhotos[1])}
                              className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 shrink-0"
                            >
                              Usar Foto #2
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lista de 6 Puntos Anatómicos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {Array.from({ length: 6 }).map((_, idx) => {
                          const currentSpec = landingSpecs[idx] || {
                            title: `Punto Anatómico 0${idx + 1}`,
                            description: "Descripción técnica de ingeniería de alta precisión.",
                            pinX: idx < 3 ? 28 : 72,
                            pinY: idx === 0 || idx === 3 ? 30 : idx === 1 || idx === 4 ? 65 : 82,
                          };

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                                  Punto 0{idx + 1}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                                  <span>Pin X: {currentSpec.pinX}%</span>
                                  <span>•</span>
                                  <span>Pin Y: {currentSpec.pinY}%</span>
                                </div>
                              </div>

                              <input
                                type="text"
                                value={currentSpec.title}
                                onChange={(e) => {
                                  const updated = [...(landingSpecs.length > 0 ? landingSpecs : getAutoFillData(title, category, description).specs)];
                                  updated[idx] = { ...currentSpec, title: e.target.value };
                                  setLandingSpecs(updated);
                                }}
                                placeholder="Título del punto"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c] text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                              />

                              <textarea
                                rows={2}
                                value={currentSpec.description}
                                onChange={(e) => {
                                  const updated = [...(landingSpecs.length > 0 ? landingSpecs : getAutoFillData(title, category, description).specs)];
                                  updated[idx] = { ...currentSpec, description: e.target.value };
                                  setLandingSpecs(updated);
                                }}
                                placeholder="Descripción del componente"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c] text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500 resize-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECCIÓN 4: Carrusel UGC (4 Historias / Testimonios en formato 9:16) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                            Sección 4 • Carrusel de 4 Historias UGC (Tarjetas 9:16)
                          </span>
                          <p className="text-[11px] text-zinc-500">4 testimonios con estética de historias / reels.</p>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          4 Reseñas Verificadas
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, idx) => {
                          const currentRev = landingReviews[idx] || {
                            author: idx === 0 ? "Valentina M." : idx === 1 ? "Carlos E." : idx === 2 ? "Sofía R." : "Mateo V.",
                            role: idx === 0 ? "Arquitecta de Interiores" : idx === 1 ? "Comprador Verificado" : idx === 2 ? "Diseñadora de Iluminación" : "Coleccionista",
                            rating: 5,
                            comment: "La calidad de los acabados es insuperable. Ilumina con calidez mágica cualquier espacio.",
                          };

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                  Historia #{idx + 1}
                                </span>
                                <div className="flex text-amber-400 text-xs">★★★★★</div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={currentRev.author}
                                  onChange={(e) => {
                                    const updated = [...(landingReviews.length > 0 ? landingReviews : getAutoFillData(title, category, description).reviews)];
                                    updated[idx] = { ...currentRev, author: e.target.value };
                                    setLandingReviews(updated);
                                  }}
                                  placeholder="Nombre cliente"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c] text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                                />
                                <input
                                  type="text"
                                  value={currentRev.role || ""}
                                  onChange={(e) => {
                                    const updated = [...(landingReviews.length > 0 ? landingReviews : getAutoFillData(title, category, description).reviews)];
                                    updated[idx] = { ...currentRev, role: e.target.value };
                                    setLandingReviews(updated);
                                  }}
                                  placeholder="Rol o Profesión"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c] text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <textarea
                                rows={2}
                                value={currentRev.comment}
                                onChange={(e) => {
                                  const updated = [...(landingReviews.length > 0 ? landingReviews : getAutoFillData(title, category, description).reviews)];
                                  updated[idx] = { ...currentRev, comment: e.target.value };
                                  setLandingReviews(updated);
                                }}
                                placeholder="Cita o testimonio"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c] text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500 resize-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECCIÓN 6: Filas Zig-zag de Beneficios 1-2-3 */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                            Sección 6 • Filas Zig-zag de Beneficios 1-2-3
                          </span>
                          <p className="text-[11px] text-zinc-500">3 capítulos editoriales con alternancia de imagen y copy.</p>
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          3 Capítulos
                        </span>
                      </div>

                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => {
                          const currentBen = landingBenefits[idx] || {
                            title: idx === 0 ? "Artesanía & Precisión Industrial" : idx === 1 ? "Sostenibilidad & Trazabilidad Ética" : "2 Años de Garantía Lumina Care",
                            description: "Materiales nobles certificados con inspección individual antes de embalaje.",
                          };

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black px-2 py-0.5 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-mono">
                                  0{idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={currentBen.title}
                                  onChange={(e) => {
                                    const updated = [...(landingBenefits.length > 0 ? landingBenefits : getAutoFillData(title, category, description).benefits)];
                                    updated[idx] = { ...currentBen, title: e.target.value };
                                    setLandingBenefits(updated);
                                  }}
                                  placeholder="Título del beneficio"
                                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c] text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <textarea
                                rows={2}
                                value={currentBen.description}
                                onChange={(e) => {
                                  const updated = [...(landingBenefits.length > 0 ? landingBenefits : getAutoFillData(title, category, description).benefits)];
                                  updated[idx] = { ...currentBen, description: e.target.value };
                                  setLandingBenefits(updated);
                                }}
                                placeholder="Descripción del beneficio"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14141c] text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500 resize-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Colores y Acabados */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Variantes de Acabado y Colores
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          {colorVariants.length} acabados activos
                        </span>
                      </div>
                      <ColorVariantsManager colors={colorVariants} onChange={setColorVariants} />
                    </div>

                    {/* Tallas y Medidas */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Tallas o Medidas (Opcional)
                        </span>
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
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-xs",
                              hasSizes ? "left-5" : "left-1"
                            )}
                          />
                        </button>
                      </div>

                      {hasSizes ? (
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Tallas o Medidas Disponibles (Separadas por comas)
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
                          Producto de formato estándar único (sin selector de medidas).
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ================================================================= */}
                {/* PLANTILLA 03: LOOKBOOK CINEMÁTICO                                */}
                {/* ================================================================= */}
                {layoutType === 'cinematic' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                      <p className="text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
                        <strong className="font-bold">Lookbook Cinemático de Pantalla Completa:</strong> Esta plantilla renderiza
                        una vista inmersiva cinematográfica con iluminación reactiva ambiental, ambientación de día y noche, 
                        fotografía de gran escala e interacción táctil.
                      </p>
                    </div>

                    {/* Colores y Acabados */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Variantes de Acabado y Colores
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          {colorVariants.length} acabados activos
                        </span>
                      </div>
                      <ColorVariantsManager colors={colorVariants} onChange={setColorVariants} />
                    </div>

                    {/* Tallas y Medidas */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Tallas o Medidas (Opcional)
                        </span>
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
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-xs",
                              hasSizes ? "left-5" : "left-1"
                            )}
                          />
                        </button>
                      </div>

                      {hasSizes ? (
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Tallas o Medidas Disponibles (Separadas por comas)
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
                          Producto de formato estándar único (sin selector de medidas).
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ================================================================= */}
                {/* PLANTILLA 04: BENTO HARDWARE SHOWCASE                             */}
                {/* ================================================================= */}
                {layoutType === 'bento' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                      <p className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
                        <strong className="font-bold">Mosaico Bento Hardware Showcase:</strong> Esta plantilla organiza
                        el producto en una cuadrícula bento interactiva con tarjetas modulares de zoom macro, ingeniería y especificaciones.
                      </p>
                    </div>

                    {/* Colores y Acabados */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Variantes de Acabado y Colores
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          {colorVariants.length} acabados activos
                        </span>
                      </div>
                      <ColorVariantsManager colors={colorVariants} onChange={setColorVariants} />
                    </div>

                    {/* Tallas y Medidas */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] border border-zinc-200/90 dark:border-zinc-800/90 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                          Tallas o Medidas (Opcional)
                        </span>
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
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-xs",
                              hasSizes ? "left-5" : "left-1"
                            )}
                          />
                        </button>
                      </div>

                      {hasSizes ? (
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Tallas o Medidas Disponibles (Separadas por comas)
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
                          Producto de formato estándar único (sin selector de medidas).
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
              {/* Authentic macOS Sequoia Floating Overlay Scrollbar strictly inside content area */}
              <MacOSScrollbar containerRef={modalScrollRef} insetTop={10} insetBottom={10} insetRight={3} />
            </div>

            {/* 3. FOOTER INFERIOR FIJO: Botones de Acción Intuitivos */}
            <div className="px-3.5 sm:px-7 py-2.5 sm:py-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#12121a]/95 backdrop-blur-xl flex items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {!isFormComplete && (
                  <span className="text-[10px] text-amber-500 font-bold hidden sm:inline-block">
                    Completa los campos con * para guardar
                  </span>
                )}

                {activeTab !== 'esenciales' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'ficha') setActiveTab('presentacion');
                      else if (activeTab === 'presentacion') setActiveTab('fotos');
                      else if (activeTab === 'fotos') setActiveTab('esenciales');
                    }}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors cursor-pointer"
                  >
                    Siguiente
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !isFormComplete}
                  className={cn(
                    "px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2",
                    isFormComplete && !isSubmitting
                      ? "bg-blue-600 hover:bg-blue-500 active:scale-95 cursor-pointer"
                      : "bg-zinc-400 dark:bg-zinc-700 opacity-50 cursor-not-allowed"
                  )}
                  title={
                    !isFormComplete
                      ? "Completa todos los campos obligatorios (*) para poder guardar o publicar"
                      : undefined
                  }
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting 
                      ? "Guardando..." 
                      : mode === 'create' ? "Publicar" : "Guardar Cambios"}
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
