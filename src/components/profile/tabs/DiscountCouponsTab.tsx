"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Sparkles,
  Dices,
  Plus,
  Copy,
  Check,
  Share2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Percent,
  Send,
  MessageCircle,
  Flame,
  Clock,
  Wallet,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useCouponStore, DiscountCoupon } from "@/lib/couponStore";
import { VectorBarcode } from "@/components/ui/VectorBarcode";
import { CouponWalletModal } from "@/components/profile/modals/CouponWalletModal";

// ---------------------------------------------------------------------------
// Palettes for Style 1: Niche Specific Discounts (from Cupones Style.jpg)
// Playful, vibrant pastel gradients with high-contrast black typography
// ---------------------------------------------------------------------------
const STYLE1_GRADIENTS = [
  {
    bg: "from-[#ff758c] via-[#ff7eb3] to-[#ffb199]",
    badgeBg: "bg-black/10",
    border: "border-[#ff6584]/30",
  },
  {
    bg: "from-[#a18cd1] via-[#c084fc] to-[#fbc2eb]",
    badgeBg: "bg-black/10",
    border: "border-[#9b86f3]/30",
  },
  {
    bg: "from-[#38bdf8] via-[#818cf8] to-[#c084fc]",
    badgeBg: "bg-black/10",
    border: "border-[#38bdf8]/30",
  },
  {
    bg: "from-[#fb923c] via-[#f43f5e] to-[#60a5fa]",
    badgeBg: "bg-black/10",
    border: "border-[#fb923c]/30",
  },
  {
    bg: "from-[#f472b6] via-[#fb7185] to-[#fcd34d]",
    badgeBg: "bg-black/10",
    border: "border-[#f472b6]/30",
  },
];

// ---------------------------------------------------------------------------
// Palettes for Style 2: Storewide / General Discounts (from Cupones Style 2.jpg)
// Refined editorial vintage luxury aesthetic with earthy muted tones
// ---------------------------------------------------------------------------
const STYLE2_THEMES = [
  {
    name: "Matcha Olive",
    bg: "bg-[#d7e3a3]",
    text: "text-[#282f18]",
    border: "border-[#bfce82]",
    subText: "text-[#3f4728]",
  },
  {
    name: "Warm Sand Kraft",
    bg: "bg-[#c7b49b]",
    text: "text-[#2e241c]",
    border: "border-[#b09d84]",
    subText: "text-[#473b30]",
  },
  {
    name: "Espresso Noir",
    bg: "bg-[#373330]",
    text: "text-[#f5f0e9]",
    border: "border-[#4a4542]",
    subText: "text-[#d6cfc7]",
  },
  {
    name: "Alabaster Linen",
    bg: "bg-[#efe9df]",
    text: "text-[#292826]",
    border: "border-[#d8d0c2]",
    subText: "text-[#42413e]",
  },
  {
    name: "Terracotta Rust",
    bg: "bg-[#ba6a50]",
    text: "text-[#fff6f2]",
    border: "border-[#a55a42]",
    subText: "text-[#fcebe4]",
  },
];

