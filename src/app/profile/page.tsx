"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
 Sparkles, 
 Store, 
 CheckCircle2, 
 Check,
 Eye, 
 Settings, 
 ShieldCheck, 
 User as UserIcon, 
 KeyRound, 
 ExternalLink, 
 MapPin, 
 Tag, 
 Pencil,
 Star,
 Navigation,
 Loader2,
 Globe,
 Crown,
 Mail,
 ChevronLeft,
 ChevronRight,
 Sliders,
 RotateCcw,
 Home as HomeIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  NICHE_ICONS_CATALOG, 
  getNicheIconByName, 
  getSavedNicheSlots, 
  DEFAULT_NICHE_SLOTS, 
  type NicheSlotConfig 
} from "@/lib/nicheIcons";
import { useUserStore, Order, formatCleanName } from "@/lib/userStore";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useCatalogStore, normalizeCategory, CatalogProduct, isAgotadoBadge, ProductCombo } from "@/lib/catalogStore";
import { useCartStore } from "@/lib/store";
import { normalizeSearchText } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { ProductArchitectureSelector } from "@/components/profile/ProductArchitectureSelector";
import { ProductCombosManager } from "@/components/profile/ProductCombosManager";
import dynamic from 'next/dynamic';

const AnalyticsRadarView = dynamic(() => import('@/components/profile/AnalyticsRadarView'), {
 loading: () => <div className="h-[720px] w-full bg-[#181d1b] rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl dark:shadow-none animate-pulse text-white/50 dark:text-gray-900/50 font-mono text-xs tracking-widest uppercase">Inicializando Radar Lumina...</div>,
 ssr: false
});

class RadarErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("Radar view caught an error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[660px] rounded-[2.5rem] bg-[#181d1b] border border-white/10 flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="w-12 h-12 rounded-full border-2 border-[#ccff00]/40 border-t-[#ccff00] animate-spin mb-4" />
          <h3 className="text-lg font-bold">Conectando con el Radar en Vivo...</h3>
          <p className="text-xs text-white/60 max-w-sm mt-2">
            Sincronizando coordenadas y telemetría de clientes en tiempo real con Supabase.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-5 px-6 py-2.5 rounded-full bg-[#ccff00] text-gray-950 font-bold text-xs hover:scale-105 transition-all cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.3)]"
          >
            Reconectar Radar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ProfilePage() {
 const router = useRouter();
 const { 
 user, 
 isAuthenticated, 
 isLoading,
 logout, 
 favorites, 
 toggleFavorite,
 orders, 
 cards, 
 addresses,
 addAddress,
 removeAddress,
 setDefaultAddress,
 addCard, 
 removeCard, 
 setDefaultCard,
 updateOrderStatus,
 refreshOrders,
 updateUserName,
 updateUserPassword,
 recheckUserRole
 } = useUserStore();

 const { products, categories, badges, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, addBadge, deleteBadge } = useCatalogStore();
 const { addItem, setIsOpen: setCartOpen } = useCartStore();

 // Navigation & Search State
 const [activeTab, setActiveTab] = useState<"overview" | "orders" | "cards" | "favorites" | "catalog" | "niches" | "analytics" | "settings">("overview");
 const [searchQuery, setSearchQuery] = useState("");
 const [isMounted, setIsMounted] = useState(false);

 const { mode } = useThemeStore();
 const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

 useEffect(() => {
 const update = () => setResolvedTheme(getResolvedTheme(mode));
 update();
 const interval = setInterval(update, 60000);
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
 const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

 // Filter for catalog tab
 const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");

 // New Card Modal State with live preview
 const [showCardModal, setShowCardModal] = useState(false);
 const [newCardNumber, setNewCardNumber] = useState("");
 const [newCardHolder, setNewCardHolder] = useState("");
 const [newCardExp, setNewCardExp] = useState("");
 const [newCardType, setNewCardType] = useState<"mastercard" | "visa">("mastercard");

 // Address Form State
 const [showAddressForm, setShowAddressForm] = useState(false);
 const [recipient, setRecipient] = useState("");
 const [street, setStreet] = useState("");
 const [city, setCity] = useState("");
 const [stateProv, setStateProv] = useState("");
 const [postalCode, setPostalCode] = useState("");
 const [country, setCountry] = useState("España");
 const [isDetectingLocation, setIsDetectingLocation] = useState(false);
 const [locationError, setLocationError] = useState<string | null>(null);
 const [locationSuccess, setLocationSuccess] = useState(false);

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
  const [newCatInput, setNewCatInput] = useState("");
  const [newBadgeInput, setNewBadgeInput] = useState("");

  // Interactive Chart Hover States
  const [hoveredNicheIdx, setHoveredNicheIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const nicheHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const monthHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNicheMouseEnter = (idx: number) => {
    if (nicheHoverTimeoutRef.current) {
      clearTimeout(nicheHoverTimeoutRef.current);
      nicheHoverTimeoutRef.current = null;
    }
    setHoveredNicheIdx(idx);
  };

  const handleNicheMouseLeave = () => {
    if (nicheHoverTimeoutRef.current) clearTimeout(nicheHoverTimeoutRef.current);
    nicheHoverTimeoutRef.current = setTimeout(() => {
      setHoveredNicheIdx(null);
    }, 150);
  };

  const handleNicheContainerLeave = () => {
    if (nicheHoverTimeoutRef.current) clearTimeout(nicheHoverTimeoutRef.current);
    setHoveredNicheIdx(null);
  };

  const handleMonthMouseEnter = (idx: number) => {
    if (monthHoverTimeoutRef.current) {
      clearTimeout(monthHoverTimeoutRef.current);
      monthHoverTimeoutRef.current = null;
    }
    setHoveredMonthIdx(idx);
  };

  const handleMonthMouseLeave = () => {
    if (monthHoverTimeoutRef.current) clearTimeout(monthHoverTimeoutRef.current);
    monthHoverTimeoutRef.current = setTimeout(() => {
      setHoveredMonthIdx(null);
    }, 150);
  };

  const handleMonthContainerLeave = () => {
    if (monthHoverTimeoutRef.current) clearTimeout(monthHoverTimeoutRef.current);
    setHoveredMonthIdx(null);
  };

  // Dynamic Header Niche Customizer State (for Admin Niches Tab)
  const [nicheSlots, setNicheSlots] = useState<NicheSlotConfig[]>(DEFAULT_NICHE_SLOTS);
  const [activeEditingSlot, setActiveEditingSlot] = useState<1 | 2>(1);
  const [previewActiveTab, setPreviewActiveTab] = useState<string>("niche1");
  const [previewHoveredTab, setPreviewHoveredTab] = useState<string | null>(null);
  const [nicheSaveFeedback, setNicheSaveFeedback] = useState<string | null>(null);
  const iconSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNicheSlots(getSavedNicheSlots());
    }
  }, []);

  const handleUpdateNicheSlot = (slotIndex: 0 | 1, updates: Partial<NicheSlotConfig>) => {
    setNicheSlots((prev) => {
      const copy = [...prev];
      copy[slotIndex] = { ...copy[slotIndex], ...updates };
      return copy;
    });
  };

  const handleSelectIconForActiveSlot = (iconName: string) => {
    handleUpdateNicheSlot(activeEditingSlot === 1 ? 0 : 1, { iconName });
  };

  const handleSaveNicheSlots = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lumina_header_niches", JSON.stringify(nicheSlots));
        window.dispatchEvent(new Event("lumina_header_niches_updated"));
        setNicheSaveFeedback("¡Menú de pastilla actualizado con éxito para la página de inicio!");
        setTimeout(() => setNicheSaveFeedback(null), 3500);
      } catch {}
    }
  };

  const handleResetNicheSlots = () => {
    setNicheSlots(DEFAULT_NICHE_SLOTS);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lumina_header_niches", JSON.stringify(DEFAULT_NICHE_SLOTS));
        window.dispatchEvent(new Event("lumina_header_niches_updated"));
        setNicheSaveFeedback("Restablecido a los nichos predeterminados (Iluminación & Textiles)");
        setTimeout(() => setNicheSaveFeedback(null), 3500);
      } catch {}
    }
  };

  const scrollIconSlider = (direction: "left" | "right") => {
    if (iconSliderRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      iconSliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

 const handleAddBadgeSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (newBadgeInput.trim()) {
 addBadge(newBadgeInput.trim());
 setNewBadgeInput("");
 }
 };

 // Settings State
 const [editName, setEditName] = useState("");
 const [newPass, setNewPass] = useState("");
 const [invitedAdmins, setInvitedAdmins] = useState<string[]>([]);
 const [adminInviteInput, setAdminInviteInput] = useState("");
 const [isSyncingAdmins, setIsSyncingAdmins] = useState(false);
 const [inviteError, setInviteError] = useState<string | null>(null);
 const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
 const [settingsFeedback, setSettingsFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
 const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const fetchInvitedAdmins = async () => {
    try {
      const res = await fetch('/api/admin/invitations', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.invitedAdmins)) {
          setInvitedAdmins(data.invitedAdmins);
          if (typeof window !== "undefined") {
            localStorage.setItem("lumina_admin_invites", data.invitedAdmins.join(", "));
          }
          return;
        }
      }
    } catch {
      // Non-critical fallback
    }

    // Direct Supabase query fallback
    try {
      const { data: dbConfig } = await supabase
        .from('orders')
        .select('items')
        .eq('id', 'SYS_CONFIG_ADMIN_INVITES')
        .maybeSingle();

      if (dbConfig && Array.isArray(dbConfig.items)) {
        const dbEmails = (dbConfig.items as Array<{ email?: string } | string>)
          .map((item) => (typeof item === 'object' && item !== null ? String(item.email || '') : String(item || '')).toLowerCase().trim())
          .filter(Boolean);
        setInvitedAdmins(dbEmails);
        if (typeof window !== "undefined") {
          localStorage.setItem("lumina_admin_invites", dbEmails.join(", "));
        }
        return;
      }
    } catch {}

    // Resilient Fallback: check local storage if server was temporarily clean
    if (typeof window !== "undefined") {
      const localAdmins = localStorage.getItem("lumina_admin_invites");
      if (localAdmins) {
        const list = localAdmins.split(',').map(e => e.trim()).filter(Boolean);
        setInvitedAdmins(list);
      }
    }
  };

  const handleAddAdminInvite = async (emailsToAdd?: string) => {
    const raw = (emailsToAdd !== undefined ? emailsToAdd : adminInviteInput).trim();
    if (!raw) return;
    setInviteError(null);
    setInviteSuccess(null);
    setIsSyncingAdmins(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: user?.email,
          userRole: user?.role,
          isRootAdmin,
          action: 'add',
          emails: raw,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al agregar administrador.');
      }
      setInvitedAdmins(data.invitedAdmins);
      setAdminInviteInput("");
      setInviteSuccess(`¡Administrador "${raw}" agregado y sincronizado con éxito!`);
      if (typeof window !== "undefined") {
        localStorage.setItem("lumina_admin_invites", data.invitedAdmins.join(", "));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la invitación.';
      setInviteError(msg);
    } finally {
      setIsSyncingAdmins(false);
    }
  };

  const handleRemoveAdminInvite = async (targetEmail: string) => {
    setInviteError(null);
    setInviteSuccess(null);
    setIsSyncingAdmins(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: user?.email,
          userRole: user?.role,
          isRootAdmin,
          action: 'remove',
          email: targetEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al revocar administrador.');
      }
      setInvitedAdmins(data.invitedAdmins);
      setInviteSuccess(`Acceso revocado para '${targetEmail}'.`);
      if (typeof window !== "undefined") {
        localStorage.setItem("lumina_admin_invites", data.invitedAdmins.join(", "));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al revocar administrador.';
      setInviteError(msg);
    } finally {
      setIsSyncingAdmins(false);
    }
  };

 useEffect(() => {
 setIsMounted(true);
 if (typeof window !== "undefined") {
 const params = new URLSearchParams(window.location.search);
 const tabParam = params.get("tab");
    if (tabParam && ["overview", "orders", "cards", "favorites", "catalog", "niches", "analytics", "settings"].includes(tabParam)) {
      setActiveTab(tabParam as "overview" | "orders" | "cards" | "favorites" | "catalog" | "niches" | "analytics" | "settings");
    }
    if (params.get("addAddress") === "true") {
      setShowAddressForm(true);
    }
 }
 if (isMounted && !isLoading && !isAuthenticated) {
 router.push("/auth/login");
 }
 }, [isAuthenticated, isLoading, isMounted, router]);

  useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
    if (user?.role === 'ADMIN') {
      fetchInvitedAdmins();
    } else if (user?.role === 'USER') {
      recheckUserRole();
    }
  }, [user, recheckUserRole]);

  useEffect(() => {
    // Initial fetch from fresh cloud database
    fetchInvitedAdmins();
  }, []);

  // Real-time synchronization heartbeat and window focus listener
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Refresh immediately on window focus
    const onFocus = () => {
      refreshOrders();
      if (user?.role === 'USER') {
        recheckUserRole();
      } else if (user?.role === 'ADMIN') {
        fetchInvitedAdmins();
      }
    };
    window.addEventListener("focus", onFocus);

    // Refresh every 5 seconds for live store monitoring across devices
    const interval = setInterval(() => {
      refreshOrders();
      if (user?.role === 'USER') {
        recheckUserRole();
      }
    }, 5000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [isAuthenticated, user, refreshOrders, recheckUserRole]);

 // =========================================================================
 // REAL-TIME MATHEMATICAL CALCULATIONS & METRICS
 // =========================================================================

 // 1. Client Metrics
 const totalUserSpend = useMemo(() => {
 return orders.reduce((acc, curr) => acc + curr.total, 0);
 }, [orders]);

 const loyaltyPoints = useMemo(() => {
 return Math.floor(totalUserSpend);
 }, [totalUserSpend]);

 const loyaltyTier = useMemo(() => {
 if (loyaltyPoints >= 500) return { name: "Nivel Oro", color: "text-amber-600" };
 if (loyaltyPoints >= 100) return { name: "Nivel Plata", color: "text-slate-600" };
 return { name: "Nivel Bronce", color: "text-amber-800" };
 }, [loyaltyPoints]);

 // 2. Admin Metrics
 const totalInventoryValue = useMemo(() => {
 return products.reduce((acc, p) => acc + (p.price || 0), 0);
 }, [products]);

 const averagePrice = useMemo(() => {
 return products.length > 0 ? totalInventoryValue / products.length : 0;
 }, [totalInventoryValue, products]);

 const discountedCount = useMemo(() => {
 return products.filter(p => Boolean(p.discount || (p.oldPrice && p.oldPrice > p.price))).length;
 }, [products]);

 const discountPercentageOfCatalog = useMemo(() => {
 return products.length > 0 ? Math.round((discountedCount / products.length) * 100) : 0;
 }, [discountedCount, products]);

 const emptyCategories = useMemo(() => {
 return categories.filter(cat => 
 !products.some(p => normalizeCategory(p.category) === normalizeCategory(cat))
 );
 }, [categories, products]);

 // 3. Real Category Product Distribution Chart (for Admin)
 const categoryDistributionData = useMemo(() => {
 const totalProds = products.length;
 const counts = categories.map(cat => {
 const count = products.filter(p => normalizeCategory(p.category) === normalizeCategory(cat)).length;
 const pctOfTotal = totalProds > 0 ? Math.round((count / totalProds) * 100) : 0;
 return { category: cat, count, pctOfTotal };
 });
 const maxCount = Math.max(...counts.map(c => c.count), 1);
 return counts.map(c => ({
 ...c,
 // Scaled between 8% (minimum baseline for empty) and 82% (max so counts/tooltips have guaranteed headroom)
 heightPct: c.count === 0 ? 8 : Math.max(Math.round((c.count / maxCount) * 82), 14)
 }));
 }, [categories, products]);

 // 4. Real Monthly Spend Distribution (for Client)
 const monthlySpendData = useMemo(() => {
 const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
 const hasAnyOrders = orders.length > 0;
 
 // Sum real orders by month if available
 const totals = monthNames.map(m => {
 const monthOrders = orders.filter(o => o.date?.toLowerCase().includes(m.toLowerCase()));
 const sum = monthOrders.reduce((acc, o) => acc + o.total, 0);
 return { month: m, total: sum };
 });

 const maxMonth = Math.max(...totals.map(t => t.total), 1);

 return totals.map(t => ({
 month: t.month,
 total: t.total,
 heightPct: hasAnyOrders && t.total > 0 ? Math.max(Math.round((t.total / maxMonth) * 82), 12) : 6,
 hasData: t.total > 0
 }));
 }, [orders]);

 // 5. Filtered Lists (accent/diacritic insensitive)
 const filteredOrders = useMemo(() => {
 const q = normalizeSearchText(searchQuery);
 return orders.filter(ord => {
 const matchStatus = orderStatusFilter === "all" || ord.status.toLowerCase() === orderStatusFilter.toLowerCase();
 const matchQuery = !q || 
 normalizeSearchText(ord.id).includes(q) ||
 normalizeSearchText(ord.customerName || "").includes(q) ||
 normalizeSearchText(ord.customerEmail || "").includes(q) ||
 normalizeSearchText(ord.trackingNumber || "").includes(q);
 return matchStatus && matchQuery;
 });
 }, [orders, orderStatusFilter, searchQuery]);

 const filteredCatalog = useMemo(() => {
 const q = normalizeSearchText(searchQuery);
 return products.filter(p => {
 const matchCat = catalogCategoryFilter === "all" || normalizeSearchText(p.category) === normalizeSearchText(catalogCategoryFilter);
 const matchQuery = !q || 
 normalizeSearchText(p.title).includes(q) || 
 normalizeSearchText(p.category).includes(q) ||
 (p.description && normalizeSearchText(p.description).includes(q));
 return matchCat && matchQuery;
 });
 }, [products, catalogCategoryFilter, searchQuery]);

 const favoritedProductsList = useMemo(() => {
 return products.filter(p => favorites.includes(p.id));
 }, [products, favorites]);

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
 const isRootAdmin = Boolean(user.isRootAdmin ?? (user.email.toLowerCase() === 'admin@lumina.com'));

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

 // Add Card Submit
 const handleAddCardSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newCardNumber || !newCardExp) return;
 addCard({
 number: `•••• •••• ${newCardNumber.replace(/\s+/g, "").slice(-4) || "8888"}`,
 holder: newCardHolder.trim() || user.name,
 exp: newCardExp.trim(),
 type: newCardType,
 isDefault: cards.length === 0
 });
 setShowCardModal(false);
 setNewCardNumber("");
 setNewCardHolder("");
 setNewCardExp("");
 };

 // Add Category Submit
 const handleAddCategorySubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newCatInput.trim()) return;
 addCategory(newCatInput.trim());
 setNewCatInput("");
 };

 // Geolocation-based Address Detection
 const handleDetectLocation = () => {
 if (typeof window === "undefined" || !navigator.geolocation) {
 setLocationError("Tu navegador no soporta geolocalización.");
 return;
 }

 setIsDetectingLocation(true);
 setLocationError(null);
 setLocationSuccess(false);

 navigator.geolocation.getCurrentPosition(
 async (pos) => {
 try {
 const { latitude, longitude } = pos.coords;

 const res = await fetch("/api/geocode", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ lat: latitude, lon: longitude })
 });

 const result = await res.json();

 if (result.success && result.data) {
 const { street: detStreet, city: detCity, state: detState, postalCode: detPostal, country: detCountry } = result.data;

 if (detStreet) setStreet(detStreet);
 if (detCity) setCity(detCity);
 if (detState) setStateProv(detState);
 if (detPostal) setPostalCode(detPostal);
 if (detCountry) setCountry(detCountry);

 // Keep recipient untouched, or if totally blank, suggest user name
 if (!recipient.trim() && user?.name) {
 setRecipient(user.name);
 }

 setLocationSuccess(true);
 } else {
 setLocationError(result.error || "No se pudo obtener la información de dirección. Por favor, ingrésala manualmente.");
 }
 } catch {
 setLocationError("Error al procesar la dirección de tu ubicación.");
 } finally {
 setIsDetectingLocation(false);
 }
 },
 (err) => {
 setIsDetectingLocation(false);
 if (err.code === 1) {
 setLocationError("Permiso de ubicación denegado. Habilita el acceso a la ubicación en tu navegador o ingresa los datos manualmente.");
 } else if (err.code === 2) {
 setLocationError("Ubicación no disponible en este dispositivo. Ingresa los datos manualmente.");
 } else if (err.code === 3) {
 setLocationError("Tiempo de espera agotado al obtener la ubicación. Ingresa los datos manualmente.");
 } else {
 setLocationError("No se pudo acceder a la ubicación. Ingresa los datos manualmente.");
 }
 },
 {
 enableHighAccuracy: true,
 timeout: 10000,
 maximumAge: 0
 }
 );
 };

 // Add Address Submit
 const handleAddressSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!street.trim() || !city.trim() || !postalCode.trim() || !stateProv.trim() || !country.trim()) return;
 if (addresses.length >= 4) {
 alert("Has alcanzado el límite máximo de 4 direcciones.");
 return;
 }
 await addAddress({
 recipient: recipient.trim() || user?.name || "Destinatario",
 street: street.trim(),
 city: city.trim(),
 state: stateProv.trim(),
 postalCode: postalCode.trim(),
 country: country.trim(),
 isDefault: addresses.length === 0,
 });
 setRecipient("");
 setStreet("");
 setCity("");
 setStateProv("");
 setPostalCode("");
 setCountry("España");
 setLocationError(null);
 setLocationSuccess(false);
 setShowAddressForm(false);
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
 landingBundle: prodLayoutType === 'landing' ? {
   enabled: prodLandingBundleEnabled,
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
 setEditLandingBundleEnabled(p.landingBundle?.enabled ?? true);
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
 landingBundle: editLayoutType === 'landing' ? {
   enabled: editLandingBundleEnabled,
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

// Update Settings
 const handleSaveSettings = async (e: React.FormEvent) => {
 e.preventDefault();
 setSettingsFeedback(null);
 setIsUpdatingSettings(true);

 try {
 if (editName && editName !== user.name) {
 const { error } = await updateUserName(editName);
 if (error) throw new Error(error);
 }
 if (newPass) {
 if (newPass.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
 const { error } = await updateUserPassword(newPass);
 if (error) throw new Error(error);
 setNewPass("");
 }

 setSettingsFeedback({ msg: "Configuración guardada correctamente.", type: "success" });
 } catch (err: unknown) {
 const message = err instanceof Error ? err.message : "Error al actualizar perfil.";
 setSettingsFeedback({ msg: message, type: "error" });
 } finally {
 setIsUpdatingSettings(false);
 }
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
 /* Custom sleek scrollbar for order details modal */
 .lumina-order-modal-scroll::-webkit-scrollbar {
 width: 6px;
 }
 .lumina-order-modal-scroll::-webkit-scrollbar-track {
 background: transparent;
 margin: 16px 0;
 }
 .lumina-order-modal-scroll::-webkit-scrollbar-thumb {
 background: rgba(140, 146, 118, 0.4);
 border-radius: 9999px;
 border: 1px solid transparent;
 transition: background 0.3s ease;
 }
 .lumina-order-modal-scroll::-webkit-scrollbar-thumb:hover {
 background: rgba(140, 146, 118, 0.85);
 }
 .dark .lumina-order-modal-scroll::-webkit-scrollbar-thumb {
 background: rgba(255, 255, 255, 0.22);
 }
 .dark .lumina-order-modal-scroll::-webkit-scrollbar-thumb:hover {
 background: rgba(255, 255, 255, 0.45);
 }
 .lumina-order-modal-scroll {
 scrollbar-width: thin;
 scrollbar-color: rgba(140, 146, 118, 0.4) transparent;
 }
 .dark .lumina-order-modal-scroll {
 scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
 }
 `}</style>
 <div className="theme-transition min-h-screen w-full max-w-full overflow-x-hidden bg-[#f3f4f6] dark:bg-[#202022] text-gray-900 dark:text-gray-100 flex p-3 md:p-6 lg:p-8 selection:bg-[#8c9276]/20">
 
 {/* 1. Left Vertical Icon Sidebar (Redesigned Elevated Dock) */}
 <aside className="sidebar-dock-nav w-16 md:w-20 bg-white/95 dark:bg-[#1e1e20]/95 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col items-center py-6 gap-6 justify-between shrink-0 mr-4 md:mr-6 self-stretch relative z-30">
 
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
   {orders.length > 0 && activeTab !== "orders" && (
     <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8c9276] ring-2 ring-white dark:ring-[#1e1e20]" />
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
 <main className="flex-1 flex flex-col min-w-0 max-w-7xl w-full mx-auto space-y-6">
 
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
 <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 dark:bg-[#202022]/95 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10/80 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.22)] p-4 z-[100] space-y-3 animate-fade-in text-xs pointer-events-auto">
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
 <span className="font-bold text-gray-900 dark:text-gray-100">${prod.price.toFixed(2)}</span>
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
 <div className="w-10 h-10 rounded-2xl bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center font-bold text-sm border border-[#8c9276]/20 shadow-sm dark:shadow-none">
 {formatCleanName(user.name).charAt(0).toUpperCase()}
 </div>
 <div className="hidden md:block text-left">
 <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-normal">{formatCleanName(user.name)}</p>
 <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${isAdmin ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
 {isAdmin ? "ADMINISTRADOR" : "CLIENTE"}
 </span>
 </div>
 </div>
 </div>
 </header>

 {/* Greeting Banner */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
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
 <button 
 onClick={() => setShowProductModal(true)}
 className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none shadow-gray-900/10 cursor-pointer"
 >
 <Plus className="w-4 h-4" /> Nuevo Producto
 </button>
 )}
 </div>

 {/* ========================================================================= */}
 {/* VIEW 1: OVERVIEW (MASTER BENTO GRID) */}
 {/* ========================================================================= */}
 {activeTab === "overview" && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
 
 {/* BENTO CARD 1: Financial Balance / Spendings (4 cols) */}
 <div className="lg:col-span-4 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-4">
 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
 {isAdmin ? "Valor Total del Catálogo" : "Gasto Acumulado en Compras"}
 </span>
 <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
 (isAdmin ? totalInventoryValue > 0 : totalUserSpend > 0) 
 ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
 : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#3a3a3c] border-gray-200 dark:border-white/10"
 }`}>
 {isAdmin ? `${products.length} piezas` : `${orders.length} pedidos`}
 </span>
 </div>
 <p className="text-4xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-2">
 ${(isAdmin ? totalInventoryValue : totalUserSpend).toFixed(2)}
 </p>
 <p className="text-xs text-gray-400">
 {isAdmin 
 ? `Precio promedio por pieza: $${averagePrice.toFixed(2)}` 
 : (orders.length === 0 ? "Sin compras registradas aún en esta cuenta" : "Suma real de todos los pedidos efectuados")}
 </p>
 </div>

 {/* Quick Actions */}
 <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex gap-3">
 <Link 
 href="/shop" 
 className="flex-1 py-3 px-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl text-xs font-semibold text-center hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
 >
 {isAdmin ? "Ver Catálogo" : "Explorar Tienda"}
 </Link>
 <button 
 onClick={() => setActiveTab("orders")}
 className="py-3 px-4 bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
 >
 Historial
 </button>
 </div>
 </div>

 {/* BENTO CARD 2: Quick Metrics 2x2 Grid (4 cols) */}
 <div className="lg:col-span-4 grid grid-cols-2 gap-4">
 
 {/* Box 1 (Orange/Coral Accent) */}
 <button 
 onClick={() => setActiveTab(isAdmin ? "catalog" : "orders")} 
 className="bg-gradient-to-br from-[#e07a3f] to-[#c75e24] p-5 rounded-[2rem] text-white dark:text-gray-900 shadow-md dark:shadow-none shadow-[#e07a3f]/15 flex flex-col justify-between text-left hover:scale-[1.02] transition-transform"
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-white/80 dark:text-gray-900/80">
 {isAdmin ? "Inventario" : "Mis Pedidos"}
 </span>
 <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-[#202022]/20 backdrop-blur-md flex items-center justify-center">
 <Package className="w-4 h-4 text-white dark:text-gray-900" />
 </div>
 </div>
 <div>
 <p className="text-3xl font-display font-bold">{isAdmin ? products.length : orders.length}</p>
 <p className="text-[10px] text-white/70 dark:text-gray-900/70 mt-1">
 {isAdmin ? `${discountPercentageOfCatalog}% con descuento` : (orders.length === 0 ? "Sin pedidos activos" : "Pedidos confirmados")}
 </p>
 </div>
 </button>

 {/* Box 2 (Nichos or Favoritos) */}
 <button 
 onClick={() => setActiveTab(isAdmin ? "niches" : "favorites")} 
 className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between text-left hover:scale-[1.02] transition-transform"
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
 {isAdmin ? "Nichos" : "Favoritos"}
 </span>
 <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#3a3a3c] flex items-center justify-center text-gray-700 dark:text-gray-300">
 {isAdmin ? <Layers className="w-4 h-4" /> : <Heart className="w-4 h-4 text-red-500" />}
 </div>
 </div>
 <div>
 <p className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
 {isAdmin ? categories.length : favorites.length}
 </p>
 <p className="text-[10px] text-gray-400 mt-1">
 {isAdmin 
 ? `${emptyCategories.length} sin existencias` 
 : (favorites.length === 0 ? "Ninguno guardado" : "En tu lista de deseos")}
 </p>
 </div>
 </button>

 {/* Box 3 */}
 <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
 {isAdmin ? "Rebajas" : "Lumina Puntos"}
 </span>
 <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#3a3a3c] flex items-center justify-center text-gray-700 dark:text-gray-300">
 <Sparkles className="w-4 h-4 text-[#8c9276]" />
 </div>
 </div>
 <div>
 <p className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
 {isAdmin ? `${discountedCount}` : `${loyaltyPoints} pts`}
 </p>
 <p className={`text-[10px] font-semibold mt-1 ${isAdmin ? "text-amber-700" : loyaltyTier.color}`}>
 {isAdmin ? `${discountPercentageOfCatalog}% del catálogo` : loyaltyTier.name}
 </p>
 </div>
 </div>

 {/* Box 4 */}
 <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
 {isAdmin ? "Ventas Brutas" : "Tarjetas"}
 </span>
 <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#3a3a3c] flex items-center justify-center text-gray-700 dark:text-gray-300">
 <CreditCard className="w-4 h-4 text-[#8c9276]" />
 </div>
 </div>
 <div>
 <p className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
 {isAdmin ? `$${totalUserSpend.toFixed(0)}` : cards.length}
 </p>
 <p className="text-[10px] text-gray-400 mt-1">
 {isAdmin ? `${orders.length} ventas procesadas` : (cards.length === 0 ? "Sin métodos de pago" : `${cards.length} activa(s)`)}
 </p>
 </div>
 </div>
 </div>

 {/* BENTO CARD 3: REAL DYNAMIC CHART (4 cols) */}
 <div className="lg:col-span-4 min-w-0 max-w-full bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden">
 <div className="flex items-center justify-between mb-4">
 <div className="min-w-0 pr-2">
 <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
 {isAdmin ? "Inventario por Nicho" : "Frecuencia de Compras"}
 </h3>
 <p className="text-xs text-gray-500 dark:text-gray-400 truncate transition-all duration-200">
 {isAdmin 
 ? (hoveredNicheIdx !== null && categoryDistributionData[hoveredNicheIdx] 
 ? `${categoryDistributionData[hoveredNicheIdx].category}: ${categoryDistributionData[hoveredNicheIdx].count} piezas (${categoryDistributionData[hoveredNicheIdx].pctOfTotal}% del catálogo)`
 : "Volumen real de piezas por categoría") 
 : (hoveredMonthIdx !== null && monthlySpendData[hoveredMonthIdx]
 ? `${monthlySpendData[hoveredMonthIdx].month}: $${monthlySpendData[hoveredMonthIdx].total.toFixed(2)} gastados`
 : "Gastos calculados por mes (2026)")}
 </p>
 </div>
 <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-[#3a3a3c] rounded-lg text-gray-600 dark:text-gray-400 shrink-0 transition-all duration-200">
 {isAdmin 
 ? (hoveredNicheIdx !== null && categoryDistributionData[hoveredNicheIdx]
 ? `${categoryDistributionData[hoveredNicheIdx].count} piezas`
 : `${products.length} Total`)
 : (hoveredMonthIdx !== null && monthlySpendData[hoveredMonthIdx]
 ? `$${monthlySpendData[hoveredMonthIdx].total.toFixed(0)}`
 : "Semestre")}
 </span>
 </div>

 {/* Visual Dynamic Bar Chart with Decoupled Anchored Labels and Smooth Column Hover Expansion */}
 <div className="relative w-full my-auto">
 <div 
 onMouseLeave={isAdmin ? handleNicheContainerLeave : handleMonthContainerLeave}
 className={`flex items-end h-40 pt-7 pb-1 px-1 overflow-x-auto overflow-y-hidden select-none cursor-grab active:cursor-grabbing ${
 categoryDistributionData.length <= 4 
 ? "justify-around gap-3" 
 : categoryDistributionData.length <= 7 
 ? "justify-start sm:justify-between gap-2.5" 
 : "justify-start gap-2"
 }`}
 style={{
 scrollbarWidth: "thin",
 scrollbarColor: "rgba(156, 163, 175, 0.4) transparent"
 }}
 onWheel={(e) => {
 if (e.deltaY !== 0 && categoryDistributionData.length > 4) {
 e.currentTarget.scrollLeft += e.deltaY;
 }
 }}
 >
 {isAdmin ? (
 categoryDistributionData.map((bar, idx) => {
 const isHovered = hoveredNicheIdx === idx;
 const hasItems = bar.count > 0;
 
 // Stable, fixed width per column with zero hover expansion to prevent jitter/jumping:
 const widthClass = categoryDistributionData.length <= 4
 ? "flex-1 min-w-[3.5rem] max-w-[5.5rem]"
 : categoryDistributionData.length <= 7
 ? "w-14 shrink-0"
 : "w-12 shrink-0";

 return (
 <div 
 key={idx} 
 onMouseEnter={() => handleNicheMouseEnter(idx)}
 onMouseLeave={handleNicheMouseLeave}
 className={`flex flex-col items-center h-full justify-between group cursor-pointer relative ${widthClass} z-10`}
 >
 {/* 1. Bar Area (bounded in flex-1, bar grows upwards with capped max 82% height) */}
 <div className="relative w-full flex-1 flex flex-col justify-end items-center px-1">
 
 {/* Floating Popover / Tooltip when Hovered */}
 {isHovered && (
 <div className="absolute -top-7 z-30 flex flex-col items-center pointer-events-none animate-fade-in">
 <div className="bg-gray-950 dark:bg-white text-white dark:text-gray-950 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-lg border border-white/10 dark:border-gray-800 whitespace-nowrap flex items-center gap-1">
 <span className={`w-1.5 h-1.5 rounded-full ${hasItems ? "bg-[#e07a3f]" : "bg-gray-400"}`} />
 <span>{bar.count}</span>
 <span className="text-gray-400 dark:text-gray-600 font-normal">({bar.pctOfTotal}%)</span>
 </div>
 <div className="w-1.5 h-1 bg-gray-950 dark:bg-white rotate-45 -mt-0.5" />
 </div>
 )}

 {/* Standard count text when NOT hovered */}
 {!isHovered && (
 <span className="text-[10px] font-bold text-gray-400 mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
 {bar.count}
 </span>
 )}

 {/* The Bar itself */}
 <div 
 className={`w-full rounded-2xl transition-all duration-200 ${
 hasItems 
 ? isHovered 
 ? "bg-gradient-to-t from-[#c25e24] via-[#e07a3f] to-[#f59e0b] shadow-md shadow-[#e07a3f]/30 ring-2 ring-[#e07a3f]/40" 
 : "bg-[#e07a3f] shadow-2xs hover:brightness-105" 
 : "bg-gray-200/90 dark:bg-[#48484a]/90"
 }`} 
 style={{ height: `${bar.heightPct}%` }}
 />
 </div>

 {/* 2. Anchored Category Label Area (Fixed height, completely decoupled from bar height) */}
 <div className="w-full h-6 pt-1.5 flex items-center justify-center shrink-0 overflow-hidden">
 <span 
 className={`text-[10px] text-center transition-colors block truncate w-full ${
 isHovered ? "text-gray-950 dark:text-white font-bold" : "text-gray-400 font-medium"
 }`} 
 title={bar.category}
 >
 {bar.category}
 </span>
 </div>
 </div>
 );
 })
 ) : (
 monthlySpendData.map((bar, idx) => {
 const isHovered = hoveredMonthIdx === idx;
 return (
 <div 
 key={idx} 
 onMouseEnter={() => handleMonthMouseEnter(idx)}
 onMouseLeave={handleMonthMouseLeave}
 className="flex-1 min-w-[2.5rem] flex flex-col items-center h-full justify-between transition-all duration-300 group cursor-pointer relative"
 title={`${bar.month}: $${bar.total.toFixed(2)}`}
 >
 {/* 1. Bar Area */}
 <div className="relative w-full flex-1 flex flex-col justify-end items-center px-1">
 {isHovered && bar.hasData && (
 <div className="absolute -top-7 z-30 flex flex-col items-center pointer-events-none animate-fade-in">
 <div className="bg-gray-950 text-white dark:text-gray-900 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-lg dark:shadow-none border border-white/10 whitespace-nowrap">
 ${bar.total.toFixed(0)}
 </div>
 <div className="w-1.5 h-1 bg-gray-950 rotate-45 -mt-0.5" />
 </div>
 )}

 <div 
 className={`w-full rounded-2xl transition-all duration-300 ${
 bar.hasData 
 ? isHovered 
 ? "bg-gradient-to-t from-[#c25e24] via-[#e07a3f] to-[#f59e0b] shadow-md dark:shadow-none shadow-[#e07a3f]/30" 
 : "bg-[#e07a3f]" 
 : "bg-gray-200 dark:bg-[#48484a]"
 }`} 
 style={{ height: `${bar.heightPct}%` }}
 />
 </div>

 {/* 2. Anchored Label Area */}
 <div className="w-full h-6 pt-1.5 flex items-center justify-center shrink-0">
 <span className={`text-[10px] text-center ${isHovered ? "text-gray-950 font-bold" : "text-gray-400 font-medium"}`}>
 {bar.month}
 </span>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
 <span className="flex items-center gap-1.5 shrink-0">
 <span className="w-2 h-2 rounded-full bg-[#e07a3f]" /> 
 {isAdmin ? "Con existencias" : "Compras registradas"}
 </span>
 <span className="text-gray-400 text-right truncate pl-2">
 {isAdmin 
 ? `${categories.length} nichos ${categoryDistributionData.length > 5 ? "• Pasa el cursor o desliza ↔" : "• Pasa el cursor para ver detalle"}` 
 : (orders.length === 0 ? "0 transacciones aún" : `${orders.length} pedidos`)}
 </span>
 </div>
 </div>

 {/* BENTO CARD 4: MY CARDS (Tarjetas Guardadas - 4 cols) */}
 <div className="lg:col-span-4 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
 <CreditCard className="w-4 h-4 text-[#8c9276]" /> Mis Tarjetas ({cards.length})
 </h3>
 <button 
 onClick={() => setShowCardModal(true)}
 className="text-xs font-semibold text-[#8c9276] hover:underline flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" /> Agregar
 </button>
 </div>

 {/* Realistic Cards Stack or Empty State */}
 {cards.length === 0 ? (
 <div className="border-2 border-dashed border-gray-200/80 dark:border-white/10/80 rounded-3xl p-6 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 dark:bg-[#2a2a2c]/40 my-auto">
 <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5">
 <CreditCard className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Sin tarjetas guardadas</h4>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed max-w-[200px] mx-auto">
 Añade una tarjeta para pagar tus piezas con un solo clic.
 </p>
 </div>
 <button 
 onClick={() => setShowCardModal(true)}
 className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
 >
 + Vincular Tarjeta
 </button>
 </div>
 ) : (
 <div className="space-y-3">
 {cards.map((c, index) => {
 const isDark = index % 2 === 0;
 return (
 <div 
 key={c.id} 
 className={`p-5 rounded-2xl relative overflow-hidden transition-all hover:scale-[1.01] ${
 isDark 
 ? "bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white dark:text-gray-900 shadow-md dark:shadow-none shadow-black/10" 
 : "bg-gradient-to-tr from-[#d97736] to-[#b8541c] text-white dark:text-gray-900 shadow-md dark:shadow-none shadow-[#d97736]/15"
 }`}
 >
 <div className="flex items-center justify-between mb-6">
 <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-white/20 dark:bg-[#202022]/20 backdrop-blur-md">
 {c.isDefault ? "Predeterminada" : "Activa"}
 </span>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold tracking-wider">{c.type.toUpperCase()}</span>
 <button 
 onClick={() => removeCard(c.id)} 
 className="text-white/60 dark:text-gray-900/60 hover:text-white dark:hover:text-gray-900 transition-colors p-1"
 title="Eliminar tarjeta"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 <p className="font-mono text-sm tracking-widest font-semibold mb-3">
 {c.number}
 </p>

 <div className="flex items-center justify-between text-[11px] text-white/80 dark:text-gray-900/80">
 <span>{c.holder}</span>
 <span>EXP {c.exp}</span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
 <p className="text-[11px] text-gray-400">
 Cifrado bancario AES-256
 </p>
 <button 
 onClick={() => setActiveTab("cards")} 
 className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline"
 >
 Gestionar billetera &rarr;
 </button>
 </div>
 </div>

 {/* BENTO CARD 5: RECENT ACTIVITIES / ORDERS (8 cols) */}
 <div className="lg:col-span-8 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
 {isAdmin ? "Pedidos Recientes de la Tienda" : "Actividades & Pedidos Recientes"}
 </h3>
 <p className="text-xs text-gray-400">
 {isAdmin ? "Supervisión de compras de clientes" : "Trazabilidad de tus envíos"}
 </p>
 </div>
 {orders.length > 0 && (
 <button 
 onClick={() => setActiveTab("orders")} 
 className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline"
 >
 Ver todos ({orders.length}) &rarr;
 </button>
 )}
 </div>

 {/* Orders Table or Empty State */}
 {orders.length === 0 ? (
 <div className="py-12 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 dark:bg-[#2a2a2c]/40 rounded-2xl border border-gray-100 dark:border-white/5 my-auto">
 <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5">
 <ShoppingBag className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">No hay pedidos registrados</h4>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-sm">
 {isAdmin 
 ? "Aún no se han recibido compras de clientes en la tienda." 
 : "Todavía no has realizado compras. Al hacer tu primer pedido, aquí podrás seguir su entrega paso a paso."}
 </p>
 </div>
 <Link 
 href="/shop" 
 className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
 >
 Explorar Catálogo
 </Link>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 uppercase tracking-wider font-semibold">
 <th className="pb-3 px-2">ID Pedido</th>
 {isAdmin && <th className="pb-3 px-2">Cliente</th>}
 <th className="pb-3 px-2">Concepto</th>
 <th className="pb-3 px-2">Monto</th>
 <th className="pb-3 px-2">Estado</th>
 <th className="pb-3 px-2">Fecha / Hora</th>
 <th className="pb-3 px-2 text-right">Detalle</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {orders.slice(0, 4).map((ord) => (
 <tr key={ord.id} className="hover:bg-gray-50/50 dark:hover:bg-[#2c2c2e]/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(ord)}>
 <td className="py-3.5 px-2 font-mono font-semibold text-gray-900 dark:text-gray-100">{ord.id}</td>
 {isAdmin && (
 <td className="py-3.5 px-2">
 <p className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[130px]">{ord.customerName || "Cliente Lumina"}</p>
 <p className="text-[10px] text-gray-400 truncate max-w-[130px]">{ord.customerEmail || "cliente@lumina.com"}</p>
 </td>
 )}
 <td className="py-3.5 px-2 font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#3a3a3c] flex items-center justify-center text-gray-600 dark:text-gray-400">
 <Package className="w-3.5 h-3.5" />
 </div>
 <span>{ord.items.length > 0 ? `${ord.items.length} pieza(s) Lumina` : "Compra Lumina"}</span>
 </td>
 <td className="py-3.5 px-2 font-bold text-gray-900 dark:text-gray-100">${ord.total.toFixed(2)}</td>
 <td className="py-3.5 px-2" onClick={(e) => e.stopPropagation()}>
 {isAdmin ? (
 <div className="relative inline-block">
 <select 
 value={ord.status}
 onChange={(e) => updateOrderStatus(ord.id, e.target.value as Order['status'])}
 className={`appearance-none text-[11px] font-bold px-2.5 py-1 pr-6 rounded-full cursor-pointer outline-none border transition-all ${
 ord.status === "Entregado" 
 ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
 : ord.status === "Enviado" 
 ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" 
 : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
 }`}
 >
 <option value="Procesando">Procesando</option>
 <option value="Enviado">Enviado</option>
 <option value="Entregado">Entregado</option>
 </select>
 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
 <svg className="h-3 w-3 text-current opacity-70" viewBox="0 0 20 20" fill="currentColor">
 <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
 </svg>
 </div>
 </div>
 ) : (
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
 ord.status === "Entregado" 
 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
 : ord.status === "Enviado" 
 ? "bg-blue-50 text-blue-700 border border-blue-100" 
 : "bg-amber-50 text-amber-700 border border-amber-100"
 }`}>
 <span className={`w-1.5 h-1.5 rounded-full ${
 ord.status === "Entregado" ? "bg-emerald-500" : ord.status === "Enviado" ? "bg-blue-500" : "bg-amber-500"
 }`} />
 {ord.status}
 </span>
 )}
 </td>
 <td className="py-3.5 px-2 text-gray-500 dark:text-gray-400">
 <span className="block font-medium text-gray-800 dark:text-gray-200">{ord.date}</span>
 {ord.time && <span className="block text-[10px] text-gray-400">{ord.time}</span>}
 </td>
 <td className="py-3.5 px-2 text-right">
 <button 
 onClick={(e) => { e.stopPropagation(); setSelectedOrder(ord); }} 
 className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors"
 title="Ver detalles"
 >
 <Eye className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-400">
 <span>{orders.length === 0 ? "Registro limpio" : "Haz clic en un pedido para ver la trazabilidad"}</span>
 <span className="font-semibold text-gray-900 dark:text-gray-100">{orders.length} pedidos totales</span>
 </div>
 </div>

 {/* ADMIN ONLY: Empty Categories Warning */}
 {isAdmin && emptyCategories.length > 0 && (
 <div className="lg:col-span-12 bg-amber-50/90 backdrop-blur-md p-5 rounded-3xl border border-amber-200/80 shadow-sm dark:shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div className="flex items-start gap-3.5">
 <div className="w-10 h-10 rounded-2xl bg-a dark:bg-[#202022]mber-100 flex items-center justify-center text-amber-800 shrink-0">
 <AlertTriangle className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-amber-900">Aviso Inteligente de Inventario</h4>
 <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
 Los nichos <span className="font-semibold">{emptyCategories.join(", ")}</span> tienen 0 productos activos. 
 Te recomendamos publicar productos en ellos o retirarlos para que la tienda luzca llena.
 </p>
 </div>
 </div>
 <div className="flex flex-wrap gap-2 shrink-0">
 {emptyCategories.map((c) => (
 <button 
 key={c} 
 onClick={() => handleRequestDeleteNiche(c)}
 className="text-xs px-3 py-1.5 rounded-xl bg-amber-200/80 dark:bg-amber-900/40 hover:bg-amber-300 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold transition-colors flex items-center gap-1"
 >
 <Trash2 className="w-3.5 h-3.5" /> Quitar {c}
 </button>
 ))}
 </div>
 </div>
 )}

 </div>
 )}

 {/* ========================================================================= */}
 {/* VIEW 2: ORDERS & ACTIVITIES TAB */}
 {/* ========================================================================= */}
 {activeTab === "orders" && (
 <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Historial Completo de Pedidos</h2>
 <p className="text-xs text-gray-500 dark:text-gray-400">Trazabilidad en tiempo real, recibos y estados de envío.</p>
 </div>

 {/* Status Filter Tabs */}
 <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#3a3a3c] p-1 rounded-2xl overflow-x-auto">
 {["all", "Procesando", "Enviado", "Entregado"].map((st) => (
 <button 
 key={st}
 onClick={() => setOrderStatusFilter(st)}
 className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
 orderStatusFilter === st ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
 }`}
 >
 {st === "all" ? "Todos" : st}
 </button>
 ))}
 </div>
 </div>

 {/* Orders Table */}
 {filteredOrders.length === 0 ? (
 <div className="py-16 text-center space-y-3 bg-gray-50/50 dark:bg-[#2a2a2c]/50 rounded-2xl border border-gray-100 dark:border-white/5">
 <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5 mx-auto">
 <ShoppingBag className="w-6 h-6" />
 </div>
 <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No hay pedidos que coincidan</h3>
 <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
 {orders.length === 0 
 ? "Esta cuenta aún no ha realizado compras. Los pedidos que hagas se sincronizarán aquí." 
 : "No hay pedidos con el filtro de estado seleccionado."}
 </p>
 {orders.length === 0 && (
 <Link href="/shop" className="inline-block px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">
 Explorar Catálogo
 </Link>
 )}
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
 <th className="pb-3 px-3">ID Pedido</th>
 {isAdmin && <th className="pb-3 px-3">Cliente</th>}
 <th className="pb-3 px-3">Código Rastreo</th>
 <th className="pb-3 px-3">Artículos</th>
 <th className="pb-3 px-3">Total</th>
 <th className="pb-3 px-3">Estado</th>
 <th className="pb-3 px-3">Fecha / Hora</th>
 <th className="pb-3 px-3 text-right">Acción</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredOrders.map((ord) => (
 <tr key={ord.id} className="hover:bg-gray-50/70 dark:hover:bg-[#2c2c2e]/70 transition-colors">
 <td className="py-4 px-3 font-mono font-bold text-gray-900 dark:text-gray-100">{ord.id}</td>
 {isAdmin && (
 <td className="py-4 px-3">
 <p className="font-semibold text-gray-900 dark:text-gray-100">{ord.customerName || "Cliente Lumina"}</p>
 <p className="text-[10px] text-gray-400">{ord.customerEmail || "cliente@lumina.com"}</p>
 </td>
 )}
 <td className="py-4 px-3 font-mono text-gray-500 dark:text-gray-400">{ord.trackingNumber || "TRK-PENDIENTE"}</td>
 <td className="py-4 px-3 text-gray-700 dark:text-gray-300">
 {ord.items.length > 0 ? `${ord.items.length} producto(s)` : "1 artículo Lumina"}
 </td>
 <td className="py-4 px-3 font-bold text-gray-900 dark:text-gray-100">${ord.total.toFixed(2)}</td>
 <td className="py-4 px-3">
 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
 ord.status === "Entregado" 
 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
 : ord.status === "Enviado" 
 ? "bg-blue-50 text-blue-700 border border-blue-100" 
 : "bg-amber-50 text-amber-700 border border-amber-100"
 }`}>
 <span className={`w-1.5 h-1.5 rounded-full ${
 ord.status === "Entregado" ? "bg-emerald-500" : ord.status === "Enviado" ? "bg-blue-500" : "bg-amber-500"
 }`} />
 {ord.status}
 </span>
 </td>
 <td className="py-4 px-3 text-gray-500 dark:text-gray-400">
 <span className="block font-medium text-gray-800 dark:text-gray-200">{ord.date}</span>
 {ord.time && <span className="block text-[10px] text-gray-400">{ord.time}</span>}
 </td>
 <td className="py-4 px-3 text-right">
 <div className="flex items-center justify-end gap-2">
 {isAdmin && (
 <select 
 value={ord.status} 
 onChange={(e) => updateOrderStatus(ord.id, e.target.value as "Procesando" | "Enviado" | "Entregado")}
 className="text-[11px] font-semibold bg-gray-100 dark:bg-[#3a3a3c] rounded-lg px-2.5 py-1.5 outline-none border border-gray-200 dark:border-white/10 cursor-pointer"
 >
 <option value="Procesando">Procesando</option>
 <option value="Enviado">Enviado</option>
 <option value="Entregado">Entregado</option>
 </select>
 )}
 <button 
 onClick={() => setSelectedOrder(ord)} 
 className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"
 >
 <Eye className="w-3.5 h-3.5" /> Ver Detalle
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {/* ========================================================================= */}
 {/* VIEW 3: CARDS & WALLET TAB */}
 {/* ========================================================================= */}
 {activeTab === "cards" && (
 <div className="space-y-6 animate-fade-in">
 <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
 <CreditCard className="w-5 h-5 text-[#8c9276]" /> Gestión de Billetera & Métodos de Pago
 </h2>
 <p className="text-xs text-gray-500 dark:text-gray-400">Tus datos están protegidos con cifrado de grado militar.</p>
 </div>
 <button 
 onClick={() => setShowCardModal(true)} 
 className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none"
 >
 <Plus className="w-4 h-4" /> Añadir Tarjeta
 </button>
 </div>

 {/* Cards Grid or Empty State */}
 {cards.length === 0 ? (
 <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 dark:bg-[#2a2a2c]/40">
 <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5">
 <CreditCard className="w-7 h-7" />
 </div>
 <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No hay tarjetas de crédito o débito guardadas</h3>
 <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
 Agrega tu primera tarjeta para agilizar tus compras en Lumina Home. No almacenamos tu código CVV.
 </p>
 <button 
 onClick={() => setShowCardModal(true)}
 className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
 >
 + Registrar Tarjeta
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {cards.map((c, index) => {
 const isDark = index % 2 === 0;
 return (
 <div 
 key={c.id} 
 className={`p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between h-52 shadow-lg dark:shadow-none transition-transform hover:scale-[1.02] ${
 isDark 
 ? "bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white dark:text-gray-900 shadow-black/15" 
 : "bg-gradient-to-tr from-[#d97736] to-[#b8541c] text-white dark:text-gray-900 shadow-[#d97736]/20"
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-6 bg-yellow-400/80 rounded-md shadow-inner border border-yellow-300" />
 {c.isDefault && (
 <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 dark:bg-[#202022]/25">
 Principal
 </span>
 )}
 </div>
 <span className="text-xs font-bold tracking-widest">{c.type.toUpperCase()}</span>
 </div>

 <p className="font-mono text-lg tracking-[0.25em] font-semibold my-2">
 {c.number}
 </p>

 <div className="flex items-center justify-between text-xs text-white/90 dark:text-gray-900/90">
 <div>
 <p className="text-[9px] uppercase tracking-wider text-white/60 dark:text-gray-900/60">Titular</p>
 <p className="font-semibold">{c.holder}</p>
 </div>
 <div className="text-right">
 <p className="text-[9px] uppercase tracking-wider text-white/60 dark:text-gray-900/60">Expira</p>
 <p className="font-semibold">{c.exp}</p>
 </div>
 </div>

 <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px]">
 {!c.isDefault ? (
 <button 
 onClick={() => setDefaultCard(c.id)} 
 className="text-white/80 dark:text-gray-900/80 hover:text-white dark:hover:text-gray-900 underline underline-offset-2"
 >
 Hacer principal
 </button>
 ) : (
 <span className="text-white/70 dark:text-gray-900/70">Tarjeta por defecto</span>
 )}
 <button 
 onClick={() => removeCard(c.id)} 
 className="text-red-200 hover:text-white dark:hover:text-gray-900 flex items-center gap-1"
 >
 <Trash2 className="w-3.5 h-3.5" /> Eliminar
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* VIEW 4: FAVORITES TAB */}
 {/* ========================================================================= */}
 {activeTab === "favorites" && (
 <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
 <Heart className="w-5 h-5 text-red-500" /> Piezas Guardadas en Favoritos
 </h2>
 <p className="text-xs text-gray-500 dark:text-gray-400">Colección personal de artículos que has marcado con el corazón.</p>
 </div>
 <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#3a3a3c] px-3 py-1 rounded-full">
 {favoritedProductsList.length} guardados
 </span>
 </div>

 {favoritedProductsList.length === 0 ? (
 <div className="py-16 text-center space-y-4 bg-gray-50/50 dark:bg-[#2a2a2c]/50 rounded-3xl border border-gray-100 dark:border-white/5">
 <div className="w-14 h-14 rounded-full bg-red-50 text-red-400 mx-auto flex items-center justify-center">
 <Heart className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Aún no tienes favoritos guardados</h3>
 <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
 Explora nuestra tienda y haz clic en el corazón de cualquier pieza para guardarla aquí.
 </p>
 <Link href="/shop" className="inline-block px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none">
 Explorar Catálogo
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {favoritedProductsList.map((prod) => (
 <div key={prod.id} className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-100 dark:border-white/5 p-4 shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none transition-shadow flex flex-col justify-between">
 <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-50 dark:bg-[#2a2a2c]">
 <Image 
 src={prod.imageUrl} 
 alt={prod.title} 
 fill 
 className="object-cover"
 />
 <button 
 onClick={() => toggleFavorite(prod.id)}
 className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-[#202022]/90 text-red-500 shadow-sm dark:shadow-none hover:scale-110 transition-transform"
 title="Quitar de favoritos"
 >
 <Heart className="w-4 h-4 fill-red-500" />
 </button>
 </div>

 <div>
 <p className="text-[11px] font-bold text-[#8c9276] uppercase tracking-wider">{prod.category}</p>
 <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mt-0.5 line-clamp-1">{prod.title}</h4>
 <p className="font-bold text-gray-900 dark:text-gray-100 text-base mt-1">${prod.price.toFixed(2)}</p>
 </div>

 <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex gap-2">
 <Link 
 href={`/product/${prod.id}`}
 className="flex-1 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3a3a3c] rounded-xl hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
 >
 Ver Ficha
 </Link>
 <button 
 onClick={() => {
 addItem(prod);
 setCartOpen(true);
 }}
 className="py-2 px-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
 title="Añadir a la bolsa"
 >
 Comprar
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* ========================================================================= */}
 {/* VIEW 5: ADMIN CATALOG & INVENTORY TAB */}
 {/* ========================================================================= */}
 {activeTab === "catalog" && isAdmin && (
 <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
 <Package className="w-5 h-5 text-[#8c9276]" /> Control Total del Inventario
 </h2>
 <p className="text-xs text-gray-500 dark:text-gray-400">
 {products.length} productos activos • Valor total: ${totalInventoryValue.toFixed(2)}
 </p>
 </div>

 <div className="flex items-center gap-3">
 <select 
 value={catalogCategoryFilter} 
 onChange={e => setCatalogCategoryFilter(e.target.value)}
 className="text-xs font-semibold bg-gray-100 dark:bg-[#3a3a3c] px-3 py-2 rounded-xl outline-none border border-gray-200 dark:border-white/10"
 >
 <option value="all">Todas las categorías</option>
 {categories.map(c => <option key={c} value={c}>{c}</option>)}
 </select>

 <button 
 onClick={() => setShowProductModal(true)}
 className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-800 shadow-sm dark:shadow-none"
 >
 <Plus className="w-4 h-4" /> Crear Producto
 </button>
 </div>
 </div>

 {/* Inventory Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
 <th className="pb-3 px-2">Producto</th>
 <th className="pb-3 px-2">Categoría</th>
 <th className="pb-3 px-2">Precio</th>
 <th className="pb-3 px-2">Descuento</th>
 <th className="pb-3 px-2">Badge</th>
 <th className="pb-3 px-2 text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredCatalog.map(p => (
 <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-[#2c2c2e]/70 transition-colors">
 <td className="py-3 px-2 flex items-center gap-3">
 <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#3a3a3c] shrink-0">
 <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
 </div>
 <div>
 <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{p.title}</p>
 <p className="text-[11px] text-gray-400 italic">{p.titleHighlight || "Estándar"}</p>
 </div>
 </td>
 <td className="py-3 px-2">
 <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 font-medium text-[11px]">
 {p.category}
 </span>
 </td>
 <td className="py-3 px-2 font-bold text-gray-900 dark:text-gray-100">${p.price.toFixed(2)}</td>
 <td className="py-3 px-2">
 {p.discount ? (
 <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
 {p.discount}
 </span>
 ) : (
 <span className="text-gray-400">-</span>
 )}
 </td>
 <td className="py-3 px-2">
 {p.badge ? (
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
 isAgotadoBadge(p.badge)
 ? "bg-red-50 text-red-600 border border-red-200"
 : "bg-amber-50 text-amber-800 border border-amber-200"
 }`}>
 {p.badge}
 </span>
 ) : (
 <span className="text-gray-400">-</span>
 )}
 </td>
 <td className="py-3 px-2 text-right">
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => handleOpenEditProduct(p)}
 className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
 title="Editar producto"
 >
 <Pencil className="w-4 h-4" />
 </button>
 <Link 
 href={`/product/${p.id}`}
 className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] rounded-lg transition-colors"
 title="Ver en tienda"
 >
 <ExternalLink className="w-4 h-4" />
 </Link>
 <button 
 onClick={() => {
   setDeleteProductError(null);
   setProductToDelete(p);
 }}
 className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
 title="Eliminar producto"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* VIEW 6: ADMIN NICHES TAB */}
          {/* ========================================================================= */}
          {activeTab === "niches" && isAdmin && (
            <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#8c9276]" /> Gestión de Nichos & Colecciones
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Personaliza el menú flotante interactivo de la tienda, crea nuevos nichos de mercado o elimina aquellos sin existencias.</p>
              </div>

              {/* ========================================================================= */}
              {/* SIMULADOR INTERACTIVO LIQUID GLASS PARA EL MENÚ DE INICIO */}
              {/* ========================================================================= */}
              <div className="rounded-[2.5rem] bg-gradient-to-br from-stone-50 via-stone-100/70 to-stone-200/50 dark:from-[#18181a] dark:via-[#1c1c1f] dark:to-[#141416] p-6 sm:p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-none space-y-8 overflow-hidden relative">
                
                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8c9276]/15 text-[#636852] dark:text-[#b8be9e] text-[11px] font-semibold tracking-wide uppercase mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Simulador en Tiempo Real
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                      Menú de Pastilla Liquid Glass (Inicio)
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                      Previsualiza de forma interactiva el menú flotante que verán tus clientes en la tienda. Modifica los dos nichos destacados, cambia sus nombres y selecciona de entre más de 25 iconos en el slider.
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetNicheSlots}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all shadow-sm"
                      title="Restablecer a Iluminación y Textiles"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restablecer
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveNicheSlots}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-all shadow-md active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Guardar en Inicio
                    </button>
                  </div>
                </div>

                {/* Feedback banner if saved */}
                {nicheSaveFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 font-medium shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{nicheSaveFeedback}</span>
                  </motion.div>
                )}

                {/* PILL SIMULATOR CANVAS (Mimicking Storefront Floating Menu) */}
                <div className="relative rounded-3xl bg-gradient-to-b from-stone-200/50 via-stone-100/40 to-stone-200/30 dark:from-[#242428]/60 dark:via-[#1c1c1f]/40 dark:to-[#141416]/60 p-6 sm:p-10 border border-white/60 dark:border-white/5 flex flex-col items-center justify-center min-h-[160px] overflow-hidden backdrop-blur-md">
                  
                  {/* Subtle watermark background for context */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] select-none text-9xl font-display font-black tracking-widest text-gray-900 dark:text-white">
                    LUMINA
                  </div>

                  {/* Label indicator */}
                  <div className="absolute top-3 left-4 text-[10px] font-mono tracking-wider uppercase text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Vista previa interactiva (solo visual)
                  </div>

                  {/* The Replica of Header Pill */}
                  <div className="relative z-10 max-w-full overflow-x-auto py-2 px-1">
                    <div className="flex items-center justify-between p-2 rounded-full bg-white/60 dark:bg-[#1a1a1c]/80 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] select-none">
                      
                      {/* Logo Section */}
                      <div className="pl-4 pr-5 flex items-center gap-2 cursor-default">
                        <span className="font-display italic text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                          Lumina.
                        </span>
                      </div>

                      {/* Liquid Glass Navigation Tabs */}
                      <nav 
                        className="flex items-center gap-1 relative" 
                        onMouseLeave={() => setPreviewHoveredTab(null)}
                      >
                        {/* Tab 1: Inicio */}
                        <button
                          type="button"
                          onClick={() => setPreviewActiveTab("home")}
                          onMouseEnter={() => setPreviewHoveredTab("home")}
                          className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                            previewActiveTab === "home" ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {previewActiveTab === "home" && (
                            <motion.div
                              layoutId="preview-active-pill"
                              className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/20"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                          {previewActiveTab !== "home" && previewHoveredTab === "home" && (
                            <motion.div
                              layoutId="preview-hover-pill"
                              className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10"
                            />
                          )}
                          <HomeIcon className="relative z-10 w-4 h-4" />
                          <span className="relative z-10">Inicio</span>
                        </button>

                        {/* Tab 2: Todo */}
                        <button
                          type="button"
                          onClick={() => setPreviewActiveTab("shop")}
                          onMouseEnter={() => setPreviewHoveredTab("shop")}
                          className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                            previewActiveTab === "shop" ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {previewActiveTab === "shop" && (
                            <motion.div
                              layoutId="preview-active-pill"
                              className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/20"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                          {previewActiveTab !== "shop" && previewHoveredTab === "shop" && (
                            <motion.div
                              layoutId="preview-hover-pill"
                              className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10"
                            />
                          )}
                          <Sparkles className="relative z-10 w-4 h-4" />
                          <span className="relative z-10">Todo</span>
                        </button>

                        {/* Tab 3: Nicho 1 Dinámico */}
                        {(() => {
                          const slot1 = nicheSlots[0] || DEFAULT_NICHE_SLOTS[0];
                          const IconComponent = getNicheIconByName(slot1.iconName);
                          const isSelectedTab = previewActiveTab === "niche1";
                          const isHovered = previewHoveredTab === "niche1";

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewActiveTab("niche1");
                                setActiveEditingSlot(1);
                              }}
                              onMouseEnter={() => setPreviewHoveredTab("niche1")}
                              className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                isSelectedTab ? "text-gray-900 dark:text-white font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              } ${activeEditingSlot === 1 ? "ring-2 ring-[#8c9276] ring-offset-2 ring-offset-transparent" : ""}`}
                              title="Haz clic para editar este nicho"
                            >
                              {isSelectedTab && (
                                <motion.div
                                  layoutId="preview-active-pill"
                                  className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/20"
                                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                              )}
                              {!isSelectedTab && isHovered && (
                                <motion.div
                                  layoutId="preview-hover-pill"
                                  className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10"
                                />
                              )}
                              <IconComponent className="relative z-10 w-4 h-4 text-[#8c9276]" />
                              <span className="relative z-10">{slot1.label || "Nicho 1"}</span>
                              {activeEditingSlot === 1 && (
                                <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#8c9276] -ml-1" />
                              )}
                            </button>
                          );
                        })()}

                        {/* Tab 4: Nicho 2 Dinámico */}
                        {(() => {
                          const slot2 = nicheSlots[1] || DEFAULT_NICHE_SLOTS[1];
                          const IconComponent = getNicheIconByName(slot2.iconName);
                          const isSelectedTab = previewActiveTab === "niche2";
                          const isHovered = previewHoveredTab === "niche2";

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewActiveTab("niche2");
                                setActiveEditingSlot(2);
                              }}
                              onMouseEnter={() => setPreviewHoveredTab("niche2")}
                              className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                isSelectedTab ? "text-gray-900 dark:text-white font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              } ${activeEditingSlot === 2 ? "ring-2 ring-[#8c9276] ring-offset-2 ring-offset-transparent" : ""}`}
                              title="Haz clic para editar este nicho"
                            >
                              {isSelectedTab && (
                                <motion.div
                                  layoutId="preview-active-pill"
                                  className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/20"
                                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                              )}
                              {!isSelectedTab && isHovered && (
                                <motion.div
                                  layoutId="preview-hover-pill"
                                  className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10"
                                />
                              )}
                              <IconComponent className="relative z-10 w-4 h-4 text-[#8c9276]" />
                              <span className="relative z-10">{slot2.label || "Nicho 2"}</span>
                              {activeEditingSlot === 2 && (
                                <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#8c9276] -ml-1" />
                              )}
                            </button>
                          );
                        })()}
                      </nav>

                      {/* Dummy Right Actions in Pill */}
                      <div className="flex items-center gap-2 pl-4 pr-2">
                        <div className="w-9 h-9 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="hidden sm:flex items-center relative">
                          <div className="h-9 rounded-full pl-9 pr-4 text-xs text-gray-400 bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 flex items-center">
                            <Search className="w-3.5 h-3.5 absolute left-3 text-gray-400" />
                            <span>Buscar...</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* NICHE SLOTS EDITORS (2 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Card Slot 1 */}
                  {(() => {
                    const slot = nicheSlots[0] || DEFAULT_NICHE_SLOTS[0];
                    const CurrentIcon = getNicheIconByName(slot.iconName);
                    const isSelected = activeEditingSlot === 1;

                    return (
                      <div 
                        onClick={() => setActiveEditingSlot(1)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected 
                            ? "bg-white dark:bg-[#202022] border-[#8c9276] shadow-lg ring-2 ring-[#8c9276]/20" 
                            : "bg-white/60 dark:bg-[#1a1a1c]/60 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#8c9276] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Seleccionado para editar
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 border border-[#8c9276]/30 flex items-center justify-center text-[#8c9276] shrink-0">
                            <CurrentIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c9276] font-bold">
                              Nicho Destacado 1
                            </span>
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                              {slot.label || "Sin título"}
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              Icono actual: <span className="font-mono font-medium">{slot.iconName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/5">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Etiqueta / Texto en la Pastilla:
                            </label>
                            <input
                              type="text"
                              value={slot.label}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateNicheSlot(0, { label: e.target.value })}
                              placeholder="Ej: Iluminación"
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 dark:bg-[#151517] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8c9276]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Filtrar por Categoría de Tienda:
                            </label>
                            <select
                              value={slot.category}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateNicheSlot(0, { category: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 dark:bg-[#151517] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8c9276]"
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card Slot 2 */}
                  {(() => {
                    const slot = nicheSlots[1] || DEFAULT_NICHE_SLOTS[1];
                    const CurrentIcon = getNicheIconByName(slot.iconName);
                    const isSelected = activeEditingSlot === 2;

                    return (
                      <div 
                        onClick={() => setActiveEditingSlot(2)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected 
                            ? "bg-white dark:bg-[#202022] border-[#8c9276] shadow-lg ring-2 ring-[#8c9276]/20" 
                            : "bg-white/60 dark:bg-[#1a1a1c]/60 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#8c9276] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Seleccionado para editar
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 border border-[#8c9276]/30 flex items-center justify-center text-[#8c9276] shrink-0">
                            <CurrentIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c9276] font-bold">
                              Nicho Destacado 2
                            </span>
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                              {slot.label || "Sin título"}
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              Icono actual: <span className="font-mono font-medium">{slot.iconName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/5">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Etiqueta / Texto en la Pastilla:
                            </label>
                            <input
                              type="text"
                              value={slot.label}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateNicheSlot(1, { label: e.target.value })}
                              placeholder="Ej: Textiles"
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 dark:bg-[#151517] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8c9276]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Filtrar por Categoría de Tienda:
                            </label>
                            <select
                              value={slot.category}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateNicheSlot(1, { category: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 dark:bg-[#151517] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8c9276]"
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ICON SLIDER & PICKER */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#8c9276]" />
                        Catálogo de Iconos para el Nicho {activeEditingSlot} ({activeEditingSlot === 1 ? nicheSlots[0]?.label || "Nicho 1" : nicheSlots[1]?.label || "Nicho 2"})
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Desliza horizontalmente con las flechas y haz clic en el icono deseado para aplicarlo inmediatamente.
                      </p>
                    </div>

                    {/* Slider Navigation Arrows */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => scrollIconSlider("left")}
                        className="w-8 h-8 rounded-full bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                        title="Desplazar a la izquierda"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollIconSlider("right")}
                        className="w-8 h-8 rounded-full bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                        title="Desplazar a la derecha"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* The Scrollable Icons Track */}
                  <div 
                    ref={iconSliderRef}
                    className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {NICHE_ICONS_CATALOG.map((item) => {
                      const Icon = item.icon;
                      const currentSlotIcon = activeEditingSlot === 1 ? nicheSlots[0]?.iconName : nicheSlots[1]?.iconName;
                      const isIconSelected = currentSlotIcon?.toLowerCase() === item.name.toLowerCase();

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectIconForActiveSlot(item.name)}
                          className={`group flex flex-col items-center justify-center min-w-[94px] max-w-[94px] p-3 rounded-2xl border transition-all shrink-0 select-none ${
                            isIconSelected
                              ? "bg-[#8c9276] text-white border-[#8c9276] shadow-md scale-105"
                              : "bg-white dark:bg-[#202022] border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#8c9276]/60 hover:shadow-sm"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${
                            isIconSelected ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200"
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[11px] font-semibold text-center truncate w-full ${
                            isIconSelected ? "text-white" : "text-gray-800 dark:text-gray-200"
                          }`}>
                            {item.label}
                          </span>
                          <span className={`text-[9px] font-mono truncate w-full text-center ${
                            isIconSelected ? "text-white/80" : "text-gray-400 dark:text-gray-500"
                          }`}>
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* ---------------------------------------------------- */}
              {/* Category Management */}
              {/* ---------------------------------------------------- */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    Añadir Categoría al Catálogo
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Crea nuevos nichos de mercado o elimina aquellos sin existencias.</p>
                </div>

                {/* Add Category Form */}
                <form onSubmit={handleAddCategorySubmit} className="flex gap-3 max-w-md">
                  <input 
                    type="text"
                    value={newCatInput} 
                    onChange={e => setNewCatInput(e.target.value)}
                    placeholder="Nombre del nuevo nicho (ej: Cerámica)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
 <button 
 type="submit" 
 className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
 >
 + Añadir Nicho
 </button>
 </form>

 {/* Categories Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
 {categories.map(cat => {
 const count = products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
 const isEmpty = count === 0;

 return (
 <div 
 key={cat} 
 className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
 isEmpty ? "bg-amber-50/70 border-amber-200" : "bg-white dark:bg-[#202022] border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none"
 }`}
 >
 <div>
 <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{cat}</h4>
 <p className={`text-xs mt-0.5 ${isEmpty ? "text-amber-700 font-semibold" : "text-gray-400"}`}>
 {count} {count === 1 ? "producto" : "productos"} activos
 </p>
 </div>

 <button 
 onClick={() => handleRequestDeleteNiche(cat)}
 className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
 title="Eliminar nicho"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 );
 })}
 </div>
              </div>

 {/* ---------------------------------------------------- */}
 {/* Marketing Badges Section */}
 {/* ---------------------------------------------------- */}
 <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
 <Tag className="w-5 h-5 text-[#8c9276]" /> Badges & Etiquetas de Marketing
 </h2>
 <p className="text-xs text-gray-500 dark:text-gray-400">
 Crea o elimina distintivos comerciales para destacar tus piezas (ej: Más Vendido, Bestseller, Edición Limitada).
 </p>
 </div>

 {/* Add Badge Form */}
 <form onSubmit={handleAddBadgeSubmit} className="flex gap-3 max-w-md">
 <input 
 type="text" 
 value={newBadgeInput} 
 onChange={e => setNewBadgeInput(e.target.value)}
 placeholder="Nombre del nuevo badge (ej: Edición Limitada)"
 className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 <button 
 type="submit" 
 className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none shrink-0"
 >
 + Añadir Badge
 </button>
 </form>

 {/* Badges Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
 {badges.map(badge => {
 const count = products.filter(p => p.badge?.toLowerCase() === badge.toLowerCase()).length;

 return (
 <div 
 key={badge} 
 className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-between"
 >
 <div className="flex items-center gap-2.5">
 <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
 isAgotadoBadge(badge)
 ? "bg-red-50 text-red-600 border border-red-200"
 : "bg-amber-50 text-amber-900 border border-amber-200"
 }`}>
 {badge}
 </span>
 <span className="text-[11px] text-gray-400">
 {count} {count === 1 ? "producto" : "productos"}
 </span>
 </div>

 <button 
 onClick={() => deleteBadge(badge)}
 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
 title="Eliminar badge"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* VIEW: RADAR GEOGRÁFICO DE CLIENTES & ANALÍTICA EN VIVO */}
 {/* ========================================================================= */}
 {activeTab === "analytics" && isAdmin && (
 <RadarErrorBoundary>
 <AnalyticsRadarView 
 user={user}
 addresses={addresses}
 orders={orders}
 products={products}
 categories={categories}
 onNavigateToAddresses={() => {
 setActiveTab("settings");
 setShowAddressForm(true);
 }}
 />
 </RadarErrorBoundary>
 )}

 {/* ========================================================================= */}
 {/* VIEW 7: SETTINGS & ADDRESS TAB */}
 {/* ========================================================================= */}
 {activeTab === "settings" && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
 
 {/* Account & Credentials (7 cols) */}
 <div className="lg:col-span-7 bg-white/90 dark:bg-[#202022]/5 backdrop-blur-3xl p-8 md:p-10 rounded-[3rem] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-10 relative overflow-hidden">
 
 {/* Decorative glass glow */}
   <div>
 <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
 <Settings className="w-6 h-6 text-[#8c9276]" /> Ajustes de Cuenta & Sistema
 </h2>
 <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza tu experiencia, apariencia visual y seguridad de acceso.</p>
 </div>

 {settingsFeedback && (
 <div className={`p-3.5 rounded-2xl text-xs font-semibold text-center border ${
 settingsFeedback.type === "success" 
 ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-100 dark:border-emerald-500/30" 
 : "bg-red-50 dark:bg-red-500/20 text-red-800 dark:text-red-200 border-red-100 dark:border-red-500/30"
 }`}>
 {settingsFeedback.msg}
 </div>
 )}

 {/* Theme & Appearance */}
 <div className="p-6 rounded-[2rem] bg-gray-50/5 dark:bg-black/20 border border-gray-100 dark:border-white/5 relative z-10">
 <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Apariencia del Sistema</h3>
 <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Elige el modo visual. El modo automático usará una elegante paleta oscura a partir de las 18:00h para proteger tu vista.</p>
 <div className="flex justify-center">
 <ThemeToggle />
 </div>
</div>

 {/* Form */}
 <form onSubmit={handleSaveSettings} className="space-y-6 relative z-10">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Nombre Completo</label>
 <div className="relative">
 <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
 <input 
 type="text" 
 value={editName}
 onChange={e => setEditName(e.target.value)}
 className="w-full pl-11 pr-4 py-3.5 rounded-2xl dark: border border-gray-200 dark:border-white/10 text-sm dark: focus:outline-none focus:ring-2 focus:ring-[#8c9276] transition-all bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Correo Electrónico (No editable)</label>
 <input 
 type="email" 
 readOnly 
 value={user.email}
 className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 dark: dark: text-sm cursor-not-allowed dark:] dark: bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Nueva Contraseña (Opcional)</label>
 <div className="relative">
 <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
 <input 
 type="password" 
 value={newPass}
 onChange={e => setNewPass(e.target.value)}
 placeholder="Escribe al menos 6 caracteres para cambiarla"
 className="w-full pl-11 pr-4 py-3.5 rounded-2xl dark: border border-gray-200 dark:border-white/10 text-sm dark: focus:outline-none focus:ring-2 focus:ring-[#8c9276] transition-all bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>
 </div>

 {isAdmin && (
  <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
      {/* Admin Management Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-[#2a2a2c]/80 dark:to-[#222224]/80 border border-gray-200/80 dark:border-white/10 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Gestión de Administradores Extras
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Otorga acceso de administrador a tus colaboradores para catálogo, pedidos y radar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              invitedAdmins.length >= 3 
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
            }`}>
              {invitedAdmins.length} / 3 cupos utilizados
            </span>
          </div>
        </div>

        {/* Quick invite input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={adminInviteInput}
                onChange={e => setAdminInviteInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAdminInvite();
                  }
                }}
                placeholder="correo@amigo.com (o varios separados por coma)"
                disabled={invitedAdmins.length >= 3 || isSyncingAdmins}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8c9276] disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddAdminInvite()}
              disabled={!adminInviteInput.trim() || invitedAdmins.length >= 3 || isSyncingAdmins}
              className="px-4 py-2.5 rounded-xl bg-[#8c9276] hover:bg-[#7b8166] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
            >
              {isSyncingAdmins ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Invitar</span>
            </button>
          </div>
        </div>

        {inviteError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{inviteError}</span>
          </div>
        )}

        {inviteSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{inviteSuccess}</span>
          </div>
        )}

        {/* Invited Admin List */}
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Administradores Adicionales Activos ({invitedAdmins.length})
          </p>
          {invitedAdmins.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic bg-white/60 dark:bg-[#1a1a1c]/60 p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center">
              No hay administradores adicionales registrados. Los 3 cupos están disponibles.
            </p>
          ) : (
            <div className="space-y-1.5">
              {invitedAdmins.map((admEmail) => (
                <div
                  key={admEmail}
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-white dark:bg-[#1e1e20] border border-gray-100 dark:border-white/5 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-[#8c9276] shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{admEmail}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">ADMINISTRADOR</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdminInvite(admEmail)}
                    disabled={isSyncingAdmins}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                    title="Revocar acceso de administrador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  </div>
  )}

 <div className="pt-4 flex justify-end">
 <button 
 type="submit" 
 disabled={isUpdatingSettings}
 className="px-8 py-3.5 bg-gray-900 dark:bg-[#202022] text-white dark:text-gray-100 rounded-2xl text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-all shadow-lg dark:shadow-none hover:shadow-xl dark:shadow-none hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
 >
 {isUpdatingSettings ? "Guardando..." : "Guardar Cambios"}
 </button>
 </div>
 </form>

 <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-400">
 <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#8c9276]" /> Conexión segura a Supabase Auth</span>
 <span>ID: {user.id.substring(0, 8)}...</span>
 </div>
 </div>

 {/* Shipping Address Manager (5 cols) */}
 <div className="lg:col-span-5 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4">
 <div>
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <MapPin className="w-4 h-4 text-[#8c9276]" />
 <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Direcciones de Entrega</h3>
 <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 font-mono font-semibold">
 {addresses.length}/4
 </span>
 </div>
 {addresses.length < 4 && !showAddressForm && (
 <button 
 onClick={() => setShowAddressForm(true)}
 className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
 >
 + Añadir
 </button>
 )}
 </div>

 {addresses.length > 0 ? (
 <div className="flex flex-col gap-3">
 {addresses.map((addr) => (
 <div 
 key={addr.id}
 className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
 addr.isDefault 
 ? "bg-white dark:bg-[#202022] border-emerald-500/60 shadow-sm dark:shadow-none ring-1 ring-emerald-500/20" 
 : "bg-gray-50/80 dark:bg-[#2a2a2c]/80 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10"
 }`}
 >
 <div>
 <div className="flex items-center justify-between gap-2 mb-1.5">
 <div className="flex items-center gap-1.5 min-w-0 flex-1">
 <UserIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
 <span className="font-bold text-gray-900 dark:text-gray-100 text-xs truncate">
 {addr.recipient || user.name}
 </span>
 </div>
 {addr.isDefault ? (
 <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
 <Check className="w-2.5 h-2.5 text-emerald-700" /> Predeterminada
 </span>
 ) : (
 <button 
 onClick={() => setDefaultAddress(addr.id)}
 className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:hover:text-gray-900 border border-blue-200 hover:border-blue-600 transition-all cursor-pointer shadow-2xs shrink-0 group"
 title="Establecer como dirección predeterminada"
 >
 <Star className="w-2.5 h-2.5 text-blue-500 group-hover:text-white dark:hover:text-gray-900 transition-colors" />
 <span>Hacer predeterminada</span>
 </button>
 )}
 </div>
 <p className="text-gray-800 dark:text-gray-200 text-xs font-medium">{addr.street}</p>
 <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
 {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
 </p>
 <p className="text-gray-400 text-[10px] font-medium mt-0.5">{addr.country}</p>
 </div>

 <div className={`pt-2.5 mt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center ${addr.isDefault ? 'justify-end' : 'justify-between'}`}>
 {!addr.isDefault && (
 <span className="text-[10px] text-gray-400 font-medium">
 Dirección secundaria
 </span>
 )}
 <button 
 onClick={() => removeAddress(addr.id)}
 className="text-[11px] text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
 >
 <Trash2 className="w-3 h-3" />
 <span>Eliminar</span>
 </button>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center space-y-2 bg-gray-50/40 dark:bg-[#2a2a2c]/40">
 <MapPin className="w-6 h-6 text-gray-400 mx-auto" />
 <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Sin direcciones registradas</p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400">
 Puedes guardar hasta 4 direcciones para agilizar el proceso de compra.
 </p>
 {!showAddressForm && (
 <button 
 onClick={() => {
 setRecipient(user.name);
 setShowAddressForm(true);
 }}
 className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
 >
 + Agregar Primera Dirección
 </button>
 )}
 </div>
 )}
 </div>

 {showAddressForm && (
 <div className="pt-4 border-t border-gray-100 dark:border-white/5">
 <form onSubmit={handleAddressSubmit} className="space-y-3 bg-gray-50/70 dark:bg-[#2a2a2c]/70 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
 <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-white/10">
 <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
 Nueva Dirección de Entrega
 </span>
 <button 
 type="button" 
 onClick={() => {
 setLocationError(null);
 setLocationSuccess(false);
 setShowAddressForm(false);
 }} 
 className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
 >
 Cerrar
 </button>
 </div>

 {/* Geolocation Auto-fill Button */}
 <div className="pt-1">
 <button
 type="button"
 onClick={handleDetectLocation}
 disabled={isDetectingLocation}
 className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed
 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100 hover:border-blue-300 active:scale-[0.99]"
 >
 {isDetectingLocation ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
 <span>Detectando ubicación real del dispositivo...</span>
 </>
 ) : (
 <>
 <Navigation className="w-3.5 h-3.5 text-blue-600" />
 <span>Autocompletar con mi ubicación actual</span>
 </>
 )}
 </button>

 {locationError && (
 <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-2 leading-tight">
 {locationError}
 </p>
 )}

 {locationSuccess && (
 <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mt-2 leading-tight flex items-center gap-1.5">
 <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
 <span>¡Ubicación detectada! Revisa los campos y escribe el nombre de quién recibe.</span>
 </p>
 )}
 </div>

 <div className="relative flex py-0.5 items-center">
 <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
 <span className="flex-shrink mx-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">o llena los datos manualmente</span>
 <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
 ¿Quién recibe? (Nombre y apellidos)
 </label>
 <input 
 type="text" 
 required 
 value={recipient} 
 onChange={e => setRecipient(e.target.value)} 
 placeholder={user.name} 
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none dark:] focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Calle y Número</label>
 <input 
 type="text" 
 required 
 value={street} 
 onChange={e => setStreet(e.target.value)} 
 placeholder="Av. Diagonal 450, 3ro 2da" 
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none dark:] focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
 <input 
 type="text" 
 required 
 value={city} 
 onChange={e => setCity(e.target.value)} 
 placeholder="Barcelona" 
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none dark:] focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
 <input 
 type="text" 
 required 
 value={postalCode} 
 onChange={e => setPostalCode(e.target.value)} 
 placeholder="08006" 
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none dark:] focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Provincia/Estado</label>
 <input 
 type="text" 
 required
 value={stateProv} 
 onChange={e => setStateProv(e.target.value)} 
 placeholder="Cataluña" 
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none dark:] focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">País</label>
 <input 
 type="text" 
 required
 value={country} 
 onChange={e => setCountry(e.target.value)} 
 placeholder="España"
 className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none dark:] focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={() => setShowAddressForm(false)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#48484a] rounded-xl cursor-pointer">Cancelar</button>
 <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 cursor-pointer">Guardar Dirección</button>
 </div>
 </form>
 </div>
 )}
 </div>

 </div>
 )}

 </main>

 {/* ========================================================================= */}
 {/* MODAL: DETALLE DEL PEDIDO */}
 {/* ========================================================================= */}
 {selectedOrder && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
 <div className="bg-white dark:bg-[#202022] rounded-[2.5rem] w-full max-w-xl shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 md:p-8 relative max-h-[90vh] overflow-y-auto lumina-order-modal-scroll border border-gray-100 dark:border-white/10">
 <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
 <div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c9276]">Detalle de Envío</span>
 <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">{selectedOrder.id}</h3>
 </div>
 <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3a3a3c] text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Tracking Progress Bar */}
 <div className="my-5 p-4 bg-gray-50 dark:bg-[#2a2a2c] rounded-2xl border border-gray-100 dark:border-white/5">
 <div className="flex items-center justify-between mb-3 text-xs">
 <span className="font-semibold text-gray-700 dark:text-gray-300">Rastreo: <span className="font-mono">{selectedOrder.trackingNumber || "LM-982410"}</span></span>
 <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
 selectedOrder.status === "Entregado" ? "bg-emerald-100 text-emerald-800" : selectedOrder.status === "Enviado" ? "bg-blue-100 text-blue-800" : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
 }`}>
 {selectedOrder.status}
 </span>
 </div>

 {/* Steps timeline */}
 <div className="flex items-center justify-between relative pt-2">
 <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 dark:bg-[#48484a] -z-0" />
 {[
 { label: "Pagado", done: true },
 { label: "En Taller", done: true },
 { label: "En Reparto", done: selectedOrder.status === "Enviado" || selectedOrder.status === "Entregado" },
 { label: "Entregado", done: selectedOrder.status === "Entregado" },
 ].map((st, i) => (
 <div key={i} className="flex flex-col items-center gap-1 relative z-10">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${st.done ? "bg-[#8c9276] text-white dark:text-gray-900" : "bg-gray-200 dark:bg-[#48484a] text-gray-500 dark:text-gray-400"}`}>
 {st.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
 </div>
 <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{st.label}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Customer & Order Metadata Card */}
 <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
 {/* Comprador & Fecha */}
 <div className="p-3.5 bg-gray-50/80 dark:bg-[#2a2a2c]/80 rounded-2xl border border-gray-100 dark:border-white/5">
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Cliente / Comprador</p>
 <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{selectedOrder.customerName || "Cliente Lumina"}</p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{selectedOrder.customerEmail || "cliente@lumina.com"}</p>
 <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-white/10/60 text-[11px] text-gray-600 dark:text-gray-400 flex items-center justify-between">
 <span className="text-[10px] text-gray-400">Fecha y Hora:</span>
 <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedOrder.date} {selectedOrder.time ? `• ${selectedOrder.time}` : ""}</span>
 </div>
 </div>

 {/* Entrega & Pago */}
 <div className="p-3.5 bg-gray-50/80 dark:bg-[#2a2a2c]/80 rounded-2xl border border-gray-100 dark:border-white/5">
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Dirección de Entrega</p>
 {selectedOrder.shippingAddress ? (
 <>
 <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{selectedOrder.shippingAddress.street}</p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{selectedOrder.shippingAddress.city}{selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ""}</p>
 <p className="text-[10px] text-gray-400">{selectedOrder.shippingAddress.postalCode} • {selectedOrder.shippingAddress.country}</p>
 </>
 ) : (
 <p className="text-xs text-gray-500 dark:text-gray-400 italic">Dirección registrada por defecto</p>
 )}
 <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-white/10/60 text-[11px] text-gray-600 dark:text-gray-400 flex items-center justify-between">
 <span className="text-[10px] text-gray-400">Método de Pago:</span>
 <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedOrder.paymentMethod || "Tarjeta de Crédito"}</span>
 </div>
 </div>
 </div>

 {/* Items Purchased */}
 <div className="space-y-3 mb-5">
 <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Piezas Adquiridas ({selectedOrder.items.length})</h4>
 {selectedOrder.items.length === 0 ? (
 <div className="p-3 bg-gray-50 dark:bg-[#2a2a2c] rounded-xl flex items-center justify-between text-xs">
 <span>Pieza Colección Exclusiva Lumina</span>
 <span className="font-bold text-gray-900 dark:text-gray-100">${selectedOrder.total.toFixed(2)}</span>
 </div>
 ) : (
 selectedOrder.items.map((item, idx) => (
 <div key={idx} className="p-3 bg-gray-50 dark:bg-[#2a2a2c] rounded-xl flex items-center justify-between text-xs">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-[#202022] shrink-0 relative border border-gray-100 dark:border-white/5">
 <Image src={item.product.imageUrl} alt={item.product.title} fill className="object-cover" />
 </div>
 <div>
 <p className="font-semibold text-gray-900 dark:text-gray-100">{item.product.title}</p>
 <p className="text-[10px] text-gray-400">Cant: {item.quantity} {item.color ? `• Color: ${item.color}` : ""}</p>
 </div>
 </div>
 <span className="font-bold text-gray-900 dark:text-gray-100">${(item.product.price * item.quantity).toFixed(2)}</span>
 </div>
 ))
 )}
 </div>

 {/* Summary */}
 <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-sm">
 <span className="text-gray-500 dark:text-gray-400 font-medium">Total Facturado</span>
 <span className="text-xl font-bold text-gray-900 dark:text-gray-100">${selectedOrder.total.toFixed(2)}</span>
 </div>

 {/* If Admin: live status changer */}
 {isAdmin && (
 <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60">
 <div>
 <p className="text-xs font-bold text-amber-900">Actualizar Estado (Administrador)</p>
 <p className="text-[10px] text-amber-700">Cambia la etapa del pedido en tiempo real para el cliente</p>
 </div>
 <select 
 value={selectedOrder.status}
 onChange={(e) => {
 const nextSt = e.target.value as "Procesando" | "Enviado" | "Entregado";
 updateOrderStatus(selectedOrder.id, nextSt);
 setSelectedOrder({ ...selectedOrder, status: nextSt });
 }}
 className="text-xs font-bold bg-white dark:bg-[#202022] border border-amber-300 rounded-xl px-3.5 py-2 outline-none shadow-sm dark:shadow-none cursor-pointer text-gray-900 dark:text-gray-100"
 >
 <option value="Procesando">Procesando</option>
 <option value="Enviado">Enviado</option>
 <option value="Entregado">Entregado</option>
 </select>
 </div>
 )}
 </div>
 </div>
 )}

 {/* ========================================================================= */}
 {/* MODAL: AGREGAR TARJETA CON LIVE PREVIEW */}
 {/* ========================================================================= */}
 {showCardModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
 <div className="bg-white dark:bg-[#202022] rounded-3xl w-full max-w-md shadow-2xl dark:shadow-none p-6 relative">
 <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-white/5">
 <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
 <CreditCard className="w-5 h-5 text-[#8c9276]" /> Añadir Nueva Tarjeta
 </h3>
 <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Live Interactive Card Preview */}
 <div className={`p-5 rounded-2xl mb-5 text-white dark:text-gray-900 shadow-md dark:shadow-none transition-colors ${
 newCardType === "mastercard" ? "bg-gradient-to-tr from-neutral-950 to-neutral-800" : "bg-gradient-to-tr from-[#d97736] to-[#b8541c]"
 }`}>
 <div className="flex items-center justify-between mb-4">
 <div className="w-8 h-6 bg-yellow-400/80 rounded-md border border-yellow-300 shadow-inner" />
 <span className="text-xs font-bold tracking-widest">{newCardType.toUpperCase()}</span>
 </div>
 <p className="font-mono text-base tracking-widest font-semibold mb-3">
 {newCardNumber || "•••• •••• •••• 8888"}
 </p>
 <div className="flex items-center justify-between text-xs text-white/80 dark:text-gray-900/80">
 <span>{newCardHolder.toUpperCase() || user.name.toUpperCase()}</span>
 <span>EXP {newCardExp || "MM/AA"}</span>
 </div>
 </div>

 <form onSubmit={handleAddCardSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Tipo de Red</label>
 <div className="grid grid-cols-2 gap-3">
 <button 
 type="button"
 onClick={() => setNewCardType("mastercard")}
 className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${newCardType === "mastercard" ? "border-gray-900 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]"}`}
 >
 Mastercard
 </button>
 <button 
 type="button"
 onClick={() => setNewCardType("visa")}
 className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${newCardType === "visa" ? "border-gray-900 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]"}`}
 >
 Visa
 </button>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Titular de la Tarjeta</label>
 <input 
 type="text" 
 value={newCardHolder} 
 onChange={e => setNewCardHolder(e.target.value)} 
 placeholder={user.name} 
 className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Número de Tarjeta (16 dígitos)</label>
 <input 
 type="text" 
 required 
 maxLength={19}
 value={newCardNumber} 
 onChange={e => {
 const v = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
 setNewCardNumber(v);
 }} 
 placeholder="4532 8921 7321 8888" 
 className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Fecha de Expiración (MM/AA)</label>
 <input 
 type="text" 
 required 
 maxLength={5}
 value={newCardExp} 
 onChange={e => {
 let v = e.target.value.replace(/\D/g, '');
 if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
 setNewCardExp(v);
 }} 
 placeholder="08/29" 
 className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 </div>

 <div className="pt-3 flex justify-end gap-2">
 <button type="button" onClick={() => setShowCardModal(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] rounded-xl">Cancelar</button>
 <button type="submit" className="px-5 py-2 text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 shadow-md dark:shadow-none">Guardar Tarjeta</button>
 </div>
 </form>
 </div>
 </div>
 )}

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
                    ${productToDelete.price.toFixed(2)}
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

  </div>
  </div>
 );
}
