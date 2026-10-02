"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MessageCircle,
  Flame,
  Wallet,
  ShieldCheck,
  Scissors,
  ExternalLink,
} from "lucide-react";
import { useCouponStore, DiscountCoupon } from "@/lib/couponStore";
import { VectorBarcode } from "@/components/ui/VectorBarcode";
import { CouponWalletModal } from "@/components/profile/modals/CouponWalletModal";
import { generateCouponPng } from "@/lib/couponPngGenerator";

// ---------------------------------------------------------------------------
// Palettes for Style 1: Niche Specific Discounts (from Cupones Style.jpg)
// ---------------------------------------------------------------------------
const STYLE1_GRADIENTS = [
  { start: "#ff5d99", mid: "#ff8ea3", end: "#ffb68d" }, // Hot Pink to Peach
  { start: "#8f85f3", mid: "#ba86f4", end: "#ff7fa8" }, // Purple to Orchid Pink
  { start: "#4ec3f7", mid: "#7abcf8", end: "#b98ef5" }, // Sky Blue to Lavender
  { start: "#ff8676", mid: "#ffa590", end: "#81cefb" }, // Coral to Powder Blue
];

// ---------------------------------------------------------------------------
// Palettes for Style 2: Storewide General Discounts (from Cupones Style 2.jpg)
// ---------------------------------------------------------------------------
const STYLE2_THEMES = [
  { bg: "#d5df9a", text: "#283116", border: "#bfce82", name: "Matcha Olive" },
  { bg: "#c3b093", text: "#2f251c", border: "#b09d84", name: "Kraft Sand" },
  { bg: "#363230", text: "#ede6d8", border: "#4a4542", name: "Espresso Noir" },
];

