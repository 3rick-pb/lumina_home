"use client";

import React, { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Package, 
  Layers, 
  Heart, 
  Sparkles, 
  CreditCard, 
  Plus, 
  X, 
  Eye, 
  Trash2, 
  AlertTriangle 
} from "lucide-react";
import { useCatalogStore, normalizeCategory } from "@/lib/catalogStore";
import { useUserStore, Order } from "@/lib/userStore";

interface OverviewTabProps {
  isAdmin: boolean;
  setActiveTab: (tab: "overview" | "orders" | "cards" | "favorites" | "catalog" | "niches" | "analytics" | "settings") => void;
  setSelectedOrder: (order: Order) => void;
  setShowCardModal: (show: boolean) => void;
  onRequestDeleteNiche: (catName: string) => void;
}

export function OverviewTab({
  isAdmin,
  setActiveTab,
  setSelectedOrder,
  setShowCardModal,
  onRequestDeleteNiche
}: OverviewTabProps) {
  const { orders, cards, favorites, removeCard, updateOrderStatus } = useUserStore();
  const { products, categories } = useCatalogStore();

  // Metrics
  const totalUserSpend = useMemo(() => {
    return orders.reduce((acc, curr) => acc + curr.total, 0);
  }, [orders]);

  const loyaltyPoints = useMemo(() => {
    return Math.floor(totalUserSpend);
  }, [totalUserSpend]);

  const loyaltyTier = useMemo(() => {
    if (loyaltyPoints >= 500) return { name: "Nivel Oro", color: "text-amber-600" };
    if (loyaltyPoints >= 100) return { name: "Nivel Plata", color: "text-slate-600" };
    return { name: "Nivel Bronce", color: "text-amber-800" };
  }, [loyaltyPoints]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.price || 0), 0);
  }, [products]);

  const averagePrice = useMemo(() => {
    return products.length > 0 ? totalInventoryValue / products.length : 0;
  }, [totalInventoryValue, products]);

  const discountedCount = useMemo(() => {
    return products.filter(p => Boolean(p.discount || (p.oldPrice && p.oldPrice > p.price))).length;
  }, [products]);

  const discountPercentageOfCatalog = useMemo(() => {
    return products.length > 0 ? Math.round((discountedCount / products.length) * 100) : 0;
  }, [discountedCount, products]);

  const emptyCategories = useMemo(() => {
    return categories.filter(cat => 
      !products.some(p => normalizeCategory(p.category) === normalizeCategory(cat))
    );
  }, [categories, products]);

  // Chart data
  const categoryDistributionData = useMemo(() => {
    const totalProds = products.length;
    const counts = categories.map(cat => {
      const count = products.filter(p => normalizeCategory(p.category) === normalizeCategory(cat)).length;
      const pctOfTotal = totalProds > 0 ? Math.round((count / totalProds) * 100) : 0;
      return { category: cat, count, pctOfTotal };
    });
    const maxCount = Math.max(...counts.map(c => c.count), 1);
    return counts.map(c => ({
      ...c,
      heightPct: c.count === 0 ? 8 : Math.max(Math.round((c.count / maxCount) * 82), 14)
    }));
  }, [categories, products]);

  const monthlySpendData = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
    const hasAnyOrders = orders.length > 0;
    
    const totals = monthNames.map(m => {
      const monthOrders = orders.filter(o => o.date?.toLowerCase().includes(m.toLowerCase()));
      const sum = monthOrders.reduce((acc, o) => acc + o.total, 0);
      return { month: m, total: sum };
    });

    const maxMonth = Math.max(...totals.map(t => t.total), 1);

    return totals.map(t => ({
      month: t.month,
      total: t.total,
      heightPct: hasAnyOrders && t.total > 0 ? Math.max(Math.round((t.total / maxMonth) * 82), 12) : 6,
      hasData: t.total > 0
    }));
  }, [orders]);

  // Interactive Chart Hover States
  const [hoveredNicheIdx, setHoveredNicheIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const nicheHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const monthHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNicheMouseEnter = (idx: number) => {
    if (nicheHoverTimeoutRef.current) {
      clearTimeout(nicheHoverTimeoutRef.current);
      nicheHoverTimeoutRef.current = null;
    }
    setHoveredNicheIdx(idx);
  };

  const handleNicheMouseLeave = () => {
    if (nicheHoverTimeoutRef.current) clearTimeout(nicheHoverTimeoutRef.current);
    nicheHoverTimeoutRef.current = setTimeout(() => {
      setHoveredNicheIdx(null);
    }, 150);
  };

  const handleNicheContainerLeave = () => {
    if (nicheHoverTimeoutRef.current) clearTimeout(nicheHoverTimeoutRef.current);
    setHoveredNicheIdx(null);
  };

  const handleMonthMouseEnter = (idx: number) => {
    if (monthHoverTimeoutRef.current) {
      clearTimeout(monthHoverTimeoutRef.current);
      monthHoverTimeoutRef.current = null;
    }
    setHoveredMonthIdx(idx);
  };

  const handleMonthMouseLeave = () => {
    if (monthHoverTimeoutRef.current) clearTimeout(monthHoverTimeoutRef.current);
    monthHoverTimeoutRef.current = setTimeout(() => {
      setHoveredMonthIdx(null);
    }, 150);
  };

  const handleMonthContainerLeave = () => {
    if (monthHoverTimeoutRef.current) clearTimeout(monthHoverTimeoutRef.current);
    setHoveredMonthIdx(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* BENTO CARD 1: Financial Balance / Spendings (4 cols) */}
      <div className="lg:col-span-4 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {isAdmin ? "Valor Total del Catálogo" : "Gasto Acumulado en Compras"}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
              (isAdmin ? totalInventoryValue > 0 : totalUserSpend > 0) 
                ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#3a3a3c] border-gray-200 dark:border-white/10"
            }`}>
              {isAdmin ? `${products.length} piezas` : `${orders.length} pedidos`}
            </span>
          </div>
          <p className="text-4xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-2">
            ${(isAdmin ? totalInventoryValue : totalUserSpend).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">
            {isAdmin 
              ? `Precio promedio por pieza: $${averagePrice.toFixed(2)}` 
              : (orders.length === 0 ? "Sin compras registradas aún en esta cuenta" : "Suma real de todos los pedidos efectuados")}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex gap-3">
          <Link 
            href="/shop" 
            className="flex-1 py-3 px-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl text-xs font-semibold text-center hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
          >
            {isAdmin ? "Ver Catálogo" : "Explorar Tienda"}
          </Link>
          <button 
            onClick={() => setActiveTab("orders")}
            className="py-3 px-4 bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
          >
            Historial
          </button>
        </div>
      </div>

      {/* BENTO CARD 2: Quick Metrics 2x2 Grid (4 cols) */}
      <div className="lg:col-span-4 grid grid-cols-2 gap-3 sm:gap-4">
        {/* Box 1 (Orange/Coral Accent) */}
        <button 
          onClick={() => setActiveTab(isAdmin ? "catalog" : "orders")} 
          className="bg-gradient-to-br from-[#e07a3f] to-[#c75e24] p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] text-white dark:text-gray-900 shadow-md dark:shadow-none shadow-[#e07a3f]/15 flex flex-col justify-between text-left hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80 dark:text-gray-900/80">
              {isAdmin ? "Inventario" : "Mis Pedidos"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-[#202022]/20 backdrop-blur-md flex items-center justify-center">
              <Package className="w-4 h-4 text-white dark:text-gray-900" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-display font-bold">{isAdmin ? products.length : orders.length}</p>
            <p className="text-[10px] text-white/70 dark:text-gray-900/70 mt-1">
              {isAdmin ? `${discountPercentageOfCatalog}% con descuento` : (orders.length === 0 ? "Sin pedidos activos" : "Pedidos confirmados")}
            </p>
          </div>
        </button>

        {/* Box 2 (Nichos or Favoritos) */}
        <button 
          onClick={() => setActiveTab(isAdmin ? "niches" : "favorites")} 
          className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between text-left hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isAdmin ? "Nichos" : "Favoritos"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#3a3a3c] flex items-center justify-center text-gray-700 dark:text-gray-300">
              {isAdmin ? <Layers className="w-4 h-4" /> : <Heart className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
              {isAdmin ? categories.length : favorites.length}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {isAdmin 
                ? `${emptyCategories.length} sin existencias` 
                : (favorites.length === 0 ? "Ninguno guardado" : "En tu lista de deseos")}
            </p>
          </div>
        </button>

        {/* Box 3 */}
        <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isAdmin ? "Rebajas" : "Lumina Puntos"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#3a3a3c] flex items-center justify-center text-gray-700 dark:text-gray-300">
              <Sparkles className="w-4 h-4 text-[#8c9276]" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
              {isAdmin ? `${discountedCount}` : `${loyaltyPoints} pts`}
            </p>
            <p className={`text-[10px] font-semibold mt-1 ${isAdmin ? "text-amber-700" : loyaltyTier.color}`}>
              {isAdmin ? `${discountPercentageOfCatalog}% del catálogo` : loyaltyTier.name}
            </p>
          </div>
        </div>

        {/* Box 4 */}
        <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isAdmin ? "Ventas Brutas" : "Tarjetas"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#3a3a3c] flex items-center justify-center text-gray-700 dark:text-gray-300">
              <CreditCard className="w-4 h-4 text-[#8c9276]" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
              {isAdmin ? `$${totalUserSpend.toFixed(0)}` : cards.length}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {isAdmin ? `${orders.length} ventas procesadas` : (cards.length === 0 ? "Sin métodos de pago" : `${cards.length} activa(s)`)}
            </p>
          </div>
        </div>
      </div>

      {/* BENTO CARD 3: REAL DYNAMIC CHART (4 cols) */}
      <div className="lg:col-span-4 min-w-0 max-w-full bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {isAdmin ? "Inventario por Nicho" : "Frecuencia de Compras"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate transition-all duration-200">
              {isAdmin 
                ? (hoveredNicheIdx !== null && categoryDistributionData[hoveredNicheIdx] 
                  ? `${categoryDistributionData[hoveredNicheIdx].category}: ${categoryDistributionData[hoveredNicheIdx].count} piezas (${categoryDistributionData[hoveredNicheIdx].pctOfTotal}% del catálogo)`
                  : "Volumen real de piezas por categoría") 
                : (hoveredMonthIdx !== null && monthlySpendData[hoveredMonthIdx]
                  ? `${monthlySpendData[hoveredMonthIdx].month}: $${monthlySpendData[hoveredMonthIdx].total.toFixed(2)} gastados`
                  : "Gastos calculados por mes (2026)")}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-[#3a3a3c] rounded-lg text-gray-600 dark:text-gray-400 shrink-0 transition-all duration-200">
            {isAdmin 
              ? (hoveredNicheIdx !== null && categoryDistributionData[hoveredNicheIdx]
                ? `${categoryDistributionData[hoveredNicheIdx].count} piezas`
                : `${products.length} Total`)
              : (hoveredMonthIdx !== null && monthlySpendData[hoveredMonthIdx]
                ? `$${monthlySpendData[hoveredMonthIdx].total.toFixed(0)}`
                : "Semestre")}
          </span>
        </div>

        {/* Visual Dynamic Bar Chart */}
        <div className="relative w-full my-auto">
          <div 
            onMouseLeave={isAdmin ? handleNicheContainerLeave : handleMonthContainerLeave}
            className={`flex items-end h-40 pt-7 pb-1 px-1 overflow-x-auto overflow-y-hidden select-none cursor-grab active:cursor-grabbing ${
              categoryDistributionData.length <= 4 
                ? "justify-around gap-3" 
                : categoryDistributionData.length <= 7 
                ? "justify-start sm:justify-between gap-2.5" 
                : "justify-start gap-2"
            }`}
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(156, 163, 175, 0.4) transparent"
            }}
            onWheel={(e) => {
              if (e.deltaY !== 0 && categoryDistributionData.length > 4) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            {isAdmin ? (
              categoryDistributionData.map((bar, idx) => {
                const isHovered = hoveredNicheIdx === idx;
                const hasItems = bar.count > 0;
                
                const widthClass = categoryDistributionData.length <= 4
                  ? "flex-1 min-w-[3.5rem] max-w-[5.5rem]"
                  : categoryDistributionData.length <= 7
                  ? "w-14 shrink-0"
                  : "w-12 shrink-0";

                return (
                  <div 
                    key={idx} 
                    onMouseEnter={() => handleNicheMouseEnter(idx)}
                    onMouseLeave={handleNicheMouseLeave}
                    className={`flex flex-col items-center h-full justify-between group cursor-pointer relative ${widthClass} z-10`}
                  >
                    {/* 1. Bar Area */}
                    <div className="relative w-full flex-1 flex flex-col justify-end items-center px-1">
                      {isHovered && (
                        <div className="absolute -top-7 z-30 flex flex-col items-center pointer-events-none animate-fade-in">
                          <div className="bg-gray-950 dark:bg-white text-white dark:text-gray-950 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-lg border border-white/10 dark:border-gray-800 whitespace-nowrap flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${hasItems ? "bg-[#e07a3f]" : "bg-gray-400"}`} />
                            <span>{bar.count}</span>
                            <span className="text-gray-400 dark:text-gray-600 font-normal">({bar.pctOfTotal}%)</span>
                          </div>
                          <div className="w-1.5 h-1 bg-gray-950 dark:bg-white rotate-45 -mt-0.5" />
                        </div>
                      )}

                      {!isHovered && (
                        <span className="text-[10px] font-bold text-gray-400 mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {bar.count}
                        </span>
                      )}

                      <div 
                        className={`w-full rounded-2xl transition-all duration-200 ${
                          hasItems 
                            ? isHovered 
                            ? "bg-gradient-to-t from-[#c25e24] via-[#e07a3f] to-[#f59e0b] shadow-md shadow-[#e07a3f]/30 ring-2 ring-[#e07a3f]/40" 
                            : "bg-[#e07a3f] shadow-2xs hover:brightness-105" 
                            : "bg-gray-200/90 dark:bg-[#48484a]/90"
                        }`} 
                        style={{ height: `${bar.heightPct}%` }}
                      />
                    </div>

                    {/* 2. Anchored Category Label Area */}
                    <div className="w-full h-6 pt-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                      <span 
                        className={`text-[10px] text-center transition-colors block truncate w-full ${
                          isHovered ? "text-gray-950 dark:text-white font-bold" : "text-gray-400 font-medium"
                        }`} 
                        title={bar.category}
                      >
                        {bar.category}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              monthlySpendData.map((bar, idx) => {
                const isHovered = hoveredMonthIdx === idx;
                return (
                  <div 
                    key={idx} 
                    onMouseEnter={() => handleMonthMouseEnter(idx)}
                    onMouseLeave={handleMonthMouseLeave}
                    className="flex-1 min-w-[2.5rem] flex flex-col items-center h-full justify-between transition-all duration-300 group cursor-pointer relative"
                    title={`${bar.month}: $${bar.total.toFixed(2)}`}
                  >
                    <div className="relative w-full flex-1 flex flex-col justify-end items-center px-1">
                      {isHovered && bar.hasData && (
                        <div className="absolute -top-7 z-30 flex flex-col items-center pointer-events-none animate-fade-in">
                          <div className="bg-gray-950 text-white dark:text-gray-900 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-lg dark:shadow-none border border-white/10 whitespace-nowrap">
                            ${bar.total.toFixed(0)}
                          </div>
                          <div className="w-1.5 h-1 bg-gray-950 rotate-45 -mt-0.5" />
                        </div>
                      )}

                      <div 
                        className={`w-full rounded-2xl transition-all duration-300 ${
                          bar.hasData 
                            ? isHovered 
                            ? "bg-gradient-to-t from-[#c25e24] via-[#e07a3f] to-[#f59e0b] shadow-md dark:shadow-none shadow-[#e07a3f]/30" 
                            : "bg-[#e07a3f]" 
                            : "bg-gray-200 dark:bg-[#48484a]"
                        }`} 
                        style={{ height: `${bar.heightPct}%` }}
                      />
                    </div>

                    <div className="w-full h-6 pt-1.5 flex items-center justify-center shrink-0">
                      <span className={`text-[10px] text-center ${isHovered ? "text-gray-950 font-bold" : "text-gray-400 font-medium"}`}>
                        {bar.month}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#e07a3f]" /> 
            {isAdmin ? "Con existencias" : "Compras registradas"}
          </span>
          <span className="text-gray-400 text-right truncate pl-2">
            {isAdmin 
              ? `${categories.length} nichos ${categoryDistributionData.length > 5 ? "• Pasa el cursor o desliza ↔" : "• Pasa el cursor para ver detalle"}` 
              : (orders.length === 0 ? "0 transacciones aún" : `${orders.length} pedidos`)}
          </span>
        </div>
      </div>

      {/* BENTO CARD 4: MY CARDS (Tarjetas Guardadas - 4 cols) */}
      <div className="lg:col-span-4 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#8c9276]" /> Mis Tarjetas ({cards.length})
          </h3>
          <button 
            onClick={() => setShowCardModal(true)}
            className="text-xs font-semibold text-[#8c9276] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        {/* Cards Stack or Empty State */}
        {cards.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200/80 dark:border-white/10/80 rounded-3xl p-6 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 dark:bg-[#2a2a2c]/40 my-auto">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Sin tarjetas guardadas</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed max-w-[200px] mx-auto">
                Añade una tarjeta para pagar tus piezas con un solo clic.
              </p>
            </div>
            <button 
              onClick={() => setShowCardModal(true)}
              className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
            >
              + Vincular Tarjeta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((c, index) => {
              const isDark = index % 2 === 0;
              return (
                <div 
                  key={c.id} 
                  className={`p-5 rounded-2xl relative overflow-hidden transition-all hover:scale-[1.01] ${
                    isDark 
                      ? "bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white dark:text-gray-900 shadow-md dark:shadow-none shadow-black/10" 
                      : "bg-gradient-to-tr from-[#d97736] to-[#b8541c] text-white dark:text-gray-900 shadow-md dark:shadow-none shadow-[#d97736]/15"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-white/20 dark:bg-[#202022]/20 backdrop-blur-md">
                      {c.isDefault ? "Predeterminada" : "Activa"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-wider">{c.type.toUpperCase()}</span>
                      <button 
                        onClick={() => removeCard(c.id)} 
                        className="text-white/60 dark:text-gray-900/60 hover:text-white dark:hover:text-gray-900 transition-colors p-1"
                        title="Eliminar tarjeta"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="font-mono text-sm tracking-widest font-semibold mb-3">
                    {c.number}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-white/80 dark:text-gray-900/80">
                    <span>{c.holder}</span>
                    <span>EXP {c.exp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            Cifrado bancario AES-256
          </p>
          <button 
            onClick={() => setActiveTab("cards")} 
            className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline"
          >
            Gestionar billetera &rarr;
          </button>
        </div>
      </div>

      {/* BENTO CARD 5: RECENT ACTIVITIES / ORDERS (8 cols) */}
      <div className="lg:col-span-8 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {isAdmin ? "Pedidos Recientes de la Tienda" : "Actividades & Pedidos Recientes"}
            </h3>
            <p className="text-xs text-gray-400">
              {isAdmin ? "Supervisión de compras de clientes" : "Trazabilidad de tus envíos"}
            </p>
          </div>
          {orders.length > 0 && (
            <button 
              onClick={() => setActiveTab("orders")} 
              className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline"
            >
              Ver todos ({orders.length}) &rarr;
            </button>
          )}
        </div>

        {/* Orders Table or Empty State */}
        {orders.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/40 dark:bg-[#2a2a2c]/40 rounded-2xl border border-gray-100 dark:border-white/5 my-auto">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/5">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">No hay pedidos registrados</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-sm">
                {isAdmin 
                  ? "Aún no se han recibido compras de clientes en la tienda." 
                  : "Todavía no has realizado compras. Al hacer tu primer pedido, aquí podrás seguir su entrega paso a paso."}
              </p>
            </div>
            <Link 
              href="/shop" 
              className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-2">ID Pedido</th>
                  {isAdmin && <th className="pb-3 px-2">Cliente</th>}
                  <th className="pb-3 px-2">Concepto</th>
                  <th className="pb-3 px-2">Monto</th>
                  <th className="pb-3 px-2">Estado</th>
                  <th className="pb-3 px-2">Fecha / Hora</th>
                  <th className="pb-3 px-2 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 4).map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50 dark:hover:bg-[#2c2c2e]/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(ord)}>
                    <td className="py-3.5 px-2 font-mono font-semibold text-gray-900 dark:text-gray-100">{ord.id}</td>
                    {isAdmin && (
                      <td className="py-3.5 px-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[130px]">{ord.customerName || "Cliente Lumina"}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[130px]">{ord.customerEmail || "cliente@lumina.com"}</p>
                      </td>
                    )}
                    <td className="py-3.5 px-2 font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#3a3a3c] flex items-center justify-center text-gray-600 dark:text-gray-400">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <span>{ord.items.length > 0 ? `${ord.items.length} pieza(s) Lumina` : "Compra Lumina"}</span>
                    </td>
                    <td className="py-3.5 px-2 font-bold text-gray-900 dark:text-gray-100">${ord.total.toFixed(2)}</td>
                    <td className="py-3.5 px-2" onClick={(e) => e.stopPropagation()}>
                      {isAdmin ? (
                        <div className="relative inline-block">
                          <select 
                            value={ord.status}
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value as Order['status'])}
                            className={`appearance-none text-[11px] font-bold px-2.5 py-1 pr-6 rounded-full cursor-pointer outline-none border transition-all ${
                              ord.status === "Entregado" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                : ord.status === "Enviado" 
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" 
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            <option value="Procesando">Procesando</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Entregado">Entregado</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg className="h-3 w-3 text-current opacity-70" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
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
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-gray-500 dark:text-gray-400">
                      <span className="block font-medium text-gray-800 dark:text-gray-200">{ord.date}</span>
                      {ord.time && <span className="block text-[10px] text-gray-400">{ord.time}</span>}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(ord); }} 
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-400">
          <span>{orders.length === 0 ? "Registro limpio" : "Haz clic en un pedido para ver la trazabilidad"}</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{orders.length} pedidos totales</span>
        </div>
      </div>

      {/* ADMIN ONLY: Empty Categories Warning */}
      {isAdmin && emptyCategories.length > 0 && (
        <div className="lg:col-span-12 bg-amber-50/90 backdrop-blur-md p-5 rounded-3xl border border-amber-200/80 shadow-sm dark:shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-[#202022] flex items-center justify-center text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Aviso Inteligente de Inventario</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Los nichos <span className="font-semibold">{emptyCategories.join(", ")}</span> tienen 0 productos activos. 
                Te recomendamos publicar productos en ellos o retirarlos para que la tienda luzca llena.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {emptyCategories.map((c) => (
              <button 
                key={c} 
                onClick={() => onRequestDeleteNiche(c)}
                className="text-xs px-3 py-1.5 rounded-xl bg-amber-200/80 dark:bg-amber-900/40 hover:bg-amber-300 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Quitar {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
