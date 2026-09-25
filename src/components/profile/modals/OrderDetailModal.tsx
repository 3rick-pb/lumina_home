"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X, CheckCircle2, Mail, Send, RefreshCw, AlertCircle, Truck, ExternalLink, Copy, Wallet } from "lucide-react";
import { Order } from "@/lib/userStore";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";
import { BeUICenterMorphModal, BeUIOrderStatusSelector } from "@/components/ui/BeUIControls";
import { supabase } from "@/lib/supabase";

interface EmailNotificationLog {
  id: string;
  order_id: string;
  recipient_email: string;
  recipient_name?: string | null;
  recipient_type: 'customer' | 'admin';
  email_type: 'customer_invoice' | 'admin_dispatch_notice' | 'order_status_update';
  subject: string;
  status: 'sent' | 'failed' | 'simulated_dev';
  error_message?: string | null;
  sent_at: string;
}

interface OrderDetailModalProps {
  order: Order | null;
  isAdmin: boolean;
  onClose: () => void;
  onUpdateStatus: (
    orderId: string,
    status: "Procesando" | "Enviado" | "Entregado",
    trackingInfo?: { trackingNumber?: string; trackingUrl?: string; carrierName?: string }
  ) => void;
}

export function OrderDetailModal({
  order,
  isAdmin,
  onClose,
  onUpdateStatus
}: OrderDetailModalProps) {
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isResending, setIsResending] = useState<"invoice" | "dispatch" | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Custom symmetrical slider (scrollbar) state and refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbHeightPct, setThumbHeightPct] = useState(25);
  const [hasOverflow, setHasOverflow] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartScrollTopRef = useRef(0);

  const updateScrollMetrics = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight + 4;
    setHasOverflow(canScroll);
    if (canScroll) {
      const maxScroll = el.scrollHeight - el.clientHeight;
      const progress = Math.min(1, Math.max(0, el.scrollTop / maxScroll));
      setScrollProgress(progress);
      const visibleRatio = el.clientHeight / el.scrollHeight;
      setThumbHeightPct(Math.max(15, Math.min(60, visibleRatio * 100)));
    }
  }, []);

  useEffect(() => {
    updateScrollMetrics();
    const handleResize = () => updateScrollMetrics();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollMetrics, order, emailLogs]);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    if (scrollContainerRef.current) {
      dragStartScrollTopRef.current = scrollContainerRef.current.scrollTop;
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !scrollContainerRef.current || !trackRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      const trackAvailable = trackRect.height * (1 - thumbHeightPct / 100);
      if (trackAvailable <= 0) return;

      const deltaY = moveEvent.clientY - dragStartYRef.current;
      const scrollRatio = deltaY / trackAvailable;
      const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
      scrollContainerRef.current.scrollTop = dragStartScrollTopRef.current + scrollRatio * maxScroll;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const trackH = trackRect.height;
    const ratio = Math.min(1, Math.max(0, clickY / trackH));
    const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
    scrollContainerRef.current.scrollTo({
      top: ratio * maxScroll,
      behavior: "smooth"
    });
  };

  const fetchEmailLogs = useCallback(async () => {
    if (!order?.id) return;
    setIsLoadingLogs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/orders/emails?orderId=${encodeURIComponent(order.id)}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setEmailLogs(data.logs as EmailNotificationLog[]);
      }
    } catch (err) {
      console.warn("Could not load email logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [order?.id]);

  useEffect(() => {
    if (order?.id) {
      fetchEmailLogs();
      setFeedback(null);
    }
  }, [order?.id, fetchEmailLogs]);

  const handleResend = async (emailType: "customer_invoice" | "admin_dispatch_notice") => {
    if (!order?.id) return;
    setIsResending(emailType === "customer_invoice" ? "invoice" : "dispatch");
    setFeedback(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/orders/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: order.id,
          emailType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ success: true, message: data.message || "Correo reenviado con éxito" });
        await fetchEmailLogs();
      } else {
        setFeedback({ success: false, message: data.message || data.error || "Error al reenviar" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setFeedback({ success: false, message: msg });
    } finally {
      setIsResending(null);
    }
  };

  const lastOrderRef = useRef<Order | null>(order);
  if (order) {
    lastOrderRef.current = order;
  }
  const activeOrder = order || lastOrderRef.current;
  if (!activeOrder) return null;

  const invoiceLog = emailLogs.find(l => l.email_type === 'customer_invoice');
  const dispatchLog = emailLogs.find(l => l.email_type === 'admin_dispatch_notice');

  const isShippedOrDelivered =
    (activeOrder.status === "Enviado" || activeOrder.status === "Entregado") &&
    Boolean(activeOrder.trackingNumber);
  const resolvedTrackingUrl =
    activeOrder.trackingUrl || "https://www.servientrega.com.ec/Tracking";

  return (
    <BeUICenterMorphModal
      open={Boolean(order)}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      className="max-w-xl"
    >
      <div className="bg-white dark:bg-[#202022] rounded-[2.5rem] w-full shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 overflow-hidden relative max-h-[90vh] flex flex-col">
        <style>{`
          .lumina-order-modal-scroll {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          .lumina-order-modal-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .lumina-bag-close-btn,
          .lumina-bag-close-btn * {
            transition-property: all !important;
            transition-duration: 150ms !important;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        `}</style>
        <div 
          ref={scrollContainerRef}
          onScroll={updateScrollMetrics}
          className="w-full overflow-y-auto lumina-order-modal-scroll p-6 md:p-8 flex-1"
        >
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-white/5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c9276]">
                  Resumen de Pedido
                </span>
                <a
                  href={`/wallet/order/${encodeURIComponent(activeOrder.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-900 dark:bg-white/10 text-white dark:text-[#ccff00] border border-gray-800 dark:border-[#ccff00]/30 hover:scale-105 transition-transform"
                  title="Abrir Tarjeta Digital de Seguimiento (Google / Apple Wallet)"
                >
                  <Wallet className="w-3 h-3" />
                  <span>Pase Wallet</span>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
                  {activeOrder.id}
                </h3>

                {/* TOP TRACKING CODE TAG: Shown ONLY when status is "Enviado" (or "Entregado" with tracking code) */}
                {isShippedOrDelivered && activeOrder.trackingNumber && (
                  <a
                    href={resolvedTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      try {
                        navigator.clipboard?.writeText(activeOrder.trackingNumber || "");
                        setCopiedTracking(true);
                        setTimeout(() => setCopiedTracking(false), 2400);
                      } catch {}
                    }}
                    className="group inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold shadow-[0_6px_18px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    title={`Clic para copiar el código ${activeOrder.trackingNumber} y abrir ${activeOrder.carrierName || "la transportadora"} (${resolvedTrackingUrl})`}
                  >
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {copiedTracking
                        ? `¡Copiado! ${activeOrder.trackingNumber}`
                        : `Guía: ${activeOrder.trackingNumber}`}
                    </span>
                    {activeOrder.carrierName && (
                      <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9.5px] font-sans font-extrabold uppercase tracking-wider">
                        {activeOrder.carrierName}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 opacity-85 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {/* Exact Close Button ("X") from CartDrawer (Bolsa de Compras) */}
            <button
              type="button"
              onClick={onClose}
              className="lumina-bag-close-btn w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Cerrar detalle del pedido"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tracking Progress Bar */}
          <div className="my-5 p-4 bg-gray-50 dark:bg-[#2a2a2c] rounded-2xl border border-gray-100 dark:border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
              {isShippedOrDelivered && activeOrder.trackingNumber ? (
                <a
                  href={resolvedTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      navigator.clipboard?.writeText(activeOrder.trackingNumber || "");
                      setCopiedTracking(true);
                      setTimeout(() => setCopiedTracking(false), 2400);
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Código de Rastreo:</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/25">
                    {activeOrder.trackingNumber}
                  </span>
                  <Copy className="w-3 h-3 opacity-75" />
                </a>
              ) : (
                <span className="font-medium text-gray-500 dark:text-gray-400">
                  Estado logístico:{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    En preparación (Guía disponible al enviar)
                  </span>
                </span>
              )}

              <BeUIOrderStatusSelector
                status={activeOrder.status}
                isAdmin={isAdmin}
                orderId={activeOrder.id}
                initialTrackingNumber={activeOrder.trackingNumber}
                initialTrackingUrl={activeOrder.trackingUrl}
                initialCarrierName={activeOrder.carrierName}
                onUpdateStatus={(nextSt, trackingInfo) =>
                  onUpdateStatus(activeOrder.id, nextSt, trackingInfo)
                }
                size="sm"
                align="end"
              />
            </div>

          {/* Steps timeline */}
          <div className="flex items-center justify-between relative pt-2">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 dark:bg-[#48484a] -z-0" />
            {[
              { label: "Pagado", done: true },
              { label: "En Taller", done: true },
              { label: "En Reparto", done: activeOrder.status === "Enviado" || activeOrder.status === "Entregado" },
              { label: "Entregado", done: activeOrder.status === "Entregado" },
            ].map((st, i) => (
              <div key={i} className="flex flex-col items-center gap-1 relative z-10">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${st.done ? "bg-[#8c9276] text-white dark:text-gray-900" : "bg-gray-200 dark:bg-[#48484a] text-gray-500 dark:text-gray-400"}`}>
                  {st.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{st.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer & Order Metadata Card */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Comprador & Fecha */}
          <div className="p-3.5 bg-gray-50/80 dark:bg-[#2a2a2c]/80 rounded-2xl border border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Cliente / Comprador</p>
            <div className="flex items-center gap-2.5 mb-1">
              <BlobatarAvatar
                name={activeOrder.customerAvatarSeed || activeOrder.userId || activeOrder.customerEmail || activeOrder.customerName}
                background={activeOrder.customerAvatarShape || "squircle"}
                role={activeOrder.customerRole || "USER"}
                size={34}
                animate="always"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{activeOrder.customerName || "Cliente Lumina"}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{activeOrder.customerEmail || "cliente@lumina.com"}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-white/10/60 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Fecha:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{activeOrder.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Hora:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {activeOrder.time || (activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : "12:00")}
                </span>
              </div>
            </div>
          </div>

          {/* Entrega & Pago */}
          <div className="p-3.5 bg-gray-50/80 dark:bg-[#2a2a2c]/80 rounded-2xl border border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Dirección de Entrega</p>
            {activeOrder.shippingAddress ? (
              <>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{activeOrder.shippingAddress.street}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{activeOrder.shippingAddress.city}{activeOrder.shippingAddress.state ? `, ${activeOrder.shippingAddress.state}` : ""}</p>
                <p className="text-[10px] text-gray-400">{activeOrder.shippingAddress.postalCode} • {activeOrder.shippingAddress.country}</p>
                
                {/* Metadatos adicionales de entrega: Cédula & WhatsApp */}
                {(activeOrder.customerIdNumber || activeOrder.shippingAddress.idNumber || activeOrder.customerPhone || activeOrder.shippingAddress.phone) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-200/60 dark:border-white/10/60">
                    {(activeOrder.customerIdNumber || activeOrder.shippingAddress.idNumber) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 font-semibold">
                        C.I.: {activeOrder.customerIdNumber || activeOrder.shippingAddress.idNumber}
                      </span>
                    )}
                    {(activeOrder.customerPhone || activeOrder.shippingAddress.phone) && (
                      <a
                        href={`https://wa.me/${(activeOrder.customerPhone || activeOrder.shippingAddress.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 font-semibold hover:underline flex items-center gap-1"
                        title="Abrir chat en WhatsApp"
                      >
                        <span>WhatsApp:</span>
                        <span>{activeOrder.customerPhone || activeOrder.shippingAddress.phone}</span>
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Dirección registrada por defecto</p>
            )}
            <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-white/10/60 text-[11px] text-gray-600 dark:text-gray-400 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Método de Pago:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{activeOrder.paymentMethod || "Tarjeta de Crédito"}</span>
            </div>
          </div>
        </div>

        {/* Email Automated Notifications Section */}
        <div className="mb-5 p-4 bg-gray-50/90 dark:bg-[#2a2a2c]/90 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#8c9276]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Notificaciones Automáticas por Correo
              </h4>
            </div>
            {isLoadingLogs && (
              <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            )}
          </div>

          {feedback && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              feedback.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {feedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Factura al Cliente */}
            <div className="p-3 bg-white dark:bg-[#202022] rounded-xl border border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Factura al Cliente</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  invoiceLog?.status === 'sent' 
                    ? "bg-emerald-100 text-emerald-800" 
                    : invoiceLog?.status === 'simulated_dev'
                    ? "bg-blue-100 text-blue-800"
                    : invoiceLog?.status === 'failed'
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {invoiceLog?.status === 'sent' ? "Enviado Real" : invoiceLog?.status === 'simulated_dev' ? "Simulado (Dev)" : invoiceLog?.status === 'failed' ? "Error Envío" : "Sin Registro"}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate">{activeOrder.customerEmail || "Sin correo"}</p>
              {isAdmin && (
                <button
                  onClick={() => handleResend('customer_invoice')}
                  disabled={isResending !== null}
                  className="w-full mt-1 px-2.5 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isResending === 'invoice' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 text-[#8c9276]" />
                  )}
                  Reenviar Factura
                </button>
              )}
            </div>

            {/* Alerta de Despacho a Administradores */}
            <div className="p-3 bg-white dark:bg-[#202022] rounded-xl border border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Alerta de Despacho</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  dispatchLog?.status === 'sent' 
                    ? "bg-emerald-100 text-emerald-800" 
                    : dispatchLog?.status === 'simulated_dev'
                    ? "bg-blue-100 text-blue-800"
                    : dispatchLog?.status === 'failed'
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {dispatchLog?.status === 'sent' ? "Enviado Real" : dispatchLog?.status === 'simulated_dev' ? "Simulado (Dev)" : dispatchLog?.status === 'failed' ? "Error Envío" : "Sin Registro"}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate">Bodega & Administradores</p>
              {isAdmin && (
                <button
                  onClick={() => handleResend('admin_dispatch_notice')}
                  disabled={isResending !== null}
                  className="w-full mt-1 px-2.5 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isResending === 'dispatch' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 text-emerald-600" />
                  )}
                  Reenviar Alerta Despacho
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items Purchased */}
        <div className="space-y-3 mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Piezas Adquiridas ({activeOrder.items.length})</h4>
          {activeOrder.items.length === 0 ? (
            <div className="p-3 bg-gray-50 dark:bg-[#2a2a2c] rounded-xl flex items-center justify-between text-xs">
              <span>Pieza Colección Exclusiva Lumina</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">${activeOrder.total.toFixed(2)}</span>
            </div>
          ) : (
            activeOrder.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-[#2a2a2c] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-[#202022] shrink-0 relative border border-gray-100 dark:border-white/5">
                    <Image src={item.product.imageUrl} alt={item.product.title} fill sizes="40px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.product.title}</p>
                    <p className="text-[10px] text-gray-400">Cant: {item.quantity} {item.color ? `• Color: ${item.color}` : ""}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Total Facturado</span>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">${activeOrder.total.toFixed(2)}</span>
        </div>

        {/* If Admin: live status changer with BeUIPopover + BeUIAnimatedBadge */}
        {isAdmin && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/25 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-800/30">
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">Actualizar Estado (Administrador)</p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400/80">Cambia la etapa del pedido en tiempo real para el cliente</p>
            </div>
            <BeUIOrderStatusSelector
              status={activeOrder.status}
              isAdmin={true}
              onUpdateStatus={(nextSt) => onUpdateStatus(activeOrder.id, nextSt)}
              size="md"
              align="end"
            />
          </div>
        )}
        </div>

        {/* Custom Symmetrical Slider / Scrollbar following modal geometry */}
        {hasOverflow && (
          <div className="absolute right-2 sm:right-3 top-12 bottom-12 w-2 z-30 flex items-center justify-center pointer-events-none select-none">
            <div 
              ref={trackRef}
              onClick={handleTrackClick}
              className="w-1.5 h-full rounded-full bg-gray-200/70 dark:bg-white/10 relative pointer-events-auto cursor-pointer transition-colors hover:bg-gray-300/80 dark:hover:bg-white/15"
              title="Desplazarse"
            >
              <div 
                style={{
                  height: `${thumbHeightPct}%`,
                  top: `${scrollProgress * (100 - thumbHeightPct)}%`,
                }}
                onMouseDown={handleThumbMouseDown}
                className="absolute left-0 right-0 rounded-full bg-[#8c9276] hover:bg-[#787e63] dark:bg-[#a3a98d] dark:hover:bg-[#b8be9f] cursor-grab active:cursor-grabbing transition-colors shadow-sm"
              />
            </div>
          </div>
        )}
      </div>
    </BeUICenterMorphModal>
  );
}
