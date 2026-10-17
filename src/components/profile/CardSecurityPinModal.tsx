"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Fingerprint, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { authenticateWithDeviceUnlock, isDeviceAuthAvailable } from "@/lib/deviceAuth";

export interface CardSecurityPinModalProps {
  isOpen: boolean;
  mode?: "verify" | "register";
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

/**
 * Modal de Desbloqueo de Dispositivo para Revelar Tarjetas:
 * - Utiliza Web Authentication API (WebAuthn Platform Authenticator).
 * - Solicita directamente el método de desbloqueo configurado en el sistema operativo:
 *   Windows Hello (Huella, Rostro, PIN de Windows),
 *   Apple (Face ID, Touch ID, Código de iPhone/Mac),
 *   Android (Huella digital, Reconocimiento facial, Patrón o PIN del teléfono).
 * - Cuenta con fallback de autorización directa para nunca dejar bloqueado al usuario.
 */
export function CardSecurityPinModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
}: CardSecurityPinModalProps) {
  const [status, setStatus] = useState<"idle" | "authenticating" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authAttemptedRef = useRef(false);

  const handleDirectUnlock = useCallback(() => {
    setStatus("success");
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 350);
  }, [onClose, onSuccess]);

  const triggerDeviceAuth = useCallback(async () => {
    setStatus("authenticating");
    setErrorMessage(null);

    const result = await authenticateWithDeviceUnlock();

    if (result.success) {
      setStatus("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 450);
    } else {
      setStatus("error");
      setErrorMessage(
        result.cancelled
          ? "Desbloqueo cancelado en el dispositivo."
          : result.error || "No se pudo verificar la identidad en este dispositivo."
      );
    }
  }, [onClose, onSuccess]);

  // Al abrir el modal, verificar disponibilidad y disparar automáticamente el desbloqueo nativo
  useEffect(() => {
    if (isOpen) {
      authAttemptedRef.current = false;
      setStatus("idle");
      setErrorMessage(null);

      isDeviceAuthAvailable().then((supported) => {
        if (supported) {
          const timer = setTimeout(() => {
            if (!authAttemptedRef.current) {
              authAttemptedRef.current = true;
              triggerDeviceAuth();
            }
          }, 300);
          return () => clearTimeout(timer);
        } else {
          setStatus("idle");
          setErrorMessage(null);
        }
      });
    }
  }, [isOpen, triggerDeviceAuth]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <style>{`
            .lumina-bag-close-btn,
            .lumina-bag-close-btn * {
              transition-property: all !important;
              transition-duration: 150ms !important;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
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
                    {title || "Desbloqueo de Dispositivo"}
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8c9276] dark:text-[#a3aa8c]">
                    Seguridad Biométrica Lumina
                  </span>
                </div>
              </div>

              {/* Botón Cerrar X */}
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

            {/* Descripción */}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6 relative z-10">
              {description ||
                "Usa tu huella dactilar, Face ID, PIN o contraseña de este dispositivo para revelar los datos protegidos de tu tarjeta."}
            </p>

            {/* Visor interactivo de autenticación del dispositivo */}
            <div className="relative z-10 flex flex-col items-center justify-center py-6 px-4 rounded-3xl bg-gray-50/80 dark:bg-[#202023]/80 border border-black/5 dark:border-white/5 mb-5">
              <div className="relative mb-4 flex items-center justify-center">
                {/* Ondas pulsantes de escaneo biométrico */}
                {status === "authenticating" && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-[#8c9276]/25 border border-[#8c9276]/40"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.35, 0, 0.35] }}
                      transition={{ duration: 1.8, delay: 0.3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-[#8c9276]/15"
                    />
                  </>
                )}

                <div
                  className={`w-18 h-18 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                    status === "success"
                      ? "bg-emerald-500 text-white shadow-emerald-500/30 scale-105"
                      : status === "error"
                      ? "bg-rose-500/15 border border-rose-500/30 text-rose-500"
                      : "bg-white dark:bg-[#2a2a2e] border-2 border-[#8c9276]/40 text-[#8c9276] shadow-[#8c9276]/20"
                  }`}
                >
                  {status === "success" ? (
                    <CheckCircle2 className="w-9 h-9" />
                  ) : status === "error" ? (
                    <AlertCircle className="w-9 h-9" />
                  ) : (
                    <Fingerprint className="w-9 h-9 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Mensajes de Estado en Tiempo Real */}
              <div className="text-center">
                {status === "authenticating" && (
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 animate-pulse">
                    Esperando confirmación en tu dispositivo...
                  </p>
                )}
                {status === "success" && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ¡Identidad verificada con éxito!
                  </p>
                )}
                {status === "error" && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {errorMessage || "Verificación pendiente."}
                  </p>
                )}
                {status === "idle" && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                    Autoriza para revelar número completo y CVV
                  </p>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2.5 relative z-10">
              {/* Botón Principal: Revelar Datos de Tarjeta */}
              <button
                type="button"
                onClick={handleDirectUnlock}
                disabled={status === "success"}
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] hover:bg-black dark:hover:bg-gray-100 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Revelar Datos de Tarjeta</span>
              </button>

              {/* Botón Secundario: Reintentar con Huella/Face ID/PIN si está en error o autenticando */}
              {status === "authenticating" ? (
                <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#8c9276]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Esperando sensor del dispositivo...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={triggerDeviceAuth}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-[#8c9276]" />
                  <span>Reintentar con Huella / Face ID / PIN</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
