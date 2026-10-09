"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  Server,
  Sparkles,
  Command,
  CornerDownLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Tag } from "lucide-react";
import { useUserStore, Order, formatCleanName } from "@/lib/userStore";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
import { useCatalogStore, normalizeCategory, CatalogProduct, ProductCombo, EmbeddedCarouselConfig } from "@/lib/catalogStore";
import { normalizeSearchText } from "@/lib/utils";
import { ColorVariantsManager, ColorVariant } from "@/components/admin/ColorVariantsManager";
import { normalizeImageUrl, normalizeImagesList, isGoogleDriveUrl } from "@/lib/imageUtils";
import { ProductArchitectureSelector } from "@/components/profile/ProductArchitectureSelector";
import { ProductGalleryStyleSelector } from "@/components/profile/ProductGalleryStyleSelector";
import { EmbeddedCarouselConfigurator } from "@/components/profile/EmbeddedCarouselConfigurator";
import { getLenis } from "@/components/providers/SmoothScrollProvider";
import { ProductCombosManager } from "@/components/profile/ProductCombosManager";
import { ProductEditorModal } from "@/components/profile/ProductEditorModal";
import { GoogleDriveSettingsCard, GoogleDriveIcon } from "@/components/profile/GoogleDriveSettingsCard";
import {
  ProductWizardStepHeader,
  ProductStoreSketchPreview,
  type ProductWizardStep,
} from "@/components/profile/ProductStoreSketchPreview";
import { OverviewTab } from "@/components/profile/tabs/OverviewTab";
import { ProfileTabErrorBoundary } from "@/components/profile/ProfileTabErrorBoundary";
import {
  BeUISelectField,
  BeUICenterMorphModal,
  BeUIPaginatedDock,
  requestMobileLandscapeFullscreen,
  exitMobileLandscapeFullscreen,
} from "@/components/ui/BeUIControls";
import { CatalogScrollToTopButton } from "@/components/ui/CatalogScrollToTopButton";
import { LuminaBrandEmblem } from "@/components/ui/LuminaBrandEmblem";
import { MacOSScrollbar } from "@/components/ui/MacOSScrollbar";
import {
  CatalogTabSkeleton,
  NichesTabSkeleton,
  AnalyticsTabSkeleton,
  CartAlertsTabSkeleton,
  IntegrationsTabSkeleton,
  DiscountCouponsTabSkeleton,
  SettingsTabSkeleton,
  OrdersTabSkeleton,
  CardsTabSkeleton,
  FavoritesTabSkeleton,
} from "@/components/ui/BoneyardSkeletons";

// Dynamic code-split tabs with Boneyard luxury skeletons
const CatalogTab = dynamic(() => import("@/components/profile/tabs/CatalogTab").then(m => m.CatalogTab), {
  loading: () => <CatalogTabSkeleton />,
  ssr: false,
});

const NichesTab = dynamic(() => import("@/components/profile/tabs/NichesTab").then(m => m.NichesTab), {
  loading: () => <NichesTabSkeleton />,
  ssr: false,
});

const AnalyticsTab = dynamic(() => import("@/components/profile/tabs/AnalyticsTab").then(m => m.AnalyticsTab), {
  loading: () => <AnalyticsTabSkeleton />,
  ssr: false,
});

const CartAlertsTab = dynamic(() => import("@/components/profile/tabs/CartAlertsTab").then(m => m.CartAlertsTab), {
  loading: () => <CartAlertsTabSkeleton />,
  ssr: false,
});

const IntegrationsTab = dynamic(() => import("@/components/profile/tabs/IntegrationsTab").then(m => m.IntegrationsTab), {
  loading: () => <IntegrationsTabSkeleton />,
  ssr: false,
});

const DiscountCouponsTab = dynamic(() => import("@/components/profile/tabs/DiscountCouponsTab").then(m => m.DiscountCouponsTab), {
  loading: () => <DiscountCouponsTabSkeleton />,
  ssr: false,
});

const SettingsTab = dynamic(() => import("@/components/profile/tabs/SettingsTab").then(m => m.SettingsTab), {
  loading: () => <SettingsTabSkeleton />,
  ssr: false,
});

const OrdersTab = dynamic(() => import("@/components/profile/tabs/OrdersTab").then(m => m.OrdersTab), {
  loading: () => <OrdersTabSkeleton />,
  ssr: false,
});

const CardsTab = dynamic(() => import("@/components/profile/tabs/CardsTab").then(m => m.CardsTab), {
  loading: () => <CardsTabSkeleton />,
  ssr: false,
});

const FavoritesTab = dynamic(() => import("@/components/profile/tabs/FavoritesTab").then(m => m.FavoritesTab), {
  loading: () => <FavoritesTabSkeleton />,
  ssr: false,
});

import { ExcelExportRadialMenu } from "@/components/profile/ExcelExportRadialMenu";

const OrderDetailModal = dynamic(() => import("@/components/profile/modals/OrderDetailModal").then(m => m.OrderDetailModal), {
  ssr: false,
});

const AddCardAnimatedModal = dynamic(() => import("@/components/profile/AddCardAnimatedModal").then(m => m.AddCardAnimatedModal), {
  ssr: false,
});
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";
import { useAvatarSettingsStore } from "@/lib/avatarSettingsStore";
import { useBrand } from "@/core";

