"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  ExternalLink,
  Bell,
  BellRing,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useUserStore, type Order } from "@/lib/userStore";

function WalletOrderPassContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const rawOrderId = decodeURIComponent(params?.id || "");
  const walletMode = searchParams.get("wallet") || "google";

  const { orders } = useUserStore();
  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);
  const [pushBanner, setPushBanner] = useState<{
    title: string;
    body: string;
    status: string;
  } | null>(null);

  const prevStatusRef = useRef<string | null>(null);

  // Normalize order lookup from store or API
  useEffect(() => {
    let isMounted = true;

    const fetchOrderLive = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.orders)) {
            const matched = data.orders.find(
              (o: Record<string, unknown>) =>
                String(o.id || "").toLowerCase() === rawOrderId.toLowerCase() ||
                String(o.id || "").replace(/^#/, "").toLowerCase() ===
                  rawOrderId.replace(/^#/, "").toLowerCase()
            );
            if (matched && isMounted) {
              const rawStatus = String(matched.status || "Procesando");
              const validStatus: Order["status"] =
                rawStatus === "Enviado" || rawStatus === "Entregado"
                  ? rawStatus
                  : "Procesando";
              const normalized: Order = {
                id: String(matched.id || rawOrderId),
                date: String(matched.date || "Reciente"),
                total: Number(matched.total || 0),
                status: validStatus,
                trackingNumber: String(matched.trackingNumber || ""),
                trackingUrl: String(matched.trackingUrl || ""),
                carrierName: String(matched.carrierName || ""),
                shippingAddress:
                  matched.shippingAddress && typeof matched.shippingAddress === "object"
                    ? (matched.shippingAddress as Order["shippingAddress"])
                    : undefined,
                items: Array.isArray(matched.items) ? (matched.items as Order["items"]) : [],
              };

              if (
                prevStatusRef.current &&
                prevStatusRef.current !== normalized.status
              ) {
                triggerStatusAlert(normalized);
              }
              prevStatusRef.current = normalized.status;
              setLiveOrder(normalized);
              return;
            }
          }
        }
      } catch {
        // Fallback to local store
      }

      const storeMatch = orders.find(
        (o) =>
          String(o.id).toLowerCase() === rawOrderId.toLowerCase() ||
          String(o.id).replace(/^#/, "").toLowerCase() ===
            rawOrderId.replace(/^#/, "").toLowerCase()
      );
      if (storeMatch && isMounted) {
        if (
          prevStatusRef.current &&
          prevStatusRef.current !== storeMatch.status
        ) {
          triggerStatusAlert(storeMatch);
        }
        prevStatusRef.current = storeMatch.status;
        setLiveOrder(storeMatch);
      }
    };

    fetchOrderLive();
    const interval = setInterval(fetchOrderLive, 4500);

    const handleWalletPush = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.orderId === rawOrderId) {
        fetchOrderLive();
      }
    };

    window.addEventListener("lumina:wallet-order-push", handleWalletPush);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("lumina:wallet-order-push", handleWalletPush);
    };
  }, [rawOrderId, orders]);

  const triggerStatusAlert = (updated: Order) => {
    const statusMessages: Record<string, { title: string; body: string }> = {
      Procesando: {
        title: `Pedido ${updated.id} en Preparación`,
        body: "Estamos preparando cuidadosamente tus piezas en nuestro Atelier.",
      },
      Enviado: {
        title: `¡Tu pedido ${updated.id} ha sido Enviado!`,
        body: updated.trackingNumber
          ? `Despachado con guía ${updated.trackingNumber}${
              updated.carrierName ? ` (${updated.carrierName})` : ""
            }. Toca para rastrear en vivo.`
          : "Tu pedido ya está en manos de la transportadora.",
      },
      Entregado: {
        title: `¡Pedido ${updated.id} Entregado!`,
        body: "Tu orden ha sido entregada exitosamente. Gracias por elegir Lumina Home.",
      },
      Cancelado: {
        title: `Actualización de Pedido ${updated.id}`,
        body: "El estado de tu pedido ha cambiado a Cancelado.",
      },
    };

    const msg = statusMessages[updated.status] || {
      title: `Actualización de Pedido ${updated.id}`,
      body: `Nuevo estado: ${updated.status}`,
    };

    setPushBanner({
      title: msg.title,
      body: msg.body,
      status: updated.status,
    });

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(msg.title, {
          body: msg.body,
          icon: "/favicon.ico",
        });
      } catch {
        // Ignore notification errors on unsupported browsers
      }
    }
  };

  const handleEnableNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setWalletSaved(true);
        setPushBanner({
          title: "Pase vinculado y notificaciones activas",
          body: `Te avisaremos al instante cuando tu orden ${
            liveOrder?.id || rawOrderId
          } cambie a Enviado o Entregado.`,
          status: liveOrder?.status || "Procesando",
        });
        return;
      }
    }
    setWalletSaved(true);
    setPushBanner({
      title: "Pase guardado en tu Billetera Digital",
      body: `Sincronización en vivo activada para el pedido ${
        liveOrder?.id || rawOrderId
      }.`,
      status: liveOrder?.status || "Procesando",
    });
  };

  const status = liveOrder?.status || "Procesando";
  const isShippedOrDelivered =
    (status === "Enviado" || status === "Entregado") &&
    Boolean(liveOrder?.trackingNumber && liveOrder.trackingNumber.trim());

  const steps = [
    {
      id: "Procesando",
      label: "Procesando",
      desc: "Preparación artesanal en Atelier",
      icon: Clock,
      active:
        status === "Procesando" ||
        status === "Enviado" ||
        status === "Entregado",
      current: status === "Procesando",
    },
    {
      id: "Enviado",
      label: "Enviado",
      desc: liveOrder?.carrierName
        ? `En ruta vía ${liveOrder.carrierName}`
        : "Despachado con transportadora",
      icon: Truck,
      active: status === "Enviado" || status === "Entregado",
      current: status === "Enviado",
    },
    {
      id: "Entregado",
      label: "Entregado",
      desc: "Recibido en destino final",
      icon: CheckCircle2,
      active: status === "Entregado",
      current: status === "Entregado",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-white flex flex-col items-center justify-start py-8 sm:py-12 px-4 relative overflow-hidden">
      {/* Ambient Wallet Glow */}
      <div className="fixed top-[-15%] left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-amber-500/12 blur-[130px] pointer-events-none" />

      {/* Live Push Notification Banner */}
      <AnimatePresence>
        {pushBanner && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 rounded-2xl bg-[#18181c]/95 backdrop-blur-2xl border border-amber-400/30 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.65)] flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Lumina Wallet Push · Ahora
                </span>
                <button
                  onClick={() => setPushBanner(null)}
                  className="text-xs text-white/40 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="font-bold text-xs sm:text-sm text-white mt-0.5">
                {pushBanner.title}
              </p>
              <p className="text-[11.5px] text-white/70 mt-0.5 leading-relaxed">
                {pushBanner.body}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 relative z-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ir a Mi Perfil</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10.5px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Sincronización en Vivo
        </div>
      </div>

      {/* Main Digital Wallet Pass Card (Apple Wallet / Google Wallet Aesthetic) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[2.25rem] bg-gradient-to-b from-[#1A1A20] via-[#141418] to-[#101014] border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.75)] overflow-hidden relative z-10"
      >
        {/* Top Pass Notch & Brand Bar */}
        <div className="px-6 pt-6 pb-5 border-b border-white/10 bg-gradient-to-r from-amber-500/[0.08] via-transparent to-emerald-500/[0.06]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-display font-bold text-lg shadow-md">
                L
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300/90 font-bold">
                  {walletMode === "apple"
                    ? "APPLE WALLET PASS"
                    : "GOOGLE WALLET PASS"}
                </p>
                <h1 className="font-display font-bold text-lg text-white tracking-tight">
                  Lumina Home · Orden Oficial
                </h1>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                status === "Entregado"
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                  : status === "Enviado"
                  ? "bg-amber-500/15 border-amber-400/30 text-amber-300"
                  : "bg-white/10 border-white/15 text-white/90"
              }`}
            >
              {status}
            </span>
          </div>

          {/* Order ID & Total */}
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/45">
                IDENTIFICADOR DE ORDEN
              </p>
              <p className="font-mono font-bold text-2xl sm:text-3xl text-white tracking-tight mt-0.5">
                {liveOrder?.id || rawOrderId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/45">
                IMPORTE PAGADO
              </p>
              <p className="font-sans font-extrabold text-xl text-amber-300 mt-0.5">
                ${Number(liveOrder?.total || 0).toFixed(2)} USD
              </p>
            </div>
          </div>

          {/* CLICKABLE TOP CARRIER TRACKING CODE TAG (ONLY WHEN ENVIADO OR ENTREGADO) */}
          {isShippedOrDelivered && liveOrder && (
            <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(liveOrder.trackingNumber || "");
                    setCopiedTracking(true);
                    setTimeout(() => setCopiedTracking(false), 2000);
                    if (
                      liveOrder.trackingUrl &&
                      liveOrder.trackingUrl.trim()
                    ) {
                      window.open(
                        liveOrder.trackingUrl,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-amber-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Copiar código y abrir enlace de la transportadora"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Guía: {liveOrder.trackingNumber}</span>
                  {copiedTracking ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-80" />
                  )}
                  {liveOrder.trackingUrl && (
                    <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  )}
                </button>
              </div>
              {liveOrder.carrierName && (
                <span className="text-[11px] font-semibold text-white/70">
                  Vía {liveOrder.carrierName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Real-Time Progress Stepper */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/50 font-bold">
              SEGUIMIENTO EN TIEMPO REAL
            </span>
            <span className="text-[11px] text-white/50 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Auto-actualizable
            </span>
          </div>

          <div className="space-y-4 relative">
            {steps.map((s, index) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${
                    s.current
                      ? "bg-white/[0.07] border-amber-400/40 shadow-sm"
                      : s.active
                      ? "bg-white/[0.03] border-white/10"
                      : "bg-transparent border-white/5 opacity-45"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      s.current
                        ? "bg-amber-400 text-black shadow-md"
                        : s.active
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-xs sm:text-sm text-white">
                        {index + 1}. {s.label}
                      </p>
                      {s.current && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                          Actual
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-white/65 mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carrier Direct Button when Shipped */}
          {isShippedOrDelivered && liveOrder?.trackingUrl && (
            <a
              href={liveOrder.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>
                Rastrear Envío en{" "}
                {liveOrder.carrierName || "Sitio de Transportadora"}
              </span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Activate Wallet Push Notifications Button */}
          <button
            type="button"
            onClick={handleEnableNotifications}
            className={`w-full h-12 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer border ${
              walletSaved
                ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                : "bg-white text-black hover:bg-gray-100 border-transparent shadow-lg"
            }`}
          >
            {walletSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Pase activo en{" "}
                  {walletMode === "apple" ? "Apple Wallet" : "Google Wallet"} ·
                  Alertas Encendidas
                </span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>
                  Guardar en{" "}
                  {walletMode === "apple" ? "Apple Wallet" : "Google Wallet"} y
                  Activar Alertas
                </span>
              </>
            )}
          </button>
        </div>

        {/* Perforated Ticket Divider */}
        <div className="relative flex items-center justify-between px-3">
          <div className="w-5 h-5 rounded-full bg-[#0B0B0E] -ml-5 border-r border-white/15" />
          <div className="w-full border-b-2 border-dashed border-white/15" />
          <div className="w-5 h-5 rounded-full bg-[#0B0B0E] -mr-5 border-l border-white/15" />
        </div>

        {/* Bottom Pass Barcode / QR Verification */}
        <div className="p-6 flex flex-col items-center text-center space-y-3 bg-black/20">
          <div className="p-3 rounded-2xl bg-white shadow-md">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=2&data=${encodeURIComponent(
                `${
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "https://luminahome.ec"
                }/wallet/order/${encodeURIComponent(
                  liveOrder?.id || rawOrderId
                )}`
              )}`}
              alt="QR Verification"
              className="w-28 h-28 object-contain"
            />
          </div>
          <p className="text-[10.5px] font-mono text-white/50 uppercase tracking-widest">
            PASE OFICIAL LUMINA HOME · {liveOrder?.id || rawOrderId}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function WalletOrderPassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0B0E] text-white flex items-center justify-center text-xs font-mono uppercase tracking-widest">
          Cargando Pase Digital Lumina...
        </div>
      }
    >
      <WalletOrderPassContent />
    </Suspense>
  );
}
