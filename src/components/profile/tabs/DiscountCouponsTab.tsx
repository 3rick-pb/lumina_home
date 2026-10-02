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
  CheckCircle2,
  Gift,
  BarChart3,
} from "lucide-react";
import { useCouponStore, DiscountCoupon } from "@/lib/couponStore";
import { useUserStore } from "@/lib/userStore";
import { VectorBarcode, SvgBarcodeGroup } from "@/components/ui/VectorBarcode";
import { CouponWalletModal } from "@/components/profile/modals/CouponWalletModal";
import { CouponAnalyticsModal } from "@/components/profile/modals/CouponAnalyticsModal";
import { generateCouponPng } from "@/lib/couponPngGenerator";

// ---------------------------------------------------------------------------
// Real WhatsApp SVG Icon Component
// ---------------------------------------------------------------------------
function WhatsAppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.04 3.67C14.24 3.67 16.31 4.53 17.87 6.09C19.42 7.64 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.67 20.16 9.33 19.8 8.15 19.1L7.87 18.93L4.76 19.75L5.59 16.72L5.4 16.42C4.63 15.19 4.22 13.57 4.22 11.91C4.22 7.37 7.92 3.67 12.04 3.67ZM8.78 7.37C8.6 7.37 8.3 7.44 8.05 7.71C7.81 7.98 7.12 8.63 7.12 9.94C7.12 11.26 8.08 12.52 8.21 12.7C8.35 12.87 10.09 15.56 12.77 16.71C13.41 16.99 13.9 17.15 14.29 17.27C14.93 17.48 15.52 17.45 15.98 17.38C16.5 17.3 17.57 16.73 17.8 16.09C18.02 15.44 18.02 14.89 17.95 14.77C17.89 14.66 17.72 14.59 17.46 14.46C17.2 14.33 15.92 13.7 15.68 13.62C15.45 13.53 15.28 13.49 15.11 13.75C14.94 14.01 14.46 14.59 14.31 14.75C14.17 14.92 14.02 14.94 13.76 14.81C13.5 14.68 12.67 14.41 11.68 13.53C10.91 12.84 10.39 12 10.24 11.74C10.09 11.48 10.22 11.34 10.35 11.21C10.47 11.09 10.62 10.89 10.75 10.74C10.88 10.59 10.92 10.48 11.01 10.31C11.1 10.13 11.05 9.98 10.99 9.85C10.92 9.72 10.4 8.44 10.18 7.92C9.97 7.41 9.75 7.48 9.59 7.47C9.44 7.46 9.27 7.46 9.09 7.46L8.78 7.37Z" />
    </svg>
  );
}

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
// Natural squarish/compact aspect ratio: 340 x 215. Does NOT stretch!
// Barcode is 100% native vector inside the SVG viewBox to prevent any overflow.
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
  // Anti-collision dynamic font sizing so long codes never overflow or get cut
  const codeFontSize = coupon.code.length > 14 ? 13 : coupon.code.length > 11 ? 15 : coupon.code.length > 9 ? 17 : 20;

  return (
    <div className={`relative w-full max-w-[340px] aspect-[340/215] select-none mx-auto ${className}`}>
      <svg
        viewBox="0 0 340 215"
        className="w-full h-full overflow-visible drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.start} />
            <stop offset="45%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.end} />
          </linearGradient>
        </defs>

        {/* Outer Ticket Outline with Notches and Scallops for 340 x 215 */}
        <path
          d="
            M 14 0
            L 139 0
            A 6 6 0 0 0 151 0
            L 326 0
            A 14 14 0 0 1 340 14
            L 340 94
            A 13.5 13.5 0 0 0 340 121
            L 340 201
            A 14 14 0 0 1 326 215
            L 151 215
            A 6 6 0 0 0 139 215
            L 14 215
            A 14 14 0 0 1 0 201
            L 0 121
            A 13.5 13.5 0 0 0 0 94
            L 0 14
            A 14 14 0 0 1 14 0
            Z
          "
          fill={`url(#${gradId})`}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1"
        />

        {/* Scalloped teeth on left edge */}
        <circle cx="0" cy="24" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="38" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="52" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="66" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="80" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="135" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="149" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="163" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="177" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="0" cy="191" r="3" fill="var(--background, #faf9f6)" />

        {/* Scalloped teeth on right edge */}
        <circle cx="340" cy="24" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="38" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="52" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="66" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="80" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="135" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="149" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="163" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="177" r="3" fill="var(--background, #faf9f6)" />
        <circle cx="340" cy="191" r="3" fill="var(--background, #faf9f6)" />

        {/* Central Vertical Dashed Line */}
        <line
          x1="145"
          y1="8"
          x2="145"
          y2="207"
          stroke="rgba(0,0,0,0.35)"
          strokeDasharray="4 4"
          strokeWidth="1.5"
        />

        {/* LEFT COLUMN: Stacked Giant Discount Numbers */}
        <text
          x="20"
          y="70"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="44"
          letterSpacing="-1.5px"
          fill="#000000"
        >
          {discNum}
        </text>
        <text
          x="20"
          y="112"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="36"
          letterSpacing="-1px"
          fill="#000000"
        >
          {offText}
        </text>

        {/* Real Native Vector Barcode strictly locked inside ticket geometry */}
        <SvgBarcodeGroup
          code={coupon.code}
          x={20}
          y={138}
          width={105}
          height={44}
          color="#000000"
        />

        {/* RIGHT COLUMN: [CODE] Badge + Code + Niche/Condition */}
        <rect
          x="160"
          y="22"
          width="42"
          height="18"
          rx="3"
          fill="none"
          stroke="#000000"
          strokeWidth="1.2"
        />
        <text
          x="181"
          y="35"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="10"
          letterSpacing="0.8px"
          fill="#000000"
        >
          CODE
        </text>

        {/* Coupon Code with Dynamic Scaling */}
        <text
          x="160"
          y="68"
          fontFamily="system-ui, sans-serif"
          fontWeight="900"
          fontSize={codeFontSize}
          letterSpacing="0.8px"
          fill="#000000"
        >
          {coupon.code}
        </text>

        {/* Divider hairline */}
        <line x1="160" y1="78" x2="318" y2="78" stroke="#000000" strokeWidth="0.8" opacity="0.3" />

        {/* Condition text */}
        <text
          x="160"
          y="98"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          fontSize="11"
          fill="#111111"
        >
          {coupon.targetNiche ? `Colección: ${coupon.targetNiche}` : "Colección Exclusiva"}
        </text>
        <text
          x="160"
          y="117"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          fontSize="10.5"
          fill="#000000"
        >
          {coupon.minOrderAmount > 0 ? `Spend $${coupon.minOrderAmount}+ USD` : "Sin compra mínima"}
        </text>
        <text
          x="160"
          y="136"
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
    </div>
  );
}

