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
  Eye,
  Settings,
  ShieldCheck,
  User as UserIcon,
  KeyRound,
  ExternalLink,
  MapPin
} from "lucide-react";
import { useUserStore, Order } from "@/lib/userStore";
import { useCatalogStore } from "@/lib/catalogStore";
import { useCartStore } from "@/lib/store";

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
    address,
    setAddress,
    removeAddress,
    addCard, 
    removeCard, 
    setDefaultCard,
    updateOrderStatus,
    updateUserName,
    updateUserPassword
  } = useUserStore();

  const { products, categories, addProduct, deleteProduct, addCategory, deleteCategory } = useCatalogStore();
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
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("España");

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

  // Category manager state
  const [newCatInput, setNewCatInput] = useState("");

  // Settings State
  const [editName, setEditName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [settingsFeedback, setSettingsFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
      !products.some(p => p.category?.toLowerCase() === cat.toLowerCase())
    );
  }, [categories, products]);

  // 3. Real Category Product Distribution Chart (for Admin)
  const categoryDistributionData = useMemo(() => {
    const counts = categories.slice(0, 6).map(cat => {
      const count = products.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length;
      return { category: cat, count };
    });
    const maxCount = Math.max(...counts.map(c => c.count), 1);
    return counts.map(c => ({
      ...c,
      heightPct: Math.max(Math.round((c.count / maxCount) * 100), 12)
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
      heightPct: hasAnyOrders && t.total > 0 ? Math.round((t.total / maxMonth) * 100) : 4,
      hasData: t.total > 0
    }));
  }, [orders]);

  // 5. Filtered Lists
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const matchStatus = orderStatusFilter === "all" || ord.status.toLowerCase() === orderStatusFilter.toLowerCase();
      const matchQuery = !searchQuery || ord.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [orders, orderStatusFilter, searchQuery]);

  const filteredCatalog = useMemo(() => {
    return products.filter(p => {
      const matchCat = catalogCategoryFilter === "all" || p.category.toLowerCase() === catalogCategoryFilter.toLowerCase();
      const matchQuery = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
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

  // Add Address Submit
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim() || !city.trim()) return;
    setAddress({
      street: street.trim(),
      city: city.trim(),
      state: stateProv.trim(),
      postalCode: postalCode.trim(),
      country: country.trim()
    });
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
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 flex p-3 md:p-6 lg:p-8 selection:bg-[#8c9276]/20">
      
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
            onClick={() => { logout(); router.push("/"); }} 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* 2. Main Bento Canvas */}
      <main className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto space-y-6">
        
        {/* Top App Bar (Reference Style) */}
        <header className="bg-white/80 backdrop-blur-2xl p-4 md:px-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4">
          
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
                    Nichos ({categories.length})
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
            <div className="hidden sm:flex items-center bg-gray-100/70 px-3 py-1.5 rounded-2xl border border-gray-200/50 text-xs text-gray-600 focus-within:ring-2 focus-within:ring-[#8c9276]/30 transition-all">
              <Search className="w-3.5 h-3.5 mr-2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar en panel..."
                className="bg-transparent border-none outline-none text-xs w-28 md:w-36 text-gray-800 placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 ml-1">
                  <X className="w-3 h-3" />
                </button>
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
            <div className="lg:col-span-4 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {isAdmin ? "Inventario por Nicho" : "Frecuencia de Compras"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isAdmin ? "Volumen real de piezas por categoría" : "Gastos calculados por mes (2026)"}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                  {isAdmin ? `${products.length} Total` : "Semestre"}
                </span>
              </div>

              {/* Visual Dynamic Bar Chart */}
              <div className="flex items-end justify-between gap-3 h-36 pt-4 px-2">
                {isAdmin ? (
                  categoryDistributionData.map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end" title={`${bar.category}: ${bar.count} productos`}>
                      <div 
                        className={`w-full rounded-xl transition-all ${bar.count > 0 ? "bg-[#e07a3f]" : "bg-gray-200"}`} 
                        style={{ height: `${bar.heightPct}%` }}
                      />
                      <span className="text-[9px] font-medium text-gray-400 truncate max-w-[36px]">{bar.category}</span>
                    </div>
                  ))
                ) : (
                  monthlySpendData.map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end" title={`${bar.month}: $${bar.total.toFixed(2)}`}>
                      <div 
                        className={`w-full rounded-xl transition-all ${bar.hasData ? "bg-[#e07a3f]" : "bg-gray-200"}`} 
                        style={{ height: `${bar.heightPct}%` }}
                      />
                      <span className="text-[10px] font-medium text-gray-400">{bar.month}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#e07a3f]" /> 
                  {isAdmin ? "Con existencias" : "Compras registradas"}
                </span>
                <span className="text-gray-400">
                  {isAdmin ? `${categories.length} categorías analizadas` : (orders.length === 0 ? "0 transacciones aún" : `${orders.length} pedidos`)}
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
            <div className="lg:col-span-5 bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8c9276]" /> Dirección de Entrega
                  </h3>
                  {address && (
                    <button 
                      onClick={() => removeAddress()}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                {address ? (
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1 text-xs">
                    <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                    <p className="text-gray-600">{address.street}</p>
                    <p className="text-gray-600">{address.city}, {address.state} {address.postalCode}</p>
                    <p className="text-gray-500 font-medium">{address.country}</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-2 bg-gray-50/40">
                    <MapPin className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-xs font-bold text-gray-800">Sin dirección registrada</p>
                    <p className="text-[11px] text-gray-500">
                      Añade tus datos de entrega para agilizar el proceso de compra.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                {showAddressForm ? (
                  <form onSubmit={handleAddressSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Calle y Número</label>
                      <input 
                        type="text" 
                        required 
                        value={street} 
                        onChange={e => setStreet(e.target.value)} 
                        placeholder="Av. Diagonal 450, 3ro 2da" 
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
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
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
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
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Provincia/Estado</label>
                        <input 
                          type="text" 
                          value={stateProv} 
                          onChange={e => setStateProv(e.target.value)} 
                          placeholder="Cataluña" 
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">País</label>
                        <input 
                          type="text" 
                          value={country} 
                          onChange={e => setCountry(e.target.value)} 
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowAddressForm(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                      <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800">Guardar Dirección</button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => setShowAddressForm(true)}
                    className="w-full py-2.5 bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
                  >
                    {address ? "Modificar Dirección" : "+ Agregar Dirección de Entrega"}
                  </button>
                )}
              </div>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Badge de Marketing</label>
                  <select value={prodBadge} onChange={e => setProdBadge(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                    <option value="">Sin badge</option>
                    <option value="Más Vendido">Más Vendido</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Tendencia">Tendencia</option>
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

    </div>
  );
}