export default function ProfilePage() {
  const brand = useBrand();
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

 const { products, categories, badges, fetchProducts, addProduct, updateProduct, deleteProduct, deleteCategory } = useCatalogStore();
 const { backgroundShape, customSeed, loadSettingsFromDatabase } = useAvatarSettingsStore();

  useEffect(() => {
    if (user?.id) {
      loadSettingsFromDatabase(user.id);
    }
  }, [user?.id, loadSettingsFromDatabase]);

  const isAdminUser = user?.role === "ADMIN" || user?.role === "SUBADMIN";

  const scopedOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders.filter(Boolean) : [];
    if (isAdminUser) return list;
    if (!user) return [];
    const uId = String(user.id || "").trim();
    const uEmail = String(user.email || "").toLowerCase().trim();
    return list.filter((ord) => {
      if (!ord) return false;
      const oUserId = String(ord.userId || "").trim();
      const oEmail = String(ord.customerEmail || ord.shippingAddress?.email || "").toLowerCase().trim();
      if (uId && oUserId && uId === oUserId) return true;
      if (uEmail && oEmail && uEmail === oEmail) return true;
      return false;
    });
  }, [orders, isAdminUser, user]);

  const pendingOrdersCount = scopedOrders.filter((o) => o?.status !== "Entregado").length;

  type ProfileTab = "overview" | "orders" | "cards" | "favorites" | "catalog" | "niches" | "analytics" | "cart_alerts" | "integrations" | "loyalty" | "settings";
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const { mode } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setIsMounted(true);
    const update = () => {
      const theme = getResolvedTheme(mode);
      setResolvedTheme(theme);
      
      if (typeof document !== 'undefined') {
        if (theme === "dark") {
          document.documentElement.style.setProperty("--scrollbar-thumb", "rgba(255, 255, 255, 0.6)", "important");
          document.documentElement.style.setProperty("--scrollbar-thumb-hover", "rgba(255, 255, 255, 0.8)", "important");
        } else {
          document.documentElement.style.setProperty("--scrollbar-thumb", "rgba(0, 0, 0, 0.24)", "important");
          document.documentElement.style.setProperty("--scrollbar-thumb-hover", "rgba(0, 0, 0, 0.44)", "important");
        }
      }
    };
    update();
    const interval = setInterval(update, 60000);

    try {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      const validTabs: ProfileTab[] = ["overview", "orders", "cards", "favorites", "catalog", "niches", "analytics", "cart_alerts", "integrations", "loyalty", "settings"];
      if (urlTab && validTabs.includes(urlTab as ProfileTab)) {
        setActiveTab(urlTab as ProfileTab);
      }
    } catch {}

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.documentElement.style.removeProperty("--scrollbar-thumb");
        document.documentElement.style.removeProperty("--scrollbar-thumb-hover");
      }
    };
  }, [mode]);

  // Scroll to top immediately when tab changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      try {
        const win = window as unknown as { lenis?: { scrollTo: (target: number, opts?: { immediate?: boolean }) => void } };
        if (win.lenis && typeof win.lenis.scrollTo === "function") {
          win.lenis.scrollTo(0, { immediate: true });
        }
      } catch {}
    }
  }, [activeTab]);

  // Enhanced Spotlight Search Bar State & Keyboard Shortcuts
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (window.innerWidth < 768) {
          mobileSearchInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus();
        }
        setIsSearchFocused(true);
      } 
      // Slash key '/' when not inside an input
      else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (window.innerWidth < 768) {
          mobileSearchInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus();
        }
        setIsSearchFocused(true);
      } 
      // Escape key to dismiss
      else if (e.key === "Escape") {
        if (isSearchFocused || searchQuery) {
          searchInputRef.current?.blur();
          mobileSearchInputRef.current?.blur();
          setIsSearchFocused(false);
          setSearchQuery("");
        }
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const inDesktop = searchDropdownRef.current && searchDropdownRef.current.contains(target);
      const inMobile = mobileSearchDropdownRef.current && mobileSearchDropdownRef.current.contains(target);
      if (!inDesktop && !inMobile) {
        setIsSearchFocused(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSearchFocused, searchQuery]);

  // Ensure browser smooth scroll resumes whenever search loses focus or unmounts
  useEffect(() => {
    if (!isSearchFocused) {
      getLenis()?.start();
    }
  }, [isSearchFocused]);

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

  // Excel Export Radial Menu State
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);

  // Mobile Bottom Dock Scroll Visibility (hides on scroll down, reappears on scroll up)
  const [isDockScrollVisible, setIsDockScrollVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const delta = currentY - lastScrollYRef.current;

          // Si estamos cerca de la parte superior de la página, mantener visible
          if (currentY < 30) {
            setIsDockScrollVisible(true);
          } else if (delta > 4) {
            // Scroll hacia abajo: ocultar inmediatamente para dar más espacio
            setIsDockScrollVisible(false);
          } else if (delta < -4) {
            // Scroll hacia arriba: mostrar de inmediato sin demoras
            setIsDockScrollVisible(true);
          }

          lastScrollYRef.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Admin New Product Modal State
 const [showProductModal, setShowProductModal] = useState(false);
 const [showDriveModal, setShowDriveModal] = useState(false);
  const addProductScrollRef = useRef<HTMLFormElement>(null);
  const editProductScrollRef = useRef<HTMLFormElement>(null);
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
 const [showDrivePicker, setShowDrivePicker] = useState(false);
 const [drivePickerTarget, setDrivePickerTarget] = useState<'create_main' | 'create_gallery' | 'edit_main' | 'edit_gallery'>('create_main');

 const handleDriveImageSelected = (imageUrl: string) => {
   if (drivePickerTarget === 'create_main') {
     setProdImageUrl(imageUrl);
   } else if (drivePickerTarget === 'create_gallery') {
     setProdExtraImages(prev => prev.trim() ? `${prev.trim()}, ${imageUrl}` : imageUrl);
   } else if (drivePickerTarget === 'edit_main') {
     setEditImageUrl(imageUrl);
   } else if (drivePickerTarget === 'edit_gallery') {
     setEditExtraImages(prev => prev.trim() ? `${prev.trim()}, ${imageUrl}` : imageUrl);
   }
 };

 const handleDriveMultipleImagesSelected = (imageUrls: string[]) => {
   if (!imageUrls || imageUrls.length === 0) return;
   const joined = imageUrls.join(', ');
   if (drivePickerTarget === 'create_main') {
     setProdImageUrl(imageUrls[0]);
   } else if (drivePickerTarget === 'create_gallery') {
     setProdExtraImages(prev => prev.trim() ? `${prev.trim()}, ${joined}` : joined);
   } else if (drivePickerTarget === 'edit_main') {
     setEditImageUrl(imageUrls[0]);
   } else if (drivePickerTarget === 'edit_gallery') {
     setEditExtraImages(prev => prev.trim() ? `${prev.trim()}, ${joined}` : joined);
   }
 };
 const [prodDescription, setProdDescription] = useState("");
 const [prodFeatures, setProdFeatures] = useState("");
 const [hasSizes, setHasSizes] = useState(false);
 const [prodSizes, setProdSizes] = useState("");
 const [prodColorVariants, setProdColorVariants] = useState<ColorVariant[]>([
   { name: "Negro Grafito", hex: "#18181B" }
 ]);
 const [prodMaterials, setProdMaterials] = useState("");
 const [prodShipping, setProdShipping] = useState("");
 const [prodDimensions, setProdDimensions] = useState("");
 const [prodWarranty, setProdWarranty] = useState("");
 const [prodCareInstructions, setProdCareInstructions] = useState("");
 const [prodPackageContents, setProdPackageContents] = useState("");
 const [prodStock, setProdStock] = useState("20");
 const [prodLayoutType, setProdLayoutType] = useState<'standard' | 'landing'>('standard');
 const [prodGalleryStyle, setProdGalleryStyle] = useState<'traditional' | 'isometric_3d'>('traditional');
 const [prodGalleryAutoplay, setProdGalleryAutoplay] = useState(true);
 const [prodGalleryAutoplaySpeed, setProdGalleryAutoplaySpeed] = useState(4);
 const [prodEmbeddedCarousel, setProdEmbeddedCarousel] = useState<EmbeddedCarouselConfig>({
   enabled: true,
   title: "Atmósfera & Edición Visual",
   subtitle: "Perspectiva sensorial y atmósfera espacial de esta pieza",
   autoplaySpeed: 3.5,
 });
 const [prodCombos, setProdCombos] = useState<ProductCombo[]>([]);
 const [prodHowToUse, setProdHowToUse] = useState("");
 const [prodBundleMode, setProdBundleMode] = useState<'companion' | 'volume_tiers' | 'care_pass'>('companion');
 const [prodBundleCompanionIds, setProdBundleCompanionIds] = useState<string[]>([]);
 const [prodLandingSpecs, setProdLandingSpecs] = useState<Array<{ title: string; description: string; side?: 'left' | 'right'; pinX?: number; pinY?: number }>>([
    { title: "Chasis de Aluminio y Acabado Mate", description: "Estructura aeroespacial ultraligera anodizada resistente a corrosión.", side: "left", pinX: 28, pinY: 32 },
    { title: "Óptica Difusa 360°", description: "Difusor de vidrio opalino tratado térmicamente para dispersión uniforme.", side: "left", pinX: 30, pinY: 70 },
    { title: "Gestión Térmica Inteligente", description: "Disipación pasiva silenciosa que alarga la vida útil de los componentes.", side: "right", pinX: 72, pinY: 28 },
    { title: "Carga Ultra Rápida USB-C", description: "Protocolo universal con selector touch de 4 temperaturas de luz.", side: "right", pinX: 70, pinY: 68 },
  ]);
  const [prodLandingReviews, setProdLandingReviews] = useState<Array<{ author: string; role?: string; rating: number; comment: string }>>([
    { author: "Valentina M.", role: "Arquitecta de Interiores", rating: 5, comment: "La calidad de los acabados es insuperable. Transforma cualquier rincón." },
    { author: "Carlos E.", role: "Comprador Verificado", rating: 5, comment: "El empaque llegó blindado en 24 horas. Impresiona todavía más en persona." },
  ]);
  const [prodLandingBundleEnabled, setProdLandingBundleEnabled] = useState(true);
  const [prodLandingBundleDiscount, setProdLandingBundleDiscount] = useState("15");
  const [prodLandingAnatomyImage, setProdLandingAnatomyImage] = useState("");
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
  const [editColorVariants, setEditColorVariants] = useState<ColorVariant[]>([
    { name: "Negro Grafito", hex: "#18181B" }
  ]);
  const [editMaterials, setEditMaterials] = useState("");
 const [editShipping, setEditShipping] = useState("");
 const [editDimensions, setEditDimensions] = useState("");
 const [editWarranty, setEditWarranty] = useState("");
 const [editCareInstructions, setEditCareInstructions] = useState("");
 const [editPackageContents, setEditPackageContents] = useState("");
 const [editStock, setEditStock] = useState("20");
 const [editLayoutType, setEditLayoutType] = useState<'standard' | 'landing' | 'cinematic' | 'bento'>('standard');
 const [editGalleryStyle, setEditGalleryStyle] = useState<'traditional' | 'isometric_3d' | 'carousel_flow' | 'stack_cards'>('traditional');
 const [editGalleryAutoplay, setEditGalleryAutoplay] = useState(true);
 const [editGalleryAutoplaySpeed, setEditGalleryAutoplaySpeed] = useState(4);
  const [editEmbeddedCarousel, setEditEmbeddedCarousel] = useState<EmbeddedCarouselConfig>({
    enabled: true,
    title: "Atmósfera & Edición Visual",
    subtitle: "Perspectiva sensorial y atmósfera espacial de esta pieza",
    autoplaySpeed: 3.5,
  });
  const [editCombos, setEditCombos] = useState<ProductCombo[]>([]);
 const [editHowToUse, setEditHowToUse] = useState("");
 const [editBundleMode, setEditBundleMode] = useState<'companion' | 'volume_tiers' | 'care_pass'>('companion');
 const [editBundleCompanionIds, setEditBundleCompanionIds] = useState<string[]>([]);
 const [editLandingSpecs, setEditLandingSpecs] = useState<Array<{ title: string; description: string; side?: 'left' | 'right'; pinX?: number; pinY?: number }>>([]);
 const [editLandingReviews, setEditLandingReviews] = useState<Array<{ author: string; role?: string; rating: number; comment: string }>>([]);
 const [editLandingBundleEnabled, setEditLandingBundleEnabled] = useState(true);
 const [editLandingBundleDiscount, setEditLandingBundleDiscount] = useState("15");
 const [editLandingAnatomyImage, setEditLandingAnatomyImage] = useState("");
 const [editFeedback, setEditFeedback] = useState<{ msg: string; success: boolean } | null>(null);
 const [addProductStep, setAddProductStep] = useState<ProductWizardStep>(0);
 const [editProductStep, setEditProductStep] = useState<ProductWizardStep>(0);

 useEffect(() => {
   if (showProductModal) setAddProductStep(0);
 }, [showProductModal]);

 useEffect(() => {
   if (showEditProductModal) setEditProductStep(0);
 }, [showEditProductModal]);

  // Computed visibility for mobile bottom dock (Estilo Apple Music: siempre presente de forma estable, solo se oculta ante modales de pantalla completa):
  const isMobileDockVisible = Boolean(
    !selectedOrder &&
      !isExcelMenuOpen &&
      !showProductModal &&
      !showCardModal &&
      !showAddressForm &&
      !showDriveModal
  );

  // Delete Product Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteProductError, setDeleteProductError] = useState<string | null>(null);

  // Niche / Category Delete Alert & Confirm States
  const [nicheBlockedModal, setNicheBlockedModal] = useState<{ category: string; count: number } | null>(null);
  const [nicheToDelete, setNicheToDelete] = useState<string | null>(null);
  const [isDeletingNiche, setIsDeletingNiche] = useState(false);

  // Automatically lock body scroll & notify macOS scrollbar when any modal opens
  const isAnyModalOpen = Boolean(
    showProductModal ||
    showEditProductModal ||
    showDriveModal ||
    productToDelete ||
    nicheBlockedModal ||
    nicheToDelete ||
    selectedOrder ||
    showCardModal
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.setAttribute("data-modal-open", "true");
    } else {
      document.body.style.overflow = "";
      document.documentElement.removeAttribute("data-modal-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.removeAttribute("data-modal-open");
    };
  }, [isAnyModalOpen]);

  // --- Top bar 3-by-3 paginated tabs state & navigation ---
  interface TopNavTabItem {
    id: ProfileTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    badge?: number;
  }

  const isEffectiveAdmin = Boolean(
    user?.isRootAdmin || 
    (user?.email || '').toLowerCase().trim() === 'admin@lumina.com' || 
    user?.role === "ADMIN" || 
    user?.role === "SUBADMIN"
  );

  const topNavTabs = useMemo<TopNavTabItem[]>(() => {
    const list: TopNavTabItem[] = [
      { id: "overview", label: "Vista General", icon: LayoutDashboard, iconColor: "text-amber-500/90" },
      { id: "orders", label: "Pedidos", icon: ShoppingBag, iconColor: "text-blue-500/90", badge: (Array.isArray(scopedOrders) ? scopedOrders : []).length },
      { id: "cards", label: "Billetera", icon: CreditCard, iconColor: "text-emerald-500/90", badge: (Array.isArray(cards) ? cards : []).length },
      { id: "favorites", label: "Favoritos", icon: Heart, iconColor: "text-rose-500/90", badge: (Array.isArray(favorites) ? favorites : []).length },
    ];
    if (isEffectiveAdmin) {
      list.push(
        { id: "catalog", label: "Inventario", icon: Package, iconColor: "text-amber-500/90", badge: (Array.isArray(products) ? products : []).length },
        { id: "niches", label: "Nichos", icon: Layers, iconColor: "text-purple-500/90", badge: (Array.isArray(categories) ? categories : []).length },
        { id: "analytics", label: "Radar en Vivo", icon: Globe, iconColor: "text-cyan-500/90" },
        { id: "cart_alerts", label: "Alertas Bolsa", icon: BellRing, iconColor: "text-yellow-500/90" },
        { id: "integrations", label: "SMTP & Servidor", icon: Server, iconColor: "text-indigo-500/90" }
      );
    }
    list.push(
      { id: "loyalty", label: "Cupones", icon: Tag, iconColor: "text-orange-500/90" },
      { id: "settings", label: "Ajustes", icon: Settings, iconColor: "text-stone-500/90" }
    );
    return list;
  }, [isEffectiveAdmin, scopedOrders, cards, favorites, products, categories]);

  const TABS_PER_PAGE = 3;
  const tabPages = useMemo(() => {
    const pages: TopNavTabItem[][] = [];
    for (let i = 0; i < topNavTabs.length; i += TABS_PER_PAGE) {
      pages.push(topNavTabs.slice(i, i + TABS_PER_PAGE));
    }
    return pages;
  }, [topNavTabs]);

  const [topNavPage, setTopNavPage] = useState(0);
  const [navDirection, setNavDirection] = useState<number>(0);
  const prevActiveTabRef = useRef(activeTab);

  // Auto-sync page ONLY when activeTab actually changes (e.g. search bar, drawer, clicks)
  useEffect(() => {
    if (prevActiveTabRef.current !== activeTab) {
      prevActiveTabRef.current = activeTab;
      const activeIdx = topNavTabs.findIndex((t) => t.id === activeTab);
      if (activeIdx !== -1) {
        const targetPage = Math.floor(activeIdx / TABS_PER_PAGE);
        setNavDirection(targetPage >= topNavPage ? 1 : -1);
        setTopNavPage(targetPage);
      }
    }
  }, [activeTab, topNavTabs, topNavPage]);

  // Keep page index within bounds if tab count changes
  useEffect(() => {
    if (tabPages.length > 0 && topNavPage >= tabPages.length) {
      setTopNavPage(Math.max(0, tabPages.length - 1));
    }
  }, [tabPages.length, topNavPage]);

  const goToPreviousPage = useCallback(() => {
    if (topNavPage > 0) {
      setNavDirection(-1);
      setTopNavPage((prev) => Math.max(0, prev - 1));
    }
  }, [topNavPage]);

  const goToNextPage = useCallback(() => {
    if (topNavPage < tabPages.length - 1) {
      setNavDirection(1);
      setTopNavPage((prev) => Math.min(tabPages.length - 1, prev + 1));
    }
  }, [topNavPage, tabPages.length]);

  const goToPage = useCallback((targetPage: number) => {
    if (targetPage !== topNavPage && targetPage >= 0 && targetPage < tabPages.length) {
      setNavDirection(targetPage > topNavPage ? 1 : -1);
      setTopNavPage(targetPage);
    }
  }, [topNavPage, tabPages.length]);

  const handleTabsWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 15 || Math.abs(e.deltaX) > 15) {
      e.preventDefault();
      const dir = (e.deltaY > 0 || e.deltaX > 0) ? 1 : -1;
      if (dir > 0) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    }
  }, [goToNextPage, goToPreviousPage]);

  // Category & Badge manager state



  // 5. Filtered Lists (accent/diacritic insensitive)
  const filteredOrders = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return scopedOrders.filter((ord) => {
      const matchQuery =
        !q ||
        normalizeSearchText(ord.id).includes(q) ||
        normalizeSearchText(ord.customerName || "").includes(q) ||
        normalizeSearchText(ord.customerEmail || "").includes(q) ||
        normalizeSearchText(ord.trackingNumber || "").includes(q);
      return matchQuery;
    });
  }, [scopedOrders, searchQuery]);

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
 <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#18181b]">
 <div className="flex flex-col items-center gap-3">
 <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
 <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cargando panel de usuario...</p>
 </div>
 </div>
 );
 }

  const isRootAdmin = Boolean(user.isRootAdmin || (user.email || '').toLowerCase().trim() === 'admin@lumina.com');
  const isSubAdmin = user.role === "SUBADMIN" || (user.role === "ADMIN" && !isRootAdmin);
  const isAdmin = isRootAdmin || isSubAdmin;

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

    const finalImageUrl = normalizeImageUrl(prodImageUrl.trim()) || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
    const extraList = prodExtraImages.trim()
      ? prodExtraImages.split(/[\n,]+/).map(u => u.trim()).filter(Boolean)
      : [];
    const imagesList = normalizeImagesList([finalImageUrl, ...extraList]);

    const colorsList = prodColorVariants.length > 0
      ? prodColorVariants.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), hex: c.hex.trim() || "#18181B" }))
      : [{ name: "Negro Grafito", hex: "#18181B" }];

    const res = await addProduct({
      title: prodTitle.trim(),
      titleHighlight: prodHighlight.trim() || undefined,
      category: prodCategory.trim(),
      price: parseFloat(prodPrice) || 0,
      oldPrice: hasDiscount && oldPrice ? parseFloat(oldPrice) : null,
      discount: hasDiscount && calculatedDiscount ? calculatedDiscount : undefined,
      badge: prodBadge.trim() || undefined,
      imageUrl: finalImageUrl,
      images: imagesList,
      description: prodDescription.trim(),
      features: prodFeatures.trim() ? prodFeatures.split("\n").map(f => f.trim()).filter(Boolean) : undefined,
      howToUse: prodHowToUse.trim() || undefined,
      combos: prodCombos.length > 0 ? prodCombos : undefined,
      sizes: hasSizes && prodSizes.trim() ? prodSizes.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      colors: colorsList,
      materials: prodMaterials.trim() || undefined,
      shipping: prodShipping.trim() || undefined,
      dimensions: prodDimensions.trim() || undefined,
      warranty: prodWarranty.trim() || undefined,
      careInstructions: prodCareInstructions.trim() || undefined,
      packageContents: prodPackageContents.trim() || undefined,
      stock: prodStock ? parseInt(prodStock, 10) : 20,
      layoutType: prodLayoutType,
      galleryStyle: prodGalleryStyle,
      galleryAutoplay: prodGalleryAutoplay,
      galleryAutoplaySpeed: prodGalleryAutoplaySpeed,
      embeddedCarousel: prodEmbeddedCarousel,
      landingAnatomyImage: prodLayoutType === 'landing' && prodLandingAnatomyImage.trim() ? prodLandingAnatomyImage.trim() : undefined,
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
        setProdColorVariants([{ name: "Negro Grafito", hex: "#18181B" }]);
 setProdMaterials("");
 setProdShipping("");
 setProdDimensions("");
 setProdWarranty("");
 setProdCareInstructions("");
 setProdPackageContents("");
 setProdStock("20");
 setProdLayoutType("standard");
 setProdGalleryStyle("traditional");
 setProdGalleryAutoplay(true);
 setProdGalleryAutoplaySpeed(4);
 setProdEmbeddedCarousel({
   enabled: true,
   title: "Atmósfera & Edición Visual",
   subtitle: "Perspectiva sensorial y atmósfera espacial de esta pieza",
   autoplaySpeed: 3.5,
 });
 setProdLandingAnatomyImage("");
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
    setEditColorVariants(
      Array.isArray(p.colors) && p.colors.length > 0
        ? p.colors.map(c => ({ name: c.name, hex: c.hex || "#18181B" }))
        : [{ name: "Negro Grafito", hex: "#18181B" }]
    );
    setEditMaterials(p.materials || "");
    setEditShipping(p.shipping || "");
    setEditDimensions(p.dimensions || "");
    setEditWarranty(p.warranty || "");
    setEditCareInstructions(p.careInstructions || "");
    setEditPackageContents(p.packageContents || "");
    setEditStock(p.stock !== undefined ? p.stock.toString() : "20");
    setEditLayoutType(p.layoutType || 'standard');
    setEditGalleryStyle(p.galleryStyle || 'traditional');
    setEditGalleryAutoplay(p.galleryAutoplay !== undefined ? p.galleryAutoplay : true);
    setEditGalleryAutoplaySpeed(p.galleryAutoplaySpeed || 4);
    setEditEmbeddedCarousel(p.embeddedCarousel || {
      enabled: true,
      title: "Atmósfera & Edición Visual",
      subtitle: "Perspectiva sensorial y atmósfera espacial de esta pieza",
      autoplaySpeed: 3.5,
    });
    setEditCombos(p.combos || []);
    setEditHowToUse(p.howToUse || "");
    setEditBundleMode(p.landingBundle?.mode || 'companion');
    setEditBundleCompanionIds(p.landingBundle?.companionProductIds || []);
    setEditLandingSpecs(p.landingSpecs || []);
    setEditLandingReviews(p.landingReviews || []);
    setEditLandingBundleEnabled(Boolean(p.landingBundle?.enabled));
    setEditLandingBundleDiscount(p.landingBundle?.discountPercentage ? p.landingBundle.discountPercentage.toString() : "15");
    setEditLandingAnatomyImage(p.landingAnatomyImage || "");
    setEditFeedback(null);
    setEditProductStep(0);
    requestMobileLandscapeFullscreen();
    setShowEditProductModal(true);
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;

    if (!editTitle.trim() || !editCategory.trim() || !(parseFloat(editPrice) > 0) || !editDescription.trim()) {
      setEditProductStep(1);
      setEditFeedback({
        success: false,
        msg: "Por favor completa el Nombre, Categoría, Precio y Descripción en '2. Información Principal'.",
      });
      return;
    }

    setIsSubmittingEdit(true);
    setEditFeedback(null);

    const finalImageUrl = normalizeImageUrl(editImageUrl.trim()) || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
    const extraList = editExtraImages.trim()
      ? editExtraImages.split(/[\n,]+/).map(u => u.trim()).filter(Boolean)
      : [];
    const imagesList = normalizeImagesList([finalImageUrl, ...extraList]);

    const colorsList = editColorVariants.length > 0
      ? editColorVariants.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), hex: c.hex.trim() || "#18181B" }))
      : [{ name: "Negro Grafito", hex: "#18181B" }];

    const res = await updateProduct(editingProductId, {
      id: editingProductId,
      title: editTitle.trim(),
      titleHighlight: editHighlight.trim() || undefined,
      category: editCategory.trim(),
      price: parseFloat(editPrice) || 0,
      oldPrice: editHasDiscount && editOldPrice ? parseFloat(editOldPrice) : null,
      discount: editHasDiscount && editCalculatedDiscount ? editCalculatedDiscount : undefined,
      badge: editBadge.trim() || undefined,
      imageUrl: finalImageUrl,
      images: imagesList,
      description: editDescription.trim(),
      features: editFeatures.trim() ? editFeatures.split("\n").map(f => f.trim()).filter(Boolean) : undefined,
      howToUse: editHowToUse.trim() || undefined,
      combos: editCombos.length > 0 ? editCombos : undefined,
      sizes: editHasSizes && editSizes.trim() ? editSizes.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      colors: colorsList,
 materials: editMaterials.trim() || undefined,
 shipping: editShipping.trim() || undefined,
 dimensions: editDimensions.trim() || undefined,
 warranty: editWarranty.trim() || undefined,
 careInstructions: editCareInstructions.trim() || undefined,
 packageContents: editPackageContents.trim() || undefined,
 stock: editStock ? parseInt(editStock, 10) : 20,
 layoutType: editLayoutType,
 galleryStyle: editGalleryStyle,
 galleryAutoplay: editGalleryAutoplay,
 galleryAutoplaySpeed: editGalleryAutoplaySpeed,
 embeddedCarousel: editEmbeddedCarousel,
 landingAnatomyImage: editLayoutType === 'landing' && editLandingAnatomyImage.trim() ? editLandingAnatomyImage.trim() : undefined,
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

  // Renderizador unificado para el panel Spotlight Dropdown (móvil y desktop)
  const renderSpotlightDropdown = (isMobile: boolean) => (
    <div 
      data-lenis-prevent="true"
      onMouseEnter={() => {
        getLenis()?.stop();
      }}
      onMouseLeave={() => {
        getLenis()?.start();
      }}
      className={
        isMobile
          ? "absolute left-0 right-0 top-full mt-2 w-full max-h-[75vh] bg-white/95 dark:bg-[#1c1c22]/95 backdrop-blur-2xl border border-stone-200/90 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-3.5 z-[100] flex flex-col text-xs pointer-events-auto transition-all duration-200 ease-out animate-fade-in"
          : "absolute right-0 top-full mt-2.5 w-[390px] max-w-[calc(100vw-2rem)] max-h-[78vh] bg-white/95 dark:bg-[#1c1c22]/95 backdrop-blur-2xl border border-stone-200/90 dark:border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.65)] p-4 z-[100] flex flex-col text-xs pointer-events-auto transition-all duration-200 ease-out animate-fade-in"
      }
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-1 pb-2 border-b border-gray-100 dark:border-white/10">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#e07a3f]" />
          {searchQuery.trim().length > 0 
            ? `Coincidencias (${filteredOrders.length + filteredCatalog.length})`
            : "Sugerencias de Navegación"}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsSearchFocused(false);
            setSearchQuery("");
          }}
          className="text-[10.5px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-2 py-0.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          Cerrar (Esc)
        </button>
      </div>

      {/* Scrollable Results Container */}
      <div 
        data-lenis-prevent="true"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1 space-y-3.5 pr-1 [scrollbar-width:thin]"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Estado vacío cuando NO hay consulta: Sugerencias rápidas */}
        {searchQuery.trim().length === 0 && (
          <div className="space-y-2 py-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
              Accesos Directos Rápidos
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("orders");
                  setIsSearchFocused(false);
                }}
                className="p-2.5 rounded-2xl bg-stone-50 dark:bg-white/[0.04] hover:bg-amber-50 dark:hover:bg-[#e07a3f]/10 border border-stone-100 dark:border-white/5 hover:border-[#e07a3f]/30 text-left transition-all group flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-[#e07a3f] transition-colors truncate">
                    {isAdmin ? "Todos los Pedidos" : "Mis Pedidos"}
                  </span>
                  <span className="text-[10px] text-gray-400 block truncate">
                    {scopedOrders.length} registros
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab(isAdmin ? "catalog" : "favorites");
                  setIsSearchFocused(false);
                }}
                className="p-2.5 rounded-2xl bg-stone-50 dark:bg-white/[0.04] hover:bg-amber-50 dark:hover:bg-[#e07a3f]/10 border border-stone-100 dark:border-white/5 hover:border-[#e07a3f]/30 text-left transition-all group flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  {isAdmin ? <Layers className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-[#e07a3f] transition-colors truncate">
                    {isAdmin ? "Catálogo y Piezas" : "Lista de Deseos"}
                  </span>
                  <span className="text-[10px] text-gray-400 block truncate">
                    {isAdmin ? `${products.length} productos` : `${favorites.length} guardados`}
                  </span>
                </div>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("niches");
                    setIsSearchFocused(false);
                  }}
                  className="p-2.5 rounded-2xl bg-stone-50 dark:bg-white/[0.04] hover:bg-amber-50 dark:hover:bg-[#e07a3f]/10 border border-stone-100 dark:border-white/5 hover:border-[#e07a3f]/30 text-left transition-all group flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-[#e07a3f] transition-colors truncate">
                      Nichos de Tienda
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      {categories.length} categorías
                    </span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveTab("settings");
                  setIsSearchFocused(false);
                }}
                className="p-2.5 rounded-2xl bg-stone-50 dark:bg-white/[0.04] hover:bg-amber-50 dark:hover:bg-[#e07a3f]/10 border border-stone-100 dark:border-white/5 hover:border-[#e07a3f]/30 text-left transition-all group flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Settings className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs block group-hover:text-[#e07a3f] transition-colors truncate">
                    Ajustes de Perfil
                  </span>
                  <span className="text-[10px] text-gray-400 block truncate">
                    Seguridad y Datos
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Resultados de Pedidos */}
        {searchQuery.trim().length > 0 && filteredOrders.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
              <Package className="w-3 h-3 text-blue-500" />
              <span>Pedidos ({filteredOrders.length})</span>
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {filteredOrders.slice(0, 4).map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => {
                    setActiveTab("orders");
                    setSelectedOrder(ord);
                    setSearchQuery("");
                    setIsSearchFocused(false);
                  }}
                  className="p-2.5 rounded-2xl hover:bg-stone-100/80 dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between gap-2.5 transition-all group"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-gray-900 dark:text-white block group-hover:text-[#e07a3f] transition-colors">
                      {ord.id}
                    </span>
                    <span className="text-[10.5px] text-gray-400 truncate block">
                      {ord.customerName || "Cliente Lumina"} · ${Number(ord?.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 border ${
                    ord?.status === "Entregado"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30"
                      : ord?.status === "Enviado"
                      ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/30"
                      : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30"
                  }`}>
                    {ord?.status || "Procesando"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados de Catálogo */}
        {searchQuery.trim().length > 0 && filteredCatalog.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-amber-500" />
              <span>Catálogo de Piezas ({filteredCatalog.length})</span>
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {filteredCatalog.slice(0, 4).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setActiveTab(isAdmin ? "catalog" : "favorites");
                    setSearchQuery("");
                    setIsSearchFocused(false);
                  }}
                  className="p-2 rounded-2xl hover:bg-stone-100/80 dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between gap-2.5 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {prod.imageUrl && (
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 shrink-0 border border-stone-200/50 dark:border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 truncate block max-w-[200px] group-hover:text-[#e07a3f] transition-colors">
                        {prod.title}
                      </span>
                      <span className="text-[10px] text-gray-400 block">{prod.category}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-gray-900 dark:text-gray-200 shrink-0">
                    ${Number(prod.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {searchQuery.trim().length > 0 && filteredOrders.length === 0 && filteredCatalog.length === 0 && (
          <div className="py-7 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#e07a3f] mx-auto flex items-center justify-center">
              <Search className="w-5 h-5 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Sin resultados para &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-[11px] text-gray-400">
              Prueba buscando por número de orden, nombre de cliente o pieza de diseño.
            </p>
          </div>
        )}
      </div>

      {/* Footer Bar */}
      <div className="shrink-0 pt-2.5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-stone-100 dark:bg-white/10 font-mono text-[9px]">ESC</kbd> cerrar
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-stone-100 dark:bg-white/10 font-mono text-[9px]">↵</kbd> abrir resultado
        </span>
      </div>
    </div>
  );

 return (
 <div className={clsx(resolvedTheme === 'dark' ? 'dark' : '')}>
  <style>{`
  html:not([data-beui-vt]) .theme-transition {
    transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  /* Left Vertical Navigation Dock: clean surface transitions (never animate layout/dimensions) */
  .sidebar-dock-nav {
    transition: background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
  }
  .sidebar-dock-btn {
    transition: transform 200ms ease, background-color 200ms ease, color 200ms ease;
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
  <div className="theme-transition min-h-screen w-full max-w-full overflow-x-hidden bg-[#f3f4f6] dark:bg-[#202022] text-gray-900 dark:text-gray-100 flex flex-col md:flex-row p-2.5 sm:p-4 md:p-6 lg:p-8 selection:bg-amber-500/20">
  
  {/* 1. Left Vertical Icon Sidebar (Desktop Dock) */}
  <aside
    style={{ contain: "layout style" }}
    className="hidden md:flex sidebar-dock-nav w-16 md:w-20 bg-white/95 dark:bg-[#1e1e20]/95 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-[0_8px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.35)] flex-col items-center py-6 gap-6 justify-between shrink-0 mr-4 md:mr-6 self-stretch relative z-30"
  >
 
  {/* Brand Logo Symbol (Soft Melon in Light Mode, Inverted in Dark Mode) */}
  <div className="flex flex-col items-center gap-5 w-full">
  <Link 
    href="/" 
    className="sidebar-dock-btn group relative w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-[#FFE4D1] dark:bg-[#080C26] text-[#080C26] dark:text-[#FFE4D1] border border-[#F5C2A1]/80 dark:border-[#FFE4D1]/30 flex items-center justify-center shadow-md shadow-[#F5C2A1]/25 dark:shadow-black/50 hover:scale-105 active:scale-95 transition-all duration-300" 
    title={`${brand.name} • Volver a la Tienda`}
  >
    <LuminaBrandEmblem size={30} />
    <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#080C26] dark:bg-[#FFE4D1] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
     <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
   )}
   <LayoutDashboard className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:rotate-6 group-hover:-translate-y-0.5" />
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
     <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
   )}
   <ShoppingBag className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:-rotate-12 group-hover:-translate-y-0.5" />
   {pendingOrdersCount > 0 && (
     <span 
       className={`absolute flex items-center justify-center select-none pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
         activeTab === "orders"
           ? "top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white dark:text-gray-950 text-[10px] font-extrabold ring-2 ring-gray-950 dark:ring-white shadow-sm scale-100"
           : "top-[23px] right-[4px] md:top-[25px] md:right-[5px] min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-[10.5px] font-black shadow-[0_2px_6px_rgba(244,63,94,0.25)] scale-100"
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
     <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
   )}
   <CreditCard className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:-rotate-6 group-hover:-translate-y-0.5" />
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
     <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
   )}
   <Heart className="w-5 h-5 transition-all duration-300 group-hover:scale-125 group-hover:text-rose-500 group-hover:-translate-y-0.5" />
   {favorites.length > 0 && activeTab !== "favorites" && (
     <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#1e1e20]" />
   )}
 </button>

 <button 
   onClick={() => setActiveTab("loyalty")} 
   className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
     activeTab === "loyalty" 
       ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
       : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
   }`}
   title="Gestión de Cupones"
 >
   {activeTab === "loyalty" && (
     <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
   )}
   <Tag className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:rotate-6 group-hover:-translate-y-0.5" />
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
         <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
       )}
       <Package className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:-translate-y-1" />
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
         <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
       )}
       <Layers className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:-translate-y-1 group-hover:rotate-3" />
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
         <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
       )}
       <Globe className="w-5 h-5 transition-all duration-500 group-hover:scale-115 group-hover:rotate-90 group-hover:text-amber-600 dark:text-amber-400" />
     </button>

     <button 
       onClick={() => setActiveTab("cart_alerts")} 
       className={`sidebar-dock-btn relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
         activeTab === "cart_alerts" 
           ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
           : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
       }`}
        title="Notificaciones de Bolsa"
     >
       {activeTab === "cart_alerts" && (
         <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
       )}
       <BellRing className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:rotate-12 group-hover:-translate-y-0.5" />
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
          <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-amber-400 rounded-r-full transition-all duration-[600ms]" />
        )}
        <Server className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:rotate-3 group-hover:-translate-y-0.5" />
      </button>
   </>
 )}
 </nav>
 </div>

 {/* Bottom Actions: Configuración & Sistema (arriba de Volver a la Tienda) + Volver a la Tienda + Cerrar Sesión */}
 <div className="flex flex-col items-center gap-3 w-full px-2">
 <div className="w-9 md:w-10 h-[2px] bg-gray-300/80 dark:bg-white/20 rounded-full my-0.5 transition-colors shrink-0" />
 <button 
   onClick={() => setActiveTab("settings")} 
   className={`sidebar-dock-btn relative w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all duration-[600ms] cursor-pointer group ${
     activeTab === "settings" 
       ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-950/20 dark:shadow-white/15 scale-105" 
       : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
   }`}
   title="Configuración"
 >
   {activeTab === "settings" && (
     <span className="absolute -left-2 w-1 h-5 bg-amber-500 dark:bg-white rounded-r-full transition-all duration-[600ms]" />
   )}
   <Settings className="w-5 h-5 transition-all duration-500 group-hover:scale-115 group-hover:rotate-90 group-hover:-translate-y-0.5" />
 </button>
 <Link 
   href="/" 
   className="sidebar-dock-btn relative w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-all duration-[600ms] group" 
   title="Volver a la Tienda"
 >
   <Store className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:-translate-y-1" />
 </Link>
 <button 
   onClick={() => { logout(); router.push("/auth/login"); }} 
   className="sidebar-dock-btn relative w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-[600ms] group cursor-pointer"
   title="Cerrar Sesión"
 >
   <LogOut className="w-5 h-5 transition-all duration-300 group-hover:scale-115 group-hover:translate-x-1" />
 </button>
 </div>
 </aside>

  {/* 2. Main Bento Canvas */}
  <main className={`flex-1 flex flex-col min-w-0 w-full space-y-6 pb-28 sm:pb-32 md:pb-6 ${activeTab === "cart_alerts" || activeTab === "analytics" ? "max-w-none" : "max-w-7xl mx-auto"}`}>
  
  {/* Top App Bar (Reference Style) */}
  <header className="relative z-40 bg-white/80 dark:bg-[#202022]/80 backdrop-blur-2xl px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl sm:rounded-3xl border border-white/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
  
  {/* Brand & Top Navigation Pill Bar */}
  <div className="flex items-center justify-between md:justify-start gap-3 md:gap-4 min-w-0 w-full md:w-auto md:flex-1">
  <Link 
    href="/" 
    className="shrink-0 flex items-center hover:opacity-85 transition-opacity select-none py-0.5" 
    title="Ir a la tienda"
  >
    <Image
      src="/brand/lumina-wordmark.png"
      alt={brand.name || "Lumina"}
      width={1058}
      height={272}
      priority
      className="h-6 sm:h-7 w-auto object-contain dark:invert"
    />
  </Link>

  {/* Top Bar Paginated Tabs (3 por página con estética luxury liquid glass) */}
  <div
    onWheel={handleTabsWheel}
    className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-stone-100/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-stone-200/80 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all select-none min-w-0"
  >
    {/* Botón página previa */}
    <button
      type="button"
      onClick={goToPreviousPage}
      disabled={topNavPage === 0}
      title="Página anterior de pestañas"
      className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 ${
        topNavPage === 0
          ? "text-stone-300 dark:text-stone-700 cursor-not-allowed opacity-30"
          : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 shadow-xs active:scale-95 cursor-pointer"
      }`}
    >
      <ChevronLeft className="w-3.5 h-3.5" />
    </button>

    {/* Contenedor animado de las 3 pestañas */}
    <div className="overflow-hidden w-[330px] lg:w-[360px] xl:w-[380px]">
      <AnimatePresence mode="wait" custom={navDirection}>
        <motion.div
          key={topNavPage}
          custom={navDirection}
          variants={{
            enter: (direction: number) => ({
              x: direction > 0 ? 16 : -16,
              opacity: 0,
              filter: "blur(2px)",
            }),
            center: {
              x: 0,
              opacity: 1,
              filter: "blur(0px)",
            },
            exit: (direction: number) => ({
              x: direction > 0 ? -16 : 16,
              opacity: 0,
              filter: "blur(2px)",
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-1 w-full"
        >
          {tabPages[topNavPage]?.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                title={tab.label}
                className={`group relative flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all duration-200 cursor-pointer select-none truncate ${
                  isActive
                    ? "bg-white dark:bg-[#232328] text-stone-900 dark:text-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] ring-1 ring-black/5 dark:ring-white/10"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-white/5 font-medium"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-115 ${tab.iconColor}`} />
                <span className="truncate">{tab.label}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 leading-none ${
                    isActive
                      ? "bg-[#e07a3f]/15 text-[#e07a3f] dark:text-[#ff9d66] font-semibold"
                      : "bg-stone-200/70 dark:bg-white/10 text-stone-500 dark:text-stone-400"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>

    {/* Botón página siguiente */}
    <button
      type="button"
      onClick={goToNextPage}
      disabled={topNavPage >= tabPages.length - 1}
      title="Página siguiente de pestañas"
      className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 ${
        topNavPage >= tabPages.length - 1
          ? "text-stone-300 dark:text-stone-700 cursor-not-allowed opacity-30"
          : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 shadow-xs active:scale-95 cursor-pointer"
      }`}
    >
      <ChevronRight className="w-3.5 h-3.5" />
    </button>

    {/* Indicador de páginas con micro-pills */}
    <div className="flex items-center gap-1 shrink-0 border-l border-stone-200/80 dark:border-white/10 pl-1.5 pr-0.5">
      {tabPages.map((_, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => goToPage(idx)}
          title={`Ir a página ${idx + 1} de pestañas`}
          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            topNavPage === idx
              ? "w-3.5 bg-[#e07a3f]"
              : "w-1.5 bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-500"
          }`}
        />
      ))}
    </div>
  </div>

  {/* Acciones Rápidas en Móvil: Avatar Blobatar + Botón Salir */}
  <div className="flex md:hidden items-center gap-2 shrink-0">
    <BlobatarAvatar
      name={customSeed || user.id || user.email || user.name}
      size={34}
      animate="always"
      background={backgroundShape || "squircle"}
      role={user.role}
      showGlow
      title={`Avatar de ${formatCleanName(user.name)}`}
    />
    <button 
      onClick={() => { logout(); router.push("/auth/login"); }}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/80 dark:border-red-900/40 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
      title="Cerrar Sesión"
      aria-label="Cerrar Sesión"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="text-[11px] font-bold">Salir</span>
    </button>
  </div>
  </div>

  {/* Barra de Búsqueda Móvil Dedicada estilo Spotlight (Visible solo en pantallas pequeñas) */}
  <div className="relative w-full md:hidden z-50 group/mobile-search" ref={mobileSearchDropdownRef}>
    <div 
      className={`relative flex items-center gap-2.5 px-3.5 h-11 rounded-2xl bg-white/90 dark:bg-[#1a1a20]/90 backdrop-blur-2xl border transition-all duration-300 ease-out shadow-xs ${
        isSearchFocused
          ? "border-[#e07a3f] ring-4 ring-[#e07a3f]/25 shadow-[0_4px_20px_rgba(224,122,63,0.2)]"
          : "border-stone-200/90 dark:border-white/10 hover:border-[#e07a3f]/50"
      }`}
    >
      <div className="flex items-center justify-center shrink-0">
        <Search className={`w-4 h-4 transition-all duration-300 ${
          isSearchFocused ? "text-[#e07a3f] scale-110 rotate-[-8deg]" : "text-[#e07a3f]/80"
        }`} />
      </div>

      <input
        ref={mobileSearchInputRef}
        id="lumina-profile-search-input-mobile"
        type="text"
        value={searchQuery}
        onFocus={() => setIsSearchFocused(true)}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (searchQuery.trim().length > 0) {
              if (filteredOrders.length > 0) {
                setActiveTab("orders");
                setSelectedOrder(filteredOrders[0]);
                setSearchQuery("");
                setIsSearchFocused(false);
              } else if (filteredCatalog.length > 0) {
                setActiveTab("catalog");
                handleOpenEditProduct(filteredCatalog[0]);
                setSearchQuery("");
                setIsSearchFocused(false);
              }
            }
          }
        }}
        placeholder={isAdmin ? "Buscar pedidos, clientes, catálogo..." : "Buscar pedidos, marcas o piezas..."}
        className="bg-transparent border-none outline-none text-xs w-full font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
      />

      {searchQuery && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-[#e07a3f]/10 text-[#e07a3f] dark:text-[#f59e0b] text-[10px] font-mono font-bold">
            {filteredOrders.length + filteredCatalog.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              mobileSearchInputRef.current?.focus();
            }}
            className="w-5 h-5 rounded-full hover:bg-stone-200/80 dark:hover:bg-white/15 text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>

    {/* Dropdown Spotlight en Móvil */}
    {isSearchFocused && renderSpotlightDropdown(true)}
  </div>

  {/* Right Search Input & Profile Badge (Spotlight Alive Command Bar en Desktop) */}
  <div className="hidden md:flex items-center gap-2.5 sm:gap-3 shrink-0">
    <div className="relative z-50 group/search" ref={searchDropdownRef}>
      <div 
        className={`relative flex items-center gap-2.5 pl-3.5 pr-2.5 h-10 rounded-full bg-white/80 dark:bg-[#1a1a20]/80 hover:bg-white dark:hover:bg-[#202026] focus-within:bg-white dark:focus-within:bg-[#1a1a20] backdrop-blur-2xl border transition-all duration-300 ease-out ${
          isSearchFocused
            ? "border-[#e07a3f] dark:border-[#e07a3f] ring-4 ring-[#e07a3f]/25 shadow-[0_8px_32px_rgba(224,122,63,0.24)]"
            : "border-[#e07a3f]/30 dark:border-[#e07a3f]/35 hover:border-[#e07a3f] dark:hover:border-[#e07a3f] hover:ring-2 hover:ring-[#e07a3f]/20 shadow-[0_2px_10px_rgba(224,122,63,0.06)] hover:shadow-[0_4px_22px_rgba(224,122,63,0.18)]"
        }`}
      >
        <div className="flex items-center justify-center shrink-0">
          <Search className={`w-4 h-4 transition-all duration-300 ${
            isSearchFocused
              ? "text-[#e07a3f] scale-110 rotate-[-8deg]"
              : "text-[#e07a3f]/70 dark:text-[#e07a3f]/80 group-hover/search:text-[#e07a3f] group-hover/search:scale-110"
          }`} />
        </div>

        <input
          ref={searchInputRef}
          id="lumina-profile-search-input"
          type="text"
          value={searchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!isSearchFocused) {
                setIsSearchFocused(true);
              } else if (searchQuery.trim().length > 0) {
                if (filteredOrders.length > 0) {
                  setActiveTab("orders");
                  setSelectedOrder(filteredOrders[0]);
                  setSearchQuery("");
                  setIsSearchFocused(false);
                } else if (filteredCatalog.length > 0) {
                  setActiveTab("catalog");
                  handleOpenEditProduct(filteredCatalog[0]);
                  setSearchQuery("");
                  setIsSearchFocused(false);
                }
              }
            }
          }}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isAdmin ? "Buscar pedidos, piezas, clientes o catálogo..." : "Buscar mis pedidos, artículos o marcas..."}
          className="bg-transparent border-none outline-none text-xs w-36 sm:w-48 lg:w-56 focus:w-56 sm:focus:w-72 lg:focus:w-84 font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 ease-out"
        />

        {searchQuery && (
          <div className="flex items-center gap-1.5 shrink-0 animate-fade-in">
            <span className="px-2 py-0.5 rounded-full bg-[#e07a3f]/10 text-[#e07a3f] dark:text-[#f59e0b] text-[10px] font-mono font-bold">
              {filteredOrders.length + filteredCatalog.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="w-5 h-5 rounded-full hover:bg-stone-200/80 dark:hover:bg-white/15 text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
              title="Limpiar búsqueda (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Spotlight Dropdown Panel en Desktop */}
      {isSearchFocused && renderSpotlightDropdown(false)}
    </div>

    <Link href="/" className="hidden lg:flex text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors">
      Ver Tienda &rarr;
    </Link>

    <div className="flex items-center gap-2.5 sm:gap-3 pl-3 border-l border-gray-200 dark:border-white/10">
      <BlobatarAvatar
        name={customSeed || user.id || user.email || user.name}
        size={38}
        animate="always"
        background={backgroundShape || "squircle"}
        role={user.role}
        showGlow
        title={`Avatar de ${formatCleanName(user.name)}`}
      />
      <div className="hidden lg:block text-left">
        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-normal">{formatCleanName(user.name)}</p>
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
          isRootAdmin 
            ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40" 
            : isSubAdmin 
            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40" 
            : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40"
        }`}>
          {isRootAdmin ? "ADMINISTRADOR" : isSubAdmin ? "SUB ADMINISTRADOR" : "CLIENTE"}
        </span>
      </div>
    </div>
  </div>
 </header>

 {/* Greeting Banner */}
 <div className="px-1 sm:px-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-normal relative z-10 antialiased [transform:translateZ(0)]">
 {getGreeting()}, <span className="italic font-normal tracking-wide ml-1.5 inline-block">{formatCleanName(user.name)}</span>
 </h1>
 <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
  {isAdmin 
  ? "Panel de control maestro de catálogo, inventario, radar de clientes y analítica de esta Tienda" 
  : "Supervisa tus pedidos, métodos de pago vinculados y artículos guardados."}
 </p>
 </div>
 {isAdmin && (
 <div className="flex items-center gap-2.5 w-full sm:w-auto mt-1 sm:mt-0 justify-between sm:justify-start">
 <ExcelExportRadialMenu onOpenChange={setIsExcelMenuOpen} />
 <button 
 onClick={() => {
   requestMobileLandscapeFullscreen();
   setShowProductModal(true);
 }}
 className="h-10 sm:h-11 flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none shadow-gray-900/10 cursor-pointer shrink-0 active:scale-95"
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
          <ProfileTabErrorBoundary tabName="Vista General">
            <OverviewTab
              isAdmin={isAdmin}
              setActiveTab={setActiveTab}
              setSelectedOrder={setSelectedOrder}
              setShowCardModal={setShowCardModal}
              onRequestDeleteNiche={handleRequestDeleteNiche}
            />
          </ProfileTabErrorBoundary>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ORDERS & ACTIVITIES TAB */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <ProfileTabErrorBoundary tabName="Pedidos">
            <OrdersTab
              isAdmin={isAdmin}
              searchQuery={searchQuery}
              setSelectedOrder={setSelectedOrder}
            />
          </ProfileTabErrorBoundary>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: CARDS & WALLET TAB */}
        {/* ========================================================================= */}
        {activeTab === "cards" && (
          <ProfileTabErrorBoundary tabName="Billetera">
            <CardsTab
              setShowCardModal={setShowCardModal}
            />
          </ProfileTabErrorBoundary>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: FAVORITES TAB */}
        {/* ========================================================================= */}
        {activeTab === "favorites" && (
          <ProfileTabErrorBoundary tabName="Favoritos">
            <FavoritesTab />
          </ProfileTabErrorBoundary>
        )}

 {/* ========================================================================= */}
 {/* VIEW 5: ADMIN CATALOG & INVENTORY TAB */}
 {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* VIEW 5: ADMIN CATALOG & INVENTORY TAB */}
        {/* ========================================================================= */}
        {activeTab === "catalog" && isAdmin && (
          <ProfileTabErrorBoundary tabName="Inventario">
            <CatalogTab
              searchQuery={searchQuery}
              onOpenCreateProduct={() => {
                requestMobileLandscapeFullscreen();
                setShowProductModal(true);
              }}
              onOpenEditProduct={(p) => {
                requestMobileLandscapeFullscreen();
                handleOpenEditProduct(p);
              }}
              onDeleteProduct={(p) => {
                setDeleteProductError(null);
                setProductToDelete(p);
              }}
            />
          </ProfileTabErrorBoundary>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: ADMIN NICHES TAB */}
        {/* ========================================================================= */}
        {activeTab === "niches" && isAdmin && (
          <ProfileTabErrorBoundary tabName="Nichos">
            <NichesTab
              onRequestDeleteNiche={handleRequestDeleteNiche}
            />
          </ProfileTabErrorBoundary>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: ANALYTICS RADAR TAB */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && isAdmin && (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <ProfileTabErrorBoundary tabName="Analíticas">
              <AnalyticsTab
                onNavigateToAddresses={() => {
                  setActiveTab("settings");
                  setShowAddressForm(true);
                }}
              />
            </ProfileTabErrorBoundary>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 8: ADMIN CART ALERTS TAB (SILEO PLAYGROUND) */}
        {/* ========================================================================= */}
        {activeTab === "cart_alerts" && isAdmin && (
          <ProfileTabErrorBoundary tabName="Alertas de Carrito">
            <CartAlertsTab />
          </ProfileTabErrorBoundary>
        )}

        {/* ========================================================================= */}
        {/* VIEW 8B: ADMIN INTEGRATIONS & VERCEL SMTP TAB */}
        {/* ========================================================================= */}
        {activeTab === "integrations" && isAdmin && (
          <ProfileTabErrorBoundary tabName="Integraciones">
            <IntegrationsTab />
          </ProfileTabErrorBoundary>
        )}

        {/* ========================================================================= */}
        {/* VIEW 8C: ADMIN DISCOUNT COUPONS GENERATOR & MANAGER                       */}
        {/* ========================================================================= */}
        {activeTab === "loyalty" && (
          <ProfileTabErrorBoundary tabName="Cupones">
            <DiscountCouponsTab />
          </ProfileTabErrorBoundary>
        )}

        {/* ========================================================================= */}
        {/* VIEW 9: SETTINGS & ADDRESS TAB */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <ProfileTabErrorBoundary tabName="Ajustes">
            <SettingsTab
              isAdmin={isAdmin}
              isRootAdmin={isRootAdmin}
              showAddressForm={showAddressForm}
              setShowAddressForm={setShowAddressForm}
            />
          </ProfileTabErrorBoundary>
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
        onUpdateStatus={(orderId, nextSt, trackingInfo) => {
          updateOrderStatus(orderId, nextSt, trackingInfo);
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({
              ...selectedOrder,
              status: nextSt,
              trackingNumber:
                nextSt === "Procesando"
                  ? undefined
                  : trackingInfo?.trackingNumber ?? selectedOrder.trackingNumber,
              trackingUrl:
                nextSt === "Procesando"
                  ? undefined
                  : trackingInfo?.trackingUrl ?? selectedOrder.trackingUrl,
              carrierName:
                nextSt === "Procesando"
                  ? undefined
                  : trackingInfo?.carrierName ?? selectedOrder.carrierName,
            });
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
        number: `•••• •••• ${String(cardData?.number || "").replace(/\s+/g, "").slice(-4) || "8888"}`,
        holder: cardData?.holder || user?.name || "Titular Lumina",
        exp: cardData?.exp || "12/28",
        type: cardData?.type || "visa",
        isDefault: (Array.isArray(cards) ? cards : []).length === 0,
      });
    }}
  />

 {/* ========================================================================= */}
      {/* MODAL: ADMIN NUEVO PRODUCTO (UNIFICADO, VISUAL & LIBRE DE ESTRÉS)        */}
      {/* ========================================================================= */}
      <ProductEditorModal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        mode="create"
        categories={categories}
        badges={badges}
        allProducts={products}
        onSave={async (payload) => {
          await addProduct(payload as Omit<CatalogProduct, 'id'>);
          await fetchProducts();
        }}
        onOpenFullGallery={() => setShowDriveModal(true)}
        onManageNiches={() => {
          setShowProductModal(false);
          setActiveTab("niches");
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL: ADMIN EDITAR PRODUCTO (UNIFICADO, VISUAL & LIBRE DE ESTRÉS)       */}
      {/* ========================================================================= */}
      <ProductEditorModal
        open={showEditProductModal}
        onClose={() => {
          setShowEditProductModal(false);
          setEditingProductId(null);
        }}
        mode="edit"
        product={products.find(p => p.id === editingProductId) || null}
        categories={categories}
        badges={badges}
        allProducts={products}
        onSave={async (payload) => {
          if (editingProductId) {
            await updateProduct(editingProductId, payload as CatalogProduct);
            await fetchProducts();
          }
        }}
        onOpenFullGallery={() => setShowDriveModal(true)}
        onManageNiches={() => {
          setShowEditProductModal(false);
          setActiveTab("niches");
        }}
      />

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
                    sizes="56px"
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

      {/* Mobile Floating Bottom Dock (beUI Paginated Dock, 3 pages of 4 sections, Hidden on md and up) */}
      <div className="md:hidden">
        <BeUIPaginatedDock
          isVisible={isMobileDockVisible}
          items={[
            {
              id: "overview",
              label: "Vista General",
              icon: <LayoutDashboard className="w-5 h-5" />,
              active: activeTab === "overview",
              onClick: () => setActiveTab("overview"),
            },
            {
              id: "orders",
              label: "Pedidos",
              icon: <ShoppingBag className="w-5 h-5" />,
              active: activeTab === "orders",
              onClick: () => setActiveTab("orders"),
              badgeCount: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
            },
            {
              id: "cards",
              label: "Billetera",
              icon: <CreditCard className="w-5 h-5" />,
              active: activeTab === "cards",
              onClick: () => setActiveTab("cards"),
            },
            {
              id: "favorites",
              label: "Favoritos",
              icon: <Heart className="w-5 h-5" />,
              active: activeTab === "favorites",
              onClick: () => setActiveTab("favorites"),
              badgeCount: favorites.length > 0 ? favorites.length : undefined,
            },
            ...(isAdmin
              ? [
                  {
                    id: "catalog",
                    label: "Inventario",
                    icon: <Package className="w-5 h-5" />,
                    active: activeTab === "catalog",
                    onClick: () => setActiveTab("catalog"),
                  },
                  {
                    id: "niches",
                    label: "Nichos",
                    icon: <Layers className="w-5 h-5" />,
                    active: activeTab === "niches",
                    onClick: () => setActiveTab("niches"),
                  },
                  {
                    id: "analytics",
                    label: "Radar",
                    icon: <Globe className="w-5 h-5" />,
                    active: activeTab === "analytics",
                    onClick: () => setActiveTab("analytics"),
                  },
                  {
                    id: "cart_alerts",
                    label: "Alertas",
                    icon: <BellRing className="w-5 h-5" />,
                    active: activeTab === "cart_alerts",
                    onClick: () => setActiveTab("cart_alerts"),
                  },
                  {
                    id: "integrations",
                    label: "Servidor",
                    icon: <Server className="w-5 h-5" />,
                    active: activeTab === "integrations",
                    onClick: () => setActiveTab("integrations"),
                  },
                ]
              : []),
            {
              id: "loyalty",
              label: "Cupones",
              icon: <Tag className="w-5 h-5" />,
              active: activeTab === "loyalty",
              onClick: () => setActiveTab("loyalty"),
            },
            {
              id: "settings",
              label: "Ajustes",
              icon: <Settings className="w-5 h-5" />,
              active: activeTab === "settings",
              onClick: () => setActiveTab("settings"),
            },
            {
              id: "store",
              label: "Tienda",
              icon: <Store className="w-5 h-5" />,
              active: false,
              onClick: () => router.push("/"),
              title: "Volver a la Tienda",
            },
          ]}
          itemsPerPage={4}
        />
      </div>

      {activeTab === "catalog" && (
        <CatalogScrollToTopButton className="bottom-24 md:bottom-8" />
      )}

      {/* Galería de Fotos (Antes Banco de Fotos) */}
      {showDriveModal && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-6xl max-h-[96vh] sm:max-h-[92vh] flex">
            <GoogleDriveSettingsCard onClose={() => setShowDriveModal(false)} />
          </div>
        </div>
      )}
    </div>
  </div>
 );
}
