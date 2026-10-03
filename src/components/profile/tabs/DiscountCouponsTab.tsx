"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Sparkles,
  Dices,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Wallet,
  ShieldCheck,
  Scissors,
  CheckCircle2,
  BarChart3,
  SlidersHorizontal,
  X,
  Layers,
  BadgePercent,
  QrCode,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import { ThinkingOrb } from "thinking-orbs";
import { useCouponStore, DiscountCoupon } from "@/lib/couponStore";
import { useUserStore } from "@/lib/userStore";
import { SvgBarcodeGroup } from "@/components/ui/VectorBarcode";
import { CouponWalletModal } from "@/components/profile/modals/CouponWalletModal";
import { CouponAnalyticsModal } from "@/components/profile/modals/CouponAnalyticsModal";
import { generateCouponPng } from "@/lib/couponPngGenerator";
import { BeUISelectField } from "@/components/ui/BeUIControls";
import { ExpandableSearchBar } from "@/components/ui/ExpandableSearchBar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/motion/popover";
import { WheelPicker, type WheelPickerOption } from "@/components/motion/wheel-picker";
import { ActionSwapButton } from "@/components/motion/action-swap";

// ---------------------------------------------------------------------------
// Wheel Picker Options for Coupon Expiration Date Selection
// ---------------------------------------------------------------------------
const DAY_OPTIONS: WheelPickerOption[] = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1).padStart(2, "0");
  return { label: d, value: d };
});

const MONTH_OPTIONS: WheelPickerOption[] = [
  { label: "Enero", value: "0" },
  { label: "Febrero", value: "1" },
  { label: "Marzo", value: "2" },
  { label: "Abril", value: "3" },
  { label: "Mayo", value: "4" },
  { label: "Junio", value: "5" },
  { label: "Julio", value: "6" },
  { label: "Agosto", value: "7" },
  { label: "Septiembre", value: "8" },
  { label: "Octubre", value: "9" },
  { label: "Noviembre", value: "10" },
  { label: "Diciembre", value: "11" },
];

