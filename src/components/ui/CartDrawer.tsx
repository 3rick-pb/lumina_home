"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { BeUIAdaptiveStepper, BeUIRollingPrice, BeUIAnimatedCtaButton, BeUITiltCard } from "./BeUIControls";
import { SlideConfirmButton } from "@/components/godui/slide-confirm-button";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass";
import { WalletPassPopupModal } from "./WalletPassPopupModal";
import { GoogleWalletButton } from "./GoogleWalletButton";
import InteractiveAddressMap from "./InteractiveAddressMap";
import {
  PaymentConfirmationReceipt,
  ReceiptCardNetwork,
} from "./PaymentConfirmationReceipt";
import {
  Wallet3D,
  UserSavedCard,
  DEMO_UNIFIED_CARDS,
  mapPaymentCardToUserSavedCard,
  resolveCardNetwork,
  NetworkBrandLogo,
} from "./UnifiedWalletSystem";
import { 
 X, 
 Zap,
 Plus, 
 ShoppingBag, 
 ArrowRight, 
 ArrowLeft, 
 Truck, 
 Sparkles, 
 CheckCircle2, 
 MapPin, 
 ShieldCheck, 
 Tag, 
 Check, 
 ChevronRight,
 ChevronUp,
 ChevronDown,
 Trash2,
 RotateCcw,
  CreditCard,
  Navigation,
  Loader2,
  AlertTriangle,
  Package,
  Eye,
  EyeOff,
  Calendar,
  User,
  Phone,
  QrCode,
  Lock
} from "lucide-react";
import { playEnvelopeSound } from "./CardFolder";
import { useCartStore } from "@/lib/store";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
import { clsx } from "clsx";
import { useUserStore, Order, formatCleanName } from "@/lib/userStore";
import { MacOSScrollbar } from "./MacOSScrollbar";
import { useCatalogStore, isAgotadoBadge } from "@/lib/catalogStore";
import { getRefinedCoordinates, type RawGpsHardwareData } from "@/lib/locationUtils";
import {
  Visa as VisaMono,
  Mastercard as MastercardMono,
  DinersClub as DinersClubMono,
  Discover as DiscoverMono,
  AmericanExpress as AmericanExpressMono,
} from "@thesvg/react";

// Official Card & Payment Gateway Logos (Authentic Vector Brandmarks from theSVG.org + PayPhone Official)
function MastercardLogo({ className = "h-[17px]" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>Mastercard</title>
      <path d="M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031z" fill="#EB001B"/>
      <path d="M16.584 4.584c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416z" fill="#F79E1B"/>
      <path d="M12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08-.184-.156-.28-.231z" fill="#FF5F00"/>
    </svg>
  );
}

function VisaLogo({ className = "h-[19px]", fill = "#1A1F71" }: { className?: string; fill?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill={fill} role="img" xmlns="http://www.w3.org/2000/svg">
      <title>Visa</title>
      <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/>
    </svg>
  );
}

function PayPhoneIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <img
      src="/images/payphone-badge.png"
      alt="PayPhone"
      className={`shrink-0 object-contain rounded-md shadow-2xs ${className}`}
    />
  );
}

function DinersClubLogo({ className = "h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="#004C97" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>Diners Club</title>
      <path d="M16.506 11.982a6.026 6.026 0 0 0-3.866-5.618V17.6a6.025 6.025 0 0 0 3.866-5.618zM8.33 17.598V6.365a6.03 6.03 0 0 0-3.863 5.617 6.028 6.028 0 0 0 3.863 5.616zm2.156-15.113A9.497 9.497 0 0 0 .99 11.982a9.495 9.495 0 0 0 9.495 9.494c5.245 0 9.495-4.25 9.496-9.494a9.499 9.499 0 0 0-9.496-9.497Zm-.023 19.888C4.723 22.4 0 17.75 0 12.09 0 5.905 4.723 1.626 10.463 1.627h2.69C18.822 1.627 24 5.903 24 12.09c0 5.658-5.176 10.283-10.848 10.283"/>
    </svg>
  );
}

function DiscoverLogo({ className = "h-4.5" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 7.6 24 8.8" fill="#FF6000" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>Discover</title>
      <path d="M14.58 12a2.023 2.023 0 1 1-2.025-2.023h.002c1.118 0 2.023.906 2.023 2.023z" fill="#FF6000"/>
      <path d="M9.38 9.999c-1.124 0-2.025.884-2.025 1.99 0 1.118.878 1.984 2.007 1.984.319 0 .593-.063.93-.221v-.873c-.296.297-.559.416-.895.416-.747 0-1.277-.542-1.277-1.312 0-.73.547-1.306 1.243-1.306.354 0 .622.126.93.428v-.873a1.898 1.898 0 0 0-.913-.233zm-3.352 1.545c-.445-.165-.576-.273-.576-.479 0-.239.233-.422.553-.422.222 0 .405.091.598.308l.388-.508a1.665 1.665 0 0 0-1.117-.422c-.673 0-1.186.467-1.186 1.089 0 .524.239.792.936 1.043.291.103.438.171.513.217a.456.456 0 0 1 .222.394c0 .308-.245.536-.576.536-.354 0-.639-.177-.809-.507l-.479.461c.342.502.752.724 1.317.724.771 0 1.311-.513 1.311-1.249-.002-.603-.252-.876-1.095-1.185zM24 10.3a.29.29 0 0 1-.288.291.29.29 0 0 1-.291-.291v-.003A.29.29 0 1 1 24 10.3zm-.059.001a.235.235 0 0 0-.231-.239.234.234 0 0 0-.232.239c0 .132.104.239.232.239a.235.235 0 0 0 .231-.239zM3.472 13.887h.742v-3.803h-.742v3.803zm12.702-1.248l-1.014-2.554h-.81l1.614 3.9h.399l1.643-3.9h-.804l-1.028 2.554zm2.166 1.248h2.104v-.644h-1.362v-1.027h1.312v-.644h-1.312v-.844h1.362v-.644H18.34v3.803zm5.409-3.557l.11.138h-.097l-.094-.13v.13h-.08v-.334h.107c.081 0 .126.036.126.103.001.046-.025.08-.072.093zm-.006-.092c0-.029-.021-.043-.06-.043h-.014v.087h.014c.039 0 .06-.014.06-.044zm-1.228 2.047l1.197 1.602H22.8l-1.027-1.528h-.097v1.528h-.741v-3.803h1.1c.855 0 1.346.411 1.346 1.123 0 .583-.308.965-.866 1.078zm.103-1.038c0-.37-.251-.563-.713-.563h-.228v1.152h.217c.473-.001.724-.207.724-.589zm-19.487.742a1.91 1.91 0 0 1-.69 1.46c-.365.303-.781.439-1.357.439H.001v-3.803H1.09c1.202 0 2.041.781 2.041 1.904zm-.764-.006c0-.364-.154-.718-.411-.947-.245-.222-.536-.308-1.015-.308H.742v2.515h.199c.479 0 .782-.092 1.015-.302.256-.228.411-.593.411-.958z" className="fill-[#231F20] dark:fill-gray-200"/>
    </svg>
  );
}

function AmexLogo({ className = "h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 rounded-[2px] ${className}`} viewBox="0 0 24 24" fill="#2E77BC" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>American Express</title>
      <path d="M16.015 14.378c0-.32-.135-.496-.344-.622-.21-.12-.464-.135-.81-.135h-1.543v2.82h.675v-1.027h.72c.24 0 .39.024.478.125.12.13.104.38.104.55v.35h.66v-.555c-.002-.25-.017-.376-.108-.516-.06-.08-.18-.18-.33-.234l.02-.008c.18-.072.48-.297.48-.747zm-.87.407l-.028-.002c-.09.053-.195.058-.33.058h-.81v-.63h.824c.12 0 .24 0 .33.05.098.048.156.147.15.255 0 .12-.045.215-.134.27zM20.297 15.837H19v.6h1.304c.676 0 1.05-.278 1.05-.884 0-.28-.066-.448-.187-.582-.153-.133-.392-.193-.73-.207l-.376-.015c-.104 0-.18 0-.255-.03-.09-.03-.15-.105-.15-.21 0-.09.017-.166.09-.21.083-.046.177-.066.272-.06h1.23v-.602h-1.35c-.704 0-.958.437-.958.84 0 .9.776.855 1.407.87.104 0 .18.015.225.06.046.03.082.106.082.18 0 .077-.035.15-.08.18-.06.053-.15.07-.277.07zM0 0v10.096L.81 8.22h1.75l.225.464V8.22h2.043l.45 1.02.437-1.013h6.502c.295 0 .56.057.756.236v-.23h1.787v.23c.307-.17.686-.23 1.12-.23h2.606l.24.466v-.466h1.918l.254.465v-.466h1.858v3.948H20.87l-.36-.6v.585h-2.353l-.256-.63h-.583l-.27.614h-1.213c-.48 0-.84-.104-1.08-.24v.24h-2.89v-.884c0-.12-.03-.12-.105-.135h-.105v1.036H6.067v-.48l-.21.48H4.69l-.202-.48v.465H2.235l-.256-.624H1.4l-.256.624H0V24h23.786v-7.108c-.27.135-.613.18-.973.18H21.09v-.255c-.21.165-.57.255-.914.255H14.71v-.9c0-.12-.018-.12-.12-.12h-.075v1.022h-1.8v-1.066c-.298.136-.643.15-.928.136h-.214v.915h-2.18l-.54-.617-.57.6H4.742v-3.93h3.61l.518.602.554-.6h2.412c.28 0 .74.03.942.225v-.24h2.177c.202 0 .644.045.903.225v-.24h3.265v.24c.163-.164.508-.24.803-.24h1.89v.24c.194-.15.464-.24.84-.24h1.176V0H0zM21.156 14.955c.004.005.006.012.01.016.01.01.024.01.032.02l-.042-.035zM23.828 13.082h.065v.555h-.065zM23.865 15.03v-.005c-.03-.025-.046-.048-.075-.07-.15-.153-.39-.215-.764-.225l-.36-.012c-.12 0-.194-.007-.27-.03-.09-.03-.15-.105-.15-.21 0-.09.03-.16.09-.204.076-.045.15-.05.27-.05h1.223v-.588h-1.283c-.69 0-.96.437-.96.84 0 .9.78.855 1.41.87.104 0 .18.015.224.06.046.03.076.106.076.18 0 .07-.034.138-.09.18-.045.056-.136.07-.27.07h-1.288v.605h1.287c.42 0 .734-.118.9-.36h.03c.09-.134.135-.3.135-.523 0-.24-.045-.39-.135-.526zM18.597 14.208v-.583h-2.235V16.458h2.235v-.585h-1.57v-.57h1.533v-.584h-1.532v-.51M13.51 8.787h.685V11.6h-.684zM13.126 9.543l-.007.006c0-.314-.13-.5-.34-.624-.217-.125-.47-.135-.81-.135H10.43v2.82h.674v-1.034h.72c.24 0 .39.03.487.12.122.136.107.378.107.548v.354h.677v-.553c0-.25-.016-.375-.11-.516-.09-.107-.202-.19-.33-.237.172-.07.472-.3.472-.75zm-.855.396h-.015c-.09.054-.195.056-.33.056H11.1v-.623h.825c.12 0 .24.004.33.05.09.04.15.128.15.25s-.047.22-.134.266zM15.92 9.373h.632v-.6h-.644c-.464 0-.804.105-1.02.33-.286.3-.362.69-.362 1.11 0 .512.123.833.36 1.074.232.238.645.31.97.31h.78l.255-.627h1.39l.262.627h1.36v-2.11l1.272 2.11h.95l.002.002V8.786h-.684v1.963l-1.18-1.96h-1.02V11.4L18.11 8.744h-1.004l-.943 2.22h-.3c-.177 0-.362-.03-.468-.134-.125-.15-.186-.36-.186-.662 0-.285.08-.51.194-.63.133-.135.272-.165.516-.165zm1.668-.108l.464 1.118v.002h-.93l.466-1.12zM2.38 10.97l.254.628H4V9.393l.972 2.205h.584l.973-2.202.015 2.202h.69v-2.81H6.118l-.807 1.904-.876-1.905H3.343v2.663L2.205 8.787h-.997L.01 11.597h.72l.26-.626h1.39zm-.688-1.705l.46 1.118-.003.002h-.915l.457-1.12zM11.856 13.62H9.714l-.85.923-.825-.922H5.346v2.82H8l.855-.932.824.93h1.302v-.94h.838c.6 0 1.17-.164 1.17-.945l-.006-.003c0-.78-.598-.93-1.128-.93zM7.67 15.853l-.014-.002H6.02v-.557h1.47v-.574H6.02v-.51H7.7l.733.82-.764.824zm2.642.33l-1.03-1.147 1.03-1.108v2.253zm1.553-1.258h-.885v-.717h.885c.24 0 .42.098.42.344 0 .243-.15.372-.42.372zM9.967 9.373v-.586H7.73V11.6h2.237v-.58H8.4v-.564h1.527V9.88H8.4v-.507"/>
    </svg>
  );
}

function ContactlessIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8.5 16.5a5 5 0 0 1 0-9" />
      <path d="M12 19a8.5 8.5 0 0 1 0-14" />
      <path d="M15.5 21.5a12 12 0 0 1 0-19" />
    </svg>
  );
}

function EmvChip() {
  return (
    <div className="relative w-11 h-8 sm:w-12 sm:h-9 rounded-md bg-gradient-to-br from-[#f3db8a] via-[#dfba56] to-[#9c7923] p-[1.5px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_2px_6px_rgba(0,0,0,0.5)] border border-[#7a5b14]/70 overflow-hidden shrink-0">
      <div className="w-full h-full rounded-[3px] border border-[#6d5111]/45 flex flex-col justify-between p-[2px] bg-gradient-to-b from-transparent via-[#f8e49d]/20 to-transparent">
        <div className="flex justify-between h-2.5 border-b border-[#6d5111]/40">
          <div className="w-2.5 border-r border-[#6d5111]/40" />
          <div className="w-2.5 border-l border-[#6d5111]/40" />
        </div>
        <div className="flex justify-between h-2.5">
          <div className="w-2.5 border-r border-[#6d5111]/40" />
          <div className="w-2.5 border-l border-[#6d5111]/40" />
        </div>
      </div>
      <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent transform -skew-x-12 pointer-events-none" />
    </div>
  );
}

