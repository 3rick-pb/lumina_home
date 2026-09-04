"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Loader2 
} from "lucide-react";
import { useUserStore, Order } from "@/lib/userStore";
import { useCatalogStore, normalizeCategory, CatalogProduct } from "@/lib/catalogStore";
import { useCartStore } from "@/lib/store";
import { normalizeSearchText } from "@/lib/utils";

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
    updateUserName,
    updateUserPassword
  } = useUserStore();

  const { products, categories, badges, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, addBadge, deleteBadge } = useCatalogStore();
  const { addItem, setIsOpen: setCartOpen } = useCartStore();

  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "cards" | "favorites" | "catalog" | "niches" | "settings">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

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
  const [editFeedback, setEditFeedback] = useState<{ msg: string; success: boolean } | null>(null);

  // Category & Badge manager state
  const [newCatInput, setNewCatInput] = useState("");
  const [newBadgeInput, setNewBadgeInput] = useState("");

  // Interactive Chart Hover States
  const [hoveredNicheIdx, setHoveredNicheIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

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
  const [settingsFeedback, setSettingsFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["overview", "orders", "cards", "favorites", "catalog", "niches", "settings"].includes(tabParam)) {
        setActiveTab(tabParam as "overview" | "orders" | "cards" | "favorites" | "catalog" | "niches" | "settings");
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
  }, [user]);

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
      const matchQuery = !q || normalizeSearchText(ord.id).includes(q);
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
          <p className="text-sm font-medium text-gray-500">Cargando panel de usuario...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";

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
      sizes: hasSizes && prodSizes.trim() ? prodSizes.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      colors: hasColors && prodColors.trim() ? prodColors.split(",").map(c => ({ name: c.trim(), hex: "#94a3b8" })) : undefined,
    });

    setIsSubmittingProd(false);
    if (res.success) {
      setShowProductModal(false);
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
      sizes: editHasSizes && editSizes.trim() ? editSizes.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      colors: editHasColors && editColors.trim() ? editColors.split(",").map(c => ({ name: c.trim(), hex: "#94a3b8" })) : undefined,
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f3f4f6] text-gray-900 flex p-3 md:p-6 lg:p-8 selection:bg-[#8c9276]/20">
      
      {/* 1. Left Vertical Icon Sidebar (Reference Style) */}
      <aside className="w-16 md:w-20 bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col items-center py-6 justify-between shrink-0 mr-4 md:mr-6">
        
        {/* Brand Logo Symbol */}
        <div className="flex flex-col items-center gap-6">
          <Link href="/" className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8c9276] to-[#a4ab8c] flex items-center justify-center text-white shadow-md shadow-[#8c9276]/20 hover:scale-105 transition-transform" title="Volver a la Tienda Lumina">
            <span className="font-display font-bold text-xl italic">L</span>
          </Link>

          {/* Navigation Icons */}
          <nav className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setActiveTab("overview")} 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeTab === "overview" ? "bg-gray-900 text-white shadow-md shadow-gray-900/15" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
              title="Vista General"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setActiveTab("orders")} 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeTab === "orders" ? "bg-gray-900 text-white shadow-md shadow-gray-900/15" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
              title="Pedidos & Historial"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setActiveTab("cards")} 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeTab === "cards" ? "bg-gray-900 text-white shadow-md shadow-gray-900/15" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
              title="Mis Tarjetas"
            >
              <CreditCard className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setActiveTab("favorites")} 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeTab === "favorites" ? "bg-gray-900 text-white shadow-md shadow-gray-900/15" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
              title="Favoritos Guardados"
            >
              <Heart className="w-5 h-5" />
            </button>

            {isAdmin && (
              <>
                <button 
                  onClick={() => setActiveTab("catalog")} 
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeTab === "catalog" ? "bg-gray-900 text-white shadow-md shadow-gray-900/15" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
                  title="Control de Catálogo"
                >
                  <Package className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => setActiveTab("niches")} 
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeTab === "niches" ? "bg-gray-900 text-white shadow-md shadow-gray-900/15" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
                  title="Gestión de Nichos"
                >
                  <Layers className="w-5 h-5" />
                </button>
              </>
            )}

            <button 
              onClick={() => setActiveTab("settings")} 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeTab === "settings" ? "bg-gray-900 text-white shadow-md shadow-gray-900/15" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
              title="Ajustes de Cuenta"
            >
              <Settings className="w-5 h-5" />
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="Volver a la Tienda">
            <Store className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => { logout(); router.push("/auth/login"); }} 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* 2. Main Bento Canvas */}
      <main className="flex-1 flex flex-col min-w-0 max-w-7xl w-full mx-auto space-y-6 overflow-hidden">
        
        {/* Top App Bar (Reference Style) */}
        <header className="relative z-40 bg-white/80 backdrop-blur-2xl p-4 md:px-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4">
          
          {/* Brand & Tabs */}
          <div className="flex items-center gap-3 md:gap-6 overflow-x-auto hide-scrollbar">
            <span className="font-display font-bold text-xl text-gray-900 tracking-tight shrink-0">
              Lumina<span className="text-[#8c9276]">.</span>
            </span>

            <div className="flex items-center bg-gray-100/80 p-1 rounded-2xl shrink-0">
              <button 
                onClick={() => setActiveTab("overview")} 
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "overview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Resumen
              </button>
              <button 
                onClick={() => setActiveTab("orders")} 
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "orders" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Actividad ({orders.length})
              </button>
              <button 
                onClick={() => setActiveTab("cards")} 
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "cards" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Tarjetas ({cards.length})
              </button>
              <button 
                onClick={() => setActiveTab("favorites")} 
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "favorites" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Favoritos ({favorites.length})
              </button>
              {isAdmin && (
                <>
                  <button 
                    onClick={() => setActiveTab("catalog")} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "catalog" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Inventario ({products.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab("niches")} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "niches" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Nichos & Badges ({categories.length})
                  </button>
                </>
              )}
              <button 
                onClick={() => setActiveTab("settings")} 
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "settings" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Ajustes
              </button>
            </div>
          </div>

          {/* Right Search Input & Profile Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative z-50">
              <div className="hidden sm:flex items-center bg-gray-100/70 px-3 py-1.5 rounded-2xl border border-gray-200/50 text-xs text-gray-600 focus-within:ring-2 focus-within:ring-[#8c9276]/30 focus-within:bg-white transition-all">
                <Search className="w-3.5 h-3.5 mr-2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar en panel..."
                  className="bg-transparent border-none outline-none text-xs w-28 md:w-44 text-gray-800 placeholder:text-gray-400 font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Floating Live Quick Search Results */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl border border-gray-200/80 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.22)] p-4 z-[100] space-y-3 animate-fade-in text-xs pointer-events-auto">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100 text-[10px] text-gray-400 uppercase font-bold">
                    <span>Resultados de búsqueda</span>
                    <button onClick={() => setSearchQuery("")} className="hover:text-gray-700 font-medium text-xs normal-case">Cerrar</button>
                  </div>
                  
                  {/* Matching Orders */}
                  {filteredOrders.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pedidos ({filteredOrders.length})</p>
                      {filteredOrders.slice(0, 2).map(ord => (
                        <div 
                          key={ord.id} 
                          onClick={() => { setActiveTab("orders"); setSelectedOrder(ord); setSearchQuery(""); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <span className="font-mono font-bold text-gray-800">{ord.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold">{ord.status}</span>
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
                          className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <span className="font-medium text-gray-800 truncate max-w-[150px]">{prod.title}</span>
                          <span className="font-bold text-gray-900">${prod.price.toFixed(2)}</span>
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

            <Link href="/" className="hidden sm:flex text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              Ver Tienda &rarr;
            </Link>

            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-10 h-10 rounded-2xl bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center font-bold text-sm border border-[#8c9276]/20 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${isAdmin ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                  {isAdmin ? "ADMINISTRADOR" : "CLIENTE"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
              Buenos días, <span className="italic font-normal">{user.name}</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              {isAdmin 
                ? "Panel de control maestro de catálogo, inventario y métricas reales de Lumina Home." 
                : "Supervisa tus pedidos, métodos de pago vinculados y artículos guardados."}
            </p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowProductModal(true)}
              className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-2xl transition-all shadow-md shadow-gray-900/10 cursor-pointer"
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
            <div className="lg:col-span-4 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isAdmin ? "Valor Total del Catálogo" : "Gasto Acumulado en Compras"}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                    (isAdmin ? totalInventoryValue > 0 : totalUserSpend > 0) 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                      : "text-gray-500 bg-gray-100 border-gray-200"
                  }`}>
                    {isAdmin ? `${products.length} piezas` : `${orders.length} pedidos`}
                  </span>
                </div>
                <p className="text-4xl font-display font-bold text-gray-900 tracking-tight mb-2">
                  ${(isAdmin ? totalInventoryValue : totalUserSpend).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {isAdmin 
                    ? `Precio promedio por pieza: $${averagePrice.toFixed(2)}` 
                    : (orders.length === 0 ? "Sin compras registradas aún en esta cuenta" : "Suma real de todos los pedidos efectuados")}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                <Link 
                  href="/shop" 
                  className="flex-1 py-3 px-4 bg-gray-900 text-white rounded-2xl text-xs font-semibold text-center hover:bg-gray-800 transition-colors shadow-sm"
                >
                  {isAdmin ? "Ver Catálogo" : "Explorar Tienda"}
                </Link>
                <button 
                  onClick={() => setActiveTab("orders")}
                  className="py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl text-xs font-semibold hover:bg-gray-200 transition-colors"
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
                className="bg-gradient-to-br from-[#e07a3f] to-[#c75e24] p-5 rounded-[2rem] text-white shadow-md shadow-[#e07a3f]/15 flex flex-col justify-between text-left hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/80">
                    {isAdmin ? "Inventario" : "Mis Pedidos"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold">{isAdmin ? products.length : orders.length}</p>
                  <p className="text-[10px] text-white/70 mt-1">
                    {isAdmin ? `${discountPercentageOfCatalog}% con descuento` : (orders.length === 0 ? "Sin pedidos activos" : "Pedidos confirmados")}
                  </p>
                </div>
              </button>

              {/* Box 2 (Nichos or Favoritos) */}
              <button 
                onClick={() => setActiveTab(isAdmin ? "niches" : "favorites")} 
                className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between text-left hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {isAdmin ? "Nichos" : "Favoritos"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                    {isAdmin ? <Layers className="w-4 h-4" /> : <Heart className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-gray-900">
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
              <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {isAdmin ? "Rebajas" : "Lumina Puntos"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                    <Sparkles className="w-4 h-4 text-[#8c9276]" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-gray-900">
                    {isAdmin ? `${discountedCount}` : `${loyaltyPoints} pts`}
                  </p>
                  <p className={`text-[10px] font-semibold mt-1 ${isAdmin ? "text-amber-700" : loyaltyTier.color}`}>
                    {isAdmin ? `${discountPercentageOfCatalog}% del catálogo` : loyaltyTier.name}
                  </p>
                </div>
              </div>

              {/* Box 4 */}
              <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {isAdmin ? "Ventas Brutas" : "Tarjetas"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                    <CreditCard className="w-4 h-4 text-[#8c9276]" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-gray-900">
                    {isAdmin ? `$${totalUserSpend.toFixed(0)}` : cards.length}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {isAdmin ? `${orders.length} ventas procesadas` : (cards.length === 0 ? "Sin métodos de pago" : `${cards.length} activa(s)`)}
                  </p>
                </div>
              </div>
            </div>

            {/* BENTO CARD 3: REAL DYNAMIC CHART (4 cols) */}
            <div className="lg:col-span-4 min-w-0 max-w-full bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0 pr-2">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {isAdmin ? "Inventario por Nicho" : "Frecuencia de Compras"}
                  </h3>
                  <p className="text-xs text-gray-400 truncate transition-all duration-200">
                    {isAdmin 
                      ? (hoveredNicheIdx !== null && categoryDistributionData[hoveredNicheIdx] 
                          ? `${categoryDistributionData[hoveredNicheIdx].category}: ${categoryDistributionData[hoveredNicheIdx].count} piezas (${categoryDistributionData[hoveredNicheIdx].pctOfTotal}% del catálogo)`
                          : "Volumen real de piezas por categoría") 
                      : (hoveredMonthIdx !== null && monthlySpendData[hoveredMonthIdx]
                          ? `${monthlySpendData[hoveredMonthIdx].month}: $${monthlySpendData[hoveredMonthIdx].total.toFixed(2)} gastados`
                          : "Gastos calculados por mes (2026)")}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 rounded-lg text-gray-600 shrink-0">
                  {isAdmin 
                    ? (hoveredNicheIdx !== null && categoryDistributionData[hoveredNicheIdx]
                        ? `${categoryDistributionData[hoveredNicheIdx].count} piezas`
                        : `${products.length} Total`)
                    : "Semestre"}
                </span>
              </div>

              {/* Visual Dynamic Bar Chart with Decoupled Anchored Labels and Smooth Column Hover Expansion */}
              <div className="relative w-full my-auto">
                <div 
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
                      
                      // Adaptive width classes based on number of niches:
                      // Few items (<=4): wide baseline (w-16) expanding to w-24
                      // Medium items (5-7): medium baseline (w-12) expanding to w-20
                      // Many items (8+): compact baseline (w-10) expanding to w-18
                      const widthClass = categoryDistributionData.length <= 4
                        ? (isHovered ? "w-24 shrink-0" : "flex-1 max-w-[5rem] min-w-[3.5rem]")
                        : categoryDistributionData.length <= 7
                        ? (isHovered ? "w-20 shrink-0" : "w-12 shrink-0")
                        : (isHovered ? "w-18 shrink-0" : "w-10 shrink-0");

                      return (
                        <div 
                          key={idx} 
                          onMouseEnter={() => setHoveredNicheIdx(idx)}
                          onMouseLeave={() => setHoveredNicheIdx(null)}
                          className={`flex flex-col items-center h-full justify-between transition-all duration-300 ease-out group cursor-pointer relative ${widthClass} ${isHovered ? "z-20 scale-[1.02]" : "z-10"}`}
                        >
                          {/* 1. Bar Area (bounded in flex-1, bar grows upwards with capped max 82% height) */}
                          <div className="relative w-full flex-1 flex flex-col justify-end items-center px-1">
                            
                            {/* Floating Popover / Tooltip when Hovered */}
                            {isHovered && (
                              <div className="absolute -top-7 z-30 flex flex-col items-center pointer-events-none animate-fade-in">
                                <div className="bg-gray-950 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-lg border border-white/10 whitespace-nowrap flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${hasItems ? "bg-[#e07a3f]" : "bg-gray-400"}`} />
                                  <span>{bar.count}</span>
                                  <span className="text-gray-400 font-normal">({bar.pctOfTotal}%)</span>
                                </div>
                                <div className="w-1.5 h-1 bg-gray-950 rotate-45 -mt-0.5" />
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
                              className={`w-full rounded-2xl transition-all duration-300 ${
                                hasItems 
                                  ? isHovered 
                                    ? "bg-gradient-to-t from-[#c25e24] via-[#e07a3f] to-[#f59e0b] shadow-md shadow-[#e07a3f]/30 ring-2 ring-[#e07a3f]/40" 
                                    : "bg-[#e07a3f] shadow-2xs shadow-[#e07a3f]/20 hover:brightness-105" 
                                  : "bg-gray-200/90"
                              }`} 
                              style={{ height: `${bar.heightPct}%` }}
                            />
                          </div>

                          {/* 2. Anchored Category Label Area (Fixed height, completely decoupled from bar height) */}
                          <div className="w-full h-6 pt-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                            <span 
                              className={`text-[10px] text-center transition-colors block truncate w-full ${
                                isHovered ? "text-gray-950 font-bold" : "text-gray-400 font-medium"
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
                          onMouseEnter={() => setHoveredMonthIdx(idx)}
                          onMouseLeave={() => setHoveredMonthIdx(null)}
                          className="flex-1 min-w-[2.5rem] flex flex-col items-center h-full justify-between transition-all duration-300 group cursor-pointer relative"
                          title={`${bar.month}: $${bar.total.toFixed(2)}`}
                        >
                          {/* 1. Bar Area */}
                          <div className="relative w-full flex-1 flex flex-col justify-end items-center px-1">
                            {isHovered && bar.hasData && (
                              <div className="absolute -top-7 z-30 flex flex-col items-center pointer-events-none animate-fade-in">
                                <div className="bg-gray-950 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-lg border border-white/10 whitespace-nowrap">
                                  ${bar.total.toFixed(0)}
                                </div>
                                <div className="w-1.5 h-1 bg-gray-950 rotate-45 -mt-0.5" />
                              </div>
                            )}

                            <div 
                              className={`w-full rounded-2xl transition-all duration-300 ${
                                bar.hasData 
                                  ? isHovered 
                                    ? "bg-gradient-to-t from-[#c25e24] via-[#e07a3f] to-[#f59e0b] shadow-md shadow-[#e07a3f]/30" 
                                    : "bg-[#e07a3f]" 
                                  : "bg-gray-200"
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

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
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
            <div className="lg:col-span-4 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
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
                <div className="border-2 border-dashed border-gray-200/80 rounded-3xl p-6 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 my-auto">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 border border-gray-100">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Sin tarjetas guardadas</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed max-w-[200px] mx-auto">
                      Añade una tarjeta para pagar tus piezas con un solo clic.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowCardModal(true)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm"
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
                            ? "bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white shadow-md shadow-black/10" 
                            : "bg-gradient-to-tr from-[#d97736] to-[#b8541c] text-white shadow-md shadow-[#d97736]/15"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
                            {c.isDefault ? "Predeterminada" : "Activa"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold tracking-wider">{c.type.toUpperCase()}</span>
                            <button 
                              onClick={() => removeCard(c.id)} 
                              className="text-white/60 hover:text-white transition-colors p-1"
                              title="Eliminar tarjeta"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="font-mono text-sm tracking-widest font-semibold mb-3">
                          {c.number}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-white/80">
                          <span>{c.holder}</span>
                          <span>EXP {c.exp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Cifrado bancario AES-256
                </p>
                <button 
                  onClick={() => setActiveTab("cards")} 
                  className="text-xs font-semibold text-gray-700 hover:text-gray-900 hover:underline"
                >
                  Gestionar billetera &rarr;
                </button>
              </div>
            </div>

            {/* BENTO CARD 5: RECENT ACTIVITIES / ORDERS (8 cols) */}
            <div className="lg:col-span-8 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {isAdmin ? "Pedidos Recientes de la Tienda" : "Actividades & Pedidos Recientes"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isAdmin ? "Supervisión de compras de clientes" : "Trazabilidad de tus envíos"}
                  </p>
                </div>
                {orders.length > 0 && (
                  <button 
                    onClick={() => setActiveTab("orders")} 
                    className="text-xs font-semibold text-gray-700 hover:text-gray-900 hover:underline"
                  >
                    Ver todos ({orders.length}) &rarr;
                  </button>
                )}
              </div>

              {/* Orders Table or Empty State */}
              {orders.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 rounded-2xl border border-gray-100 my-auto">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 border border-gray-100">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">No hay pedidos registrados</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 max-w-sm">
                      {isAdmin 
                        ? "Aún no se han recibido compras de clientes en la tienda." 
                        : "Todavía no has realizado compras. Al hacer tu primer pedido, aquí podrás seguir su entrega paso a paso."}
                    </p>
                  </div>
                  <Link 
                    href="/shop" 
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Explorar Catálogo
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                        <th className="pb-3 px-2">ID Pedido</th>
                        <th className="pb-3 px-2">Concepto</th>
                        <th className="pb-3 px-2">Monto</th>
                        <th className="pb-3 px-2">Estado</th>
                        <th className="pb-3 px-2">Fecha</th>
                        <th className="pb-3 px-2 text-right">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.slice(0, 4).map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(ord)}>
                          <td className="py-3.5 px-2 font-mono font-semibold text-gray-900">{ord.id}</td>
                          <td className="py-3.5 px-2 font-medium text-gray-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                            <span>{ord.items.length > 0 ? `${ord.items.length} pieza(s) Lumina` : "Compra Lumina"}</span>
                          </td>
                          <td className="py-3.5 px-2 font-bold text-gray-900">${ord.total.toFixed(2)}</td>
                          <td className="py-3.5 px-2">
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
                          </td>
                          <td className="py-3.5 px-2 text-gray-400">{ord.date}</td>
                          <td className="py-3.5 px-2 text-right">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedOrder(ord); }} 
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{orders.length === 0 ? "Registro limpio" : "Haz clic en un pedido para ver la trazabilidad"}</span>
                <span className="font-semibold text-gray-900">{orders.length} pedidos totales</span>
              </div>
            </div>

            {/* ADMIN ONLY: Empty Categories Warning */}
            {isAdmin && emptyCategories.length > 0 && (
              <div className="lg:col-span-12 bg-amber-50/90 backdrop-blur-md p-5 rounded-3xl border border-amber-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
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
                      onClick={() => deleteCategory(c)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold transition-colors flex items-center gap-1"
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
          <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Historial Completo de Pedidos</h2>
                <p className="text-xs text-gray-500">Trazabilidad en tiempo real, recibos y estados de envío.</p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
                {["all", "Procesando", "Enviado", "Entregado"].map((st) => (
                  <button 
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      orderStatusFilter === st ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {st === "all" ? "Todos" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 border border-gray-100 mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">No hay pedidos que coincidan</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {orders.length === 0 
                    ? "Esta cuenta aún no ha realizado compras. Los pedidos que hagas se sincronizarán aquí." 
                    : "No hay pedidos con el filtro de estado seleccionado."}
                </p>
                {orders.length === 0 && (
                  <Link href="/shop" className="inline-block px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">
                    Explorar Catálogo
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-3">ID Pedido</th>
                      <th className="pb-3 px-3">Código Rastreo</th>
                      <th className="pb-3 px-3">Artículos</th>
                      <th className="pb-3 px-3">Total</th>
                      <th className="pb-3 px-3">Estado</th>
                      <th className="pb-3 px-3">Fecha</th>
                      <th className="pb-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-4 px-3 font-mono font-bold text-gray-900">{ord.id}</td>
                        <td className="py-4 px-3 font-mono text-gray-500">{ord.trackingNumber || "TRK-PENDIENTE"}</td>
                        <td className="py-4 px-3 text-gray-700">
                          {ord.items.length > 0 ? `${ord.items.length} producto(s)` : "1 artículo Lumina"}
                        </td>
                        <td className="py-4 px-3 font-bold text-gray-900">${ord.total.toFixed(2)}</td>
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
                        <td className="py-4 px-3 text-gray-400">{ord.date}</td>
                        <td className="py-4 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && (
                              <select 
                                value={ord.status} 
                                onChange={(e) => updateOrderStatus(ord.id, e.target.value as "Procesando" | "Enviado" | "Entregado")}
                                className="text-[11px] font-semibold bg-gray-100 rounded-lg px-2 py-1 outline-none border border-gray-200"
                              >
                                <option value="Procesando">Procesando</option>
                                <option value="Enviado">Enviado</option>
                                <option value="Entregado">Entregado</option>
                              </select>
                            )}
                            <button 
                              onClick={() => setSelectedOrder(ord)} 
                              className="px-3 py-1 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"
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
            <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#8c9276]" /> Gestión de Billetera & Métodos de Pago
                  </h2>
                  <p className="text-xs text-gray-500">Tus datos están protegidos con cifrado de grado militar.</p>
                </div>
                <button 
                  onClick={() => setShowCardModal(true)} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-2xl transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" /> Añadir Tarjeta
                </button>
              </div>

              {/* Cards Grid or Empty State */}
              {cards.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 border border-gray-100">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">No hay tarjetas de crédito o débito guardadas</h3>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Agrega tu primera tarjeta para agilizar tus compras en Lumina Home. No almacenamos tu código CVV.
                  </p>
                  <button 
                    onClick={() => setShowCardModal(true)}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
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
                        className={`p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between h-52 shadow-lg transition-transform hover:scale-[1.02] ${
                          isDark 
                            ? "bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white shadow-black/15" 
                            : "bg-gradient-to-tr from-[#d97736] to-[#b8541c] text-white shadow-[#d97736]/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-6 bg-yellow-400/80 rounded-md shadow-inner border border-yellow-300" />
                            {c.isDefault && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25">
                                Principal
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold tracking-widest">{c.type.toUpperCase()}</span>
                        </div>

                        <p className="font-mono text-lg tracking-[0.25em] font-semibold my-2">
                          {c.number}
                        </p>

                        <div className="flex items-center justify-between text-xs text-white/90">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-white/60">Titular</p>
                            <p className="font-semibold">{c.holder}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-wider text-white/60">Expira</p>
                            <p className="font-semibold">{c.exp}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px]">
                          {!c.isDefault ? (
                            <button 
                              onClick={() => setDefaultCard(c.id)} 
                              className="text-white/80 hover:text-white underline underline-offset-2"
                            >
                              Hacer principal
                            </button>
                          ) : (
                            <span className="text-white/70">Tarjeta por defecto</span>
                          )}
                          <button 
                            onClick={() => removeCard(c.id)} 
                            className="text-red-200 hover:text-white flex items-center gap-1"
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
          <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" /> Piezas Guardadas en Favoritos
                </h2>
                <p className="text-xs text-gray-500">Colección personal de artículos que has marcado con el corazón.</p>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {favoritedProductsList.length} guardados
              </span>
            </div>

            {favoritedProductsList.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-gray-50/50 rounded-3xl border border-gray-100">
                <div className="w-14 h-14 rounded-full bg-red-50 text-red-400 mx-auto flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Aún no tienes favoritos guardados</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Explora nuestra tienda y haz clic en el corazón de cualquier pieza para guardarla aquí.
                </p>
                <Link href="/shop" className="inline-block px-6 py-2.5 bg-gray-900 text-white rounded-2xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                  Explorar Catálogo
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {favoritedProductsList.map((prod) => (
                  <div key={prod.id} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-50">
                      <Image 
                        src={prod.imageUrl} 
                        alt={prod.title} 
                        fill 
                        className="object-cover"
                      />
                      <button 
                        onClick={() => toggleFavorite(prod.id)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/90 text-red-500 shadow-sm hover:scale-110 transition-transform"
                        title="Quitar de favoritos"
                      >
                        <Heart className="w-4 h-4 fill-red-500" />
                      </button>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-[#8c9276] uppercase tracking-wider">{prod.category}</p>
                      <h4 className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-1">{prod.title}</h4>
                      <p className="font-bold text-gray-900 text-base mt-1">${prod.price.toFixed(2)}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                      <Link 
                        href={`/product/${prod.id}`}
                        className="flex-1 py-2 text-center text-xs font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Ver Ficha
                      </Link>
                      <button 
                        onClick={() => {
                          addItem(prod);
                          setCartOpen(true);
                        }}
                        className="py-2 px-3 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
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
          <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#8c9276]" /> Control Total del Inventario
                </h2>
                <p className="text-xs text-gray-500">
                  {products.length} productos activos • Valor total: ${totalInventoryValue.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select 
                  value={catalogCategoryFilter} 
                  onChange={e => setCatalogCategoryFilter(e.target.value)}
                  className="text-xs font-semibold bg-gray-100 px-3 py-2 rounded-xl outline-none border border-gray-200"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button 
                  onClick={() => setShowProductModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Crear Producto
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider font-semibold">
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
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-2 flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{p.title}</p>
                          <p className="text-[11px] text-gray-400 italic">{p.titleHighlight || "Estándar"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-bold text-gray-900">${p.price.toFixed(2)}</td>
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
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
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
                            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver en tienda"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => deleteProduct(p.id)}
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
          <div className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#8c9276]" /> Gestión de Nichos & Colecciones
              </h2>
              <p className="text-xs text-gray-500">Crea nuevos nichos de mercado o elimina aquellos sin existencias.</p>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategorySubmit} className="flex gap-3 max-w-md">
              <input 
                type="text" 
                value={newCatInput} 
                onChange={e => setNewCatInput(e.target.value)}
                placeholder="Nombre del nuevo nicho (ej: Cerámica)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
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
                      isEmpty ? "bg-amber-50/70 border-amber-200" : "bg-white border-gray-100 shadow-sm"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{cat}</h4>
                      <p className={`text-xs mt-0.5 ${isEmpty ? "text-amber-700 font-semibold" : "text-gray-400"}`}>
                        {count} {count === 1 ? "producto" : "productos"} activos
                      </p>
                    </div>

                    <button 
                      onClick={() => deleteCategory(cat)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Eliminar nicho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ---------------------------------------------------- */}
            {/* Marketing Badges Section */}
            {/* ---------------------------------------------------- */}
            <div className="pt-8 border-t border-gray-100 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#8c9276]" /> Badges & Etiquetas de Marketing
                </h2>
                <p className="text-xs text-gray-500">
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
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm shrink-0"
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
                      className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
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
        {/* VIEW 7: SETTINGS & ADDRESS TAB */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Account & Credentials (7 cols) */}
            <div className="lg:col-span-7 bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#8c9276]" /> Configuración de Cuenta & Seguridad
                </h2>
                <p className="text-xs text-gray-500">Actualiza tus credenciales de acceso y datos personales.</p>
              </div>

              {settingsFeedback && (
                <div className={`p-3.5 rounded-2xl text-xs font-semibold text-center border ${
                  settingsFeedback.type === "success" 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                    : "bg-red-50 text-red-800 border-red-100"
                }`}>
                  {settingsFeedback.msg}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico (No editable)</label>
                  <input 
                    type="email" 
                    readOnly 
                    value={user.email}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nueva Contraseña (Opcional)</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input 
                      type="password" 
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      placeholder="Escribe al menos 6 caracteres para cambiarla"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isUpdatingSettings}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingSettings ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#8c9276]" /> Conexión segura a Supabase Auth</span>
                <span>ID: {user.id.substring(0, 8)}...</span>
              </div>
            </div>

            {/* Shipping Address Manager (5 cols) */}
            <div className="lg:col-span-5 bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8c9276]" />
                    <h3 className="text-base font-bold text-gray-900">Direcciones de Entrega</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono font-semibold">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          addr.isDefault 
                            ? "bg-white border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/20" 
                            : "bg-gray-50/80 border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <UserIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="font-bold text-gray-900 text-xs truncate">
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
                                className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition-all cursor-pointer shadow-2xs shrink-0 group"
                                title="Establecer como dirección predeterminada"
                              >
                                <Star className="w-2.5 h-2.5 text-blue-500 group-hover:text-white transition-colors" />
                                <span>Hacer predeterminada</span>
                              </button>
                            )}
                          </div>
                          <p className="text-gray-800 text-xs font-medium">{addr.street}</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
                          </p>
                          <p className="text-gray-400 text-[10px] font-medium mt-0.5">{addr.country}</p>
                        </div>

                        <div className={`pt-2.5 mt-2.5 border-t border-gray-100 flex items-center ${addr.isDefault ? 'justify-end' : 'justify-between'}`}>
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
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-2 bg-gray-50/40">
                    <MapPin className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-xs font-bold text-gray-800">Sin direcciones registradas</p>
                    <p className="text-[11px] text-gray-500">
                      Puedes guardar hasta 4 direcciones para agilizar el proceso de compra.
                    </p>
                    {!showAddressForm && (
                      <button 
                        onClick={() => {
                          setRecipient(user.name);
                          setShowAddressForm(true);
                        }}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        + Agregar Primera Dirección
                      </button>
                    )}
                  </div>
                )}
              </div>

              {showAddressForm && (
                <div className="pt-4 border-t border-gray-100">
                  <form onSubmit={handleAddressSubmit} className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-900">
                        Nueva Dirección de Entrega
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setLocationError(null);
                          setLocationSuccess(false);
                          setShowAddressForm(false);
                        }} 
                        className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
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
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink mx-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">o llena los datos manualmente</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        ¿Quién recibe? (Nombre y apellidos)
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={recipient} 
                        onChange={e => setRecipient(e.target.value)} 
                        placeholder={user.name} 
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none bg-white focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Calle y Número</label>
                      <input 
                        type="text" 
                        required 
                        value={street} 
                        onChange={e => setStreet(e.target.value)} 
                        placeholder="Av. Diagonal 450, 3ro 2da" 
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none bg-white focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ciudad</label>
                        <input 
                          type="text" 
                          required 
                          value={city} 
                          onChange={e => setCity(e.target.value)} 
                          placeholder="Barcelona" 
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Código Postal</label>
                        <input 
                          type="text" 
                          required 
                          value={postalCode} 
                          onChange={e => setPostalCode(e.target.value)} 
                          placeholder="08006" 
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Provincia/Estado</label>
                        <input 
                          type="text" 
                          required
                          value={stateProv} 
                          onChange={e => setStateProv(e.target.value)} 
                          placeholder="Cataluña" 
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">País</label>
                        <input 
                          type="text" 
                          required
                          value={country} 
                          onChange={e => setCountry(e.target.value)} 
                          placeholder="España"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowAddressForm(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-xl cursor-pointer">Cancelar</button>
                      <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 cursor-pointer">Guardar Dirección</button>
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
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c9276]">Detalle de Envío</span>
                <h3 className="text-xl font-bold text-gray-900 font-mono">{selectedOrder.id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tracking Progress Bar */}
            <div className="my-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-gray-700">Rastreo: <span className="font-mono">{selectedOrder.trackingNumber || "LM-982410"}</span></span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  selectedOrder.status === "Entregado" ? "bg-emerald-100 text-emerald-800" : selectedOrder.status === "Enviado" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Steps timeline */}
              <div className="flex items-center justify-between relative pt-2">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -z-0" />
                {[
                  { label: "Pagado", done: true },
                  { label: "En Taller", done: true },
                  { label: "En Reparto", done: selectedOrder.status === "Enviado" || selectedOrder.status === "Entregado" },
                  { label: "Entregado", done: selectedOrder.status === "Entregado" },
                ].map((st, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 relative z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${st.done ? "bg-[#8c9276] text-white" : "bg-gray-200 text-gray-500"}`}>
                      {st.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="text-[10px] font-medium text-gray-600">{st.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Purchased */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Piezas Adquiridas</h4>
              {selectedOrder.items.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                  <span>Pieza Colección Exclusiva Lumina</span>
                  <span className="font-bold text-gray-900">${selectedOrder.total.toFixed(2)}</span>
                </div>
              ) : (
                selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 relative">
                        <Image src={item.product.imageUrl} alt={item.product.title} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.product.title}</p>
                        <p className="text-[10px] text-gray-400">Cant: {item.quantity} {item.color ? `• ${item.color}` : ""}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Total Facturado</span>
              <span className="text-xl font-bold text-gray-900">${selectedOrder.total.toFixed(2)}</span>
            </div>

            {/* If Admin: live status changer */}
            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between bg-amber-50/60 p-3 rounded-2xl">
                <span className="text-xs font-bold text-amber-900">Actualizar Estado (Admin)</span>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => {
                    const nextSt = e.target.value as "Procesando" | "Enviado" | "Entregado";
                    updateOrderStatus(selectedOrder.id, nextSt);
                    setSelectedOrder({ ...selectedOrder, status: nextSt });
                  }}
                  className="text-xs font-semibold bg-white border border-amber-200 rounded-xl px-3 py-1.5 outline-none"
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
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#8c9276]" /> Añadir Nueva Tarjeta
              </h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Interactive Card Preview */}
            <div className={`p-5 rounded-2xl mb-5 text-white shadow-md transition-colors ${
              newCardType === "mastercard" ? "bg-gradient-to-tr from-neutral-950 to-neutral-800" : "bg-gradient-to-tr from-[#d97736] to-[#b8541c]"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-6 bg-yellow-400/80 rounded-md border border-yellow-300 shadow-inner" />
                <span className="text-xs font-bold tracking-widest">{newCardType.toUpperCase()}</span>
              </div>
              <p className="font-mono text-base tracking-widest font-semibold mb-3">
                {newCardNumber || "•••• •••• •••• 8888"}
              </p>
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>{newCardHolder.toUpperCase() || user.name.toUpperCase()}</span>
                <span>EXP {newCardExp || "MM/AA"}</span>
              </div>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Red</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setNewCardType("mastercard")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${newCardType === "mastercard" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    Mastercard
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewCardType("visa")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${newCardType === "visa" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    Visa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Titular de la Tarjeta</label>
                <input 
                  type="text" 
                  value={newCardHolder} 
                  onChange={e => setNewCardHolder(e.target.value)} 
                  placeholder={user.name} 
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Número de Tarjeta (16 dígitos)</label>
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
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Expiración (MM/AA)</label>
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
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCardModal(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 shadow-md">Guardar Tarjeta</button>
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
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Publicar Nuevo Producto</h2>
                <p className="text-xs text-gray-500">Se adaptará automáticamente a la estética Lumina y se sincronizará en Supabase.</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Principal *</label>
                  <input required type="text" value={prodTitle} onChange={e => setProdTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" placeholder="Ej: Lámpara de Mesa" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subtítulo Itálica</label>
                  <input type="text" value={prodHighlight} onChange={e => setProdHighlight(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" placeholder="Ej: Nova LED, Artesanal" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nicho / Categoría *</label>
                  <select required value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                    <option value="">Selecciona un nicho</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Badge de Marketing</label>
                    <button 
                      type="button" 
                      onClick={() => { setShowProductModal(false); setActiveTab("niches"); }}
                      className="text-[10px] font-semibold text-[#8c9276] hover:underline cursor-pointer"
                    >
                      + Gestionar badges
                    </button>
                  </div>
                  <select value={prodBadge} onChange={e => setProdBadge(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                    <option value="">Sin badge</option>
                    {badges.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Precios y Descuento */}
              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Precios y Rebajas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">¿Tiene descuento?</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        const next = !hasDiscount;
                        setHasDiscount(next);
                        handlePriceChange(prodPrice, oldPrice, next);
                      }}
                      className={`w-10 h-5 rounded-full relative transition-colors ${hasDiscount ? "bg-gray-900" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hasDiscount ? "left-5" : "left-1"}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{hasDiscount ? "Precio con Descuento ($) *" : "Precio Regular ($) *"}</label>
                    <input required type="number" step="0.01" value={prodPrice} onChange={e => handlePriceChange(e.target.value, oldPrice, hasDiscount)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none" placeholder="89.90" />
                  </div>
                  {hasDiscount && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Precio Original Antes ($)</label>
                        <input type="number" step="0.01" value={oldPrice} onChange={e => handlePriceChange(prodPrice, e.target.value, hasDiscount)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none" placeholder="119.90" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">% Descuento Calculado</label>
                        <input type="text" readOnly value={calculatedDiscount} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-100 text-red-600 font-bold outline-none" placeholder="-25%" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">URL de Imagen Principal *</label>
                <input required type="url" value={prodImageUrl} onChange={e => setProdImageUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" placeholder="https://images.unsplash.com/..." />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Galería de Imágenes Adicionales (separadas por coma)</label>
                <input type="text" value={prodExtraImages} onChange={e => setProdExtraImages(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" placeholder="https://images.unsplash.com/... , https://..." />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción Completa *</label>
                <textarea required rows={3} value={prodDescription} onChange={e => setProdDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none" placeholder="Describe los detalles de este producto..." />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Características / Viñetas (una por línea)</label>
                <textarea rows={3} value={prodFeatures} onChange={e => setProdFeatures(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none" placeholder="Material: Cerámica artesanal&#10;Acabado mate texturizado&#10;Garantía de 2 años" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button type="submit" disabled={isSubmittingProd} className="px-6 py-2.5 text-xs font-semibold bg-gray-900 text-white rounded-xl shadow-md hover:bg-gray-800 disabled:opacity-50">
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
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Editar Producto</h2>
                  <p className="text-xs text-gray-500">Modifica los detalles sin perder trazabilidad. Los cambios se sincronizan en Supabase.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditProductModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Principal *</label>
                  <input 
                    required 
                    type="text" 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-gray-900" 
                    placeholder="Ej: Lámpara de Mesa" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subtítulo Itálica</label>
                  <input 
                    type="text" 
                    value={editHighlight} 
                    onChange={e => setEditHighlight(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-1 focus:ring-gray-900" 
                    placeholder="Ej: Nova LED, Artesanal" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nicho / Categoría *</label>
                  <select 
                    required 
                    value={editCategory} 
                    onChange={e => setEditCategory(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white"
                  >
                    <option value="">Selecciona un nicho</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Badge de Marketing</label>
                  <select 
                    value={editBadge} 
                    onChange={e => setEditBadge(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white"
                  >
                    <option value="">Sin badge</option>
                    {badges.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Precios y Descuento */}
              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Precios y Rebajas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">¿Tiene descuento?</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        const next = !editHasDiscount;
                        setEditHasDiscount(next);
                        handleEditPriceChange(editPrice, editOldPrice, next);
                      }}
                      className={`w-10 h-5 rounded-full relative transition-colors ${editHasDiscount ? "bg-gray-900" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editHasDiscount ? "left-5" : "left-1"}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{editHasDiscount ? "Precio con Descuento ($) *" : "Precio Regular ($) *"}</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      value={editPrice} 
                      onChange={e => handleEditPriceChange(e.target.value, editOldPrice, editHasDiscount)} 
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none" 
                      placeholder="89.90" 
                    />
                  </div>
                  {editHasDiscount && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Precio Original Antes ($)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={editOldPrice} 
                          onChange={e => handleEditPriceChange(editPrice, e.target.value, editHasDiscount)} 
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none" 
                          placeholder="119.90" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">% Descuento Calculado</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={editCalculatedDiscount} 
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-100 text-red-600 font-bold outline-none" 
                          placeholder="-25%" 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Imagen y Vista Previa */}
              <div className="space-y-3">
                <div className="flex gap-4 items-start">
                  {editImageUrl && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      <Image src={editImageUrl} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">URL de Imagen Principal *</label>
                    <input 
                      required 
                      type="url" 
                      value={editImageUrl} 
                      onChange={e => setEditImageUrl(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" 
                      placeholder="https://images.unsplash.com/..." 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Galería de Imágenes Adicionales (separadas por coma)</label>
                  <input 
                    type="text" 
                    value={editExtraImages} 
                    onChange={e => setEditExtraImages(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" 
                    placeholder="https://... , https://..." 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción Completa *</label>
                <textarea 
                  required 
                  rows={3} 
                  value={editDescription} 
                  onChange={e => setEditDescription(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none" 
                  placeholder="Describe los detalles de este producto..." 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Características / Viñetas (una por línea)</label>
                <textarea 
                  rows={3} 
                  value={editFeatures} 
                  onChange={e => setEditFeatures(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none" 
                  placeholder="Material: Cerámica artesanal&#10;Acabado mate texturizado" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tallas / Tamaños (separados por coma)</label>
                  <input 
                    type="text" 
                    value={editSizes} 
                    onChange={e => { setEditSizes(e.target.value); setEditHasSizes(!!e.target.value.trim()); }} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" 
                    placeholder="Ej: Individual, Queen, King" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Colores (nombres separados por coma)</label>
                  <input 
                    type="text" 
                    value={editColors} 
                    onChange={e => { setEditColors(e.target.value); setEditHasColors(!!e.target.value.trim()); }} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" 
                    placeholder="Ej: Nogal, Roble, Blanco" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditProductModal(false)} 
                  className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingEdit} 
                  className="px-6 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isSubmittingEdit ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
