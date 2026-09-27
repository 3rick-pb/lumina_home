"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { GoogleWalletIcon } from "@/components/ui/GoogleWalletButton";
import { useBrand } from "@/core/hooks/useBrand";

/**
 * Robust detection of touch / mobile devices vs desktop computers.
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isNarrow = window.innerWidth <= 768;
  const uaMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
  return (hasTouch && isNarrow) || uaMobile;
}

export interface GoogleWalletModalProps {
  open: boolean;
  onClose: () => void;
  member?: {
    id?: string;
    customerName?: string;
    customerEmail?: string;
    memberCode?: string;
    pointsBalance?: number;
    tierName?: string;
  } | null;
}

export function GoogleWalletModal({
  open,
  onClose,
  member,
}: GoogleWalletModalProps) {
  const brand = useBrand();
  const [loading, setLoading] = useState(true);
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch or generate the official Google Wallet Save URL
  const fetchPass = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/wallet/google/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: member?.id,
          customerEmail: member?.customerEmail,
          customerName: member?.customerName,
          memberCode: member?.memberCode,
          pointsBalance: member?.pointsBalance,
          tierName: member?.tierName,
        }),
      });

      const data = await res.json();
      if (data.success && data.saveUrl) {
        setSaveUrl(data.saveUrl);
      } else {
        setErrorMsg(
          data.error || "No pudimos preparar tu tarjeta. Inténtalo nuevamente."
        );
      }
    } catch {
      setErrorMsg(
        "No se pudo conectar con el servidor para preparar tu pase de Google Wallet."
      );
    } finally {
      setLoading(false);
    }
  }, [member]);

  // Request pass whenever modal opens
  useEffect(() => {
    if (open) {
      fetchPass();
    } else {
      setSaveUrl(null);
      setErrorMsg(null);
      setCopied(false);
    }
  }, [open, fetchPass]);

  // Keyboard navigation: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleCopyLink = () => {
    if (!saveUrl) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(saveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Central Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative z-10 w-full max-w-[440px] bg-[#141416] text-white rounded-[2.25rem] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.8)] p-6 sm:p-7 overflow-hidden space-y-5"
          >
            {/* Subtle Brand Auroras */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#8c9276]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Badge & Close Button */}
            <div className="flex items-center justify-between relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[11px] font-semibold tracking-wide">
                <GoogleWalletIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Google Wallet™ Oficial</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5 relative z-10">
              <h3 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight leading-snug">
                Añade tu tarjeta a Google Wallet
              </h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                Escanea este código con la cámara de tu teléfono Android para
                guardar tu tarjeta de cliente al instante.
              </p>
            </div>

            {/* Main Interactive Centerpiece */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {loading && (
                <div className="w-full h-64 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center p-6 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#8c9276] animate-spin" />
                  <p className="text-xs font-semibold text-white/70">
                    Preparando tu tarjeta digital...
                  </p>
                  <p className="text-[10px] text-white/40 font-mono">
                    Conectando con Google Wallet API
                  </p>
                </div>
              )}

              {!loading && errorMsg && (
                <div className="w-full h-64 rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center p-6 space-y-3.5 text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-200">
                      {errorMsg}
                    </p>
                    <p className="text-[10px] text-white/50">
                      Verifica tu conexión y vuelve a intentarlo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchPass}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reintentar</span>
                  </button>
                </div>
              )}

              {!loading && !errorMsg && saveUrl && (
                <div className="w-full flex flex-col items-center space-y-3">
                  {/* High-Contrast Crisp QR Card */}
                  <div className="p-4 bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-gray-100 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=4&ecc=M&data=${encodeURIComponent(
                        saveUrl
                      )}`}
                      alt="Código QR de Google Wallet"
                      className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-2xl select-none"
                    />
                  </div>

                  {/* Customer Credentials Strip */}
                  <div className="w-full p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] px-3.5">
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-[#8c9276] shrink-0" />
                      <span className="font-semibold text-white truncate">
                        {member?.customerName || "Cliente Lumina"}
                      </span>
                    </div>
                    <span className="font-mono text-[#8c9276] font-bold text-xs shrink-0">
                      {member?.memberCode || "LUM-1042-PRV"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Micro-Instructions */}
            {!loading && !errorMsg && saveUrl && (
              <div className="space-y-2 relative z-10 pt-1">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1 font-mono">
                      1
                    </span>
                    <p className="text-[10px] text-white/60 leading-tight">
                      Abre la cámara en Android
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1 font-mono">
                      2
                    </span>
                    <p className="text-[10px] text-white/60 leading-tight">
                      Apunta hacia el código QR
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1 font-mono">
                      3
                    </span>
                    <p className="text-[10px] text-white/60 leading-tight">
                      Guarda en tu Wallet
                    </p>
                  </div>
                </div>

                {/* Bottom Actions: Copy link + Direct Open */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Enlace Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white/60" />
                        <span>Copiar enlace</span>
                      </>
                    )}
                  </button>

                  <a
                    href={saveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    title="Abrir directamente en navegador"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir</span>
                  </a>
                </div>
              </div>
            )}

            {/* Footer Trust Guarantee */}
            <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 relative z-10">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8c9276]" />
                <span>Encriptado de extremo a extremo</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{brand.name} Wallet Engine</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default GoogleWalletModal;
