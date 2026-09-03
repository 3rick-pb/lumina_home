"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  Store
} from "lucide-react";
import { useUserStore } from "@/lib/userStore";
import { useCatalogStore } from "@/lib/catalogStore";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, favorites, orders, cards, addCard, removeCard, updateOrderStatus } = useUserStore();
  const { products, categories, addProduct, deleteCategory } = useCatalogStore();

  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "cards" | "catalog" | "niches" | "settings">("overview");
  const [isMounted, setIsMounted] = useState(false);

  // New Card Modal State
  const [showCardModal, setShowCardModal] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardHolder, setNewCardHolder] = useState("");
  const [newCardExp, setNewCardExp] = useState("");
  const [newCardType, setNewCardType] = useState<"mastercard" | "visa">("mastercard");

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

  useEffect(() => {
    setIsMounted(true);
    if (isMounted && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isMounted, router]);

  if (!isMounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#8c9276] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Cargando portal seguro...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";

  // Discount auto calculation
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

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber || !newCardExp) return;
    addCard({
      number: `•••• •••• ${newCardNumber.slice(-4) || "8888"}`,
      holder: newCardHolder || user.name,
      exp: newCardExp,
      type: newCardType,
      isDefault: cards.length === 0
    });
    setShowCardModal(false);
    setNewCardNumber("");
    setNewCardHolder("");
    setNewCardExp("");
  };

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

  // Find empty niches
  const emptyCategories = categories.filter(cat => 
    !products.some(p => p.category?.toLowerCase() === cat.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 flex p-3 md:p-6 lg:p-8 selection:bg-[#8c9276]/20">
      
      {/* 1. Left Vertical Icon Sidebar (Reference Style) */}
      <aside className="w-16 md:w-20 bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col items-center py-6 justify-between shrink-0 mr-4 md:mr-6">
        
        {/* Brand Logo Symbol */}
        <div className="flex flex-col items-center gap-6">
          <Link href="/" className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8c9276] to-[#a4ab8c] flex items-center justify-center text-white shadow-md shadow-[#8c9276]/20 hover:scale-105 transition-transform" title="Lumina Home">
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
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="Ir a la Tienda">
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
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "overview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Resumen
              </button>
              <button 
                onClick={() => setActiveTab("orders")} 
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "orders" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Actividad
              </button>
              <button 
                onClick={() => setActiveTab("cards")} 
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "cards" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Tarjetas
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setActiveTab("catalog")} 
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === "catalog" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Inventario
                </button>
              )}
            </div>
          </div>

          {/* Right Profile Pill & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center bg-gray-100/70 px-3 py-1.5 rounded-2xl border border-gray-200/50 text-xs text-gray-600">
              <Search className="w-3.5 h-3.5 mr-2 text-gray-400" />
              <span>Buscar en panel...</span>
            </div>

            <Link href="/" className="hidden sm:flex text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              Ver Tienda &rarr;
            </Link>

            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-10 h-10 rounded-2xl bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center font-bold text-sm border border-[#8c9276]/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${isAdmin ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
                  {isAdmin ? "ADMINISTRADOR" : "CLIENTE"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Greeting Banner (Reference Style) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
              Buenos días, <span className="italic font-normal">{user.name}</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              {isAdmin 
                ? "Panel de control maestro de catálogo, inventario y métricas de Lumina Home." 
                : "Supervisa tus pedidos, métodos de pago guardados y estado de cuenta."}
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

        {/* 3. BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* BENTO CARD 1: Financial Balance / Spendings (4 cols) */}
          <div className="lg:col-span-4 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {isAdmin ? "Ingresos Totales Tienda" : "Total en Compras"}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  +14% <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-4xl font-display font-bold text-gray-900 tracking-tight mb-2">
                {isAdmin ? "$18,450.00" : "$269.30"}
              </p>
              <p className="text-xs text-gray-400">
                {isAdmin ? "Actualizado en tiempo real con Supabase" : "Total acumulado en pedidos de tu cuenta"}
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
            
            {/* Box 1 (Orange/Coral Accent from Reference) */}
            <div className="bg-gradient-to-br from-[#e07a3f] to-[#c75e24] p-5 rounded-[2rem] text-white shadow-md shadow-[#e07a3f]/15 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/80">
                  {isAdmin ? "Productos" : "Pedidos Activos"}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-display font-bold">{isAdmin ? products.length : orders.length}</p>
                <p className="text-[10px] text-white/70 mt-1">+100% verificado</p>
              </div>
            </div>

            {/* Box 2 (Dark Slate Accent from Reference) */}
            <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
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
                  {isAdmin ? `${emptyCategories.length} vacíos` : "Guardados en cuenta"}
                </p>
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  {isAdmin ? "Usuarios" : "Lumina Club"}
                </span>
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                  <Sparkles className="w-4 h-4 text-[#8c9276]" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-gray-900">
                  {isAdmin ? "En Vivo" : "450 pts"}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Nivel Oro</p>
              </div>
            </div>

            {/* Box 4 */}
            <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  {isAdmin ? "Tráfico" : "Cupones"}
                </span>
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                  <Clock className="w-4 h-4 text-[#8c9276]" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-gray-900">
                  {isAdmin ? "99.8%" : "1 Activo"}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {isAdmin ? "Uptime Vercel" : "15% off disponible"}
                </p>
              </div>
            </div>
          </div>

          {/* BENTO CARD 3: Activity Chart / Overview (4 cols) */}
          <div className="lg:col-span-4 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {isAdmin ? "Rendimiento Mensual" : "Frecuencia de Compras"}
                </h3>
                <p className="text-xs text-gray-400">Balance del semestre en curso</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 rounded-lg text-gray-600">2026</span>
            </div>

            {/* Visual Bar Chart (Directly inspired by reference image) */}
            <div className="flex items-end justify-between gap-3 h-36 pt-4 px-2">
              {[
                { month: "Ene", height: "45%", highlight: false },
                { month: "Feb", height: "65%", highlight: false },
                { month: "Mar", height: "85%", highlight: true },
                { month: "Abr", height: "60%", highlight: false },
                { month: "May", height: "75%", highlight: true },
                { month: "Jun", height: "95%", highlight: true },
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div 
                    className={`w-full rounded-xl transition-all ${bar.highlight ? "bg-[#e07a3f]" : "bg-neutral-900"}`} 
                    style={{ height: bar.height }}
                  />
                  <span className="text-[10px] font-medium text-gray-400">{bar.month}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#e07a3f]" /> Aprobado</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-900" /> Procesado</span>
            </div>
          </div>

          {/* BENTO CARD 4: MY CARDS (Tarjetas Guardadas - 4 cols) */}
          <div className="lg:col-span-4 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8c9276]" /> Mis Tarjetas
              </h3>
              <button 
                onClick={() => setShowCardModal(true)}
                className="text-xs font-semibold text-[#8c9276] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>

            {/* Stacked Payment Cards (Reference Style) */}
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

            <p className="text-[11px] text-gray-400 mt-4 text-center">
              Cifrado AES-256 de nivel bancario.
            </p>
          </div>

          {/* BENTO CARD 5: RECENT ACTIVITIES / ORDERS (8 cols) */}
          <div className="lg:col-span-8 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {isAdmin ? "Pedidos Recientes de Clientes" : "Actividades & Pedidos Recientes"}
                </h3>
                <p className="text-xs text-gray-400">Historial y trazabilidad de envíos</p>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {orders.length} registros
              </span>
            </div>

            {/* Activity Table (Reference Style) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-2">ID Pedido</th>
                    <th className="pb-3 px-2">Concepto</th>
                    <th className="pb-3 px-2">Monto</th>
                    <th className="pb-3 px-2">Estado</th>
                    <th className="pb-3 px-2">Fecha</th>
                    {isAdmin && <th className="pb-3 px-2 text-right">Gestión</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2 font-mono font-semibold text-gray-900">{ord.id}</td>
                      <td className="py-3.5 px-2 font-medium text-gray-800 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <span>Compra Lumina Living</span>
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
                      {isAdmin && (
                        <td className="py-3.5 px-2 text-right">
                          <select 
                            value={ord.status} 
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value as "Procesando" | "Enviado" | "Entregado")}
                            className="text-[11px] font-semibold bg-gray-100 rounded-lg px-2 py-1 outline-none border border-gray-200"
                          >
                            <option value="Procesando">Procesando</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Entregado">Entregado</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Mostrando últimos pedidos</span>
              <span className="font-semibold text-gray-900">Página 1 de 1</span>
            </div>
          </div>

          {/* ADMIN ONLY EXTRA SECTION: Empty Categories Warning & Niche Manager */}
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
                    Te recomendamos agregar productos o retirarlos temporalmente para mantener el catálogo profesional.
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
      </main>

      {/* MODAL: Agregar Tarjeta */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#8c9276]" /> Añadir Nueva Tarjeta
              </h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Tarjeta</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setNewCardType("mastercard")}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all ${newCardType === "mastercard" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  >
                    Mastercard
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewCardType("visa")}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all ${newCardType === "visa" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Número de Tarjeta (16 dígitos)</label>
                <input 
                  type="text" 
                  required 
                  maxLength={19}
                  value={newCardNumber} 
                  onChange={e => setNewCardNumber(e.target.value)} 
                  placeholder="4532 •••• •••• 8888" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Expiración (MM/AA)</label>
                <input 
                  type="text" 
                  required 
                  maxLength={5}
                  value={newCardExp} 
                  onChange={e => setNewCardExp(e.target.value)} 
                  placeholder="08/29" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCardModal(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-md">Guardar Tarjeta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Admin Nuevo Producto (Extended) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Producto</h2>
                <p className="text-xs text-gray-500">Se adaptará automáticamente a la estética Lumina.</p>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción Completa *</label>
                <textarea required rows={3} value={prodDescription} onChange={e => setProdDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none" placeholder="Describe los detalles de este producto..." />
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
