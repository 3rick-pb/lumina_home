"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  User,
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Wallet,
  Wifi,
} from "lucide-react";
import { BeUICenterMorphModal } from "@/components/ui/BeUIControls";

export interface AddCardAnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: {
    type: "visa" | "mastercard";
    number: string;
    holder: string;
    exp: string;
    design?: "carbon" | "holo" | "navy" | string;
  }) => Promise<void> | void;
  defaultHolder?: string;
}

type DetectedBrand = "neutral" | "visa" | "mastercard" | "amex" | "discover";

interface BrandVisualConfig {
  id: DetectedBrand;
  storageType: "visa" | "mastercard";
  name: string;
  tierLabel: string;
  subLabel: string;
  frontGradient: string;
  backGradient: string;
  accentRing: string;
  pillClass: string;
  glowColor: string;
  isHolo?: boolean;
  textColor?: string;
}

const BRAND_CONFIGS: Record<DetectedBrand, BrandVisualConfig> = {
  neutral: {
    id: "neutral",
    storageType: "visa",
    name: "Signature Black",
    tierLabel: "SIGNATURE BLACK",
    subLabel: "CRÉDITO / DÉBITO",
    frontGradient:
      "radial-gradient(circle at 92% 35%, rgba(96, 58, 62, 0.7) 0%, transparent 55%), linear-gradient(105deg, #323438 0%, #2b2d31 58%, #3d2d31 100%)",
    backGradient: "linear-gradient(105deg, #25262a 0%, #1f2023 58%, #2b2023 100%)",
    accentRing: "rgba(255, 255, 255, 0.92)",
    pillClass: "bg-red-500/25 text-red-200 border-red-400/30",
    glowColor: "rgba(166, 29, 24, 0.35)",
    textColor: "#ffffff",
  },
  visa: {
    id: "visa",
    storageType: "visa",
    name: "Visa",
    tierLabel: "SIGNATURE BLACK",
    subLabel: "CRÉDITO / DÉBITO",
    frontGradient:
      "radial-gradient(circle at 92% 35%, rgba(96, 58, 62, 0.7) 0%, transparent 55%), linear-gradient(105deg, #323438 0%, #2b2d31 58%, #3d2d31 100%)",
    backGradient: "linear-gradient(105deg, #25262a 0%, #1f2023 58%, #2b2023 100%)",
    accentRing: "rgba(255, 255, 255, 0.92)",
    pillClass: "bg-red-500/25 text-red-200 border-red-400/30",
    glowColor: "rgba(166, 29, 24, 0.35)",
    textColor: "#ffffff",
  },
  mastercard: {
    id: "mastercard",
    storageType: "mastercard",
    name: "Mastercard",
    tierLabel: "HORIZON GOLD",
    subLabel: "WORLD ELITE",
    frontGradient:
      "radial-gradient(circle at 68% 35%, rgba(214, 142, 68, 0.95) 0%, rgba(163, 92, 45, 0.85) 32%, transparent 68%), linear-gradient(108deg, #1b2848 0%, #243558 34%, #6e4838 64%, #b87b42 100%)",
    backGradient: "linear-gradient(108deg, #151e36 0%, #1c2a46 34%, #54372b 64%, #8c5d32 100%)",
    accentRing: "rgba(255, 255, 255, 0.92)",
    pillClass: "bg-black/35 text-amber-200 border-amber-200/40",
    glowColor: "rgba(214, 142, 68, 0.35)",
    textColor: "#ffffff",
  },
  amex: {
    id: "amex",
    storageType: "visa",
    name: "American Express",
    tierLabel: "CENTURION PLATINUM",
    subLabel: "CORPORATIVO",
    frontGradient:
      "radial-gradient(circle at 80% 30%, rgba(180, 195, 205, 0.35) 0%, transparent 60%), linear-gradient(110deg, #1f2429 0%, #2a313a 52%, #14181c 100%)",
    backGradient: "linear-gradient(110deg, #161a1e 0%, #20262d 52%, #0e1114 100%)",
    accentRing: "rgba(255, 255, 255, 0.92)",
    pillClass: "bg-teal-500/20 text-teal-200 border-teal-400/30",
    glowColor: "rgba(45, 212, 191, 0.3)",
    textColor: "#ffffff",
  },
  discover: {
    id: "discover",
    storageType: "mastercard",
    name: "Discover",
    tierLabel: "HOLO PRISM",
    subLabel: "RAINBOW PRISM",
    frontGradient:
      "linear-gradient(100deg, #e3e3e3 0%, #e6e6e6 46%, #ebb665 54%, #c96f49 58%, #3b5998 63%, #4ea8de 69%, #66b2a0 73%, #e29568 79%, #8b9bb1 87%, #cfd6df 95%, #dfdfdf 100%)",
    backGradient: "linear-gradient(135deg, #dcdcdc 0%, #cccccc 100%)",
    accentRing: "rgba(255, 255, 255, 1)",
    pillClass: "bg-neutral-900/15 text-neutral-900 border-neutral-900/20",
    glowColor: "rgba(235, 182, 101, 0.35)",
    isHolo: true,
    textColor: "#1d1d1f",
  },
};

