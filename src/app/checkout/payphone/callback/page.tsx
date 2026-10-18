"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ShieldCheck, 
  Check, 
  Copy, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft, 
  Printer, 
  Package, 
  Sparkles, 
  MapPin, 
  Lock, 
  AlertCircle, 
  XCircle, 
  Loader2,
  QrCode,
  Truck,
  CheckCircle2
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useUserStore, Order } from "@/lib/userStore";
import { useBrand } from "@/core/hooks/useBrand";
import { WalletPassPopupModal } from "@/components/ui/WalletPassPopupModal";
import { GoogleWalletButton } from "@/components/ui/GoogleWalletButton";
import { BeUITiltCard } from "@/components/ui/BeUIControls";
import { playFavoriteSound } from "@/lib/soundUtils";

function PayPhoneCallbackContent() {
  const brand = useBrand();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const { addOrder } = useUserStore();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    const clientTxId = searchParams.get("clientTransactionId");

    if (!id || !clientTxId) {
      setStatus("error");
      setErrorMessage("Parámetros de autorización incompletos en la respuesta de la pasarela PayPhone.");
      return;
    }

    let isMounted = true;

    async function confirmPayment() {
      try {
        const res = await fetch("/api/payphone/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, clientTxId })
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success && data.transactionStatus === "Approved") {
          setStatus("success");
          clearCart();
          if (data.order) {
            setConfirmedOrder(data.order);
            addOrder(data.order);
          }
          try {
            playFavoriteSound();
          } catch {}
        } else {
          setStatus("error");
          setErrorMessage(data.error || data.message || "La transacción bancaria no pudo ser validada por la pasarela PayPhone.");
        }
      } catch {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage("Error de comunicación segura al verificar el estado del pago con PayPhone.");
      }
    }

    confirmPayment();

    return () => {
      isMounted = false;
    };
  }, [searchParams, clearCart, addOrder]);

  const handleCopyOrderId = (orderId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-[#121214] text-gray-900 dark:text-gray-100 flex flex-col justify-between relative overflow-hidden py-8 sm:py-16 px-4 sm:px-6">
      {/* High-Ticket Atmospheric Ambient Glows */}
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] sm:w-[900px] h-[450px] rounded-full bg-gradient-to-b from-[#8c9276]/18 via-[#c5a880]/12 to-transparent blur-3xl -z-10" 
      />
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-tl from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl -z-10" 
      />

      {/* Top Luxury Atelier Header */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between pb-8">
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {brand.shortName} · Boutique
          </span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 text-[10.5px] font-mono text-gray-500 dark:text-gray-400">
          <Lock className="w-3 h-3 text-[#8c9276]" />
          <span>Canal Cifrado 256-Bit</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto w-full my-auto">
        {/* =================================================================== */}
        {/* 1. LOADING STATE: High-End Crystalline Verification Radar            */}
        {/* =================================================================== */}
        {status === "loading" && (
          <div className="p-2 sm:p-3 rounded-[2.5rem] bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <div className="rounded-[calc(2.5rem-0.625rem)] bg-white/95 dark:bg-[#18181b]/95 border border-black/[0.06] dark:border-white/10 p-10 sm:p-16 text-center space-y-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#8c9276]/30 border-t-[#8c9276] animate-spin" />
                <div className="w-14 h-14 rounded-full bg-[#8c9276]/10 flex items-center justify-center text-[#8c9276]">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Conciliación en tiempo real · PayPhone
                </span>
                <h2 className="font-display italic font-semibold text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight">
                  Verificando autorización bancaria...
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  Estamos validando el token criptográfico con los servidores de PayPhone Ecuador. Por favor, mantén esta ventana abierta.
                </p>
              </div>

              {/* High-Ticket Indeterminate Progress Line */}
              <div className="max-w-xs mx-auto h-1 rounded-full bg-black/[0.05] dark:bg-white/10 overflow-hidden relative">
                <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#8c9276] to-transparent animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. SUCCESS STATE: High-Ticket Atelier Acquisition Certificate        */}
        {/* =================================================================== */}
        {status === "success" && (
          <div className="p-2 sm:p-3 rounded-[2.5rem] bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl animate-fade-in">
            <div className="rounded-[calc(2.5rem-0.625rem)] bg-white/95 dark:bg-[#18181b]/95 border border-black/[0.06] dark:border-white/10 p-6 sm:p-12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] space-y-8 relative overflow-hidden">
              
              {/* Luxury Certificate Watermark Seal */}
              <div 
                aria-hidden="true" 
                className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-transparent blur-2xl" 
              />

              {/* Hero Confirmation Crest */}
              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-[#8c9276]/20 flex items-center justify-center p-1.5 ring-1 ring-emerald-500/30">
                    <div className="w-full h-full rounded-full bg-white dark:bg-[#1f1f23] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
                      <Check className="w-8 h-8 stroke-[2.8]" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] border border-emerald-200/60 dark:border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Pago Autorizado · Certificado de Adquisición
                  </span>
                  <h1 className="font-display italic font-semibold text-3xl sm:text-5xl text-gray-950 dark:text-white tracking-tight mt-2.5">
                    Una adquisición de distinción.
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto leading-relaxed">
                    Hemos recibido la confirmación de pago de tu orden. Tu pedido ha sido derivado a nuestro atelier para su preparación bajo empaque sellado de colección.
                  </p>
                </div>
              </div>

              {/* 4-Step Linear Atelier Progress Tracker */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
                  <span>Itinerario del Pedido</span>
                  <span className="text-[#8c9276] font-mono">Fase 2 de 4</span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {/* Step 1: Autorizado */}
                  <div className="space-y-1.5 text-center">
                    <div className="h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                      ✓ Autorizado
                    </span>
                  </div>

                  {/* Step 2: En Atelier */}
                  <div className="space-y-1.5 text-center">
                    <div className="h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 block truncate">
                      Atelier
                    </span>
                  </div>

                  {/* Step 3: Calidad */}
                  <div className="space-y-1.5 text-center">
                    <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 block truncate">
                      Inspección
                    </span>
                  </div>

                  {/* Step 4: Despacho */}
                  <div className="space-y-1.5 text-center">
                    <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 block truncate">
                      Despacho
                    </span>
                  </div>
                </div>
              </div>

              {/* High-Ticket Physical Receipt Card */}
              {confirmedOrder && (
                <div className="rounded-[1.75rem] border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#141416] p-5 sm:p-7 shadow-xs space-y-5 text-left">
                  {/* Header Row: Order Number + Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/[0.06] dark:border-white/10">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider block">
                        Número de Adquisición
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-base sm:text-lg text-gray-950 dark:text-white">
                          {confirmedOrder.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderId(confirmedOrder.id)}
                          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          title="Copiar número de orden"
                        >
                          {copiedId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/10 border border-black/[0.06] dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                        title="Imprimir comprobante formal"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>
                    </div>
                  </div>

                  {/* Items Gallery if available in Order */}
                  {confirmedOrder.items && confirmedOrder.items.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-black/[0.06] dark:border-white/10">
                      <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider block">
                        Piezas Adquiridas ({confirmedOrder.items.length})
                      </span>
                      <div className="space-y-2.5">
                        {confirmedOrder.items.map((item, idx) => {
                          const itemTitle = item.product?.title || (item as any).title || "Pieza Lumina";
                          const itemImage = item.product?.imageUrl || (item as any).imageUrl || (item as any).image || "";
                          const itemCategory = item.product?.category || (item as any).category || "Atelier";
                          const itemPrice = typeof item.product?.price === "number" 
                            ? item.product.price 
                            : (Number((item as any).price) || 0);

                          return (
                            <div 
                              key={`${item.id}-${idx}`} 
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 overflow-hidden shrink-0 relative">
                                  {itemImage ? (
                                    <Image 
                                      src={itemImage} 
                                      alt={itemTitle} 
                                      fill 
                                      className="object-cover" 
                                    />
                                  ) : (
                                    <Package className="w-4 h-4 text-gray-400 m-auto mt-3" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {itemTitle}
                                  </h4>
                                  <span className="text-[10.5px] text-gray-400 dark:text-gray-500 font-mono">
                                    Cantidad: {item.quantity} · {itemCategory}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-gray-900 dark:text-white shrink-0">
                                ${(itemPrice * item.quantity).toFixed(2)} USD
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Financial Breakdown & Destination Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Destination */}
                    <div className="space-y-1 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10.5px] font-mono uppercase">
                        <MapPin className="w-3.5 h-3.5 text-[#8c9276]" />
                        <span>Destino de Entrega</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {confirmedOrder.recipient || confirmedOrder.customerName || "Cliente Lumina"}
                      </p>
                      {confirmedOrder.shippingAddress?.street && (
                        <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-snug">
                          {confirmedOrder.shippingAddress.street} {confirmedOrder.shippingAddress.exteriorNumber || ""}
                          {confirmedOrder.shippingAddress.city ? `, ${confirmedOrder.shippingAddress.city}` : ""}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 font-mono pt-0.5">
                        Modalidad: {confirmedOrder.paymentMethod || "PayPhone Card Gateway"}
                      </p>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                          <span>Empaque de Colección:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Cortesía</span>
                        </div>
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                          <span>Seguro de Tránsito:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Incluido</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-black/[0.06] dark:border-white/10 flex items-baseline justify-between">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                          Total Pagado:
                        </span>
                        <span className="font-sans font-extrabold text-xl text-gray-950 dark:text-white">
                          ${Number(confirmedOrder.total).toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Digital Wallet Pass & Real-Time Tracking Card */}
              {confirmedOrder && (
                <div className="rounded-[1.75rem] p-5 sm:p-6 bg-gradient-to-br from-[#141417] via-[#1c1b20] to-[#111114] text-white border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.25)] text-left relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
                    {/* 3D Scannable QR Code */}
                    <BeUITiltCard maxTilt={12} scaleOnHover={1.03} glareOpacity={0.25} className="shrink-0 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setIsWalletOpen(true)}
                        className="p-3 rounded-2xl bg-white text-gray-900 shadow-lg flex flex-col items-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-transform"
                        title="Ver Pase Digital en Google / Apple Wallet"
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&ecc=M&margin=4&data=${encodeURIComponent(
                            `${typeof window !== "undefined" ? window.location.origin : "https://luminahome.ec"}/api/wallet/pass?type=order&orderId=${encodeURIComponent(confirmedOrder.id)}&total=${encodeURIComponent(String(confirmedOrder.total || 0))}&status=${encodeURIComponent(confirmedOrder.status || "Procesando")}&customer=${encodeURIComponent(confirmedOrder.customerName || "Cliente")}&date=${encodeURIComponent(confirmedOrder.date || "Reciente")}`
                          )}`}
                          alt={`QR Pase de Pedido ${confirmedOrder.id}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-contain select-none"
                        />
                        <span className="text-[8.5px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <QrCode className="w-2.5 h-2.5 text-[#8c9276]" />
                          Pase Digital
                        </span>
                      </button>
                    </BeUITiltCard>

                    <div className="flex-1 space-y-2.5 text-center sm:text-left">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[9.5px] font-bold uppercase tracking-widest">
                          Google Wallet & Apple Pass
                        </span>
                        <h4 className="font-display font-bold text-base sm:text-lg text-white mt-1">
                          Seguimiento en Pantalla de Bloqueo
                        </h4>
                        <p className="text-xs text-white/70 leading-relaxed mt-0.5">
                          Añade este pase a tu billetera móvil para recibir alertas automáticas cuando tu paquete sea despachado y entregado.
                        </p>
                      </div>

                      <div className="pt-1 flex justify-center sm:justify-start">
                        <GoogleWalletButton
                          onClick={() => setIsWalletOpen(true)}
                          topText="Guardar en"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Concierge Reassurance Trio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-left text-xs">
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="font-bold text-gray-900 dark:text-white text-[11.5px]">Empaque Sellado</h5>
                  <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-snug">
                    Caja rígida reforzada con sello de autenticidad del atelier.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="font-bold text-gray-900 dark:text-white text-[11.5px]">Rastreo Directo</h5>
                  <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-snug">
                    Enlace de monitoreo y notificaciones al móvil con cada cambio de estado.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/5 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="font-bold text-gray-900 dark:text-white text-[11.5px]">Concierge Privado</h5>
                  <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-snug">
                    Asesor personal asignado para cualquier consulta o coordinación de entrega.
                  </p>
                </div>
              </div>

              {/* High-Ticket Navigation Actions (Button-in-Button) */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/profile"
                  className="group flex-1 h-14 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-bold text-sm flex items-center justify-between px-5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:opacity-95 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white dark:text-gray-950" />
                  </div>
                  <span>Ver Estado en Mis Pedidos</span>
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-950 text-gray-950 dark:text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </Link>

                <Link
                  href="/shop"
                  className="flex-1 h-14 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-black/[0.06] dark:border-white/10 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Seguir Explorando el Atelier</span>
                </Link>
              </div>

            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. ERROR STATE: Refined Concierge Recovery Portal                    */}
        {/* =================================================================== */}
        {status === "error" && (
          <div className="p-2 sm:p-3 rounded-[2.5rem] bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-fade-in">
            <div className="rounded-[calc(2.5rem-0.625rem)] bg-white/95 dark:bg-[#18181b]/95 border border-black/[0.06] dark:border-white/10 p-8 sm:p-14 text-center space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
                <XCircle className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-bold uppercase tracking-[0.2em] border border-rose-200 dark:border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5" /> Transacción no completada
                </span>
                <h2 className="font-display italic font-semibold text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight">
                  No pudimos confirmar el cobro
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  {errorMessage || "La entidad bancaria o pasarela PayPhone no autorizó la operación. No se ha realizado ningún cobro indebido a tu cuenta."}
                </p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("lumina_cart_reopen", "true");
                    }
                    router.push("/");
                  }}
                  className="group flex-1 h-14 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-bold text-sm flex items-center justify-between px-5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:opacity-95 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white dark:text-gray-950" />
                  </div>
                  <span>Reintentar en Bolsa de Compras</span>
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-950 text-gray-950 dark:text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/shop")}
                  className="flex-1 h-14 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-black/[0.06] dark:border-white/10 text-sm font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  Volver a la Boutique
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding Guarantee */}
      <footer className="max-w-3xl mx-auto w-full text-center pt-8">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono tracking-wider">
          {brand.name} · Atelier de Diseño & Interiorismo · Todos los derechos reservados
        </p>
      </footer>

      {/* In-Page Google / Apple Wallet Pass Modal */}
      {confirmedOrder && (
        <WalletPassPopupModal
          open={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          order={confirmedOrder}
          orderId={confirmedOrder.id}
          total={confirmedOrder.total}
          status={confirmedOrder.status}
          customerName={confirmedOrder.customerName || "Cliente"}
          trackingNumber={confirmedOrder.trackingNumber}
          trackingUrl={confirmedOrder.trackingUrl}
          carrierName={confirmedOrder.carrierName}
          date={confirmedOrder.date}
          initialPlatform="google"
        />
      )}
    </div>
  );
}

export default function PayPhoneCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#121214] flex items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#8c9276] border-t-transparent animate-spin" />
      </div>
    }>
      <PayPhoneCallbackContent />
    </Suspense>
  );
}
