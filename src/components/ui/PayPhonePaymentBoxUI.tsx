"use client";

import React, { useEffect, useState } from "react";
import { buildPayPhoneBreakdown } from "@/lib/payphone";

interface PayPhonePaymentBoxUIProps {
  totalUsd: number;
}

export function PayPhonePaymentBoxUI({ totalUsd }: PayPhonePaymentBoxUIProps) {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
      script.onload = () => setSdkReady(true);
      document.body.appendChild(script);
    } else {
      setSdkReady(true);
    }
  }, []);

  useEffect(() => {
    if (!sdkReady || typeof window === "undefined") return;

    const PPBox = (window as any).PPaymentButtonBox;
    if (!PPBox) return;

    const container = document.getElementById("pp-button");
    if (container) {
      container.innerHTML = "";
    }

    const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "";
    const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "";
    const breakdown = buildPayPhoneBreakdown(totalUsd, true);

    try {
      const ppb = new PPBox({
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
        reference: "Orden Lumina Home",
        lang: "es",
        defaultMethod: "card",
        timeZone: -5,
      });

      ppb.render("pp-button");
    } catch (error) {
      console.error("Error al renderizar PPaymentButtonBox:", error);
    }
  }, [sdkReady, totalUsd]);

  return (
    <div className="w-full min-h-[320px] flex items-center justify-center">
      <div id="pp-button" className="w-full" />
    </div>
  );
}
