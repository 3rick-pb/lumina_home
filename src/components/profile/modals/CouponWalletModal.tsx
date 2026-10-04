"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MacOSScrollbar } from "@/components/ui/MacOSScrollbar";
import {
  X,
  Copy,
  Check,
  Tag,
  Calendar,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Download,
} from "lucide-react";
import { VectorBarcode } from "@/components/ui/VectorBarcode";
import { GoogleWalletButton } from "@/components/ui/GoogleWalletButton";
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from "@/components/motion/center-morph-modal";
import { ActionSwapButton } from "@/components/motion/action-swap";
import type { DiscountCoupon } from "@/lib/couponStore";

export interface CouponWalletModalProps {
  open: boolean;
  onClose: () => void;
  coupon: DiscountCoupon | null;
}

export function CouponWalletModal({
  open,
  onClose,
  coupon,
}: CouponWalletModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAddingGoogle, setIsAddingGoogle] = useState(false);
  const [walletFeedback, setWalletFeedback] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [cachedCoupon, setCachedCoupon] = useState<DiscountCoupon | null>(coupon);
  useEffect(() => {
    if (coupon) setCachedCoupon(coupon);
  }, [coupon]);

  const activeCoupon = coupon ?? cachedCoupon;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setWalletFeedback(null);
    }
  }, [open]);

  if (!mounted || !activeCoupon) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCoupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleAddGoogleWallet = () => {
    setIsAddingGoogle(true);
    setWalletFeedback("Sincronizando pase con Google Wallet usando Código de Barras 1D (Code 128)...");

    setTimeout(() => {
      setIsAddingGoogle(false);
      setWalletFeedback("¡Cupón listo y optimizado para guardar en Google Wallet!");
      setTimeout(() => setWalletFeedback(null), 3000);
    }, 1200);
  };

  return (
    <CenterMorphModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <CenterMorphModalContent
        ariaLabel={`Pase digital cupón ${activeCoupon.code}`}
        showCloseButton={false}
        className="max-w-md w-full mx-auto p-0 border-0 bg-transparent shadow-none"
      >
        <div
          className="relative w-full bg-stone-900 text-stone-100 rounded-[2rem] border border-stone-800/80 overflow-hidden"
        >
          {/* Scrollable body */}
          <div
            ref={scrollContainerRef}
            data-lenis-prevent="true"
            className="max-h-[85vh] overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
        {/* Header bar */}
            <div className="flex items-center justify-between p-5 border-b border-stone-800/80 bg-stone-950/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Guardar en Google Wallet
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Billetera Digital con Código de Barras 1D Lineal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Wallet Pass Visual Card */}
              <div className="relative rounded-2xl bg-gradient-to-br from-[#1b1c1e] via-[#242528] to-[#141517] p-5 border border-stone-700/80 shadow-inner overflow-hidden text-white">
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Pass Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
                      LÚMINA HOME · GOOGLE WALLET PASS
                    </span>
                    <h4 className="text-base font-black text-white mt-0.5">
                      {activeCoupon.title}
                    </h4>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-black text-xs">
                    {activeCoupon.discountType === "free_shipping"
                      ? "ENVÍO GRATIS"
                      : `-${activeCoupon.discountPercent}% OFF`}
                  </div>
                </div>

                {/* Scope & Details */}
                <div className="mt-3 flex items-center gap-3 text-[11px] text-stone-300">
                  <span className="font-semibold text-stone-200">
                    {activeCoupon.scope === "all" ? "🏛️ Toda la Tienda" : `🌿 ${activeCoupon.targetNiche}`}
                  </span>
                  {activeCoupon.minOrderAmount > 0 && (
                    <span className="text-stone-400">
                      • Min. ${activeCoupon.minOrderAmount} USD
                    </span>
                  )}
                </div>

                {/* Perforation Line */}
                <div className="my-4 border-t-2 border-dashed border-stone-700/80 relative">
                  <div className="absolute -left-7 -top-2.5 w-5 h-5 rounded-full bg-stone-900 border border-stone-800" />
                  <div className="absolute -right-7 -top-2.5 w-5 h-5 rounded-full bg-stone-900 border border-stone-800" />
                </div>

                {/* 1D LINEAR BARCODE (CODE 128) - NO QR CODE */}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-stone-950 shadow-md">
                  <div className="w-full max-w-[260px] py-1 flex items-center justify-center">
                    <VectorBarcode
                      code={activeCoupon.code}
                      height={50}
                      color="#0c0d0e"
                      className="w-full"
                    />
                  </div>
                  <span className="font-mono text-xs font-black tracking-[0.25em] text-stone-900 mt-1">
                    {activeCoupon.code}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-medium mt-0.5">
                    Código 128 · Escaneo Lineal 1D
                  </span>
                </div>

                {/* Pass Expiration */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-stone-400">
                  <span>
                    {activeCoupon.expiresAt
                      ? `Vence: ${new Date(activeCoupon.expiresAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}`
                      : "Sin fecha de expiración"}
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Canje Seguro
                  </span>
                </div>
              </div>

              {/* Feedback toast if generating */}
              {walletFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium"
                >
                  {walletFeedback}
                </motion.div>
              )}

              {/* Digital Wallet Action Buttons */}
              <div className="space-y-2.5">
                {/* Official Google Wallet Button (identical to order pass) */}
                <GoogleWalletButton
                  onClick={handleAddGoogleWallet}
                  disabled={isAddingGoogle}
                  topText="Agregar a"
                  className="w-full justify-center shadow-md py-2.5"
                />

                {/* beUI Action Swap Button: Copiar -> Copiado */}
                <ActionSwapButton
                  items={[
                    {
                      id: "copy",
                      label: `Copiar código (${activeCoupon.code})`,
                      icon: <Copy className="w-3.5 h-3.5 text-stone-400" />,
                    },
                    {
                      id: "copied",
                      label: "¡Código copiado al portapapeles!",
                      icon: <Check className="w-3.5 h-3.5 text-amber-400" />,
                    },
                  ]}
                  value={copied ? "copied" : "copy"}
                  cycle={false}
                  animation="cascade"
                  onClick={handleCopyCode}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-700/60 transition-colors cursor-pointer"
                />
              </div>

              {/* Informative reassurance */}
              <p className="text-[10px] text-stone-400 text-center leading-relaxed">
                El pase almacena el código de barras lineal 1D estandarizado para lectura inmediata sin conexión en cajas registradoras o en el checkout online.
              </p>
            </div>
          </div>{/* end scrollable body */}
          {/* MacOS jelly scrollbar — inset=14 clears the 2rem rounded corners */}
          <MacOSScrollbar containerRef={scrollContainerRef} inset={14} />
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
