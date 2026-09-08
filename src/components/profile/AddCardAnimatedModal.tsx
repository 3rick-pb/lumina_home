"use client";

import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";

export interface AddCardAnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: {
    type: "visa" | "mastercard";
    number: string;
    holder: string;
    exp: string;
  }) => Promise<void> | void;
  defaultHolder?: string;
}

export function AddCardAnimatedModal({
  isOpen,
  onClose,
  onSaveCard,
  defaultHolder = "LUMINA CLIENT",
}: AddCardAnimatedModalProps) {
  // Form State
  const [cardHolder, setCardHolder] = useState(defaultHolder || "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardType, setCardType] = useState<"visa" | "mastercard">("visa");

  // Interaction & Flow State
  const [isFlipped, setIsFlipped] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect card brand based on starting digits
  const handleCardNumberChange = (rawVal: string) => {
    const digitsOnly = rawVal.replace(/\D/g, "").slice(0, 16);
    // Auto-detect Visa (starts with 4) or Mastercard (starts with 5 or 2)
    if (digitsOnly.startsWith("4")) {
      setCardType("visa");
    } else if (digitsOnly.startsWith("5") || digitsOnly.startsWith("2")) {
      setCardType("mastercard");
    }

    // Format with spaces every 4 digits
    const formatted = digitsOnly.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  const handleExpChange = (rawVal: string) => {
    let digits = rawVal.replace(/\D/g, "").slice(0, 4);
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
    setStep("form");
    setIsFlipped(false);
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawDigits = cardNumber.replace(/\s/g, "");
    if (rawDigits.length < 15) {
      setErrorMessage("Por favor ingresa un número de tarjeta válido de 16 dígitos.");
      return;
    }
    if (cardExp.length < 5) {
      setErrorMessage("Por favor ingresa una fecha de expiración válida (MM/AA).");
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMessage("Por favor ingresa el código de seguridad CVV (3 o 4 dígitos).");
      return;
    }

    // Flip back to front and trigger processing state
    setIsFlipped(false);
    setStep("processing");

    // Processing animation time (2.3s) exactly matching the video
    setTimeout(async () => {
      try {
        await onSaveCard({
          type: cardType,
          number: cardNumber,
          holder: cardHolder.trim() || defaultHolder,
          exp: cardExp,
        });

        setStep("success");

        // Auto close after success view
        setTimeout(() => {
          handleResetAndClose();
        }, 1800);
      } catch {
        setStep("form");
        setErrorMessage("Ocurrió un error al registrar la tarjeta. Intenta nuevamente.");
      }
    }, 2300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-[#18181a] border border-gray-200/90 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500"
        style={{ minHeight: "460px" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-800 dark:text-gray-200">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-950 dark:text-white">
                Método de Pago Seguro
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Vincular tarjeta con cifrado bancario PCI-DSS
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            disabled={step === "processing"}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Transitions between split form and centered verification */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div
                key="form-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                {/* LEFT COLUMN: 3D FLIPPING CARD */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center">
                  <div 
                    className="w-full max-w-[340px] aspect-[1.586/1] rounded-2xl cursor-pointer select-none"
                    style={{ perspective: 1200 }}
                    onClick={() => setIsFlipped(!isFlipped)}
                    title="Haz clic para girar la tarjeta"
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 220, damping: 24 }}
                      className="relative w-full h-full rounded-2xl shadow-xl transition-shadow duration-300"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* ================= CARD FRONT ================= */}
                      <div 
                        className={`absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col justify-between overflow-hidden border border-white/20 text-white ${
                          cardType === "mastercard"
                            ? "bg-gradient-to-br from-[#1c1c1f] via-[#242429] to-[#0f0f11]"
                            : "bg-gradient-to-br from-[#1a2b4c] via-[#101b30] to-[#0a101d]"
                        }`}
                        style={{ 
                          backfaceVisibility: "hidden", 
                          WebkitBackfaceVisibility: "hidden" 
                        }}
                      >
                        {/* Metallic Shimmer Overlays */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)] pointer-events-none" />
                        <div className="absolute -inset-x-20 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                        {/* Top: Chip, NFC & Platinum Badge */}
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Gold EMV Chip */}
                            <div className="w-10 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-1 border border-yellow-300/80 shadow-md flex flex-col justify-between">
                              <div className="w-full h-1 border-b border-amber-600/40" />
                              <div className="flex justify-between w-full h-2">
                                <div className="w-1/2 border-r border-amber-600/40" />
                                <div className="w-1/2" />
                              </div>
                              <div className="w-full h-1 border-t border-amber-600/40" />
                            </div>

                            {/* Contactless NFC Icon */}
                            <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M8.5 16.5a5 5 0 0 1 0-9" strokeLinecap="round" />
                              <path d="M12 19a8.5 8.5 0 0 0 0-14" strokeLinecap="round" />
                              <path d="M15.5 21.5a12 12 0 0 0 0-19" strokeLinecap="round" />
                            </svg>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] tracking-[0.2em] font-black uppercase text-white/80 drop-shadow-sm">
                              PLATINUM
                            </span>
                            <div className="text-[9px] text-white/40 tracking-wider">LUMINA PRIVILEGE</div>
                          </div>
                        </div>

                        {/* Middle: 16-Digit Number */}
                        <div className="relative z-10 my-auto">
                          <p className="font-mono text-lg sm:text-xl tracking-[0.2em] text-white font-semibold drop-shadow-md">
                            {cardNumber || "•••• •••• •••• ••••"}
                          </p>
                        </div>

                        {/* Bottom: Holder, Expiry & Network Logo */}
                        <div className="relative z-10 flex items-end justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider text-white/50 block font-semibold">
                              Titular de la Tarjeta
                            </span>
                            <p className="text-xs font-bold tracking-wider uppercase text-white truncate max-w-[170px] drop-shadow-sm">
                              {cardHolder || defaultHolder}
                            </p>
                          </div>

                          <div className="space-y-0.5 text-center">
                            <span className="text-[9px] uppercase tracking-wider text-white/50 block font-semibold">
                              Expira
                            </span>
                            <p className="font-mono text-xs font-bold tracking-widest text-white drop-shadow-sm">
                              {cardExp || "MM/AA"}
                            </p>
                          </div>

                          {/* Brand Logo */}
                          <div className="h-7 w-12 flex items-center justify-end">
                            {cardType === "visa" ? (
                              <div className="font-black italic text-lg tracking-tighter text-white drop-shadow-md">
                                VISA
                              </div>
                            ) : (
                              <div className="flex -space-x-2 items-center">
                                <div className="w-6 h-6 rounded-full bg-[#EB001B] shadow-sm" />
                                <div className="w-6 h-6 rounded-full bg-[#F79E1B] shadow-sm opacity-90" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ================= CARD BACK (FLIPPED 180 DEG) ================= */}
                      <div 
                        className={`absolute inset-0 w-full h-full rounded-2xl pt-4 pb-5 flex flex-col justify-between overflow-hidden border border-white/20 text-white ${
                          cardType === "mastercard"
                            ? "bg-gradient-to-br from-[#17171a] via-[#1f1f24] to-[#0c0c0e]"
                            : "bg-gradient-to-br from-[#121c30] via-[#0d1626] to-[#060a12]"
                        }`}
                        style={{ 
                          transform: "rotateY(180deg)", 
                          backfaceVisibility: "hidden", 
                          WebkitBackfaceVisibility: "hidden" 
                        }}
                      >
                        {/* Black Magnetic Stripe */}
                        <div className="w-full h-10 bg-black/95 shadow-inner" />

                        {/* Signature Strip & CVV */}
                        <div className="px-5 space-y-1">
                          <div className="flex items-center justify-between text-[8px] text-white/50 uppercase tracking-wider">
                            <span>Firma Autorizada</span>
                            <span>Código de Seguridad</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-7 bg-white/90 rounded-xs flex items-center px-3 pattern-lines">
                              <span className="text-[10px] font-mono text-gray-500 italic select-none">
                                Lumina Authorized Customer
                              </span>
                            </div>

                            <div className="w-14 h-7 bg-white rounded-xs border border-gray-300 flex items-center justify-center font-mono font-black text-xs text-gray-900 shadow-inner">
                              {cardCvv || "•••"}
                            </div>
                          </div>
                        </div>

                        {/* Security Disclaimers & Issuer */}
                        <div className="px-5 flex items-center justify-between text-[8px] text-white/40">
                          <div className="max-w-[200px] leading-tight">
                            Esta tarjeta está protegida por encriptación avanzada y autenticación bancaria de doble factor.
                          </div>
                          <div className="font-bold text-white/60 tracking-wider uppercase text-[9px]">
                            {cardType.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Badges below card */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>256-Bit SSL Encrypted</span>
                    </div>
                    <span className="text-gray-300 dark:text-white/10">•</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>PCI-DSS Compliant</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: FORM INPUTS */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Network Selector Tabs */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                      Red Bancaria
                    </label>

                    <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setCardType("visa")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cardType === "visa"
                            ? "bg-white dark:bg-[#252528] text-gray-950 dark:text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
                        }`}
                      >
                        Visa
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardType("mastercard")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cardType === "mastercard"
                            ? "bg-white dark:bg-[#252528] text-gray-950 dark:text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
                        }`}
                      >
                        Mastercard
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Input 1: Cardholder Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Nombre del Titular
                      </label>
                      <div className="relative flex items-center">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 absolute left-2.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          onFocus={() => setIsFlipped(false)}
                          placeholder="Ej: MARÍA GONZÁLEZ"
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold uppercase bg-white dark:bg-[#202022] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8c9276] transition-all"
                        />
                      </div>
                    </div>

                    {/* Input 2: Card Number */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Número de Tarjeta (16 Dígitos)
                      </label>
                      <div className="relative flex items-center">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 absolute left-2.5">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          onFocus={() => setIsFlipped(false)}
                          placeholder="4535 3453 4534 5435"
                          className="w-full pl-11 pr-16 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono font-bold bg-white dark:bg-[#202022] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8c9276] transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {cardType === "visa" ? (
                            <span className="text-[11px] font-black italic text-blue-600 dark:text-blue-400">
                              VISA
                            </span>
                          ) : (
                            <div className="flex -space-x-1 items-center">
                              <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inputs 3 & 4: Expiry Date & CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                          Fecha de Expiración
                        </label>
                        <div className="relative flex items-center">
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 absolute left-2.5">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExp}
                            onChange={(e) => handleExpChange(e.target.value)}
                            onFocus={() => setIsFlipped(false)}
                            placeholder="12/28"
                            className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono font-bold bg-white dark:bg-[#202022] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8c9276] transition-all"
                          />
                        </div>
                      </div>

                      {/* CVV Input - FLIPS CARD ON FOCUS */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                            CVC / CVV
                          </label>
                          <span className="text-[10px] text-gray-400">Reverso</span>
                        </div>
                        <div className="relative flex items-center">
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 absolute left-2.5">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => handleCvvChange(e.target.value)}
                            onFocus={() => setIsFlipped(true)}
                            onBlur={() => setIsFlipped(false)}
                            placeholder="•••"
                            className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono font-bold bg-white dark:bg-[#202022] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8c9276] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs font-medium">
                        {errorMessage}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-gray-950 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Guardar y Vincular Tarjeta</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* PROCESSING STATE (CARD MOVES TO DEAD CENTER, WITH BANK SPINNER) */}
            {step === "processing" && (
              <motion.div
                key="processing-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-6 text-center space-y-6"
              >
                {/* Centered Platinum Card */}
                <div 
                  className="w-full max-w-[340px] aspect-[1.586/1] rounded-2xl shadow-2xl p-5 flex flex-col justify-between border border-white/20 text-white relative overflow-hidden"
                  style={{
                    background: cardType === "mastercard"
                      ? "linear-gradient(135deg, #1c1c1f 0%, #242429 50%, #0f0f11 100%)"
                      : "linear-gradient(135deg, #1a2b4c 0%, #101b30 50%, #0a101d 100%)",
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_60%)] pointer-events-none" />

                  {/* Top */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="w-10 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-1 border border-yellow-300 shadow-md" />
                    <span className="text-[10px] tracking-[0.2em] font-black uppercase text-white/80">
                      PLATINUM
                    </span>
                  </div>

                  {/* Middle */}
                  <div className="font-mono text-lg tracking-[0.2em] text-white font-bold relative z-10">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  {/* Bottom */}
                  <div className="flex items-end justify-between relative z-10">
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-white/50 block">Titular</span>
                      <p className="text-xs font-bold uppercase text-white truncate max-w-[170px]">
                        {cardHolder || defaultHolder}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] uppercase tracking-wider text-white/50 block">Expira</span>
                      <p className="font-mono text-xs font-bold text-white">{cardExp || "MM/AA"}</p>
                    </div>
                    <div className="h-6 flex items-center">
                      {cardType === "visa" ? (
                        <span className="font-black italic text-lg tracking-tighter text-white">VISA</span>
                      ) : (
                        <div className="flex -space-x-2">
                          <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
                          <div className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pulsing Status Loader */}
                <div className="space-y-2 flex flex-col items-center">
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 dark:text-white">
                    <Loader2 className="w-4 h-4 text-[#8c9276] animate-spin" />
                    <span>Processing Secure Transaction...</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Verificando parámetros criptográficos con la red bancaria
                  </p>
                </div>
              </motion.div>
            )}

            {/* SUCCESS STATE (CARD CENTERED + GREEN BADGE) */}
            {step === "success" && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="flex flex-col items-center justify-center py-6 text-center space-y-6"
              >
                {/* Centered Platinum Card with Success Glow */}
                <div 
                  className="w-full max-w-[340px] aspect-[1.586/1] rounded-2xl shadow-2xl p-5 flex flex-col justify-between border border-emerald-500/40 text-white relative overflow-hidden ring-4 ring-emerald-500/20"
                  style={{
                    background: cardType === "mastercard"
                      ? "linear-gradient(135deg, #1c1c1f 0%, #242429 50%, #0f0f11 100%)"
                      : "linear-gradient(135deg, #1a2b4c 0%, #101b30 50%, #0a101d 100%)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-1 border border-yellow-300" />
                    <span className="text-[10px] tracking-[0.2em] font-black uppercase text-white/80">
                      PLATINUM
                    </span>
                  </div>

                  <div className="font-mono text-lg tracking-[0.2em] text-white font-bold">
                    •••• •••• •••• {cardNumber.slice(-4) || "8888"}
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="text-left">
                      <span className="text-[8px] uppercase tracking-wider text-white/50 block">Titular</span>
                      <p className="text-xs font-bold uppercase text-white truncate max-w-[170px]">
                        {cardHolder || defaultHolder}
                      </p>
                    </div>
                    <div className="h-6 flex items-center">
                      {cardType === "visa" ? (
                        <span className="font-black italic text-lg tracking-tighter text-white">VISA</span>
                      ) : (
                        <div className="flex -space-x-2">
                          <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
                          <div className="w-5 h-5 rounded-full bg-[#F79E1B] opacity-90" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Success Message Banner */}
                <div className="space-y-1.5 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-950 dark:text-white">
                    ¡Payment Method Saved!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                    Tu tarjeta {cardType.toUpperCase()} terminada en •••• {cardNumber.slice(-4) || "8888"} ha sido verificada y vinculada exitosamente a tu cuenta.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