function getCouponPaletteIndex(id: string, count: number): number {
  return Math.abs(id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % count;
}

export function DiscountCouponsTab() {
  const {
    coupons,
    activeFilter,
    searchQuery,
    fetchCoupons,
    generateRandomCoupon,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon,
    recordShare,
    getShareMessage,
    setActiveFilter,
    setSearchQuery,
  } = useCouponStore();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [justGeneratedCoupon, setJustGeneratedCoupon] = useState<DiscountCoupon | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Digital Wallet Modal state
  const [walletCoupon, setWalletCoupon] = useState<DiscountCoupon | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Manual Form State
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percent" | "fixed" | "free_shipping">("percent");
  const [formDiscountVal, setFormDiscountVal] = useState(20);
  const [formScope, setFormScope] = useState<"all" | "niche">("all");
  const [formNiche, setFormNiche] = useState("Iluminación");
  const [formMinOrder, setFormMinOrder] = useState(0);
  const [formDurationDays, setFormDurationDays] = useState<number | "none">(15);
  const [formMaxUses, setFormMaxUses] = useState<number | "none">(50);

  // Random Generator Options
  const [randomScopeChoice, setRandomScopeChoice] = useState<"any" | "all" | "niche">("any");
  const [randomTargetNiche, setRandomTargetNiche] = useState<string>("Iluminación");

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyFullMessage = (coupon: DiscountCoupon) => {
    const msg = getShareMessage(coupon);
    navigator.clipboard.writeText(msg);
    setCopiedMessageId(coupon.id);
    recordShare(coupon.id);
    setTimeout(() => setCopiedMessageId(null), 2500);
  };

  const handleShareWhatsApp = (coupon: DiscountCoupon) => {
    recordShare(coupon.id);
    const msg = encodeURIComponent(getShareMessage(coupon));
    window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
  };

  const handleOpenWalletModal = (coupon: DiscountCoupon) => {
    setWalletCoupon(coupon);
    setIsWalletOpen(true);
  };

  const handleTriggerRandom = () => {
    const coupon = generateRandomCoupon({
      preferredScope: randomScopeChoice === "any" ? undefined : randomScopeChoice,
      targetNiche: randomScopeChoice === "niche" ? randomTargetNiche : undefined,
    });
    setJustGeneratedCoupon(coupon);
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    const expiresAt = formDurationDays === "none"
      ? null
      : new Date(Date.now() + Number(formDurationDays) * 86400000).toISOString();

    const newCoupon = createCoupon({
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim() || `Cupón ${formCode.toUpperCase()}`,
      description: formScope === "all" 
        ? `${formDiscountVal}% de descuento comercial en todo el catálogo de diseño.`
        : `${formDiscountVal}% de descuento exclusivo en la colección ${formNiche}.`,
      discountPercent: formDiscountType === "free_shipping" ? 0 : Number(formDiscountVal),
      discountType: formDiscountType,
      scope: formScope,
      targetNiche: formScope === "niche" ? formNiche : undefined,
      minOrderAmount: Number(formMinOrder) || 0,
      maxUses: formMaxUses === "none" ? null : Number(formMaxUses),
      expiresAt,
      isActive: true,
    });

    setJustGeneratedCoupon(newCoupon);
    setShowManualForm(false);
    setFormCode("");
    setFormTitle("");
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesNiche = c.targetNiche?.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesNiche) return false;
      }

      if (activeFilter === "storewide") return c.scope === "all";
      if (activeFilter === "niche") return c.scope === "niche";
      if (activeFilter === "active") return c.isActive;
      return true;
    });
  }, [coupons, searchQuery, activeFilter]);

  // Strategic Statistics
  const stats = useMemo(() => {
    const activeCount = coupons.filter(c => c.isActive).length;
    const avgDiscount = coupons.length > 0 
      ? Math.round(coupons.reduce((sum, c) => sum + (c.discountPercent || 0), 0) / coupons.length)
      : 0;
    const totalShares = coupons.reduce((sum, c) => sum + (c.shareCount || 0), 0);
    const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    return { activeCount, avgDiscount, totalShares, totalUses };
  }, [coupons]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ===================================================================== */}
      {/* 1. PROFESSIONAL EXECUTIVE HEADER (crear-web-micro-saas standard)     */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white/80 dark:bg-[#202022]/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sistema Comercial • Fidelización & Retención de Clientes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
            Gestión Estratégica de Cupones & Campañas
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Genera incentivos comerciales con arquitectura de canje 100% en tiempo real. Exporta pases directos a Google Wallet con código de barras lineal 1D y comparte promociones de alto impacto con tus clientes.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{showManualForm ? "Ocultar Configurador" : "Configurar Cupón"}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. STATS KPI BAR                                                      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Campañas Activas</p>
            <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.activeCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Margen Promedio Otorgado</p>
            <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.avgDiscount}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Difusiones a Clientes</p>
            <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.totalShares}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Canjes Registrados</p>
            <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.totalUses}</p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. HERO GENERATOR: 1-CLICK STRATEGIC COUPON ENGINE                   */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 bg-gradient-to-br from-[#18181b] via-[#202025] to-[#121215] text-white shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-md border border-white/15">
              <Dices className="w-3.5 h-3.5" />
              <span>Algoritmo Generador en 1-Click</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              ¿Deseas activar una promoción comercial inmediata?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              El motor sintetiza automáticamente descuentos matemáticamente balanceados, delimitando alcance, mínimos de compra y código optimizado para retención y ticket promedio.
            </p>

            {/* Scope Selection Options */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-400 font-medium">Arquitectura de diseño:</span>
              <button
                type="button"
                onClick={() => setRandomScopeChoice("any")}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                  randomScopeChoice === "any"
                    ? "bg-white text-gray-950 shadow-sm"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                🎲 Distribución Aleatoria
              </button>
              <button
                type="button"
                onClick={() => setRandomScopeChoice("all")}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                  randomScopeChoice === "all"
                    ? "bg-white text-gray-950 shadow-sm"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                🏛️ Descuento Global (Estilo Vintage)
              </button>
              <button
                type="button"
                onClick={() => setRandomScopeChoice("niche")}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                  randomScopeChoice === "niche"
                    ? "bg-white text-gray-950 shadow-sm"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                🌿 Nicho de Autor (Estilo Scallop)
              </button>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleTriggerRandom}
              className="group relative px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.35)] active:scale-95 transition-all cursor-pointer"
            >
              <Dices className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500 text-gray-950" />
              <span>Generar Cupón Estratégico</span>
            </button>
          </div>
        </div>

        {/* JUST GENERATED BANNER MODAL */}
        {justGeneratedCoupon && (
          <div className="mt-8 pt-6 border-t border-white/15 animate-in">
            <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-gray-950">
                    ¡Cupón Generado con Éxito!
                  </span>
                  <span className="text-xs text-emerald-300 font-semibold">
                    {justGeneratedCoupon.scope === "all" ? "🏛️ Tienda Completa (Ticket Vintage)" : `🌿 Colección: ${justGeneratedCoupon.targetNiche} (Ticket Scallop)`}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-wider">
                    {justGeneratedCoupon.code}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-amber-300">
                    {justGeneratedCoupon.discountType === "free_shipping" ? "Envío Gratis" : `-${justGeneratedCoupon.discountPercent}% OFF`}
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  {justGeneratedCoupon.description}
                </p>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleCopyCode(justGeneratedCoupon.code)}
                  className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-white text-gray-950 text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {copiedCode === justGeneratedCoupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>

                {/* Add to Wallet button */}
                <button
                  onClick={() => handleOpenWalletModal(justGeneratedCoupon)}
                  className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Guardar en Wallet</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(justGeneratedCoupon)}
                  className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. MANUAL CREATOR FORM                                                */}
      {/* ===================================================================== */}
      {showManualForm && (
        <form
          onSubmit={handleCreateManual}
          className="p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#202022] border border-black/10 dark:border-white/10 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                Creación Manual de Cupón
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Define las reglas comerciales precisas para tu nueva campaña de incentivos.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              Personalizado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Código del Cupón (Ej: LUMINA-VIP)
              </label>
              <input
                type="text"
                required
                placeholder="PROMO2026"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm font-mono text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre / Título de Campaña
              </label>
              <input
                type="text"
                placeholder="Descuento Primavera"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo de Beneficio
              </label>
              <select
                value={formDiscountType}
                onChange={(e) => setFormDiscountType(e.target.value as "percent" | "fixed" | "free_shipping")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1c] text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              >
                <option value="percent">Porcentaje de Descuento (%)</option>
                <option value="free_shipping">Envío 100% Gratis</option>
              </select>
            </div>

            {formDiscountType === "percent" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Porcentaje (% de Descuento)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formDiscountVal}
                  onChange={(e) => setFormDiscountVal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Alcance & Arquitectura Visual
              </label>
              <select
                value={formScope}
                onChange={(e) => setFormScope(e.target.value as "all" | "niche")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1c] text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              >
                <option value="all">Toda la Tienda (Estilo Ticket Editorial Vintage)</option>
                <option value="niche">Nicho Específico (Estilo Ticket Scallop Pastel)</option>
              </select>
            </div>

            {formScope === "niche" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Colección / Nicho Seleccionado
                </label>
                <select
                  value={formNiche}
                  onChange={(e) => setFormNiche(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1c] text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                >
                  <option value="Iluminación">Iluminación de Ambiente</option>
                  <option value="Aromaterapia">Aromaterapia & Esencias</option>
                  <option value="Home Office">Home Office & Ergonomía</option>
                  <option value="Textiles">Textiles & Lana</option>
                  <option value="Cerámica">Cerámica de Autor</option>
                  <option value="Decoración">Decoración & Esculturas</option>
                  <option value="Cocina">Cocina & Barista</option>
                  <option value="Bienestar">Bienestar & Descanso</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Compra Mínima ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="0 (Sin mínimo)"
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Vigencia del Cupón
              </label>
              <select
                value={formDurationDays}
                onChange={(e) => setFormDurationDays(e.target.value === "none" ? "none" : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1c] text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              >
                <option value={7}>7 días</option>
                <option value={15}>15 días</option>
                <option value={30}>30 días</option>
                <option value="none">Sin fecha de caducidad</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Límite de Canjes
              </label>
              <select
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value === "none" ? "none" : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1c] text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              >
                <option value={10}>10 canjes máximos</option>
                <option value={30}>30 canjes</option>
                <option value={50}>50 canjes</option>
                <option value={100}>100 canjes</option>
                <option value="none">Ilimitado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-bold hover:bg-black dark:hover:bg-gray-100 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Guardar y Activar Cupón
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 5. SEARCH & FILTER CONTROLS                                           */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100/80 dark:bg-[#202022] overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Todos ({coupons.length})
          </button>
          <button
            onClick={() => setActiveFilter("storewide")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "storewide"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            🏛️ Generales Tienda (Vintage)
          </button>
          <button
            onClick={() => setActiveFilter("niche")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "niche"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            🌿 Específicos de Nicho (Scallop)
          </button>
          <button
            onClick={() => setActiveFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "active"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Vigentes ({coupons.filter(c => c.isActive).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o nicho..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202022] text-xs text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. COUPONS GRID: 2 DISTINCT VISUAL ARCHITECTURES                     */}
      {/* ===================================================================== */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-16 bg-white/40 dark:bg-[#202022]/40 rounded-3xl border border-dashed border-gray-300 dark:border-white/10 space-y-3">
          <Tag className="w-8 h-8 text-gray-400 mx-auto" />
          <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
            No se encontraron cupones en este filtro
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Utiliza el generador algorítmico superior o crea uno personalizado con el configurador manual.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => {
            const isStorewide = coupon.scope === "all";

            // =================================================================
            // STYLE 1: NICHE / PRODUCT-SPECIFIC TICKET (from Cupones Style.jpg)
            // Vibrant pastel gradients, scalloped border notches, stacked bold %,
            // horizontal 1D barcode on left, framed CODE badge on right.
            // =================================================================
            if (!isStorewide) {
              const palIdx = getCouponPaletteIndex(coupon.id, STYLE1_GRADIENTS.length);
              const palette = STYLE1_GRADIENTS[palIdx];

              return (
                <div
                  key={coupon.id}
                  className={`flex flex-col justify-between transition-all duration-300 ${
                    coupon.isActive ? "opacity-100" : "opacity-60 grayscale-[40%]"
                  }`}
                >
                  {/* Physical Ticket Body */}
                  <div
                    className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-r ${palette.bg} p-5 sm:p-6 text-black shadow-md hover:shadow-xl transition-all duration-300 border ${palette.border} select-none`}
                  >
                    {/* Scalloped outer cutouts (Left & Right) */}
                    <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#f8f9fa] dark:bg-[#121214] shadow-inner pointer-events-none" />
                    <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#f8f9fa] dark:bg-[#121214] shadow-inner pointer-events-none" />

                    {/* Perforation vertical circular notches (Top & Bottom) */}
                    <div className="absolute left-[47%] -top-3 w-5 h-5 rounded-full bg-[#f8f9fa] dark:bg-[#121214] pointer-events-none" />
                    <div className="absolute left-[47%] -bottom-3 w-5 h-5 rounded-full bg-[#f8f9fa] dark:bg-[#121214] pointer-events-none" />

                    {/* Main Internal Ticket Layout */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Left Column: Stacked Giant Discount + Horizontal 1D Barcode */}
                      <div className="w-[45%] flex flex-col justify-between shrink-0">
                        <div className="flex flex-col leading-none">
                          <span className="text-3xl sm:text-4xl font-black text-black tracking-tight leading-none">
                            {coupon.discountType === "free_shipping" ? "100%" : `${coupon.discountPercent}%`}
                          </span>
                          <span className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none mt-1">
                            {coupon.discountType === "free_shipping" ? "GRATIS" : "OFF"}
                          </span>
                        </div>

                        {/* 1D Linear Barcode (Horizontal Code 128) */}
                        <div className="w-full mt-3 pt-1">
                          <VectorBarcode
                            code={coupon.code}
                            height={24}
                            color="#0c0d0e"
                            className="w-full max-w-[130px]"
                          />
                        </div>
                      </div>

                      {/* Vertical Dashed Perforation Line */}
                      <div className="h-28 border-r-2 border-dashed border-black/30 shrink-0" />

                      {/* Right Column: CODE Badge + Code + Niche Condition */}
                      <div className="w-[50%] flex flex-col justify-between pl-1">
                        <div>
                          {/* Framed CODE badge */}
                          <div className="inline-block border border-black/80 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase text-black tracking-wider bg-black/5">
                            CODE
                          </div>

                          <h4 className="text-base sm:text-lg font-black text-black tracking-wide uppercase mt-1 break-all leading-tight">
                            {coupon.code}
                          </h4>
                        </div>

                        {/* Thin Rule */}
                        <div className="w-full h-[1px] bg-black/25 my-1.5" />

                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold text-black/90 leading-tight truncate">
                            {coupon.targetNiche ? `Colección: ${coupon.targetNiche}` : "Nicho Específico"}
                          </p>
                          {coupon.minOrderAmount > 0 && (
                            <p className="text-[10px] font-semibold text-black/75">
                              Spend ${coupon.minOrderAmount}+ USD
                            </p>
                          )}
                          <p className="text-[9px] font-medium text-black/60 pt-0.5">
                            {coupon.expiresAt
                              ? `Vence: ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                })}`
                              : "Vigencia permanente"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attached Action Ribbon */}
                  <div className="mt-2 px-2 flex items-center justify-between gap-1.5 bg-white/50 dark:bg-[#202022]/50 p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-2xs">
                    {/* Copy Code */}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-[11px] font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Copiar código"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    {/* Add to Wallet (1D Barcode integration) */}
                    <button
                      type="button"
                      onClick={() => handleOpenWalletModal(coupon)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-black dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                      title="Guardar en Google Wallet con Código de Barras 1D"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Wallet</span>
                    </button>

                    {/* Share WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(coupon)}
                      className="p-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all cursor-pointer"
                      title="Compartir directo a WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle status */}
                    <button
                      type="button"
                      onClick={() => toggleCouponStatus(coupon.id)}
                      className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                      title={coupon.isActive ? "Pausar cupón" : "Activar cupón"}
                    >
                      {coupon.isActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteCoupon(coupon.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="Eliminar cupón"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // =================================================================
            // STYLE 2: STOREWIDE GENERAL TICKET (from Cupones Style 2.jpg)
            // Luxury editorial vintage aesthetic with earthy muted palettes.
            // Left stub with vertical 1D barcode + vertical dashed perforation,
            // Right main body with cursive script "Lumina Home", uppercase display
            // serif, refined oval "GET DISCOUNT 15%" badge, and store domain.
            // =================================================================
            const themeIdx = getCouponPaletteIndex(coupon.id, STYLE2_THEMES.length);
            const theme = STYLE2_THEMES[themeIdx];

            return (
              <div
                key={coupon.id}
                className={`flex flex-col justify-between transition-all duration-300 ${
                  coupon.isActive ? "opacity-100" : "opacity-60 grayscale-[40%]"
                }`}
              >
                {/* Physical Ticket Body */}
                <div
                  className={`relative overflow-hidden rounded-[1.75rem] ${theme.bg} ${theme.text} p-4 sm:p-5 shadow-md hover:shadow-xl transition-all duration-300 border ${theme.border} select-none`}
                >
                  {/* Semicircular outer notches (Left & Right) */}
                  <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#f8f9fa] dark:bg-[#121214] shadow-inner pointer-events-none" />
                  <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#f8f9fa] dark:bg-[#121214] shadow-inner pointer-events-none" />

                  {/* Perforation vertical circular notches (Top & Bottom) */}
                  <div className="absolute left-[28%] -top-3 w-5 h-5 rounded-full bg-[#f8f9fa] dark:bg-[#121214] pointer-events-none" />
                  <div className="absolute left-[28%] -bottom-3 w-5 h-5 rounded-full bg-[#f8f9fa] dark:bg-[#121214] pointer-events-none" />

                  {/* Internal Vintage Ticket Split */}
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left Stub: Prominent Vertical 1D Linear Barcode */}
                    <div className="w-[26%] flex items-center justify-center shrink-0 pr-1">
                      <div className="w-full max-w-[50px] h-[86px] flex items-center justify-center">
                        <VectorBarcode
                          code={coupon.code}
                          vertical
                          color="currentColor"
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    {/* Vertical Perforation Dashed Line */}
                    <div className="h-28 border-r-2 border-dashed border-current opacity-40 shrink-0" />

                    {/* Right Main Body: Editorial luxury typography & oval badge */}
                    <div className="w-[70%] flex flex-col justify-between pl-1">
                      {/* Top sub-row: Cursive Script + Display Serif vs Oval Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-serif italic text-2xl sm:text-3xl leading-none block">
                            Lúmina Home
                          </span>
                          <span className="font-serif uppercase tracking-[0.14em] text-[11px] sm:text-xs font-bold block opacity-95">
                            CUPÓN DE TIENDA
                          </span>
                        </div>

                        {/* Refined Oval / Ellipse Discount Badge */}
                        <div className="border border-current rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 flex flex-col items-center justify-center text-center aspect-[1.3/1] min-w-[76px] sm:min-w-[84px] shrink-0">
                          <span className="font-serif uppercase tracking-widest text-[8px] leading-tight">
                            GET
                          </span>
                          <span className="font-serif uppercase tracking-wider text-[9px] sm:text-[10px] font-bold leading-tight">
                            DISCOUNT
                          </span>
                          <span className="font-serif text-lg sm:text-xl font-bold leading-none mt-0.5">
                            {coupon.discountType === "free_shipping" ? "100%" : `${coupon.discountPercent}%`}
                          </span>
                        </div>
                      </div>

                      {/* Horizontal Dashed Line */}
                      <div className="border-t border-dashed border-current opacity-35 my-2 w-full" />

                      {/* Bottom Sub-row: Store Domain + Expiration Date */}
                      <div className="flex items-center justify-between text-[9px] font-mono tracking-wider">
                        <span className="font-bold opacity-90 uppercase">
                          WWW.LUMINAHOME.EC
                        </span>
                        <span className="font-semibold opacity-85 uppercase truncate max-w-[120px] text-right">
                          {coupon.expiresAt
                            ? `*HASTA ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}`
                            : "*SIN VENCIMIENTO"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attached Action Ribbon */}
                <div className="mt-2 px-2 flex items-center justify-between gap-1.5 bg-white/50 dark:bg-[#202022]/50 p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-2xs">
                  {/* Copy Code */}
                  <button
                    type="button"
                    onClick={() => handleCopyCode(coupon.code)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-[11px] font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                    title="Copiar código"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {/* Add to Wallet (1D Barcode integration) */}
                  <button
                    type="button"
                    onClick={() => handleOpenWalletModal(coupon)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-black dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                    title="Guardar en Google Wallet con Código de Barras 1D"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Wallet</span>
                  </button>

                  {/* Share WhatsApp */}
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(coupon)}
                    className="p-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all cursor-pointer"
                    title="Compartir directo a WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle status */}
                  <button
                    type="button"
                    onClick={() => toggleCouponStatus(coupon.id)}
                    className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    title={coupon.isActive ? "Pausar cupón" : "Activar cupón"}
                  >
                    {coupon.isActive ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => deleteCoupon(coupon.id)}
                    className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
                    title="Eliminar cupón"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. DIGITAL WALLET MODAL (1D LINEAR BARCODE · CODE 128 · NO QR)       */}
      {/* ===================================================================== */}
      <CouponWalletModal
        open={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        coupon={walletCoupon}
      />
    </div>
  );
}
