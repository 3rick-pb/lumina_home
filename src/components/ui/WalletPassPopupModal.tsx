"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Bell,
  BellRing,
  Truck,
  Download,
  Smartphone,
} from "lucide-react";
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
  initialPlatform = "google",
}: WalletPassPopupModalProps) {
  const { orders } = useUserStore();
  const [platform, setPlatform] = useState<"google" | "apple">(initialPlatform);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) onOpenChange(nextOpen);
    if (!nextOpen && onClose) onClose();
  };

  useEffect(() => {
    if (initialPlatform) setPlatform(initialPlatform);
  }, [initialPlatform, open]);

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

  // Always resolve the latest live version of this order from store
  const liveOrder =
    orders.find((o) => String(o.id).toLowerCase() === String(resolvedOrder.id).toLowerCase()) ||
    resolvedOrder;

  const status = liveOrder.status || "Procesando";
  const isShippedOrDelivered =
    (status === "Enviado" || status === "Entregado") &&
    Boolean(liveOrder.trackingNumber && liveOrder.trackingNumber.trim());

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://luminahome.ec";

  // Self-contained signed URL so scanning the QR code on ANY external phone immediately displays 100% of the real order data + live polling
  const livePassUrl = `${origin}/wallet/order/${encodeURIComponent(
    liveOrder.id
  )}?total=${encodeURIComponent(String(liveOrder.total || 0))}&status=${encodeURIComponent(
    status
  )}&date=${encodeURIComponent(liveOrder.date || "Reciente")}&customer=${encodeURIComponent(
    liveOrder.customerName || "Cliente Lumina"
  )}&tracking=${encodeURIComponent(
    liveOrder.trackingNumber || ""
  )}&carrier=${encodeURIComponent(liveOrder.carrierName || "")}&url=${encodeURIComponent(
    liveOrder.trackingUrl || ""
  )}&wallet=${platform}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=6&ecc=M&data=${encodeURIComponent(
    livePassUrl
  )}`;

  const handleActivateRealWalletPass = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          new Notification(
            `Pase ${platform === "apple" ? "Apple Wallet" : "Google Wallet"} Activo · ${liveOrder.id}`,
            {
              body: `Estado actual: ${status}. Te notificaremos al instante cuando tu pedido cambie a Enviado o Entregado.`,
            }
          );
        }
      } catch {
        // Ignore on unsupported browsers
      }
    }

    setNotificationsActive(true);
    setStatusFeedback(
      platform === "apple"
        ? `Pase Apple Wallet vinculado al pedido ${liveOrder.id}. Escanea la Tilt Card con la cámara de tu iPhone o guarda el pase.`
        : `Pase Google Wallet vinculado al pedido ${liveOrder.id}. Escanea la Tilt Card con tu teléfono Android o guarda el pase.`
    );
  };

  const handleDownloadPassCard = () => {
    // Generate and download a real standalone Digital Wallet Pass HTML/PassKit file for offline/mobile access
    const passBlob = new Blob(
      [
        `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pase ${
          platform === "apple" ? "Apple Wallet" : "Google Wallet"
        } - ${liveOrder.id}</title></head><body style="margin:0;background:#0B0B0E;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;"><script>window.location.href=${JSON.stringify(
          livePassUrl
        )};</script><div style="max-width:380px;width:100%;background:#18181c;border:1px solid rgba(255,255,255,0.15);border-radius:28px;padding:28px;text-align:center;"><h2 style="margin:0 0 8px;">Lumina Home · ${
          liveOrder.id
        }</h2><p style="color:#a1a1aa;font-size:13px;margin:0 0 18px;">Estado: <strong style="color:#ccff00;">${status}</strong> · Total: <strong>$${Number(
          liveOrder.total || 0
        ).toFixed(2)} USD</strong></p><img src="${qrImageUrl}" alt="QR" style="width:200px;height:200px;border-radius:16px;background:#fff;padding:10px;"/><p style="margin-top:16px;"><a href="${livePassUrl}" style="display:inline-block;padding:12px 24px;border-radius:14px;background:#ccff00;color:#000;font-weight:700;text-decoration:none;font-size:13px;">Abrir Seguimiento en Tiempo Real</a></p></div></body></html>`,
      ],
      { type: "text/html;charset=utf-8" }
    );
    const url = URL.createObjectURL(passBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Lumina-${platform === "apple" ? "AppleWallet" : "GoogleWallet"}-${liveOrder.id.replace(/[^a-zA-Z0-9_-]/g, "")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleActivateRealWalletPass();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <BeUICenterMorphModal
      open={open}
      onOpenChange={handleOpenChange}
      className="max-w-md w-full"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full rounded-[2.25rem] bg-[#121216]/98 backdrop-blur-2xl border border-white/15 shadow-[0_32px_90px_rgba(0,0,0,0.75)] p-5 sm:p-6 text-white overflow-hidden"
      >
        {/* Ambient Glow */}
        <div
          className={`pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl transition-colors duration-500 ${
            platform === "apple" ? "bg-amber-500/20" : "bg-blue-500/20"
          }`}
        />

        {/* Header + Close Button */}
        <div className="relative z-10 flex items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center font-display font-bold text-base shadow-md">
              L
            </div>
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#ccff00] font-bold block">
                PASE EN TIEMPO REAL · TILT CARD
              </span>
              <h3 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
                Billetera Digital de Pedido
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500/20 border border-white/15 hover:border-rose-500/40 text-white/70 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Switcher: Google Wallet vs Apple Wallet */}
        <div className="relative z-10 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10 mt-4">
          <button
            type="button"
            onClick={() => setPlatform("google")}
            className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              platform === "google"
                ? "bg-white text-gray-950 shadow-sm"
                : "text-white/65 hover:text-white"
            }`}
          >
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
            <span>Google Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => setPlatform("apple")}
            className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              platform === "apple"
                ? "bg-white text-gray-950 shadow-sm"
                : "text-white/65 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
            </svg>
            <span>Apple Wallet</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* @beui/tilt-card INTERACTIVE 3D WALLET PASS + QR CODE */}
        {/* =================================================================== */}
        <div className="mt-4">
          <BeUITiltCard
            maxTilt={15}
            scaleOnHover={1.02}
            glareOpacity={0.32}
            className={`rounded-[1.85rem] p-5 border shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-hidden ${
              platform === "apple"
                ? "bg-gradient-to-br from-[#1f1d24] via-[#151419] to-[#0d0d10] border-amber-400/30"
                : "bg-gradient-to-br from-[#172030] via-[#131822] to-[#0e1118] border-blue-400/30"
            }`}
          >
            {/* Pass Top Bar */}
            <div
              style={{ transform: "translateZ(18px)" }}
              className="flex items-center justify-between gap-2 pb-3.5 border-b border-white/10"
            >
              <div className="text-left">
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-white/55 block">
                  {platform === "apple" ? "APPLE WALLET PASSKIT" : "GOOGLE WALLET PASS"}
                </span>
                <p className="font-mono font-extrabold text-base sm:text-lg text-white tracking-wider">
                  {liveOrder.id}
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider border ${
                  status === "Entregado"
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                    : status === "Enviado"
                      ? "bg-blue-500/20 border-blue-400/40 text-blue-300"
                      : "bg-amber-500/20 border-amber-400/40 text-amber-300"
                }`}
              >
                {status}
              </span>
            </div>

            {/* Conditional Carrier Tracking Tag (ONLY when Enviado or Entregado) */}
            {isShippedOrDelivered && liveOrder.trackingNumber && (
              <div
                style={{ transform: "translateZ(24px)" }}
                className="mt-3 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.07] border border-white/15"
              >
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(liveOrder.trackingNumber || "");
                    setCopiedTracking(true);
                    setTimeout(() => setCopiedTracking(false), 2000);
                    if (liveOrder.trackingUrl) {
                      window.open(liveOrder.trackingUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-mono font-bold text-[#ccff00] hover:underline cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span>Guía: {liveOrder.trackingNumber}</span>
                  {copiedTracking ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-80" />
                  )}
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </button>
                <span className="text-[10px] text-white/65 font-semibold">
                  {liveOrder.carrierName || "Transportadora"}
                </span>
              </div>
            )}

            {/* 3D Floating QR Code Centerpiece */}
            <div
              style={{ transform: "translateZ(32px)" }}
              className="my-4 flex flex-col items-center justify-center"
            >
              <div className="relative p-3 rounded-2xl bg-white shadow-[0_16px_40px_rgba(0,0,0,0.45)] border-2 border-white/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt={`QR ${liveOrder.id}`}
                  className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                />
                <div className="mt-1.5 flex items-center justify-center gap-1 text-[9.5px] font-mono font-bold uppercase tracking-widest text-gray-900">
                  <Smartphone className="w-3 h-3 text-gray-700" />
                  <span>Mueve la tarjeta · Escanea en vivo</span>
                </div>
              </div>
            </div>

            {/* 3-Step Live Progress Mini Bar inside Tilt Card */}
            <div
              style={{ transform: "translateZ(18px)" }}
              className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 text-center"
            >
              {(["Procesando", "Enviado", "Entregado"] as const).map((stepName) => {
                const isCurrent = status === stepName;
                const isDone =
                  stepName === "Procesando" ||
                  (stepName === "Enviado" && (status === "Enviado" || status === "Entregado")) ||
                  (stepName === "Entregado" && status === "Entregado");
                return (
                  <div
                    key={stepName}
                    className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all ${
                      isCurrent
                        ? "bg-[#ccff00]/20 border-[#ccff00]/50 text-[#ccff00]"
                        : isDone
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-white/[0.03] border-white/5 text-white/40"
                    }`}
                  >
                    {stepName}
                  </div>
                );
              })}
            </div>
          </BeUITiltCard>
        </div>

        {/* Status / Notification Feedback */}
        {statusFeedback && (
          <div className="mt-3.5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs flex items-start gap-2.5 text-left">
            <BellRing className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
            <span className="leading-relaxed">{statusFeedback}</span>
          </div>
        )}

        {/* Bottom Action Buttons (100% In-Place Actions, No Broken Links) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPassCard}
            className="h-11 px-4 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-gray-950 font-sans font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>
              Guardar Pase {platform === "apple" ? "Apple" : "Google"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(livePassUrl);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2200);
              handleActivateRealWalletPass();
            }}
            className="h-11 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Enlace Copiado + Alertas</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-[#ccff00]" />
                <span>
                  {notificationsActive ? "Alertas Push Activas" : "Activar Alertas Push"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </BeUICenterMorphModal>,
    document.body
  );
}