// ===========================================================================
// SUB-COMPONENT: STYLE 2 TICKET SVG (Cupones Style 2.jpg)
// Vintage editorial ticket, vertical 1D barcode on stub, cursive script title,
// uppercase display serif, and thin-line oval OBTÉN DESCUENTO badge.
// Natural rectangular aspect ratio: 460 x 170. Zero collision with oval.
// Brand spelled strictly "Lumina Home" without tilde with enhanced readability.
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
    <div className={`relative w-full max-w-[460px] aspect-[460/170] select-none mx-auto ${className}`}>
      <svg
        viewBox="0 0 460 170"
        className="w-full h-full overflow-visible drop-shadow-[0_12px_26px_rgba(0,0,0,0.14)]"
      >
        {/* Outer Ticket Outline with Notches */}
        <path
          d="
            M 16 0
            L 102 0
            A 8 8 0 0 0 118 0
            L 444 0
            A 16 16 0 0 1 460 16
            L 460 76
            A 9 9 0 0 0 460 94
            L 460 154
            A 16 16 0 0 1 444 170
            L 118 170
            A 8 8 0 0 0 102 170
            L 16 170
            A 16 16 0 0 1 0 154
            L 0 94
            A 9 9 0 0 0 0 76
            L 0 16
            A 16 16 0 0 1 16 0
            Z
          "
          fill={theme.bg}
          stroke={theme.border}
          strokeWidth="1.2"
        />

        {/* Perforation Dashed Vertical Line */}
        <line
          x1="110"
          y1="10"
          x2="110"
          y2="160"
          stroke={theme.text}
          strokeDasharray="4 4"
          strokeWidth="2"
          opacity="0.4"
        />

        {/* LEFT STUB: Native Vector Barcode strictly locked inside stub geometry */}
        <SvgBarcodeGroup
          code={coupon.code}
          x={20}
          y={20}
          width={68}
          height={130}
          color={theme.text}
          vertical={true}
        />

        {/* RIGHT BODY: Cursive Script "Lumina Home" (Clear & Legible 30px, Safe distance from oval) */}
        <text
          x="126"
          y="52"
          fontFamily="'Pinyon Script', 'Alex Brush', 'Caveat', cursive, Georgia, serif"
          fontSize="30"
          fontStyle="italic"
          fill={theme.text}
        >
          Lumina Home
        </text>

        {/* Uppercase Serif: "CUPÓN DE TIENDA" (Clear 13px) */}
        <text
          x="126"
          y="75"
          fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="13"
          letterSpacing="2px"
          fill={theme.text}
        >
          CUPÓN DE TIENDA
        </text>

        {/* Horizontal Dashed Line */}
        <line
          x1="126"
          y1="94"
          x2="270"
          y2="94"
          stroke={theme.text}
          strokeDasharray="3 3"
          strokeWidth="1.2"
          opacity="0.35"
        />

        {/* Store URL: WWW.LUMINAHOME.COM (Bigger 12px bold) */}
        <text
          x="126"
          y="122"
          fontFamily="system-ui, -apple-system, monospace"
          fontWeight="700"
          fontSize="12"
          letterSpacing="1px"
          fill={theme.text}
          opacity="0.92"
        >
          WWW.LUMINAHOME.COM
        </text>

        {/* RIGHT BODY: Oval Discount Badge (Safe distance at cx=378, Spanish copies "OBTÉN DESCUENTO") */}
        <ellipse
          cx="378"
          cy="62"
          rx="44"
          ry="32"
          fill="none"
          stroke={theme.text}
          strokeWidth="1.3"
        />
        <text
          x="378"
          y="47"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="2px"
          fill={theme.text}
        >
          OBTÉN
        </text>
        <text
          x="378"
          y="62"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="800"
          fontSize="11"
          letterSpacing="1.5px"
          fill={theme.text}
        >
          DESCUENTO
        </text>
        <text
          x="378"
          y="82"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="900"
          fontSize="19"
          fill={theme.text}
        >
          {ovalDisc}
        </text>

        {/* Date with Asterisk under oval */}
        <text
          x="378"
          y="122"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="700"
          fontSize="8.5"
          letterSpacing="0.8px"
          fill={theme.text}
          opacity="0.88"
        >
          {coupon.expiresAt
            ? `*VÁLIDO HASTA ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}`
            : "*SIN VENCIMIENTO"}
        </text>
      </svg>
    </div>
  );
}

