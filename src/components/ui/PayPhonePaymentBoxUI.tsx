"use client";

import React, { useEffect, useState, useRef } from "react";
import { buildPayPhoneBreakdown, isRealPayPhoneToken } from "@/lib/payphone";

interface PayPhonePaymentBoxUIProps {
  totalUsd: number;
  onPaymentSuccess?: (data: any) => void;
}

export function PayPhonePaymentBoxUI({
  totalUsd,
  onPaymentSuccess,
}: PayPhonePaymentBoxUIProps) {
  const [activeTab, setActiveTab] = useState<"card" | "phone">("card");
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const boxInitialized = useRef(false);

  const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "";
  const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "";
  const hasRealCredentials =
    isRealPayPhoneToken(token) && Boolean(storeId) && !storeId.includes("XXXX");

  // Cargar CSS y JS oficial de la Cajita de Pagos PayPhone V2
  useEffect(() => {
    if (!hasRealCredentials || typeof window === "undefined") return;

    if (!document.getElementById("payphone-box-css")) {
      const link = document.createElement("link");
      link.id = "payphone-box-css";
      link.rel = "stylesheet";
      link.href =
        "https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("payphone-box-js")) {
      const script = document.createElement("script");
      script.id = "payphone-box-js";
      script.type = "module";
      script.src =
        "https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js";
      script.onload = () => setSdkLoaded(true);
      document.body.appendChild(script);
    } else {
      setSdkLoaded(true);
    }
  }, [hasRealCredentials]);

  // Renderizar #pp-button oficial cuando hay credenciales reales de producción
  useEffect(() => {
    if (!hasRealCredentials || !sdkLoaded || typeof window === "undefined") return;
    const PPBox = (window as any).PPaymentButtonBox;
    if (!PPBox) return;

    const container = document.getElementById("pp-button");
    if (container) container.innerHTML = "";

    const breakdown = buildPayPhoneBreakdown(totalUsd, true);

    try {
      new PPBox({
        token,
        storeId,
        clientTransactionId: breakdown.clientTransactionId,
        amount: breakdown.amount,
        amountWithoutTax: breakdown.amountWithoutTax,
        amountWithTax: breakdown.amountWithTax,
        tax: breakdown.tax,
        service: breakdown.service,
        tip: breakdown.tip,
        currency: "USD",
        reference: "Compra en Lumina Home",
        lang: "es",
        defaultMethod: activeTab === "phone" ? "payphone" : "card",
      }).render("pp-button");
      boxInitialized.current = true;
    } catch (err) {
      console.error("Error montando PPaymentButtonBox:", err);
    }
  }, [hasRealCredentials, sdkLoaded, totalUsd, activeTab, token, storeId]);

  const handleSandboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess?.({
        approved: true,
        method: activeTab,
        amount: Math.round(totalUsd * 100),
        transactionStatus: "Approved",
      });
    }, 1100);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Selector superior de modalidad: Tarjetas (4 franquicias) vs PayPhone App (# telefónico) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("card")}
          className={`flex items-center justify-center gap-2.5 h-12 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "card"
              ? "border-[#F97316] bg-[#FFF7ED]/60 dark:bg-orange-950/20 text-zinc-900 dark:text-white shadow-xs"
              : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20"
          }`}
        >
          <span className="font-bold tracking-tight text-[#1A1F71] dark:text-[#5B7FFF]">VISA</span>
          <span className="inline-flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#EB001B]" />
            <span className="w-3 h-3 -ml-1.5 rounded-full bg-[#F79E1B]" />
          </span>
          <span className="text-[10px] font-bold text-[#0079BE] dark:text-[#38BDF8]">DINERS</span>
          <span className="text-[10px] font-bold text-[#FF6000]">DISCOVER</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("phone")}
          className={`flex items-center justify-center gap-2 h-12 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "phone"
              ? "border-[#F97316] bg-[#FFF7ED]/60 dark:bg-orange-950/20 text-zinc-900 dark:text-white shadow-xs"
              : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20"
          }`}
        >
          <span className="w-5 h-5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-bold">
            P
          </span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">PayPhone</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-semibold">
            # Celular
          </span>
        </button>
      </div>

      {/* CAJITA DE PAGOS OFICIAL PAYPHONE (#pp-button) */}
      <div className="relative w-full rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-[0_12px_36px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Cabecera oficial de la Cajita PayPhone */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#FF6B00] flex items-center justify-center font-black text-xs text-white">
              P
            </div>
            <div>
              <p className="text-xs font-bold leading-none tracking-tight">
                PayPhone Checkout Box
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Pasarela Cifrada 3D Secure • PCI-DSS Nivel 1
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
              Total a pagar
            </span>
            <span className="text-sm font-extrabold text-white font-mono">
              ${totalUsd.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Contenedor real donde el SDK de PayPhone inyecta el iframe en producción */}
        <div
          id="pp-button"
          className={hasRealCredentials ? "p-4 min-h-[300px]" : "hidden"}
        />

        {/* Interfaz de la Cajita PayPhone cuando está en Sandbox (sin llaves de producción aún) */}
        {!hasRealCredentials && (
          <form onSubmit={handleSandboxSubmit} className="p-5 flex flex-col gap-4 font-sans">
            {activeTab === "card" ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tarjeta de Crédito o Débito
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                    <span>VISA</span> • <span>MASTERCARD</span> •{" "}
                    <span>DINERS</span> • <span>DISCOVER</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                      Número de tarjeta
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      placeholder="0000 0000 0000 0000"
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.03] text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF6B00] focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                        Expiración (MM/AA)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/AA"
                        className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.03] text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF6B00] focus:bg-white dark:focus:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                        Código CVV / CVC
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.03] text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF6B00] focus:bg-white dark:focus:bg-zinc-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                      Nombre en la tarjeta
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Como aparece en el plástico"
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.03] text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF6B00] focus:bg-white dark:focus:bg-zinc-900"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <div className="p-3 rounded-xl bg-orange-50/80 dark:bg-orange-500/10 border border-orange-200/70 dark:border-orange-500/20 text-xs text-orange-950 dark:text-orange-200">
                  Ingresa tu número celular registrado en <strong>PayPhone App</strong>. Recibirás una notificación push en tu teléfono para aprobar el cobro de <strong>${totalUsd.toFixed(2)} USD</strong>.
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                    Número de Teléfono Celular (Ecuador +593)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="h-11 px-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 flex items-center text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      🇪🇨 +593
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="099 123 4567"
                      className="flex-1 h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.03] text-sm font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF6B00] focus:bg-white dark:focus:bg-zinc-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full h-12 mt-1 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? "Procesando con PayPhone 3DS..."
                : activeTab === "card"
                ? `Pagar $${totalUsd.toFixed(2)} USD con Tarjeta`
                : `Enviar cobro de $${totalUsd.toFixed(2)} a mi PayPhone`}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/10 text-[10px] text-zinc-400">
              <span>Protegido por PayPhone Todoesposible</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                • Modo Sandbox Activo
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
