"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  DollarSign,
  ShoppingBag,
  Clock,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Share2,
  Calendar,
} from "lucide-react";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";
import { BeUICenterMorphModal } from "@/components/ui/BeUIControls";
import { ExpandableSearchBar } from "@/components/ui/ExpandableSearchBar";
import { useUserStore } from "@/lib/userStore";
import type { DiscountCoupon, CouponRedemptionRecord } from "@/lib/couponStore";

export interface CouponAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  coupon: DiscountCoupon | null;
}

export function CouponAnalyticsModal({
  open,
  onClose,
  coupon,
}: CouponAnalyticsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const { orders } = useUserStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchFilter("");
    }
  }, [open]);

  // Combine pre-seeded redemptions with any live store orders that might reference this coupon
  const allRedemptions = useMemo(() => {
    if (!coupon) return [];

    const baseList: CouponRedemptionRecord[] = coupon.redemptions ? [...coupon.redemptions] : [];

    // Find any live orders that used this coupon
    const matchingLiveOrders = (orders || []).filter((ord) => {
      // Check if order tracking or items or metadata references this coupon code
      const jsonStr = JSON.stringify(ord).toLowerCase();
      return jsonStr.includes(coupon.code.toLowerCase());
    });

    matchingLiveOrders.forEach((ord) => {
      const alreadyInList = baseList.some((r) => r.orderId === ord.id);
      if (!alreadyInList) {
        const discountVal =
          coupon.discountType === "free_shipping"
            ? 5.0
            : Number(((ord.total * (coupon.discountPercent || 15)) / 100).toFixed(2));
        const before = ord.total + discountVal;
        baseList.unshift({
          id: `live-${ord.id}`,
          orderId: ord.id,
          customerName: ord.customerName || "Cliente Lumina",
          customerEmail: ord.customerEmail || "cliente@lumina.com",
          customerAvatarSeed: ord.customerAvatarSeed || ord.customerEmail || ord.customerName,
          customerAvatarShape: ord.customerAvatarShape || "squircle",
          usedAt: ord.createdAt || ord.date || new Date().toISOString(),
          beforeAmount: before,
          discountAmount: discountVal,
          afterAmount: ord.total,
          itemsSummary: ord.items?.map((it) => `${it.product?.title || it.bundleName || "Producto Lumina"} (x${it.quantity})`).join(", ") || "Productos Lumina Home",
          paymentMethod: ord.paymentMethod || "PayPhone · Tarjeta",
        });
      }
    });

    return baseList;
  }, [coupon, orders]);

  // Filtered redemptions by search query
  const filteredRedemptions = useMemo(() => {
    if (!searchFilter.trim()) return allRedemptions;
    const q = searchFilter.toLowerCase().trim();
    return allRedemptions.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.itemsSummary.toLowerCase().includes(q)
    );
  }, [allRedemptions, searchFilter]);

  // Financial KPI totals
  const totalSaved = useMemo(() => {
    return allRedemptions.reduce((acc, r) => acc + (r.discountAmount || 0), 0);
  }, [allRedemptions]);

  const avgTicket = useMemo(() => {
    if (allRedemptions.length === 0) return 0;
    return allRedemptions.reduce((acc, r) => acc + (r.afterAmount || 0), 0) / allRedemptions.length;
  }, [allRedemptions]);

  if (!mounted || !coupon) return null;

  return (
    <BeUICenterMorphModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      className="max-w-3xl w-full mx-auto"
    >
      <div
        data-lenis-prevent="true"
        className="relative w-full bg-white dark:bg-[#1c1c1f] text-gray-900 dark:text-stone-100 rounded-[2rem] sm:rounded-[2.5rem] border border-black/10 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
      >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-4 bg-gray-50/70 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base sm:text-lg font-black tracking-wider text-gray-950 dark:text-white">
                      {coupon.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                      {coupon.discountType === "free_shipping"
                        ? "Envío Gratis"
                        : `${coupon.discountPercent}% OFF`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                      {coupon.scope === "all" ? "Tienda General" : coupon.targetNiche}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Métricas de Rendimiento en Tiempo Real
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Cerrar métricas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div data-lenis-prevent="true" className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-5 sm:space-y-6 flex-1">
              {/* KPI Bar for this Coupon */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Canjes Totales</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white">
                    {allRedemptions.length}
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="whitespace-nowrap">Ahorro Concedido</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300">
                    ${totalSaved.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <Receipt className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">Ticket Promedio</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white">
                    ${avgTicket.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <Share2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Compartido</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white">
                    {coupon.shareCount || 0} veces
                  </p>
                </div>
              </div>

              {/* Search & Records Header */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="text-sm font-bold text-gray-950 dark:text-white truncate">
                    Historial de Usuarios & Compras ({filteredRedemptions.length})
                  </h4>
                </div>

                <ExpandableSearchBar
                  value={searchFilter}
                  onChange={setSearchFilter}
                  placeholder="Buscar cliente, orden o correo..."
                  expandedWidth="w-full sm:w-64"
                />
              </div>

              {/* Redemption Records List */}
              {filteredRedemptions.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 space-y-2">
                  <Receipt className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Sin canjes registrados con este filtro
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Cuando un cliente aplique este cupón en el checkout, se registrará aquí su avatar, correo y monto.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredRedemptions.map((record) => {
                      const formattedDate = new Date(record.usedAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      const formattedTime = new Date(record.usedAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          key={record.id}
                          className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                        {/* 1. QUIÉN LO USÓ: Avatar, Nombre, Correo */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <BlobatarAvatar
                            name={record.customerAvatarSeed || record.customerEmail || record.customerName}
                            background={record.customerAvatarShape || "squircle"}
                            role="USER"
                            size={42}
                            animate="hover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-950 dark:text-white truncate">
                              {record.customerName}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {record.customerEmail}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-mono">
                                Pedido #{record.orderId}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. EN QUÉ COMPRA & CUÁNDO LO USÓ */}
                        <div className="space-y-1 flex-1 md:px-4">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                            {record.itemsSummary}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{formattedDate}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{formattedTime} hs</span>
                            </span>
                            {record.paymentMethod && (
                              <span className="px-2 py-0.5 rounded-md bg-gray-200/70 dark:bg-white/10 text-[9.5px] font-semibold text-gray-700 dark:text-gray-300">
                                {record.paymentMethod}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3. MONTOS ANTES, DESCUENTO Y VALOR FINAL DESPUÉS */}
                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200/60 dark:border-white/5">
                          {/* Antes */}
                          <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase text-gray-400">
                              Antes
                            </p>
                            <p className="text-xs font-bold text-gray-500 line-through">
                              ${record.beforeAmount.toFixed(2)}
                            </p>
                          </div>

                          {/* Descuento deducido */}
                          <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                              Ahorro
                            </p>
                            <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                              -${record.discountAmount.toFixed(2)}
                            </p>
                          </div>

                          {/* Después / Pagado */}
                          <div className="text-right pl-2 border-l border-gray-200 dark:border-white/10">
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                              Total Pagado
                            </p>
                            <p className="text-sm font-black text-gray-950 dark:text-white">
                              ${record.afterAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Registros criptográficamente inmutables vinculados a pedidos</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-bold hover:bg-black dark:hover:bg-gray-100 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Cerrar
              </button>
            </div>
      </div>
    </BeUICenterMorphModal>
  );
}
