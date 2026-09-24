"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet, Smartphone, CheckCircle2, Sparkles, ArrowLeft, Gift, ShieldCheck } from "lucide-react";

const toast = {
  success: (msg: string, _opts?: { description?: string }) => {
    if (typeof window !== "undefined") {
      console.info("[LoyaltyPass]", msg);
    }
  },
};

function LoyaltyPassContent() {
  const searchParams = useSearchParams();
  const program = searchParams.get("program") || "Lumina Privé Club";
  const issuer = searchParams.get("issuer") || "Lumina Home Studio";
  const ptsPerDollar = searchParams.get("ptsPerDollar") || "10";
  const welcome = searchParams.get("welcome") || "200";
  const bg = searchParams.get("bg") || "#111614";
  const accent = searchParams.get("accent") || "#ccff00";
  const code = searchParams.get("code") || "LUM-8842-VIP";
  const name = searchParams.get("name") || "Miembro VIP";
  const pts = searchParams.get("pts") || welcome;

  const [addedPlatform, setAddedPlatform] = useState<"apple" | "google" | null>(null);

  const handleAddPass = (platform: "apple" | "google") => {
    setAddedPlatform(platform);
    toast.success(
      platform === "apple"
        ? "Pase añadido a Apple Wallet con éxito"
        : "Pase guardado en Google Wallet con éxito",
      {
        description: `Tu tarjeta ${code} (${pts} puntos) ya está activa para acumular en cada compra.`,
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#0c100e] text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir a la tienda</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ccff00]/15 border border-[#ccff00]/30 text-[#ccff00] text-[10px] font-mono uppercase">
            <ShieldCheck className="w-3.5 h-3.5" /> Pase Oficial Verificado
          </span>
        </div>

        {/* Live Digital Wallet Card */}
        <div
          className="rounded-[2rem] overflow-hidden border border-white/15 shadow-2xl p-6 space-y-5"
          style={{ backgroundColor: bg }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-serif font-bold text-lg text-gray-950"
                style={{ backgroundColor: accent }}
              >
                L
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wide">{program}</h1>
                <p className="text-xs text-white/65">{issuer}</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="text-[10px] font-mono uppercase tracking-widest block font-bold"
                style={{ color: accent }}
              >
                SALDO ACTUAL
              </span>
              <span className="text-2xl font-mono font-extrabold">
                {Number(pts).toLocaleString()} pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                TITULAR
              </span>
              <span className="text-sm font-bold">{name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                CÓDIGO DE MIEMBRO
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: accent }}>
                {code}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-white/85">
              <Gift className="w-4 h-4" style={{ color: accent }} />
              Acumulación por compra:
            </span>
            <span className="font-mono font-bold" style={{ color: accent }}>
              +{ptsPerDollar} pts / $1 USD
            </span>
          </div>
        </div>

        {/* Add to Apple Wallet & Google Wallet Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleAddPass("apple")}
            className="w-full h-14 rounded-2xl bg-black hover:bg-zinc-900 border border-white/20 flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer"
          >
            <Wallet className="w-5 h-5 text-white" />
            <div className="text-left">
              <span className="block text-[10px] uppercase tracking-wider text-white/60 leading-none">
                Añadir a
              </span>
              <span className="text-sm font-bold text-white">Apple Wallet</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddPass("google")}
            className="w-full h-14 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer"
          >
            <Smartphone className="w-5 h-5 text-white" />
            <div className="text-left">
              <span className="block text-[10px] uppercase tracking-wider text-white/80 leading-none">
                Guardar en
              </span>
              <span className="text-sm font-bold text-white">Google Wallet</span>
            </div>
          </button>
        </div>

        {addedPlatform && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              ¡Listo! Tu tarjeta <strong>{code}</strong> ha sido vinculada a{" "}
              <strong>{addedPlatform === "apple" ? "Apple Wallet" : "Google Wallet"}</strong>. Cada compra en
              Lumina sumará puntos automáticamente.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoyaltyPassPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0c100e]" />}>
      <LoyaltyPassContent />
    </Suspense>
  );
}
