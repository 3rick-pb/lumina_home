"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import Image from "next/image";
import Link from "next/link";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  CreditCard, 
  Heart, 
  Package, 
  Layers, 
  LogOut, 
  Plus, 
  X, 
  Trash2, 
  AlertTriangle, 
  AlertCircle,
  Search, 
  Store, 
  CheckCircle2, 
  Settings, 
  Pencil,
  Loader2,
  Globe,
  BellRing,
  Server
} from "lucide-react";
import { IntegrationsTab } from "@/components/profile/tabs/IntegrationsTab";
import { useUserStore, Order, formatCleanName } from "@/lib/userStore";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
import { useCatalogStore, normalizeCategory, CatalogProduct, ProductCombo } from "@/lib/catalogStore";
import { normalizeSearchText } from "@/lib/utils";
import { ProductArchitectureSelector } from "@/components/profile/ProductArchitectureSelector";
import { ProductCombosManager } from "@/components/profile/ProductCombosManager";
import { AddCardAnimatedModal } from "@/components/profile/AddCardAnimatedModal";
import { OverviewTab } from "@/components/profile/tabs/OverviewTab";
import { OrdersTab } from "@/components/profile/tabs/OrdersTab";
import { CardsTab } from "@/components/profile/tabs/CardsTab";
import { FavoritesTab } from "@/components/profile/tabs/FavoritesTab";
import { CatalogTab } from "@/components/profile/tabs/CatalogTab";
import { NichesTab } from "@/components/profile/tabs/NichesTab";
import { AnalyticsTab } from "@/components/profile/tabs/AnalyticsTab";
import { CartAlertsTab } from "@/components/profile/tabs/CartAlertsTab";
import { SettingsTab } from "@/components/profile/tabs/SettingsTab";
import { OrderDetailModal } from "@/components/profile/modals/OrderDetailModal";
import { ExcelExportRadialMenu } from "@/components/profile/ExcelExportRadialMenu";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";
import { useAvatarSettingsStore } from "@/lib/avatarSettingsStore";