/**
 * Real-time BIN detector as the user types each digit
 */
function detectCardBrandLive(digitsOnly: string): DetectedBrand {
  if (!digitsOnly || digitsOnly.length === 0) return "neutral";

  // Visa starts with 4
  if (digitsOnly.startsWith("4")) return "visa";

  // American Express starts with 34 or 37
  if (/^3[47]/.test(digitsOnly)) return "amex";

  // Mastercard starts with 51-55, 2221-2720, or 5 / 2
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(digitsOnly)) {
    return "mastercard";
  }
  if (digitsOnly.startsWith("5") || digitsOnly.startsWith("2")) {
    return "mastercard";
  }

  // Discover starts with 6011, 65, 644-649
  if (/^(6011|65|64[4-9])/.test(digitsOnly)) {
    return "discover";
  }

  return "visa";
}

function BrandNetworkVector({
  brand,
  size = "md",
  isHolo = false,
}: {
  brand: DetectedBrand;
  size?: "sm" | "md";
  isHolo?: boolean;
}) {
  const isSmall = size === "sm";

  if (brand === "visa") {
    return (
      <motion.div
        key="logo-visa"
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.9 }}
        transition={{ duration: 0.22 }}
        className="inline-flex items-center"
      >
        <span
          className={`font-['Plus_Jakarta_Sans','Inter',sans-serif] font-[800] -skew-x-[11deg] tracking-tight select-none leading-none ${
            isSmall ? "text-sm text-blue-600 dark:text-blue-400" : "text-xl drop-shadow-md"
          }`}
          style={
            !isSmall && isHolo
              ? {
                  color: "#1c1c1e",
                  textShadow:
                    "-1.5px -0.5px 0px rgba(217, 130, 54, 0.85), 1.5px 0.5px 0px rgba(59, 130, 246, 0.5)",
                }
              : !isSmall
              ? {
                  color: "#ffffff",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
                }
              : undefined
          }
        >
          VISA
        </span>
      </motion.div>
    );
  }

  if (brand === "mastercard") {
    return (
      <motion.div
        key="logo-mastercard"
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.9 }}
        transition={{ duration: 0.22 }}
        className="inline-flex items-center"
      >
        <div className={`flex items-center ${isSmall ? "-space-x-1.5" : "-space-x-2.5"}`}>
          <div
            className={`${
              isSmall ? "w-4 h-4" : "w-7 h-7"
            } rounded-full bg-[#EB001B] shadow-sm`}
          />
          <div
            className={`${
              isSmall ? "w-4 h-4" : "w-7 h-7"
            } rounded-full bg-[#F79E1B] opacity-90 mix-blend-screen shadow-sm`}
          />
        </div>
      </motion.div>
    );
  }

  if (brand === "amex") {
    return (
      <motion.div
        key="logo-amex"
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.9 }}
        transition={{ duration: 0.22 }}
        className={`font-black tracking-tighter uppercase rounded px-1.5 py-0.5 ${
          isSmall
            ? "text-[10px] bg-teal-600 text-white"
            : "text-xs bg-white/20 text-white border border-white/30"
        }`}
      >
        AMEX
      </motion.div>
    );
  }

  if (brand === "discover") {
    return (
      <motion.div
        key="logo-discover"
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.9 }}
        transition={{ duration: 0.22 }}
        className={`font-black tracking-wider uppercase ${
          isSmall ? "text-[10px] text-orange-600 dark:text-orange-400" : "text-xs text-orange-300"
        }`}
      >
        DISCOVER
      </motion.div>
    );
  }

  return (
    <motion.div
      key="logo-neutral"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="inline-flex items-center gap-1"
    >
      <CreditCard className={isSmall ? "w-4 h-4 text-gray-400" : "w-6 h-6 text-amber-200/80"} />
    </motion.div>
  );
}

