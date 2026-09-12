"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/lib/store";

export default function PayPhoneCancelPage() {
  const router = useRouter();
  const { toggleCart } = useCartStore();

  const handleReturnToCart = () => {
    router.push("/shop");
    setTimeout(() => {
      toggleCart();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#18181a] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-[#202022] rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 dark:border-white/10 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Pago con PayPhone Cancelado
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            La transacción fue cancelada y no se ha realizado ningún cobro a tu tarjeta. Los productos siguen guardados en tu carrito.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button
            onClick={handleReturnToCart}
            className="w-full py-3 px-4 rounded-xl bg-[#8c9276] hover:bg-[#7a8064] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Reintentar en Carrito
          </button>
          <Link
            href="/shop"
            className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Seguir Comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