function VerifiedByVisaLogo({ className = "h-6" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] ${className}`}>
      <VisaLogo className="h-3.5 w-auto" fill="#1A1F71" />
      <span className="text-[8.5px] font-sans font-semibold text-gray-600 dark:text-gray-300 tracking-tight leading-none">
        Secure
      </span>
    </div>
  );
}

function MastercardSecureCodeLogo({ className = "h-6" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] ${className}`}>
      <MastercardLogo className="h-3.5 w-auto" />
      <span className="text-[8.5px] font-sans font-semibold text-gray-600 dark:text-gray-300 tracking-tight leading-none">
        ID Check
      </span>
    </div>
  );
}

function PciDssLogo({ className = "h-6" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] ${className}`}>
      <svg className="w-3.5 h-3.5 shrink-0 text-emerald-500" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a2.5 2.5 0 0 0-2.5 2.5V5h-1A1.5 1.5 0 0 0 3 6.5v6A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 11.5 5h-1V3.5A2.5 2.5 0 0 0 8 1zm1.5 4h-3V3.5a1.5 1.5 0 0 1 3 0V5z"/>
      </svg>
      <span className="text-[8.5px] font-sans font-bold text-gray-700 dark:text-gray-200 tracking-tight leading-none">
        PCI <span className="text-emerald-600 dark:text-emerald-400">DSS</span>
      </span>
    </div>
  );
}

function PoweredByPayphoneLogo({ className = "h-6" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] ${className}`}>
      <PayPhoneIcon className="w-4 h-4" />
      <span className="text-[9.5px] font-sans font-bold text-[#FF5900] tracking-tight leading-none">
        PayPhone
      </span>
    </div>
  );
}



