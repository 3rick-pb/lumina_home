"use client";

import React, { useEffect, useState, useRef } from "react";
import { buildPayPhoneBreakdown } from "@/lib/payphone";
import { Loader2, AlertCircle } from "lucide-react";

interface PayPhonePaymentBoxUIProps {
  totalUsd: number;
}

export function PayPhonePaymentBoxUI({ totalUsd }: PayPhonePaymentBoxUIProps) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ token: string; storeId: string }>({
    token: process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "",
    storeId: process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "",
  });

  const isMountedRef = useRef(false);

  // 1. Resolver credenciales (desde env público o desde endpoint /api/payphone/config)
  useEffect(() => {
    let active = true;

    async function loadConfig() {
      let t = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "";
      let s = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "";

      if (!t || !s) {
        try {
          const res = await fetch("/api/payphone/config", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.token) t = data.token;
            if (data.storeId) s = data.storeId;
          }
        } catch (err) {
          console.warn("[PayPhone] Error al consultar /api/payphone/config:", err);
        }
      }

      if (active) {
        setCreds({ token: t, storeId: s });
      }
    }

    loadConfig();
    return () => {
      active = false;
    };
  }, []);

  // 2. Cargar dependencias en el head si aún no existen
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("payphone-box-css")) {
      const link = document.createElement("link");
      link.id = "payphone-box-css";
      link.rel = "stylesheet";
      link.href =
        "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("payphone-box-js")) {
      const script = document.createElement("script");
      script.id = "payphone-box-js";
      script.type = "module";
      script.src =
        "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";
      document.head.appendChild(script);
    }
  }, []);

  // 3. Polling activo y renderizado de PPaymentButtonBox
  useEffect(() => {
    if (typeof window === "undefined") return;

    let attempts = 0;
    const maxAttempts = 80; // 80 * 150ms = 12 segundos
    let timerId: any = null;

    const renderBox = (PPBox: any) => {
      const container = document.getElementById("pp-button");
      if (!container) return;
      container.innerHTML = "";

      const activeToken = creds.token || process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "";
      const activeStoreId = creds.storeId || process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "";

      if (!activeToken) {
        setErrorMessage(
          "Falta configurar PAYPHONE_TOKEN en las variables de entorno de Vercel."
        );
        setLoading(false);
        return;
      }

      const breakdown = buildPayPhoneBreakdown(totalUsd, true);

      try {
        const params: any = {
          token: activeToken,
          clientTransactionId: breakdown.clientTransactionId,
          amount: breakdown.amount,
          amountWithoutTax: breakdown.amountWithoutTax,
          amountWithTax: breakdown.amountWithTax,
          tax: breakdown.tax,
          service: breakdown.service,
          tip: breakdown.tip,
          currency: "USD",
          reference: "Orden Lumina Home",
          lang: "es",
          defaultMethod: "card",
          timeZone: -5,
        };

        if (activeStoreId && !activeStoreId.includes("XXXX")) {
          params.storeId = activeStoreId;
        }

        const ppb = new PPBox(params);
        ppb.render("pp-button");
        isMountedRef.current = true;
        setLoading(false);
        setErrorMessage(null);
      } catch (err: any) {
        console.error("[PayPhone] Error al renderizar:", err);
        setErrorMessage(
          err?.message || "Error al renderizar la Cajita de Pagos de PayPhone."
        );
        setLoading(false);
      }
    };

    const checkSdk = () => {
      const PPBox = (window as any).PPaymentButtonBox;
      if (PPBox) {
        if (timerId) clearInterval(timerId);
        renderBox(PPBox);
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          if (timerId) clearInterval(timerId);
          setErrorMessage(
            "El SDK oficial de PayPhone tardó demasiado en responder desde su CDN. Por favor recarga la página o verifica tu conexión."
          );
          setLoading(false);
        }
      }
    };

    if ((window as any).PPaymentButtonBox) {
      checkSdk();
    } else {
      timerId = setInterval(checkSdk, 150);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [creds, totalUsd]);

  return (
    <div className="w-full min-h-[340px] flex flex-col items-center justify-center relative p-2 font-sans">
      {loading && !errorMessage && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin text-[#FF5900]" />
          <p className="text-xs font-semibold">Cargando pasarela de pagos oficial PayPhone...</p>
        </div>
      )}

      {errorMessage && (
        <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3 my-4">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Aviso de PayPhone</p>
            <p className="text-[11px] leading-relaxed opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Contenedor oficial donde PayPhone inyecta la Cajita */}
      <div id="pp-button" className={`w-full ${loading ? "hidden" : "block"}`} />
    </div>
  );
}
