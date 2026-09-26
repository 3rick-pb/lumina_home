"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QrCode, Loader2 } from "lucide-react";
import { GoogleWalletButton } from "@/components/ui/GoogleWalletButton";

function LoyaltyPassContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Cliente Lumina";
  const code = searchParams.get("code") || "LUM-1042-PRV";
  const pts = searchParams.get("pts") || "200";
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  // Fetch or generate Google Wallet JWT save URL
  useEffect(() => {
    let isMounted = true;
    const fetchSaveUrl = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch("/api/wallet/google/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: email,
            memberCode: code,
          }),
        });
        const data = await res.json();
        if (isMounted) {
          if (data.success && data.saveUrl) {
            setSaveUrl(data.saveUrl);
          } else if (data.error) {
            setErrorMsg(data.error);
          }
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || "Error al conectar con Google Wallet.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSaveUrl();

    return () => {
      isMounted = false;
    };
  }, [code, email]);

  const handleOpenWallet = async () => {
    if (saveUrl) {
      setIsOpening(true);
      window.location.href = saveUrl;
      return;
    }
    try {
      setIsOpening(true);
      setErrorMsg(null);
      const res = await fetch("/api/wallet/google/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: email,
          memberCode: code,
        }),
      });
      const data = await res.json();
      if (data.success && data.saveUrl) {
        window.location.href = data.saveUrl;
        return;
      }
      setErrorMsg(data.error || "No se pudo generar el pase en Google Wallet.");
    } catch (err: any) {
      setErrorMsg(err.message || "Error de red al conectar con Google Wallet.");
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-white font-sans flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-[340px] space-y-4">
        {/* Minimal Digital Card Graphic */}
        <div className="w-full rounded-[1.75rem] bg-[#171717] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.7)] p-5 space-y-4 relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#8c9276]/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white text-gray-950 flex items-center justify-center font-display font-bold text-base shadow-sm">
                L
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight font-display text-white">LÚMINA HOME</h1>
                <p className="text-[10px] text-white/50 tracking-wider uppercase font-mono">TARJETA DE CLIENTE</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-[#8c9276] font-mono font-bold block">
                PUNTOS
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {Number(pts).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cardholder & Membership */}
          <div className="grid grid-cols-2 gap-2 py-0.5 relative z-10">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/40 block font-mono">
                TITULAR
              </span>
              <span className="text-xs font-semibold text-white truncate block">
                {name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-white/40 block font-mono">
                MEMBRESÍA
              </span>
              <span className="text-xs font-mono font-bold text-[#8c9276]">
                {code}
              </span>
            </div>
          </div>

          {/* Mini Scannable Barcode / QR Strip */}
          <div className="bg-white text-gray-950 rounded-xl p-3 flex items-center justify-between shadow-inner relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6 text-gray-950" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">
                  Código de Cliente
                </p>
                <p className="text-[11px] font-mono font-black text-gray-950">{code}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              ACTIVO
            </span>
          </div>
        </div>

        {/* Pure-Design Google Wallet Button */}
        <div className="pt-1 flex flex-col items-center">
          <GoogleWalletButton
            onClick={handleOpenWallet}
            topText="Add to"
            disabled={loading || isOpening}
            className="w-full justify-center shadow-lg"
          />
          {(loading || isOpening) && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-2.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{isOpening ? "Abriendo Google Wallet..." : "Conectando con Google Wallet..."}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 text-center w-full">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoyaltyPassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center text-xs font-mono">
          Cargando pase...
        </div>
      }
    >
      <LoyaltyPassContent />
    </Suspense>
  );
}