export default function ProfilePage() {
 const router = useRouter();
  const { 
    user, 
    isLoading,
    logout, 
    favorites,
    orders, 
    cards, 
    addCard, 
    updateOrderStatus
  } = useUserStore();

 const { products, categories, badges, addProduct, updateProduct, deleteProduct, deleteCategory } = useCatalogStore();
 const { backgroundShape, customSeed, loadSettingsFromDatabase } = useAvatarSettingsStore();

  useEffect(() => {
    if (user?.id) {
      loadSettingsFromDatabase(user.id);
    }
  }, [user?.id, loadSettingsFromDatabase]);

  const pendingOrdersCount = orders.filter((o) => o.status !== "Entregado").length;

  type ProfileTab = "overview" | "orders" | "cards" | "favorites" | "catalog" | "niches" | "analytics" | "cart_alerts" | "integrations" | "settings";
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const { mode } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setIsMounted(true);
    const update = () => setResolvedTheme(getResolvedTheme(mode));
    update();
    const interval = setInterval(update, 60000);

    try {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      const validTabs: ProfileTab[] = ["overview", "orders", "cards", "favorites", "catalog", "niches", "analytics", "cart_alerts", "integrations", "settings"];
      if (urlTab && validTabs.includes(urlTab as ProfileTab)) {
        setActiveTab(urlTab as ProfileTab);
      }
    } catch {}

    return () => clearInterval(interval);
  }, [mode]);

 const getGreeting = () => {
 const hour = new Date().getHours();
 if (hour >= 5 && hour < 12) return "Buenos días";
 if (hour >= 12 && hour < 19) return "Buenas tardes";
 return "Buenas noches";
 };

 // Selected Order for Details Modal
 const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

 // Filter for orders tab

 // Filter for catalog tab

  // Card Modal State
  const [showCardModal, setShowCardModal] = useState(false);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);

 // Admin New Product Modal State
 const [showProductModal, setShowProductModal] = useState(false);
 const [isSubmittingProd, setIsSubmittingProd] = useState(false);
 const [prodTitle, setProdTitle] = useState("");
 const [prodHighlight, setProdHighlight] = useState("");
 const [prodCategory, setProdCategory] = useState("");
 const [prodPrice, setProdPrice] = useState("");
 const [hasDiscount, setHasDiscount] = useState(false);
 const [oldPrice, setOldPrice] = useState("");
 const [calculatedDiscount, setCalculatedDiscount] = useState("");
 const [prodBadge, setProdBadge] = useState("");
 const [prodImageUrl, setProdImageUrl] = useState("");
 const [prodExtraImages, setProdExtraImages] = useState("");
 const [prodDescription, setProdDescription] = useState("");
 const [prodFeatures, setProdFeatures] = useState("");
 const [hasSizes, setHasSizes] = useState(false);
 const [prodSizes, setProdSizes] = useState("");
 const [hasColors, setHasColors] = useState(false);
 const [prodColors, setProdColors] = useState("");
 const [prodMaterials, setProdMaterials] = useState("");
 const [prodShipping, setProdShipping] = useState("");
 const [prodDimensions, setProdDimensions] = useState("");
 const [prodWarranty, setProdWarranty] = useState("");
 const [prodCareInstructions, setProdCareInstructions] = useState("");
 const [prodPackageContents, setProdPackageContents] = useState("");
 const [prodStock, setProdStock] = useState("20");
 const [prodLayoutType, setProdLayoutType] = useState<'standard' | 'landing'>('standard');
 const [prodCombos, setProdCombos] = useState<ProductCombo[]>([]);
 const [prodHowToUse, setProdHowToUse] = useState("");
 const [prodBundleMode, setProdBundleMode] = useState<'companion' | 'volume_tiers' | 'care_pass'>('companion');
 const [prodBundleCompanionIds, setProdBundleCompanionIds] = useState<string[]>([]);
 const [prodLandingSpecs, setProdLandingSpecs] = useState<Array<{ title: string; description: string; side?: 'left' | 'right'; pinX?: number; pinY?: number }>>([
    { title: "Chasis de Aluminio y Acabado Mate", description: "Estructura aeroespacial ultraligera anodizada resistente a corrosión.", side: "left", pinX: 28, pinY: 32 },
    { title: "Óptica Lumina Difusa 360°", description: "Difusor de vidrio opalino tratado térmicamente para dispersión uniforme.", side: "left", pinX: 30, pinY: 70 },
    { title: "Gestión Térmica Inteligente", description: "Disipación pasiva silenciosa que alarga la vida útil de los componentes.", side: "right", pinX: 72, pinY: 28 },
    { title: "Carga Ultra Rápida USB-C", description: "Protocolo universal con selector touch de 4 temperaturas de luz.", side: "right", pinX: 70, pinY: 68 },
  ]);
  const [prodLandingReviews, setProdLandingReviews] = useState<Array<{ author: string; role?: string; rating: number; comment: string }>>([
    { author: "Valentina M.", role: "Arquitecta de Interiores", rating: 5, comment: "La calidad de los acabados es insuperable. Transforma cualquier rincón." },
    { author: "Carlos E.", role: "Comprador Verificado", rating: 5, comment: "El empaque llegó blindado en 24 horas. Impresiona todavía más en persona." },
  ]);
  const [prodLandingBundleEnabled, setProdLandingBundleEnabled] = useState(true);
  const [prodLandingBundleDiscount, setProdLandingBundleDiscount] = useState("15");
 const [prodSubmitError, setProdSubmitError] = useState<string | null>(null);
 const [prodSubmitSuccess, setProdSubmitSuccess] = useState<string | null>(null);

 // Admin Edit Product Modal State
 const [showEditProductModal, setShowEditProductModal] = useState(false);
 const [editingProductId, setEditingProductId] = useState<string | null>(null);
 const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
 const [editTitle, setEditTitle] = useState("");
 const [editHighlight, setEditHighlight] = useState("");
 const [editCategory, setEditCategory] = useState("");
 const [editPrice, setEditPrice] = useState("");
 const [editHasDiscount, setEditHasDiscount] = useState(false);
 const [editOldPrice, setEditOldPrice] = useState("");
 const [editCalculatedDiscount, setEditCalculatedDiscount] = useState("");
 const [editBadge, setEditBadge] = useState("");
 const [editImageUrl, setEditImageUrl] = useState("");
 const [editExtraImages, setEditExtraImages] = useState("");
 const [editDescription, setEditDescription] = useState("");
 const [editFeatures, setEditFeatures] = useState("");
 const [editHasSizes, setEditHasSizes] = useState(false);
 const [editSizes, setEditSizes] = useState("");
 const [editHasColors, setEditHasColors] = useState(false);
 const [editColors, setEditColors] = useState("");
 const [editMaterials, setEditMaterials] = useState("");
 const [editShipping, setEditShipping] = useState("");
 const [editDimensions, setEditDimensions] = useState("");
 const [editWarranty, setEditWarranty] = useState("");
 const [editCareInstructions, setEditCareInstructions] = useState("");
 const [editPackageContents, setEditPackageContents] = useState("");
 const [editStock, setEditStock] = useState("20");
 const [editLayoutType, setEditLayoutType] = useState<'standard' | 'landing'>('standard');
 const [editCombos, setEditCombos] = useState<ProductCombo[]>([]);
 const [editHowToUse, setEditHowToUse] = useState("");
 const [editBundleMode, setEditBundleMode] = useState<'companion' | 'volume_tiers' | 'care_pass'>('companion');
 const [editBundleCompanionIds, setEditBundleCompanionIds] = useState<string[]>([]);
 const [editLandingSpecs, setEditLandingSpecs] = useState<Array<{ title: string; description: string; side?: 'left' | 'right'; pinX?: number; pinY?: number }>>([]);
 const [editLandingReviews, setEditLandingReviews] = useState<Array<{ author: string; role?: string; rating: number; comment: string }>>([]);
 const [editLandingBundleEnabled, setEditLandingBundleEnabled] = useState(true);
 const [editLandingBundleDiscount, setEditLandingBundleDiscount] = useState("15");
 const [editFeedback, setEditFeedback] = useState<{ msg: string; success: boolean } | null>(null);

  // Delete Product Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteProductError, setDeleteProductError] = useState<string | null>(null);

  // Niche / Category Delete Alert & Confirm States
  const [nicheBlockedModal, setNicheBlockedModal] = useState<{ category: string; count: number } | null>(null);
  const [nicheToDelete, setNicheToDelete] = useState<string | null>(null);
  const [isDeletingNiche, setIsDeletingNiche] = useState(false);

  // Category & Badge manager state



 // 5. Filtered Lists (accent/diacritic insensitive)
 const filteredOrders = useMemo(() => {
 const q = normalizeSearchText(searchQuery);
 return orders.filter(ord => {
 const matchQuery = !q || 
 normalizeSearchText(ord.id).includes(q) ||
 normalizeSearchText(ord.customerName || "").includes(q) ||
 normalizeSearchText(ord.customerEmail || "").includes(q) ||
 normalizeSearchText(ord.trackingNumber || "").includes(q);
    return matchQuery;
 });
  }, [orders, searchQuery]);

  const filteredCatalog = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return products.filter(p => {
      const matchQuery = !q || 
        normalizeSearchText(p.title).includes(q) || 
        normalizeSearchText(p.category).includes(q) ||
        (p.description && normalizeSearchText(p.description).includes(q));
      return matchQuery;
    });
  }, [products, searchQuery]);


 if (!isMounted || isLoading || !user) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
 <div className="flex flex-col items-center gap-3">
 <div className="w-10 h-10 border-4 border-[#8c9276] border-t-transparent rounded-full animate-spin" />
 <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cargando panel de usuario...</p>
 </div>
 </div>
 );
 }

  const isAdmin = user.role === "ADMIN";
  const isRootAdmin = Boolean(user.isRootAdmin || (user.email || '').toLowerCase().trim() === 'admin@lumina.com');

 // Auto calculate discount
 const handlePriceChange = (newP: string, newOldP: string, withDisc: boolean) => {
 setProdPrice(newP);
 setOldPrice(newOldP);
 if (withDisc && newP && newOldP) {
 const p = parseFloat(newP);
 const op = parseFloat(newOldP);
 if (op > p && op > 0) {
 const pct = Math.round(((op - p) / op) * 100);
 setCalculatedDiscount(`-${pct}%`);
 return;
 }
 }
 setCalculatedDiscount("");
 };

 // Add Product Submit
 const handleAddProductSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmittingProd(true);
 setProdSubmitError(null);
 setProdSubmitSuccess(null);

 const imagesList = [prodImageUrl.trim()];
 if (prodExtraImages.trim()) {
 imagesList.push(...prodExtraImages.split(",").map(u => u.trim()).filter(Boolean));
 }

 const res = await addProduct({
 title: prodTitle.trim(),
 titleHighlight: prodHighlight.trim() || undefined,
 category: prodCategory.trim(),
 price: parseFloat(prodPrice) || 0,
 oldPrice: hasDiscount && oldPrice ? parseFloat(oldPrice) : null,
discount: hasDiscount && calculatedDiscount ? calculatedDiscount : undefined,
 badge: prodBadge.trim() || undefined,
 imageUrl: prodImageUrl.trim() || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
 images: imagesList,
 description: prodDescription.trim(),
 features: prodFeatures.trim() ? prodFeatures.split("\n").map(f => f.trim()).filter(Boolean) : undefined,
 howToUse: prodHowToUse.trim() || undefined,
 combos: prodCombos.length > 0 ? prodCombos : undefined,
 sizes: hasSizes && prodSizes.trim() ? prodSizes.split(",").map(s => s.trim()).filter(Boolean) : undefined,
 colors: hasColors && prodColors.trim() ? prodColors.split(",").map(c => ({ name: c.trim(), hex: "#94a3b8" })) : undefined,
 materials: prodMaterials.trim() || undefined,
 shipping: prodShipping.trim() || undefined,
 dimensions: prodDimensions.trim() || undefined,
 warranty: prodWarranty.trim() || undefined,
 careInstructions: prodCareInstructions.trim() || undefined,
 packageContents: prodPackageContents.trim() || undefined,
 stock: prodStock ? parseInt(prodStock, 10) : 20,
 layoutType: prodLayoutType,
 landingSpecs: prodLayoutType === 'landing' ? prodLandingSpecs : undefined,
 landingReviews: prodLayoutType === 'landing' ? prodLandingReviews : undefined,
 landingBundle: prodLandingBundleEnabled ? {
    enabled: true,
    mode: prodBundleMode,
    companionProductIds: prodBundleCompanionIds.length > 0 ? prodBundleCompanionIds : undefined,
    discountPercentage: parseInt(prodLandingBundleDiscount, 10) || 15
  } : undefined,
 });

 setIsSubmittingProd(false);
 if (res.success) {
 setProdSubmitSuccess("¡Producto publicado exitosamente en la tienda y respaldado en la base de datos!");
 setTimeout(() => {
 setShowProductModal(false);
 setProdSubmitSuccess(null);
 setProdTitle("");
 setProdHighlight("");
 setProdCategory("");
 setProdPrice("");
 setHasDiscount(false);
 setOldPrice("");
 setCalculatedDiscount("");
 setProdBadge("");
 setProdImageUrl("");
 setProdExtraImages("");
 setProdDescription("");
 setProdFeatures("");
 setHasSizes(false);
 setProdSizes("");
 setHasColors(false);
 setProdColors("");
 setProdMaterials("");
 setProdShipping("");
 setProdDimensions("");
 setProdWarranty("");
 setProdCareInstructions("");
 setProdPackageContents("");
 setProdStock("20");
 setProdLayoutType("standard");
 setProdCombos([]);
 setProdHowToUse("");
 setProdBundleMode('companion');
 setProdBundleCompanionIds([]);
 }, 900);
 } else {
 setProdSubmitError(res.error || "No se pudo publicar el producto. Verifica tu conexión o base de datos.");
 }
 };

 // Edit Product Handlers
 const handleEditPriceChange = (newPrice: string, newOldPrice: string, withDiscount: boolean) => {
 setEditPrice(newPrice);
 setEditOldPrice(newOldPrice);
 if (withDiscount && newPrice && newOldPrice) {
 const p = parseFloat(newPrice);
 const op = parseFloat(newOldPrice);
 if (op > p && op > 0) {
 const pct = Math.round(((op - p) / op) * 100);
 setEditCalculatedDiscount(`-${pct}%`);
 return;
 }
 }
 setEditCalculatedDiscount("");
 };

 const handleOpenEditProduct = (p: CatalogProduct) => {
 setEditingProductId(p.id);
 setEditTitle(p.title || "");
 setEditHighlight(p.titleHighlight || "");
 setEditCategory(p.category || "");
 setEditPrice(p.price ? p.price.toString() : "");
 const withDiscount = Boolean(p.discount || (p.oldPrice && p.oldPrice > p.price));
 setEditHasDiscount(withDiscount);
 setEditOldPrice(p.oldPrice ? p.oldPrice.toString() : "");
 setEditCalculatedDiscount(p.discount || "");
 setEditBadge(p.badge || "");
 setEditImageUrl(p.imageUrl || "");
 setEditExtraImages(p.images && p.images.length > 1 ? p.images.slice(1).join(", ") : "");
 setEditDescription(p.description || "");
 setEditFeatures(p.features ? p.features.join("\n") : "");
 setEditHasSizes(Boolean(p.sizes && p.sizes.length > 0));
 setEditSizes(p.sizes ? p.sizes.join(", ") : "");
 setEditHasColors(Boolean(p.colors && p.colors.length > 0));
 setEditColors(p.colors ? p.colors.map(c => c.name).join(", ") : "");
 setEditMaterials(p.materials || "");
 setEditShipping(p.shipping || "");
 setEditDimensions(p.dimensions || "");
 setEditWarranty(p.warranty || "");
 setEditCareInstructions(p.careInstructions || "");
 setEditPackageContents(p.packageContents || "");
 setEditStock(p.stock !== undefined ? p.stock.toString() : "20");
 setEditLayoutType(p.layoutType || 'standard');
 setEditCombos(p.combos || []);
 setEditHowToUse(p.howToUse || "");
 setEditBundleMode(p.landingBundle?.mode || 'companion');
 setEditBundleCompanionIds(p.landingBundle?.companionProductIds || []);
 setEditLandingSpecs(p.landingSpecs || []);
 setEditLandingReviews(p.landingReviews || []);
 setEditLandingBundleEnabled(Boolean(p.landingBundle?.enabled));
 setEditLandingBundleDiscount(p.landingBundle?.discountPercentage ? p.landingBundle.discountPercentage.toString() : "15");
 setEditFeedback(null);
 setShowEditProductModal(true);
 };

 const handleUpdateProductSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!editingProductId) return;
 setIsSubmittingEdit(true);
 setEditFeedback(null);

 const imagesList = [editImageUrl.trim()];
 if (editExtraImages.trim()) {
 imagesList.push(...editExtraImages.split(",").map(u => u.trim()).filter(Boolean));
 }

 const res = await updateProduct(editingProductId, {
 id: editingProductId,
 title: editTitle.trim(),
 titleHighlight: editHighlight.trim() || undefined,
 category: editCategory.trim(),
 price: parseFloat(editPrice) || 0,
 oldPrice: editHasDiscount && editOldPrice ? parseFloat(editOldPrice) : null,
 discount: editHasDiscount && editCalculatedDiscount ? editCalculatedDiscount : undefined,
 badge: editBadge.trim() || undefined,
 imageUrl: editImageUrl.trim() || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
 images: imagesList,
 description: editDescription.trim(),
 features: editFeatures.trim() ? editFeatures.split("\n").map(f => f.trim()).filter(Boolean) : undefined,
 howToUse: editHowToUse.trim() || undefined,
 combos: editCombos.length > 0 ? editCombos : undefined,
 sizes: editHasSizes && editSizes.trim() ? editSizes.split(",").map(s => s.trim()).filter(Boolean) : undefined,
 colors: editHasColors && editColors.trim() ? editColors.split(",").map(c => ({ name: c.trim(), hex: "#94a3b8" })) : undefined,
 materials: editMaterials.trim() || undefined,
 shipping: editShipping.trim() || undefined,
 dimensions: editDimensions.trim() || undefined,
 warranty: editWarranty.trim() || undefined,
 careInstructions: editCareInstructions.trim() || undefined,
 packageContents: editPackageContents.trim() || undefined,
 stock: editStock ? parseInt(editStock, 10) : 20,
 layoutType: editLayoutType,
 landingSpecs: editLayoutType === 'landing' && editLandingSpecs.length > 0 ? editLandingSpecs : undefined,
 landingReviews: editLayoutType === 'landing' && editLandingReviews.length > 0 ? editLandingReviews : undefined,
 landingBundle: editLandingBundleEnabled ? {
    enabled: true,
    mode: editBundleMode,
    companionProductIds: editBundleCompanionIds.length > 0 ? editBundleCompanionIds : undefined,
    discountPercentage: parseInt(editLandingBundleDiscount, 10) || 15
  } : undefined,
 });

 setIsSubmittingEdit(false);
 if (res.success) {
    setEditFeedback({ msg: "¡Producto actualizado exitosamente!", success: true });
    setTimeout(() => {
      setShowEditProductModal(false);
      setEditFeedback(null);
    }, 700);
  } else {
    setEditFeedback({ msg: res.error || "Error al actualizar", success: false });
  }
};

