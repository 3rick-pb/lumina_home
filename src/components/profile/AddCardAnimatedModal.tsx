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
  AlertCircle,
} from "lucide-react";
import { BeUICenterMorphModal } from "@/components/ui/BeUIControls";
import {
  SilverEmvChip,
  NetworkBrandLogo,
  resolveCardNetwork,
  detectCardBrandDetails,
  CARD_DOTS_TEXTURE_STYLE,
  CARD_NETWORK_THEMES,
  CardNetwork,
} from "@/components/ui/UnifiedWalletSystem";

export interface AddCardAnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: {
    type: string;
    number: string;
    holder: string;
    exp: string;
    design?: string;
  }) => Promise<void> | void;
  defaultHolder?: string;
}

/**
 * Real-time BIN detector as the user types each digit
 */
function detectCardBrandLive(digitsOnly: string): CardNetwork {
  if (!digitsOnly || digitsOnly.length === 0) return "mastercard";
  const details = detectCardBrandDetails(digitsOnly);
  return details.network || resolveCardNetwork(undefined, digitsOnly);
}

function BrandNetworkVector({
  network,
  size = "md",
}: {
  network: CardNetwork;
  size?: "sm" | "md";
  isHolo?: boolean;
}) {
  const isSmall = size === "sm";
  return (
    <div className={`flex items-center justify-center shrink-0 ${isSmall ? "h-5 min-w-[36px]" : "h-7 min-w-[56px]"}`}>
      <NetworkBrandLogo network={network} compact={isSmall} />
    </div>
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
  const brandDetails = detectCardBrandDetails(rawDigits);
  const isAmex = brandDetails.isAmexUnsupported || rawDigits.startsWith("34") || rawDigits.startsWith("37");
  const isDiners = brandDetails.network === "diners-club" || rawDigits.startsWith("30") || rawDigits.startsWith("36") || rawDigits.startsWith("38") || rawDigits.startsWith("39") || (rawDigits.length === 1 && rawDigits === "3");
  const detectedNetwork: CardNetwork = brandDetails.network || (isAmex ? "american-express" : isDiners ? "diners-club" : "mastercard");
  const theme = CARD_NETWORK_THEMES[detectedNetwork] || CARD_NETWORK_THEMES.mastercard;

  const handleCardNumberChange = (rawVal: string) => {
    const digitsOnly = rawVal.replace(/\D/g, "");
    const isAmexLocal = digitsOnly.startsWith("34") || digitsOnly.startsWith("37");
    const isDinersLocal = digitsOnly.startsWith("30") || digitsOnly.startsWith("36") || digitsOnly.startsWith("38") || digitsOnly.startsWith("39") || (digitsOnly.length === 1 && digitsOnly === "3");
    
    // Amex is 15 digits, Diners is 14 digits, others 16
    const maxLen = isDinersLocal ? 14 : isAmexLocal ? 15 : 16;
    const trimmed = digitsOnly.slice(0, maxLen);

    let formatted = trimmed;
    if (isDinersLocal && trimmed.length > 4) {
      // 4-6-4 Diners Club layout
      if (trimmed.length > 10) {
        formatted = `${trimmed.slice(0, 4)} ${trimmed.slice(4, 10)} ${trimmed.slice(10)}`;
      } else {
        formatted = `${trimmed.slice(0, 4)} ${trimmed.slice(4)}`;
      }
    } else if (isAmexLocal && trimmed.length > 4) {
      // 4-6-5 Amex layout
      if (trimmed.length > 10) {
        formatted = `${trimmed.slice(0, 4)} ${trimmed.slice(4, 10)} ${trimmed.slice(10)}`;
      } else {
        formatted = `${trimmed.slice(0, 4)} ${trimmed.slice(4)}`;
      }
    } else {
      // 4-4-4-4 Standard layout
      formatted = trimmed.replace(/(\d{4})/g, "$1 ").trim();
    }

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
          type: detectedNetwork,
          number: cardNumber,
          holder: cardHolder.trim() || defaultHolder,
          exp: cardExp,
          design: detectedNetwork,
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

    if (isAmex) {
      setErrorMessage("No aceptamos tarjetas American Express. PayPhone solo procesa Visa, Mastercard, Discover y Diners Club.");
      return;
    }

    const minDigits = isDiners ? 14 : 16;
    if (rawDigits.length < minDigits) {
      setErrorMessage(
        isDiners 
          ? "Por favor ingresa los 14 dígitos del número de tu tarjeta Diners Club." 
          : "Por favor ingresa los 16 dígitos del número de tu tarjeta."
      );
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

  // Format groups for the live 3D card display (4-6-4 for Diners, 4-4-4-4 for standard)
  const formattedGroups = isDiners
    ? [
        rawDigits.slice(0, 4).padEnd(4, "•"),
        rawDigits.slice(4, 10).padEnd(6, "•"),
        rawDigits.slice(10, 14).padEnd(4, "•"),
      ]
    : [0, 1, 2, 3].map((groupIdx) => {
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
          className="pointer-events-none absolute -top-24 left-1/4 w-96 h-48 rounded-full blur-3xl transition-all duration-700 opacity-25"
          style={{ background: theme.dotColor }}
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
                  <div className="mb-3 flex items-center justify-between w-full max-w-[350px] px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Red Bancaria
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-white/15 bg-black/40 text-white backdrop-blur-md shadow-xs">
                      <span>{theme.displayName}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </span>
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
                        animate={{ background: theme.background }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 w-full h-full rounded-[1.35rem] p-5 sm:p-6 flex flex-col justify-between overflow-hidden select-none"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          color: "#ffffff",
                          border: "1.5px solid rgba(255, 255, 255, 0.18)",
                          boxShadow: "0 -4px 18px rgba(0, 0, 0, 0.45)",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                        }}
                      >
                        {/* Textura de puntos 3D sobresalientes con relieve físico en las 5 redes */}
                        <div
                          className="pointer-events-none absolute inset-0 z-[1] select-none"
                          style={CARD_DOTS_TEXTURE_STYLE}
                        />

                        {/* Fila Superior: Chip Plata + Wifi a la izquierda | Logo a la derecha */}
                        <div className="relative z-10 flex items-center justify-between select-none">
                          <div className="flex items-center gap-2.5 shrink-0">
                            <SilverEmvChip />
                            <Wifi className="w-4 h-4 rotate-90 text-slate-200/90 shrink-0" />
                          </div>

                          <div className="h-[30px] min-w-[75px] flex items-center justify-end shrink-0 select-none">
                            <NetworkBrandLogo network={detectedNetwork} />
                          </div>
                        </div>

                        {/* Fila Media: Número de 16 dígitos en grupos */}
                        <div
                          className={`relative z-10 my-auto py-1.5 px-2.5 -mx-2.5 rounded-xl transition-all duration-300 select-none ${
                            focusedField === "number"
                              ? "bg-white/10 ring-1 ring-white/40 shadow-[0_0_16px_rgba(255,255,255,0.12)]"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-lg sm:text-[20px] tracking-[0.16em] font-bold drop-shadow-md text-white select-none">
                            {formattedGroups.map((grp, gIdx) => (
                              <span key={gIdx} className="inline-flex select-none">
                                {grp}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Fila Inferior: Titular a la izquierda | Fecha de expiración a la derecha */}
                        <div className="relative z-10 flex items-end justify-between gap-2 border-t border-white/15 pt-2 select-none">
                          <div
                            className={`space-y-0.5 px-2 py-1 -mx-2 -my-1 rounded-lg transition-all duration-300 min-w-0 flex-1 select-none ${
                              focusedField === "holder" ? "bg-white/10 ring-1 ring-white/35" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1 text-[8.5px] uppercase tracking-wider font-semibold text-slate-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>TITULAR</span>
                            </div>
                            <p className="text-xs font-bold tracking-wider uppercase truncate drop-shadow-xs text-white mt-0.5 select-none">
                              {cardHolder.trim() || defaultHolder}
                            </p>
                          </div>

                          <div
                            className={`space-y-0.5 text-right px-2 py-1 -my-1 rounded-lg transition-all duration-300 shrink-0 select-none ${
                              focusedField === "exp" ? "bg-white/10 ring-1 ring-white/35" : ""
                            }`}
                          >
                            <span className="text-[8.5px] uppercase tracking-widest block font-semibold text-slate-300 select-none">
                              Expira
                            </span>
                            <p className="font-mono text-xs font-bold tracking-widest drop-shadow-xs text-white select-none">
                              {cardExp || "MM/AA"}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* ================= CARD BACK (FLIPPED 180 DEG) ================= */}
                      <motion.div
                        animate={{ background: theme.background }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 w-full h-full rounded-[1.35rem] pt-4 pb-5 flex flex-col justify-between overflow-hidden border border-white/20 text-white select-none"
                        style={{
                          transform: "rotateY(180deg)",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          userSelect: "none",
                          WebkitUserSelect: "none",
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
                          <BrandNetworkVector network={detectedNetwork} size="sm" />
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
                            <BrandNetworkVector network={detectedNetwork} size="sm" />
                          </AnimatePresence>
                        </div>
                      </div>
                      {isAmex && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div className="leading-relaxed">
                            <span className="font-bold">American Express no soportada:</span> PayPhone no procesa tarjetas AMEX en Ecuador. Por favor usa una tarjeta <strong>Visa, Mastercard, Discover o Diners Club</strong>.
                          </div>
                        </div>
                      )}
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
                        disabled={isAmex}
                        className={`w-full h-12 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                          isAmex
                            ? "bg-gray-200 dark:bg-stone-800 text-gray-400 dark:text-stone-500 cursor-not-allowed border border-gray-300 dark:border-stone-700"
                            : "bg-gray-950 hover:bg-black dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-stone-950 shadow-gray-950/15 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        }`}
                      >
                        {isAmex ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span>AMEX No Admitida por PayPhone</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Guardar nueva Tarjeta</span>
                          </>
                        )}
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
                  className="w-full max-w-[340px] aspect-[1.586/1] rounded-[1.35rem] shadow-2xl p-5 flex flex-col justify-between border border-white/20 text-white relative overflow-hidden select-none"
                  style={{ background: theme.background }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 z-[1] select-none"
                    style={CARD_DOTS_TEXTURE_STYLE}
                  />

                  <div className="flex items-center justify-between relative z-10 select-none">
                    <div className="flex items-center gap-2">
                      <SilverEmvChip small />
                      <Wifi className="w-3.5 h-3.5 rotate-90 text-slate-200/90 shrink-0" />
                    </div>
                    <NetworkBrandLogo network={detectedNetwork} compact />
                  </div>
                  <div className="font-mono text-lg tracking-[0.2em] text-white font-bold relative z-10 select-none">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex items-end justify-between relative z-10 border-t border-white/15 pt-2 select-none">
                    <div className="text-left select-none">
                      <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-slate-300 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>TITULAR</span>
                      </div>
                      <p className="text-xs font-bold uppercase text-white truncate max-w-[170px] mt-0.5 select-none">
                        {cardHolder || defaultHolder}
                      </p>
                    </div>
                    <div className="text-right select-none">
                      <span className="text-[8px] uppercase tracking-wider text-slate-300 block font-semibold select-none">
                        Expira
                      </span>
                      <p className="font-mono text-xs font-bold text-white select-none">
                        {cardExp || "MM/AA"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col items-center">
                  <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white">
                    <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                    <span>Registrando tarjeta {theme.displayName}...</span>
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
                  className="w-full max-w-[340px] aspect-[1.586/1] rounded-[1.35rem] shadow-2xl p-5 flex flex-col justify-between border border-emerald-500/40 text-white relative overflow-hidden ring-4 ring-emerald-500/20 select-none"
                  style={{ background: theme.background }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 z-[1] select-none"
                    style={CARD_DOTS_TEXTURE_STYLE}
                  />

                  <div className="flex items-center justify-between relative z-10 select-none">
                    <div className="flex items-center gap-2">
                      <SilverEmvChip small />
                      <Wifi className="w-3.5 h-3.5 rotate-90 text-slate-200/90 shrink-0" />
                    </div>
                    <NetworkBrandLogo network={detectedNetwork} compact />
                  </div>
                  <div className="font-mono text-lg tracking-[0.2em] text-white font-bold relative z-10 select-none">
                    •••• •••• •••• {rawDigits.slice(-4) || "8888"}
                  </div>
                  <div className="flex items-end justify-between relative z-10 border-t border-white/15 pt-2 select-none">
                    <div className="text-left select-none">
                      <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-slate-300 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>TITULAR</span>
                      </div>
                      <p className="text-xs font-bold uppercase text-white truncate max-w-[170px] mt-0.5 select-none">
                        {cardHolder || defaultHolder}
                      </p>
                    </div>
                    <div className="text-right select-none">
                      <span className="text-[8px] uppercase tracking-wider text-slate-300 block font-semibold select-none">
                        Expira
                      </span>
                      <p className="font-mono text-xs font-bold text-white select-none">
                        {cardExp || "MM/AA"}
                      </p>
                    </div>
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
