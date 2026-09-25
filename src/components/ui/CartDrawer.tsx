"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { BeUIAdaptiveStepper, BeUIRollingPrice, BeUIAnimatedCtaButton, BeUITiltCard } from "./BeUIControls";
import { WalletPassPopupModal } from "./WalletPassPopupModal";
import InteractiveAddressMap from "./InteractiveAddressMap";
import { playStepperTickSound } from "@/lib/soundUtils";
import { 
 X, 
 Minus, 
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
 Trash2,
 RotateCcw,
  CreditCard,
  Navigation,
  Loader2,
  AlertTriangle,
  Package,
  Eye,
  Calendar,
  User,
  Phone,
  Wallet,
  QrCode,
  Bell,
  ExternalLink,
  Lock
} from "lucide-react";
import { playEnvelopeSound } from "./CardFolder";
import { useCartStore } from "@/lib/store";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
import { clsx } from "clsx";
import { useUserStore, Order, formatCleanName } from "@/lib/userStore";
import { useCatalogStore, isAgotadoBadge } from "@/lib/catalogStore";
import { getRefinedCoordinates, type RawGpsHardwareData } from "@/lib/locationUtils";

// Official Card & Payment Gateway Logos (Authentic Vector Brandmarks from theSVG.org + PayPhone Official)
function MastercardLogo({ className = "h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>Mastercard</title>
      <path d="M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031z" fill="#EB001B"/>
      <path d="M16.584 4.584c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416z" fill="#F79E1B"/>
      <path d="M12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08-.184-.156-.28-.231z" fill="#FF5F00"/>
    </svg>
  );
}