export function DiscountCouponsTab() {
  const { user } = useUserStore();
  const isAdmin = user?.role === "ADMIN";

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

  // Forensic Analytics Modal State (Who used it, avatar, orders, amounts before/after)
  const [analyticsCoupon, setAnalyticsCoupon] = useState<DiscountCoupon | null>(null);

  // Falling Leaf Animation State
  const [fallingLeafCoupon, setFallingLeafCoupon] = useState<DiscountCoupon | null>(null);
  const [cuttingCouponId, setCuttingCouponId] = useState<string | null>(null);

  // Client-specific redeemed / used coupons state persisted in localStorage
  const [clientRedeemedIds, setClientRedeemedIds] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState<"all" | "available" | "used" | "storewide" | "niche">("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lumina_client_redeemed_coupons");
        if (saved) setClientRedeemedIds(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading client redeemed coupons:", e);
      }
    }
  }, []);

  const handleToggleClientRedeemed = (couponId: string) => {
    setClientRedeemedIds((prev) => {
      const next = prev.includes(couponId)
        ? prev.filter((id) => id !== couponId)
        : [...prev, couponId];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("lumina_client_redeemed_coupons", JSON.stringify(next));
        } catch (e) {
          console.error("Error storing client redeemed coupons:", e);
        }
      }
      return next;
    });
  };

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
          title: `Cupón ${coupon.code} - Lumina Home`,
          text: `¡Te comparto este cupón de descuento para Lumina Home! Código: ${coupon.code}`,
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
        `¡Hola! Te comparto un cupón de descuento en Lumina Home: *${coupon.code}* (${
          coupon.discountType === "free_shipping" ? "Envío Gratis" : `${coupon.discountPercent}% OFF`
        }). Te adjunto el cupón para canjear en la tienda.`
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

      if (isAdmin) {
        if (activeFilter === "storewide") return c.scope === "all";
        if (activeFilter === "niche") return c.scope === "niche";
        if (activeFilter === "active") return c.isActive;
        return true;
      } else {
        if (clientFilter === "available") return c.isActive && !clientRedeemedIds.includes(c.id);
        if (clientFilter === "used") return clientRedeemedIds.includes(c.id) || !c.isActive;
        if (clientFilter === "storewide") return c.scope === "all";
        if (clientFilter === "niche") return c.scope === "niche";
        return true;
      }
    });
  }, [coupons, searchQuery, activeFilter, clientFilter, isAdmin, clientRedeemedIds]);

  // Strategic Statistics (Admin View)
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

  // Client-Facing Statistics (Rewards & Wallet)
  const clientStats = useMemo(() => {
    const availableCount = coupons.filter((c) => c.isActive && !clientRedeemedIds.includes(c.id)).length;
    const usedCount = coupons.filter((c) => clientRedeemedIds.includes(c.id) || !c.isActive).length;
    const maxDiscount = coupons.reduce((max, c) => Math.max(max, c.discountPercent || 0), 0);
    return { availableCount, usedCount, maxDiscount };
  }, [coupons, clientRedeemedIds]);

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
                y: [0, -30, 90, 240, 420, 600],
                x: [0, 45, -50, 60, -30, 10],
                rotateZ: [0, -14, 20, -16, 12, -6],
                rotateX: [0, 30, -25, 30, -18, 0],
                scale: [1, 1.05, 0.98, 0.92, 0.85, 0.75],
                opacity: [1, 1, 1, 0.95, 0.65, 0],
              }}
              transition={{
                duration: 1.8,
                times: [0, 0.1, 0.35, 0.6, 0.82, 1],
                ease: "easeInOut",
              }}
              className="w-[320px] sm:w-[390px] drop-shadow-2xl flex items-center justify-center"
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
      {/* 1. PROFESSIONAL EXECUTIVE HEADER (ADMIN vs CLIENT)                   */}
      {/* ===================================================================== */}
      {isAdmin ? (
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
              Genera incentivos comerciales con arquitectura de canje en tiempo real. Monitorea y administra campañas activas, nichos de autor y promociones globales para compartir por WhatsApp.
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
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white/80 dark:bg-[#202022]/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-2 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Club Lúmina • Recompensas & Beneficios Exclusivos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
              Mis Cupones & Descuentos Ganados
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Gestiona los cupones que has acumulado por tus compras y fidelidad en Lúmina Home. Puedes agregarlos a tu <strong>Google Wallet</strong> para tenerlos siempre disponibles en tu teléfono o compartirlos en alta resolución por WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-semibold shrink-0">
            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Pases Google Wallet 1D Lineal</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. STATS KPI BAR (ADMIN vs CLIENT)                                    */}
      {/* ===================================================================== */}
      {isAdmin ? (
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
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Cupones Disponibles</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{clientStats.availableCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Mayor Beneficio Activo</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{clientStats.maxDiscount}% OFF</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Cupones Utilizados</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{clientStats.usedCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Google Wallet Pass</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">Código 1D</p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3 & 4. ADMIN GENERATOR ENGINE & MANUAL CREATOR FORM                  */}
      {/* ===================================================================== */}
      {isAdmin && (
        <>
          {/* HERO GENERATOR: 1-CLICK STRATEGIC COUPON ENGINE */}
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

            {/* JUST GENERATED BANNER MODAL (ADMIN - No Wallet button) */}
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

                  {/* Fast Action Buttons for Admin (Copy & Share PNG only, Wallet is client-only) */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => handleCopyCode(justGeneratedCoupon.code)}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white text-gray-950 text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
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
                      onClick={() => handleShareWhatsAppPng(justGeneratedCoupon)}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                      <span>Compartir</span>
                    </button>

                    <button
                      onClick={() => setAnalyticsCoupon(justGeneratedCoupon)}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm border border-purple-500/30"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Ver Métricas</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MANUAL CREATOR FORM */}
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
        </>
      )}

      {/* ===================================================================== */}
      {/* 5. SEARCH & FILTER CONTROLS (ADMIN vs CLIENT)                         */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100/80 dark:bg-[#202022] overflow-x-auto hide-scrollbar">
          {isAdmin ? (
            <>
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
            </>
          ) : (
            <>
              <button
                onClick={() => setClientFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  clientFilter === "all"
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                Todos ({coupons.length})
              </button>
              <button
                onClick={() => setClientFilter("available")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  clientFilter === "available"
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                ✨ Disponibles para Canjear ({clientStats.availableCount})
              </button>
              <button
                onClick={() => setClientFilter("used")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  clientFilter === "used"
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                🏷️ Ya Utilizados / Historial ({clientStats.usedCount})
              </button>
              <button
                onClick={() => setClientFilter("storewide")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  clientFilter === "storewide"
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                🏛️ Descuentos Tienda
              </button>
              <button
                onClick={() => setClientFilter("niche")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  clientFilter === "niche"
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                🌿 Nichos de Autor
              </button>
            </>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={isAdmin ? "Buscar por código o nicho..." : "Buscar mis cupones..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202022] text-xs text-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. COUPONS GRID: 2 IDENTICAL SIZED ARCHITECTURES (420 x 176)          */}
      {/* ===================================================================== */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-16 bg-white/40 dark:bg-[#202022]/40 rounded-3xl border border-dashed border-gray-300 dark:border-white/10 space-y-3">
          <Tag className="w-8 h-8 text-gray-400 mx-auto" />
          <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
            No se encontraron cupones en este filtro
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {isAdmin
              ? "Utiliza el generador algorítmico superior o crea uno personalizado con el configurador manual."
              : "Aún no tienes cupones registrados en esta categoría. Realiza compras para desbloquear nuevos beneficios."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCoupons.map((coupon) => {
            const isStorewide = coupon.scope === "all";
            const isCutting = cuttingCouponId === coupon.id;
            const isClientRedeemed = clientRedeemedIds.includes(coupon.id);
            const isDimmed = isAdmin ? !coupon.isActive : (isClientRedeemed || !coupon.isActive);

            return (
              <div
                key={coupon.id}
                className={`relative flex flex-col justify-between group transition-all duration-300 ${
                  isDimmed ? "opacity-65 grayscale-[35%]" : "opacity-100"
                }`}
              >
                {/* Physical Ticket Container Stage (Fixed 190px stage so neither ticket stretches) */}
                <div
                  onClick={() => {
                    if (isAdmin) {
                      handleCopyCode(coupon.code);
                    } else {
                      handleOpenWalletModal(coupon);
                    }
                  }}
                  className="relative cursor-pointer transition-transform duration-300 group-hover:-translate-y-1.5 w-full h-[190px] flex items-center justify-center p-1"
                  title={isAdmin ? "Clic para copiar código del cupón" : "Clic para ver detalle y agregar a Google Wallet"}
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

                  {/* Client Status Badge Overlay */}
                  {!isAdmin && (
                    <div className="absolute top-2 right-3 z-20 pointer-events-none">
                      {isClientRedeemed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-300/30">
                          Canjeado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-300/30">
                          Disponible
                        </span>
                      )}
                    </div>
                  )}

                  {isStorewide ? (
                    // -------------------------------------------------------------
                    // STYLE 2: STOREWIDE GENERAL TICKET (Cupones Style 2.jpg)
                    // -------------------------------------------------------------
                    <Style2TicketSvg
                      coupon={coupon}
                      theme={STYLE2_THEMES[getCouponPaletteIndex(coupon.id, STYLE2_THEMES.length)]}
                      className="max-h-[180px]"
                    />
                  ) : (
                    // -------------------------------------------------------------
                    // STYLE 1: NICHE SPECIFIC TICKET (Cupones Style.jpg)
                    // -------------------------------------------------------------
                    <Style1TicketSvg
                      coupon={coupon}
                      palette={STYLE1_GRADIENTS[getCouponPaletteIndex(coupon.id, STYLE1_GRADIENTS.length)]}
                      className="max-h-[180px]"
                    />
                  )}
                </div>

                {/* Floating Action Ribbon under ticket */}
                <div className="mt-3 px-3 py-2 rounded-2xl bg-white/70 dark:bg-[#202022]/70 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Copy Code */}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[11px] font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
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

                    {/* CLIENT ONLY: Google Wallet Button */}
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenWalletModal(coupon)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-black dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                        title="Añadir pase a Google Wallet con código de barras 1D"
                      >
                        <Wallet className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                        <span>Google Wallet</span>
                      </button>
                    )}

                    {/* Share on WhatsApp with real SVG icon and strictly 'Compartir' */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsAppPng(coupon)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                      title="Compartir cupón por WhatsApp"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                      <span>Compartir</span>
                    </button>

                    {/* ADMIN ONLY: Métricas Button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setAnalyticsCoupon(coupon)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs border border-purple-500/20"
                        title="Analizar métricas: quién lo usó, pedidos, avatar y valores antes/después"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Métricas</span>
                      </button>
                    )}

                    {/* CLIENT ONLY: Mark as used / available toggle */}
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleClientRedeemed(coupon.id)}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                          isClientRedeemed
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                            : "bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
                        }`}
                        title={isClientRedeemed ? "Marcar nuevamente como disponible" : "Marcar como utilizado en una compra"}
                      >
                        {isClientRedeemed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Usado</span>
                          </>
                        ) : (
                          <span>Marcar Usado</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* ADMIN ONLY: Toggle Status & Delete */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
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

                      <button
                        type="button"
                        onClick={() => deleteCoupon(coupon.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
                        title="Eliminar cupón"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
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

      {/* ===================================================================== */}
      {/* 8. FORENSIC COUPON ANALYTICS MODAL (CLIENT REDEMPTIONS, AVATARS, ORDER)*/}
      {/* ===================================================================== */}
      <CouponAnalyticsModal
        open={Boolean(analyticsCoupon)}
        onClose={() => setAnalyticsCoupon(null)}
        coupon={analyticsCoupon}
      />
    </div>
  );
}