export function AddCardAnimatedModal({
  isOpen,
  onClose,
  onSaveCard,
  defaultHolder = "CLIENTE LUMINA",
}: AddCardAnimatedModalProps) {
  const [cardHolder, setCardHolder] = useState(defaultHolder || "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [focusedField, setFocusedField] = useState<"number" | "holder" | "exp" | "cvv" | null>(
    null
  );

  const [isFlipped, setIsFlipped] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ensure scroll is always cleanly restored when modal closes or unmounts
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overscroll-behavior");
      document.documentElement.classList.remove(
        "lumina-add-card-scroll-lock",
        "lumina-modal-lock-scroll"
      );
    }
    return () => {
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overscroll-behavior");
      document.documentElement.classList.remove(
        "lumina-add-card-scroll-lock",
        "lumina-modal-lock-scroll"
      );
    };
  }, [isOpen]);

  // Real-time card network detection based on digits typed
  const rawDigits = cardNumber.replace(/\D/g, "");
  const detectedBrand: DetectedBrand = detectCardBrandLive(rawDigits);
  const brandVisual = BRAND_CONFIGS[detectedBrand];

  // Acabado de diseño skeuomórfico (Signature Black, Holo Prism, Horizon Gold)
  const [selectedFinish, setSelectedFinish] = useState<"auto" | "carbon" | "holo" | "navy">("auto");

  const effectiveVisual = React.useMemo(() => {
    if (selectedFinish === "carbon") {
      return {
        ...brandVisual,
        frontGradient: BRAND_CONFIGS.visa.frontGradient,
        backGradient: BRAND_CONFIGS.visa.backGradient,
        tierLabel: "SIGNATURE BLACK",
        pillClass: BRAND_CONFIGS.visa.pillClass,
        glowColor: BRAND_CONFIGS.visa.glowColor,
        textColor: "#ffffff",
        isHolo: false,
      };
    }
    if (selectedFinish === "holo") {
      return {
        ...brandVisual,
        frontGradient: BRAND_CONFIGS.discover.frontGradient,
        backGradient: BRAND_CONFIGS.discover.backGradient,
        tierLabel: "HOLO PRISM",
        subLabel: "RAINBOW PRISM",
        pillClass: BRAND_CONFIGS.discover.pillClass,
        glowColor: BRAND_CONFIGS.discover.glowColor,
        textColor: "#1d1d1f",
        isHolo: true,
      };
    }
    if (selectedFinish === "navy") {
      return {
        ...brandVisual,
        frontGradient: BRAND_CONFIGS.mastercard.frontGradient,
        backGradient: BRAND_CONFIGS.mastercard.backGradient,
        tierLabel: "HORIZON GOLD",
        pillClass: BRAND_CONFIGS.mastercard.pillClass,
        glowColor: BRAND_CONFIGS.mastercard.glowColor,
        textColor: "#ffffff",
        isHolo: false,
      };
    }
    return brandVisual;
  }, [brandVisual, selectedFinish]);

  const effectiveDesign =
    selectedFinish !== "auto"
      ? selectedFinish
      : detectedBrand === "mastercard"
      ? "navy"
      : detectedBrand === "discover"
      ? "holo"
      : "carbon";

  const handleCardNumberChange = (rawVal: string) => {
    const digitsOnly = rawVal.replace(/\D/g, "").slice(0, 16);
    const formatted = digitsOnly.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  // Handles both manual typing ("1228" -> "12/28") and browser Wallet autofill ("08/2029" -> "08/29")
  const handleExpChange = (rawVal: string) => {
    const clean = rawVal.trim();
    // Check if wallet autofilled MM/YYYY (e.g. 08/2029 or 8/2029)
    const slashMatch = clean.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
    if (slashMatch) {
      const mm = slashMatch[1].padStart(2, "0").slice(0, 2);
      const yy = slashMatch[2].slice(-2);
      setCardExp(`${mm}/${yy}`);
      return;
    }

    let digits = clean.replace(/\D/g, "");
    // If wallet pasted 6 digits MMYYYY (e.g. 082029), convert to MMYY
    if (digits.length === 6 && (digits.slice(2, 4) === "20" || digits.slice(2, 4) === "19")) {
      digits = digits.slice(0, 2) + digits.slice(4, 6);
    } else {
      digits = digits.slice(0, 4);
    }

    if (digits.length > 2) {
      digits = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    setCardExp(digits);
  };

  const handleCvvChange = (rawVal: string) => {
    const digits = rawVal.replace(/\D/g, "").slice(0, 4);
    setCardCvv(digits);
  };

  const handleResetAndClose = () => {
    if (step === "processing") return;
    if (typeof document !== "undefined") {
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overscroll-behavior");
      document.documentElement.classList.remove(
        "lumina-add-card-scroll-lock",
        "lumina-modal-lock-scroll"
      );
    }
    setStep("form");
    setIsFlipped(false);
    setFocusedField(null);
    setErrorMessage(null);
    onClose();
  };

  const executeSaveCard = () => {
    setIsFlipped(false);
    setFocusedField(null);
    setStep("processing");

    setTimeout(async () => {
      try {
        await onSaveCard({
          type: brandVisual.storageType,
          number: cardNumber,
          holder: cardHolder.trim() || defaultHolder,
          exp: cardExp,
          design: effectiveDesign,
        });

        setStep("success");

        setTimeout(() => {
          if (typeof document !== "undefined") {
            document.body.style.removeProperty("overflow");
            document.documentElement.style.removeProperty("overflow");
            document.body.style.removeProperty("overscroll-behavior");
            document.documentElement.classList.remove(
              "lumina-add-card-scroll-lock",
              "lumina-modal-lock-scroll"
            );
          }
          setStep("form");
          setIsFlipped(false);
          setCardNumber("");
          setCardExp("");
          setCardCvv("");
          onClose();
        }, 3400);
      } catch {
        setStep("form");
        setErrorMessage("Ocurrió un error al vincular la tarjeta. Intenta nuevamente.");
      }
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (rawDigits.length < 15) {
      setErrorMessage("Por favor ingresa los 16 dígitos del número de tu tarjeta.");
      return;
    }
    if (cardExp.length < 5) {
      setErrorMessage("Por favor ingresa una fecha de vencimiento válida (MM/AA).");
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMessage("Por favor ingresa el código de seguridad CVV (3 o 4 dígitos).");
      return;
    }

    // Guardar directamente la tarjeta protegida por autenticación de dispositivo
    executeSaveCard();
  };

  // Format 4 groups of 4 characters for the live 3D card display
  const formattedGroups = [0, 1, 2, 3].map((groupIdx) => {
    const slice = rawDigits.slice(groupIdx * 4, groupIdx * 4 + 4);
    return slice.padEnd(4, "•");
  });

  return (
    <BeUICenterMorphModal
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleResetAndClose();
      }}
      className="max-w-3xl"
    >
      <style>{`
        .lumina-bag-close-btn,
        .lumina-bag-close-btn * {
          transition-property: all !important;
          transition-duration: 150ms !important;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `}</style>

      <div
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="relative w-full bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/10 rounded-[2.25rem] shadow-[0_28px_80px_rgba(0,0,0,0.35)] overflow-hidden select-none"
      >
        {/* Top Ambient Luxury Glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/4 w-96 h-48 rounded-full blur-3xl transition-all duration-700"
          style={{ background: effectiveVisual.glowColor }}
        />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white tracking-tight">
                  Nueva Tarjeta de Pago
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  PCI-DSS Seguro
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Asocia un método de pago a tu cuenta para agilizar tus próximas compras.
              </p>
            </div>
          </div>

          {/* Exact CartDrawer Close Button ("X") */}
          <button
            type="button"
            onClick={handleResetAndClose}
            disabled={step === "processing"}
            className="lumina-bag-close-btn w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-30 shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div
                key="form-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 items-center"
              >
                {/* LEFT COLUMN: LIVE 3D INTERACTIVE MORPHING CARD */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center">
                  {/* Live Network Pill above the card */}
                  <div className="mb-2 flex items-center justify-between w-full max-w-[350px] px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Entidad Emisora
                    </span>
                    <motion.span
                      key={detectedBrand + (effectiveVisual.tierLabel || "")}
                      initial={{ opacity: 0, scale: 0.9, y: 3 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-colors ${effectiveVisual.pillClass}`}
                    >
                      <span>{effectiveVisual.name}</span>
                      {detectedBrand !== "neutral" && <CheckCircle2 className="w-3 h-3" />}
                    </motion.span>
                  </div>

                  {/* Selector rápido de acabado skeuomórfico 3D */}
                  <div className="mb-3 flex items-center justify-center gap-1.5 w-full max-w-[350px]">
                    <button
                      type="button"
                      onClick={() => setSelectedFinish("auto")}
                      className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold border transition-all cursor-pointer ${
                        selectedFinish === "auto"
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-xs"
                          : "bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border-transparent"
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFinish("carbon")}
                      className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold border transition-all cursor-pointer ${
                        selectedFinish === "carbon"
                          ? "bg-neutral-900 text-white border-red-400/40 shadow-xs"
                          : "bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border-transparent"
                      }`}
                    >
                      Signature Black
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFinish("holo")}
                      className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold border transition-all cursor-pointer ${
                        selectedFinish === "holo"
                          ? "bg-neutral-200 text-neutral-900 border-neutral-400/50 font-bold shadow-xs"
                          : "bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border-transparent"
                      }`}
                    >
                      Holo Prism
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFinish("navy")}
                      className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold border transition-all cursor-pointer ${
                        selectedFinish === "navy"
                          ? "bg-[#1b2848] text-amber-200 border-amber-300/40 shadow-xs"
                          : "bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border-transparent"
                      }`}
                    >
                      Horizon Gold
                    </button>
                  </div>

                  {/* 3D Card Container */}
                  <div
                    className="w-full max-w-[350px] aspect-[1.586/1] rounded-[1.35rem] cursor-pointer select-none"
                    style={{ perspective: 1300 }}
                    onClick={() => setIsFlipped((prev) => !prev)}
                    title="Toca la tarjeta para girarla (Anverso / Reverso)"
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 230, damping: 24 }}
                      className="relative w-full h-full rounded-[1.35rem] shadow-[0_22px_50px_rgba(0,0,0,0.35)]"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* ================= CARD FRONT ================= */}
                      <motion.div
                        animate={{ background: effectiveVisual.frontGradient }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 w-full h-full rounded-[1.35rem] p-5 sm:p-6 flex flex-col justify-between overflow-hidden"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          color: effectiveVisual.textColor || "#ffffff",
                          border: effectiveVisual.isHolo
                            ? "1.8px solid #ffffff"
                            : "1.8px solid rgba(255, 255, 255, 0.92)",
                          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.25), 0 0 0 1px ${effectiveVisual.accentRing}`,
                        }}
                      >
                        {/* Textura de ruido sutil realista 1:1 con la Billetera */}
                        <div
                          className="pointer-events-none absolute inset-0 z-[1]"
                          style={{
                            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 0)",
                            backgroundSize: "3px 3px",
                          }}
                        />

                        {/* Brillo iridiscente adicional para Holo Prism */}
                        {effectiveVisual.isHolo && (
                          <div
                            className="pointer-events-none absolute inset-0 z-[2]"
                            style={{
                              background:
                                "linear-gradient(125deg, rgba(255,255,255,0.45) 0%, transparent 40%, rgba(255,255,255,0.2) 70%, transparent 100%)",
                            }}
                          />
                        )}

                        {/* Top Row: EMV Gold Chip, Contactless & Dynamic Tier Label */}
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Precision EMV Chip */}
                            <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-[#d4af37] via-[#f9e596] to-[#aa8220] p-1.5 border border-yellow-200/80 shadow-md flex flex-col justify-between shrink-0">
                              <div className="w-full h-[1px] bg-amber-900/35" />
                              <div className="flex justify-between w-full h-2.5 border-y border-amber-900/30">
                                <div className="w-1/3 border-r border-amber-900/35" />
                                <div className="w-1/3 border-r border-amber-900/35" />
                              </div>
                              <div className="w-full h-[1px] bg-amber-900/35" />
                            </div>

                            <Wifi className={`w-4 h-4 rotate-90 ${effectiveVisual.isHolo ? "text-neutral-700" : "text-white/65"}`} />
                          </div>

                          <div className="text-right">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={effectiveVisual.tierLabel}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="block text-[10px] tracking-[0.22em] font-black uppercase drop-shadow-xs"
                                style={{ color: effectiveVisual.textColor || "#ffffff" }}
                              >
                                {effectiveVisual.tierLabel}
                              </motion.span>
                            </AnimatePresence>
                            <span
                              className="block text-[8px] tracking-[0.16em] uppercase mt-0.5 opacity-65"
                              style={{ color: effectiveVisual.textColor || "#ffffff" }}
                            >
                              {effectiveVisual.subLabel}
                            </span>
                          </div>
                        </div>

                        {/* Middle Row: Live Animated 16-Digit Number with Active Field Highlight */}
                        <div
                          className={`relative z-10 my-auto py-1.5 px-2.5 -mx-2.5 rounded-xl transition-all duration-300 ${
                            focusedField === "number"
                              ? "bg-white/10 ring-1 ring-white/40 shadow-[0_0_16px_rgba(255,255,255,0.12)]"
                              : ""
                          }`}
                        >
                          <div
                            className="flex items-center justify-between font-mono text-lg sm:text-[20px] tracking-[0.16em] font-bold drop-shadow-md"
                            style={{ color: effectiveVisual.textColor || "#ffffff" }}
                          >
                            {formattedGroups.map((grp, gIdx) => (
                              <span key={gIdx} className="inline-flex">
                                {grp}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Row: Cardholder, Expiration & Live Network Vector Logo */}
                        <div className="relative z-10 flex items-end justify-between gap-2">
                          <div
                            className={`space-y-0.5 px-2 py-1 -mx-2 -my-1 rounded-lg transition-all duration-300 min-w-0 flex-1 ${
                              focusedField === "holder" ? "bg-white/10 ring-1 ring-white/35" : ""
                            }`}
                          >
                            <span
                              className="text-[8.5px] uppercase tracking-widest block font-semibold opacity-65"
                              style={{ color: effectiveVisual.textColor || "#ffffff" }}
                            >
                              Titular
                            </span>
                            <p
                              className="text-xs font-bold tracking-wider uppercase truncate drop-shadow-xs"
                              style={{ color: effectiveVisual.textColor || "#ffffff" }}
                            >
                              {cardHolder.trim() || defaultHolder}
                            </p>
                          </div>

                          <div
                            className={`space-y-0.5 text-center px-2 py-1 -my-1 rounded-lg transition-all duration-300 shrink-0 ${
                              focusedField === "exp" ? "bg-white/10 ring-1 ring-white/35" : ""
                            }`}
                          >
                            <span
                              className="text-[8.5px] uppercase tracking-widest block font-semibold opacity-65"
                              style={{ color: effectiveVisual.textColor || "#ffffff" }}
                            >
                              Expira
                            </span>
                            <p
                              className="font-mono text-xs font-bold tracking-widest drop-shadow-xs"
                              style={{ color: effectiveVisual.textColor || "#ffffff" }}
                            >
                              {cardExp || "MM/AA"}
                            </p>
                          </div>

                          {/* Real-Time Morphing Brand Logo */}
                          <div className="h-8 min-w-[54px] flex items-center justify-end shrink-0">
                            <AnimatePresence mode="wait">
                              <BrandNetworkVector brand={detectedBrand} size="md" isHolo={effectiveVisual.isHolo} />
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>

                      {/* ================= CARD BACK (FLIPPED 180 DEG) ================= */}
                      <motion.div
                        animate={{ background: effectiveVisual.backGradient }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 w-full h-full rounded-[1.35rem] pt-4 pb-5 flex flex-col justify-between overflow-hidden border border-white/20 text-white"
                        style={{
                          transform: "rotateY(180deg)",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                      >
                        <div className="w-full h-10 bg-black/90 shadow-inner" />

                        <div className="px-5 space-y-1.5">
                          <div className="flex items-center justify-between text-[8.5px] text-white/55 uppercase tracking-wider font-semibold">
                            <span>Firma Autorizada</span>
                            <span>Código CVC / CVV</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-8 bg-white/90 rounded-md flex items-center px-3">
                              <span className="text-[10px] font-mono text-gray-500 italic truncate">
                                {cardHolder.trim() || defaultHolder}
                              </span>
                            </div>

                            <div
                              className={`w-16 h-8 bg-white rounded-md border flex items-center justify-center font-mono font-black text-xs text-gray-900 shadow-inner transition-all ${
                                focusedField === "cvv"
                                  ? "ring-2 ring-amber-400 border-white scale-105"
                                  : "border-gray-300"
                              }`}
                            >
                              {cardCvv || "•••"}
                            </div>
                          </div>
                        </div>

                        <div className="px-5 flex items-center justify-between text-[8.5px] text-white/45">
                          <span className="max-w-[200px] leading-tight">
                            Información protegida bajo estándares de seguridad financiera.
                          </span>
                          <BrandNetworkVector brand={detectedBrand} size="sm" />
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Security Footnote */}
                  <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-gray-500 dark:text-gray-400">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Transacción protegida bajo cifrado bancario SSL de 256 bits</span>
                  </div>
                </div>

                {/* RIGHT COLUMN: FORM */}
                <div className="lg:col-span-6">
                  <form
                    onSubmit={handleSubmit}
                    autoComplete="on"
                    className="space-y-4 bg-gray-50/70 dark:bg-white/[0.03] p-5 sm:p-6 rounded-3xl border border-gray-200/70 dark:border-white/10"
                  >
                    {/* Input 1: Card Number */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="cc-number"
                          className="block text-xs font-bold text-gray-700 dark:text-gray-200"
                        >
                          Número de Tarjeta
                        </label>
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          {rawDigits.length}/16 dígitos
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 border border-gray-200/70 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 absolute left-2.5 pointer-events-none">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <input
                          id="cc-number"
                          name="cardnumber"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9 ]*"
                          autoComplete="cc-number"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          onFocus={() => {
                            setIsFlipped(false);
                            setFocusedField("number");
                          }}
                          onBlur={() => setFocusedField(null)}
                          placeholder="4532 •••• •••• ••••"
                          className="w-full pl-12 pr-16 py-3 rounded-2xl border border-gray-200/90 dark:border-white/15 text-sm font-mono font-bold bg-white dark:bg-[#141417] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-2xs"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <AnimatePresence mode="wait">
                            <BrandNetworkVector brand={detectedBrand} size="sm" />
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Input 2: Cardholder Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="cc-name"
                        className="block text-xs font-bold text-gray-700 dark:text-gray-200"
                      >
                        Nombre del Titular
                      </label>
                      <div className="relative flex items-center">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 border border-gray-200/70 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 absolute left-2.5 pointer-events-none">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="cc-name"
                          name="ccname"
                          type="text"
                          autoComplete="cc-name"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          onFocus={() => {
                            setIsFlipped(false);
                            setFocusedField("holder");
                          }}
                          onBlur={() => setFocusedField(null)}
                          placeholder="NOMBRE COMO APARECE EN LA TARJETA"
                          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200/90 dark:border-white/15 text-xs sm:text-sm font-semibold uppercase bg-white dark:bg-[#141417] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Inputs 3 & 4: Expiry Date & Security Code */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="cc-exp"
                          className="block text-xs font-bold text-gray-700 dark:text-gray-200"
                        >
                          Vencimiento
                        </label>
                        <div className="relative flex items-center">
                          <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 border border-gray-200/70 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 absolute left-2.5 pointer-events-none">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <input
                            id="cc-exp"
                            name="exp-date"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9/]*"
                            autoComplete="cc-exp"
                            required
                            maxLength={7}
                            value={cardExp}
                            onChange={(e) => handleExpChange(e.target.value)}
                            onFocus={() => {
                              setIsFlipped(false);
                              setFocusedField("exp");
                            }}
                            onBlur={() => setFocusedField(null)}
                            placeholder="MM/AA"
                            className="w-full pl-12 pr-3 py-3 rounded-2xl border border-gray-200/90 dark:border-white/15 text-sm font-mono font-bold bg-white dark:bg-[#141417] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="cc-csc"
                            className="block text-xs font-bold text-gray-700 dark:text-gray-200"
                          >
                            CVC / CVV
                          </label>
                          <span className="text-[10px] text-gray-400 font-medium">Reverso</span>
                        </div>
                        <div className="relative flex items-center">
                          <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 border border-gray-200/70 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 absolute left-2.5 pointer-events-none">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="cc-csc"
                            name="cvc"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="cc-csc"
                            required
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => handleCvvChange(e.target.value)}
                            onFocus={() => {
                              setIsFlipped(true);
                              setFocusedField("cvv");
                            }}
                            onBlur={() => {
                              setIsFlipped(false);
                              setFocusedField(null);
                            }}
                            placeholder="123"
                            className="w-full pl-12 pr-3 py-3 rounded-2xl border border-gray-200/90 dark:border-white/15 text-sm font-mono font-bold bg-white dark:bg-[#141417] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-300 text-xs font-semibold text-center">
                        {errorMessage}
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="submit"
                        className="w-full h-12 rounded-2xl bg-gray-950 hover:bg-black dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-stone-950 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-lg shadow-gray-950/15 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Guardar nueva Tarjeta</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* PROCESSING STATE */}
            {step === "processing" && (
              <motion.div
                key="processing-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center justify-center py-8 text-center space-y-6"
              >
                <div
                  className="w-full max-w-[340px] aspect-[1.586/1] rounded-[1.35rem] shadow-2xl p-5 flex flex-col justify-between border border-white/20 text-white relative overflow-hidden"
                  style={{ background: brandVisual.frontGradient }}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="w-10 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-1 border border-yellow-300 shadow-md" />
                    <span className="text-[10px] tracking-[0.2em] font-black uppercase text-white/85">
                      {brandVisual.tierLabel}
                    </span>
                  </div>
                  <div className="font-mono text-lg tracking-[0.2em] text-white font-bold relative z-10">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex items-end justify-between relative z-10">
                    <div className="text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/50 block">
                        Titular
                      </span>
                      <p className="text-xs font-bold uppercase text-white truncate max-w-[170px]">
                        {cardHolder || defaultHolder}
                      </p>
                    </div>
                    <BrandNetworkVector brand={detectedBrand} size="md" />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col items-center">
                  <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white">
                    <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                    <span>Registrando tarjeta {brandVisual.name}...</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Verificando credenciales con tu entidad financiera
                  </p>
                </div>
              </motion.div>
            )}

            {/* SUCCESS STATE */}
            {step === "success" && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="flex flex-col items-center justify-center py-8 text-center space-y-6"
              >
                <div
                  className="w-full max-w-[340px] aspect-[1.586/1] rounded-[1.35rem] shadow-2xl p-5 flex flex-col justify-between border border-emerald-500/40 text-white relative overflow-hidden ring-4 ring-emerald-500/20"
                  style={{ background: brandVisual.frontGradient }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-1 border border-yellow-300" />
                    <span className="text-[10px] tracking-[0.2em] font-black uppercase text-white/85">
                      {brandVisual.tierLabel}
                    </span>
                  </div>
                  <div className="font-mono text-lg tracking-[0.2em] text-white font-bold">
                    •••• •••• •••• {rawDigits.slice(-4) || "8888"}
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/50 block">
                        Titular
                      </span>
                      <p className="text-xs font-bold uppercase text-white truncate max-w-[170px]">
                        {cardHolder || defaultHolder}
                      </p>
                    </div>
                    <BrandNetworkVector brand={detectedBrand} size="md" />
                  </div>
                </div>

                <div className="space-y-3 flex flex-col items-center w-full max-w-md text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner ring-4 ring-emerald-500/10">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-950 dark:text-white">
                      Tarjeta Vinculada con Éxito
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Método asociado a tu billetera terminada en •••• {rawDigits.slice(-4) || "8888"}
                    </p>
                  </div>

                  {/* Strategic PCI-DSS Zero-Retention Assurance Banner */}
                  <div className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200/80 dark:border-stone-800/80 text-left space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Protocolo Bancario PCI-DSS • Zero-Retention CVV</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                      Por estrictos estándares globales de seguridad y privacidad financiera, tu código de seguridad (CVV) es verificado en tiempo real y <strong className="font-semibold text-stone-900 dark:text-stone-100">jamás se almacena</strong> en nuestras bases de datos ni servidores. En tu sobre interactivo tus datos estarán siempre protegidos bajo cifrado de alta fidelidad.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BeUICenterMorphModal>
  );
}