function VisaLogo({ className = "h-4", fill = "#1A1F71" }: { className?: string; fill?: string }) {
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
      src="/images/payphone-icon.png"
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

  // PayPhone Ecuador Exclusive Gateway State (Admin Configured: "box" | "redirect")
  const [, setPayphoneMode] = useState<"box" | "redirect">("box");
  const [, setIsPayphoneConfigured] = useState(false);
  const [isPayphoneSimulated, setIsPayphoneSimulated] = useState(true);
  const [, setIsBoxScriptLoaded] = useState(false);
  const [, setIsBoxRendered] = useState(false);

  // PayPhone Simulation Modal (Modo Preparación / RUC en trámite)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payphoneSimData, setPayphoneSimData] = useState<any>(null);
  const [isPayPhoneSimOpen, setIsPayPhoneSimOpen] = useState(false);
  const [isSimulatingApproval, setIsSimulatingApproval] = useState(false);
  const [payphoneError, setPayphoneError] = useState<string | null>(null);

  // PayPhone Embedded Form Interactive State (Official In-Page Checkout Presentation)
  const [selectedPayMethod, setSelectedPayMethod] = useState<"card" | "app">("card");
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string>("new");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState(user?.name || "");
  const [payphoneAppPhone, setPayphoneAppPhone] = useState("");
  const [walletAddedPlatform, setWalletAddedPlatform] = useState<"apple" | "google" | null>(null);

  // Auto-select default saved card if user has saved cards in their account
  useEffect(() => {
    if (cards && cards.length > 0 && selectedSavedCardId === "new" && !cardNumber) {
      const defCard = cards.find((c) => c.isDefault) || cards[0];
      if (defCard) {
        const last4 = defCard.number.replace(/\D/g, "").slice(-4) || "4242";
        const prefix = defCard.type === "mastercard" ? "5412 7500 8899" : "4532 8910 2233";
        setSelectedSavedCardId(defCard.id);
        setCardNumber(`${prefix} ${last4}`);
        setCardExpiry(defCard.exp || "12/29");
        setCardHolder(defCard.holder || user?.name || "CLIENTE LUMINA");
        setCardCvv("888");
      }
    }
  }, [cards, selectedSavedCardId, cardNumber, user?.name]);

  const [isMiniWalletOpen, setIsMiniWalletOpen] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [walletPopupPlatform, setWalletPopupPlatform] = useState<"apple" | "google" | null>(null);

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
    const found = cards?.find((c) => c.id === cardId);
    if (found) {
      const last4 = found.number.replace(/\D/g, "").slice(-4) || "4242";
      const prefix = found.type === "mastercard" ? "5412 7500 8899" : "4532 8910 2233";
      setCardNumber(`${prefix} ${last4}`);
      setCardExpiry(found.exp || "12/29");
      setCardHolder(found.holder || user?.name || "CLIENTE LUMINA");
      setCardCvv("888");
    }
  };

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
  const [addrDetectedRawGps, setAddrDetectedRawGps] = useState<RawGpsHardwareData | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Checkout Processing
  const [isProcessing, setIsProcessing] = useState(false);

 const { mode } = useThemeStore();
 const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

 useEffect(() => {
 const update = () => setResolvedTheme(getResolvedTheme(mode));
 update();
 const interval = setInterval(update, 60000);
 return () => clearInterval(interval);
 }, [mode]);
 const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

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
 const finalTotal = getTotal();

 // Free shipping threshold progress ($100 target)
 const FREE_SHIPPING_TARGET = 100;
 const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_TARGET) * 100));
 const amountToFreeShipping = Math.max(0, FREE_SHIPPING_TARGET - subtotal);
 const hasFreeShipping = subtotal >= FREE_SHIPPING_TARGET || isFreeShippingCoupon;

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    setCouponFeedback({ msg: res.message, success: res.success });
    if (res.success) {
      setCouponInput("");
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
        if (detStreet) setAddrStreet(detStreet);
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
 if (!addrStreet.trim() || !addrCity.trim() || !addrPostal.trim() || !addrState.trim() || !addrCountry.trim()) return;
 if (addresses.length >= 4) {
 setIsEditingAddress(false);
 return;
 }
 await addAddress({
 recipient: addrRecipient.trim() || user?.name || "Destinatario",
 idNumber: addrIdNumber.trim() || undefined,
 phone: addrPhone.trim() || undefined,
 email: addrEmail.trim() || user?.email || undefined,
 street: addrStreet.trim(),
 exteriorNumber: addrExteriorNumber.trim() || undefined,
 neighborhood: addrNeighborhood.trim() || undefined,
 interiorNumber: addrInteriorNumber.trim() || undefined,
 crossStreets: addrCrossStreets.trim() || undefined,
 addressType: addrAddressType,
 deliveryInstructions: addrDeliveryInstructions.trim() || undefined,
 hasElevator: addrHasElevator,
 floorLevel: addrFloorLevel.trim() || undefined,
 label: addrLabel.trim() || undefined,
 city: addrCity.trim(),
 state: addrState.trim(),
 postalCode: addrPostal.trim(),
 country: addrCountry.trim(),
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
 });
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
 setIsEditingAddress(false);
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
          couponCode: couponCode || undefined,
          clientClaimedTotal: finalTotal
        })
      });

      const data = await res.json();
      setIsProcessing(false);

      if (!res.ok || !data.success) {
        setPayphoneError(data.error || "No se pudo preparar la pasarela de pagos de PayPhone.");
        return;
      }

      if (data.isSimulated) {
        // Open interactive test simulator modal (RUC pending)
        setPayphoneSimData({
          paymentId: data.paymentId,
          clientTransactionId: data.clientTransactionId,
          orderId,
          total: data.verifiedTotal || finalTotal,
          shippingAddr,
          customerEmail,
          customerName,
          recipientName,
          items: [...items]
        });
        setIsPayPhoneSimOpen(true);
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
    handleConfirmOrder();
  };

  const handleApprovePayPhoneSimulation = async () => {
    if (!payphoneSimData) return;
    setIsSimulatingApproval(true);
    setPayphoneError(null);
    try {
      const res = await fetch("/api/payphone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payphoneSimData.paymentId,
          clientTxId: payphoneSimData.clientTransactionId,
          orderData: {
            orderId: payphoneSimData.orderId,
            total: payphoneSimData.total,
            items: payphoneSimData.items,
            customerName: payphoneSimData.customerName,
            customerEmail: payphoneSimData.customerEmail,
            recipient: payphoneSimData.recipientName,
            customerIdNumber: payphoneSimData.shippingAddr?.idNumber || addrIdNumber.trim() || undefined,
            customerPhone: payphoneSimData.shippingAddr?.phone || addrPhone.trim() || undefined,
            shippingAddress: payphoneSimData.shippingAddr ? {
              recipient: payphoneSimData.recipientName,
              idNumber: payphoneSimData.shippingAddr.idNumber,
              phone: payphoneSimData.shippingAddr.phone,
              email: payphoneSimData.customerEmail,
              street: payphoneSimData.shippingAddr.street,
              exteriorNumber: payphoneSimData.shippingAddr.exteriorNumber,
              neighborhood: payphoneSimData.shippingAddr.neighborhood,
              interiorNumber: payphoneSimData.shippingAddr.interiorNumber,
              crossStreets: payphoneSimData.shippingAddr.crossStreets,
              addressType: payphoneSimData.shippingAddr.addressType,
              deliveryInstructions: payphoneSimData.shippingAddr.deliveryInstructions,
              hasElevator: payphoneSimData.shippingAddr.hasElevator,
              floorLevel: payphoneSimData.shippingAddr.floorLevel,
              label: payphoneSimData.shippingAddr.label,
              city: payphoneSimData.shippingAddr.city,
              state: payphoneSimData.shippingAddr.state,
              postalCode: payphoneSimData.shippingAddr.postalCode,
              country: payphoneSimData.shippingAddr.country
            } : (addrStreet ? {
              recipient: payphoneSimData.recipientName,
              idNumber: addrIdNumber.trim() || undefined,
              phone: addrPhone.trim() || undefined,
              email: payphoneSimData.customerEmail,
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

      const data = await res.json();
      setIsSimulatingApproval(false);
      setIsPayPhoneSimOpen(false);

      if (res.ok && data.success && data.order) {
        addOrder(data.order);
        setLastPlacedOrder(data.order);
        clearCart();
        setStep("success");
      } else {
        setPayphoneError(data.error || "No se pudo confirmar la transacción simulada de PayPhone.");
      }
    } catch {
      setIsSimulatingApproval(false);
      setPayphoneError("Error de conexión al confirmar la simulación con PayPhone.");
    }
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
      scale: 0.1,
      x: startX * 0.72,
      y: startY * 0.72,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.34,
        ease: [0.16, 1, 0.3, 1],
      }
    },
    exit: {
      opacity: 0,
      scale: 0.1,
      x: startX * 0.72,
      y: startY * 0.72,
      transition: {
        duration: 0.24,
        ease: [0.32, 0, 0.67, 0],
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={clsx("fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden", resolvedTheme === 'dark' ? 'dark' : '')}>
          {/* Backdrop with Deep Soft Blur (Lightweight GPU Fill) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ willChange: "opacity" }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transform-gpu"
            onClick={() => setIsOpen(false)}
          />

          {/* LUXURY CART CANVAS - INSTANT & FLUID */}
          <motion.div
            variants={cartModalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ willChange: "transform, opacity" }}
            className="relative w-full max-w-6xl h-full max-h-[96vh] sm:max-h-[92vh] bg-white/95 dark:bg-[#202022]/95 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] border border-white/90 dark:border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden z-10 transform-gpu"
          >

  {/* Top Bar Header */}
  <header className="px-4 sm:px-8 py-3.5 sm:py-4 bg-white dark:bg-[#2a2a2c]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 shrink-0 shadow-sm dark:shadow-none">
 
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

    {/* Close Button on Mobile (visible only < sm) */}
    <button 
      onClick={() => setIsOpen(false)}
      className="sm:hidden w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
      title="Cerrar bolsa"
    >
      <X className="w-4 h-4" />
    </button>
  </div>

  {/* Center Step Indicator (2IXO Pill Dock with pure GPU beUI spring pill) - Sits below title on mobile */}
  <div className="flex items-center justify-center w-full sm:w-auto">
    <div className="relative grid grid-cols-2 items-center bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-full border border-black/[0.04] dark:border-white/10 backdrop-blur-xl w-full sm:w-auto min-w-[270px] sm:min-w-[300px]">
      {/* Pure GPU CSS Spring Pill Indicator */}
      <div
        style={{
          transform: step === "bag" ? "translate3d(0%, 0, 0)" : "translate3d(100%, 0, 0)",
          transition: "transform 480ms cubic-bezier(0.22, 1.35, 0.36, 1)",
        }}
        className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-[#27272a] shadow-[0_2px_10px_rgba(0,0,0,0.09)] z-0"
      />
      <button 
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
        onClick={() => {
          if (items.length > 0) {
            handleProceedToPayment();
          }
        }}
        disabled={items.length === 0}
        className={`relative z-10 text-center px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap active:scale-95 ${
          step === "payment" 
            ? "text-gray-950 dark:text-white" 
            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        2. Pasarela de Pago
      </button>
    </div>
  </div>

  {/* Right Action: 2IXO Circular Glass Close Button (Desktop sm:flex) */}
  <div className="hidden sm:flex items-center gap-3">
    <button 
      onClick={() => setIsOpen(false)}
      className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
      title="Cerrar bolsa"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
</header>

  {/* ========================================================================= */}
  {/* MAIN CANVAS SCROLLABLE AREA */}
  {/* ========================================================================= */}
  <div className={`flex-1 overflow-y-auto ${
    items.length === 0 && step === "bag"
      ? "p-3.5 sm:px-6 sm:pb-6 sm:pt-2.5 lg:px-10 lg:pb-10 lg:pt-3"
      : "p-3.5 sm:p-6 lg:p-10"
  } hide-scrollbar space-y-6 sm:space-y-10`}>

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
  <div className="relative overflow-hidden my-2 sm:my-2.5 sm:mt-1 rounded-[2.5rem] p-8 sm:p-10 lg:p-12 border border-black/[0.04] dark:border-white/10 bg-gradient-to-b from-white/95 via-[#faf8f4] to-[#f2eee7] dark:from-[#222226] dark:via-[#1c1c1f] dark:to-[#161619] shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur-2xl text-center flex flex-col items-center justify-center">
    {/* 3D Radial Champagne Aura */}
    <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-amber-500/[0.08] via-[#8c9276]/[0.08] to-amber-400/[0.06] blur-3xl pointer-events-none" />
    <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/15 to-transparent pointer-events-none" />

    {/* 3D Floating Bag Pedestal */}
    <div className="relative mb-8 group cursor-default">
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 h-8 bg-black/[0.06] dark:bg-white/[0.06] rounded-full blur-md" />
      
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-white via-[#faf7f2] to-[#eee8dd] dark:from-[#2a2a2e] dark:via-[#222226] dark:to-[#1a1a1e] border-2 border-white dark:border-white/20 shadow-[0_16px_36px_rgba(0,0,0,0.06)] flex items-center justify-center transition-transform duration-500 hover:scale-105">
        <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-800 dark:text-gray-100 stroke-[1.5]" />
      </div>
    </div>

    {/* 2IXO Circular Action Feature Discs */}
    <div className="grid grid-cols-3 gap-3 sm:gap-10 max-w-xs sm:max-w-sm mx-auto mb-8">
      <div className="flex flex-col items-center group">
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 aspect-square min-w-[48px] min-h-[48px] rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <Package className="w-5 h-5 text-gray-700 dark:text-gray-200 shrink-0" />
        </div>
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-2 text-center whitespace-nowrap">Logística</span>
      </div>
      <div className="flex flex-col items-center group">
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 aspect-square min-w-[48px] min-h-[48px] rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <Truck className="w-5 h-5 text-gray-700 dark:text-gray-200 shrink-0" />
        </div>
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-2 text-center whitespace-nowrap">Despacho</span>
      </div>
      <div className="flex flex-col items-center group">
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 aspect-square min-w-[48px] min-h-[48px] rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <Navigation className="w-5 h-5 text-gray-700 dark:text-gray-200 shrink-0" />
        </div>
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-2 text-center whitespace-nowrap">Envío</span>
      </div>
    </div>

    <h3 className="font-display font-bold text-2xl sm:text-3xl text-gray-950 dark:text-white mb-2 tracking-tight">
      Tu bolsa de compras está vacía
    </h3>
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-7">
      <span className="font-semibold text-gray-800 dark:text-gray-200">Dato curioso:</span> Una luz cálida (2700K) reduce el estrés visual y mejora el descanso un 40%.
    </p>

    {/* 2IXO Dock Capsule CTA Button */}
    <button 
      onClick={() => { setIsOpen(false); router.push("/shop"); }}
      className="group relative overflow-hidden rounded-full bg-[#18181b] dark:bg-white text-white dark:text-gray-950 pl-3 pr-6 py-3.5 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-[0_12px_32px_rgba(0,0,0,0.15)] hover:bg-black dark:hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
    >
      <div className="w-8 h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center text-white dark:text-gray-950 group-hover:translate-x-0.5 transition-transform shrink-0">
        <ArrowRight className="w-4 h-4" />
      </div>
      <span>Explorar Catálogo Lumina</span>
    </button>
  </div>
  ) : (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
 
 {/* ---------------------------------------------------- */}
 {/* Left Column: Spacious Products Table (7 or 8 cols) */}
 {/* ---------------------------------------------------- */}
 <div className="lg:col-span-8 bg-white dark:bg-[#2a2a2c]/80 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-gray-200 dark:border-white/10/60 p-4 sm:p-8 shadow-sm dark:shadow-none space-y-6">
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
 <div className="hidden sm:grid grid-cols-12 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-white/5 px-3.5 sm:px-4 items-center">
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
        className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-[#1e1e20] dark:to-[#1a1a1c] shadow-sm space-y-4 transition-all"
      >
        {/* Bundle Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-500/15">
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
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
            {bundleProducts.length} {bundleProducts.length === 1 ? "pieza incluida" : "piezas incluidas"}
          </span>
        </div>

        {/* List of products inside this bundle card */}
        <div className="space-y-2.5">
          {bundleProducts.map((bp, bpIdx) => (
            <div 
              key={`${bp.id}-${bpIdx}`}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-[#252528] border border-gray-100 dark:border-white/5 shadow-2xs group/bitem"
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
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    {bp.color && <span>Color: {bp.color}</span>}
                    {bp.color && bp.size && <span>•</span>}
                    {bp.size && <span>Talla: {bp.size}</span>}
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
 className={`p-3.5 sm:p-4 flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 sm:items-center group transition-all rounded-2xl ${
 itemIsAgotado 
 ? "bg-red-50/40 border border-red-200/80 shadow-xs" 
 : "border border-gray-100/80 dark:border-white/5 sm:border-transparent bg-gray-50/40 sm:bg-transparent dark:bg-white/[0.02] sm:dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#151515]/50 hover:border-gray-100 dark:hover:border-white/5/80"
 }`}
 >
  {/* Product Info (5 cols) */}
  <div className="sm:col-span-5 flex items-start sm:items-center gap-3.5 sm:gap-4">
    <div 
      onClick={() => { setIsOpen(false); router.push(`/product/${item.productId || item.product.id}`); }}
      className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#202022]/5 shrink-0 border border-black/5 dark:border-white/10 shadow-xs cursor-pointer group/thumb"
      title="Abrir detalles del producto"
    >
      <Image 
        src={item.product.imageUrl} 
        alt={item.product.title} 
        fill 
        sizes="(max-width: 640px) 80px, 88px"
        className="object-cover group-hover/thumb:scale-105 transition-transform duration-500" 
      />
      {itemIsAgotado && (
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center p-1">
          <span className="bg-red-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm text-center">
            Agotado
          </span>
        </div>
      )}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
          {item.product.category}
        </span>
        {itemIsAgotado && (
          <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-[9px] font-bold tracking-wider uppercase">
            Agotado
          </span>
        )}
      </div>

      <h4 
        onClick={() => { setIsOpen(false); router.push(`/product/${item.productId || item.product.id}`); }}
        className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-1 mt-0.5 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
        title={item.product.title}
      >
        {item.product.title}
      </h4>

      {/* Detalles estilizados y compactos (no bultosos) */}
      {(item.color || item.size) && (
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          {item.color && (
            <span className="inline-flex items-center gap-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/20 shrink-0" 
                style={{ backgroundColor: item.product.colors?.find(c => c.name.toLowerCase() === item.color?.toLowerCase())?.hex || '#9ca3af' }} 
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">{item.color}</span>
            </span>
          )}
          {item.color && item.size && <span className="text-gray-300 dark:text-gray-600 font-light">•</span>}
          {item.size && (
            <span className="inline-flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
              <span className="text-gray-400 dark:text-gray-500 font-normal">Talla:</span>
              <span className="font-semibold">{item.size}</span>
            </span>
          )}
        </div>
      )}

      {/* Botón para abrir el producto y precio unitario móvil */}
      <div className="flex items-center gap-2.5 mt-2">
        <button
          onClick={() => { setIsOpen(false); router.push(`/product/${item.productId || item.product.id}`); }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100/80 hover:bg-gray-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 border border-black/[0.04] dark:border-white/10 text-[11px] font-semibold transition-all cursor-pointer group/open active:scale-95"
          title="Abrir y ver ficha del producto"
        >
          <Eye className="w-3 h-3 text-gray-400 group-hover/open:text-blue-600 dark:group-hover/open:text-blue-400 transition-colors" />
          <span>Ver producto</span>
        </button>

        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:hidden">
          • ${Number(item.product?.price || 0).toFixed(2)} c/u
        </span>
      </div>
    </div>
  </div>

  {/* Unified Mobile Bottom Controls Row + Desktop Grid Columns (Product 5 cols, Quantity 3 cols, Subtotal 3 cols, Delete 1 col) */}
  <div className="flex items-center justify-between gap-2 pt-2.5 mt-0.5 border-t border-gray-200/60 dark:border-white/10 sm:border-t-0 sm:pt-0 sm:mt-0 sm:contents">
    {/* Quantity Capsule with beUI Adaptive Stepper (3 cols on sm+) */}
    <div className="sm:col-span-3 flex sm:justify-center items-center shrink-0">
      <BeUIAdaptiveStepper
        value={item.quantity}
        min={1}
        max={liveStock !== undefined && liveStock > 0 ? liveStock : 10}
        onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
        onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
        disableIncrement={itemIsAgotado || isMaxStockReached}
        size="md"
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

    {/* Subtotal Price with beUI Rolling Ticker (3 cols on sm+) */}
    <div className="sm:col-span-3 sm:text-right flex items-center gap-1.5 sm:block sm:pr-4 ml-auto sm:ml-0">
      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-400 sm:hidden">Subtotal:</span>
      <BeUIRollingPrice
        amount={Number(item.product?.price || 0) * (item.quantity || 1)}
        className="font-extrabold text-sm sm:text-lg text-gray-900 dark:text-gray-100"
      />
    </div>

    {/* 2IXO CIRCULAR GLASS DELETE BUTTON (1 col on sm+) */}
    <div className="sm:col-span-1 flex justify-end items-center sm:text-right shrink-0">
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
 <div className="lg:col-span-4 bg-white/80 dark:bg-[#1e1e22]/90 backdrop-blur-2xl rounded-3xl border border-black/[0.06] dark:border-white/10 p-5 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.03)] space-y-6">
  
    {/* Header with Item Counter */}
    <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.06] dark:border-white/10">
      <h3 className="font-display font-bold text-lg sm:text-xl text-gray-950 dark:text-white tracking-tight">
        Resumen del Pedido
      </h3>
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/10 text-gray-700 dark:text-gray-300">
        {items.length} {items.length === 1 ? "artículo" : "artículos"}
      </span>
    </div>

    {/* Free Shipping Progress Capsule */}
    <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/5 space-y-2.5">
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
      <form onSubmit={handleApplyCoupon} className="flex items-center gap-2 p-1.5 pl-4 rounded-2xl bg-white/90 dark:bg-white/5 border border-black/[0.06] dark:border-white/15 shadow-xs focus-within:border-black/25 dark:focus-within:border-white/30 transition-all">
        <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input 
          type="text" 
          value={couponInput}
          onChange={e => setCouponInput(e.target.value)}
          placeholder="Código de descuento"
          className="w-full bg-transparent text-xs font-medium outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
        <button 
          type="submit"
          className="px-4 py-2 rounded-xl font-sans font-bold text-xs text-white dark:text-gray-950 bg-gray-950 dark:bg-white hover:bg-black dark:hover:bg-gray-100 shadow-xs transition-all shrink-0 active:scale-95 cursor-pointer"
        >
          Aplicar
        </button>
      </form>

      {couponFeedback && (
        <p className={`text-xs font-semibold px-2 ${couponFeedback.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {couponFeedback.msg}
        </p>
      )}

      {couponCode && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-500/10 text-gray-800 dark:text-gray-200 text-xs font-medium border border-emerald-500/20">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Cupón: <strong className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{couponCode}</strong> ({discountPercent}% dto)</span>
          </span>
          <button 
            onClick={removeCoupon} 
            className="w-5 h-5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
            title="Eliminar cupón"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>

    {/* Breakdown Lines Symmetrical Table */}
    <div className="space-y-3 pt-2 border-t border-black/[0.05] dark:border-white/10">
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

      <div className="pt-3.5 border-t border-black/[0.06] dark:border-white/10 flex items-baseline justify-between">
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

    {/* @beui/animated-cta-button Full-Width Price -> "Proceder al pago" on Hover */}
    <div className="pt-2 space-y-2">
      <div className="w-full">
        <BeUIAnimatedCtaButton
          onClick={handleProceedToPayment}
          disabled={hasAgotadoItems}
          subLabel={
            hasAgotadoItems
              ? "Acción Requerida"
              : !isAuthenticated
                ? "Total a Pagar"
                : "Total a Pagar"
          }
          label={
            hasAgotadoItems
              ? "Elimina piezas agotadas"
              : `$${finalTotal.toFixed(2)} USD`
          }
          hoverLabel={
            hasAgotadoItems
              ? "Revisa tu bolsa"
              : !isAuthenticated
                ? "Iniciar Sesión para Pagar"
                : "Proceder al pago"
          }
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

 {/* Recommended Pieces Row (Craft Own Furniture Section) */}
 {recommendedProducts.length > 0 && (
 <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-display font-bold text-xl text-gray-900 dark:text-gray-100 ">
 Piezas que complementan tu pedido
 </h3>
 <p className="text-xs text-gray-500 dark:text-gray-400">Diseñadas para armonizar en iluminación y estética.</p>
 </div>
 <button 
 onClick={() => { setIsOpen(false); router.push("/shop"); }}
 className="text-xs font-semibold text-blue-600 hover:underline"
 >
 Ver catálogo completo &rarr;
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {recommendedProducts.map(prod => (
 <div 
 key={prod.id}
 onClick={() => { setIsOpen(false); router.push(`/product/${prod.id}`); }}
 className="p-4 rounded-2xl bg-white dark:bg-[#2a2a2c]/70 hover:bg-white dark:hover:bg-[#2c2c2e] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all cursor-pointer flex items-center gap-3.5 group"
 >
 <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#202022]/5 shrink-0">
 <Image src={prod.imageUrl} alt={prod.title} fill sizes="64px" className="object-cover group-hover:scale-105 transition-transform" />
 </div>
 <div className="min-w-0">
 <h5 className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 transition-colors">
 {prod.title}
 </h5>
 <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5">{prod.category}</p>
 <span className="font-extrabold text-xs text-gray-900 dark:text-gray-100 mt-1 block">
 ${Number(prod.price || 0).toFixed(2)}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </>
 )}

 {/* ======================================================================= */}
 {/* STEP 2: PAYMENT METHOD & SHIPPING VIEW (Spacious & Interactive) */}
  {/* ======================================================================= */}
  {step === "payment" && (
  <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
  
  <div className="border-b border-black/[0.06] dark:border-white/5 pb-4">
    <button 
      onClick={() => setStep("bag")}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 shadow-2xs hover:shadow-xs transition-all mb-3 cursor-pointer group"
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
      Configura tu dirección y autoriza tu pedido.
    </p>
  </div>

  <div className="max-w-xl mx-auto space-y-6">
  
  {/* Shipping Address */}
  <div id="cart-address-section" className="p-5 sm:p-7 rounded-[2rem] bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white">
          <MapPin className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Dirección de Entrega</h4>
        {addresses.length > 0 && (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-black/[0.06] dark:border-white/10">
            {addresses.length}/4
          </span>
        )}
      </div>
      {isEditingAddress ? (
        <button 
          onClick={() => setIsEditingAddress(false)}
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
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/5">
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
            Nueva Dirección de Entrega
          </span>
          <button 
            type="button" 
            onClick={() => {
              setLocationError(null);
              setLocationSuccess(false);
              setIsEditingAddress(false);
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
          >
            Cancelar
          </button>
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

          <div className="mt-4">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              Ubicación Exacta en Mapa
            </label>
            <InteractiveAddressMap
              initialLat={addrDetectedCoords?.lat || -0.1807}
              initialLng={addrDetectedCoords?.lng || -78.4678}
              onLocationSelect={(lat, lng) => setAddrDetectedCoords({ lat, lng })}
              onAddressResolved={(addr) => {
                if (addr.street) setAddrStreet(addr.street);
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
          </div>
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

        <div className="flex gap-2.5 pt-4">
          <button 
            type="button"
            onClick={() => setIsEditingAddress(false)}
            className="w-1/3 py-2.5 px-4 bg-black/[0.04] dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold hover:bg-black/[0.08] dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="w-2/3 py-2.5 px-4 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
          >
            Guardar Dirección
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
          Editar datos
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
            <VisaLogo className="h-3 sm:h-3.5 w-auto max-w-full object-contain" fill="#1A1F71" />
          </div>
          <div className="w-full h-6 flex items-center justify-center px-1">
            <MastercardLogo className="h-3.5 sm:h-4 w-auto max-w-full object-contain" />
          </div>
          <div className="w-full h-6 flex items-center justify-center px-1">
            <DinersClubLogo className="h-3 sm:h-3.5 w-auto max-w-full object-contain" />
          </div>
          <div className="w-full h-6 flex items-center justify-center px-0.5">
            <DiscoverLogo className="h-4 sm:h-[18px] w-auto max-w-full object-contain scale-110" />
          </div>
          <div className="w-full h-6 flex items-center justify-center px-1">
            <AmexLogo className="h-3 sm:h-3.5 w-auto max-w-full object-contain" />
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

    {/* 4. CARD OR APP INPUT FORM */}
    {selectedPayMethod === "card" ? (
      <div className="pt-2 space-y-3.5">
        {/* ===================================================================== */}
        {/* BLUE WALLET SLEEVE ("LUMINA VAULT") RECOVERED FROM COMMIT 6d0fea6     */}
        {/* ===================================================================== */}
        <div className="pt-1 space-y-4 font-sans">
          {/* 1. Sleek Compact Header Bar (Modern & Refined) */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-[#202022] border border-slate-200/70 dark:border-white/10 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center shadow-xs shrink-0">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-xs text-gray-900 dark:text-gray-100 tracking-tight">
                  Mis Tarjetas
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-[#2a2a2c] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 shadow-2xs">
                  {(cards || []).length} disponibles
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/profile?tab=cards&addCard=true");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2a2a2c] hover:bg-gray-50 dark:hover:bg-[#151515] text-gray-800 dark:text-gray-200 text-[11px] font-semibold transition-all border border-gray-200 dark:border-white/10 shadow-2xs hover:shadow-xs hover:border-gray-300 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-gray-700 dark:text-gray-300" />
              <span>Nueva tarjeta</span>
            </button>
          </div>

          {!cards || cards.length === 0 ? (
            <div className="p-8 rounded-3xl bg-gray-50/80 dark:bg-[#202022] border-2 border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center justify-center space-y-3 font-sans my-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#2a2a2c] shadow-sm flex items-center justify-center text-gray-400">
                <CreditCard className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Sin tarjetas guardadas</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                  Aún no tienes métodos de pago registrados en tu cuenta. Agrega una tarjeta desde tu perfil para pagar al instante.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/profile?tab=cards&addCard=true");
                }}
                className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:scale-105 transition-all shadow-md cursor-pointer"
              >
                + Añadir Tarjeta a mi Cuenta
              </button>
            </div>
          ) : (
            (() => {
              const activeCard =
                cards.find((c) => c.id === selectedSavedCardId) || cards[0] || null;
              const orderedCards = activeCard
                ? [...cards.filter((c) => c.id !== activeCard.id), activeCard]
                : cards;

              return (
                <>
                  {/* 2. THE BLUE WALLET SLEEVE ("EMPAQUE AZUL / BOLSITA") - 100% CLICK-ONLY */}
                  <div className="relative w-full max-w-[370px] mx-auto pt-16 pb-2 select-none">
                    {/* Background Base of Wallet Pocket with bottom-only rounded clipPath */}
                    <div
                      onClick={() => {
                        const nextState = !isMiniWalletOpen;
                        playEnvelopeSound(nextState ? "open" : "close");
                        setIsMiniWalletOpen(nextState);
                        setHoveredCardId(null);
                      }}
                      className="relative w-full h-[155px] rounded-3xl bg-gradient-to-b from-[#080e1c] via-[#0b1426] to-[#060a13] border border-slate-800/50 shadow-[0_12px_28px_-6px_rgba(15,23,42,0.18),0_4px_12px_-2px_rgba(15,23,42,0.08)] overflow-visible cursor-pointer"
                      style={{
                        clipPath: "inset(-350px -12px 0px -12px round 0px 0px 1.5rem 1.5rem)",
                      }}
                    >
                      {/* Inner Shadow & Leather texture depth */}
                      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top,rgba(30,58,138,0.25),transparent_70%)] pointer-events-none" />

                      {/* The Layered Cards Rising Upwards with 1-finger separation (approx 24px) */}
                      {orderedCards.map((card, idx) => {
                        let theme = {
                          bg: "bg-gradient-to-tr from-[#0a192f] via-[#10316b] to-[#0284c7]",
                          text: "text-white",
                          border: "border-blue-400/40",
                          shadow: "shadow-[0_12px_28px_rgba(2,132,199,0.3)]",
                          logoColor: "#FFFFFF",
                          name: "SAPPHIRE",
                        };

                        if (card.number.includes("4916")) {
                          theme = {
                            bg: "bg-gradient-to-tr from-[#ffffff] via-[#f1f5f9] to-[#e2e8f0]",
                            text: "text-slate-900",
                            border: "border-slate-200/90",
                            shadow: "shadow-[0_12px_28px_rgba(0,0,0,0.12)]",
                            logoColor: "#0f172a",
                            name: "PLATINUM",
                          };
                        } else if (card.number.includes("0019")) {
                          theme = {
                            bg: "bg-gradient-to-tr from-[#ea580c] via-[#f97316] to-[#ec4899]",
                            text: "text-white",
                            border: "border-orange-300/40",
                            shadow: "shadow-[0_12px_28px_rgba(234,88,12,0.3)]",
                            logoColor: "#FFFFFF",
                            name: "CORAL",
                          };
                        } else if (idx % 2 === 0) {
                          theme = {
                            bg: "bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#334155]",
                            text: "text-white",
                            border: "border-slate-600/50",
                            shadow: "shadow-[0_12px_28px_rgba(0,0,0,0.4)]",
                            logoColor: "#FFFFFF",
                            name: "OBSIDIAN",
                          };
                        }

                        const isSelected = activeCard ? card.id === activeCard.id : false;
                        const isCardHovered = isMiniWalletOpen && hoveredCardId === card.id;

                        // Calculate vertical offsets for 1-finger upward accordion stacking (24px separation)
                        const totalCards = orderedCards.length;
                        const depthFromFront = totalCards - 1 - idx;

                        // When closed: nested inside pocket
                        const closedY = 6 - depthFromFront * 5;
                        const closedScale = 1 - depthFromFront * 0.035;
                        const closedOpacity = 1 - depthFromFront * 0.12;

                        // When open: "un dedo de separación" (24px separation step)
                        const openY = -depthFromFront * 24;
                        const zIndex = 15 + idx * 5;

                        return (
                          <motion.div
                            key={card.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              playEnvelopeSound("close");
                              handleSelectSavedCard(card.id);
                              setHoveredCardId(null);
                            }}
                            onMouseEnter={() => {
                              if (isMiniWalletOpen) setHoveredCardId(card.id);
                            }}
                            onMouseLeave={() => {
                              if (hoveredCardId === card.id) setHoveredCardId(null);
                            }}
                            initial={false}
                            animate={{
                              y: isMiniWalletOpen ? openY : closedY,
                              scale: isMiniWalletOpen ? 1 : closedScale,
                              opacity: isMiniWalletOpen ? 1 : closedOpacity,
                              zIndex: zIndex,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 340,
                              damping: 28,
                              mass: 0.7,
                            }}
                            style={{ transformStyle: "preserve-3d" }}
                            className={`absolute left-[6%] w-[88%] h-[116px] rounded-2xl p-3 sm:p-3.5 ${theme.bg} ${theme.text} ${theme.shadow} flex flex-col justify-between cursor-pointer select-none border transition-all duration-200 overflow-hidden ${
                              isCardHovered
                                ? "border-sky-300 ring-2 ring-sky-400/80 shadow-[0_0_18px_rgba(56,189,248,0.5),0_8px_24px_rgba(0,0,0,0.3)] brightness-[1.05]"
                                : `${theme.border} ${
                                    isMiniWalletOpen
                                      ? "hover:border-sky-300 hover:ring-2 hover:ring-sky-400/70 hover:shadow-[0_0_16px_rgba(56,189,248,0.4)] hover:brightness-[1.04]"
                                      : ""
                                  }`
                            }`}
                          >
                            {/* Specular curved reflection glint */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                            <div
                              className={`absolute inset-[1px] rounded-[15px] border pointer-events-none transition-colors duration-200 ${
                                isCardHovered ? "border-sky-300/50" : "border-white/20"
                              }`}
                            />

                            {/* Top rim specular highlight on hover */}
                            <div
                              className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-300 to-transparent transition-opacity duration-200 pointer-events-none ${
                                isCardHovered ? "opacity-100" : "opacity-0"
                              }`}
                            />

                            {/* Top Row: Network & Status */}
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-1.5">
                                <span className="font-sans text-[10px] font-bold tracking-wider uppercase opacity-90">
                                  {theme.name}
                                </span>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <ContactlessIcon className="w-3.5 h-3.5 opacity-70" />
                                {card.type === "visa" ? (
                                  <VisaLogo className="h-3.5" fill={theme.logoColor} />
                                ) : (
                                  <MastercardLogo className="h-4" />
                                )}
                              </div>
                            </div>

                            {/* Card Number */}
                            <div className="relative z-10 mt-1">
                              <p className="font-mono font-bold text-sm sm:text-base tracking-[0.2em] drop-shadow-sm dark:shadow-none opacity-95">
                                {card.number}
                              </p>
                            </div>

                            {/* Bottom Row: Chip & Holder */}
                            <div className="flex items-end justify-between relative z-10 pt-1 border-t border-white/15 text-[9px] mt-auto">
                              <div className="flex items-center gap-2">
                                <div className="scale-75 origin-left">
                                  <EmvChip />
                                </div>
                                <span className="font-mono font-bold uppercase truncate max-w-[130px] opacity-90">
                                  {card.holder}
                                </span>
                              </div>
                              <span className="font-mono font-bold opacity-85">
                                {card.exp}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Front Flap Overlay of the Blue Wallet Sleeve */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextState = !isMiniWalletOpen;
                          playEnvelopeSound(nextState ? "open" : "close");
                          setIsMiniWalletOpen(nextState);
                          setHoveredCardId(null);
                        }}
                        className="absolute bottom-0 inset-x-0 h-[115px] rounded-b-3xl rounded-t-2xl bg-gradient-to-b from-[#0e172a]/95 via-[#0b1324]/98 to-[#060a12] border-t border-sky-400/30 border-x border-b border-slate-800/40 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.18),0_8px_20px_-4px_rgba(15,23,42,0.22)] backdrop-blur-xl p-3.5 flex flex-col justify-between cursor-pointer z-30 transition-all hover:border-sky-400/50 active:scale-[0.99]"
                      >
                        {/* Top Pocket Arc Lip & Specular Highlight */}
                        <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-300 to-transparent opacity-80" />
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-sky-400/30" />

                        {/* Wallet Sleeve Brand Label */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30">
                              <Lock className="w-3 h-3" />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-sky-100 tracking-[0.2em] uppercase">
                              LUMINA VAULT
                            </span>
                          </div>
                          <span className="font-sans text-[10px] font-semibold text-sky-300/90 bg-sky-950/70 px-2.5 py-0.5 rounded-full border border-sky-800/60 shadow-2xs">
                            {isMiniWalletOpen ? "Click para cerrar wallet" : "Click para abrir wallet"}
                          </span>
                        </div>

                        {/* Active Card Indicator on Front Flap */}
                        <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-mono text-[11px] font-semibold text-white tracking-wider">
                              {activeCard?.number ? activeCard.number.slice(-9) : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {activeCard?.type === "visa" ? (
                              <VisaLogo className="h-3" fill="#7dd3fc" />
                            ) : (
                              <MastercardLogo className="h-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. ACTIVE CARD INFORMATION PANEL ("Y ABAJO SALDRÁ PUES LA INFORMACIÓN DE LA TARJETA") */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#2a2a2c] border border-gray-200 dark:border-white/10 shadow-xs space-y-3 font-sans">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-sans font-bold text-xs text-gray-900 dark:text-gray-100">
                          {activeCard?.type === "visa"
                            ? "Tarjeta Visa Seleccionada"
                            : "Tarjeta Mastercard Seleccionada"}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        ✓ Lista para pagar
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">
                          Número
                        </span>
                        <p className="font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider">
                          {activeCard?.number || ""}
                        </p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">
                          Titular · Expira
                        </span>
                        <p className="font-mono font-bold text-gray-900 dark:text-gray-100 truncate">
                          {activeCard?.holder || ""} · {activeCard?.exp || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </div>

        <div className="flex items-center justify-between">
          <h4 className="font-sans font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
            Información de tarjeta
          </h4>
          {selectedSavedCardId !== "new" && (
            <span className="text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tarjeta vinculada seleccionada
            </span>
          )}
        </div>

        {/* Grouped 3-Row Input Container with Physical Credit Card Embossed Typography */}
        <div className="rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-[#141416] overflow-hidden divide-y divide-gray-300 dark:divide-white/15 shadow-xs">
          {/* Row 1: Card Number */}
          <div className="px-3.5 py-3 flex items-center gap-2.5">
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
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400/80 font-['OCR_A_Std','OCR-A','Share_Tech_Mono','Courier_New',monospace] tracking-[0.2em] font-bold uppercase tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,0.7)] dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            />
          </div>

          {/* Row 2: MM/AA + CVV */}
          <div className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-white/15">
            <div className="flex items-center px-3.5 py-3 gap-2">
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
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400/80 font-['OCR_A_Std','OCR-A','Share_Tech_Mono','Courier_New',monospace] tracking-[0.18em] font-bold uppercase tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,0.7)] dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
              />
            </div>
            <div className="flex items-center px-3.5 py-3 gap-2">
              <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="CVV"
                maxLength={4}
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400/80 font-['OCR_A_Std','OCR-A','Share_Tech_Mono','Courier_New',monospace] tracking-[0.22em] font-bold uppercase tabular-nums [text-shadow:0_1px_0_rgba(255,255,255,0.7)] dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
              />
            </div>
          </div>

          {/* Row 3: Cardholder Name */}
          <div className="flex items-center px-3.5 py-3 gap-2">
            <User className="w-4 h-4 text-gray-400 shrink-0" />
            <input 
              type="text"
              autoComplete="cc-name"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              placeholder="NOMBRE DEL TITULAR"
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400/80 font-['OCR_A_Std','OCR-A','Share_Tech_Mono','Courier_New',monospace] tracking-[0.16em] font-bold uppercase [text-shadow:0_1px_0_rgba(255,255,255,0.7)] dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            />
          </div>
        </div>
      </div>
    ) : (
      <div className="pt-2 space-y-2.5">
        <h4 className="font-sans font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
          Cuenta PayPhone
        </h4>
        <div className="rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-[#141416] flex items-center px-3.5 py-3 gap-2 shadow-2xs">
          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
          <input 
            type="tel"
            value={payphoneAppPhone}
            onChange={(e) => setPayphoneAppPhone(e.target.value)}
            placeholder="Número celular PayPhone (Ej: 0991234567)"
            className="w-full text-xs sm:text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 font-sans"
          />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
          Al presionar pagar, recibirás una solicitud de autorización directa en tu app PayPhone o podrás debitar de tu saldo disponible.
        </p>
      </div>
    )}

    {/* Hidden Live PayPhone script mount container if live box mode is loaded */}
    <div id="pp-button" className="hidden" />

    {/* Dotted Separator */}
    <div className="pt-2">
      <div className="border-b-2 border-dotted border-gray-300 dark:border-white/20" />
    </div>

    {/* TOTAL Row */}
    <div className="flex items-center justify-between pt-1">
      <span className="font-sans font-bold text-base sm:text-lg text-gray-900 dark:text-white tracking-wide">
        TOTAL:
      </span>
      <span className="font-sans font-bold text-lg sm:text-xl text-[#FF5900] tracking-tight">
        USD {finalTotal.toFixed(2)}
      </span>
    </div>

    {/* PayPhone Error Notification if any */}
    {payphoneError && (
      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-shake">
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold font-sans">Error al procesar el pago</p>
          <p className="text-[11px] leading-relaxed font-sans">{payphoneError}</p>
        </div>
      </div>
    )}

    {/* Action Button: Single "Pagar" Button in PayPhone Orange */}
    <div className="pt-1">
      <button
        type="button"
        onClick={handleTriggerPaymentWithAnimation}
        disabled={isProcessing}
        className="w-full py-3.5 sm:py-4 rounded-xl bg-[#FF5900] hover:bg-[#e04f00] text-white font-sans font-bold text-base transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Procesando pago...</span>
          </>
        ) : (
          <span>Pagar</span>
        )}
      </button>
    </div>

    {/* Trust & Security Badges Row (100% Vectorized & Standardized) */}
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-2">
      <VerifiedByVisaLogo />
      <MastercardSecureCodeLogo />
      <PciDssLogo />
      <PoweredByPayphoneLogo />
    </div>

    {/* Footer Disclaimer */}
    <p className="text-[11px] sm:text-[11.5px] text-gray-500 dark:text-gray-400 text-center leading-relaxed pt-1 font-sans max-w-sm mx-auto">
      Pago procesado por Payphone ({isPayphoneSimulated ? "Pruebas" : "Producción"}) · tarjeta de crédito, débito o saldo Payphone. Recibirás la confirmación por correo.
    </p>

  </div>

  </div>
  </div>
  )}

  {/* ======================================================================= */}
  {/* STEP 3: ORDER CONFIRMED CELEBRATION + WALLET PASS & QR CODE */}
  {/* ======================================================================= */}
  {step === "success" && lastPlacedOrder && (
  <div className="max-w-xl mx-auto py-8 sm:py-10 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
  
  <div className="relative w-20 h-20 rounded-full bg-[#FAF8F5] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 text-gray-900 dark:text-white flex items-center justify-center shadow-md">
    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-md">
      <Sparkles className="w-3.5 h-3.5" />
    </div>
  </div>

  <div>
    <h3 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight">¡Pedido Confirmado!</h3>
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md leading-relaxed">
      Tu compra ha sido procesada con éxito. Recibirás tu guía de rastreo apenas el pedido sea despachado con la transportadora.
    </p>
  </div>

  {/* Receipt Summary Card */}
  <div className="w-full p-6 sm:p-7 rounded-[2rem] bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-sm text-left space-y-3.5">
    <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/5 text-xs sm:text-sm">
      <span className="text-gray-400 font-medium">Orden de Compra</span>
      <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{lastPlacedOrder.id}</span>
    </div>
    <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/5 text-xs sm:text-sm">
      <span className="text-gray-400 font-medium">Estado Actual</span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 text-xs font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Procesando en Atelier
      </span>
    </div>
    <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/5 text-xs sm:text-sm">
      <span className="text-gray-400 font-medium">Guía de Transportadora</span>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Se asignará al despachar</span>
    </div>
    <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
      <span className="font-bold text-gray-700 dark:text-gray-300">Total Pagado</span>
      <span className="font-sans font-extrabold text-2xl text-gray-950 dark:text-white">
        ${Number(lastPlacedOrder?.total || 0).toFixed(2)} USD
      </span>
    </div>
  </div>

  {/* ======================================================================= */}
  {/* QR CODE (@beui/tilt-card) & GOOGLE / APPLE WALLET IN-PAGE POPUP */}
  {/* ======================================================================= */}
  <div className="w-full rounded-[2rem] p-6 sm:p-7 bg-gradient-to-br from-[#141417] via-[#1c1b20] to-[#111114] text-white border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-left relative overflow-hidden">
    <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
      {/* Scannable 3D Tilt Card QR Code (@beui/tilt-card) */}
      <BeUITiltCard maxTilt={15} scaleOnHover={1.04} glareOpacity={0.32} className="shrink-0 rounded-2xl">
        <button
          type="button"
          onClick={() => setWalletPopupPlatform("apple")}
          className="group/qr p-3.5 rounded-2xl bg-white shadow-[0_14px_34px_rgba(0,0,0,0.35)] border border-white/30 flex flex-col items-center gap-1.5 cursor-pointer"
          title="Abrir Pase Digital y Código QR en ventana interactiva"
        >
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&margin=6&data=${encodeURIComponent(
              `${typeof window !== "undefined" ? window.location.origin : "https://luminahome.ec"}/wallet/order/${encodeURIComponent(lastPlacedOrder.id)}?total=${encodeURIComponent(String(lastPlacedOrder.total || 0))}&status=${encodeURIComponent(lastPlacedOrder.status || "Procesando")}&customer=${encodeURIComponent(lastPlacedOrder.customerName || user?.name || "Cliente Lumina")}`
            )}`}
            alt={`QR Pase de Pedido ${lastPlacedOrder.id}`}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg object-contain select-none"
          />
          <span className="text-[9.5px] font-mono font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1">
            <QrCode className="w-3 h-3 text-[#8c9276]" />
            Escanear o Ampliar
          </span>
        </button>
      </BeUITiltCard>

      {/* Wallet Pass Info & In-Page Popup Action Buttons */}
      <div className="flex-1 space-y-3.5 text-center sm:text-left">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
            Pase Digital en Tiempo Real · Tilt Card 3D
          </span>
          <h4 className="font-display font-bold text-lg sm:text-xl text-white mt-1.5">
            Guarda tu Pedido en tu Billetera
          </h4>
          <p className="text-xs text-white/70 leading-relaxed mt-1">
            Escanea el código QR 3D o añade esta tarjeta a <strong className="text-white">Google Wallet</strong> o <strong className="text-white">Apple Wallet</strong> aquí mismo. Recibirás actualizaciones automáticas cuando tu pedido pase a <span className="text-amber-300 font-semibold">Enviado</span> y <span className="text-emerald-300 font-semibold">Entregado</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Google Wallet Button (Opens In-Page Popup Modal) */}
          <button
            type="button"
            onClick={() => setWalletPopupPlatform("google")}
            className="h-11 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-950 font-sans font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
              <rect x="3" y="8" width="18" height="9" rx="2" fill="#34A853" />
              <path d="M3 10.5h18" stroke="#FBBC05" strokeWidth="2.5" />
              <circle cx="17" cy="13.5" r="1.5" fill="#EA4335" />
            </svg>
            <span>Añadir a Google Wallet</span>
          </button>

          {/* Apple Wallet Button (Opens In-Page Popup Modal) */}
          <button
            type="button"
            onClick={() => setWalletPopupPlatform("apple")}
            className="h-11 px-4 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white font-sans font-bold text-xs flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
            </svg>
            <span>Añadir a Apple Wallet</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* In-Page Wallet Pass Popup Modal (No external tab!) */}
  <WalletPassPopupModal
    open={walletPopupPlatform !== null}
    onClose={() => setWalletPopupPlatform(null)}
    orderId={lastPlacedOrder.id}
    total={lastPlacedOrder.total}
    status={lastPlacedOrder.status}
    customerName={lastPlacedOrder.customerName || user?.name || "Cliente Lumina"}
    trackingNumber={lastPlacedOrder.trackingNumber}
    trackingUrl={lastPlacedOrder.trackingUrl}
    carrierName={lastPlacedOrder.carrierName}
    date={lastPlacedOrder.date}
    initialPlatform={walletPopupPlatform || "apple"}
  />

  {/* Action Buttons with 2IXO Capsule Design */}
  <div className="w-full space-y-3 pt-2">
    <button 
      onClick={() => {
        setIsOpen(false);
        router.push("/profile");
      }}
      className="group w-full h-14 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-sm flex items-center justify-between px-5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:opacity-95 transition-all cursor-pointer"
    >
      <div className="w-8 h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white dark:text-[#18181b]" />
      </div>
      <span>Ver Pedido en mi Perfil</span>
      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#18181b] text-[#18181b] dark:text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </div>
    </button>

    <button 
      onClick={() => {
        setIsOpen(false);
        setStep("bag");
      }}
      className="w-full py-3.5 px-6 rounded-full bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-black/[0.06] dark:border-white/10 text-xs sm:text-sm font-bold transition-all cursor-pointer"
    >
      Seguir Explorando Colecciones
    </button>
  </div>

  </div>
  )}

  </div>

  </motion.div>

  {/* ======================================================================= */}
  {/* PAYPHONE ECUADOR SIMULATION MODAL (Modo Preparación / RUC en trámite) */}
  {/* ======================================================================= */}
  {isPayPhoneSimOpen && payphoneSimData && (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/10 space-y-5 animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/[0.06] dark:border-white/10">
              <PayPhoneIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                PayPhone Ecuador <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">Modo Pruebas</span>
              </h3>
              <p className="text-[11px] text-gray-400">Ambiente de Simulación SRI / RUC en trámite</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPayPhoneSimOpen(false)}
            className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Overview inside Modal */}
        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 space-y-2 text-xs">
          <div className="flex justify-between font-semibold items-baseline">
            <span className="text-gray-500 dark:text-gray-400">Total a Autorizar:</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">${Number(payphoneSimData.total).toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span className="text-gray-400">Pedido ID:</span>
            <span className="font-mono font-bold">{payphoneSimData.orderId}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span className="text-gray-400">Tx ID (PayPhone):</span>
            <span className="font-mono text-[10px]">{payphoneSimData.clientTransactionId}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span className="text-gray-400">Cliente / Correo:</span>
            <span>{payphoneSimData.customerEmail}</span>
          </div>
          {payphoneSimData.shippingAddr?.idNumber && (
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span className="text-gray-400">Cédula / RUC Comprador:</span>
              <span className="font-mono font-bold">{payphoneSimData.shippingAddr.idNumber}</span>
            </div>
          )}
        </div>

        {/* Status Notice */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/5 text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Arquitectura de Pagos Completada al 100%</span>
          </div>
          <p>
            Tu tienda ya tiene listos los endpoints de cobro, el recálculo zero-trust de montos y el despacho automático de facturas. Como el RUC ante el SRI está en trámite, puedes simular la autorización bancaria con 1 clic para validar todo el flujo de pedidos.
          </p>
        </div>

        {/* Simulated Card Badges */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-[#2c2c2e] text-[11px]">
          <span className="text-gray-500 font-medium">Tarjeta de Prueba:</span>
          <span className="font-mono font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <VisaLogo className="h-2.5" fill="#1A1F71" /> VISA •••• 4242
          </span>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={handleApprovePayPhoneSimulation}
            disabled={isSimulatingApproval}
            className="w-full h-13 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer active:scale-[0.99] hover:opacity-95"
          >
            {isSimulatingApproval ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autorizando transacción...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simular Pago Aprobado (${Number(payphoneSimData.total).toFixed(2)})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsPayPhoneSimOpen(false)}
            disabled={isSimulatingApproval}
            className="w-full py-2.5 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  )}

      </div>
    )}
  </AnimatePresence>
);
}
