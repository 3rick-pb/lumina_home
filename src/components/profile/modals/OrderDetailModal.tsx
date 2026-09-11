"use client";

import React from "react";
import Image from "next/image";
import { X, CheckCircle2 } from "lucide-react";
import { Order } from "@/lib/userStore";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";

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
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#202022] rounded-[2.5rem] w-full max-w-xl shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 md:p-8 relative max-h-[90vh] overflow-y-auto lumina-order-modal-scroll border border-gray-100 dark:border-white/10">
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
            <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-white/10/60 text-[11px] text-gray-600 dark:text-gray-400 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Fecha y Hora:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{order.date} {order.time ? `• ${order.time}` : ""}</span>
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
  );
}
