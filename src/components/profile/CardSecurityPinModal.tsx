"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export interface CardSecurityPinModalProps {
  isOpen: boolean;
  mode?: "verify" | "register";
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

/**
 * Modal Minimalista de PIN de Seguridad Lumina (Fallback Automático)
 * Diseñado para dispositivos o entornos sin sensor biométrico de plataforma disponible.
 */
export function CardSecurityPinModal({
  isOpen,
  mode,
  onClose,
  onSuccess,
  title,
  description,
}: CardSecurityPinModalProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (isOpen) {
      setPin(["", "", "", ""]);
      setError(null);
      setSuccess(false);
      setIsVerifying(false);
      setTimeout(() => {
        inputRefs[0]?.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError(null);

    if (digit && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }

    // Si completó los 4 dígitos, verificar automáticamente
    if (newPin.every((d) => d !== "")) {
      verifyPin(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const verifyPin = async (fullPin: string) => {
    try {
      setIsVerifying(true);
      setError(null);

      const res = await fetch("/api/cards/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fallbackPin: fullPin }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 350);
      } else {
        setError(data.error || "El PIN ingresado es incorrecto.");
        setPin(["", "", "", ""]);
        inputRefs[0]?.current?.focus();
      }
    } catch {
      setError("Error al validar el PIN. Inténtalo de nuevo.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <style>{`
            .lumina-pin-close-btn,
            .lumina-pin-close-btn * {
              transition-property: all !important;
              transition-duration: 150ms !important;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full max-w-sm rounded-[2.5rem] bg-white dark:bg-[#1a1a1d] border border-black/10 dark:border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.4)] p-6 sm:p-7 relative select-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Resplandor superior ambiental */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#8c9276]/15 via-transparent to-transparent pointer-events-none" />

            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between gap-3 mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#8c9276]/15 border border-[#8c9276]/25 text-[#737a5f] dark:text-[#a3aa8c] flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-[#8c9276]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                    {title || "PIN de Seguridad"}
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8c9276] dark:text-[#a3aa8c]">
                    Protección de Tarjeta
                  </span>
                </div>
              </div>

              {/* Botón Cerrar X */}
              <button
                type="button"
                onClick={onClose}
                className="lumina-pin-close-btn w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Cerrar ventana"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Descripción */}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6 relative z-10">
              {description ||
                "Introduce un PIN de 4 dígitos para autorizar el acceso y visualizar los datos de tu tarjeta."}
            </p>

            {/* Casillas de los 4 dígitos */}
            <div className="relative z-10 flex items-center justify-center gap-3 mb-6">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={isVerifying || success}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-13 h-14 text-center text-xl font-bold rounded-2xl border transition-all duration-200 outline-none shadow-xs ${
                    digit
                      ? "border-[#8c9276] bg-[#8c9276]/10 text-zinc-900 dark:text-zinc-100"
                      : "border-black/10 dark:border-white/10 bg-gray-50/80 dark:bg-[#202023]/80 text-zinc-900 dark:text-zinc-100"
                  } focus:border-[#8c9276] focus:ring-2 focus:ring-[#8c9276]/30`}
                />
              ))}
            </div>

            {/* Estados de error o verificación */}
            <div className="min-h-[24px] mb-4 text-center">
              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-xs text-[#8c9276] font-medium animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verificando PIN de seguridad...</span>
                </div>
              )}
              {success && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Identidad confirmada!</span>
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Botón de acción */}
            <div className="space-y-2 relative z-10">
              <button
                type="button"
                onClick={() => {
                  if (pin.every((d) => d !== "")) {
                    verifyPin(pin.join(""));
                  } else {
                    setError("Completa los 4 dígitos para continuar.");
                  }
                }}
                disabled={isVerifying || success}
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] hover:bg-black dark:hover:bg-gray-100 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>Autorizar Desbloqueo</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