// Delete Product Confirmation Handler
const handleConfirmDeleteProduct = async () => {
  if (!productToDelete) return;
  setIsDeletingProduct(true);
  setDeleteProductError(null);
  const res = await deleteProduct(productToDelete.id);
  setIsDeletingProduct(false);
  if (res.success) {
    setProductToDelete(null);
  } else {
    setDeleteProductError(res.error || "No se pudo eliminar el producto de la base de datos.");
  }
};

// Niche / Category Delete Handlers (with product count protection)
const handleRequestDeleteNiche = (catName: string) => {
  const norm = normalizeCategory(catName);
  const count = products.filter(p => normalizeCategory(p.category) === norm).length;
  if (count > 0) {
    setNicheBlockedModal({ category: catName, count });
  } else {
    setNicheToDelete(catName);
  }
};

const handleConfirmDeleteNiche = async () => {
  if (!nicheToDelete) return;
  setIsDeletingNiche(true);
  await deleteCategory(nicheToDelete);
  setIsDeletingNiche(false);
  setNicheToDelete(null);
};


 return (
 <div className={clsx(resolvedTheme === 'dark' ? 'dark' : '')}>
 <style>{`
 :where(.theme-transition), :where(.theme-transition *) {
 transition-property: background-color, border-color, color, fill, stroke;
 transition-duration: 1500ms;
 transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
 }
 /* Left Vertical Navigation Dock: Precisely 0.6s (600ms) transition */
 .sidebar-dock-nav,
 .sidebar-dock-nav *,
 .sidebar-dock-btn,
 .sidebar-dock-btn * {
 transition-property: all !important;
 transition-duration: 600ms !important;
 transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
 }
  /* Clean seamless scroll for order details modal (no native bar) */
  .lumina-order-modal-scroll {
    -ms-overflow-style: none !important;
    scrollbar-width: none !important;
  }
  .lumina-order-modal-scroll::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
 `}</style>
  <div className="theme-transition min-h-screen w-full max-w-full overflow-x-hidden bg-[#f3f4f6] dark:bg-[#202022] text-gray-900 dark:text-gray-100 flex flex-col md:flex-row p-2.5 sm:p-4 md:p-6 lg:p-8 selection:bg-[#8c9276]/20">
  
  {/* 1. Left Vertical Icon Sidebar (Desktop Dock) */}
  <aside className="hidden md:flex sidebar-dock-nav w-16 md:w-20 bg-white/95 dark:bg-[#1e1e20]/95 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex-col items-center py-6 gap-6 justify-between shrink-0 mr-4 md:mr-6 self-stretch relative z-30">
 
 {/* Brand Logo Symbol */}
 <div className="flex flex-col items-center gap-5 w-full">
 <Link 
   href="/" 
   className="sidebar-dock-btn group relative w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-[#8c9276] via-[#9ca383] to-[#ccff00]/70 flex items-center justify-center text-white dark:text-gray-950 shadow-md shadow-[#8c9276]/30 hover:scale-105 active:scale-95 transition-all duration-[600ms]" 
   title="Volver a la Tienda Lumina"
 >
   <span className="font-display font-bold text-xl italic group-hover:scale-110 transition-transform duration-[600ms]">L</span>
   <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#ccff00] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms]" />
 </Link>

 {/* Visible section divider */}
 <div className="w-9 md:w-10 h-[2px] bg-gray-300/80 dark:bg-white/20 rounded-full my-0.5 transition-colors shrink-0" />

 {/* Navigation Icons */}
 <nav className="flex flex-col items-center gap-2.5 w-full px-2">
 <button 
   onClick={() => setActiveTab("overview")} 
   className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
     activeTab === "overview" 
       ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
       : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
   }`}
   title="Vista General"
 >
   {activeTab === "overview" && (
     <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
   )}
   <LayoutDashboard className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
 </button>

 <button 
   onClick={() => setActiveTab("orders")} 
   className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
     activeTab === "orders" 
       ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
       : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
   }`}
   title="Pedidos & Historial"
 >
   {activeTab === "orders" && (
     <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
   )}
   <ShoppingBag className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
   {pendingOrdersCount > 0 && (
     <span 
       className={`absolute flex items-center justify-center select-none pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
         activeTab === "orders"
           ? "top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#8c9276] text-white dark:text-gray-950 text-[10px] font-extrabold ring-2 ring-gray-950 dark:ring-white shadow-sm scale-100"
           : "top-[9px] right-[8px] md:top-[10px] md:right-[9px] min-w-0 h-auto p-0 rounded-none bg-transparent text-[#8c9276] dark:text-[#a3a98d] text-xs font-black ring-0 shadow-none scale-105"
       }`}
       title={`${pendingOrdersCount} pedido(s) en curso`}
     >
       {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
     </span>
   )}
 </button>

 <button 
   onClick={() => setActiveTab("cards")} 
   className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
     activeTab === "cards" 
       ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
       : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
   }`}
   title="Mis Tarjetas"
 >
   {activeTab === "cards" && (
     <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
   )}
   <CreditCard className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
 </button>

 <button 
   onClick={() => setActiveTab("favorites")} 
   className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
     activeTab === "favorites" 
       ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
       : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
   }`}
   title="Favoritos Guardados"
 >
   {activeTab === "favorites" && (
     <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
   )}
   <Heart className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
   {favorites.length > 0 && activeTab !== "favorites" && (
     <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#1e1e20]" />
   )}
 </button>

 {isAdmin && (
   <>
     <div className="w-9 md:w-10 h-[2px] bg-gray-300/80 dark:bg-white/20 rounded-full my-0.5 transition-colors shrink-0" />

     <button 
       onClick={() => setActiveTab("catalog")} 
       className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
         activeTab === "catalog" 
           ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
           : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
       }`}
       title="Control de Catálogo"
     >
       {activeTab === "catalog" && (
         <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
       )}
       <Package className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
     </button>

     <button 
       onClick={() => setActiveTab("niches")} 
       className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
         activeTab === "niches" 
           ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
           : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
       }`}
       title="Gestión de Nichos"
     >
       {activeTab === "niches" && (
         <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
       )}
       <Layers className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
     </button>

     <button 
       onClick={() => setActiveTab("analytics")} 
       className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
         activeTab === "analytics" 
           ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
           : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
       }`}
       title="Radar de Clientes & Analítica"
     >
       {activeTab === "analytics" && (
         <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
       )}
       <Globe className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
     </button>

     <button 
       onClick={() => setActiveTab("cart_alerts")} 
       className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
         activeTab === "cart_alerts" 
           ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
           : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
       }`}
       title="Alertas de Carrito (Sileo)"
     >
       {activeTab === "cart_alerts" && (
         <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
       )}
       <BellRing className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
     </button>
        <button 
        onClick={() => setActiveTab("integrations")} 
        className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
          activeTab === "integrations" 
            ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
            : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
        }`}
        title="Servidor SMTP & Pasarelas (Vercel)"
      >
        {activeTab === "integrations" && (
          <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
        )}
        <Server className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
      </button>
   </>
 )}

 <div className="w-9 md:w-10 h-[2px] bg-gray-300/80 dark:bg-white/20 rounded-full my-0.5 transition-colors shrink-0" />

 <button 
   onClick={() => setActiveTab("settings")} 
   className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
     activeTab === "settings" 
       ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
       : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
   }`}
   title="Ajustes de Cuenta"
 >
   {activeTab === "settings" && (
     <span className="absolute -left-2 w-1 h-5 bg-[#8c9276] dark:bg-[#ccff00] rounded-r-full transition-all duration-[600ms]" />
   )}
   <Settings className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
 </button>
 </nav>
 </div>

 {/* Bottom Actions */}
 <div className="flex flex-col items-center gap-3 w-full px-2">
 <div className="w-9 md:w-10 h-[2px] bg-gray-300/80 dark:bg-white/20 rounded-full my-0.5 transition-colors shrink-0" />
 <Link 
   href="/" 
   className="sidebar-dock-btn relative w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-all duration-[600ms] group" 
   title="Volver a la Tienda"
 >
   <Store className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
 </Link>
 <button 
   onClick={() => { logout(); router.push("/auth/login"); }} 
   className="sidebar-dock-btn relative w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-[600ms] group cursor-pointer"
   title="Cerrar Sesión"
 >
   <LogOut className="w-5 h-5 transition-transform duration-[600ms] group-hover:scale-110" />
 </button>
 </div>
 </aside>

  {/* 2. Main Bento Canvas */}
  <main className={`flex-1 flex flex-col min-w-0 w-full space-y-6 pb-24 md:pb-6 ${activeTab === "cart_alerts" || activeTab === "analytics" ? "max-w-none" : "max-w-7xl mx-auto"}`}>
  
  {/* Top App Bar (Reference Style) */}
  <header className="relative z-40 bg-white/80 dark:bg-[#202022]/80 backdrop-blur-2xl p-4 md:px-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4">
  
  {/* Brand & Tabs */}
  <div className="flex items-center gap-3 md:gap-6 overflow-x-auto hide-scrollbar">
  <span className="font-display font-bold text-xl text-gray-900 dark:text-gray-100 tracking-tight shrink-0">
  Lumina<span className="text-[#8c9276]">.</span>
  </span>

 <div className="flex items-center bg-gray-100/80 dark:bg-[#3a3a3c]/80 p-1 rounded-2xl shrink-0">
 <button 
 onClick={() => setActiveTab("overview")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "overview" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Resumen
 </button>
 <button 
 onClick={() => setActiveTab("orders")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "orders" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Actividad ({orders.length})
 </button>
 <button 
 onClick={() => setActiveTab("cards")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "cards" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Tarjetas ({cards.length})
 </button>
 <button 
 onClick={() => setActiveTab("favorites")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "favorites" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Favoritos ({favorites.length})
 </button>
 {isAdmin && (
 <>
 <button 
 onClick={() => setActiveTab("catalog")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "catalog" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Inventario ({products.length})
 </button>
 <button 
 onClick={() => setActiveTab("niches")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "niches" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Nichos & Badges ({categories.length})
 </button>
 <button 
 onClick={() => setActiveTab("analytics")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "analytics" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Radar en Vivo
 </button>
 <button 
 onClick={() => setActiveTab("cart_alerts")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "cart_alerts" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Alertas de Carrito
 </button>
 <button 
 onClick={() => setActiveTab("integrations")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "integrations" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 SMTP & Pasarelas
 </button>
 </>
 )}
 <button 
 onClick={() => setActiveTab("settings")} 
 className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "settings" ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
 >
 Ajustes
 </button>
 </div>
 </div>

 {/* Right Search Input & Profile Badge */}
 <div className="flex items-center gap-3 shrink-0">
 <div className="relative z-50">
 <div className="hidden sm:flex items-center bg-gray-100 dark:bg-[#2a2a2c] px-3 py-1.5 rounded-2xl border border-gray-200/80 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 focus-within:ring-2 focus-within:ring-gray-400/30 dark:focus-within:ring-white/20 transition-all">
 <Search className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
 <input 
 type="text" 
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Buscar en panel..."
 className="bg-transparent border-none outline-none text-xs w-28 md:w-44 font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
  {searchQuery && (
    <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1 shrink-0">
      <X className="w-3 h-3" />
    </button>
  )}
  </div>

            {/* Floating Live Quick Search Results */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute -right-2 sm:right-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm bg-white/95 dark:bg-[#202022]/95 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10/80 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.22)] p-4 z-[100] space-y-3 animate-fade-in text-xs pointer-events-auto">
 <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-400 uppercase font-bold">
 <span>Resultados de búsqueda</span>
 <button onClick={() => setSearchQuery("")} className="hover:text-gray-700 dark:hover:text-gray-300 font-medium text-xs normal-case">Cerrar</button>
 </div>
 
 {/* Matching Orders */}
 {filteredOrders.length > 0 && (
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pedidos ({filteredOrders.length})</p>
 {filteredOrders.slice(0, 2).map(ord => (
 <div 
 key={ord.id} 
 onClick={() => { setActiveTab("orders"); setSelectedOrder(ord); setSearchQuery(""); }}
 className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3a3a3c] cursor-pointer flex items-center justify-between transition-colors"
 >
 <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{ord.id}</span>
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#3a3a3c] text-gray-600 dark:text-gray-400 font-semibold">{ord.status}</span>
 </div>
 ))}
 </div>
 )}

 {/* Matching Catalog */}
 {filteredCatalog.length > 0 && (
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Catálogo ({filteredCatalog.length})</p>
 {filteredCatalog.slice(0, 3).map(prod => (
 <div 
 key={prod.id} 
 onClick={() => { setActiveTab(isAdmin ? "catalog" : "favorites"); setSearchQuery(""); }}
 className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3a3a3c] cursor-pointer flex items-center justify-between transition-colors"
 >
 <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[150px]">{prod.title}</span>
 <span className="font-bold text-gray-900 dark:text-gray-100">${Number(prod.price || 0).toFixed(2)}</span>
 </div>
 ))}
 </div>
 )}

 {filteredOrders.length === 0 && filteredCatalog.length === 0 && (
 <div className="py-3 text-center text-gray-400">
 Sin coincidencias para &quot;{searchQuery}&quot;
 </div>
 )}
 </div>
 )}
 </div>

 <Link href="/" className="hidden sm:flex text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors">
 Ver Tienda &rarr;
 </Link>

 <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-white/10">
 <BlobatarAvatar
   name={customSeed || user.id || user.email || user.name}
   size={42}
   animate="always"
   background={backgroundShape || "squircle"}
   role={user.role}
   showGlow
   title={`Avatar de ${formatCleanName(user.name)}`}
 />
 <div className="hidden md:block text-left">
 <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-normal">{formatCleanName(user.name)}</p>
 <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${isAdmin ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
 {isAdmin ? "ADMINISTRADOR" : "CLIENTE"}
 </span>
 </div>
 <button 
   onClick={() => { logout(); router.push("/auth/login"); }}
   className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 transition-colors shrink-0 cursor-pointer"
   title="Cerrar Sesión"
   aria-label="Cerrar Sesión"
 >
   <LogOut className="w-3.5 h-3.5" />
   <span className="text-[11px] font-semibold">Salir</span>
 </button>
 </div>
 </div>
 </header>

 {/* Greeting Banner */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-normal">
 {getGreeting()}, <span className="italic font-normal tracking-wide ml-1.5 inline-block">{formatCleanName(user.name)}</span>
 </h1>
 <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
 {isAdmin 
 ? "Panel de control maestro de catálogo, inventario, radar de clientes y analítica de Lumina Home." 
 : "Supervisa tus pedidos, métodos de pago vinculados y artículos guardados."}
 </p>
 </div>
 {isAdmin && (
 <div className="self-end sm:self-auto flex items-center gap-3">
 <ExcelExportRadialMenu />
 <button 
 onClick={() => setShowProductModal(true)}
 className="h-11 flex items-center gap-2 px-5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none shadow-gray-900/10 cursor-pointer shrink-0"
 >
 <Plus className="w-4 h-4" /> Nuevo Producto
 </button>
 </div>
 )}
 </div>

 {/* ========================================================================= */}
 {/* VIEW 1: OVERVIEW (MASTER BENTO GRID) */}
 {/* ========================================================================= */}
        {activeTab === "overview" && (
          <OverviewTab
            isAdmin={isAdmin}
            setActiveTab={setActiveTab}
            setSelectedOrder={setSelectedOrder}
            setShowCardModal={setShowCardModal}
            onRequestDeleteNiche={handleRequestDeleteNiche}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ORDERS & ACTIVITIES TAB */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <OrdersTab
            isAdmin={isAdmin}
            searchQuery={searchQuery}
            setSelectedOrder={setSelectedOrder}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: CARDS & WALLET TAB */}
        {/* ========================================================================= */}
        {activeTab === "cards" && (
          <CardsTab
            setShowCardModal={setShowCardModal}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: FAVORITES TAB */}
        {/* ========================================================================= */}
        {activeTab === "favorites" && (
          <FavoritesTab />
        )}

 {/* ========================================================================= */}
 {/* VIEW 5: ADMIN CATALOG & INVENTORY TAB */}
 {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* VIEW 5: ADMIN CATALOG & INVENTORY TAB */}
        {/* ========================================================================= */}
        {activeTab === "catalog" && isAdmin && (
          <CatalogTab
            searchQuery={searchQuery}
            onOpenCreateProduct={() => setShowProductModal(true)}
            onOpenEditProduct={handleOpenEditProduct}
            onDeleteProduct={(p) => {
              setDeleteProductError(null);
              setProductToDelete(p);
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: ADMIN NICHES TAB */}
        {/* ========================================================================= */}
        {activeTab === "niches" && isAdmin && (
          <NichesTab
            onRequestDeleteNiche={handleRequestDeleteNiche}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: ANALYTICS RADAR TAB */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && isAdmin && (
          <AnalyticsTab
            onNavigateToAddresses={() => {
              setActiveTab("settings");
              setShowAddressForm(true);
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 8: ADMIN CART ALERTS TAB (SILEO PLAYGROUND) */}
        {/* ========================================================================= */}
        {activeTab === "cart_alerts" && isAdmin && (
          <CartAlertsTab />
        )}

        {/* ========================================================================= */}
        {/* VIEW 8B: ADMIN INTEGRATIONS & VERCEL SMTP TAB */}
        {/* ========================================================================= */}
        {activeTab === "integrations" && isAdmin && (
          <IntegrationsTab />
        )}

        {/* ========================================================================= */}
        {/* VIEW 9: SETTINGS & ADDRESS TAB */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <SettingsTab
            isAdmin={isAdmin}
            isRootAdmin={isRootAdmin}
            showAddressForm={showAddressForm}
            setShowAddressForm={setShowAddressForm}
          />
        )}

 </main>

 {/* ========================================================================= */}
 {/* MODAL: DETALLE DEL PEDIDO */}
 {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL: DETALLE DEL PEDIDO */}
      {/* ========================================================================= */}
      <OrderDetailModal
        order={selectedOrder}
        isAdmin={isAdmin}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={(orderId, nextSt) => {
          updateOrderStatus(orderId, nextSt);
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: nextSt });
          }
        }}
      />

 {/* ========================================================================= */}
 {/* MODAL: AGREGAR TARJETA CON 3D LIVE PREVIEW & ANIMACIÓN BANCARIA           */}
 {/* ========================================================================= */}
 <AddCardAnimatedModal
    isOpen={showCardModal}
    onClose={() => setShowCardModal(false)}
    defaultHolder={user?.name || ''}
    onSaveCard={async (cardData) => {
      await addCard({
        number: `•••• •••• ${cardData.number.replace(/\s+/g, "").slice(-4) || "8888"}`,
        holder: cardData.holder,
        exp: cardData.exp,
        type: cardData.type,
        isDefault: cards.length === 0,
      });
    }}
  />

 {/* ========================================================================= */}
 {/* MODAL: ADMIN NUEVO PRODUCTO */}
 {/* ========================================================================= */}
 {showProductModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
 <div className="bg-white dark:bg-[#202022] rounded-3xl w-full max-w-3xl shadow-2xl dark:shadow-none overflow-hidden flex flex-col max-h-[90vh]">
 <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-[#2a2a2c]/50">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Publicar Nuevo Producto</h2>
 <p className="text-xs text-gray-500 dark:text-gray-400">Se adaptará automáticamente a la estética Lumina y se sincronizará en Supabase.</p>
 </div>
 <button onClick={() => setShowProductModal(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-white dark:bg-[#202022] rounded-full shadow-sm dark:shadow-none">
 <X className="w-5 h-5" />
 </button>
 </div>

 {prodSubmitError && (
 <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 font-medium">
 <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
 <span>{prodSubmitError}</span>
 </div>
 )}

 {prodSubmitSuccess && (
 <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700 font-medium">
 <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
 <span>{prodSubmitSuccess}</span>
 </div>
 )}

 <form onSubmit={handleAddProductSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
 <ProductArchitectureSelector
    layoutType={prodLayoutType}
    onLayoutTypeChange={setProdLayoutType}
    productImage={prodImageUrl || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop"}
    allProducts={products}
    bundleEnabled={prodLandingBundleEnabled}
    onBundleEnabledChange={setProdLandingBundleEnabled}
    bundleMode={prodBundleMode}
    onBundleModeChange={setProdBundleMode}
    bundleDiscount={prodLandingBundleDiscount}
    onBundleDiscountChange={setProdLandingBundleDiscount}
    bundleCompanionIds={prodBundleCompanionIds}
    onBundleCompanionIdsChange={setProdBundleCompanionIds}
    landingSpecs={prodLandingSpecs}
    onLandingSpecsChange={setProdLandingSpecs}
    landingReviews={prodLandingReviews}
    onLandingReviewsChange={setProdLandingReviews}
    howToUse={prodHowToUse}
    onHowToUseChange={setProdHowToUse}
  />

 <ProductCombosManager
    combos={prodCombos}
    onChange={setProdCombos}
    allProducts={products}
    currentProductPrice={parseFloat(prodPrice) || 0}
  />

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Nombre Principal *</label>
 <input required type="text" value={prodTitle} onChange={e => setProdTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Ej: Lámpara de Mesa" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Subtítulo Itálica</label>
 <input type="text" value={prodHighlight} onChange={e => setProdHighlight(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Ej: Nova LED, Artesanal" />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Nicho / Categoría *</label>
 <button 
 type="button" 
 onClick={() => { setShowProductModal(false); setActiveTab("niches"); }}
 className="text-[10px] font-semibold text-[#8c9276] hover:underline cursor-pointer"
 title="Ir a gestionar nichos y categorías"
 >
 + Gestionar nichos y categorías
 </button>
 </div>
 <select required value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#202022]">
 <option value="">Selecciona un nicho</option>
 {categories.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Badge de Marketing</label>
 <button 
 type="button" 
 onClick={() => { setShowProductModal(false); setActiveTab("niches"); }}
 className="text-[10px] font-semibold text-[#8c9276] hover:underline cursor-pointer"
 >
 + Gestionar badges
 </button>
 </div>
 <select value={prodBadge} onChange={e => setProdBadge(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#202022]">
 <option value="">Sin badge</option>
 {badges.map(b => (
 <option key={b} value={b}>{b}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Precios y Descuento */}
 <div className="p-4 bg-gray-50/70 dark:bg-[#2a2a2c]/70 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Precios y Rebajas</span>
 <div className="flex items-center gap-2">
 <span className="text-xs text-gray-500 dark:text-gray-400">¿Tiene descuento?</span>
 <button 
 type="button" 
 onClick={() => {
 const next = !hasDiscount;
 setHasDiscount(next);
 handlePriceChange(prodPrice, oldPrice, next);
 }}
 className={`w-10 h-5 rounded-full relative transition-colors ${hasDiscount ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-300"}`}
 >
 <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#202022] transition-all ${hasDiscount ? "left-5" : "left-1"}`} />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{hasDiscount ? "Precio con Descuento ($) *" : "Precio Regular ($) *"}</label>
 <input required type="number" step="0.01" value={prodPrice} onChange={e => handlePriceChange(e.target.value, oldPrice, hasDiscount)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="89.90" />
 </div>
 {hasDiscount && (
 <>
 <div>
 <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Precio Original Antes ($)</label>
 <input type="number" step="0.01" value={oldPrice} onChange={e => handlePriceChange(prodPrice, e.target.value, hasDiscount)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="119.90" />
 </div>
 <div>
 <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">% Descuento Calculado</label>
 <input type="text" readOnly value={calculatedDiscount} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:] font-bold outline-none dark:] dark: bg-gray-100 dark:bg-[#3a3a3c] text-gray-600 dark:text-gray-400" placeholder="-25%" />
 </div>
 </>
 )}
 </div>
 </div>

 {/* Sección de Imágenes con Vista Previa y Guía */}
 <div className="p-4 bg-gray-50/80 dark:bg-[#2a2a2c]/80 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3">
 <div className="flex items-center justify-between">
 <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Fotografías del Producto</label>
 <span className="text-[11px] text-[#8c9276] font-semibold">Vista previa en vivo</span>
 </div>

 {/* Explicación amigable */}
 <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
 <p className="font-bold mb-1">💡 ¿Cómo obtener el enlace correcto de la imagen?</p>
 <p className="text-[11px] text-blue-800">
 No pegues el enlace de la página web de la tienda o artículo. Abre la foto en tu navegador, haz <strong>clic derecho sobre la imagen</strong> y selecciona <strong>&ldquo;Copiar dirección de imagen&rdquo;</strong> (el enlace debe ser directo al archivo .jpg, .png, .webp o de Unsplash/Imgur/CDN).
 </p>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">URL de Imagen Principal *</label>
 <input 
 required 
 type="text" 
 value={prodImageUrl} 
 onChange={e => setProdImageUrl(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="https://images.unsplash.com/photo-... o enlace directo .jpg / .webp" 
 />
 {/* Alerta si parece una página web */}
 {prodImageUrl.trim() && (prodImageUrl.includes('.html') || (!prodImageUrl.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i) && !prodImageUrl.includes('unsplash') && !prodImageUrl.includes('mlstatic') && !prodImageUrl.includes('cloudinary') && !prodImageUrl.includes('imgur'))) && (
 <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
 ⚠️ Atención: Parece que pegaste el enlace de una página web y no de la imagen directa. Asegúrate de hacer clic derecho sobre la foto &gt; &ldquo;Copiar dirección de imagen&rdquo;.
 </p>
 )}
 </div>

 {/* Vista previa de Imagen Principal */}
 {prodImageUrl.trim() && (
 <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#202022] rounded-xl border border-gray-200/80 dark:border-white/10/80">
 <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#3a3a3c] shrink-0 border border-gray-200 dark:border-white/10">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img 
 src={prodImageUrl.trim().split(/[\n,]+/)[0]} 
 alt="Vista previa" 
 className="w-full h-full object-cover" 
 onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop"; }}
 />
 </div>
 <div className="min-w-0 flex-1 text-xs">
 <p className="font-semibold text-gray-800 dark:text-gray-200">Vista previa de imagen principal</p>
 <p className="text-[11px] text-gray-400 truncate">{prodImageUrl.trim().split(/[\n,]+/)[0]}</p>
 </div>
 </div>
 )}

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Galería de Imágenes Adicionales (Opcional)</label>
 <input 
 type="text" 
 value={prodExtraImages} 
 onChange={e => setProdExtraImages(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Separa varios enlaces con comas: https://foto2.jpg, https://foto3.webp" 
 />
 <p className="text-[11px] text-gray-400 mt-1">Permite a los clientes ver el producto desde varios ángulos.</p>
 </div>

 {/* Miniaturas de galería adicional */}
 {prodExtraImages.trim() && (
 <div className="space-y-1.5 pt-1">
 <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Galería adicional detectada:</p>
 <div className="flex gap-2 flex-wrap">
 {prodExtraImages.split(/[\n,]+/).map(u => u.trim()).filter(u => u.startsWith('http')).map((url, idx) => (
 <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#3a3a3c] border border-gray-200 dark:border-white/10 shrink-0">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img 
 src={url} 
 alt={`Galería ${idx}`} 
 className="w-full h-full object-cover" 
 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
 />
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Descripción Completa *</label>
 <textarea required rows={3} value={prodDescription} onChange={e => setProdDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none resize-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Describe los detalles de este producto..." />
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Características / Viñetas (una por línea)</label>
 <textarea rows={3} value={prodFeatures} onChange={e => setProdFeatures(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none resize-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Material: Cerámica artesanal&#10;Acabado mate texturizado&#10;Garantía de 2 años" />
 </div>

 {/* Sección: Ficha Técnica y Fabricación */}
 <div className="p-4 bg-stone-50/60 rounded-2xl border border-stone-200/70 space-y-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Ficha Técnica y Fabricación</span>
 <span className="text-[10px] text-stone-500 font-medium">(Se muestra en pestañas &ldquo;Materiales&rdquo; y &ldquo;Dimensiones&rdquo;)</span>
 </div>
 
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Materiales y Acabados Nobles</label>
 <input 
 type="text" 
 value={prodMaterials} 
 onChange={e => setProdMaterials(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Cerámica gres cocida a 1250°C, herrajes de latón macizo y esmalte satinado libre de tóxicos." 
 />
 <p className="text-[11px] text-gray-400 mt-1">El cliente sabrá exactamente de qué está hecha la pieza.</p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Dimensiones y Peso</label>
 <input 
 type="text" 
 value={prodDimensions} 
 onChange={e => setProdDimensions(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: 45 x 28 x 20 cm · Peso neto: 1.8 kg" 
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Stock / Unidades en Inventario</label>
 <input 
 type="number" 
 min="0"
 value={prodStock} 
 onChange={e => setProdStock(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="20" 
 />
 </div>
 </div>
 </div>

 {/* Sección: Logística, Garantía y Postventa */}
 <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Logística, Garantía y Confianza</span>
 <span className="text-[10px] text-blue-700 font-medium">(Se muestra en pestañas &ldquo;Envíos&rdquo; y &ldquo;Cuidados&rdquo;)</span>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Tiempos y Condiciones de Envío</label>
 <input 
 type="text" 
 value={prodShipping} 
 onChange={e => setProdShipping(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Entrega estándar en 24-48h. Embalaje reforzado anti-golpes. Devolución gratuita en 30 días." 
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Garantía Oficial</label>
 <input 
 type="text" 
 value={prodWarranty} 
 onChange={e => setProdWarranty(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: 2 años de garantía de fábrica" 
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">¿Qué incluye la caja?</label>
 <input 
 type="text" 
 value={prodPackageContents} 
 onChange={e => setProdPackageContents(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: 1x Producto, 1x Cable USB-C, 1x Manual ilustrado" 
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Instrucciones de Cuidado y Limpieza</label>
 <input 
 type="text" 
 value={prodCareInstructions} 
 onChange={e => setProdCareInstructions(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Limpiar con paño de microfibra seco. No usar productos abrasivos ni alcohol." 
 />
 </div>
 </div>

 <div className="pt-4 flex justify-end gap-3">
 <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] rounded-xl">Cancelar</button>
 <button type="submit" disabled={isSubmittingProd} className="px-6 py-2.5 text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl shadow-md dark:shadow-none hover:bg-gray-800 disabled:opacity-50">
 {isSubmittingProd ? "Guardando..." : "Publicar en Tienda"}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* MODAL: ADMIN EDITAR PRODUCTO */}
 {/* ========================================================================= */}
 {showEditProductModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
 <div className="bg-white dark:bg-[#202022] rounded-3xl w-full max-w-3xl shadow-2xl dark:shadow-none overflow-hidden flex flex-col max-h-[90vh]">
 <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/70 dark:bg-[#2a2a2c]/70">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm dark:shadow-none">
 <Pencil className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar Producto</h2>
 <p className="text-xs text-gray-500 dark:text-gray-400">Modifica los detalles sin perder trazabilidad. Los cambios se sincronizan en Supabase.</p>
 </div>
 </div>
 <button 
 onClick={() => setShowEditProductModal(false)} 
 className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-white dark:bg-[#202022] rounded-full shadow-sm dark:shadow-none"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleUpdateProductSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
 {editFeedback && (
 <div className={`p-3.5 rounded-xl text-xs font-semibold ${editFeedback.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
 {editFeedback.msg}
 </div>
 )}

 <ProductArchitectureSelector
    layoutType={editLayoutType}
    onLayoutTypeChange={setEditLayoutType}
    productImage={editImageUrl || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop"}
    allProducts={products}
    bundleEnabled={editLandingBundleEnabled}
    onBundleEnabledChange={setEditLandingBundleEnabled}
    bundleMode={editBundleMode}
    onBundleModeChange={setEditBundleMode}
    bundleDiscount={editLandingBundleDiscount}
    onBundleDiscountChange={setEditLandingBundleDiscount}
    bundleCompanionIds={editBundleCompanionIds}
    onBundleCompanionIdsChange={setEditBundleCompanionIds}
    landingSpecs={editLandingSpecs}
    onLandingSpecsChange={setEditLandingSpecs}
    landingReviews={editLandingReviews}
    onLandingReviewsChange={setEditLandingReviews}
    howToUse={editHowToUse}
    onHowToUseChange={setEditHowToUse}
  />

 <ProductCombosManager
    combos={editCombos}
    onChange={setEditCombos}
    allProducts={products}
    currentProductPrice={parseFloat(editPrice) || 0}
  />

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Nombre Principal *</label>
 <input 
 required 
 type="text" 
 value={editTitle} 
 onChange={e => setEditTitle(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Lámpara de Mesa" 
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Subtítulo Itálica</label>
 <input 
 type="text" 
 value={editHighlight} 
 onChange={e => setEditHighlight(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Nova LED, Artesanal" 
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Nicho / Categoría *</label>
 <button 
 type="button" 
 onClick={() => { setShowEditProductModal(false); setActiveTab("niches"); }}
 className="text-[10px] font-semibold text-[#8c9276] hover:underline cursor-pointer"
 title="Ir a gestionar nichos y categorías"
 >
 + Gestionar nichos y categorías
 </button>
 </div>
 <select 
 required 
 value={editCategory} 
 onChange={e => setEditCategory(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#202022]"
 >
 <option value="">Selecciona un nicho</option>
 {categories.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Badge de Marketing</label>
 <select 
 value={editBadge} 
 onChange={e => setEditBadge(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#202022]"
 >
 <option value="">Sin badge</option>
 {badges.map(b => (
 <option key={b} value={b}>{b}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Precios y Descuento */}
 <div className="p-4 bg-gray-50/70 dark:bg-[#2a2a2c]/70 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Precios y Rebajas</span>
 <div className="flex items-center gap-2">
 <span className="text-xs text-gray-500 dark:text-gray-400">¿Tiene descuento?</span>
 <button 
 type="button" 
 onClick={() => {
 const next = !editHasDiscount;
 setEditHasDiscount(next);
 handleEditPriceChange(editPrice, editOldPrice, next);
 }}
 className={`w-10 h-5 rounded-full relative transition-colors ${editHasDiscount ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-300"}`}
 >
 <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#202022] transition-all ${editHasDiscount ? "left-5" : "left-1"}`} />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{editHasDiscount ? "Precio con Descuento ($) *" : "Precio Regular ($) *"}</label>
 <input 
 required 
 type="number" 
 step="0.01" 
 value={editPrice} 
 onChange={e => handleEditPriceChange(e.target.value, editOldPrice, editHasDiscount)} 
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="89.90" 
 />
 </div>
 {editHasDiscount && (
 <>
 <div>
 <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Precio Original Antes ($)</label>
 <input 
 type="number" 
 step="0.01" 
 value={editOldPrice} 
 onChange={e => handleEditPriceChange(editPrice, e.target.value, editHasDiscount)} 
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="119.90" 
 />
 </div>
 <div>
 <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">% Descuento Calculado</label>
 <input 
 type="text" 
 readOnly 
 value={editCalculatedDiscount} 
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:] font-bold outline-none dark:] dark: bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="-25%" 
 />
 </div>
 </>
 )}
 </div>
 </div>

 {/* Imagen y Vista Previa */}
 <div className="p-4 bg-gray-50/80 dark:bg-[#2a2a2c]/80 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3">
 <div className="flex items-center justify-between">
 <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Fotografías del Producto</label>
 <span className="text-[11px] text-[#8c9276] font-semibold">Vista previa en vivo</span>
 </div>

 <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
 <p className="font-bold mb-1">💡 Enlace directo a la foto</p>
 <p className="text-[11px] text-blue-800">
 Asegúrate de copiar el enlace directo del archivo de la foto (clic derecho sobre la imagen &gt; &ldquo;Copiar dirección de imagen&rdquo;), no el link de la página web.
 </p>
 </div>

 <div className="flex gap-4 items-start">
 {editImageUrl && (
 <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#3a3a3c] border border-gray-200 dark:border-white/10 shrink-0">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img 
 src={editImageUrl.trim().split(/[\n,]+/)[0]} 
 alt="Preview" 
 className="w-full h-full object-cover" 
 onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop"; }}
 />
 </div>
 )}
 <div className="flex-1">
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">URL de Imagen Principal *</label>
 <input 
 required 
 type="text" 
 value={editImageUrl} 
 onChange={e => setEditImageUrl(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="https://images.unsplash.com/photo-... o .jpg / .webp" 
 />
 {editImageUrl.trim() && (editImageUrl.includes('.html') || (!editImageUrl.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i) && !editImageUrl.includes('unsplash') && !editImageUrl.includes('mlstatic') && !editImageUrl.includes('cloudinary') && !editImageUrl.includes('imgur'))) && (
 <p className="text-[11px] text-amber-700 mt-1.5 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
 ⚠️ Atención: Asegúrate de que este enlace apunte al archivo directo de la foto (clic derecho &gt; &ldquo;Copiar dirección de imagen&rdquo;).
 </p>
 )}
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Galería de Imágenes Adicionales (separadas por coma)</label>
 <input 
 type="text" 
 value={editExtraImages} 
 onChange={e => setEditExtraImages(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="https://foto2.jpg , https://foto3.webp" 
 />
 </div>

 {/* Miniaturas de galería adicional */}
 {editExtraImages.trim() && (
 <div className="space-y-1.5 pt-1">
 <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Galería adicional:</p>
 <div className="flex gap-2 flex-wrap">
 {editExtraImages.split(/[\n,]+/).map(u => u.trim()).filter(u => u.startsWith('http')).map((url, idx) => (
 <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#3a3a3c] border border-gray-200 dark:border-white/10 shrink-0">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img 
 src={url} 
 alt={`Galería ${idx}`} 
 className="w-full h-full object-cover" 
 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
 />
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Descripción Completa *</label>
 <textarea 
 required 
 rows={3} 
 value={editDescription} 
 onChange={e => setEditDescription(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none resize-none" 
 placeholder="Describe los detalles de este producto..." 
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Características / Viñetas (una por línea)</label>
 <textarea 
 rows={3} 
 value={editFeatures} 
 onChange={e => setEditFeatures(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none resize-none" 
 placeholder="Material: Cerámica artesanal&#10;Acabado mate texturizado" 
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Tallas / Tamaños (separados por coma)</label>
 <input 
 type="text" 
 value={editSizes} 
 onChange={e => { setEditSizes(e.target.value); setEditHasSizes(!!e.target.value.trim()); }} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Individual, Queen, King" 
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Colores (nombres separados por coma)</label>
 <input 
 type="text" 
 value={editColors} 
 onChange={e => { setEditColors(e.target.value); setEditHasColors(!!e.target.value.trim()); }} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Nogal, Roble, Blanco" 
 />
 </div>
 </div>

 {/* Sección: Ficha Técnica y Fabricación */}
 <div className="p-4 bg-stone-50/60 rounded-2xl border border-stone-200/70 space-y-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Ficha Técnica y Fabricación</span>
 <span className="text-[10px] text-stone-500 font-medium">(Pestañas &ldquo;Materiales&rdquo; y &ldquo;Dimensiones&rdquo;)</span>
 </div>
 
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Materiales y Acabados Nobles</label>
 <input 
 type="text" 
 value={editMaterials} 
 onChange={e => setEditMaterials(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Cerámica gres cocida a 1250°C, herrajes de latón macizo y esmalte satinado." 
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Dimensiones y Peso</label>
 <input 
 type="text" 
 value={editDimensions} 
 onChange={e => setEditDimensions(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: 45 x 28 x 20 cm · Peso neto: 1.8 kg" 
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Stock / Unidades en Inventario</label>
 <input 
 type="number" 
 min="0"
 value={editStock} 
 onChange={e => setEditStock(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="20" 
 />
 </div>
 </div>
 </div>

 {/* Sección: Logística, Garantía y Postventa */}
 <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Logística, Garantía y Confianza</span>
 <span className="text-[10px] text-blue-700 font-medium">(Pestañas &ldquo;Envíos&rdquo; y &ldquo;Cuidados&rdquo;)</span>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Tiempos y Condiciones de Envío</label>
 <input 
 type="text" 
 value={editShipping} 
 onChange={e => setEditShipping(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Entrega estándar en 24-48h. Embalaje reforzado anti-golpes. Devolución gratuita en 30 días." 
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Garantía Oficial</label>
 <input 
 type="text" 
 value={editWarranty} 
 onChange={e => setEditWarranty(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: 2 años de garantía de fábrica" 
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">¿Qué incluye la caja?</label>
 <input 
 type="text" 
 value={editPackageContents} 
 onChange={e => setEditPackageContents(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: 1x Producto, 1x Cable USB-C, 1x Manual ilustrado" 
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Instrucciones de Cuidado y Limpieza</label>
 <input 
 type="text" 
 value={editCareInstructions} 
 onChange={e => setEditCareInstructions(e.target.value)} 
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm outline-none dark:] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" 
 placeholder="Ej: Limpiar con paño de microfibra seco. No usar productos abrasivos ni alcohol." 
 />
 </div>
 </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-white/5">
              <button 
                type="button" 
                onClick={() => setShowEditProductModal(false)} 
                className="px-5 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] rounded-xl"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmittingEdit} 
                className="px-6 py-2.5 text-xs font-semibold bg-blue-600 text-white dark:text-gray-900 rounded-xl shadow-md dark:shadow-none hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                {isSubmittingEdit ? "Actualizando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* MODAL: Confirmar Eliminación de Producto */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a1c] border border-gray-100 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header with Icon */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ¿Eliminar este producto?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Esta acción es irreversible y retirará el producto del catálogo y de la tienda permanentemente.
                </p>
              </div>
            </div>

            {/* Product Snapshot */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202022] border border-gray-100 dark:border-white/5 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 relative">
                {productToDelete.images && productToDelete.images.length > 0 ? (
                  <Image 
                    src={productToDelete.images[0]} 
                    alt={productToDelete.title} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                  {productToDelete.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                    {productToDelete.category}
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    ${Number(productToDelete.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error if database delete failed */}
            {deleteProductError && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  Aviso de Base de Datos
                </p>
                <p className="leading-relaxed">{deleteProductError}</p>
                <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1">
                  Si la política RLS de Supabase lo bloquea, asegúrate de ejecutar las directivas de eliminación en Supabase SQL Editor.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setProductToDelete(null);
                  setDeleteProductError(null);
                }}
                disabled={isDeletingProduct}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, eliminar producto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Alerta Nicho Bloqueado por Tener Productos */}
      {nicheBlockedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a1c] border border-gray-100 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Warning Shield Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  No se puede eliminar el nicho
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Protección de integridad de catálogo
                </p>
              </div>
            </div>

            {/* Explanatory Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-xs text-amber-950 dark:text-amber-200 space-y-2 leading-relaxed">
              <p>
                El nicho <span className="font-bold underline decoration-amber-400">«{nicheBlockedModal.category}»</span> tiene actualmente <span className="font-bold">{nicheBlockedModal.count} {nicheBlockedModal.count === 1 ? "producto asignado" : "productos asignados"}</span>.
              </p>
              <p className="text-amber-800 dark:text-amber-300/90 text-[11.5px]">
                Para evitar dejar productos sin categoría o errores en la navegación de tus clientes, no es posible eliminar un nicho que contenga productos.
              </p>
              <div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                <span>💡 Sugerencia:</span> Edita esos productos para asignarlos a otro nicho o elimínalos antes de quitar esta categoría.
              </div>
            </div>

            {/* Action */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setNicheBlockedModal(null)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}


      {nicheToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a1c] border border-gray-100 dark:border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ¿Eliminar nicho?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  ¿Deseas retirar <span className="font-semibold text-gray-800 dark:text-gray-200">«{nicheToDelete}»</span> de la lista de categorías activas?
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setNicheToDelete(null)}
                disabled={isDeletingNiche}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteNiche}
                disabled={isDeletingNiche}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isDeletingNiche ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar nicho</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Navigation Dock (Hidden on md and up) */}
      <nav className="fixed bottom-3 inset-x-3 z-40 md:hidden flex items-center justify-between py-2 px-2.5 rounded-2xl bg-white/95 dark:bg-[#1e1e20]/95 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-x-auto hide-scrollbar gap-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            activeTab === "overview"
              ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
              : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
          title="Resumen"
        >
          <LayoutDashboard className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            activeTab === "orders"
              ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
              : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
          title="Pedidos"
        >
          <ShoppingBag className="w-4 h-4" />
          {pendingOrdersCount > 0 && (
            <span 
              className={`absolute flex items-center justify-center select-none pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                activeTab === "orders"
                  ? "top-0.5 right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#8c9276] text-white dark:text-gray-950 text-[9px] font-extrabold ring-1.5 ring-gray-950 dark:ring-white shadow-sm scale-100"
                  : "top-1.5 right-1.5 min-w-0 h-auto p-0 rounded-none bg-transparent text-[#8c9276] dark:text-[#a3a98d] text-[10px] font-black ring-0 shadow-none scale-105"
              }`}
              title={`${pendingOrdersCount} pedido(s) en curso`}
            >
              {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("cards")}
          className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            activeTab === "cards"
              ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
              : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
          title="Tarjetas"
        >
          <CreditCard className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab("favorites")}
          className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            activeTab === "favorites"
              ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
              : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
          title="Favoritos"
        >
          <Heart className="w-4 h-4" />
          {favorites.length > 0 && activeTab !== "favorites" && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("catalog")}
              className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                activeTab === "catalog"
                  ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="Catálogo"
            >
              <Package className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("niches")}
              className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                activeTab === "niches"
                  ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="Nichos"
            >
              <Layers className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                activeTab === "analytics"
                  ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="Radar"
            >
              <Globe className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("cart_alerts")}
              className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                activeTab === "cart_alerts"
                  ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="Alertas"
            >
              <BellRing className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                activeTab === "integrations"
                  ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="SMTP y Pasarelas"
            >
              <Server className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab("settings")}
          className={`relative p-2 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            activeTab === "settings"
              ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md"
              : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
          title="Ajustes"
        >
          <Settings className="w-4 h-4" />
        </button>

        <Link
          href="/"
          className="relative p-2 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all shrink-0"
          title="Volver a la Tienda"
        >
          <Store className="w-4 h-4" />
        </Link>
      </nav>

  </div>
  </div>
 );
}