function getCouponPaletteIndex(id: string, count: number): number {
  return Math.abs(id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % count;
}

// ===========================================================================
// SUB-COMPONENT: STYLE 1 TICKET SVG (Cupones Style.jpg)
// Scalloped cutouts, giant 15% OFF, horizontal 1D barcode on left, CODE box
// ===========================================================================
function Style1TicketSvg({
  coupon,
  palette,
  className = "",
}: {
  coupon: DiscountCoupon;
  palette: { start: string; mid: string; end: string };
  className?: string;
}) {
  const gradId = `grad-s1-${coupon.id.replace(/[^a-zA-Z0-9]/g, "")}`;
  const discNum = coupon.discountType === "free_shipping" ? "100%" : `${coupon.discountPercent}%`;
  const offText = coupon.discountType === "free_shipping" ? "GRATIS" : "OFF";

  return (
    <div className={`relative w-full aspect-[380/215] select-none ${className}`}>
      <svg
        viewBox="0 0 380 215"
        className="w-full h-full overflow-visible drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.start} />
            <stop offset="45%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.end} />
          </linearGradient>
        </defs>

        {/* Outer Ticket Outline with Notches and Scallops */}
        <path
          d="
            M 18 0
            L 172 0
            A 8 8 0 0 0 188 0
            L 362 0
            A 18 18 0 0 1 380 18
            L 380 88
            A 18 18 0 0 0 380 126
            L 380 197
            A 18 18 0 0 1 362 215
            L 188 215
            A 8 8 0 0 0 172 215
            L 18 215
            A 18 18 0 0 1 0 197
            L 0 126
            A 18 18 0 0 0 0 88
            L 0 18
            A 18 18 0 0 1 18 0
            Z
          "
          fill={`url(#${gradId})`}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1"
        />

        {/* Scalloped teeth on left & right edges (exact ticket scallops) */}
        <circle cx="0" cy="30" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="46" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="62" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="78" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="136" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="152" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="168" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="184" r="3.5" fill="var(--background, #faf9f6)" />

        <circle cx="380" cy="30" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="380" cy="46" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="380" cy="62" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="380" cy="78" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="380" cy="136" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="380" cy="152" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="380" cy="168" r="3.5" fill="var(--background, #faf9f6)" />
        <circle cx="380" cy="184" r="3.5" fill="var(--background, #faf9f6)" />

        {/* Central Vertical Dashed Line */}
        <line
          x1="180"
          y1="10"
          x2="180"
          y2="205"
          stroke="rgba(0,0,0,0.35)"
          strokeDasharray="4 4"
          strokeWidth="1.5"
        />

        {/* LEFT COLUMN: Stacked Giant Discount Numbers */}
        <text
          x="30"
          y="80"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="54"
          letterSpacing="-2px"
          fill="#000000"
        >
          {discNum}
        </text>
        <text
          x="30"
          y="128"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="46"
          letterSpacing="-1px"
          fill="#000000"
        >
          {offText}
        </text>

        {/* RIGHT COLUMN: [CODE] Badge + Code + Niche/Condition */}
        <rect
          x="204"
          y="36"
          width="46"
          height="20"
          rx="3"
          fill="none"
          stroke="#000000"
          strokeWidth="1.2"
        />
        <text
          x="227"
          y="50"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="10.5"
          letterSpacing="0.8px"
          fill="#000000"
        >
          CODE
        </text>

        {/* Coupon Code */}
        <text
          x="204"
          y="84"
          fontFamily="system-ui, sans-serif"
          fontWeight="900"
          fontSize="24"
          letterSpacing="0.8px"
          fill="#000000"
        >
          {coupon.code}
        </text>

        {/* Divider hairline */}
        <line x1="204" y1="96" x2="348" y2="96" stroke="#000000" strokeWidth="0.8" opacity="0.3" />

        {/* Condition text */}
        <text
          x="204"
          y="118"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          fontSize="13"
          fill="#111111"
        >
          {coupon.targetNiche ? `Colección: ${coupon.targetNiche}` : "Exclusivo"}
        </text>
        <text
          x="204"
          y="138"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          fontSize="12"
          fill="#000000"
        >
          Spend ${coupon.minOrderAmount || 40}+ USD
        </text>
        <text
          x="204"
          y="158"
          fontFamily="system-ui, sans-serif"
          fontWeight="500"
          fontSize="10"
          fill="#444444"
        >
          {coupon.expiresAt
            ? `Vence: ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
            : "Vigencia permanente"}
        </text>
      </svg>

      {/* Real SVG Vector Barcode on left side under OFF */}
      <div className="absolute left-[8%] bottom-[16%] w-[34%] max-w-[125px]">
        <VectorBarcode code={coupon.code} height={25} color="#000000" className="w-full" />
      </div>
    </div>
  );
}

// ===========================================================================
// SUB-COMPONENT: STYLE 2 TICKET SVG (Cupones Style 2.jpg)
// Vintage editorial ticket, vertical 1D barcode on stub, cursive script title,
// uppercase display serif, and thin-line oval GET DISCOUNT badge.
// ===========================================================================
function Style2TicketSvg({
  coupon,
  theme,
  className = "",
}: {
  coupon: DiscountCoupon;
  theme: { bg: string; text: string; border: string };
  className?: string;
}) {
  const ovalDisc = coupon.discountType === "free_shipping" ? "100%" : `${coupon.discountPercent}%`;

  return (
    <div className={`relative w-full aspect-[460/168] select-none ${className}`}>
      <svg
        viewBox="0 0 460 168"
        className="w-full h-full overflow-visible drop-shadow-[0_12px_26px_rgba(0,0,0,0.14)]"
      >
        {/* Outer Ticket Outline with Notches */}
        <path
          d="
            M 22 0
            L 116 0
            A 9 9 0 0 0 134 0
            L 438 0
            A 22 22 0 0 1 460 22
            L 460 74
            A 10 10 0 0 0 460 94
            L 460 146
            A 22 22 0 0 1 438 168
            L 134 168
            A 9 9 0 0 0 116 168
            L 22 168
            A 22 22 0 0 1 0 146
            L 0 94
            A 10 10 0 0 0 0 74
            L 0 22
            A 22 22 0 0 1 22 0
            Z
          "
          fill={theme.bg}
          stroke={theme.border}
          strokeWidth="1.2"
        />

        {/* Perforation Dashed Vertical Line */}
        <line
          x1="125"
          y1="10"
          x2="125"
          y2="158"
          stroke={theme.text}
          strokeDasharray="4 4"
          strokeWidth="2"
          opacity="0.4"
        />

        {/* RIGHT BODY: Cursive Script "Lúmina Home" */}
        <text
          x="150"
          y="50"
          fontFamily="'Pinyon Script', 'Alex Brush', 'Caveat', cursive, Georgia, serif"
          fontSize="36"
          fontStyle="italic"
          fill={theme.text}
        >
          Lúmina Home
        </text>

        {/* Uppercase Serif: "CUPÓN DE TIENDA" */}
        <text
          x="152"
          y="74"
          fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="13"
          letterSpacing="2.5px"
          fill={theme.text}
        >
          CUPÓN DE TIENDA
        </text>

        {/* Horizontal Dashed Line */}
        <line
          x1="152"
          y1="96"
          x2="280"
          y2="96"
          stroke={theme.text}
          strokeDasharray="3 3"
          strokeWidth="1"
          opacity="0.35"
        />

        {/* Store URL */}
        <text
          x="152"
          y="124"
          fontFamily="monospace, system-ui"
          fontWeight="700"
          fontSize="10"
          letterSpacing="1px"
          fill={theme.text}
          opacity="0.9"
        >
          WWW.LUMINAHOME.EC
        </text>

        {/* RIGHT BODY: Oval Discount Badge */}
        <ellipse
          cx="375"
          cy="62"
          rx="48"
          ry="33"
          fill="none"
          stroke={theme.text}
          strokeWidth="1.2"
        />
        <text
          x="375"
          y="48"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="9.5"
          letterSpacing="2px"
          fill={theme.text}
        >
          GET
        </text>
        <text
          x="375"
          y="62"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="700"
          fontSize="11.5"
          letterSpacing="1.5px"
          fill={theme.text}
        >
          DISCOUNT
        </text>
        <text
          x="375"
          y="83"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="700"
          fontSize="20"
          fill={theme.text}
        >
          {ovalDisc}
        </text>

        {/* Date with Asterisk under oval */}
        <text
          x="375"
          y="124"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="600"
          fontSize="9"
          letterSpacing="1px"
          fill={theme.text}
          opacity="0.85"
        >
          {coupon.expiresAt
            ? `*VÁLIDO HASTA ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}`
            : "*SIN VENCIMIENTO"}
        </text>
      </svg>

      {/* LEFT STUB: Vertical Barcode */}
      <div className="absolute left-[4%] top-[18%] w-[20%] max-w-[56px] h-[64%] flex items-center justify-center">
        <VectorBarcode
          code={coupon.code}
          vertical
          color={theme.text}
          className="w-full h-full"
        />
      </div>
    </div>
  );
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
    setActiveFilter,
    setSearchQuery,
  } = useCouponStore();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [justGeneratedCoupon, setJustGeneratedCoupon] = useState<DiscountCoupon | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Digital Wallet Modal state (Detail Modal with official GoogleWalletButton)
  const [walletCoupon, setWalletCoupon] = useState<DiscountCoupon | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Falling Leaf Animation State
  const [fallingLeafCoupon, setFallingLeafCoupon] = useState<DiscountCoupon | null>(null);
  const [cuttingCouponId, setCuttingCouponId] = useState<string | null>(null);

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

  const handleOpenWalletModal = (coupon: DiscountCoupon) => {
    setWalletCoupon(coupon);
    setIsWalletOpen(true);
  };

  // WhatsApp PNG Sharing with Falling Leaf Animation
  const handleShareWhatsAppPng = async (coupon: DiscountCoupon) => {
    // 1. Trigger scissor cut effect
    setCuttingCouponId(coupon.id);

    // 2. Trigger falling leaf animation
    setTimeout(() => {
      setCuttingCouponId(null);
      setFallingLeafCoupon(coupon);
    }, 200);

    setTimeout(() => {
      setFallingLeafCoupon(null);
    }, 2000);

    // 3. Generate PNG file from 2D Canvas
    try {
      const pngFile = await generateCouponPng(coupon);

      // Check if browser supports Web Share Level 2 with files
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [pngFile] })
      ) {
        await navigator.share({
          files: [pngFile],
          title: `Cupón ${coupon.code} - Lúmina Home`,
          text: `¡Te comparto este cupón de descuento para Lúmina Home! Código: ${coupon.code}`,
        });
        recordShare(coupon.id);
        return;
      }

      // Fallback: Automatic download + WhatsApp Web open
      const url = URL.createObjectURL(pngFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lumina-Cupon-${coupon.code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      recordShare(coupon.id);
      const msg = encodeURIComponent(
        `¡Hola! Te comparto un cupón de descuento en Lúmina Home: *${coupon.code}* (${
          coupon.discountType === "free_shipping" ? "Envío Gratis" : `${coupon.discountPercent}% OFF`
        }). Te adjunto la imagen del cupón para canjear en la tienda.`
      );
      window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
    } catch (err) {
      console.error("Error sharing coupon PNG:", err);
    }
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

    const expiresAt =
      formDurationDays === "none"
        ? null
        : new Date(Date.now() + Number(formDurationDays) * 86400000).toISOString();

    const newCoupon = createCoupon({
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim() || `Cupón ${formCode.toUpperCase()}`,
      description:
        formScope === "all"
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
    const activeCount = coupons.filter((c) => c.isActive).length;
    const avgDiscount =
      coupons.length > 0
        ? Math.round(coupons.reduce((sum, c) => sum + (c.discountPercent || 0), 0) / coupons.length)
        : 0;
    const totalShares = coupons.reduce((sum, c) => sum + (c.shareCount || 0), 0);
    const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    return { activeCount, avgDiscount, totalShares, totalUses };
  }, [coupons]);

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* ===================================================================== */}
      {/* FALLING LEAF COUPON ANIMATION PORTAL OVERLAY                         */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {fallingLeafCoupon && (
          <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center overflow-hidden [perspective:1200px]">
            <motion.div
              key={`falling-${fallingLeafCoupon.id}`}
              initial={{ y: 0, x: 0, rotateZ: 0, rotateX: 0, opacity: 1, scale: 1 }}
              animate={{
                y: [0, -25, 80, 220, 390, 560],
                x: [0, 40, -45, 55, -25, 10],
                rotateZ: [0, -12, 18, -14, 10, -5],
                rotateX: [0, 25, -20, 25, -15, 0],
                scale: [1, 1.04, 0.98, 0.92, 0.85, 0.75],
                opacity: [1, 1, 1, 0.95, 0.65, 0],
              }}
              transition={{
                duration: 1.8,
                times: [0, 0.1, 0.35, 0.6, 0.82, 1],
                ease: "easeInOut",
              }}
              className="w-[340px] sm:w-[400px] drop-shadow-2xl"
            >
              {fallingLeafCoupon.scope === "all" ? (
                <Style2TicketSvg
                  coupon={fallingLeafCoupon}
                  theme={STYLE2_THEMES[getCouponPaletteIndex(fallingLeafCoupon.id, STYLE2_THEMES.length)]}
                />
              ) : (
                <Style1TicketSvg
                  coupon={fallingLeafCoupon}
                  palette={STYLE1_GRADIENTS[getCouponPaletteIndex(fallingLeafCoupon.id, STYLE1_GRADIENTS.length)]}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 1. PROFESSIONAL EXECUTIVE HEADER                                     */}
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
            Genera incentivos comerciales con arquitectura de canje 100% en tiempo real. Exporta pases directos a Google Wallet con código de barras lineal 1D y comparte promociones en PNG a través de WhatsApp.
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
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">PNGs Compartidos</p>
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
              El motor sintetiza automáticamente descuentos matemáticamente balanceados, seleccionando el diseño exacto según el alcance: Ticket Editorial Vintage para toda la tienda o Ticket Scallop Pastel para nichos específicos.
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
                    {justGeneratedCoupon.scope === "all"
                      ? "🏛️ Tienda Completa (Ticket Vintage)"
                      : `🌿 Colección: ${justGeneratedCoupon.targetNiche} (Ticket Scallop)`}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-wider">
                    {justGeneratedCoupon.code}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-amber-300">
                    {justGeneratedCoupon.discountType === "free_shipping"
                      ? "Envío Gratis"
                      : `-${justGeneratedCoupon.discountPercent}% OFF`}
                  </span>
                </div>
                <p className="text-xs text-gray-300">{justGeneratedCoupon.description}</p>
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

                <button
                  onClick={() => handleOpenWalletModal(justGeneratedCoupon)}
                  className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Detalle & Wallet</span>
                </button>

                <button
                  onClick={() => handleShareWhatsAppPng(justGeneratedCoupon)}
                  className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Compartir PNG</span>
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
                onChange={(e) =>
                  setFormDurationDays(e.target.value === "none" ? "none" : Number(e.target.value))
                }
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
                onChange={(e) =>
                  setFormMaxUses(e.target.value === "none" ? "none" : Number(e.target.value))
                }
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
            🏛️ Generales Tienda (Estilo 2 Vintage)
          </button>
          <button
            onClick={() => setActiveFilter("niche")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "niche"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            🌿 Específicos de Nicho (Estilo 1 Scallop)
          </button>
          <button
            onClick={() => setActiveFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "active"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Vigentes ({coupons.filter((c) => c.isActive).length})
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
      {/* 6. COUPONS GRID: 2 FORENSIC VISUAL ARCHITECTURES                     */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCoupons.map((coupon) => {
            const isStorewide = coupon.scope === "all";
            const isCutting = cuttingCouponId === coupon.id;

            return (
              <div
                key={coupon.id}
                className={`relative flex flex-col justify-between group transition-all duration-300 ${
                  coupon.isActive ? "opacity-100" : "opacity-60 grayscale-[40%]"
                }`}
              >
                {/* Physical Ticket Container */}
                <div
                  onClick={() => handleOpenWalletModal(coupon)}
                  className="relative cursor-pointer transition-transform duration-300 group-hover:-translate-y-1.5"
                >
                  {/* Scissors Cutting Glint Indicator */}
                  {isCutting && (
                    <motion.div
                      initial={{ top: "0%", opacity: 1 }}
                      animate={{ top: "100%", opacity: 0 }}
                      transition={{ duration: 0.35, ease: "linear" }}
                      className="absolute left-[48%] -translate-x-1/2 z-30 pointer-events-none flex items-center justify-center text-amber-300"
                    >
                      <Scissors className="w-6 h-6 rotate-90 drop-shadow-md text-amber-400 animate-spin" />
                    </motion.div>
                  )}

                  {isStorewide ? (
                    // -------------------------------------------------------------
                    // STYLE 2: STOREWIDE GENERAL TICKET (Cupones Style 2.jpg)
                    // -------------------------------------------------------------
                    <Style2TicketSvg
                      coupon={coupon}
                      theme={STYLE2_THEMES[getCouponPaletteIndex(coupon.id, STYLE2_THEMES.length)]}
                      className="w-full"
                    />
                  ) : (
                    // -------------------------------------------------------------
                    // STYLE 1: NICHE SPECIFIC TICKET (Cupones Style.jpg)
                    // -------------------------------------------------------------
                    <Style1TicketSvg
                      coupon={coupon}
                      palette={STYLE1_GRADIENTS[getCouponPaletteIndex(coupon.id, STYLE1_GRADIENTS.length)]}
                      className="w-full"
                    />
                  )}
                </div>

                {/* Floating Action Ribbon under ticket */}
                <div className="mt-3 px-3 py-2 rounded-2xl bg-white/70 dark:bg-[#202022]/70 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-between gap-1.5">
                  {/* Copy Code */}
                  <button
                    type="button"
                    onClick={() => handleCopyCode(coupon.code)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[11px] font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Copiar código alfanumérico"
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

                  {/* Detalle & Wallet */}
                  <button
                    type="button"
                    onClick={() => handleOpenWalletModal(coupon)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-black dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                    title="Ver detalle y agregar a Google Wallet"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Wallet</span>
                  </button>

                  {/* Share PNG on WhatsApp with Falling Leaf Animation */}
                  <button
                    type="button"
                    onClick={() => handleShareWhatsAppPng(coupon)}
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                    title="Cortar cupón y compartir imagen PNG por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Compartir PNG</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Toggle Status */}
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
                      className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="Eliminar cupón"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. DIGITAL WALLET DETAIL MODAL (OFFICIAL GoogleWalletButton · NO QR)   */}
      {/* ===================================================================== */}
      <CouponWalletModal
        open={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        coupon={walletCoupon}
      />
    </div>
  );
}
