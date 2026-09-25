"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet, Smartphone, CheckCircle2, ArrowLeft, Gift, ShieldCheck, Lock, QrCode, Download } from "lucide-react";
import { useBrand } from "@/core/hooks/useBrand";

function LoyaltyPassContent() {
  const brand = useBrand();
  const searchParams = useSearchParams();
  const program = searchParams.get("program") || "Lumina Member Pass";
  const issuer = searchParams.get("issuer") || brand.name;
  const ptsPerDollar = searchParams.get("ptsPerDollar") || "10";
  const welcome = searchParams.get("welcome") || "200";
  const rawBg = searchParams.get("bg") || "#171717";
  const rawAccent = searchParams.get("accent") || "#8c9276";
  const bg = rawBg === "#111614" || rawBg === "#303825" ? "#171717" : rawBg;
  const accent = rawAccent === "#ccff00" || rawAccent === "#d2b48c" ? "#8c9276" : rawAccent;
  const code = searchParams.get("code") || "LUM-8842-PRV";
  const name = searchParams.get("name") || "Cliente Lumina";
  const pts = searchParams.get("pts") || welcome;
  const initialInstalled = searchParams.get("installed") as "apple" | "google" | null;

  const [addedPlatform, setAddedPlatform] = useState<"apple" | "google" | null>(initialInstalled);

  const handleSaveToWallet = (platform: "apple" | "google") => {
    setAddedPlatform(platform);
    const walletApiUrl = `/api/wallet/pass?type=loyalty&platform=${platform}&program=${encodeURIComponent(
      program
    )}&issuer=${encodeURIComponent(issuer)}&code=${encodeURIComponent(
      code
    )}&name=${encodeURIComponent(name)}&pts=${encodeURIComponent(
      pts
    )}&ptsPerDollar=${encodeURIComponent(ptsPerDollar)}&bg=${encodeURIComponent(
      bg
    )}&accent=${encodeURIComponent(accent)}`;

    if (platform === "google") {
      // Trigger Google Wallet LoyaltyObject JWT check (redirects to pay.google.com/gp/v/save/... if configured)
      window.location.href = walletApiUrl;
    }
  };

  const handleDownloadPassFile = () => {
    const passManifest = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.luminahome.loyalty",
      serialNumber: code,
      teamIdentifier: "LUMINAHOME",
      organizationName: issuer,
      description: program,
      backgroundColor: bg,
      foregroundColor: "#ffffff",
      labelColor: accent,
      barcode: {
        message: code,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: code,
      },
      storeCard: {
        headerFields: [
          { key: "points", label: "PUNTOS", value: `${Number(pts).toLocaleString()} pts` },
        ],
        primaryFields: [
          { key: "member", label: "TITULAR", value: name },
        ],
        secondaryFields: [
          { key: "code", label: "MEMBRESÍA", value: code },
          { key: "rate", label: "BENEFICIO", value: `+${ptsPerDollar} pts / $1` },
        ],
      },
    };

    const blob = new Blob([JSON.stringify(passManifest, null, 2)], {
      type: "application/vnd.apple.pkpass+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${code.toLowerCase()}-loyalty.pkpass.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 font-sans flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a {brand.name}</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-[10px] font-semibold uppercase tracking-wider shadow-2xs">
            <Lock className="w-3 h-3 text-[#8c9276]" /> Tarjeta de Lealtad (Sin Pagos)
          </span>
        </div>

        {/* Clean Digital Loyalty Wallet Card */}
        <div
          className="rounded-3xl overflow-hidden border border-black/10 shadow-2xl p-6 space-y-5 text-white relative"
          style={{
            backgroundColor: bg,
            color: bg === "#f5f5f4" ? "#171717" : "#ffffff",
          }}
        >
          <div className="flex items-center justify-between border-b border-current/10 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-base shrink-0 shadow-inner"
                style={{
                  backgroundColor: accent,
                  color: bg === "#f5f5f4" ? "#ffffff" : "#171717",
                }}
              >
                {brand.shortName.charAt(0)}
              </div>
              <div>
                <h1 className="text-base font-display font-semibold tracking-wide">{program}</h1>
                <p className="text-[11px] opacity-70">{issuer} · Loyalty Pass</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="text-[9px] uppercase tracking-widest block font-bold"
                style={{ color: accent }}
              >
                PUNTOS ACUMULADOS
              </span>
              <span className="text-2xl font-display font-bold">
                {Number(pts).toLocaleString()} pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-1">
            <div>
              <span className="text-[10px] uppercase tracking-wider opacity-60 block">
                TITULAR DE MEMBRESÍA
              </span>
              <span className="text-sm font-semibold">{name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider opacity-60 block">
                CÓDIGO DE LEALTAD
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: accent }}>
                {code}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/15 border border-current/10 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 opacity-90">
              <Gift className="w-4 h-4" style={{ color: accent }} />
              Recompensa activa:
            </span>
            <span className="font-semibold" style={{ color: accent }}>
              +{ptsPerDollar} pts / $1 USD
            </span>
          </div>

          {/* Scannable Barcode / QR Strip */}
          <div className="bg-white text-gray-900 rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                <QrCode className="w-7 h-7 text-gray-900" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Pase Escaneable en Tienda
                </p>
                <p className="text-xs font-mono font-bold text-gray-900">{code}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Activo
            </span>
          </div>
        </div>

        {/* Add to Google Wallet & Apple Wallet Buttons */}
        <div className="space-y-3 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm">
          <button
            type="button"
            onClick={() => handleSaveToWallet("google")}
            className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2.5 font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#8c9276]" />
            <span>Guardar Tarjeta de Lealtad en Google Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveToWallet("apple")}
            className="w-full h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 flex items-center justify-center gap-2.5 font-semibold text-xs transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-[#8c9276]" />
            <span>Añadir Pase a Apple Wallet / Pantalla de Inicio</span>
          </button>

          {addedPlatform && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-2.5 animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#8c9276] shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700 space-y-1">
                  <p className="font-bold text-gray-900">
                    Tarjeta de Lealtad lista para{" "}
                    {addedPlatform === "apple" ? "Apple Wallet (iOS)" : "Google Wallet (Android)"}
                  </p>
                  <p className="text-gray-500">
                    Esta es una <strong>Tarjeta de Lealtad / Puntos</strong> (no bancaria ni de pagos). Tus compras en <strong>{brand.name}</strong> suman puntos automáticamente al código <span className="font-mono font-bold">{code}</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadPassFile}
                className="self-end inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#8c9276]" />
                <span>Descargar metadatos del pase (.pkpass.json)</span>
              </button>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <ShieldCheck className="w-4 h-4 text-[#8c9276]" />
            <span>{brand.tagline}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoyaltyPassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f9fafb] text-gray-700 flex items-center justify-center text-xs font-sans">
          Cargando tarjeta de lealtad...
        </div>
      }
    >
      <LoyaltyPassContent />
    </Suspense>
  );
}
