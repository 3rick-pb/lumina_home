"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useBrand } from "@/core/hooks/useBrand";

export default function PayPhoneCancelPage() {
  const brand = useBrand();
  const router = useRouter();
  const { toggleCart } = useCartStore();

  const handleReturnToCart = () => {
    router.push("/shop");
    setTimeout(() => {
      toggleCart();
    }, 400);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-[#121214] text-gray-900 dark:text-gray-100 flex flex-col justify-between relative overflow-hidden py-8 sm:py-16 px-4 sm:px-6">
      {/* High-Ticket Atmospheric Ambient Glows */}
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[400px] rounded-full bg-gradient-to-b from-amber-500/10 via-[#c5a880]/10 to-transparent blur-3xl -z-10" 
      />

      {/* Top Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-8">
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
      </header>

      {/* Main Double-Bezel Card */}
      <main className="max-w-xl mx-auto w-full my-auto">
        <div className="p-2 sm:p-3 rounded-[2.5rem] bg-black/[0.03] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="rounded-[calc(2.5rem-0.625rem)] bg-white/95 dark:bg-[#18181b]/95 border border-black/[0.06] dark:border-white/10 p-8 sm:p-14 text-center space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
            
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em] border border-amber-200/60 dark:border-amber-500/20">
                Operación Cancelada
              </span>
              <h1 className="font-display italic font-semibold text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight">
                Pago no concretado
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                La transacción con la pasarela fue interrumpida y no se ha aplicado ningún débito. Tus piezas seleccionadas permanecen reservadas en tu bolsa de compras.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleReturnToCart}
                className="group w-full h-14 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-bold text-sm flex items-center justify-between px-5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:opacity-95 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white dark:text-gray-950" />
                </div>
                <span>Reanudar Pago en Bolsa</span>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-950 text-gray-950 dark:text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              <Link
                href="/shop"
                className="w-full h-14 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-black/[0.06] dark:border-white/10 text-sm font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                Seguir Explorando Colecciones
              </Link>
            </div>

          </div>
        </div>
      </main>

      <footer className="max-w-xl mx-auto w-full text-center pt-8">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono tracking-wider">
          {brand.name} · Atelier de Diseño & Interiorismo
        </p>
      </footer>
    </div>
  );
}
