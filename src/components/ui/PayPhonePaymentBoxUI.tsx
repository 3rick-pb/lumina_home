"use client";

import React, { useEffect, useState, useRef } from "react";
import { buildPayPhoneBreakdown } from "@/lib/payphone";
import { Loader2, AlertCircle } from "lucide-react";

interface PayPhonePaymentBoxUIProps {
  totalUsd: number;
}

export function PayPhonePaymentBoxUI({ totalUsd }: PayPhonePaymentBoxUIProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ token: string; storeId: string }>({
    token: process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "",
    storeId: process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "",
  });

  const isRenderedRef = useRef(false);

  // 1. Obtener credenciales (desde variables de entorno o desde la API de backend)
  useEffect(() => {
    let isMounted = true;

    async function resolveCredentials() {
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
          console.warn("[PayPhone] No se pudo consultar /api/payphone/config:", err);
        }
      }

      if (isMounted) {
        setCreds({ token: t, storeId: s });
      }
    }

    resolveCredentials();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Cargar CSS y JS oficiales v2.0 de PayPhone
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
      script.onload = () => setSdkReady(true);
      script.onerror = () => {
        setErrorMessage("No se pudo cargar el script de la Cajita de PayPhone desde el CDN.");
        setLoading(false);
      };
      document.body.appendChild(script);
    } else {
      setSdkReady(true);
    }
  }, []);

  // 3. Inicializar y renderizar la Cajita de Pagos en #pp-button
  useEffect(() => {
    if (!sdkReady || typeof window === "undefined") return;

    const PPBox = (window as any).PPaymentButtonBox;
    if (!PPBox) {
      // Reintentar tras un breve momento si el módulo aún está registrando la variable global
      const timer = setTimeout(() => {
        if ((window as any).PPaymentButtonBox) {
          setSdkReady((prev) => !prev);
        } else {
          setErrorMessage("El SDK de PayPhone no cargó el componente PPaymentButtonBox.");
          setLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }

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
      isRenderedRef.current = true;
      setLoading(false);
      setErrorMessage(null);
    } catch (error: any) {
      console.error("[PayPhone] Error al renderizar PPaymentButtonBox:", error);
      setErrorMessage(error?.message || "Error al inicializar la Cajita de Pagos de PayPhone.");
      setLoading(false);
    }
  }, [sdkReady, creds, totalUsd]);

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
            <p className="font-bold">Aviso de configuración PayPhone</p>
            <p className="text-[11px] leading-relaxed opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Contenedor oficial donde PayPhone inyecta el formulario */}
      <div id="pp-button" className={`w-full ${loading ? "hidden" : "block"}`} />
    </div>
  );
}
