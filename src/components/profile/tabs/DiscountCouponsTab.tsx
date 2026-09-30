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
} from "lucide-react";
import { useCouponStore, DiscountCoupon } from "@/lib/couponStore";

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
        ? `${formDiscountVal}% de descuento en toda la tienda.`
        : `${formDiscountVal}% de descuento exclusivo en ${formNiche}.`,
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
    // Reset form
    setFormCode("");
    setFormTitle("");
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesNiche = c.targetNiche?.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesNiche) return false;
      }

      // Filter tab
      if (activeFilter === "storewide") return c.scope === "all";
      if (activeFilter === "niche") return c.scope === "niche";
      if (activeFilter === "active") return c.isActive;
      return true;
    });
  }, [coupons, searchQuery, activeFilter]);

  // Statistics
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
      {/* 1. HEADER SECTION                                                    */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-[#202022]/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motor de Cupones & Campañas Virales</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
            Códigos de Descuento
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Genera cupones aleatorios con 1 click o crea promociones personalizadas para enviar a grupos de WhatsApp, amigos o clientes frecuentes.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{showManualForm ? "Ocultar Creador" : "Crear Manual"}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. STATS BAR                                                          */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Cupones Activos</p>
            <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.activeCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Descuento Promedio</p>
            <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.avgDiscount}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Compartidos a Grupos</p>
            <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.totalShares}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Usos Registrados</p>
            <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.totalUses}</p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. HERO ACTION CARD: GENERADOR INTELIGENTE AL AZAR                  */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#18181b] via-[#202025] to-[#121215] text-white shadow-xl border border-white/10">
        {/* Glow ambient background circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-md border border-white/15">
              <Dices className="w-3.5 h-3.5" />
              <span>Generación Aleatoria con 1 Click</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ¿Quieres un cupón sorpresa ahora mismo?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              El algoritmo seleccionará automáticamente si es para toda la tienda o un nicho especial, calculará el valor de descuento, nombre atractivo y duración óptima.
            </p>

            {/* Scope Selection Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-400 font-medium">Preferencia de alcance:</span>
              <button
                type="button"
                onClick={() => setRandomScopeChoice("any")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  randomScopeChoice === "any"
                    ? "bg-white text-gray-950 shadow-sm"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                🎲 Sorpresa Total
              </button>
              <button
                type="button"
                onClick={() => setRandomScopeChoice("all")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  randomScopeChoice === "all"
                    ? "bg-white text-gray-950 shadow-sm"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                🏛️ Toda la Tienda
              </button>
              <button
                type="button"
                onClick={() => setRandomScopeChoice("niche")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  randomScopeChoice === "niche"
                    ? "bg-white text-gray-950 shadow-sm"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                🌿 Por Nicho
              </button>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleTriggerRandom}
              className="group relative px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.35)] active:scale-95 transition-all cursor-pointer"
            >
              <Dices className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500 text-gray-950" />
              <span>Generar Cupón Sorpresa</span>
            </button>
          </div>
        </div>

        {/* JUST GENERATED BANNER MODAL (INLINE POP) */}
        {justGeneratedCoupon && (
          <div className="mt-8 pt-6 border-t border-white/15 animate-in">
            <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-gray-950">
                    ¡Cupón Generado con Éxito!
                  </span>
                  <span className="text-xs text-emerald-300 font-semibold">
                    {justGeneratedCoupon.scope === "all" ? "Válido en Toda la Tienda" : `Colección: ${justGeneratedCoupon.targetNiche}`}
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
                  className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-white text-gray-950 text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
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

                <button
                  onClick={() => handleShareWhatsApp(justGeneratedCoupon)}
                  className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleCopyFullMessage(justGeneratedCoupon)}
                  className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Copiar texto listo para pegar en chats"
                >
                  {copiedMessageId === justGeneratedCoupon.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>¡Texto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Copiar Mensaje</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. MANUAL COUPON CREATOR FORM (COLLAPSIBLE)                           */}
      {/* ===================================================================== */}
      {showManualForm && (
        <form
          onSubmit={handleCreateManual}
          className="bg-white dark:bg-[#202022] p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-white/10 shadow-lg space-y-6 animate-in"
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                Crear Cupón Personalizado
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Define el nombre exacto, condiciones de compra y fecha de caducidad.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Código del Cupón *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. AMIGOS20 o FLASH50"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm font-mono font-bold text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all uppercase"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Título o Motivo de la Promo
              </label>
              <input
                type="text"
                placeholder="Ej. Promo Lanzamiento de Primavera"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo de Beneficio
              </label>
              <select
                value={formDiscountType}
                onChange={(e) => setFormDiscountType(e.target.value as "percent" | "free_shipping")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1c] text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              >
                <option value="percent">Porcentaje de Descuento (%)</option>
                <option value="free_shipping">Envío Gratis Bonificado</option>
              </select>
            </div>

            {/* Discount Value */}
            {formDiscountType === "percent" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Porcentaje de Descuento: {formDiscountVal}%
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="70"
                    step="5"
                    value={formDiscountVal}
                    onChange={(e) => setFormDiscountVal(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 w-12 text-right">
                    {formDiscountVal}%
                  </span>
                </div>
              </div>
            )}

            {/* Scope */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Alcance de Productos
              </label>
              <select
                value={formScope}
                onChange={(e) => setFormScope(e.target.value as "all" | "niche")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1c] text-sm text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
              >
                <option value="all">Toda la Tienda (Cualquier Producto)</option>
                <option value="niche">Nicho Específico</option>
              </select>
            </div>

            {/* Specific Niche */}
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

            {/* Min Order */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Pedido Mínimo ($ USD)
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

            {/* Duration */}
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
                <option value="none">Sin fecha de vencimiento</option>
              </select>
            </div>

            {/* Max Uses */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Límite de Usos
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
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
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
      {/* 5. SEARCH & FILTER BAR                                                */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
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
            Toda la Tienda
          </button>
          <button
            onClick={() => setActiveFilter("niche")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "niche"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Por Nicho
          </button>
          <button
            onClick={() => setActiveFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "active"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Solo Activos
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202022] text-xs text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. COUPONS GRID (TICKET LUXURY CARDS)                                 */}
      {/* ===================================================================== */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-16 bg-white/40 dark:bg-[#202022]/40 rounded-3xl border border-dashed border-gray-300 dark:border-white/10 space-y-3">
          <Tag className="w-8 h-8 text-gray-400 mx-auto" />
          <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
            No se encontraron cupones
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Prueba generando un cupón con el botón sorpresa de arriba o ajusta los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCoupons.map((coupon) => {
            const isStorewide = coupon.scope === "all";

            return (
              <div
                key={coupon.id}
                className={`relative overflow-hidden rounded-3xl bg-white dark:bg-[#202022] border transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  coupon.isActive
                    ? "border-black/10 dark:border-white/15"
                    : "border-black/5 dark:border-white/5 opacity-60 grayscale-[40%]"
                }`}
              >
                {/* Visual Ticket Notches (Left and Right Cutouts) */}
                <div className="absolute -left-3 top-24 w-6 h-6 rounded-full bg-[#f8f9fa] dark:bg-[#121214] border border-black/10 dark:border-white/10 pointer-events-none" />
                <div className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-[#f8f9fa] dark:bg-[#121214] border border-black/10 dark:border-white/10 pointer-events-none" />

                {/* Top Section */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isStorewide
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                      }`}
                    >
                      {isStorewide ? "🏛️ Toda la Tienda" : `🌿 ${coupon.targetNiche}`}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleCouponStatus(coupon.id)}
                      className="cursor-pointer text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title={coupon.isActive ? "Pausar cupón" : "Activar cupón"}
                    >
                      {coupon.isActive ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-gray-950 dark:text-white leading-snug">
                      {coupon.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {coupon.description}
                    </p>
                  </div>

                  {/* Big Discount Tag */}
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
                      {coupon.discountType === "free_shipping"
                        ? "Envío 100% Gratis"
                        : `-${coupon.discountPercent}% OFF`}
                    </span>
                    {coupon.minOrderAmount > 0 && (
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        Min. ${coupon.minOrderAmount} USD
                      </span>
                    )}
                  </div>

                  {/* Dashed Separator Line */}
                  <div className="border-t-2 border-dashed border-gray-200 dark:border-white/10 pt-3" />

                  {/* Coupon Code Pill */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2 pl-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono text-sm sm:text-base font-extrabold text-gray-950 dark:text-white tracking-wider">
                        {coupon.code}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-gray-50/80 dark:bg-black/20 p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>
                      {coupon.expiresAt
                        ? `Vence: ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : "Sin vencimiento"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(coupon)}
                      className="p-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all cursor-pointer"
                      title="Compartir directo a WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {/* Copy Full Message */}
                    <button
                      type="button"
                      onClick={() => handleCopyFullMessage(coupon)}
                      className="p-2 rounded-xl bg-gray-200/60 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                      title="Copiar texto listo para pegar en chats"
                    >
                      {copiedMessageId === coupon.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteCoupon(coupon.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="Eliminar cupón"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
