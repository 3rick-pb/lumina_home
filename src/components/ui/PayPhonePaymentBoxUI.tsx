"use client";

import React, { useEffect, useState, useRef } from "react";
import { buildPayPhoneBreakdown } from "@/lib/payphone";
import { Loader2, AlertCircle, ShieldCheck, Lock } from "lucide-react";
import { ThinkingOrb } from "thinking-orbs";

interface PayPhonePaymentBoxUIProps {
  totalUsd: number;
}

export function PayPhonePaymentBoxUI({ totalUsd }: PayPhonePaymentBoxUIProps) {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ token: string; storeId: string }>({
    token: process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "",
    storeId: process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "",
  });

  const hasInitializedRef = useRef(false);
  const boxInstanceRef = useRef<any>(null);

  // 1. Obtener credenciales (desde env público o desde /api/payphone/config)
  useEffect(() => {
    let active = true;

    async function loadConfig() {
      let t = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "";
      let s = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "";

      // Si no están inlined como NEXT_PUBLIC, las consultamos del servidor de Next.js
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
        setIsConfigLoaded(true);
      }
    }

    loadConfig();
    return () => {
      active = false;
    };
  }, []);

  // 2. Asegurar que las dependencias oficiales v2.0 de PayPhone estén en el DOM
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

  // 3. Montar la Cajita de Pagos oficial en #pp-button una vez que las credenciales y el SDK estén listos
  useEffect(() => {
    if (typeof window === "undefined" || !isConfigLoaded) return;

    let attempts = 0;
    const maxAttempts = 150; // 150 * 100ms = 15 segundos de tolerancia
    let timerId: any = null;

    const renderBox = (PPBox: any) => {
      const container = document.getElementById("pp-button");
      if (!container || hasInitializedRef.current) return;

      const activeToken = (creds.token || process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "").trim();
      const activeStoreId = (creds.storeId || process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "").trim();

      if (!activeToken) {
        setErrorMessage(
          "Falta configurar PAYPHONE_TOKEN en las variables de entorno de Vercel o en la consola de PayPhone Developers."
        );
        setLoading(false);
        return;
      }

      const breakdown = buildPayPhoneBreakdown(totalUsd, true);

      try {
        hasInitializedRef.current = true;
        container.innerHTML = "";

        // Parámetros oficiales según documentación y video tutorial PayPhone V2:
        const params: Record<string, any> = {
          token: activeToken,
          clientTransactionId: breakdown.clientTransactionId,
          amount: breakdown.amount,
          amountWithoutTax: breakdown.amountWithoutTax,
          currency: "USD",
          reference: "Orden Lumina Home",
        };

        if (activeStoreId && !activeStoreId.includes("XXXX") && activeStoreId !== "TU_STOREID") {
          params.storeId = activeStoreId;
        }

        const ppb = new PPBox(params);
        boxInstanceRef.current = ppb;
        ppb.render("pp-button");

        setLoading(false);
        setErrorMessage(null);
      } catch (err: any) {
        hasInitializedRef.current = false;
        console.error("[PayPhone] Error al renderizar PPaymentButtonBox:", err);
        setErrorMessage(
          err?.message || "Ocurrió un error al renderizar la pasarela de PayPhone."
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
            "El SDK oficial de PayPhone tardó demasiado en responder desde el CDN. Por favor recarga la página o verifica tu conexión a internet."
          );
          setLoading(false);
        }
      }
    };

    if ((window as any).PPaymentButtonBox) {
      checkSdk();
    } else {
      timerId = setInterval(checkSdk, 100);
    }

    return () => {
      if (timerId) clearInterval(timerId);
      hasInitializedRef.current = false;
    };
  }, [isConfigLoaded, creds, totalUsd]);

  return (
    <div className="w-full flex flex-col items-center justify-center relative p-2 font-sans">
      {/* Indicador de carga mientras el CDN de PayPhone responde */}
      {loading && !errorMessage && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-gray-500 dark:text-gray-400">
          <ThinkingOrb state="working" size={32} color="#FF5900" />
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Conectando con pasarela PayPhone...
            </p>
            <p className="text-[11px] text-gray-400">
              Cargando formulario seguro de cobro
            </p>
          </div>
        </div>
      )}

      {/* Mensaje de alerta en caso de credenciales faltantes o timeout de red */}
      {errorMessage && (
        <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3 my-4">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Aviso de Configuración PayPhone</p>
            <p className="text-[11px] leading-relaxed opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Contenedor oficial donde PayPhone inyecta el formulario (siempre visible con altura adecuada) */}
      <div
        id="pp-button"
        className="w-full min-h-[380px] transition-all duration-300"
      />

      {/* Sello de seguridad y métodos soportados */}
      <div className="w-full pt-3 mt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Pago seguro 256-bit SSL
        </span>
        <span className="font-medium text-gray-500 dark:text-gray-400">
          PayPhone Ecuador
        </span>
      </div>
    </div>
  );
}
