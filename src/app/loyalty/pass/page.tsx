"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet, Smartphone, CheckCircle2, ArrowLeft, Gift, ShieldCheck, Lock } from "lucide-react";
import { useBrand } from "@/core/hooks/useBrand";
import { LuminaBrandEmblem } from "@/components/ui/LuminaBrandEmblem";

const toast = {
  success: (msg: string, _opts?: { description?: string }) => {
    if (typeof window !== "undefined") {
      console.info("[Lumina-PassProvisioning]", msg);
    }
  },
};

function LoyaltyPassContent() {
  const brand = useBrand();
  const searchParams = useSearchParams();
  const program = searchParams.get("program") || "Lumina Atelier Privé";
  const issuer = searchParams.get("issuer") || `${brand.name} • ${brand.tagline}`;
  const ptsPerDollar = searchParams.get("ptsPerDollar") || "10";
  const welcome = searchParams.get("welcome") || "200";
  const rawBg = searchParams.get("bg") || "#303825";
  const rawAccent = searchParams.get("accent") || "#d2b48c";
  const bg = rawBg === "#111614" ? "#303825" : rawBg;
  const accent = rawAccent === "#ccff00" ? "#d2b48c" : rawAccent;
  const code = searchParams.get("code") || "LUM-8842-PRV";
  const name = searchParams.get("name") || "Miembro Lumina";
  const pts = searchParams.get("pts") || welcome;

  const [addedPlatform, setAddedPlatform] = useState<"apple" | "google" | null>(null);

  const handleAddPass = (platform: "apple" | "google") => {
    setAddedPlatform(platform);
    toast.success(
      platform === "apple"
        ? "Tarjeta añadida a Apple Wallet (PassKit)"
        : "Tarjeta sincronizada en Google Wallet",
      {
        description: `Serial ${code} (${pts} pts) activo para acumulación automática en ${brand.name}.`,
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f5f0] text-[#1e1e20] font-sans flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#526437] hover:text-[#303825] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a {brand.name}</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#303825]/10 border border-[#526437]/25 text-[#303825] text-[10px] font-semibold uppercase tracking-wider">
            <Lock className="w-3 h-3 text-[#526437]" /> Certificado Oficial {brand.shortName}
          </span>
        </div>

        {/* Live Digital Wallet Card — Lumina Home Editorial Aesthetics */}
        <div
          className="rounded-[2rem] overflow-hidden border border-black/10 shadow-[0_24px_60px_rgba(30,36,23,0.22)] p-6 space-y-5 text-[#f4f5f0]"
          style={{ backgroundColor: bg }}
        >
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-black/20 border border-white/15 shrink-0">
                <LuminaBrandEmblem size={38} withGlow={false} />
              </div>
              <div>
                <h1 className="text-base font-display font-medium tracking-wide">{program}</h1>
                <p className="text-[11px] opacity-75">{issuer}</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="text-[9px] uppercase tracking-[0.16em] block font-bold"
                style={{ color: accent }}
              >
                PUNTOS LUMINA
              </span>
              <span className="text-2xl font-display font-semibold">
                {Number(pts).toLocaleString()} pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider opacity-60 block">
                MIEMBRO ACREDITADO
              </span>
              <span className="text-sm font-display font-medium">{name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider opacity-60 block">
                CÓDIGO DE MIEMBRO
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: accent }}>
                {code}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.08] border border-white/12 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 opacity-90">
              <Gift className="w-4 h-4" style={{ color: accent }} />
              Acumulación en tienda:
            </span>
            <span className="font-display font-semibold" style={{ color: accent }}>
              +{ptsPerDollar} pts / $1 USD
            </span>
          </div>
        </div>

        {/* Add to Apple Wallet & Google Wallet Buttons */}
        <div className="space-y-3 bg-white/85 backdrop-blur-xl p-5 rounded-3xl border border-[#8c9276]/25 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => handleAddPass("apple")}
            className="w-full h-13 rounded-2xl bg-[#1e1e20] hover:bg-black text-white flex items-center justify-center gap-3 font-semibold text-sm shadow-md transition-all cursor-pointer"
          >
            <Wallet className="w-5 h-5 text-[#d2b48c]" />
            <span>Añadir a Apple Wallet (iOS PassKit)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPass("google")}
            className="w-full h-13 rounded-2xl bg-[#526437] hover:bg-[#42502e] text-white flex items-center justify-center gap-3 font-semibold text-sm shadow-md transition-all cursor-pointer"
          >
            <Smartphone className="w-5 h-5 text-[#d2b48c]" />
            <span>Guardar en Google Wallet (Android)</span>
          </button>

          {addedPlatform && (
            <div className="p-4 rounded-2xl bg-[#f4f5f0] border border-[#526437]/30 flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-[#526437] shrink-0 mt-0.5" />
              <div className="text-xs text-[#303825] space-y-1">
                <p className="font-display font-semibold text-[#303825]">
                  Tarjeta vinculada en{" "}
                  {addedPlatform === "apple" ? "Apple Wallet" : "Google Wallet"}
                </p>
                <p className="text-[#526437]">
                  Tus adquisiciones en <strong>{brand.name}</strong> acreditarán puntos
                  automáticamente al código <span className="font-mono font-bold">{code}</span>.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#526437]">
            <ShieldCheck className="w-4 h-4 text-[#526437]" />
            <span className="italic font-display">“{brand.slogan}”</span>
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
        <div className="min-h-screen bg-[#f4f5f0] text-[#303825] flex items-center justify-center text-sm font-display">
          Preparando tu tarjeta de lealtad Lumina Home...
        </div>
      }
    >
      <LoyaltyPassContent />
    </Suspense>
  );
}
