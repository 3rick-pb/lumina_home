"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { GoogleWalletIcon } from "@/components/ui/GoogleWalletButton";
import { useBrand } from "@/core/hooks/useBrand";
import { cn } from "@/lib/utils";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
import { MacOSScrollbar } from "@/components/ui/MacOSScrollbar";

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

/**
 * Desktop-only modal that shows a QR code pointing to YOUR OWN bridge page
 * (/wallet/add?code=...&email=...&name=...&pts=...&tier=...).
 *
 * When scanned by a phone camera:
 *   Phone opens /wallet/add → page calls backend → gets saveUrl → instant redirect to Google Wallet.
 *
 * This avoids the problem of QR-encoding the massive JWT saveUrl directly,
 * which caused double-scan / browser interstitial issues.
 */
export function GoogleWalletModal({
  open,
  onClose,
  member,
}: GoogleWalletModalProps) {
  const brand = useBrand();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset copy state when modal closes
  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  // Build the bridge URL — short, clean, QR-friendly
  const bridgeUrl = useMemo(() => {
    if (!open) return "";
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://lumina-home.ec";
    const params = new URLSearchParams();
    if (member?.memberCode) params.set("code", member.memberCode);
    if (member?.customerEmail) params.set("email", member.customerEmail);
    if (member?.customerName) params.set("name", member.customerName);
    if (member?.pointsBalance !== undefined)
      params.set("pts", String(member.pointsBalance));
    if (member?.tierName) params.set("tier", member.tierName);
    return `${origin}/wallet/add?${params.toString()}`;
  }, [open, member]);

  // QR Code URL — short bridge URL generates a fast, clean QR
  const qrImageUrl = useMemo(() => {
    if (!bridgeUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=4&ecc=M&data=${encodeURIComponent(
      bridgeUrl
    )}`;
  }, [bridgeUrl]);

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
    if (!bridgeUrl) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bridgeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const { mode } = useThemeStore();
  const isDark = getResolvedTheme(mode) === "dark";

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div ref={scrollContainerRef} className={cn("fixed inset-0 z-[1000050] flex items-center justify-center p-4 sm:p-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", isDark && "dark")}>
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
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Badge & Close Button */}
            <div className="flex items-center justify-between relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[11px] font-semibold tracking-wide">
                <GoogleWalletIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Google Wallet™ Oficial</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
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

            {/* Main Interactive Centerpiece — QR pointing to bridge URL */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-full flex flex-col items-center space-y-3">
                {/* High-Contrast Crisp QR Card */}
                <div className="p-4 bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-gray-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImageUrl}
                    alt="Código QR de Google Wallet"
                    className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-2xl select-none"
                  />
                </div>

                {/* Customer Credentials Strip */}
                <div className="w-full p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] px-3.5">
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold text-white truncate">
                      {member?.customerName || "Cliente Lumina"}
                    </span>
                  </div>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0">
                    {member?.memberCode || "LUM-1042-PRV"}
                  </span>
                </div>
              </div>
            </div>

            {/* Micro-Instructions */}
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
                  href={bridgeUrl}
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

            {/* Footer Trust Guarantee */}
            <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 relative z-10">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Encriptado de extremo a extremo</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{brand.name} Wallet Engine</span>
              </div>
            </div>
          </motion.div>
          <MacOSScrollbar containerRef={scrollContainerRef} insetTop={28} insetBottom={28} insetRight={3} />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default GoogleWalletModal;
