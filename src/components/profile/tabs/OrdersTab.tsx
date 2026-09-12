"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ShoppingBag, Eye } from "lucide-react";
import { useUserStore, Order } from "@/lib/userStore";
import { normalizeSearchText } from "@/lib/utils";
import { CloudSyncStatus } from "../CloudSyncStatus";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";

interface OrdersTabProps {
  isAdmin: boolean;
  searchQuery?: string;
  setSelectedOrder: (order: Order) => void;
}

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <CloudSyncStatus
              isSyncing={isSyncing}
              syncError={syncError}
              onSave={handleSyncOrders}
              saveLabel="Guardar en nube"
              savedLabel="Guardado en nube"
            />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#8c9276]" /> Historial Completo de Pedidos
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Trazabilidad en tiempo real, recibos y estados de envío.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 dark:bg-[#3a3a3c] p-1 rounded-2xl overflow-x-auto max-w-full hide-scrollbar">
          {["all", "Procesando", "Enviado", "Entregado"].map((st) => (
            <button 
              key={st}
              onClick={() => setOrderStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                orderStatusFilter === st ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {st === "all" ? "Todos" : st}
            </button>
          ))}
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
                <th className="pb-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
                    {ord.items.length > 0 ? `${ord.items.length} producto(s)` : "1 artículo Lumina"}
                  </td>
                  <td className="py-4 px-3 font-bold text-gray-900 dark:text-gray-100">${ord.total.toFixed(2)}</td>
                  <td className="py-4 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                      ord.status === "Entregado" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : ord.status === "Enviado" 
                        ? "bg-blue-50 text-blue-700 border border-blue-100" 
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        ord.status === "Entregado" ? "bg-emerald-500" : ord.status === "Enviado" ? "bg-blue-500" : "bg-amber-500"
                      }`} />
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-gray-500 dark:text-gray-400">
                    <span className="block font-medium text-gray-800 dark:text-gray-200">{ord.date}</span>
                    {ord.time && <span className="block text-[10px] text-gray-400">{ord.time}</span>}
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <select 
                          value={ord.status} 
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as "Procesando" | "Enviado" | "Entregado")}
                          className="text-[11px] font-semibold bg-gray-100 dark:bg-[#3a3a3c] rounded-lg px-2.5 py-1.5 outline-none border border-gray-200 dark:border-white/10 cursor-pointer"
                        >
                          <option value="Procesando">Procesando</option>
                          <option value="Enviado">Enviado</option>
                          <option value="Entregado">Entregado</option>
                        </select>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(ord)} 
                        className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"
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
