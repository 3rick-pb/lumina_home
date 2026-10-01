"use client";

import React from "react";
import { configureBoneyard } from "boneyard-js/react";
import { cn } from "@/lib/utils";

// Configure Boneyard global defaults for Lumina Home luxury aesthetics
if (typeof window !== "undefined") {
  configureBoneyard({
    color: "rgba(0, 0, 0, 0.05)",
    darkColor: "rgba(255, 255, 255, 0.06)",
    animate: "shimmer",
    shimmerColor: "rgba(255, 255, 255, 0.5)",
    darkShimmerColor: "rgba(255, 255, 255, 0.09)",
    speed: "1.8s",
    transition: 200,
  });
}

// Reusable animated bone element matching Boneyard theme
export function Bone({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-black/[0.05] dark:bg-white/[0.06] overflow-hidden relative isolate",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 dark:after:via-white/10 after:to-transparent",
        className
      )}
      style={style}
    />
  );
}

/**
 * 1. SKELETON: TAB CATÁLOGO & INVENTARIO
 */
export function CatalogTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/70 dark:bg-[#1a1a1c]/70 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Bone className="w-10 h-10 rounded-2xl shrink-0" />
          <Bone className="h-10 w-64 sm:w-80 rounded-2xl" />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Bone className="h-10 w-28 rounded-2xl" />
          <Bone className="h-10 w-36 rounded-2xl" />
        </div>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-2 overflow-hidden py-1">
        <Bone className="h-8 w-20 rounded-full shrink-0" />
        <Bone className="h-8 w-28 rounded-full shrink-0" />
        <Bone className="h-8 w-24 rounded-full shrink-0" />
        <Bone className="h-8 w-32 rounded-full shrink-0" />
        <Bone className="h-8 w-24 rounded-full shrink-0" />
        <Bone className="h-8 w-28 rounded-full shrink-0" />
      </div>

      {/* Catalog Table Cards */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
        {/* Table Header */}
        <div className="p-4 grid grid-cols-12 gap-4 items-center bg-gray-50/50 dark:bg-white/[0.02]">
          <Bone className="col-span-6 h-5 rounded-lg w-1/3" />
          <Bone className="col-span-2 h-5 rounded-lg w-1/2" />
          <Bone className="col-span-2 h-5 rounded-lg w-1/2" />
          <Bone className="col-span-2 h-5 rounded-lg w-1/3 ml-auto" />
        </div>

        {/* 5 Product Row Skeletons */}
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="p-4 grid grid-cols-12 gap-4 items-center">
            {/* Product Photo & Title */}
            <div className="col-span-6 flex items-center gap-3.5">
              <Bone className="w-14 h-14 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Bone className="h-4 rounded-md w-3/4" />
                <Bone className="h-3 rounded-md w-1/2" />
              </div>
            </div>
            {/* Category / Niche */}
            <div className="col-span-2">
              <Bone className="h-6 rounded-full w-24" />
            </div>
            {/* Stock / Status */}
            <div className="col-span-2">
              <Bone className="h-6 rounded-full w-20" />
            </div>
            {/* Actions */}
            <div className="col-span-2 flex items-center justify-end gap-2">
              <Bone className="w-8 h-8 rounded-xl shrink-0" />
              <Bone className="w-8 h-8 rounded-xl shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. SKELETON: TAB NICHOS
 */
export function NichesTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Bone className="w-10 h-10 rounded-2xl" />
              <Bone className="w-12 h-5 rounded-full" />
            </div>
            <Bone className="h-7 w-20 rounded-lg" />
            <Bone className="h-3.5 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Niches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 flex flex-col justify-between h-48 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Bone className="w-12 h-12 rounded-2xl shrink-0" />
                <div className="space-y-1.5">
                  <Bone className="h-4 w-28 rounded-md" />
                  <Bone className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Bone className="w-8 h-8 rounded-xl shrink-0" />
            </div>
            <div className="space-y-2">
              <Bone className="h-3 w-full rounded-md" />
              <Bone className="h-3 w-4/5 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/[0.06]">
              <Bone className="h-5 w-20 rounded-full" />
              <Bone className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. SKELETON: TAB ANALYTICS & RADAR
 */
export function AnalyticsTabSkeleton() {
  return (
    <div className="w-full h-[680px] sm:h-[720px] rounded-[2.5rem] bg-[#141614] border border-white/10 relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-300">
      {/* Top Radar Bar */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 rounded-2xl bg-white/10" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-40 rounded-md bg-white/10" />
            <Bone className="h-3 w-28 rounded-md bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-9 w-28 rounded-full bg-white/10" />
          <Bone className="h-9 w-9 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Center Simulated Radar Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[480px] h-[480px] rounded-full border border-white/[0.04] flex items-center justify-center">
          <div className="w-[340px] h-[340px] rounded-full border border-white/[0.05] flex items-center justify-center">
            <div className="w-[200px] h-[200px] rounded-full border border-white/[0.07] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#8c9276]/10 border border-[#8c9276]/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Telemetry Cards Dock */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 backdrop-blur-xl p-3 rounded-3xl border border-white/10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 rounded-2xl bg-white/5 space-y-2">
            <Bone className="h-3 w-16 rounded bg-white/10" />
            <Bone className="h-6 w-20 rounded-md bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. SKELETON: TAB ALERTAS DEL CARRITO
 */
export function CartAlertsTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Bone className="h-6 w-48 rounded-lg" />
            <Bone className="h-3.5 w-72 rounded-md" />
          </div>
          <Bone className="w-14 h-8 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <Bone className="h-5 w-36 rounded-md" />
              <Bone className="w-12 h-6 rounded-full" />
            </div>
            <Bone className="h-3.5 w-full rounded-md" />
            <Bone className="h-10 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 5. SKELETON: TAB INTEGRACIONES & SMTP
 */
export function IntegrationsTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {[1, 2].map((idx) => (
        <div
          key={idx}
          className="p-6 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bone className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-1.5">
                <Bone className="h-5 w-44 rounded-md" />
                <Bone className="h-3.5 w-60 rounded-md" />
              </div>
            </div>
            <Bone className="h-7 w-24 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
            <div className="space-y-2">
              <Bone className="h-3.5 w-24 rounded-md" />
              <Bone className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Bone className="h-3.5 w-24 rounded-md" />
              <Bone className="h-11 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 6. SKELETON: TAB CUPONES DE DESCUENTO
 */
export function DiscountCouponsTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Generator Header Banner */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <Bone className="h-6 w-56 rounded-lg" />
          <Bone className="h-3.5 w-80 rounded-md" />
        </div>
        <Bone className="h-11 w-full sm:w-48 rounded-2xl shrink-0" />
      </div>

      {/* Active Coupon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <Bone className="h-6 w-32 rounded-lg" />
              <Bone className="h-6 w-16 rounded-full" />
            </div>
            <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-white/[0.03] flex items-center justify-between">
              <Bone className="h-4 w-40 rounded-md" />
              <Bone className="h-8 w-20 rounded-xl" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <Bone className="h-3.5 w-24 rounded-md" />
              <Bone className="h-3.5 w-28 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 7. SKELETON: TAB CONFIGURACIÓN & DIRECCIONES
 */
export function SettingsTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Profile Info Form */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-5">
        <div className="space-y-1.5">
          <Bone className="h-6 w-48 rounded-lg" />
          <Bone className="h-3.5 w-64 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-3.5 w-24 rounded-md" />
              <Bone className="h-11 w-full rounded-2xl" />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Bone className="h-11 w-36 rounded-2xl" />
        </div>
      </div>

      {/* Shipping Address Cards */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Bone className="h-6 w-44 rounded-lg" />
            <Bone className="h-3.5 w-60 rounded-md" />
          </div>
          <Bone className="h-10 w-36 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 space-y-2.5">
              <Bone className="h-5 w-24 rounded-full" />
              <Bone className="h-4 w-full rounded-md" />
              <Bone className="h-3.5 w-3/4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 8. SKELETON: TAB PEDIDOS
 */
export function OrdersTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/70 dark:bg-[#1a1a1c]/70 border border-gray-200/80 dark:border-white/10">
        <Bone className="h-10 w-full sm:w-80 rounded-2xl" />
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Bone className="h-8 w-16 rounded-full" />
          <Bone className="h-8 w-24 rounded-full" />
          <Bone className="h-8 w-20 rounded-full" />
          <Bone className="h-8 w-20 rounded-full" />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <Bone className="w-10 h-10 rounded-2xl shrink-0" />
                <div className="space-y-1">
                  <Bone className="h-4 w-32 rounded-md" />
                  <Bone className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bone className="h-6 w-24 rounded-full" />
                <Bone className="h-7 w-20 rounded-lg" />
              </div>
            </div>

            {/* Products Thumbnails */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
              <Bone className="w-12 h-12 rounded-xl shrink-0" />
              <Bone className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1">
                <Bone className="h-3.5 w-48 rounded-md" />
                <Bone className="h-3 w-32 rounded-md" />
              </div>
              <Bone className="h-9 w-28 rounded-xl shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 9. SKELETON: TAB TARJETAS Y WALLET
 */
export function CardsTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Card Mockup Skeleton */}
        <div className="h-56 rounded-3xl bg-gradient-to-br from-[#2a2c27] to-[#141512] border border-white/10 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Bone className="h-6 w-24 rounded-md bg-white/10" />
            <Bone className="w-8 h-8 rounded-full bg-white/10" />
          </div>
          <Bone className="w-12 h-9 rounded-lg bg-white/15" />
          <div className="space-y-2">
            <Bone className="h-5 w-48 rounded-md bg-white/10" />
            <div className="flex items-center justify-between">
              <Bone className="h-3.5 w-32 rounded bg-white/10" />
              <Bone className="h-3.5 w-16 rounded bg-white/10" />
            </div>
          </div>
        </div>

        {/* Action / Add Card Box */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <Bone className="h-6 w-40 rounded-lg" />
            <Bone className="h-3.5 w-full rounded-md" />
            <Bone className="h-3.5 w-4/5 rounded-md" />
          </div>
          <Bone className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * 10. SKELETON: TAB FAVORITOS
 */
export function FavoritesTabSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <div
            key={idx}
            className="p-3 rounded-3xl bg-white/80 dark:bg-[#1a1a1c]/80 border border-gray-200/80 dark:border-white/10 space-y-3"
          >
            <Bone className="w-full aspect-square rounded-2xl" />
            <div className="space-y-1.5 px-1">
              <Bone className="h-3 w-16 rounded-full" />
              <Bone className="h-4 w-full rounded-md" />
              <div className="flex items-center justify-between pt-1">
                <Bone className="h-5 w-16 rounded-md" />
                <Bone className="w-8 h-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
