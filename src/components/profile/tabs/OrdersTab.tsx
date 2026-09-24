"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, Layers, Clock, Truck, CheckCircle2 } from "lucide-react";
import { useUserStore, Order } from "@/lib/userStore";
import { normalizeSearchText } from "@/lib/utils";
import { CloudSyncStatus } from "../CloudSyncStatus";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";
import { BeUIOrderStatusSelector } from "@/components/ui/BeUIControls";

interface OrdersTabProps {
  isAdmin: boolean;
  searchQuery?: string;
  setSelectedOrder: (order: Order) => void;
}

const FILTER_ITEMS = [
  {
    id: "all",
    label: "Todos",
    icon: Layers,
    dotClass: "bg-[#8c9276] dark:bg-[#ccff00]",
    activeText: "text-gray-900 dark:text-white",
    badgeActive: "bg-gray-900 dark:bg-[#ccff00] text-white dark:text-gray-950",
  },
  {
    id: "Procesando",
    label: "Procesando",
    icon: Clock,
    dotClass: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]",
    activeText: "text-amber-900 dark:text-amber-300",
    badgeActive: "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30",
  },
  {
    id: "Enviado",
    label: "Enviado",
    icon: Truck,
    dotClass: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]",
    activeText: "text-blue-900 dark:text-blue-300",
    badgeActive: "bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30",
  },
  {
    id: "Entregado",
    label: "Entregado",
    icon: CheckCircle2,
    dotClass: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
    activeText: "text-emerald-900 dark:text-emerald-300",
    badgeActive: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30",
  },
] as const;

export function OrdersTab({
  isAdmin,
  searchQuery = "",
  setSelectedOrder
}: OrdersTabProps) {
  const { orders, updateOrderStatus, refreshOrders } = useUserStore();
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncOrders = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await refreshOrders();
    } catch {
      setSyncError("Error al sincronizar pedidos");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return orders.filter(ord => {
      const matchStatus = orderStatusFilter === "all" || ord.status.toLowerCase() === orderStatusFilter.toLowerCase();
      const matchQuery = !q || 
        normalizeSearchText(ord.id).includes(q) ||
        normalizeSearchText(ord.customerName || "").includes(q) ||
        normalizeSearchText(ord.customerEmail || "").includes(q) ||
        normalizeSearchText(ord.trackingNumber || "").includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, orderStatusFilter, searchQuery]);

  return (
    <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6 animate-fade-in">
      {/* Header + Left-Aligned Architectural Status Filter Bar */}
      <div className="flex flex-col gap-4 pb-1 border-b border-gray-100 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#8c9276]/15 border border-[#8c9276]/30 flex items-center justify-center text-[#8c9276] shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <span>Historial Completo de Pedidos</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Trazabilidad en tiempo real, recibos y estados de envío interactivos.
            </p>
          </div>

          <div className="shrink-0">
            <CloudSyncStatus
              isSyncing={isSyncing}
              syncError={syncError}
              onSave={handleSyncOrders}
              saveLabel="Guardar en nube"
              savedLabel="Guardado en nube"
            />
          </div>
        </div>

        {/* Left-Aligned Luxury Segmented Filter Dock ("Todos, Procesando, Enviado, Entregado") */}
        <div className="flex items-center justify-start overflow-x-auto max-w-full hide-scrollbar">
          <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-stone-100/95 dark:bg-[#161618] border border-stone-200/80 dark:border-white/10 shadow-inner">
            {FILTER_ITEMS.map((item) => {
              const isActive = orderStatusFilter === item.id;
              const count =
                item.id === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === item.id).length;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(item.id)}
                  className={`relative z-10 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer select-none ${
                    isActive
                      ? item.activeText
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="orders-status-filter-active-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
                      className="absolute inset-0 rounded-xl bg-white dark:bg-[#26262a] border border-stone-200/80 dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] -z-10"
                    />
                  )}

                  <span
                    className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-300 ${
                      item.dotClass
                    } ${isActive ? "scale-110" : "opacity-65"}`}
                  />

                  <span className="tracking-tight">{item.label}</span>

                  <span
                    className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center justify-center transition-all ${
                      isActive
                        ? item.badgeActive
                        : "bg-stone-200/75 dark:bg-white/[0.07] text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-gray-50/50 dark:bg-[#2a2a2c]/50 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No hay pedidos que coincidan</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {orders.length === 0 
              ? "Esta cuenta aún no ha realizado compras. Los pedidos que hagas se sincronizarán aquí." 
              : "No hay pedidos con el filtro de estado seleccionado."}
          </p>
          {orders.length === 0 && (
            <Link href="/shop" className="inline-block px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">
              Explorar Catálogo
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 px-3">ID Pedido</th>
                {isAdmin && <th className="pb-3 px-3">Cliente</th>}
                <th className="pb-3 px-3">Código Rastreo</th>
                <th className="pb-3 px-3">Artículos</th>
                <th className="pb-3 px-3">Total</th>
                <th className="pb-3 px-3">Estado</th>
                <th className="pb-3 px-3">Fecha / Hora</th>
                <th className="pb-3 pr-2 pl-3 text-right whitespace-nowrap">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50/70 dark:hover:bg-[#2c2c2e]/70 transition-colors">
                  <td className="py-4 px-3 font-mono font-bold text-gray-900 dark:text-gray-100">{ord.id}</td>
                  {isAdmin && (
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2.5">
                        <BlobatarAvatar
                          name={ord.userId || ord.customerEmail || ord.customerName}
                          size={30}
                          animate="hover"
                          background="circle"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{ord.customerName || "Cliente Lumina"}</p>
                          <p className="text-[10px] text-gray-400">{ord.customerEmail || "cliente@lumina.com"}</p>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="py-4 px-3 font-mono text-gray-500 dark:text-gray-400">{ord.trackingNumber || "TRK-PENDIENTE"}</td>
                  <td className="py-4 px-3 text-gray-700 dark:text-gray-300">
                    {ord.items.length > 0 ? `${ord.items.length} producto(s)` : "1 producto"}
                  </td>
                  <td className="py-4 px-3 font-bold text-gray-900 dark:text-gray-100">${ord.total.toFixed(2)}</td>
                  <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                    <BeUIOrderStatusSelector
                      status={ord.status}
                      isAdmin={isAdmin}
                      onUpdateStatus={(nextSt) => updateOrderStatus(ord.id, nextSt)}
                      size="sm"
                      align="center"
                    />
                  </td>
                  <td className="py-4 px-3 text-gray-500 dark:text-gray-400">
                    <span className="block font-medium text-gray-800 dark:text-gray-200">{ord.date}</span>
                    {ord.time && <span className="block text-[10px] text-gray-400">{ord.time}</span>}
                  </td>
                  <td className="py-4 pr-2 pl-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2 ml-auto">
                      <button 
                        onClick={() => setSelectedOrder(ord)} 
                        className="px-3.5 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 dark:hover:bg-white transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detalle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

