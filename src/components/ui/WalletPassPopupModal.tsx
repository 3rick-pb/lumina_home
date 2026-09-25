"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Truck, ExternalLink } from "lucide-react";
import { BeUICenterMorphModal, BeUITiltCard } from "@/components/ui/BeUIControls";
import type { Order } from "@/lib/userStore";
import { useUserStore } from "@/lib/userStore";

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

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) onOpenChange(nextOpen);
    if (!nextOpen && onClose) onClose();
  };

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

  const queryParams = `orderId=${encodeURIComponent(
    liveOrder.id
  )}&total=${encodeURIComponent(String(liveOrder.total || 0))}&status=${encodeURIComponent(
    status
  )}&date=${encodeURIComponent(liveOrder.date || "Reciente")}&customer=${encodeURIComponent(
    liveOrder.customerName || "Cliente Lumina"
  )}&tracking=${encodeURIComponent(
    liveOrder.trackingNumber || ""
  )}&carrier=${encodeURIComponent(liveOrder.carrierName || "")}&url=${encodeURIComponent(
    liveOrder.trackingUrl || ""
  )}`;

  // Root universal endpoint supporting both Apple Wallet (.pkpass) and Google Wallet (Save JWT)
  const universalPassEndpoint = `${origin}/api/wallet/pass?type=order&platform=auto&${queryParams}`;
  const applePassEndpoint = `/api/wallet/pass?type=order&platform=apple&${queryParams}`;
  const googlePassEndpoint = `/api/wallet/pass?type=order&platform=google&${queryParams}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=6&ecc=M&data=${encodeURIComponent(
    universalPassEndpoint
  )}`;

  if (typeof document === "undefined") return null;

  return createPortal(
    <BeUICenterMorphModal
      open={open}
      onOpenChange={handleOpenChange}
      className="max-w-[344px] w-full"
    >
      {/* OUTER COMPACT POPUP WINDOW — Static (NO 3D Tilt here), Micro-SaaS Obsidian Palette */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full rounded-[2rem] bg-[#111113] border border-white/[0.09] shadow-[0_28px_80px_rgba(0,0,0,0.82)] p-4 text-[#F4F4F6] overflow-hidden select-none"
      >
        {/* Subtle Warm Stone Ambient Highlight (No neon green or blue) */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-52 h-32 rounded-full bg-[#D6D3CD]/[0.06] blur-3xl" />

        {/* Compact Top Bar: Unified Apple Wallet + Google Wallet Informative Tag & Close */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-3.5">
          {/* Unified Ecosystem Tag with both Official Apple Wallet & Google Wallet Logos */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#19191D] border border-white/[0.08] shadow-inner">
            <a
              href={applePassEndpoint}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#F4F4F6] hover:text-white transition-colors"
              title="Descargar pase nativo Apple Wallet (.pkpass)"
            >
              {/* Official Apple Emblem */}
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
              </svg>
              <span className="tracking-tight">Apple Wallet</span>
            </a>

            <span className="w-px h-3 bg-white/[0.12]" />

            <a
              href={googlePassEndpoint}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#F4F4F6] hover:text-white transition-colors"
              title="Guardar pase en Google Wallet"
            >
              {/* Official Google Wallet Emblem */}
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.5"
                  stroke="#4285F4"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect x="3" y="8" width="18" height="9" rx="2" fill="#34A853" />
                <path d="M3 10.5h18" stroke="#FBBC05" strokeWidth="2.5" />
                <circle cx="17" cy="13.5" r="1.5" fill="#EA4335" />
              </svg>
              <span className="tracking-tight">Google Wallet</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.11] border border-white/[0.08] text-[#A1A1AA] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ===================================================================== */}
        {/* INNER SCANNABLE QR PASS CARD — ONLY THIS ELEMENT HAS 3D TILT EFFECT   */}
        {/* ===================================================================== */}
        <BeUITiltCard
          maxTilt={14}
          scaleOnHover={1.02}
          glareOpacity={0.2}
          className="rounded-[1.5rem] bg-gradient-to-b from-[#1B1B1F] via-[#161619] to-[#121215] border border-white/[0.1] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] overflow-hidden"
        >
          {/* Card Header: Order Reference & Live Status */}
          <div
            style={{ transform: "translateZ(16px)" }}
            className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07]"
          >
            <div>
              <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#8E8E98] block">
                PASE DE SEGUIMIENTO
              </span>
              <p className="font-mono font-bold text-sm text-[#F4F4F6] tracking-wide mt-0.5">
                {liveOrder.id}
              </p>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                status === "Entregado"
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                  : status === "Enviado"
                    ? "bg-amber-500/15 border-amber-300/30 text-amber-200"
                    : "bg-white/[0.06] border-white/[0.12] text-[#D4D4D8]"
              }`}
            >
              {status}
            </span>
          </div>

          {/* Scannable High-Contrast QR Code Centerpiece */}
          <div
            style={{ transform: "translateZ(26px)" }}
            className="my-4 flex flex-col items-center"
          >
            <div className="p-3 rounded-2xl bg-white shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt={`QR Pase ${liveOrder.id}`}
                className="w-44 h-44 object-contain block rounded-lg"
              />
            </div>
            <p className="mt-2.5 text-[11px] font-medium text-[#A1A1AA] tracking-tight text-center">
              Escanea con tu cámara para añadir el pase
            </p>
          </div>

          {/* Carrier Tracking Pill (Only when Shipped/Delivered) */}
          {isShippedOrDelivered && liveOrder.trackingNumber && (
            <div
              style={{ transform: "translateZ(18px)" }}
              className="mb-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Truck className="w-3.5 h-3.5 text-[#D6D3CD] shrink-0" />
                <span className="text-[11px] font-mono text-[#E4E4E7] truncate">
                  {liveOrder.carrierName ? `${liveOrder.carrierName}: ` : ""}
                  {liveOrder.trackingNumber}
                </span>
              </div>
              {liveOrder.trackingUrl && (
                <a
                  href={liveOrder.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A1A1AA] hover:text-white transition-colors shrink-0"
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
            className="pt-2.5 border-t border-white/[0.07] flex items-center justify-between text-[11px]"
          >
            <span className="text-[#8E8E98] truncate max-w-[160px]">
              {liveOrder.customerName || "Cliente Lumina"}
            </span>
            <span className="font-mono font-semibold text-[#F4F4F6]">
              ${Number(liveOrder.total || 0).toFixed(2)} USD
            </span>
          </div>
        </BeUITiltCard>
      </div>
    </BeUICenterMorphModal>,
    document.body
  );
}
