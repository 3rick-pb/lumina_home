"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, KeyRound, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { 
  hasCardSecurityPin, 
  setCardSecurityPin, 
  verifyCardSecurityPin 
} from "@/lib/cardSecurityStore";

export interface CardSecurityPinModalProps {
  isOpen: boolean;
  mode?: "verify" | "register";
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function CardSecurityPinModal({
  isOpen,
  mode: initialMode,
  onClose,
  onSuccess,
  title,
  description,
}: CardSecurityPinModalProps) {
  const [mode, setMode] = useState<"verify" | "register">("verify");
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", ""]);
  const [confirmDigits, setConfirmDigits] = useState<string[]>(["", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWiggling, setIsWiggling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const confirmRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Determine actual mode based on whether a PIN already exists
  useEffect(() => {
    if (isOpen) {
      const pinExists = hasCardSecurityPin();
      if (!pinExists || initialMode === "register") {
        setMode("register");
      } else {
        setMode("verify");
      }
      setPinDigits(["", "", "", "", ""]);
      setConfirmDigits(["", "", "", "", ""]);
      setErrorMsg(null);
      setIsWiggling(false);

      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, initialMode]);

  const handleDigitChange = (index: number, val: string, isConfirm = false) => {
    setErrorMsg(null);
    const cleaned = val.replace(/\D/g, "");
    const targetDigits = isConfirm ? [...confirmDigits] : [...pinDigits];
    const setDigits = isConfirm ? setConfirmDigits : setPinDigits;
    const refs = isConfirm ? confirmRefs : inputRefs;

    if (!cleaned) {
      targetDigits[index] = "";
      setDigits(targetDigits);
      return;
    }

    // Single or pasted digits
    if (cleaned.length === 1) {
      targetDigits[index] = cleaned;
      setDigits(targetDigits);
      // Auto-advance
      if (index < 4) {
        refs.current[index + 1]?.focus();
      }
    } else {
      // Pasted multiple digits
      const pasted = cleaned.slice(0, 5).split("");
      pasted.forEach((char, pIdx) => {
        if (index + pIdx < 5) {
          targetDigits[index + pIdx] = char;
        }
      });
      setDigits(targetDigits);
      const nextIdx = Math.min(4, index + pasted.length);
      refs.current[nextIdx]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    isConfirm = false
  ) => {
    const targetDigits = isConfirm ? confirmDigits : pinDigits;
    const refs = isConfirm ? confirmRefs : inputRefs;

    if (e.key === "Backspace" && !targetDigits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const triggerWiggle = (message: string) => {
    setErrorMsg(message);
    setIsWiggling(true);
    setPinDigits(["", "", "", "", ""]);
    setConfirmDigits(["", "", "", "", ""]);
    setTimeout(() => {
      setIsWiggling(false);
      inputRefs.current[0]?.focus();
    }, 600);
  };

  const handleSubmit = async () => {
    const pin = pinDigits.join("");

    if (pin.length !== 5) {
      triggerWiggle("Por favor ingresa los 5 dígitos completos.");
      return;
    }

    if (mode === "register") {
      const confirmPin = confirmDigits.join("");
      if (confirmPin.length !== 5) {
        triggerWiggle("Por favor confirma los 5 dígitos de tu PIN.");
        return;
      }
      if (pin !== confirmPin) {
        triggerWiggle("Los códigos no coinciden. Intenta de nuevo.");
        return;
      }

      setIsSubmitting(true);
      try {
        const saved = await setCardSecurityPin(pin);
        if (saved) {
          onSuccess();
          onClose();
        } else {
          triggerWiggle("No se pudo guardar el PIN de seguridad.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al registrar PIN.";
        triggerWiggle(msg);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Verify mode
      setIsSubmitting(true);
      try {
        const valid = await verifyCardSecurityPin(pin);
        if (valid) {
          onSuccess();
          onClose();
        } else {
          triggerWiggle("PIN incorrecto. Intenta de nuevo.");
        }
      } catch {
        triggerWiggle("Error de verificación de PIN.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Auto-submit in verify mode when 5th digit is filled
  useEffect(() => {
    if (mode === "verify" && pinDigits.every((d) => d.length === 1)) {
      handleSubmit();
    }
  }, [pinDigits, mode]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          {/* Estilo idéntico a OrderDetailModal para el botón X */}
          <style>{`
            .lumina-bag-close-btn,
            .lumina-bag-close-btn * {
              transition-property: all !important;
              transition-duration: 150ms !important;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={
              isWiggling
                ? {
                    x: [0, -10, 10, -8, 8, -4, 4, 0],
                    scale: [1, 1.02, 0.98, 1.01, 1],
                  }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="w-full max-w-sm rounded-[2.25rem] bg-white dark:bg-[#1a1a1d] border border-black/10 dark:border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.35)] p-6 sm:p-7 relative select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con botón X idéntico a OrderDetailModal */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                  {mode === "register" ? (
                    <KeyRound className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                    {title || (mode === "register" ? "Registra tu PIN de 5 dígitos" : "Ingresa tu PIN de 5 dígitos")}
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Seguridad de Billetera
                  </span>
                </div>
              </div>

              {/* Botón X idéntico de detalles de pedido */}
              <button
                type="button"
                onClick={onClose}
                className="lumina-bag-close-btn w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Cerrar ventana"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
              {description ||
                (mode === "register"
                  ? "Para proteger tus tarjetas y autorizar la revelación de datos sensibles (número completo y CVV), establece un código de 5 dígitos."
                  : "Autoriza el desbloqueo para revelar el número completo y CVV de tu tarjeta.")}
            </p>

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* 5 PIN Input Boxes */}
            <div className="space-y-4">
              <div>
                {mode === "register" && (
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Nuevo PIN (5 dígitos):
                  </label>
                )}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {pinDigits.map((digit, idx) => (
                    <input
                      key={`pin-${idx}`}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value, false)}
                      onKeyDown={(e) => handleKeyDown(idx, e, false)}
                      className="w-12 h-14 sm:w-12.5 sm:h-14 rounded-2xl border-2 border-black/10 dark:border-white/15 bg-zinc-50 dark:bg-zinc-800/80 text-center text-xl font-bold font-mono outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-zinc-900 dark:text-white transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Confirm PIN in register mode */}
              {mode === "register" && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Confirmar PIN (5 dígitos):
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {confirmDigits.map((digit, idx) => (
                      <input
                        key={`confirm-${idx}`}
                        ref={(el) => {
                          confirmRefs.current[idx] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value, true)}
                        onKeyDown={(e) => handleKeyDown(idx, e, true)}
                        className="w-12 h-14 sm:w-12.5 sm:h-14 rounded-2xl border-2 border-black/10 dark:border-white/15 bg-zinc-50 dark:bg-zinc-800/80 text-center text-xl font-bold font-mono outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-zinc-900 dark:text-white transition-all"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || pinDigits.some((d) => !d)}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-stone-950 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{mode === "register" ? "Guardar PIN" : "Desbloquear"}</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-zinc-400 font-mono pt-1">
                Presiona <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border font-bold">ENTER</kbd> para confirmar
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
