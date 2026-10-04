"use client";

import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, ExternalLink } from "lucide-react";
import { BeUITiltCard } from "@/components/ui/BeUIControls";
import { GoogleWalletButton } from "@/components/ui/GoogleWalletButton";
import type { Order } from "@/lib/userStore";
import { useUserStore } from "@/lib/userStore";
import { cn } from "@/lib/utils";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";

export interface WalletPassPopupModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  order?: Order | null;
  orderId?: string;
  total?: number;
  status?: "Procesando" | "Enviado" | "Entregado";
  customerName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
  date?: string;
  initialPlatform?: "google" | "apple";
}

export function WalletPassPopupModal({
  open,
  onOpenChange,
  onClose,
  order,
  orderId,
  total,
  status: propStatus,
  customerName,
  trackingNumber,
  trackingUrl,
  carrierName,
  date,
}: WalletPassPopupModalProps) {
  const { orders } = useUserStore();
  const { mode } = useThemeStore();
  const isDark = getResolvedTheme(mode) === "dark";

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (onOpenChange) onOpenChange(nextOpen);
    if (!nextOpen && onClose) onClose();
  }, [onOpenChange, onClose]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleOpenChange]);

  const resolvedOrder: Order | null =
    order ||
    (orderId
      ? {
          id: orderId,
          total: Number(total || 0),
          status: propStatus || "Procesando",
          customerName: customerName || "Cliente Lumina",
          trackingNumber: trackingNumber || "",
          trackingUrl: trackingUrl || "",
          carrierName: carrierName || "",
          date: date || new Date().toLocaleDateString("es-EC"),
          items: [],
        }
      : null);

  if (!resolvedOrder) return null;

  const liveOrder =
    orders.find((o) => String(o.id).toLowerCase() === String(resolvedOrder.id).toLowerCase()) ||
    resolvedOrder;

  const status = liveOrder.status || "Procesando";
  const isShippedOrDelivered =
    (status === "Enviado" || status === "Entregado") &&
    Boolean(liveOrder.trackingNumber && liveOrder.trackingNumber.trim());

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://luminahome.ec";

  const tokenParam = liveOrder.walletToken ? `&token=${encodeURIComponent(liveOrder.walletToken)}` : "";
  const queryParams = `orderId=${encodeURIComponent(
    liveOrder.id
  )}${tokenParam}&total=${encodeURIComponent(String(liveOrder.total || 0))}&status=${encodeURIComponent(
    status
  )}&date=${encodeURIComponent(liveOrder.date || "Reciente")}&customer=${encodeURIComponent(
    liveOrder.customerName || "Cliente Lumina"
  )}&tracking=${encodeURIComponent(
    liveOrder.trackingNumber || ""
  )}&carrier=${encodeURIComponent(liveOrder.carrierName || "")}&url=${encodeURIComponent(
    liveOrder.trackingUrl || ""
  )}`;

  // Google Wallet pass endpoint
  const googlePassEndpoint = `${origin}/api/wallet/pass?type=order&platform=google&${queryParams}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=6&ecc=M&data=${encodeURIComponent(
    googlePassEndpoint
  )}`;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto", isDark && "dark")}>
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={() => handleOpenChange(false)}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container: Spring morphing opening animation matching beUI popover/modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{
              type: "spring",
              damping: 24,
              stiffness: 320,
              mass: 0.8,
            }}
            className="relative z-10 w-full max-w-[360px] sm:max-w-[380px] my-auto select-none"
          >
            {/* 3D TILT CARD: Styled matching the exact beUI Tilt Card from video (colors, border, typography, glare) */}
            <BeUITiltCard
              maxTilt={12}
              scaleOnHover={1.02}
              glareOpacity={0.28}
              className="relative rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-[#FBFBFC] via-[#F4F5F7] to-[#E9EBEF] dark:from-[#232327] dark:via-[#1B1B1E] dark:to-[#141416] p-5 sm:p-6 text-gray-900 dark:text-white border border-black/[0.08] dark:border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.7)] overflow-hidden"
            >
              {/* Card Header matching 'PREMIUM / Tilt me' architecture */}
              <div
                style={{ transform: "translateZ(14px)" }}
                className="flex items-start justify-between gap-2 pb-2"
              >
                <div>
                  <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-[#71717A] dark:text-[#A1A1AA] font-bold block">
                    GOOGLE WALLET PASS
                  </span>
                  <h3 className="font-bold text-xl sm:text-2xl text-gray-900 dark:text-white tracking-tight mt-0.5">
                    {liveOrder.id}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Subtitle / Description matching 'Move your cursor across the card...' */}
              <p
                style={{ transform: "translateZ(12px)" }}
                className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3"
              >
                Escanea el código QR con tu cámara para guardar tu tarjeta en Google Wallet.
              </p>

              {/* Centerpiece: Scannable QR Code */}
              <div
                style={{ transform: "translateZ(26px)" }}
                className="flex flex-col items-center my-3"
              >
                <div className="p-3.5 rounded-2xl bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-black/[0.06]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImageUrl}
                    alt={`QR Pase ${liveOrder.id}`}
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain block rounded-lg select-none"
                  />
                </div>

                <span
                  className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-semibold border ${
                    status === "Entregado"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : status === "Enviado"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === "Entregado"
                        ? "bg-emerald-500"
                        : status === "Enviado"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                    }`}
                  />
                  {status}
                </span>
              </div>

              {/* Carrier Tracking Pill (Only when Shipped/Delivered) */}
              {isShippedOrDelivered && liveOrder.trackingNumber && (
                <div
                  style={{ transform: "translateZ(16px)" }}
                  className="mb-3 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Truck className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                    <span className="font-mono text-gray-700 dark:text-gray-300 truncate text-[11px]">
                      {liveOrder.carrierName ? `${liveOrder.carrierName}: ` : ""}
                      {liveOrder.trackingNumber}
                    </span>
                  </div>
                  {liveOrder.trackingUrl && (
                    <a
                      href={liveOrder.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
                      title="Abrir rastreo"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Minimal Pass Footer */}
              <div
                style={{ transform: "translateZ(14px)" }}
                className="pt-2.5 pb-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs"
              >
                <span className="text-gray-500 dark:text-gray-400 truncate max-w-[170px] font-medium">
                  {liveOrder.customerName || "Cliente Lumina"}
                </span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  ${Number(liveOrder.total || 0).toFixed(2)} USD
                </span>
              </div>

              {/* One-Tap Action Button */}
              <div
                style={{ transform: "translateZ(18px)" }}
                className="pt-1 flex justify-center"
              >
                <GoogleWalletButton
                  href={googlePassEndpoint}
                  target="_blank"
                  topText="Agregar a"
                  className="w-full justify-center shadow-md"
                />
              </div>
            </BeUITiltCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