export function CartDrawer() {
  const cartScrollRef = React.useRef<HTMLDivElement>(null);
 const { 
 isOpen, 
 setIsOpen, 
 originCoords,
 items, 
 removeItem, 
 updateQuantity, 
 getSubtotal, 
 getDiscountAmount,
 getShipping,
 getTotal,
 couponCode,
 discountPercent,
 isFreeShippingCoupon,
 applyCoupon,
 removeCoupon,
 clearCart 
 } = useCartStore();

 const { 
 user, 
 isAuthenticated, 
 address, 
 addresses,
 cards,
 setAddress, 
 addAddress,
 addOrder 
 } = useUserStore();

 const { products } = useCatalogStore();
 const router = useRouter();
 const [isMounted, setIsMounted] = useState(false);

 // Multi-step checkout flow state: "bag" | "payment" | "success"
 const [step, setStep] = useState<"bag" | "payment" | "success">("bag");

 // Coupon state
 const [couponInput, setCouponInput] = useState("");
 const [couponFeedback, setCouponFeedback] = useState<{ msg: string; success: boolean } | null>(null);
 const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
 const [revealCouponInput, setRevealCouponInput] = useState(false);
 const [revealAppliedCoupon, setRevealAppliedCoupon] = useState(false);

 // Mask sensitive coupon code for privacy / screen shares (e.g. "LUMINA10" -> "LU•••••0")
 const maskCouponCode = (code: string) => {
   if (!code) return "";
   if (code.length <= 4) return "••••";
   return `${code.slice(0, 2)}${"•".repeat(Math.max(3, code.length - 3))}${code.slice(-1)}`;
 };

  // PayPhone Ecuador Exclusive Gateway State (Admin Configured: "box" | "redirect")
  const [, setPayphoneMode] = useState<"box" | "redirect">("box");
  const [, setIsPayphoneConfigured] = useState(false);
  const [isPayphoneSimulated, setIsPayphoneSimulated] = useState(true);
  const [, setIsBoxScriptLoaded] = useState(false);
  const [, setIsBoxRendered] = useState(false);

  const [payphoneError, setPayphoneError] = useState<string | null>(null);

  // PayPhone Embedded Form Interactive State (Official In-Page Checkout Presentation)
  const [selectedPayMethod, setSelectedPayMethod] = useState<"card" | "app">("card");
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string>("new");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState(user?.name || "");
  const [payphoneAppPhone, setPayphoneAppPhone] = useState("");

  // Strategic Upsell: Prioridad de Envío del Paquete (+$2.15 USD)
  const [hasPriorityShipping, setHasPriorityShipping] = useState(false);

  // Dedicated ref for Step 2 items summary scroll container with authentic MacOSScrollbar
  const summaryScrollRef = useRef<HTMLDivElement>(null);

  const [isMiniWalletOpen, setIsMiniWalletOpen] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [walletPopupPlatform, setWalletPopupPlatform] = useState<"apple" | "google" | null>(null);

  // Map user saved cards or fallback to DEMO cards so wallet and auto-fill always work seamlessly
  const userWallet3DCards = useMemo<UserSavedCard[]>(() => {
    if (!cards || cards.length === 0) {
      return DEMO_UNIFIED_CARDS;
    }
    return cards.map((c, index) => mapPaymentCardToUserSavedCard(c, index));
  }, [cards]);

  // Auto-fill form with the default card or user selected card automatically; CVV is strictly kept empty
  useEffect(() => {
    if (userWallet3DCards && userWallet3DCards.length > 0 && selectedSavedCardId === "new" && !cardNumber) {
      const defCard = userWallet3DCards.find((c) => c.isDefault) || userWallet3DCards[0];
      if (defCard) {
        setSelectedSavedCardId(defCard.id);
        const last4 = defCard.last4 || "4242";
        const isMaster = defCard.network === "mastercard";
        const isAmex = defCard.network === "american-express";
        const isDiners = defCard.network === "diners-club";
        const isDiscover = defCard.network === "discover";
        const prefix = isMaster
          ? "5412 7500 8899"
          : isAmex
          ? "3782 822463 1"
          : isDiners
          ? "3654 1198 76"
          : isDiscover
          ? "6011 4902 8831"
          : "4532 8910 2233";
        const cleanFull = (defCard.fullNumber || "").replace(/\D/g, "");
        const formattedNum = cleanFull.length >= 14
          ? (cleanFull.match(/.{1,4}/g)?.join(" ") || cleanFull)
          : `${prefix} ${last4}`;

        setCardNumber(formattedNum);
        setCardExpiry(defCard.expiry || "12/28");
        setCardHolder(defCard.holderName || user?.name || "CLIENTE LUMINA");
        setCardCvv(""); // Never auto-fill CVV
      }
    }
  }, [userWallet3DCards, selectedSavedCardId, cardNumber, user?.name]);

  const handleSelectWallet3DCard = (card: UserSavedCard) => {
    setSelectedSavedCardId(card.id);
    const last4 = card.last4 || "4242";
    const isMaster = card.network === "mastercard";
    const isAmex = card.network === "american-express";
    const isDiners = card.network === "diners-club";
    const isDiscover = card.network === "discover";
    const prefix = isMaster
      ? "5412 7500 8899"
      : isAmex
      ? "3782 822463 1"
      : isDiners
      ? "3654 1198 76"
      : isDiscover
      ? "6011 4902 8831"
      : "4532 8910 2233";
    const cleanFull = (card.fullNumber || "").replace(/\D/g, "");
    const formattedNum = cleanFull.length >= 14
      ? (cleanFull.match(/.{1,4}/g)?.join(" ") || cleanFull)
      : `${prefix} ${last4}`;

    setCardNumber(formattedNum);
    const savedCard = cards?.find((c) => c.id === card.id);
    setCardExpiry(savedCard?.exp || card.expiry || "12/28");
    setCardHolder(savedCard?.holder || card.holderName || user?.name || "CLIENTE LUMINA");
    setCardCvv(""); // Never auto-fill CVV
    playEnvelopeSound("open");
  };

  const handleSelectSavedCard = (cardId: string) => {
    setSelectedSavedCardId(cardId);
    setIsMiniWalletOpen(false);
    if (cardId === "new") {
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardHolder(user?.name || "");
      return;
    }
    const foundWallet = userWallet3DCards?.find((c) => c.id === cardId);
    const found = cards?.find((c) => c.id === cardId);
    if (found || foundWallet) {
      const net = foundWallet?.network || found?.type || "visa";
      const isMaster = net.includes("master");
      const isAmex = net.includes("amex") || net.includes("american");
      const isDiners = net.includes("diner");
      const isDiscover = net.includes("discover");
      const prefix = isMaster
        ? "5412 7500 8899"
        : isAmex
        ? "3782 822463 1"
        : isDiners
        ? "3654 1198 76"
        : isDiscover
        ? "6011 4902 8831"
        : "4532 8910 2233";
      const last4 = (found?.number || foundWallet?.last4 || "4242").replace(/\D/g, "").slice(-4);
      const cleanFull = ((found?.number || foundWallet?.fullNumber || "")).replace(/\D/g, "");
      const formattedNum = cleanFull.length >= 14
        ? (cleanFull.match(/.{1,4}/g)?.join(" ") || cleanFull)
        : `${prefix} ${last4}`;

      setCardNumber(formattedNum);
      setCardExpiry(found?.exp || foundWallet?.expiry || "12/29");
      setCardHolder(found?.holder || foundWallet?.holderName || user?.name || "CLIENTE LUMINA");
      setCardCvv(""); // Never auto-fill CVV
    }
  };

  // Detect card brand for live button display (Visa, Mastercard, Amex, Diners, Discover)
  const detectedCardBrand = useMemo(() => {
    if (selectedSavedCardId !== "new") {
      const foundWalletCard = userWallet3DCards?.find((c) => c.id === selectedSavedCardId);
      if (foundWalletCard?.network) {
        if (foundWalletCard.network === "mastercard") return "mastercard";
        if (foundWalletCard.network === "visa") return "visa";
        if (foundWalletCard.network === "american-express") return "amex";
        if (foundWalletCard.network === "diners-club") return "diners";
        if (foundWalletCard.network === "discover") return "discover";
      }
      const found = cards?.find((c) => c.id === selectedSavedCardId);
      if (found?.type) {
        const t = found.type.toLowerCase();
        if (t.includes("master")) return "mastercard";
        if (t.includes("visa")) return "visa";
        if (t.includes("amex") || t.includes("american")) return "amex";
        if (t.includes("diner")) return "diners";
        if (t.includes("discover")) return "discover";
      }
    }
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.startsWith("4")) return "visa";
    if (
      digits.startsWith("51") || digits.startsWith("52") || digits.startsWith("53") ||
      digits.startsWith("54") || digits.startsWith("55") || digits.startsWith("2")
    ) return "mastercard";
    if (digits.startsWith("34") || digits.startsWith("37")) return "amex";
    if (digits.startsWith("30") || digits.startsWith("36") || digits.startsWith("38")) return "diners";
    if (digits.startsWith("6011") || digits.startsWith("65")) return "discover";
    return "visa";
  }, [selectedSavedCardId, userWallet3DCards, cards, cardNumber]);


  // Field validation to prevent proceeding without valid card / payment & address data
  const isPaymentFieldsValid = useMemo(() => {
    if (selectedPayMethod === "app") {
      const cleanPhone = payphoneAppPhone.replace(/\D/g, "");
      return cleanPhone.length === 10 && cleanPhone.startsWith("09");
    }

    // Card payment:
    // 1. CVV is strictly valid with either 3 or 4 digits (accommodating Visa, MC, Diners 3-digit and Amex 4-digit)
    const cleanCvv = cardCvv.replace(/\D/g, "");
    const isCvvValid = cleanCvv.length === 3 || cleanCvv.length === 4;
    if (!isCvvValid) return false;

    // 2. If using a saved card from 3D wallet or stored cards, valid CVV activates the payment button immediately
    if (selectedSavedCardId && selectedSavedCardId !== "new") {
      return isCvvValid;
    }

    // 3. Manual or auto-filled card entry
    const cleanNum = cardNumber.replace(/\D/g, "");
    const isNumValid = cardNumber.includes("••••")
      ? cardNumber.replace(/\s/g, "").length >= 12
      : (cleanNum.length >= 14 && cleanNum.length <= 19);

    const cleanExp = cardExpiry.trim();
    const isExpValid = /^\d{1,2}\/(\d{2}|\d{4})$/.test(cleanExp) || cleanExp.replace(/\D/g, "").length === 4;
    const isHolderValid = cardHolder.trim().length >= 2 || Boolean(user?.name);

    return isNumValid && isExpValid && isCvvValid && isHolderValid;
  }, [selectedPayMethod, payphoneAppPhone, cardCvv, selectedSavedCardId, cardNumber, cardExpiry, cardHolder, user?.name]);

  // Quick Address Inline Form
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addrRecipient, setAddrRecipient] = useState("");
  const [addrIdNumber, setAddrIdNumber] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrEmail, setAddrEmail] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrExteriorNumber, setAddrExteriorNumber] = useState("");
  const [addrNeighborhood, setAddrNeighborhood] = useState("");
  const [addrInteriorNumber, setAddrInteriorNumber] = useState("");
  const [addrCrossStreets, setAddrCrossStreets] = useState("");
  const [addrAddressType, setAddrAddressType] = useState<"casa" | "departamento" | "oficina">("casa");
  const [addrDeliveryInstructions, setAddrDeliveryInstructions] = useState("");
  const [addrHasElevator, setAddrHasElevator] = useState(false);
  const [addrFloorLevel, setAddrFloorLevel] = useState("");
  const [addrLabel, setAddrLabel] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCountry, setAddrCountry] = useState("Ecuador");
  const [addrDetectedCoords, setAddrDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [addrDetectedRawGps, setAddrDetectedRawGps] = useState<RawGpsHardwareData | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressValidationError, setAddressValidationError] = useState<string | null>(null);

  const hasShippingAddress = useMemo(() => {
    if (address && address.street?.trim() && address.city?.trim()) return true;
    if (addresses && addresses.length > 0 && addresses.some(a => Boolean(a.street?.trim() && a.city?.trim()))) {
      return true;
    }
    const hasStreet = addrStreet.trim().length >= 3;
    const hasCity = addrCity.trim().length >= 2;
    return hasStreet && hasCity;
  }, [address, addresses, addrStreet, addrCity]);

  // Specific user feedback for why the checkout button is pending
  const checkoutPendingReason = useMemo(() => {
    if (!hasShippingAddress) {
      return "Falta seleccionar o ingresar la dirección de entrega";
    }
    if (selectedPayMethod === "app") {
      const cleanPhone = payphoneAppPhone.replace(/\D/g, "");
      if (cleanPhone.length !== 10 || !cleanPhone.startsWith("09")) {
        return "Ingresa un número celular PayPhone de 10 dígitos (Ej: 099 123 4567)";
      }
    }
    if (selectedPayMethod === "card") {
      const cleanCvv = cardCvv.replace(/\D/g, "");
      if (cleanCvv.length < 3 || cleanCvv.length > 4) {
        return "Ingresa el código CVV (3 o 4 dígitos) de tu tarjeta para autorizar el cobro";
      }
      if (selectedSavedCardId === "new") {
        const cleanNum = cardNumber.replace(/\D/g, "");
        const hasValidNum = cardNumber.includes("••••")
          ? cardNumber.replace(/\s/g, "").length >= 12
          : (cleanNum.length >= 14 && cleanNum.length <= 19);
        if (!hasValidNum) {
          return "Ingresa los 16 dígitos de tu tarjeta de crédito o débito";
        }
        const cleanExp = cardExpiry.trim();
        const isExpOk = /^\d{1,2}\/(\d{2}|\d{4})$/.test(cleanExp) || cleanExp.replace(/\D/g, "").length === 4;
        if (!isExpOk) {
          return "Ingresa la fecha de expiración en formato MM/AA (Ej: 12/28)";
        }
        if (cardHolder.trim().length < 2 && !user?.name) {
          return "Ingresa el nombre del titular como figura en tu tarjeta";
        }
      }
    }
    return null;
  }, [hasShippingAddress, selectedPayMethod, payphoneAppPhone, cardCvv, selectedSavedCardId, cardNumber, cardExpiry, cardHolder]);

  // Checkout Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const isCheckoutReady = !checkoutPendingReason && !isProcessing;

 const { mode } = useThemeStore();
 const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

 useEffect(() => {
 const update = () => setResolvedTheme(getResolvedTheme(mode));
 update();
 const interval = setInterval(update, 60000);
 return () => clearInterval(interval);
 }, [mode]);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [lastPlacedPaymentType, setLastPlacedPaymentType] = useState<"card" | "app">("card");
  const [lastPlacedCardLast4, setLastPlacedCardLast4] = useState<string>("5555");

  const cardNetworkForReceipt = useMemo((): ReceiptCardNetwork => {
    if (detectedCardBrand === "amex") return "american-express";
    if (detectedCardBrand === "diners") return "diners-club";
    if (detectedCardBrand === "discover") return "discover";
    if (detectedCardBrand === "mastercard") return "mastercard";
    return "visa";
  }, [detectedCardBrand]);

  const receiptLast4 = useMemo(() => {
    if (selectedSavedCardId !== "new") {
      const foundWalletCard = userWallet3DCards?.find((c) => c.id === selectedSavedCardId);
      if (foundWalletCard?.last4) return foundWalletCard.last4;
      const found = cards?.find((c) => c.id === selectedSavedCardId);
      if (found?.number) return found.number.replace(/\D/g, "").slice(-4);
    }
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length >= 4) return digits.slice(-4);
    if (lastPlacedOrder?.paymentMethod) {
      const match = lastPlacedOrder.paymentMethod.match(/\d{4}/);
      if (match) return match[0];
    }
    return "5555";
  }, [selectedSavedCardId, userWallet3DCards, cards, cardNumber, lastPlacedOrder]);

 // Detect products with the "AGOTADO" badge in the user's cart
 const agotadoItems = useMemo(() => {
 return items.filter(i => {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const itemBadge = (i.product as any)?.badge;
 const liveProduct = products.find(p => p.id === i.productId);
 return isAgotadoBadge(itemBadge) || isAgotadoBadge(liveProduct?.badge);
 });
 }, [items, products]);

 const hasAgotadoItems = agotadoItems.length > 0;

 // Mount on client
 useEffect(() => {
 setIsMounted(true);
 }, []);

  // Initialize defaults from userStore cleanly scoped to the active account
  useEffect(() => {
    const defaultAddr = addresses?.find(a => a.isDefault) || (addresses && addresses.length > 0 ? addresses[0] : null);
    const activeAddr = address || defaultAddr;
    if (activeAddr) {
      setAddrRecipient(activeAddr.recipient || user?.name || "");
      setAddrIdNumber(activeAddr.idNumber || "");
      setAddrPhone(activeAddr.phone || "");
      setAddrEmail(activeAddr.email || user?.email || "");
      setAddrStreet(activeAddr.street);
      setAddrExteriorNumber(activeAddr.exteriorNumber || "");
      setAddrNeighborhood(activeAddr.neighborhood || "");
      setAddrInteriorNumber(activeAddr.interiorNumber || "");
      setAddrCrossStreets(activeAddr.crossStreets || "");
      setAddrAddressType(activeAddr.addressType || "casa");
      setAddrDeliveryInstructions(activeAddr.deliveryInstructions || "");
      setAddrHasElevator(activeAddr.hasElevator || false);
      setAddrFloorLevel(activeAddr.floorLevel || "");
      setAddrLabel(activeAddr.label || "");
      setAddrCity(activeAddr.city);
      setAddrPostal(activeAddr.postalCode);
      setAddrState(activeAddr.state || "");
      setAddrCountry(activeAddr.country || "Ecuador");
      if (!address && defaultAddr) {
        setAddress(defaultAddr);
      }
    } else {
      setAddrRecipient(user?.name || "");
      setAddrIdNumber("");
      setAddrPhone("");
      setAddrEmail(user?.email || "");
      setAddrStreet("");
      setAddrExteriorNumber("");
      setAddrNeighborhood("");
      setAddrInteriorNumber("");
      setAddrCrossStreets("");
      setAddrAddressType("casa");
      setAddrDeliveryInstructions("");
      setAddrHasElevator(false);
      setAddrFloorLevel("");
      setAddrLabel("");
      setAddrCity("");
      setAddrPostal("");
      setAddrState("");
      setAddrCountry("Ecuador");
    }
  }, [user?.id, user?.name, user?.email, address, addresses, setAddress]);

  // Fetch PayPhone configuration and load script for Cajita mode
  useEffect(() => {
    let isMountedLocal = true;
    async function fetchPayphoneConfig() {
      try {
        const res = await fetch("/api/payphone/config");
        if (!res.ok) return;
        const cfg = await res.json();
        if (isMountedLocal) {
          setPayphoneMode(cfg.mode || "box");
          setIsPayphoneConfigured(!!cfg.isConfigured);
          setIsPayphoneSimulated(!!cfg.isSimulated);

          // If mode is box and not simulated, inject PayPhone box CSS & JS once
          if (cfg.mode === "box" && !cfg.isSimulated && typeof window !== "undefined") {
            if (!document.getElementById("payphone-box-css")) {
              const link = document.createElement("link");
              link.id = "payphone-box-css";
              link.rel = "stylesheet";
              link.href = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css";
              document.head.appendChild(link);
            }
            if (!document.getElementById("payphone-box-js")) {
              const script = document.createElement("script");
              script.id = "payphone-box-js";
              script.type = "module";
              script.src = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";
              script.onload = () => {
                if (isMountedLocal) setIsBoxScriptLoaded(true);
              };
              document.body.appendChild(script);
            } else {
              setIsBoxScriptLoaded(true);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching PayPhone config:", err);
      }
    }
    fetchPayphoneConfig();
    return () => {
      isMountedLocal = false;
    };
  }, []);

 // Reset step when cart is closed
 useEffect(() => {
 if (!isOpen) {
 const timer = setTimeout(() => {
 if (step === "success") {
 setStep("bag");
 }
 }, 500);
 return () => clearTimeout(timer);
 }
 }, [isOpen, step]);

 // Prevent background catalog scroll when cart modal is open
 useEffect(() => {
 if (isOpen) {
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = "hidden";
 return () => {
 document.body.style.overflow = originalOverflow;
 };
 }
 }, [isOpen]);

 const subtotal = getSubtotal();
 const discountAmount = getDiscountAmount();
 const shipping = getShipping();
 const priorityShippingCost = hasPriorityShipping ? 2.15 : 0;
 const finalTotal = getTotal() + priorityShippingCost;

 // Free shipping threshold progress ($100 target)
 const FREE_SHIPPING_TARGET = 100;
 const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_TARGET) * 100));
 const amountToFreeShipping = Math.max(0, FREE_SHIPPING_TARGET - subtotal);
 const hasFreeShipping = subtotal >= FREE_SHIPPING_TARGET || isFreeShippingCoupon;

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponInput.trim();
    if (!clean) {
      setCouponFeedback({ msg: "Ingresa un código de cupón para validar.", success: false });
      return;
    }
    if (items.length === 0 || subtotal <= 0) {
      setCouponFeedback({ msg: "Tu bolsa de compras está vacía. Añade piezas para aplicar un cupón.", success: false });
      return;
    }
    setIsApplyingCoupon(true);
    setCouponFeedback(null);
    try {
      const res = await applyCoupon(clean);
      setCouponFeedback({ msg: res.message, success: res.success });
      if (res.success) {
        setCouponInput("");
      }
    } catch {
      setCouponFeedback({ msg: "No pudimos validar el cupón en este momento. Intenta de nuevo.", success: false });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleDetectLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);
    setLocationSuccess(false);

    try {
      // Runs 3 internal sequential samples and returns the most accurate sample + raw GPS chip telemetry
      const coords = await getRefinedCoordinates();
      setAddrDetectedRawGps(coords.rawGps);

      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: coords.latitude, lon: coords.longitude })
      });

      const result = await res.json();

      if (result.success && result.data) {
        const { 
          street: detStreet, 
          exteriorNumber: detExterior,
          interiorNumber: detInterior,
          crossStreets: detCross,
          neighborhood: detNeighborhood,
          suburb: detSuburb,
          city: detCity, 
          state: detState, 
          postalCode: detPostal, 
          country: detCountry 
        } = result.data;

        // Fills the form strictly once at the end with the 3rd refined reading
        const cleanStreet = (detStreet || "").replace(/^(?:calle\s+)?s\/?n$/i, "").trim();
        if (cleanStreet) setAddrStreet(cleanStreet);
        if (detExterior) setAddrExteriorNumber(detExterior);
        if (detInterior) setAddrInteriorNumber(detInterior);
        if (detCross) setAddrCrossStreets(detCross);
        const resolvedNeigh = detNeighborhood || detSuburb;
        if (resolvedNeigh) setAddrNeighborhood(resolvedNeigh);
        if (detCity) setAddrCity(detCity);
        if (detState) setAddrState(detState);
        if (detPostal) setAddrPostal(detPostal);
        if (detCountry) setAddrCountry(detCountry);

        const enrichedRawGps: RawGpsHardwareData = {
          ...coords.rawGps,
          rawDisplayName: result.rawDisplayName || result.data?.rawDisplayName,
          rawNominatim: result.rawNominatim || result.data?.rawNominatim,
          rawPositionJson: JSON.stringify({
            gpsChip: coords.rawGps,
            reverseGeocodeRaw: result.rawNominatim || result.data?.rawNominatim || result,
          }),
        };
        setAddrDetectedRawGps(enrichedRawGps);
        setAddrDetectedCoords({ lat: coords.latitude, lng: coords.longitude });
        setShowMiniMap(true);

        if (!addrRecipient.trim() && user?.name) {
          setAddrRecipient(user.name);
        }

        setLocationSuccess(true);
      } else {
        setLocationError(result.error || "No se pudo obtener la información de dirección. Por favor, ingrésala manualmente.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la dirección de tu ubicación.";
      setLocationError(msg);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingAddress) return;
    setAddressValidationError(null);

    // Explicit validation feedback
    const missing: string[] = [];
    if (!addrStreet.trim()) missing.push("Calle Principal");
    if (!addrCity.trim()) missing.push("Ciudad / Cantón");

    if (missing.length > 0) {
      setAddressValidationError(`Por favor completa: ${missing.join(", ")}.`);
      return;
    }

    if (addresses.length >= 4) {
      setIsEditingAddress(false);
      return;
    }

    setIsSavingAddress(true);

    try {
      const finalStreet = addrStreet.trim();
      const finalCity = addrCity.trim();
      const finalState = addrState.trim() || "Pichincha";
      const finalPostal = addrPostal.trim() || "170150";
      const finalCountry = addrCountry.trim() || "Ecuador";
      const finalRecipient = addrRecipient.trim() || user?.name || "Destinatario";

      const newAddrPayload = {
        recipient: finalRecipient,
        idNumber: addrIdNumber.trim() || undefined,
        phone: addrPhone.trim() || undefined,
        email: addrEmail.trim() || user?.email || undefined,
        street: finalStreet,
        exteriorNumber: addrExteriorNumber.trim() || undefined,
        neighborhood: addrNeighborhood.trim() || undefined,
        interiorNumber: addrInteriorNumber.trim() || undefined,
        crossStreets: addrCrossStreets.trim() || undefined,
        addressType: addrAddressType,
        deliveryInstructions: addrDeliveryInstructions.trim() || undefined,
        hasElevator: addrHasElevator,
        floorLevel: addrFloorLevel.trim() || undefined,
        label: addrLabel.trim() || undefined,
        city: finalCity,
        state: finalState,
        postalCode: finalPostal,
        country: finalCountry,
        lat: addrDetectedCoords?.lat ?? addrDetectedRawGps?.latitude,
        lng: addrDetectedCoords?.lng ?? addrDetectedRawGps?.longitude,
        rawGps:
          typeof (addrDetectedCoords?.lat ?? addrDetectedRawGps?.latitude) === "number" &&
          typeof (addrDetectedCoords?.lng ?? addrDetectedRawGps?.longitude) === "number"
            ? {
                ...(addrDetectedRawGps || {
                  accuracy: 5,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                  timestamp: Date.now(),
                  rawPositionJson: JSON.stringify({
                    latitude: addrDetectedCoords?.lat,
                    longitude: addrDetectedCoords?.lng,
                  }),
                }),
                latitude: (addrDetectedCoords?.lat ?? addrDetectedRawGps?.latitude) as number,
                longitude: (addrDetectedCoords?.lng ?? addrDetectedRawGps?.longitude) as number,
                rawCoordsString: `${addrDetectedCoords?.lat ?? addrDetectedRawGps?.latitude},${addrDetectedCoords?.lng ?? addrDetectedRawGps?.longitude}`,
              }
            : addrDetectedRawGps || undefined,
        rawGpsString: addrDetectedRawGps?.rawPositionJson || undefined,
        isDefault: addresses.length === 0
      };

      // 1. Immediately close edit modal and clear inputs so UI is instantly responsive
      setIsEditingAddress(false);
      setShowMiniMap(false);
      setAddrRecipient(user?.name || "");
      setAddrIdNumber("");
      setAddrPhone("");
      setAddrEmail(user?.email || "");
      setAddrStreet("");
      setAddrExteriorNumber("");
      setAddrNeighborhood("");
      setAddrInteriorNumber("");
      setAddrCrossStreets("");
      setAddrAddressType("casa");
      setAddrDeliveryInstructions("");
      setAddrHasElevator(false);
      setAddrFloorLevel("");
      setAddrLabel("");
      setAddrCity("");
      setAddrPostal("");
      setAddrState("");
      setAddrCountry("Ecuador");
      setAddrDetectedRawGps(null);
      setAddrDetectedCoords(null);
      setLocationError(null);
      setLocationSuccess(false);

      // 2. Persist to store (renders immediately) and syncs in background
      await addAddress(newAddrPayload);
    } catch (err) {
      console.error("Error al guardar dirección:", err);
    } finally {
      setIsSavingAddress(false);
    }
  };

 const handleProceedToPayment = () => {
 if (hasAgotadoItems) {
 return;
 }

  if (!isAuthenticated) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("lumina_cart_reopen", "true");
    } catch {}
  }
  setIsOpen(false);
  router.push("/auth/login?redirect=cart");
  return;
  }
 const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || null;
 if (defaultAddr) {
 setAddress(defaultAddr);
 }
 setStep("payment");
 };

  const handleConfirmOrder = async () => {
    if (!address && (!addresses || addresses.length === 0) && !addrStreet) {
      setIsEditingAddress(true);
      return;
    }
    let shippingAddr = address;
    if (!shippingAddr && addresses && addresses.length > 0) {
      shippingAddr = addresses.find(a => a.isDefault) || addresses[0];
      setAddress(shippingAddr);
    }

    const orderId = `INV_${Math.floor(100000 + Math.random() * 900000)}`;
    const customerName = user?.name || shippingAddr?.recipient || addrRecipient || "Cliente";
    const customerEmail = user?.email || shippingAddr?.email || addrEmail.trim() || "cliente@lumina.com";
    const recipientName = shippingAddr?.recipient || addrRecipient || customerName;

    // PAYPHONE ECUADOR EXCLUSIVE CHECKOUT FLOW (Zero-Trust Recalculation, Live vs Simulated)
    setIsProcessing(true);
    setPayphoneError(null);
    try {
      const res = await fetch("/api/payphone/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.product.price,
            isBundle: i.isBundle,
            bundleCustomPrice: i.bundleCustomPrice,
            product: {
              id: i.product.id,
              title: i.product.title,
              price: i.product.price,
              imageUrl: i.product.imageUrl
            }
          })),
          shippingAddress: {
            recipient: recipientName,
            idNumber: shippingAddr?.idNumber || addrIdNumber.trim() || undefined,
            phone: shippingAddr?.phone || addrPhone.trim() || undefined,
            email: customerEmail,
            street: shippingAddr?.street || addrStreet || "Calle Principal",
            city: shippingAddr?.city || addrCity || "Quito",
            state: shippingAddr?.state || addrState || "Pichincha",
            postalCode: shippingAddr?.postalCode || addrPostal || "170150",
            country: "Ecuador"
          },
          hasPriorityShipping,
          couponCode: couponCode || undefined,
          clientClaimedTotal: finalTotal
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsProcessing(false);
        setPayphoneError(data.error || "No se pudo preparar la pasarela de pagos de PayPhone.");
        return;
      }

      if (data.isSimulated) {
        // Direct order confirmation without intermediate modal
        try {
          const confirmRes = await fetch("/api/payphone/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: data.paymentId,
              clientTxId: data.clientTransactionId,
              orderData: {
                orderId,
                total: data.verifiedTotal || finalTotal,
                hasPriorityShipping,
                items: [...items],
                customerName,
                customerEmail,
                recipient: recipientName,
                customerIdNumber: shippingAddr?.idNumber || addrIdNumber.trim() || undefined,
                customerPhone: shippingAddr?.phone || addrPhone.trim() || undefined,
                paymentMethod: selectedPayMethod === "card"
                  ? `Tarjeta ${detectedCardBrand.toUpperCase()} •••• ${cardNumber.replace(/\D/g, "").slice(-4) || "4242"}`
                  : `PayPhone (+593 ${payphoneAppPhone ? `0${payphoneAppPhone.replace(/\D/g, "").slice(-9)}` : "Celular"})`,
                shippingAddress: shippingAddr ? {
                  recipient: recipientName,
                  idNumber: shippingAddr.idNumber,
                  phone: shippingAddr.phone,
                  email: customerEmail,
                  street: shippingAddr.street,
                  exteriorNumber: shippingAddr.exteriorNumber,
                  neighborhood: shippingAddr.neighborhood,
                  interiorNumber: shippingAddr.interiorNumber,
                  crossStreets: shippingAddr.crossStreets,
                  addressType: shippingAddr.addressType,
                  deliveryInstructions: shippingAddr.deliveryInstructions,
                  hasElevator: shippingAddr.hasElevator,
                  floorLevel: shippingAddr.floorLevel,
                  label: shippingAddr.label,
                  city: shippingAddr.city,
                  state: shippingAddr.state,
                  postalCode: shippingAddr.postalCode,
                  country: shippingAddr.country
                } : (addrStreet ? {
                  recipient: recipientName,
                  idNumber: addrIdNumber.trim() || undefined,
                  phone: addrPhone.trim() || undefined,
                  email: customerEmail,
                  street: addrStreet,
                  exteriorNumber: addrExteriorNumber.trim() || undefined,
                  neighborhood: addrNeighborhood.trim() || undefined,
                  interiorNumber: addrInteriorNumber.trim() || undefined,
                  crossStreets: addrCrossStreets.trim() || undefined,
                  addressType: addrAddressType,
                  deliveryInstructions: addrDeliveryInstructions.trim() || undefined,
                  hasElevator: addrHasElevator,
                  floorLevel: addrFloorLevel.trim() || undefined,
                  label: addrLabel.trim() || undefined,
                  city: addrCity,
                  state: addrState,
                  postalCode: addrPostal,
                  country: addrCountry
                } : undefined)
              }
            })
          });

          const confirmData = await confirmRes.json();
          setIsProcessing(false);

          if (confirmRes.ok && confirmData.success && confirmData.order) {
            addOrder(confirmData.order);
            setLastPlacedOrder(confirmData.order);
            setLastPlacedPaymentType(selectedPayMethod);
            setLastPlacedCardLast4(receiptLast4);
            clearCart();
            setStep("success");
          } else {
            setPayphoneError(confirmData.error || "No se pudo confirmar la transacción.");
          }
        } catch {
          setIsProcessing(false);
          setPayphoneError("Error de conexión al procesar el pago.");
        }
      } else if (data.mode === "box" && data.token) {
        // Live PayPhone Cajita Widget Initialization
        const win = typeof window !== "undefined" ? (window as unknown as { PPaymentButtonBox: new (opts: Record<string, unknown>) => { render: (id: string) => void } }) : null;
        if (win && win.PPaymentButtonBox) {
          try {
            const ppb = new win.PPaymentButtonBox({
              token: data.token,
              amount: data.amountInCents,
              amountWithoutTax: data.amountWithoutTaxInCents,
              amountWithTax: data.amountWithTaxInCents,
              tax: data.taxInCents,
              service: 0,
              tip: 0,
              reference: data.reference,
              clientTransactionId: data.clientTransactionId,
              email: data.email,
              phoneNumber: data.phoneNumber,
              documentId: data.documentId
            });
            ppb.render("pp-button");
            setIsBoxRendered(true);
          } catch (renderErr) {
            console.error("Error rendering PayPhone Box:", renderErr);
            setPayphoneError("Error al inicializar la Cajita de Pagos PayPhone.");
          }
        } else {
          setPayphoneError("El componente seguro de PayPhone se está cargando. Por favor reintenta en un momento.");
        }
      } else if (data.payUrl) {
        // Live PayPhone redirection
        window.location.href = data.payUrl;
      }
    } catch {
      setIsProcessing(false);
      setPayphoneError("Error de conexión al comunicar con los servidores de PayPhone Ecuador.");
    }
  };

  const handleTriggerPaymentWithAnimation = () => {
    if (isProcessing) return;
    setPayphoneError(null);

    // 1. Control de Dirección de Entrega
    if (!hasShippingAddress) {
      setPayphoneError("Por favor añade o selecciona una dirección de entrega válida antes de continuar.");
      setIsEditingAddress(true);
      const addrElem = document.getElementById("cart-address-section");
      if (addrElem) addrElem.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // 2. Control de Campos del Método de Pago
    if (selectedPayMethod === "card") {
      const cleanCvv = cardCvv.replace(/\D/g, "");
      if (cleanCvv.length < 3 || cleanCvv.length > 4) {
        setPayphoneError("Por favor ingresa el código de seguridad CVV (3 o 4 dígitos) de tu tarjeta para autorizar el cobro.");
        const payElem = document.getElementById("cart-payment-fields");
        if (payElem) payElem.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (selectedSavedCardId === "new") {
        const cleanNum = cardNumber.replace(/\D/g, "");
        const hasValidNum = cardNumber.includes("••••")
          ? cardNumber.replace(/\s/g, "").length >= 12
          : (cleanNum.length >= 14 && cleanNum.length <= 19);
        if (!hasValidNum) {
          setPayphoneError("Por favor ingresa los 16 dígitos de tu tarjeta de crédito o débito.");
          const payElem = document.getElementById("cart-payment-fields");
          if (payElem) payElem.scrollIntoView({ behavior: "smooth" });
          return;
        }
        const cleanExp = cardExpiry.trim();
        const isExpOk = /^\d{1,2}\/(\d{2}|\d{4})$/.test(cleanExp) || cleanExp.replace(/\D/g, "").length === 4;
        if (!isExpOk) {
          setPayphoneError("Por favor ingresa la fecha de expiración en formato MM/AA (Ej: 12/28).");
          const payElem = document.getElementById("cart-payment-fields");
          if (payElem) payElem.scrollIntoView({ behavior: "smooth" });
          return;
        }
        if (cardHolder.trim().length < 2 && !user?.name) {
          setPayphoneError("Por favor ingresa el nombre del titular como figura en tu tarjeta.");
          const payElem = document.getElementById("cart-payment-fields");
          if (payElem) payElem.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
    } else if (selectedPayMethod === "app") {
      const cleanPhone = payphoneAppPhone.replace(/\D/g, "");
      if (cleanPhone.length !== 10 || !cleanPhone.startsWith("09")) {
        setPayphoneError("Por favor ingresa un número celular PayPhone válido de 10 dígitos (Ej: 099 123 4567).");
        const payElem = document.getElementById("cart-payment-fields");
        if (payElem) payElem.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    handleConfirmOrder();
  };




 // Recommended products for the bottom of the cart page
 const recommendedProducts = useMemo(() => {
 return products.filter(p => !items.some(i => i.productId === p.id)).slice(0, 3);
 }, [products, items]);

 if (!isMounted) return null;

  // Smooth corner-origin expansion originating directly from the cart button
  const startX = originCoords && typeof window !== "undefined" 
    ? originCoords.x - window.innerWidth / 2 
    : (typeof window !== "undefined" ? window.innerWidth * 0.35 : 250);
  const startY = originCoords && typeof window !== "undefined" 
    ? originCoords.y - window.innerHeight / 2 
    : (typeof window !== "undefined" ? -window.innerHeight * 0.35 : -250);

  const cartModalVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.96,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      }
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      y: 16,
      transition: {
        duration: 0.2,
        ease: [0.32, 0, 0.67, 0],
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={clsx("fixed inset-0 z-[90] flex items-center justify-center p-2.5 sm:p-4 md:p-6 lg:p-8 overflow-hidden", resolvedTheme === 'dark' ? 'dark' : '')}>
          {/* Backdrop with Deep Soft Blur (Lightweight GPU Fill) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ willChange: "opacity" }}
            className="fixed inset-0 bg-slate-950/65 sm:backdrop-blur-md transform-gpu"
            onClick={() => setIsOpen(false)}
          />

          {/* LUXURY CART CANVAS - INSTANT & FLUID (Optimized GPU Containment) */}
          <motion.div
            variants={cartModalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ willChange: "transform, opacity", transform: "translateZ(0)", contain: "paint" }}
            className="relative w-full max-w-6xl h-full max-h-[92vh] sm:max-h-[92vh] bg-white dark:bg-[#18181b] sm:backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-gray-300/80 dark:border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden z-10 transform-gpu"
          >

  {/* Top Bar Header with crisp high-contrast border */}
  <header className="px-4 sm:px-8 py-3.5 sm:py-4 bg-white dark:bg-[#202023] border-b border-gray-200 dark:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 shrink-0 shadow-xs">
 
  {/* Top line on mobile: Left Title + Right Close Button */}
  <div className="flex items-center justify-between w-full sm:w-auto">
    <div className="flex items-center gap-2.5 sm:gap-3">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center shadow-xs shrink-0">
        <ShoppingBag className="w-4 h-4 text-white dark:text-stone-900 drop-shadow-xs" />
      </div>
      <span className="font-sans font-bold text-lg sm:text-xl text-gray-950 dark:text-white tracking-tight">
        Bolsa de Compras
      </span>
    </div>

    {/* Close Button on Mobile (visible only < sm) with Apple Liquid Glass Architecture */}
    <LiquidGlassButton 
      onClick={() => setIsOpen(false)}
      radius={9999}
      depth={4}
      strength={30}
      chromaticAberration={1.8}
      className="lumina-bag-close-btn sm:hidden w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 border border-black/[0.08] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
      title="Cerrar bolsa"
    >
      <motion.div
        whileHover={{ rotate: 90 }}
        transition={{ type: "spring", stiffness: 380, damping: 20 }}
      >
        <X className="w-4 h-4" />
      </motion.div>
    </LiquidGlassButton>
  </div>

  {/* Center Step Indicator: Apple Liquid Glass Pill Dock */}
  <div className="flex items-center justify-center w-full sm:w-auto">
    <LiquidGlass
      radius={9999}
      depth={5}
      strength={26}
      chromaticAberration={1.6}
      blur={1.5}
      className="relative grid grid-cols-2 items-center bg-black/[0.03] dark:bg-white/[0.06] p-1 rounded-full border border-black/[0.05] dark:border-white/10 w-full sm:w-auto min-w-[270px] sm:min-w-[300px]"
    >
      {/* Pure GPU CSS Spring Pill Indicator with Liquid Glass Specular Shine */}
      <div
        style={{
          transform: step === "bag" ? "translate3d(0%, 0, 0)" : "translate3d(100%, 0, 0)",
          transition: "transform 480ms cubic-bezier(0.22, 1.35, 0.36, 1)",
        }}
        className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-[#27272a] shadow-[0_2px_12px_rgba(0,0,0,0.12),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)] z-0"
      />
      <button 
        type="button"
        onClick={() => {
          setStep("bag");
        }}
        className={`relative z-10 text-center px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
          step === "bag" 
            ? "text-gray-950 dark:text-white" 
            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        1. Bolsa ({items.length})
      </button>
      <button 
        type="button"
        onClick={() => {
          if (items.length > 0) {
            handleProceedToPayment();
          }
        }}
        disabled={items.length === 0}
        className={`relative z-10 text-center px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 cursor-pointer whitespace-nowrap active:scale-95 ${
          step === "payment" 
            ? "text-gray-950 dark:text-white" 
            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        <span className="hidden sm:inline">2. Pasarela de Pago</span>
        <span className="sm:hidden">2. Pago</span>
      </button>
    </LiquidGlass>
  </div>

  {/* Right Action: Liquid Glass Close Button (Desktop sm:flex) */}
  <div className="hidden sm:flex items-center gap-3">
    <LiquidGlassButton 
      onClick={() => setIsOpen(false)}
      radius={9999}
      depth={5}
      strength={32}
      chromaticAberration={2}
      className="lumina-bag-close-btn w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 border border-black/[0.08] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
      title="Cerrar bolsa"
    >
      <motion.div
        whileHover={{ rotate: 90 }}
        transition={{ type: "spring", stiffness: 380, damping: 20 }}
      >
        <X className="w-4 h-4" />
      </motion.div>
    </LiquidGlassButton>
  </div>
</header>

  {/* ========================================================================= */}
  {/* MAIN CANVAS SCROLLABLE AREA */}
  {/* ========================================================================= */}
  <div ref={cartScrollRef} data-lenis-prevent className={`flex-1 overflow-y-auto ${
    items.length === 0 && step === "bag"
      ? "p-2.5 sm:px-6 sm:pb-6 sm:pt-2.5 lg:px-10 lg:pb-10 lg:pt-3 flex flex-col"
      : "p-3 sm:p-6 lg:p-8"
  } scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700 hover:scrollbar-thumb-stone-400 dark:hover:scrollbar-thumb-stone-600 scrollbar-track-transparent space-y-5 sm:space-y-8`}>

  {/* ======================================================================= */}
  {/* STEP 1: CART PAGE VIEW (Skyrise Decor / Crescendo Spacious Studio) */}
  {/* ======================================================================= */}
  {step === "bag" && (
  <>

  {/* ALERTA DE PRODUCTOS AGOTADOS */}
  {hasAgotadoItems && (
  <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-200/80 flex items-start gap-3.5 text-rose-900 shadow-sm dark:shadow-none animate-fade-in transition-all">
  <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
  <AlertTriangle className="w-4 h-4" />
  </div>
  <div className="flex-1 text-xs">
  <p className="font-bold text-sm text-rose-900">
  {agotadoItems.length === 1 ? "Producto no disponible en tu bolsa" : "Productos no disponibles en tu bolsa"}
  </p>
  <p className="mt-1 text-rose-700 leading-relaxed font-medium">
  {agotadoItems.length === 1
  ? `El producto "${agotadoItems[0].product.title}" está marcado como AGOTADO. Debes eliminarlo de tu bolsa de compras para poder continuar hacia la pasarela de pago.`
  : `Tienes ${agotadoItems.length} productos marcados como AGOTADOS en tu bolsa. Debes eliminarlos para poder continuar con tu pedido.`}
  </p>
  </div>
  </div>
  )}

  {items.length === 0 ? (
  <div className="relative overflow-hidden flex-1 w-full my-1 sm:my-2.5 sm:mt-1 rounded-2xl sm:rounded-[2.5rem] p-4 py-6 sm:p-8 lg:p-10 min-h-[220px] sm:min-h-[520px] md:min-h-[560px] border-2 border-black/15 dark:border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] bg-gradient-to-b from-white/95 via-[#faf8f4] to-[#f2eee7] dark:from-[#222226] dark:via-[#1c1c1f] dark:to-[#161619] backdrop-blur-2xl text-center flex flex-col items-center justify-center">
    {/* 3D Radial Champagne Aura */}
    <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-amber-500/[0.08] via-[#8c9276]/[0.08] to-amber-400/[0.06] blur-3xl pointer-events-none" />
    <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/15 to-transparent pointer-events-none" />

    {/* 3D Floating Bag Pedestal */}
    <div className="relative mb-2.5 sm:mb-6 group cursor-default">
      <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 -translate-x-1/2 w-20 sm:w-36 h-4 sm:h-8 bg-black/[0.06] dark:bg-white/[0.06] rounded-full blur-md" />
      
      <div className="relative w-12 h-12 sm:w-24 sm:h-24 rounded-xl sm:rounded-3xl bg-gradient-to-br from-white via-[#faf7f2] to-[#eee8dd] dark:from-[#2a2a2e] dark:via-[#222226] dark:to-[#1a1a1e] border-2 border-white dark:border-white/20 shadow-[0_16px_36px_rgba(0,0,0,0.06)] flex items-center justify-center transition-transform duration-500 hover:scale-105">
        <ShoppingBag className="w-6 h-6 sm:w-11 sm:h-11 text-gray-800 dark:text-gray-100 stroke-[1.5]" />
      </div>
    </div>

    {/* 2IXO Circular Action Feature Discs */}
    <div className="hidden sm:grid grid-cols-3 gap-6 max-w-sm mx-auto mb-6">
      <div className="flex flex-col items-center group">
        <div className="w-12 h-12 shrink-0 aspect-square min-w-[48px] min-h-[48px] rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <Package className="w-5 h-5 text-gray-700 dark:text-gray-200 shrink-0" />
        </div>
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-2 text-center whitespace-nowrap">Logística</span>
      </div>
      <div className="flex flex-col items-center group">
        <div className="w-12 h-12 shrink-0 aspect-square min-w-[48px] min-h-[48px] rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <Truck className="w-5 h-5 text-gray-700 dark:text-gray-200 shrink-0" />
        </div>
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-2 text-center whitespace-nowrap">Despacho</span>
      </div>
      <div className="flex flex-col items-center group">
        <div className="w-12 h-12 shrink-0 aspect-square min-w-[48px] min-h-[48px] rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <Navigation className="w-5 h-5 text-gray-700 dark:text-gray-200 shrink-0" />
        </div>
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-2 text-center whitespace-nowrap">Envío</span>
      </div>
    </div>

    <h3 className="font-display font-bold text-lg sm:text-2xl md:text-3xl text-gray-950 dark:text-white mb-1 sm:mb-2 tracking-tight">
      Tu bolsa de compras está vacía
    </h3>
    <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-3.5 sm:mb-6 px-2 line-clamp-2 sm:line-clamp-none">
      <span className="font-semibold text-gray-800 dark:text-gray-200">Dato curioso:</span> Una luz cálida (2700K) reduce el estrés visual y mejora el descanso un 40%.
    </p>

    {/* 2IXO Dock Capsule CTA Button */}
    <button 
      onClick={() => { setIsOpen(false); router.push("/shop"); }}
      className="group relative overflow-hidden rounded-full bg-[#18181b] dark:bg-white text-white dark:text-gray-950 pl-2.5 sm:pl-3 pr-4 sm:pr-6 py-2 sm:py-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 sm:gap-3 shadow-[0_12px_32px_rgba(0,0,0,0.15)] hover:bg-black dark:hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
    >
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center text-white dark:text-gray-950 group-hover:translate-x-0.5 transition-transform shrink-0">
        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
      <span>Explorar Catálogo Lumina</span>
    </button>
  </div>
  ) : (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
 
 {/* ---------------------------------------------------- */}
 {/* Left Column: Spacious Products Table (7 or 8 cols) */}
 {/* ---------------------------------------------------- */}
  <div className="lg:col-span-8 bg-white dark:bg-[#2a2a2c]/80 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-gray-200 dark:border-white/10 p-3 sm:p-6 lg:p-8 shadow-sm dark:shadow-none space-y-4 sm:space-y-6">
  {/* Clean Toolbar: Count & Vaciar Bolsa */}
  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
      {items.length} {items.length === 1 ? "artículo agregado" : "artículos agregados"}
    </span>
    {items.length > 0 && (
      <button 
        onClick={clearCart}
        className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-black/[0.04] dark:border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        title="Vaciar todos los artículos"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Vaciar Bolsa</span>
      </button>
    )}
  </div>

 {/* Table Column Headers (Aligned 5 + 3 + 3 + 1 = 12 cols) */}
 <div className="hidden sm:grid grid-cols-12 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-200 dark:border-white/15 px-3.5 sm:px-4 items-center">
 <span className="col-span-5">Producto</span>
 <span className="col-span-3 text-center">Cantidad</span>
 <span className="col-span-3 text-right pr-4">Subtotal</span>
 <span className="col-span-1 text-right pr-1">Acción</span>
 </div>

 {/* Product Rows with generous breathing room */}
 <div className="space-y-3 pt-1">
 {items.map((item) => {
  if (item.isBundle) {
    const bundleProducts = item.bundleProducts || [
      {
        id: item.productId,
        title: item.product.title,
        category: item.product.category,
        imageUrl: item.product.imageUrl,
        price: item.product.price,
        color: item.color,
        size: item.size,
      },
    ];
    const regularSum = bundleProducts.reduce((acc, bp) => acc + bp.price, 0);
    const originalTotal = regularSum * item.quantity;
    const discountedUnit = item.bundleCustomPrice ?? item.product.price;
    const discountedTotal = discountedUnit * item.quantity;
    const totalSavings = Math.max(0, originalTotal - discountedTotal);

    return (
      <div
        key={item.id}
        className="p-3.5 sm:p-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-[#1e1e20] dark:to-[#1a1a1c] shadow-sm space-y-4 transition-all"
      >
        {/* Bundle Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm sm:text-base text-gray-950 dark:text-white">
                  {item.bundleName || "Pack Promocional"}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {item.bundleBadge || `-${item.bundleDiscountPercent || 15}% DTO APLICADO`}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                Descuento de pack aplicado a los productos de este cuadro
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-white/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            {bundleProducts.length} {bundleProducts.length === 1 ? "pieza incluida" : "piezas incluidas"}
          </span>
        </div>

        {/* List of products inside this bundle card */}
        <div className="space-y-2.5">
          {bundleProducts.map((bp, bpIdx) => (
            <div 
              key={`${bp.id}-${bpIdx}`}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/95 dark:bg-[#252528] border border-gray-200 dark:border-white/15 shadow-2xs group/bitem"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  onClick={() => { setIsOpen(false); router.push(`/product/${bp.id}`); }}
                  className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-black/5 cursor-pointer hover:opacity-90 transition-opacity"
                  title="Abrir este producto"
                >
                  <Image src={bp.imageUrl} alt={bp.title} fill sizes="48px" className="object-cover group-hover/bitem:scale-105 transition-transform" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">
                    {bp.category || "Pieza Complementaria"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <p 
                      onClick={() => { setIsOpen(false); router.push(`/product/${bp.id}`); }}
                      className="text-xs font-bold text-gray-900 dark:text-white truncate hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                      title={bp.title}
                    >
                      {bp.title}
                    </p>
                    <button
                      onClick={() => { setIsOpen(false); router.push(`/product/${bp.id}`); }}
                      className="p-1 rounded text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                      title="Ver detalles del producto"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    {bp.color && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.05] whitespace-nowrap">
                        Color: {bp.color}
                      </span>
                    )}
                    {bp.size && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.05] whitespace-nowrap">
                        Talla: {bp.size}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <span className="text-xs text-gray-400 line-through block">
                  ${bp.price.toFixed(2)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  Con dto. aplicado
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions Row: Quantity, Subtotal and Delete */}
        <div className="pt-3 border-t border-emerald-500/15 flex flex-wrap items-center justify-between gap-3">
          {/* Quantity Stepper for the Bundle */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">Cantidad de packs:</span>
            <BeUIAdaptiveStepper
              value={item.quantity}
              min={1}
              max={10}
              onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
              onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
              size="sm"
              decrementTitle="Disminuir packs"
              incrementTitle="Aumentar packs"
            />
          </div>

          {/* Subtotal with discount display */}
          <div className="flex items-center justify-end gap-3 ml-auto">
            <div className="text-right">
              {totalSavings > 0 && (
                <span className="text-xs text-gray-400 line-through mr-2">
                  ${originalTotal.toFixed(2)}
                </span>
              )}
              <BeUIRollingPrice
                amount={discountedTotal}
                suffix=" USD"
                className="font-extrabold text-sm sm:text-lg text-emerald-700 dark:text-emerald-400"
              />
              {totalSavings > 0 && (
                <p className="text-[10px] text-emerald-600 font-bold">
                  Ahorro de ${totalSavings.toFixed(2)} USD
                </p>
              )}
            </div>

            {/* Delete Bundle button */}
            <button 
              onClick={() => removeItem(item.id)}
              className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-rose-200/60 shadow-xs transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0"
              title="Eliminar este pack"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const itemBadge = item.product?.badge;
  const liveProduct = products.find(p => p.id === item.productId);
  const liveStock = liveProduct?.stock ?? item.product?.stock;
  const itemIsAgotado = isAgotadoBadge(itemBadge) || isAgotadoBadge(liveProduct?.badge) || (liveStock !== undefined && liveStock <= 0);
  const isMaxStockReached = liveStock !== undefined && item.quantity >= liveStock;

  return (
    <div 
      key={item.id} 
      className={`p-3 sm:p-4 flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 sm:items-center group transition-all rounded-2xl ${
        itemIsAgotado 
          ? "bg-red-50/40 border border-red-300 dark:border-red-900/60 shadow-xs" 
          : "border border-gray-200 dark:border-white/15 bg-white dark:bg-white/[0.03] hover:bg-gray-50/80 dark:hover:bg-white/[0.06] hover:border-gray-300 dark:hover:border-white/25 shadow-2xs"
      }`}
    >
      {/* Product Info (5 cols on sm+) */}
      <div className="sm:col-span-5 flex items-start sm:items-center gap-3 sm:gap-4">
        {/* Thumbnail */}
        <div 
          onClick={() => { setIsOpen(false); router.push(`/product/${item.productId || item.product.id}`); }}
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#202022]/40 shrink-0 border border-black/5 dark:border-white/10 shadow-xs cursor-pointer group/thumb"
          title="Abrir detalles del producto"
        >
          <Image 
            src={item.product.imageUrl} 
            alt={item.product.title} 
            fill 
            sizes="96px"
            quality={85}
            className="object-cover group-hover/thumb:scale-105 transition-transform duration-500" 
          />
          {itemIsAgotado && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-1">
              <span className="bg-red-600 text-white font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-sm text-center">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="min-w-0 flex-1">
          {/* Header Line on Mobile: Category (+ Agotado badge) and Mobile Quick Trash Button */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate">
                {item.product.category}
              </span>
              {itemIsAgotado && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-[9px] font-bold tracking-wider uppercase shrink-0">
                  Agotado
                </span>
              )}
            </div>

            {/* Mobile-only trash button in top-right corner for perfect symmetry */}
            <button 
              onClick={() => removeItem(item.id)}
              className="sm:hidden w-7 h-7 rounded-full bg-black/[0.03] dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 border border-black/[0.04] dark:border-white/10 shadow-2xs flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0 -mt-0.5"
              title="Eliminar producto"
              aria-label="Eliminar producto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product Title */}
          <h4 
            onClick={() => { setIsOpen(false); router.push(`/product/${item.productId || item.product.id}`); }}
            className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-1 mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
            title={item.product.title}
          >
            {item.product.title}
          </h4>

          {/* Symmetrical Attribute Badges (Color & Talla) - No dangling orphan bullets */}
          {(item.color || item.size) && (
            <div className="flex items-center flex-wrap gap-1.5 mt-1">
              {item.color && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/10 text-[10.5px] text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                  <span 
                    className="w-2 h-2 rounded-full border border-black/10 dark:border-white/20 shrink-0" 
                    style={{ backgroundColor: item.product.colors?.find(c => c.name.toLowerCase() === item.color?.toLowerCase())?.hex || '#9ca3af' }} 
                  />
                  <span className="truncate max-w-[120px]">{item.color}</span>
                </span>
              )}
              {item.size && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/10 text-[10.5px] text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                  <span className="text-gray-400 dark:text-gray-500 font-normal">Talla:</span>
                  <span className="font-semibold truncate max-w-[120px]">{item.size}</span>
                </span>
              )}
            </div>
          )}

          {/* Unit Price and Quick View Link */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap sm:hidden">
              ${Number(item.product?.price || 0).toFixed(2)} <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">c/u</span>
            </span>

            <button
              onClick={() => { setIsOpen(false); router.push(`/product/${item.productId || item.product.id}`); }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100/90 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-100 border border-black/[0.05] dark:border-white/10 text-[10.5px] font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Abrir y ver ficha del producto"
            >
              <Eye className="w-3 h-3 text-gray-400 hover:text-blue-600 transition-colors" />
              <span>Ver ficha</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Mobile Bottom Controls Row + Desktop Grid Columns (Product 5 cols, Quantity 3 cols, Subtotal 3 cols, Delete 1 col) */}
      <div className="flex items-center justify-between gap-3 pt-2.5 mt-0.5 border-t border-gray-100 dark:border-white/5 sm:border-t-0 sm:pt-0 sm:mt-0 sm:contents">
        {/* Quantity Stepper (3 cols on sm+) */}
        <div className="sm:col-span-3 flex sm:justify-center items-center shrink-0">
          <div className="flex items-center gap-1.5 sm:block">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 sm:hidden">Cant:</span>
            <BeUIAdaptiveStepper
              value={item.quantity}
              min={1}
              max={liveStock !== undefined && liveStock > 0 ? liveStock : 10}
              onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
              onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
              disableIncrement={itemIsAgotado || isMaxStockReached}
              size="sm"
              decrementTitle="Disminuir"
              incrementTitle={
                itemIsAgotado
                  ? "Producto sin existencias"
                  : isMaxStockReached
                  ? `Máximo stock disponible (${liveStock} uds.)`
                  : "Aumentar"
              }
            />
          </div>
        </div>

        {/* Subtotal Price (3 cols on sm+) */}
        <div className="sm:col-span-3 sm:text-right flex items-center sm:block sm:pr-4 ml-auto sm:ml-0 shrink-0">
          <div className="text-right">
            <span className="text-[9.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider sm:hidden block leading-none mb-0.5">
              Subtotal
            </span>
            <BeUIRollingPrice
              amount={Number(item.product?.price || 0) * (item.quantity || 1)}
              className="font-extrabold text-sm sm:text-lg text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Desktop Circular Glass Delete Button (1 col on sm+, hidden on mobile because it's in the top right) */}
        <div className="hidden sm:flex sm:col-span-1 justify-end items-center sm:text-right shrink-0">
          <button 
            onClick={() => removeItem(item.id)}
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 hover:bg-rose-50/90 dark:hover:bg-rose-950/30 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 border border-black/[0.06] dark:border-white/15 shadow-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer sm:ml-auto"
            title="Eliminar producto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
  })}
  </div>

  {/* Bottom Actions Row */}
  <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
  <button 
  onClick={() => { setIsOpen(false); router.push("/shop"); }}
  className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-950 bg-white/80 dark:bg-white/5 hover:bg-white border border-black/[0.06] dark:border-white/10 shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
  >
  <ArrowLeft className="w-3.5 h-3.5" /> Continuar Comprando
  </button>
  <span className="text-xs text-gray-400 dark:text-gray-400 font-medium text-center sm:text-right">
  {items.length === 1 
  ? "1 producto listo para despacho" 
  : `${items.length} productos listos para despacho`}
  </span>
  </div>

 </div>

 {/* ---------------------------------------------------- */}
 {/* Right Column: Order Summary Card (4 cols - Luxury Pearl Card) */}
 {/* ---------------------------------------------------- */}
  <div className="lg:col-span-4 bg-white/95 dark:bg-[#1e1e22]/95 sm:backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/15 p-4 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.04)] space-y-5 sm:space-y-6">
  
    {/* Header with Item Counter */}
    <div className="flex items-center justify-between pb-3.5 border-b border-gray-200 dark:border-white/15">
      <h3 className="font-display font-bold text-lg sm:text-xl text-gray-950 dark:text-white tracking-tight">
        Resumen del Pedido
      </h3>
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
        {items.length} {items.length === 1 ? "artículo" : "artículos"}
      </span>
    </div>

    {/* Free Shipping Progress Capsule */}
    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-gray-200 dark:border-white/15 space-y-2.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">
            {hasFreeShipping ? "¡Envío gratuito asegurado!" : `Faltan $${amountToFreeShipping.toFixed(2)} para envío gratis`}
          </span>
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">{freeShippingProgress}%</span>
      </div>
      <div className="w-full h-2 bg-black/[0.06] dark:bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
          style={{ width: `${freeShippingProgress}%` }}
        />
      </div>
    </div>

    {/* Coupon Code Form with Symmetrical Pill Input */}
    <div className="space-y-2">
      <form onSubmit={handleApplyCoupon} className="flex items-center gap-2 p-1.5 pl-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/20 shadow-xs focus-within:border-black/50 dark:focus-within:border-white/40 transition-all">
        <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <div className="relative flex-1 flex items-center">
          <input 
            type="text" 
            name="discount_code"
            value={couponInput}
            onChange={e => {
              setCouponInput(e.target.value.toUpperCase());
              if (couponFeedback) setCouponFeedback(null);
            }}
            placeholder="Código de descuento"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            className="w-full bg-transparent text-xs font-mono font-bold uppercase tracking-wider outline-none text-gray-900 dark:text-gray-100 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-xs placeholder-gray-400"
          />
        </div>
        <button 
          type="submit"
          disabled={isApplyingCoupon || !couponInput.trim()}
          className="px-4 py-2 rounded-xl font-sans font-bold text-xs text-white dark:text-gray-950 bg-gray-950 dark:bg-white hover:bg-black dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all shrink-0 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 min-w-[76px]"
        >
          {isApplyingCoupon ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Validando</span>
            </>
          ) : (
            <span>Aplicar</span>
          )}
        </button>
      </form>

      {couponFeedback && (
        <div className={clsx(
          "flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border animate-in fade-in slide-in-from-top-1 duration-200",
          couponFeedback.success 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
        )}>
          {couponFeedback.success ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{couponFeedback.msg}</span>
        </div>
      )}

      {couponCode && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 text-gray-800 dark:text-gray-200 text-xs font-medium border border-emerald-500/20 backdrop-blur-xs">
          <span className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              Cupón: <strong className="font-mono font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                {revealAppliedCoupon ? couponCode : maskCouponCode(couponCode)}
              </strong>
              {isFreeShippingCoupon ? " (Envío bonificado)" : ` (${discountPercent}% dto)`}
            </span>
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setRevealAppliedCoupon(!revealAppliedCoupon)}
              className="p-1 rounded-md hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
              title={revealAppliedCoupon ? "Ocultar código confidencial" : "Revelar código"}
              aria-label="Alternar visualización de cupón"
            >
              {revealAppliedCoupon ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
            <button 
              type="button"
              onClick={removeCoupon} 
              className="p-1 rounded-md hover:bg-rose-500/20 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Eliminar cupón"
              aria-label="Eliminar cupón"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Breakdown Lines Symmetrical Table */}
    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-white/15">
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <span>Subtotal</span>
        <BeUIRollingPrice
          amount={subtotal}
          suffix=" USD"
          className="font-mono font-bold text-gray-900 dark:text-gray-100"
        />
      </div>

      {discountAmount > 0 && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          <span>Descuento ({discountPercent}%)</span>
          <span className="font-mono font-bold">-${discountAmount.toFixed(2)} USD</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <span>Gastos de Envío</span>
        <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
          {shipping === 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold uppercase text-xs tracking-wider">GRATIS</span>
          ) : (
            `$${shipping.toFixed(2)} USD`
          )}
        </span>
      </div>

      {hasPriorityShipping && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium animate-fade-in">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FF5900]" />
            Prioridad de Despacho Inmediato
          </span>
          <span className="font-mono font-bold">+$2.15 USD</span>
        </div>
      )}

      <div className="pt-3.5 border-t border-gray-200 dark:border-white/15 flex items-baseline justify-between">
        <div>
          <span className="text-sm sm:text-base font-bold text-gray-950 dark:text-white block">Total a Pagar</span>
          <span className="text-[11px] text-gray-400">IVA e impuestos incluidos</span>
        </div>
        <div className="text-right flex items-baseline">
          <BeUIRollingPrice
            amount={finalTotal}
            className="font-sans font-extrabold text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight"
          />
          <span className="text-xs font-semibold text-gray-400 ml-1">USD</span>
        </div>
      </div>
    </div>

    {/* GodUI Slide Confirm Button: "Ir a pagar" -> "Preparando" -> "Listo, continúa..." */}
    <div className="pt-2 space-y-2">
      <div className="w-full">
        <SlideConfirmButton
          label={hasAgotadoItems ? "Elimina piezas agotadas" : "Ir a pagar"}
          loadingLabel="Preparando..."
          confirmedLabel="Listo, continúa..."
          disabled={hasAgotadoItems}
          size="lg"
          className="w-full shadow-sm"
          onConfirm={async () => {
            await new Promise((resolve) => setTimeout(resolve, 600));
          }}
          confirmedDurationMs={1000}
          onConfirmed={() => {
            handleProceedToPayment();
          }}
        />
      </div>

      {!isAuthenticated && !hasAgotadoItems && (
        <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 font-medium pt-1">
          Tus productos se guardarán intactos en tu cuenta al iniciar sesión o registrarte.
        </p>
      )}
    </div>

  </div>

 </div>
 )}
 </>
 )}

 {/* ======================================================================= */}
 {/* STEP 2: PAYMENT METHOD & SHIPPING VIEW (Spacious & Interactive) */}
  {/* ======================================================================= */}
  {step === "payment" && (
  <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-8 sm:pb-12">
  
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 dark:border-white/15 pb-4">
    <div>
      <button 
        onClick={() => setStep("bag")}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 shadow-2xs hover:shadow-xs transition-all mb-2.5 cursor-pointer group"
      >
        <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
          <ArrowLeft className="w-3 h-3 text-gray-700 dark:text-gray-300" />
        </div>
        <span>Volver a la Bolsa</span>
      </button>
      <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight">
        Método de Pago y Entrega
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Configura tu dirección y selecciona tu tarjeta para continuar.
      </p>
    </div>

    {/* Quick Top Indicator for Desktop */}
    <div className="hidden sm:flex items-center gap-3.5 bg-stone-50 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/10 px-4 py-2.5 rounded-2xl shadow-2xs">
      <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center text-xs font-bold shadow-xs">
        {items.length}
      </div>
      <div className="text-right">
        <span className="text-[10px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500 block">
          Inversión Total
        </span>
        <span className="text-sm font-extrabold font-mono text-gray-900 dark:text-white">
          ${finalTotal.toFixed(2)} <span className="text-[10px] font-bold text-[#FF5900]">USD</span>
        </span>
      </div>
    </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">
  
  {/* Left Column (7 cols): Shipping Address & Payment Gateway Forms */}
  <div className="lg:col-span-7 space-y-6">
  
  {/* Shipping Address */}
  <div id="cart-address-section" className="p-5 sm:p-7 rounded-[2rem] bg-white/95 dark:bg-[#18181b]/95 sm:backdrop-blur-xl border border-gray-200 dark:border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
          Dirección de Entrega
        </h4>
        {addresses.length > 0 && (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-black/[0.06] dark:border-white/10 shrink-0">
            {addresses.length}/4
          </span>
        )}
      </div>
      {isEditingAddress ? (
        <button 
          onClick={() => {
            setLocationError(null);
            setLocationSuccess(false);
            setShowMiniMap(false);
            setIsEditingAddress(false);
          }}
          className="px-3.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 transition-all cursor-pointer"
        >
          Cancelar
        </button>
      ) : addresses.length < 4 ? (
        <button 
          onClick={() => {
            setIsEditingAddress(true);
            setAddrRecipient(user?.name || "");
            setAddrStreet("");
            setAddrCity("");
            setAddrPostal("");
            setAddrState("");
            setAddrCountry("Ecuador");
          }}
          className="px-3.5 py-1.5 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-xs font-bold hover:opacity-90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir</span>
        </button>
      ) : (
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
          Límite (4 máx.)
        </span>
      )}
    </div>

    {isEditingAddress ? (
      <form onSubmit={handleSaveAddress} className="space-y-3.5 pt-1">
        <div className="pb-2 border-b border-black/[0.06] dark:border-white/5">
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
            Nueva Dirección de Entrega
          </span>
        </div>

        {/* Geolocation Auto-fill Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2.5 border transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed bg-black/[0.02] dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 border-black/[0.08] dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-[0.99]"
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-700 dark:text-gray-300" />
                <span>Detectando ubicación real del dispositivo...</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <Navigation className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                </div>
                <span>Autocompletar con mi ubicación actual</span>
              </>
            )}
          </button>

          {locationError && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-2.5 mt-2 leading-tight">
              {locationError}
            </p>
          )}

          {locationSuccess && (
            <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 mt-2 leading-tight flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>¡Ubicación detectada! Revisa los campos y escribe quién recibe.</span>
            </p>
          )}

          {/* Mini-map: ONLY appears after clicking "Autocompletar con mi ubicación actual" */}
          <AnimatePresence>
            {showMiniMap && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden mt-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8c9276]" />
                    <span>Ubicación Exacta en Mapa</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    Pin activo
                  </span>
                </div>
                <InteractiveAddressMap
                  initialLat={addrDetectedCoords?.lat || -0.1807}
                  initialLng={addrDetectedCoords?.lng || -78.4678}
                  onLocationSelect={(lat, lng) => setAddrDetectedCoords({ lat, lng })}
                  onAddressResolved={(addr) => {
                    const cleanStreet = (addr.street || "").replace(/^(?:calle\s+)?s\/?n$/i, "").trim();
                    if (cleanStreet) setAddrStreet(cleanStreet);
                    if (addr.exteriorNumber) setAddrExteriorNumber(addr.exteriorNumber);
                    if (addr.neighborhood) setAddrNeighborhood(addr.neighborhood);
                    if (addr.crossStreets) setAddrCrossStreets(addr.crossStreets);
                    if (addr.city) setAddrCity(addr.city);
                    if (addr.state) setAddrState(addr.state);
                    if (addr.postalCode) setAddrPostal(addr.postalCode);
                    if (addr.country) setAddrCountry(addr.country);
                  }}
                  className="h-56 w-full rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/10 shadow-sm"
                />
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5">
                  Arrastra el pin azul a tu ubicación exacta. Esto asegurará la precisión de las entregas.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative flex py-1 items-center mt-2">
          <div className="flex-grow border-t border-black/[0.06] dark:border-white/10"></div>
          <span className="flex-shrink mx-3 text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">o ingresa los datos manualmente</span>
          <div className="flex-grow border-t border-black/[0.06] dark:border-white/10"></div>
        </div>

        <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-2">Campos Obligatorios</h4>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
            ¿Quién recibe? (Nombre y apellidos)
          </label>
          <input 
            type="text" 
            value={addrRecipient} 
            onChange={e => setAddrRecipient(e.target.value)} 
            placeholder={user?.name || "Ej: Juan Pérez"}
            className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Cédula / Identificación
            </label>
            <input 
              type="text" 
              required
              value={addrIdNumber} 
              onChange={e => setAddrIdNumber(e.target.value)} 
              placeholder="Ej: 1712345678"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Número con WhatsApp
            </label>
            <input 
              type="tel" 
              required
              value={addrPhone} 
              onChange={e => setAddrPhone(e.target.value)} 
              placeholder="Ej: +593 99 123 4567"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Calle Principal</label>
            <input 
              type="text" 
              value={addrStreet} 
              onChange={e => setAddrStreet(e.target.value)} 
              placeholder="Av. 12 de Octubre"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Número Ext.</label>
            <input 
              type="text" 
              value={addrExteriorNumber} 
              onChange={e => setAddrExteriorNumber(e.target.value)} 
              placeholder="N34"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
            <input 
              type="text" 
              value={addrCity} 
              onChange={e => setAddrCity(e.target.value)} 
              placeholder="Quito"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Provincia/Estado</label>
            <input 
              type="text" 
              value={addrState} 
              onChange={e => setAddrState(e.target.value)} 
              placeholder="Pichincha"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
            <input 
              type="text" 
              value={addrPostal} 
              onChange={e => setAddrPostal(e.target.value)} 
              placeholder="170150"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">País</label>
            <input 
              type="text" 
              value={addrCountry} 
              onChange={e => setAddrCountry(e.target.value)} 
              placeholder="Ecuador"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
        </div>

        <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-4 pt-2 border-t border-black/[0.06] dark:border-white/10">Campos Opcionales</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Propiedad</label>
            <select
              value={addrAddressType}
              onChange={e => setAddrAddressType(e.target.value as 'casa' | 'departamento' | 'oficina')}
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 transition-all"
            >
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="oficina">Oficina</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Número Interior/Depto</label>
            <input 
              type="text"
              value={addrInteriorNumber} 
              onChange={e => setAddrInteriorNumber(e.target.value)} 
              placeholder="Apto 4B"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Calles Intersección</label>
          <input 
            type="text"
            value={addrCrossStreets} 
            onChange={e => setAddrCrossStreets(e.target.value)} 
            placeholder="y Lincoln"
            className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Sector / Barrio</label>
          <input 
            type="text"
            value={addrNeighborhood} 
            onChange={e => setAddrNeighborhood(e.target.value)} 
            placeholder="Ej: La Carolina"
            className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Instrucciones de Entrega</label>
          <input 
            type="text"
            value={addrDeliveryInstructions} 
            onChange={e => setAddrDeliveryInstructions(e.target.value)} 
            placeholder="Ej: Dejar en portería"
            className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-gray-700 dark:text-gray-300">
            <input 
              type="checkbox"
              checked={addrHasElevator}
              onChange={e => setAddrHasElevator(e.target.checked)}
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            Tiene ascensor
          </label>
          
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Piso</label>
            <input 
              type="text" 
              value={addrFloorLevel} 
              onChange={e => setAddrFloorLevel(e.target.value)} 
              placeholder="Ej: 4" 
              className="w-full px-4 py-2 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        {addressValidationError && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{addressValidationError}</span>
          </div>
        )}

        <div className="flex gap-2.5 pt-4">
          <button 
            type="button"
            disabled={isSavingAddress}
            onClick={() => {
              setIsEditingAddress(false);
              setAddressValidationError(null);
            }}
            className="w-1/3 py-2.5 px-4 bg-black/[0.04] dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold hover:bg-black/[0.08] dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isSavingAddress}
            className="w-2/3 py-2.5 px-4 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-2xs active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSavingAddress ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Dirección</span>
            )}
          </button>
        </div>
      </form>
    ) : addresses.length > 0 ? (
      <div className="space-y-3">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Selecciona la dirección para este envío:
        </p>
        <div className="space-y-2.5">
          {addresses.map((addr) => {
            const isSelected = address?.id 
              ? address.id === addr.id 
              : (address?.street === addr.street && address?.postalCode === addr.postalCode) || (addresses.length === 1);

            return (
              <div
                key={addr.id}
                onClick={() => setAddress(addr)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 select-none ${
                  isSelected
                    ? "bg-[#FAF8F5] dark:bg-[#202022] border-black/30 dark:border-white/30 shadow-xs ring-1 ring-black/10 dark:ring-white/10"
                    : "bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.06]"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected 
                      ? "border-[#18181b] dark:border-white bg-[#18181b] dark:bg-white text-white dark:text-[#18181b]" 
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2c]"
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#18181b]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                        {formatCleanName(addr.recipient || user?.name || "Destinatario")}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/10 shrink-0">
                          Predeterminada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate mt-0.5">
                      {addr.street}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {addr.city}{addr.state ? `, ${addr.state}` : ""}, {addr.postalCode} • {addr.country}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ) : address ? (
      <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-xs text-gray-900 dark:text-gray-100">
              {formatCleanName(address.recipient || user?.name || "Destinatario")}
            </p>
            {address.isDefault && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/10 shrink-0">
                Predeterminada
              </span>
            )}
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-0.5">{address.street}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {address.city}{address.state ? `, ${address.state}` : ""}, {address.postalCode} • {address.country}
          </p>
        </div>
        <div className="w-6 h-6 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-2xs">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>
    ) : (
      <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 text-center space-y-3">
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Aún no has configurado tu dirección de entrega.</p>
        <button 
          onClick={() => {
            setIsEditingAddress(true);
            setAddrRecipient(user?.name || "");
            setAddrStreet("");
            setAddrCity("");
            setAddrPostal("");
            setAddrState("");
            setAddrCountry("Ecuador");
          }}
          className="px-4 py-2 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full text-xs font-bold cursor-pointer hover:opacity-90 transition-all shadow-2xs"
        >
          + Añadir Dirección Ahora
        </button>
      </div>
    )}
  </div>

  {/* Unified PayPhone Embedded Gateway */}
  <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-5 font-sans antialiased text-left">
    
    {/* 1. PAYMENT CONFIGURATION HEADER */}
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-sans">
          Elige tu forma de pago
        </span>
        <button 
          type="button"
          onClick={() => {
            setIsEditingAddress(true);
            const addrElem = document.getElementById("cart-address-section");
            if (addrElem) addrElem.scrollIntoView({ behavior: "smooth" });
          }}
          className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white underline underline-offset-2 transition-colors cursor-pointer font-sans"
        >
          Editar dirección
        </button>
      </div>
    </div>

    {/* 2. METHOD SELECTION */}
    <div className="pt-1">
      <h4 className="font-sans font-bold text-xs sm:text-sm text-gray-900 dark:text-white mb-2.5">
        Selecciona método de pago
      </h4>

      {/* Method Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tab 1: Tarjetas (1st left separator only + enlarged Discover logo) */}
        <button
          type="button"
          onClick={() => setSelectedPayMethod("card")}
          className={`h-12 sm:h-[52px] px-1.5 sm:px-2 rounded-xl transition-all cursor-pointer w-full grid grid-cols-6 items-center justify-items-center ${
            selectedPayMethod === "card"
              ? "border-2 border-[#FF5900] bg-white dark:bg-[#202022] shadow-sm"
              : "border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-[#18181b]"
          }`}
        >
          {/* 1st Slot: Card Icon + ONLY left separator */}
          <div className="w-full h-6 flex items-center justify-center px-1 border-r border-gray-200/80 dark:border-white/15">
            <svg className={`w-4 sm:w-[18px] h-3.5 shrink-0 ${selectedPayMethod === "card" ? "text-[#FF5900]" : "text-gray-400"}`} viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="18" height="12" rx="2" />
              <line x1="1" y1="5" x2="19" y2="5" />
              <circle cx="5" cy="9.5" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <div className="w-full h-6 flex items-center justify-center px-1">
            <VisaLogo className="h-[19px] sm:h-[21px] w-auto max-w-full object-contain" fill="#1A1F71" />
          </div>
          <div className="w-full h-6 flex items-center justify-center px-1">
            <MastercardLogo className="h-[17px] sm:h-[18px] w-auto max-w-full object-contain" />
          </div>
          <div className="w-full h-6 flex items-center justify-center px-1">
            <DinersClubLogo className="h-3.5 sm:h-4 w-auto max-w-full object-contain" />
          </div>
          <div className="w-full h-6 flex items-center justify-center px-0.5">
            <DiscoverLogo className="h-3.5 sm:h-4 w-auto max-w-full object-contain" />
          </div>
          <div className="w-full h-6 flex items-center justify-center px-1">
            <AmexLogo className="h-3.5 sm:h-4 w-auto max-w-full object-contain" />
          </div>
        </button>

        {/* Tab 2: PayPhone App */}
        <button
          type="button"
          onClick={() => setSelectedPayMethod("app")}
          className={`h-12 sm:h-[52px] px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            selectedPayMethod === "app"
              ? "border-2 border-[#FF5900] bg-white dark:bg-[#202022] shadow-sm"
              : "border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-[#18181b]"
          }`}
        >
          <PayPhoneIcon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-bold text-xs sm:text-sm text-[#FF5900] tracking-tight">PayPhone</span>
            <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded-md bg-[#FF5900]/10 text-[#FF5900]">App</span>
          </div>
        </button>
      </div>
    </div>

        {/* Method 1: Card Checkout (Default) */}
        {selectedPayMethod === "card" ? (
          <div className="pt-2 space-y-4 font-sans">
            <div className="w-full flex justify-center overflow-x-clip sm:overflow-visible py-1">
              <div className="origin-top scale-[0.82] min-[390px]:scale-[0.92] min-[435px]:scale-100 -my-6 min-[435px]:my-0 transition-transform">
                <Wallet3D
                  cards={userWallet3DCards}
                  selectedCardId={selectedSavedCardId}
                  onSelectCard={handleSelectWallet3DCard}
                />
              </div>
            </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF5900] animate-pulse shrink-0" />
            <h4 className="font-sans font-bold text-xs sm:text-sm text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">
              Datos de Tarjeta Bancaria
            </h4>
          </div>
          {selectedSavedCardId !== "new" ? (
            <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 w-fit">
              <CheckCircle2 className="w-3 h-3" /> Tarjeta vinculada activa
            </span>
          ) : (
            <span className="text-[10px] font-mono font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 w-fit">
              <Lock className="w-3 h-3 text-[#FF5900]" /> Cifrado TLS 256-Bit
            </span>
          )}
        </div>

        {/* High-Ticket Double-Bezel Card Console with Physical Embossed Typography */}
        <div id="cart-payment-fields" className="p-1.5 sm:p-2 rounded-[1.75rem] bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.07] dark:ring-white/10 shadow-[0_6px_28px_rgba(0,0,0,0.02)]">
          <div className="rounded-[calc(1.75rem-0.375rem)] border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#141416] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
            {/* Row 1: Card Number + Live Brand Badge */}
            <div className="px-4 py-3.5 flex items-center justify-between gap-3 bg-gradient-to-b from-transparent to-black/[0.01] dark:to-white/[0.01]">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CreditCard className="w-4 h-4 text-[#FF5900] shrink-0" />
                <input 
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={(e) => {
                    setSelectedSavedCardId("new");
                    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                    setCardNumber(formatted);
                  }}
                  placeholder="0000 0000 0000 0000"
                  className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-950 dark:text-white placeholder:text-gray-400 font-['OCR_A_Std','OCR-A','Share_Tech_Mono','Courier_New',monospace] tracking-[0.2em] font-bold uppercase tabular-nums"
                />
              </div>
              <div className="shrink-0 flex items-center">
                {cardNumber.replace(/\s/g, "").length >= 1 ? (
                  <div className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 flex items-center justify-center">
                    <NetworkBrandLogo network={resolveCardNetwork(undefined, cardNumber)} compact monochrome="black" />
                  </div>
                ) : (
                  <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                    Crédito / Débito
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: MM/AA + CVV */}
            <div className="grid grid-cols-2 divide-x divide-black/[0.06] dark:divide-white/10">
              <div className="flex items-center px-4 py-3.5 gap-2.5">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={cardExpiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2)}`;
                    setCardExpiry(val);
                  }}
                  placeholder="MM/AA"
                  maxLength={5}
                  className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-950 dark:text-white placeholder:text-gray-400 font-['OCR_A_Std','OCR-A','Share_Tech_Mono','Courier_New',monospace] tracking-[0.18em] font-bold uppercase tabular-nums"
                />
              </div>
              <div className="flex items-center px-4 py-3.5 gap-2.5">
                <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="CVV"
                  maxLength={4}
                  className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-950 dark:text-white placeholder:text-gray-400 font-['OCR_A_Std','OCR-A','Share_Tech_Mono','Courier_New',monospace] tracking-[0.22em] font-bold uppercase tabular-nums"
                />
              </div>
            </div>

            {/* Row 3: Cardholder Name */}
            <div className="flex items-center px-4 py-3.5 gap-2.5">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                type="text"
                autoComplete="cc-name"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="NOMBRE DEL TITULAR"
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-950 dark:text-white placeholder:text-gray-400 font-['OCR_A_Std','OCR-A','Share_Tech_Mono','Courier_New',monospace] tracking-[0.16em] font-bold uppercase"
              />
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-sans font-bold text-xs sm:text-sm text-gray-900 dark:text-white uppercase tracking-wider">
            Cuenta PayPhone
          </h4>
          {payphoneAppPhone.replace(/\D/g, "").length === 10 && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Número válido
            </span>
          )}
        </div>

        {/* Enhanced Phone Input Console */}
        <div className="p-1.5 sm:p-2 rounded-[1.75rem] bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.07] dark:ring-white/10 shadow-[0_6px_28px_rgba(0,0,0,0.02)]">
          <div className="rounded-[calc(1.75rem-0.375rem)] border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#141416] flex items-center px-4 py-3.5 gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] focus-within:ring-2 focus-within:ring-[#FF5900]/25 focus-within:border-[#FF5900]/40 transition-all">
            {/* Country code pill */}
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-black/[0.08] dark:border-white/10 shrink-0">
              <span className="text-sm">🇪🇨</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">+593</span>
            </div>

            <Phone className="w-4 h-4 text-[#FF5900] shrink-0" />

            <input 
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={payphoneAppPhone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                let formatted = digits;
                if (digits.length > 6) {
                  formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
                } else if (digits.length > 3) {
                  formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
                }
                setPayphoneAppPhone(formatted);
              }}
              placeholder="099 123 4567"
              maxLength={12}
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-950 dark:text-white placeholder:text-gray-400 font-mono tracking-wider font-semibold"
            />

            {/* Digit counter indicator */}
            <span className="text-[10px] font-mono font-medium text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
              {payphoneAppPhone.replace(/\D/g, "").length}/10
            </span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-sans px-1">
          Al presionar pagar, recibirás una solicitud de autorización directa en tu app PayPhone o podrás debitar de tu saldo disponible.
        </p>
      </div>
    )}

    {/* Hidden Live PayPhone script mount container if live box mode is loaded */}
    <div id="pp-button" className="hidden" />
  </div>

  </div>

  {/* Right Column (5 cols, sticky on lg): Order Items Breakdown + Financial Ledger + Action Button */}
  <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-4">
    {/* 1. Mini Items Review Card */}
    <div className="p-4 sm:p-5 rounded-[1.75rem] bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/15 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/10">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#8c9276]" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
            Resumen de Artículos ({items.length})
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setStep("bag")}
          className="text-[11px] font-semibold text-[#8c9276] hover:underline cursor-pointer"
        >
          Editar
        </button>
      </div>

      <div className="relative">
        <div 
          ref={summaryScrollRef}
          onWheel={(e) => {
            if (summaryScrollRef.current && cartScrollRef.current) {
              const el = summaryScrollRef.current;
              const isScrollable = el.scrollHeight > el.clientHeight;
              const atTop = el.scrollTop <= 0 && e.deltaY < 0;
              const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2 && e.deltaY > 0;
              if (!isScrollable || atTop || atBottom) {
                cartScrollRef.current.scrollTop += e.deltaY;
              }
            }
          }}
          className="max-h-48 overflow-y-auto space-y-2.5 pr-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shrink-0">
                  <Image 
                    src={item.product?.imageUrl || (item.product?.images && item.product.images[0]) || "/placeholder.jpg"} 
                    alt={item.product?.title || "Producto"} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[11.5px]">
                    {item.isBundle ? (item.bundleName || "Pack Promocional") : item.product?.title}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    Cant: {item.quantity} {item.color ? `· ${item.color}` : ""}
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-gray-900 dark:text-white shrink-0 text-xs">
                ${((item.bundleCustomPrice ?? item.product?.price ?? 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <MacOSScrollbar containerRef={summaryScrollRef} insetTop={0} insetBottom={0} insetRight={-6} />
      </div>
    </div>

    {/* 2. Strategic Upsell: Prioridad de Envío del Paquete (+$2.15 USD) */}
    <div 
      onClick={() => setHasPriorityShipping(!hasPriorityShipping)}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
        hasPriorityShipping
          ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 shadow-[0_4px_16px_rgba(245,158,11,0.12)]"
          : "bg-white dark:bg-[#18181b] border-gray-200 dark:border-white/10 hover:border-amber-500/30 shadow-xs"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          hasPriorityShipping 
            ? "bg-gradient-to-tr from-amber-500 to-[#FF6611] text-white shadow-xs" 
            : "bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400"
        }`}>
          <Zap className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-sans font-bold text-xs sm:text-[13px] text-gray-950 dark:text-white">
              Prioridad de envío del paquete
            </span>
            <span className="font-mono font-extrabold text-[11px] text-[#FF5900] bg-[#FF5900]/10 px-1.5 py-0.5 rounded">
              +$2.15 USD
            </span>
          </div>
          <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-tight truncate">
            Tu pedido se procesa y empaca en el 1er turno para salida inmediata
          </p>
        </div>
      </div>

      {/* iOS-Style Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={hasPriorityShipping}
        onClick={(e) => {
          e.stopPropagation();
          setHasPriorityShipping(!hasPriorityShipping);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          hasPriorityShipping ? "bg-[#FF5900]" : "bg-gray-300 dark:bg-gray-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            hasPriorityShipping ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>

    {/* 3. High-Ticket Financial Ledger Summary */}
    <div className="p-4 sm:p-5 rounded-[1.75rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 space-y-2.5">
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Subtotal de selección</span>
        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">USD {getSubtotal().toFixed(2)}</span>
      </div>
      {getDiscountAmount() > 0 && (
        <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Cupón {couponCode ? `(${couponCode})` : ""}
          </span>
          <span className="font-mono font-bold">-USD {getDiscountAmount().toFixed(2)}</span>
        </div>
      )}
      {hasPriorityShipping && (
        <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium animate-fade-in">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FF5900]" />
            Prioridad de Envío del Paquete
          </span>
          <span className="font-mono font-bold">+$2.15 USD</span>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#8c9276]" />
          Empaque de Colección & Protección
        </span>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-500/20">
          Cortesía
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8c9276]" />
          Seguro de Tránsito Puerta a Puerta
        </span>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-500/20">
          Incluido
        </span>
      </div>
      <div className="pt-2.5 border-t border-black/[0.06] dark:border-white/10 flex items-baseline justify-between">
        <div>
          <span className="font-sans font-bold text-sm sm:text-base text-gray-950 dark:text-white block">
            Inversión Total
          </span>
          <span className="text-[10.5px] text-gray-400 dark:text-gray-500">
            Impuestos y cargos bancarios incluidos
          </span>
        </div>
        <div className="text-right">
          <span className="font-sans font-extrabold text-xl sm:text-2xl text-gray-950 dark:text-white tracking-tight">
            ${finalTotal.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-[#FF5900] ml-1.5 font-mono">USD</span>
        </div>
      </div>
    </div>

    {/* PayPhone Error Notification if any */}
    {payphoneError && (
      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-shake">
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold font-sans">Error al procesar el pago</p>
          <p className="text-[11px] leading-relaxed font-sans">{payphoneError}</p>
        </div>
      </div>
    )}

    {/* Action Button: Dynamic "Pagar con [Brand]" Button Restored to commit 6b82237 */}
    <div className="pt-2 flex flex-col items-center justify-center gap-2">
      <button
        type="button"
        onClick={handleTriggerPaymentWithAnimation}
        disabled={isProcessing || !isPaymentFieldsValid || !hasShippingAddress}
        className={`relative w-full max-w-[270px] sm:max-w-[295px] h-14 sm:h-15 py-3.5 px-6 rounded-2xl bg-gradient-to-b from-[#FF6611] to-[#EA5200] text-white font-sans font-bold text-base sm:text-[17px] tracking-wide transition-all duration-200 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.45),0_10px_28px_rgba(234,82,0,0.32)] flex items-center justify-center select-none mx-auto ${
          !isPaymentFieldsValid || !hasShippingAddress
            ? "opacity-55 cursor-not-allowed shadow-none"
            : "hover:from-[#FF7322] hover:to-[#DD4800] active:scale-[0.98] hover:shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.55),0_14px_36px_rgba(234,82,0,0.42)] cursor-pointer"
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2.5">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            <span className="font-semibold text-sm">Procesando...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>Pagar con</span>
            {selectedPayMethod === "app" ? (
              <PayPhoneIcon className="w-6 h-6 rounded-md shadow-xs shrink-0" />
            ) : (
              <div className="inline-flex items-center shrink-0">
                {detectedCardBrand === "visa" && (
                  <VisaMono variant="mono" className="h-8 w-13 sm:h-8.5 sm:w-15 object-contain text-black fill-black shrink-0" />
                )}
                {detectedCardBrand === "mastercard" && (
                  <MastercardMono variant="mono" className="h-7 w-7 object-contain text-black fill-black shrink-0" />
                )}
                {detectedCardBrand === "amex" && (
                  <AmericanExpressMono variant="mono" className="h-7 w-7 object-contain text-black fill-black shrink-0" />
                )}
                {detectedCardBrand === "diners" && (
                  <DinersClubMono variant="mono" className="h-7 w-7 object-contain text-black fill-black shrink-0" />
                )}
                {detectedCardBrand === "discover" && (
                  <DiscoverMono variant="mono" className="h-7 w-10 object-contain text-black fill-black shrink-0" />
                )}
              </div>
            )}
          </div>
        )}
      </button>

      {/* Helper text explaining what field is pending */}
      {checkoutPendingReason && !isProcessing && (
        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1.5 pt-0.5 px-3 max-w-xs mx-auto animate-fade-in">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{checkoutPendingReason}</span>
        </p>
      )}
    </div>

    {/* Trust & Security Badges Row (100% Vectorized & Standardized) */}
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-2">
      <VerifiedByVisaLogo />
      <MastercardSecureCodeLogo />
      <PciDssLogo />
      <PoweredByPayphoneLogo />
    </div>

    {/* Footer Security Assurance: Concise & reassuring */}
    <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center leading-relaxed pt-1.5 font-sans max-w-sm mx-auto">
      Pago seguro cifrado con TLS 1.3 y certificación PCI-DSS. No almacenamos tus datos bancarios.
    </p>

  </div>

  </div>
  </div>
  )}

  {/* ======================================================================= */}
  {/* STEP 3: ORDER CONFIRMED RECEIPT 3D PRINTER (Centered)                  */}
  {/* ======================================================================= */}
  {step === "success" && lastPlacedOrder && (
    <div className="w-full flex flex-col items-center justify-center py-2 sm:py-6 animate-fade-in pb-12 sm:pb-16">
      <PaymentConfirmationReceipt
        orderId={lastPlacedOrder.id}
        amount={`$${Number(lastPlacedOrder.total || 0).toFixed(2)}`}
        currency="USD"
        dateText={
          lastPlacedOrder.date ||
          new Intl.DateTimeFormat("es-EC", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }).format(new Date())
        }
        customerName={formatCleanName(
          lastPlacedOrder.customerName ||
            lastPlacedOrder.recipient ||
            user?.name ||
            "Cliente Lumina"
        )}
        shippingLocation={`${
          lastPlacedOrder.shippingAddress?.city || address?.city || "Quito"
        }${
          lastPlacedOrder.shippingAddress?.state || address?.state
            ? `, ${lastPlacedOrder.shippingAddress?.state || address?.state}`
            : ""
        } · ${
          lastPlacedOrder.shippingAddress?.country ||
          address?.country ||
          "Ecuador"
        }`}
        itemSummary={
          lastPlacedOrder.items && lastPlacedOrder.items.length > 0
            ? lastPlacedOrder.items.length === 1
              ? `${
                  lastPlacedOrder.items[0].isBundle
                    ? lastPlacedOrder.items[0].bundleName || "Pack Promocional"
                    : lastPlacedOrder.items[0].product?.title || "Artículo"
                } (x${lastPlacedOrder.items[0].quantity})`
              : `${
                  lastPlacedOrder.items[0].isBundle
                    ? lastPlacedOrder.items[0].bundleName || "Pack Promocional"
                    : lastPlacedOrder.items[0].product?.title || "Artículo"
                } (+${lastPlacedOrder.items.length - 1} más)`
            : "Colección Lumina"
        }
        cardNetwork={cardNetworkForReceipt}
        cardLast4={lastPlacedCardLast4 || receiptLast4}
        paymentMethodType={lastPlacedPaymentType}
        payphonePhone={payphoneAppPhone}
        googleWalletPassUrl={`${
          typeof window !== "undefined"
            ? window.location.origin
            : "https://luminahome.ec"
        }/api/wallet/pass?type=order&orderId=${encodeURIComponent(
          lastPlacedOrder.id
        )}&total=${encodeURIComponent(
          String(lastPlacedOrder.total || 0)
        )}&status=${encodeURIComponent(
          lastPlacedOrder.status || "Procesando"
        )}&customer=${encodeURIComponent(
          lastPlacedOrder.customerName || user?.name || "Cliente Lumina"
        )}&date=${encodeURIComponent(lastPlacedOrder.date || "Reciente")}`}
        onAddToGoogleWallet={() => setWalletPopupPlatform("google")}
        onViewOrderInProfile={() => {
          setIsOpen(false);
          router.push("/profile");
        }}
        onContinueShopping={() => {
          setIsOpen(false);
          setStep("bag");
        }}
      />

      {/* In-Page Wallet Pass Popup Modal (No external tab!) */}
      <WalletPassPopupModal
        open={walletPopupPlatform !== null}
        onClose={() => setWalletPopupPlatform(null)}
        orderId={lastPlacedOrder.id}
        total={lastPlacedOrder.total}
        status={lastPlacedOrder.status}
        customerName={
          lastPlacedOrder.customerName || user?.name || "Cliente Lumina"
        }
        trackingNumber={lastPlacedOrder.trackingNumber}
        trackingUrl={lastPlacedOrder.trackingUrl}
        carrierName={lastPlacedOrder.carrierName}
        date={lastPlacedOrder.date}
        initialPlatform="google"
      />
    </div>
  )}

  </div>

  {/* Authentic macOS Sequoia Floating Overlay Scrollbar with Hooke's Law Rebound Physics */}
  <MacOSScrollbar containerRef={cartScrollRef} insetTop={76} insetBottom={28} />
  </motion.div>



      </div>
    )}
  </AnimatePresence>
);
}
