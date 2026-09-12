"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useUserStore, Order } from "@/lib/userStore";

function PayPhoneCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const { addOrder } = useUserStore();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    const clientTxId = searchParams.get("clientTransactionId");

    if (!id || !clientTxId) {
      setStatus("error");
      setErrorMessage("Parámetros de confirmación incompletos en la respuesta de PayPhone.");
      return;
    }

    let isMounted = true;

    async function confirmPayment() {
      try {
        const res = await fetch("/api/payphone/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, clientTxId })
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success && data.transactionStatus === "Approved") {
          setStatus("success");
          clearCart();
          if (data.order) {
            setConfirmedOrder(data.order);
            addOrder(data.order);
          }
        } else {
          setStatus("error");
          setErrorMessage(data.error || data.message || "La transacción no pudo ser verificada por la pasarela PayPhone.");
        }
      } catch {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage("Error de conexión al verificar el estado del pago con PayPhone.");
      }
    }

    confirmPayment();

    return () => {
      isMounted = false;
    };
  }, [searchParams, clearCart, addOrder]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#18181a] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white dark:bg-[#202022] rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 dark:border-white/10 text-center space-y-6">
        {status === "loading" && (
          <div className="py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#8c9276]/10 text-[#8c9276] flex items-center justify-center mx-auto animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Verificando transacción segura PayPhone...
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Estamos confirmando la autorización bancaria con la red PayPhone Ecuador. Por favor, no cierres esta ventana.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="py-6 space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-2">
                <ShieldCheck className="w-4 h-4" /> Pago Autorizado por PayPhone
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ¡Tu pedido está confirmado!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Hemos recibido tu pago con éxito. Te hemos enviado la factura digital y los detalles a tu correo.
              </p>
            </div>

            {confirmedOrder && (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#2c2c2e] border border-gray-100 dark:border-white/5 text-left text-xs space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-500 dark:text-gray-400">ID del Pedido:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-mono">{confirmedOrder.id}</span>
                </div>
                {confirmedOrder.trackingNumber && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-500 dark:text-gray-400">Rastreo:</span>
                    <span className="text-[#8c9276] font-mono">{confirmedOrder.trackingNumber}</span>
                  </div>
                )}
                {confirmedOrder.paymentMethod && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-500 dark:text-gray-400">Modalidad:</span>
                    <span className="text-gray-900 dark:text-gray-100">{confirmedOrder.paymentMethod}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-500 dark:text-gray-400">Total Pagado:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold">${Number(confirmedOrder.total).toFixed(2)} USD</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/profile"
                className="flex-1 py-3 px-4 rounded-xl bg-[#8c9276] hover:bg-[#7a8064] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" /> Ver en Mis Pedidos
              </Link>
              <Link
                href="/shop"
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                Seguir Explorando <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="py-6 space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                No pudimos procesar el cobro
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("lumina_cart_reopen", "true");
                  }
                  router.push("/");
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm transition-opacity hover:opacity-90"
              >
                Reintentar Pago
              </button>
              <button
                onClick={() => router.push("/shop")}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-white/15"
              >
                Ir a la Tienda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayPhoneCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/50 dark:bg-[#18181a] flex items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#8c9276] border-t-transparent animate-spin" />
      </div>
    }>
      <PayPhoneCallbackContent />
    </Suspense>
  );
}