const YEAR_OPTIONS: WheelPickerOption[] = [
  { label: "2026", value: "2026" },
  { label: "2027", value: "2027" },
  { label: "2028", value: "2028" },
  { label: "2029", value: "2029" },
  { label: "2030", value: "2030" },
];

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
        className="w-full h-full overflow-visible drop-shadow-[0_12px_28px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_0_24px_rgba(245,158,11,0.22)]"
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

        {/* Condition text with overflow safety */}
        <text
          x="160"
          y="98"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          fontSize="11"
          fill="#111111"
        >
          {coupon.targetNiche
            ? `Colección: ${coupon.targetNiche.length > 17 ? coupon.targetNiche.slice(0, 15) + "…" : coupon.targetNiche}`
            : "Colección Exclusiva"}
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
        className="w-full h-full overflow-visible drop-shadow-[0_12px_26px_rgba(0,0,0,0.14)] dark:drop-shadow-[0_0_24px_rgba(245,158,11,0.22)]"
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

        {/* RIGHT BODY: Cursive Script "Lumina Home" */}
        <text
          x="126"
          y="48"
          fontFamily="'Pinyon Script', 'Alex Brush', 'Caveat', cursive, Georgia, serif"
          fontSize="28"
          fontStyle="italic"
          fill={theme.text}
        >
          Lumina Home
        </text>

        {/* Uppercase Serif: "CUPÓN DE TIENDA" */}
        <text
          x="126"
          y="70"
          fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="12.5"
          letterSpacing="2px"
          fill={theme.text}
        >
          CUPÓN DE TIENDA
        </text>

        {/* Horizontal Dashed Line across the ticket body */}
        <line
          x1="126"
          y1="94"
          x2="434"
          y2="94"
          stroke={theme.text}
          strokeDasharray="3 3"
          strokeWidth="1.2"
          opacity="0.35"
        />

        {/* Store URL: WWW.LUMINAHOME.COM (Left-aligned under dashed line) */}
        <text
          x="126"
          y="124"
          fontFamily="system-ui, -apple-system, monospace"
          fontWeight="700"
          fontSize="10.5"
          letterSpacing="0.8px"
          fill={theme.text}
          opacity="0.92"
        >
          WWW.LUMINAHOME.COM
        </text>

        {/* RIGHT BODY: Oval Discount Badge (Safe distance at cx=380, rx=54, ry=33, ample margin) */}
        <ellipse
          cx="380"
          cy="56"
          rx="54"
          ry="33"
          fill="none"
          stroke={theme.text}
          strokeWidth="1.3"
        />
        <text
          x="380"
          y="43"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="2px"
          fill={theme.text}
        >
          OBTÉN
        </text>
        <text
          x="380"
          y="57"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="800"
          fontSize="9.5"
          letterSpacing="1px"
          fill={theme.text}
        >
          DESCUENTO
        </text>
        <text
          x="380"
          y="77"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="900"
          fontSize="18"
          fill={theme.text}
        >
          {ovalDisc}
        </text>

        {/* Date: Right-aligned at x=434 under dashed line, guaranteed buffer from WWW.LUMINAHOME.COM */}
        <text
          x="434"
          y="124"
          textAnchor="end"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="700"
          fontSize="8.5"
          letterSpacing="0.5px"
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
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const handleOpenAnalytics = (coupon: DiscountCoupon) => {
    setAnalyticsCoupon(coupon);
    setIsAnalyticsOpen(true);
  };

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
  const [formMaxUses, setFormMaxUses] = useState<number | "none">(50);

  // Wheel Picker Expiration Date State (Default: 15 days ahead)
  const [hasExpirationDate, setHasExpirationDate] = useState(true);
  const [expireDay, setExpireDay] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return String(d.getDate()).padStart(2, "0");
  });
  const [expireMonth, setExpireMonth] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return String(d.getMonth());
  });
  const [expireYear, setExpireYear] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return String(d.getFullYear());
  });

  const resolvedTargetDate = useMemo(() => {
    if (!hasExpirationDate) return null;
    return new Date(Number(expireYear), Number(expireMonth), Number(expireDay), 23, 59, 59);
  }, [hasExpirationDate, expireYear, expireMonth, expireDay]);

  const daysRemaining = useMemo(() => {
    if (!resolvedTargetDate) return null;
    const diffMs = resolvedTargetDate.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [resolvedTargetDate]);

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

  // Strategic Generator Animation State (4.5s Thinking Orb)
  const [isGeneratingStrategic, setIsGeneratingStrategic] = useState(false);

  const handleTriggerRandom = () => {
    if (isGeneratingStrategic) return;
    setIsGeneratingStrategic(true);

    setTimeout(() => {
      const coupon = generateRandomCoupon({
        preferredScope: randomScopeChoice === "any" ? undefined : randomScopeChoice,
        targetNiche: randomScopeChoice === "niche" ? randomTargetNiche : undefined,
      });
      setJustGeneratedCoupon(coupon);
      setIsGeneratingStrategic(false);
    }, 4500);
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) return;

    const expiresAt =
      hasExpirationDate && resolvedTargetDate
        ? resolvedTargetDate.toISOString()
        : null;

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
    const list = coupons.filter((c) => {
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

    return list.sort((a, b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const aExact = a.code.toLowerCase().startsWith(q);
        const bExact = b.code.toLowerCase().startsWith(q);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
      }
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
      {/* 1. PROFESSIONAL EXECUTIVE HEADER & ACTIONS BLOCK                      */}
      {/* ===================================================================== */}
      <div className="space-y-4 sm:space-y-5">
        {isAdmin ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white/80 dark:bg-[#202022]/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-2 border border-amber-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Fidelización & Retención de Clientes</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
                Gestión de Cupones & Beneficios
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
                Monitorea y administra cupones activos, colecciones de autor y promociones exclusivas para compartir por WhatsApp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Strategic Generator Button with glowing ThinkingOrb in dark mode */}
              <button
                type="button"
                onClick={(e) => {
                  if (isGeneratingStrategic) return;
                  handleTriggerRandom();
                }}
                className={`relative flex items-center justify-center gap-2.5 w-full sm:w-[245px] h-[46px] sm:h-[48px] px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold tracking-tight shadow-sm transition-all duration-300 cursor-pointer !cursor-pointer select-none active:scale-[0.98] whitespace-nowrap shrink-0 ${
                  isGeneratingStrategic
                    ? "bg-stone-950 dark:bg-[#18181b] text-amber-300 dark:text-amber-300 border border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.22)]"
                    : "bg-stone-950 dark:bg-[#202023] text-white dark:text-stone-100 hover:bg-stone-800 dark:hover:bg-[#2a2a2e] border border-black/10 dark:border-white/10"
                }`}
                title="Generar cupón estratégico comercial"
              >
                <AnimatePresence mode="wait">
                  {isGeneratingStrategic ? (
                    <motion.div
                      key="state-generating"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="flex items-center gap-2.5 justify-center"
                    >
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <ThinkingOrb state="shaping" size={20} theme="dark" />
                      </div>
                      <span className="font-semibold text-amber-300 whitespace-nowrap">
                        Generando...
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="state-idle"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="flex items-center gap-2 justify-center"
                    >
                      <Dices className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="whitespace-nowrap">Generar Cupón Estratégico</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Personalizar Nuevo Button */}
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className={`w-full sm:w-[205px] h-[46px] sm:h-[48px] px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold border transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] select-none shrink-0 ${
                  showManualForm
                    ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent shadow-sm"
                    : "border-stone-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f23] hover:bg-stone-50 dark:hover:bg-white/10 text-stone-800 dark:text-stone-200"
                }`}
              >
                <SlidersHorizontal className={`w-4 h-4 shrink-0 transition-transform duration-300 ${showManualForm ? "rotate-90" : "rotate-0"}`} />
                <span className="whitespace-nowrap transition-colors duration-150">
                  {showManualForm ? "Cerrar menú..." : "Personalizar Nuevo"}
                </span>
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
        {/* 1.2 INLINE LIQUID RECUADRO: PERSONALIZAR NUEVO (Directly Below Header)*/}
        {/* ===================================================================== */}
        <AnimatePresence>
          {isAdmin && showManualForm && (
            <motion.div
              key="manual-coupon-inline-liquid-panel"
              initial={{ opacity: 0, height: 0, scale: 0.96, y: -20, filter: "blur(8px)" }}
              animate={{
                opacity: 1,
                height: "auto",
                scale: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  type: "spring",
                  bounce: 0.35,
                  duration: 0.7,
                  opacity: { duration: 0.3 },
                  filter: { duration: 0.4 }
                },
              }}
              exit={{
                opacity: 0,
                height: 0,
                scale: 0.96,
                y: -20,
                filter: "blur(8px)",
                transition: {
                  type: "spring",
                  bounce: 0,
                  duration: 0.4
                },
              }}
              className="overflow-hidden origin-top relative"
            >
              <div className="p-6 sm:p-8 rounded-[2rem] bg-white/95 dark:bg-[#1a1a1c]/95 backdrop-blur-xl border border-stone-200/80 dark:border-white/10 shadow-sm dark:shadow-[0_0_35px_rgba(245,158,11,0.08)]">
                <form
                  onSubmit={handleCreateManual}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-white/10">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">
                        Personalizar Nuevo Cupón
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Define las reglas comerciales y beneficios de tu cupón de descuento.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-white/10">
                      Personalizado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Código del cupón */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                        Código del Cupón (Ej: LUMINA-VIP)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="PROMO2026"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50/80 dark:bg-white/[0.04] text-sm font-mono font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:border-stone-900 dark:focus:border-white focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all outline-none uppercase shadow-2xs"
                      />
                    </div>

                    {/* Nombre / Título del Cupón */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                        Nombre / Título del Cupón
                      </label>
                      <input
                        type="text"
                        placeholder="Descuento Primavera"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50/80 dark:bg-white/[0.04] text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:border-stone-900 dark:focus:border-white focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all outline-none shadow-2xs"
                      />
                    </div>

                    {/* Tipo de Beneficio */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                        Tipo de Beneficio
                      </label>
                      <BeUISelectField
                        value={formDiscountType}
                        onChange={(val) => setFormDiscountType(val as "percent" | "fixed" | "free_shipping")}
                        options={[
                          { value: "percent", label: "Porcentaje de Descuento (%)" },
                          { value: "free_shipping", label: "Envío 100% Gratis" },
                        ]}
                        placeholder="Seleccionar beneficio"
                      />
                    </div>

                    {/* Porcentaje (% de Descuento) */}
                    {formDiscountType === "percent" ? (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                          Porcentaje (% de Descuento)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={formDiscountVal}
                            onChange={(e) => setFormDiscountVal(Number(e.target.value))}
                            className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50/80 dark:bg-white/[0.04] text-sm font-semibold text-stone-900 dark:text-white outline-none focus:border-stone-900 dark:focus:border-white focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all shadow-2xs"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">%</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                          Beneficio Aplicado
                        </label>
                        <div className="px-3.5 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                          <span>Envío 100% gratuito a todo el país</span>
                        </div>
                      </div>
                    )}

                    {/* Alcance Comercial */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                        Alcance Comercial
                      </label>
                      <BeUISelectField
                        value={formScope}
                        onChange={(val) => setFormScope(val as "all" | "niche")}
                        options={[
                          { value: "all", label: "Toda la Tienda (Descuento Global)" },
                          { value: "niche", label: "Colección Específica (Por Nicho)" },
                        ]}
                        placeholder="Seleccionar alcance"
                      />
                    </div>

                    {/* Nicho o Compra Mínima */}
                    {formScope === "niche" ? (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                          Colección / Nicho Seleccionado
                        </label>
                        <BeUISelectField
                          value={formNiche}
                          onChange={(val) => setFormNiche(val)}
                          options={[
                            { value: "Iluminación", label: "Iluminación de Ambiente" },
                            { value: "Aromaterapia", label: "Aromaterapia & Esencias" },
                            { value: "Home Office", label: "Home Office & Ergonomía" },
                            { value: "Textiles", label: "Textiles & Lana" },
                            { value: "Cerámica", label: "Cerámica de Autor" },
                            { value: "Decoración", label: "Decoración & Esculturas" },
                            { value: "Cocina", label: "Cocina & Barista" },
                            { value: "Bienestar", label: "Bienestar & Descanso" },
                          ]}
                          placeholder="Seleccionar colección"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                          Compra Mínima ($ USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            placeholder="0 (Sin mínimo)"
                            value={formMinOrder}
                            onChange={(e) => setFormMinOrder(Number(e.target.value))}
                            className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50/80 dark:bg-white/[0.04] text-sm font-semibold text-stone-900 dark:text-white outline-none focus:border-stone-900 dark:focus:border-white focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Límite de Canjes */}
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                        Límite de Canjes
                      </label>
                      <BeUISelectField
                        value={String(formMaxUses)}
                        onChange={(val) => setFormMaxUses(val === "none" ? "none" : Number(val))}
                        options={[
                          { value: "10", label: "10 canjes máximos" },
                          { value: "30", label: "30 canjes" },
                          { value: "50", label: "50 canjes" },
                          { value: "100", label: "100 canjes" },
                          { value: "none", label: "Ilimitado" },
                        ]}
                        placeholder="Seleccionar límite"
                      />
                    </div>
                  </div>

                  {/* FECHA DE FINALIZACIÓN CON BEUI WHEEL PICKER */}
                  <div className="pt-3 border-t border-stone-200/60 dark:border-white/10">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                          Fecha de Finalización (Vigencia)
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHasExpirationDate(!hasExpirationDate)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          hasExpirationDate
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            : "bg-stone-200/60 dark:bg-white/10 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {hasExpirationDate ? "Con fecha de término" : "Permanente (Sin vencimiento)"}
                      </button>
                    </div>

                    {hasExpirationDate ? (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-stone-100/80 dark:bg-black/40 border border-stone-200/60 dark:border-white/5">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 text-center mb-1">
                              Día
                            </span>
                            <WheelPicker
                              options={DAY_OPTIONS}
                              value={expireDay}
                              onValueChange={setExpireDay}
                              sound={true}
                              visibleCount={3}
                              itemHeight={34}
                              className="bg-white dark:bg-[#202023] border-stone-200/80 dark:border-white/10 shadow-xs"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 text-center mb-1">
                              Mes
                            </span>
                            <WheelPicker
                              options={MONTH_OPTIONS}
                              value={expireMonth}
                              onValueChange={setExpireMonth}
                              sound={true}
                              visibleCount={3}
                              itemHeight={34}
                              className="bg-white dark:bg-[#202023] border-stone-200/80 dark:border-white/10 shadow-xs"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 text-center mb-1">
                              Año
                            </span>
                            <WheelPicker
                              options={YEAR_OPTIONS}
                              value={expireYear}
                              onValueChange={setExpireYear}
                              sound={true}
                              visibleCount={3}
                              itemHeight={34}
                              className="bg-white dark:bg-[#202023] border-stone-200/80 dark:border-white/10 shadow-xs"
                            />
                          </div>
                        </div>

                        {/* Live Preview Bar */}
                        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                          <span>
                            Disponible hasta: <strong>{resolvedTargetDate?.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</strong>
                          </span>
                          <span className="font-bold">
                            {daysRemaining && daysRemaining > 0
                              ? `(en ${daysRemaining} días)`
                              : daysRemaining === 0
                                ? "(vence hoy)"
                                : "(fecha pasada)"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-stone-100/70 dark:bg-black/30 border border-stone-200/60 dark:border-white/5 flex items-center justify-center text-xs font-semibold text-stone-500 dark:text-stone-400">
                        <span>Cupón permanente sin fecha límite de caducidad</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-stone-200/60 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-stone-950 dark:bg-white text-white dark:text-stone-950 text-xs font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors shadow-xs active:scale-95 cursor-pointer"
                    >
                      Guardar y Activar Cupón
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================================================================== */}
        {/* 1.1 JUST GENERATED COUPON BANNER (ADMIN)                              */}
        {/* ===================================================================== */}
        <AnimatePresence>
          {isAdmin && justGeneratedCoupon && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1a1a1c] border border-stone-200/80 dark:border-amber-400/25 dark:shadow-[0_0_35px_rgba(245,158,11,0.12)] shadow-xs"
            >
              {/* Top row: Status, Scope badge and Close button */}
              <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-stone-100 dark:border-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white dark:bg-white dark:text-stone-900">
                    <Check className="w-3 h-3 text-amber-400 dark:text-amber-300" />
                    Cupón Generado con Éxito
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/5">
                    {justGeneratedCoupon.scope === "all"
                      ? "Toda la Tienda (Descuento Global)"
                      : `Colección: ${justGeneratedCoupon.targetNiche}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setJustGeneratedCoupon(null)}
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                  title="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Middle row: Code, discount and description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-wider">
                      {justGeneratedCoupon.code}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[#8c9276] dark:text-[#a8af92]">
                      {justGeneratedCoupon.discountType === "free_shipping"
                        ? "Envío Gratis"
                        : `-${justGeneratedCoupon.discountPercent}% OFF`}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xl">
                    {justGeneratedCoupon.description}
                  </p>
                </div>

                {/* Action buttons: Symmetrical and responsive on mobile/tablet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                  <ActionSwapButton
                    items={[
                      { id: "copy", label: "Copiar Código", icon: <Copy className="w-3.5 h-3.5" /> },
                      { id: "copied", label: "Copiado", icon: <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> },
                    ]}
                    value={copiedCode === justGeneratedCoupon.code ? "copied" : "copy"}
                    cycle={false}
                    animation="cascade"
                    size="sm"
                    onClick={() => handleCopyCode(justGeneratedCoupon.code)}
                    className="px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-stone-200/60 dark:border-white/5 shadow-2xs h-auto"
                  />

                  <button
                    type="button"
                    onClick={() => handleShareWhatsAppPng(justGeneratedCoupon)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                    <span>Compartir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => justGeneratedCoupon && handleOpenAnalytics(justGeneratedCoupon)}
                    className="px-3.5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Ver Métricas</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================================================================== */}
      {/* 2. STATS KPI BAR (ADMIN vs CLIENT)                                    */}
      {/* ===================================================================== */}
      {isAdmin ? (
        <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <div className="w-full bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Cupones Activos</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.activeCount}</p>
            </div>
          </div>

          <div className="w-full bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Margen Promedio Otorgado</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.avgDiscount}%</p>
            </div>
          </div>

          <div className="w-full bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">PNGs Compartidos</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.totalShares}</p>
            </div>
          </div>

          <div className="w-full bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Canjes Registrados</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{stats.totalUses}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <div className="w-full bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Cupones Disponibles</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{clientStats.availableCount}</p>
            </div>
          </div>

          <div className="w-full bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Mayor Beneficio Activo</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{clientStats.maxDiscount}% OFF</p>
            </div>
          </div>

          <div className="w-full bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Cupones Utilizados</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">{clientStats.usedCount}</p>
            </div>
          </div>

          <div className="w-full bg-white dark:bg-[#202022] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Google Wallet Pass</p>
              <p className="text-lg sm:text-2xl font-black text-gray-950 dark:text-white">Código 1D</p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SEARCH & FILTER CONTROLS (ADMIN vs CLIENT)                         */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-stone-100/90 dark:bg-[#1a1a1c] border border-stone-200/60 dark:border-white/5 overflow-x-auto hide-scrollbar max-w-full">
          {isAdmin
            ? (
                [
                  { id: "all", label: `Todos (${coupons.length})` },
                  { id: "storewide", label: "Toda la Tienda (Global)" },
                  { id: "niche", label: "Por Colección (Nicho)" },
                  { id: "active", label: `Vigentes (${coupons.filter((c) => c.isActive).length})` },
                ] as const
              ).map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`relative px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer select-none active:scale-95 ${
                      isActive
                        ? "text-stone-950 dark:text-white"
                        : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCouponFilterPill"
                        transition={{ type: "spring", stiffness: 420, damping: 30 }}
                        className="absolute inset-0 bg-white dark:bg-[#2c2c2e] rounded-xl shadow-sm border border-stone-200/60 dark:border-white/10 z-0"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })
            : (
                [
                  { id: "all", label: `Todos (${coupons.length})` },
                  { id: "available", label: `Disponibles (${clientStats.availableCount})` },
                  { id: "used", label: `Historial de Canjes (${clientStats.usedCount})` },
                  { id: "storewide", label: "Descuentos Tienda" },
                  { id: "niche", label: "Nichos de Autor" },
                ] as const
              ).map((tab) => {
                const isActive = clientFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setClientFilter(tab.id)}
                    className={`relative px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer select-none active:scale-95 ${
                      isActive
                        ? "text-stone-950 dark:text-white"
                        : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCouponFilterPillClient"
                        transition={{ type: "spring", stiffness: 420, damping: 30 }}
                        className="absolute inset-0 bg-white dark:bg-[#2c2c2e] rounded-xl shadow-sm border border-stone-200/60 dark:border-white/10 z-0"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
        </div>

        <ExpandableSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={isAdmin ? "Buscar por código o nicho..." : "Buscar mis cupones..."}
          expandedWidth="w-full sm:w-72"
        />
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
              ? "Utiliza el generador de cupones superior o crea uno con la opción Personalizar."
              : "Aún no tienes cupones registrados en esta categoría. Realiza compras para desbloquear nuevos beneficios."}
          </p>
        </div>
      ) : (
        <motion.div
          key={activeFilter + (searchQuery || "")}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8"
        >
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
                {/* Physical Ticket Container Stage (Responsive 165px - 190px stage so neither ticket stretches) */}
                <div
                  onClick={() => {
                    if (isAdmin) {
                      handleCopyCode(coupon.code);
                    } else {
                      handleOpenWalletModal(coupon);
                    }
                  }}
                  className="relative cursor-pointer transition-transform duration-300 group-hover:-translate-y-1.5 w-full min-h-[160px] h-[175px] sm:h-[190px] flex items-center justify-center p-1"
                  title={isAdmin ? "Clic para copiar código del cupón" : "Clic para ver detalle y agregar a Google Wallet"}
                >
                  {/* Dark Mode Radiant Luxury Backlight / Halo */}
                  <div
                    className="hidden dark:block absolute -inset-1 sm:-inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-amber-400/25 via-amber-200/35 to-orange-400/25 blur-xl opacity-90 group-hover:opacity-100 group-hover:blur-2xl transition-all duration-500 pointer-events-none z-0"
                    aria-hidden="true"
                  />
                  <div
                    className="hidden dark:block absolute inset-3 sm:inset-4 rounded-[2rem] bg-amber-400/15 blur-md opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                    aria-hidden="true"
                  />

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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-300/30">
                          Disponible
                        </span>
                      )}
                    </div>
                  )}

                  <div className="relative z-10 w-full flex items-center justify-center">
                    {isStorewide ? (
                      // -------------------------------------------------------------
                      // STYLE 2: STOREWIDE GENERAL TICKET (Cupones Style 2.jpg)
                      // -------------------------------------------------------------
                      <Style2TicketSvg
                        coupon={coupon}
                        theme={STYLE2_THEMES[getCouponPaletteIndex(coupon.id, STYLE2_THEMES.length)]}
                        className="max-h-[165px] sm:max-h-[180px]"
                      />
                    ) : (
                      // -------------------------------------------------------------
                      // STYLE 1: NICHE SPECIFIC TICKET (Cupones Style.jpg)
                      // -------------------------------------------------------------
                      <Style1TicketSvg
                        coupon={coupon}
                        palette={STYLE1_GRADIENTS[getCouponPaletteIndex(coupon.id, STYLE1_GRADIENTS.length)]}
                        className="max-h-[165px] sm:max-h-[180px]"
                      />
                    )}
                  </div>
                </div>

                {/* Floating Action Ribbon under ticket (Responsive scrollable ribbon on mobile/tablet) */}
                <div className="mt-3 px-2 sm:px-3 py-2 rounded-2xl bg-white/70 dark:bg-[#202022]/70 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
                    {/* Copy Code with beUI Action Swap */}
                    <ActionSwapButton
                      items={[
                        { id: "copy", label: "Copiar", icon: <Copy className="w-3.5 h-3.5" /> },
                        { id: "copied", label: "Copiado", icon: <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> },
                      ]}
                      value={copiedCode === coupon.code ? "copied" : "copy"}
                      cycle={false}
                      animation="cascade"
                      size="sm"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="shrink-0 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[11px] font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap h-auto"
                      title="Copiar código alfanumérico"
                    />

                    {/* CLIENT ONLY: Google Wallet Button */}
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenWalletModal(coupon)}
                        className="shrink-0 px-2.5 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-black dark:hover:bg-white text-white dark:text-stone-900 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
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
                      className="shrink-0 px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
                      title="Compartir cupón por WhatsApp"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                      <span>Compartir</span>
                    </button>

                    {/* ADMIN ONLY: Métricas Button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenAnalytics(coupon)}
                        className="shrink-0 px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs border border-purple-500/20 whitespace-nowrap"
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
                        className={`shrink-0 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap ${
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
                          <ToggleRight className="w-5 h-5 text-amber-600 dark:text-amber-400" />
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
        </motion.div>
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
        open={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        coupon={analyticsCoupon}
      />
    </div>
  );
}
