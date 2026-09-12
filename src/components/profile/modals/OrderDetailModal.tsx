"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, CheckCircle2, Mail, Send, RefreshCw, AlertCircle } from "lucide-react";
import { Order } from "@/lib/userStore";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";
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
  onUpdateStatus: (orderId: string, status: "Procesando" | "Enviado" | "Entregado") => void;
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

  if (!order) return null;

  const invoiceLog = emailLogs.find(l => l.email_type === 'customer_invoice');
  const dispatchLog = emailLogs.find(l => l.email_type === 'admin_dispatch_notice');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#202022] rounded-[2.5rem] w-full max-w-xl shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10 overflow-hidden relative max-h-[90vh] flex flex-col">
        <style>{`
          .lumina-order-modal-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .lumina-order-modal-scroll::-webkit-scrollbar-track {
            background: transparent;
            margin-top: 38px;
            margin-bottom: 38px;
            border-radius: 9999px;
          }
          .lumina-order-modal-scroll::-webkit-scrollbar-thumb {
            background: rgba(140, 146, 118, 0.4);
            border-radius: 9999px;
            transition: background 0.3s ease;
          }
          .lumina-order-modal-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(140, 146, 118, 0.85);
          }
          .dark .lumina-order-modal-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.22);
          }
          .dark .lumina-order-modal-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.45);
          }
          .lumina-order-modal-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(140, 146, 118, 0.4) transparent;
          }
          .dark .lumina-order-modal-scroll {
            scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
          }
        `}</style>
        <div className="w-full overflow-y-auto lumina-order-modal-scroll p-6 md:p-8 flex-1">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c9276]">Detalle de Envío</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">{order.id}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3a3a3c] text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tracking Progress Bar */}
        <div className="my-5 p-4 bg-gray-50 dark:bg-[#2a2a2c] rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Rastreo: <span className="font-mono">{order.trackingNumber || "LM-982410"}</span></span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
              order.status === "Entregado" ? "bg-emerald-100 text-emerald-800" : order.status === "Enviado" ? "bg-blue-100 text-blue-800" : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
            }`}>
              {order.status}
            </span>
          </div>

          {/* Steps timeline */}
          <div className="flex items-center justify-between relative pt-2">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 dark:bg-[#48484a] -z-0" />
            {[
              { label: "Pagado", done: true },
              { label: "En Taller", done: true },
              { label: "En Reparto", done: order.status === "Enviado" || order.status === "Entregado" },
              { label: "Entregado", done: order.status === "Entregado" },
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
                name={order.userId || order.customerEmail || order.customerName}
                size={34}
                animate="always"
                background="squircle"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{order.customerName || "Cliente Lumina"}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{order.customerEmail || "cliente@lumina.com"}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-white/10/60 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Fecha:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{order.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Hora:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {order.time || (order.createdAt ? new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : "12:00")}
                </span>
              </div>
            </div>
          </div>

          {/* Entrega & Pago */}
          <div className="p-3.5 bg-gray-50/80 dark:bg-[#2a2a2c]/80 rounded-2xl border border-gray-100 dark:border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Dirección de Entrega</p>
            {order.shippingAddress ? (
              <>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{order.shippingAddress.street}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}</p>
                <p className="text-[10px] text-gray-400">{order.shippingAddress.postalCode} • {order.shippingAddress.country}</p>
                
                {/* Metadatos adicionales de entrega: Cédula & WhatsApp */}
                {(order.customerIdNumber || order.shippingAddress.idNumber || order.customerPhone || order.shippingAddress.phone) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-200/60 dark:border-white/10/60">
                    {(order.customerIdNumber || order.shippingAddress.idNumber) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 font-semibold">
                        C.I.: {order.customerIdNumber || order.shippingAddress.idNumber}
                      </span>
                    )}
                    {(order.customerPhone || order.shippingAddress.phone) && (
                      <a
                        href={`https://wa.me/${(order.customerPhone || order.shippingAddress.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 font-semibold hover:underline flex items-center gap-1"
                        title="Abrir chat en WhatsApp"
                      >
                        <span>WhatsApp:</span>
                        <span>{order.customerPhone || order.shippingAddress.phone}</span>
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
              <span className="font-semibold text-gray-800 dark:text-gray-200">{order.paymentMethod || "Tarjeta de Crédito"}</span>
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
              <p className="text-[10px] text-gray-400 truncate">{order.customerEmail || "Sin correo"}</p>
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Piezas Adquiridas ({order.items.length})</h4>
          {order.items.length === 0 ? (
            <div className="p-3 bg-gray-50 dark:bg-[#2a2a2c] rounded-xl flex items-center justify-between text-xs">
              <span>Pieza Colección Exclusiva Lumina</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">${order.total.toFixed(2)}</span>
            </div>
          ) : (
            order.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-[#2a2a2c] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-[#202022] shrink-0 relative border border-gray-100 dark:border-white/5">
                    <Image src={item.product.imageUrl} alt={item.product.title} fill className="object-cover" />
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
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">${order.total.toFixed(2)}</span>
        </div>

        {/* If Admin: live status changer */}
        {isAdmin && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60">
            <div>
              <p className="text-xs font-bold text-amber-900">Actualizar Estado (Administrador)</p>
              <p className="text-[10px] text-amber-700">Cambia la etapa del pedido en tiempo real para el cliente</p>
            </div>
            <select 
              value={order.status}
              onChange={(e) => {
                const nextSt = e.target.value as "Procesando" | "Enviado" | "Entregado";
                onUpdateStatus(order.id, nextSt);
              }}
              className="text-xs font-bold bg-white dark:bg-[#202022] border border-amber-300 rounded-xl px-3.5 py-2 outline-none shadow-sm dark:shadow-none cursor-pointer text-gray-900 dark:text-gray-100"
            >
              <option value="Procesando">Procesando</option>
              <option value="Enviado">Enviado</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
