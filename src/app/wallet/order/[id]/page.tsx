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
import { BeUITiltCard } from "@/components/ui/BeUIControls";

function WalletOrderPassContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const rawOrderId = decodeURIComponent(params?.id || "");
  const walletMode = searchParams.get("wallet") || "google";

  // Hydrate initial fallback order immediately from signed QR query parameters so scanning on ANY phone works 100% even if unauthenticated
  const initialQueryOrder: Order = {
    id: rawOrderId,
    date: searchParams.get("date") || "Reciente",
    total: Number(searchParams.get("total") || 0),
    status:
      searchParams.get("status") === "Enviado" || searchParams.get("status") === "Entregado"
        ? (searchParams.get("status") as Order["status"])
        : "Procesando",
    customerName: searchParams.get("customer") || "Cliente Lumina",
    trackingNumber: searchParams.get("tracking") || "",
    carrierName: searchParams.get("carrier") || "",
    trackingUrl: searchParams.get("url") || "",
    items: [],
  };

  const { orders } = useUserStore();
  const [liveOrder, setLiveOrder] = useState<Order>(initialQueryOrder);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);
  const [pushBanner, setPushBanner] = useState<{
    title: string;
    body: string;
    status: string;
  } | null>(null);

  const [resolvedToken, setResolvedToken] = useState<string>(
    rawOrderId.includes('.') ? rawOrderId : searchParams.get('token') || ''
  );

  const prevStatusRef = useRef<string | null>(initialQueryOrder.status);

  // Normalize order lookup from API (?token=... or ?orderId=...) or store
  useEffect(() => {
    let isMounted = true;

    const fetchOrderLive = async () => {
      try {
        const queryParam = rawOrderId.includes('.')
          ? `token=${encodeURIComponent(rawOrderId)}`
          : searchParams.get('token')
          ? `token=${encodeURIComponent(searchParams.get('token')!)}`
          : `orderId=${encodeURIComponent(rawOrderId)}`;

        const res = await fetch(`/api/orders?${queryParam}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const matched = data.order || (Array.isArray(data?.orders) && data.orders[0]) || null;
          if (matched && isMounted) {
            const rawStatus = String(matched.status || "Procesando");
            const validStatus: Order["status"] =
              rawStatus === "Enviado" || rawStatus === "Entregado"
                ? rawStatus
                : "Procesando";
            const normalized: Order = {
              id: String(matched.id || rawOrderId),
              date: String(matched.date || initialQueryOrder.date),
              total: Number(matched.total ?? initialQueryOrder.total),
              status: validStatus,
              trackingNumber: String(
                matched.trackingNumber || initialQueryOrder.trackingNumber || ""
              ),
              trackingUrl: String(
                matched.trackingUrl || initialQueryOrder.trackingUrl || ""
              ),
              carrierName: String(
                matched.carrierName || initialQueryOrder.carrierName || ""
              ),
              shippingAddress:
                matched.shippingAddress &&
                typeof matched.shippingAddress === "object"
                  ? (matched.shippingAddress as Order["shippingAddress"])
                  : undefined,
              items: Array.isArray(matched.items)
                ? (matched.items as Order["items"])
                : [],
            };

            if (matched.walletToken && typeof matched.walletToken === 'string') {
              setResolvedToken(matched.walletToken);
            }

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
      } catch {
        // Fallback to local store or query params
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
      } catch {}
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
            liveOrder.id || rawOrderId
          } cambie a Enviado o Entregado.`,
          status: liveOrder.status || "Procesando",
        });
        return;
      }
    }
    setWalletSaved(true);
    setPushBanner({
      title: "Pase guardado en tu Billetera Digital",
      body: `Sincronización en vivo activada para el pedido ${
        liveOrder.id || rawOrderId
      }.`,
      status: liveOrder.status || "Procesando",
    });
  };

  const status = liveOrder.status || "Procesando";
  const isShippedOrDelivered =
    (status === "Enviado" || status === "Entregado") &&
    Boolean(liveOrder.trackingNumber && liveOrder.trackingNumber.trim());

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
      desc: liveOrder.carrierName
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

      {/* Main Digital Wallet Pass Card wrapped in @beui/tilt-card */}
      <div className="w-full max-w-md relative z-10">
        <BeUITiltCard
          maxTilt={12}
          scaleOnHover={1.015}
          glareOpacity={0.28}
          className="w-full rounded-[2.25rem] bg-gradient-to-b from-[#1A1A20] via-[#141418] to-[#101014] border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.75)] overflow-hidden"
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
                  {liveOrder.id || rawOrderId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/45">
                  IMPORTE PAGADO
                </p>
                <p className="font-sans font-extrabold text-xl text-amber-300 mt-0.5">
                  ${Number(liveOrder.total || 0).toFixed(2)} USD
                </p>
              </div>
            </div>

            {/* CLICKABLE TOP CARRIER TRACKING CODE TAG (ONLY WHEN ENVIADO OR ENTREGADO) */}
            {isShippedOrDelivered && (
              <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(liveOrder.trackingNumber || "");
                      setCopiedTracking(true);
                      setTimeout(() => setCopiedTracking(false), 2000);
                      if (liveOrder.trackingUrl && liveOrder.trackingUrl.trim()) {
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
            {/* Mandatory Lifecycle State Informative Box */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                status === "Procesando"
                  ? "bg-amber-500/[0.08] border-amber-400/25 text-amber-200"
                  : status === "Enviado"
                  ? "bg-blue-500/[0.08] border-blue-400/25 text-blue-200"
                  : "bg-emerald-500/[0.08] border-emerald-400/25 text-emerald-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    status === "Procesando"
                      ? "bg-amber-400 text-black shadow-sm"
                      : status === "Enviado"
                      ? "bg-blue-400 text-black shadow-sm"
                      : "bg-emerald-400 text-black shadow-sm"
                  }`}
                >
                  {status === "Procesando" && <Clock className="w-4 h-4" />}
                  {status === "Enviado" && <Truck className="w-4 h-4" />}
                  {status === "Entregado" && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-white">
                    {status === "Procesando" && "Pedido en preparación"}
                    {status === "Enviado" && "Tu pedido está en camino"}
                    {status === "Entregado" && "Pedido entregado con éxito"}
                  </p>
                  <p className="text-[12px] text-white/80 mt-1 leading-relaxed">
                    {status === "Procesando" &&
                      "Tu pedido está siendo preparado. El enlace de seguimiento aparecerá aquí en cuanto el paquete sea entregado al operador logístico."}
                    {status === "Enviado" &&
                      "Tu pedido está en camino. Puedes rastrear los movimientos de tu paquete con la guía indicada."}
                    {status === "Entregado" &&
                      "Tu pedido ha sido entregado correctamente. Gracias por confiar en Lúmina Home."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/50 font-bold">
                ETAPAS DE DESPACHO
              </span>
              <span className="text-[11px] text-white/50 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Sincronización activa
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
                      <Icon className="w-4 h-4" />
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

            {/* Carrier Direct Button when Shipped or Delivered (ONLY if URL is valid) */}
            {isShippedOrDelivered &&
              liveOrder.trackingUrl &&
              /^https?:\/\//i.test(liveOrder.trackingUrl) && (
                <a
                  href={liveOrder.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    Rastrear Envío en {liveOrder.carrierName || "Operador Logístico"}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

            {/* Direct Native Actions: Apple Wallet (.pkpass) & Google Wallet (JWT Save) */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`/api/wallet/pass?type=order&platform=apple&orderId=${encodeURIComponent(
                  liveOrder.id || rawOrderId
                )}${resolvedToken ? `&token=${encodeURIComponent(resolvedToken)}` : ""}&status=${encodeURIComponent(
                  status
                )}&total=${encodeURIComponent(
                  String(liveOrder.total || 0)
                )}&customer=${encodeURIComponent(
                  liveOrder.customerName || "Cliente Lumina"
                )}&date=${encodeURIComponent(
                  liveOrder.date || "Reciente"
                )}&tracking=${encodeURIComponent(
                  liveOrder.trackingNumber || ""
                )}&carrier=${encodeURIComponent(
                  liveOrder.carrierName || ""
                )}&url=${encodeURIComponent(liveOrder.trackingUrl || "")}`}
                className="h-11 rounded-2xl bg-white text-gray-950 hover:bg-gray-100 font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
                </svg>
                <span>Apple Wallet</span>
              </a>

              <a
                href={`/api/wallet/pass?type=order&platform=google&orderId=${encodeURIComponent(
                  liveOrder.id || rawOrderId
                )}${resolvedToken ? `&token=${encodeURIComponent(resolvedToken)}` : ""}&status=${encodeURIComponent(
                  status
                )}&total=${encodeURIComponent(
                  String(liveOrder.total || 0)
                )}&customer=${encodeURIComponent(
                  liveOrder.customerName || "Cliente Lumina"
                )}&date=${encodeURIComponent(
                  liveOrder.date || "Reciente"
                )}&tracking=${encodeURIComponent(
                  liveOrder.trackingNumber || ""
                )}&carrier=${encodeURIComponent(
                  liveOrder.carrierName || ""
                )}&url=${encodeURIComponent(liveOrder.trackingUrl || "")}`}
                className="h-11 rounded-2xl bg-[#1E1E24] hover:bg-[#272730] text-white border border-white/15 font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
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
              </a>
            </div>

            {/* Activate Wallet Push Notifications Button */}
            <button
              type="button"
              onClick={handleEnableNotifications}
              className={`w-full h-11 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                walletSaved
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                  : "bg-white/[0.06] text-white/90 hover:bg-white/[0.12] border-white/10"
              }`}
            >
              {walletSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Notificaciones en Tiempo Real Activas</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Activar Alertas de Envío</span>
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

          {/* Bottom Pass Barcode / QR Verification (Anti-Enumeration Token) */}
          <div className="p-6 flex flex-col items-center text-center space-y-3 bg-black/20">
            <div className="p-3 rounded-2xl bg-white shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(
                  typeof window !== "undefined"
                    ? `${window.location.origin}/wallet/order/${encodeURIComponent(
                        resolvedToken || liveOrder.id || rawOrderId
                      )}`
                    : `https://luminahome.ec/wallet/order/${encodeURIComponent(
                        resolvedToken || liveOrder.id || rawOrderId
                      )}`
                )}`}
                alt="QR Verification"
                className="w-28 h-28 object-contain"
              />
            </div>
            <p className="text-[10.5px] font-mono text-white/50 uppercase tracking-widest">
              PASE OFICIAL LUMINA HOME · {liveOrder.id || rawOrderId}
            </p>
          </div>
        </BeUITiltCard>
      </div>
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
