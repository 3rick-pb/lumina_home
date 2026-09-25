"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet, Smartphone, CheckCircle2, ArrowLeft, Gift, ShieldCheck, Lock, QrCode, Download, Sparkles, AlertCircle } from "lucide-react";
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
  const needsSetup = searchParams.get("needsSetup") === "true";

  const [downloadingApple, setDownloadingApple] = useState(false);
  const [downloadingGoogle, setDownloadingGoogle] = useState(false);
  const [activePlatform, setActivePlatform] = useState<"apple" | "google" | null>(needsSetup ? "google" : null);

  const handleDownloadApplePkpass = () => {
    setDownloadingApple(true);
    setActivePlatform("apple");
    const downloadUrl = `/api/wallet/pass?platform=apple&type=loyalty&program=${encodeURIComponent(
      program
    )}&issuer=${encodeURIComponent(issuer)}&code=${encodeURIComponent(
      code
    )}&name=${encodeURIComponent(name)}&pts=${encodeURIComponent(
      pts
    )}&ptsPerDollar=${encodeURIComponent(ptsPerDollar)}`;
    
    // Direct browser navigation triggers the official .pkpass file stream
    window.location.href = downloadUrl;
    setTimeout(() => setDownloadingApple(false), 2000);
  };

  const handleSaveGoogleWallet = () => {
    setDownloadingGoogle(true);
    setActivePlatform("google");
    const googleWalletUrl = `/api/wallet/pass?platform=google&type=loyalty&program=${encodeURIComponent(
      program
    )}&issuer=${encodeURIComponent(issuer)}&code=${encodeURIComponent(
      code
    )}&name=${encodeURIComponent(name)}&pts=${encodeURIComponent(
      pts
    )}&ptsPerDollar=${encodeURIComponent(ptsPerDollar)}&bg=${encodeURIComponent(
      bg
    )}`;

    window.location.href = googleWalletUrl;
    setTimeout(() => setDownloadingGoogle(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a {brand.name}</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-[10px] font-semibold uppercase tracking-wider shadow-sm">
            <Lock className="w-3 h-3 text-[#8c9276]" /> Pase de Fidelización Real
          </span>
        </div>

        {/* Real Digital Loyalty Wallet Card Graphic */}
        <div
          className="rounded-[2rem] overflow-hidden border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 sm:p-7 space-y-5 text-white relative backdrop-blur-2xl"
          style={{
            backgroundColor: bg,
          }}
        >
          {/* Subtle Specular Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

          <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-display font-bold text-lg shrink-0 shadow-lg text-gray-950"
                style={{
                  backgroundColor: accent,
                }}
              >
                {brand.shortName.charAt(0)}
              </div>
              <div>
                <h1 className="text-base font-display font-bold tracking-wide">{program}</h1>
                <p className="text-[11px] text-white/60">{issuer} · Tarjeta Oficial</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="text-[9px] uppercase tracking-widest block font-bold"
                style={{ color: accent }}
              >
                PUNTOS
              </span>
              <span className="text-2xl font-display font-black text-white">
                {Number(pts).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-1 relative z-10">
            <div>
              <span className="text-[9.5px] uppercase tracking-wider text-white/50 block font-mono">
                TITULAR
              </span>
              <span className="text-sm font-semibold text-white truncate block">{name}</span>
            </div>
            <div className="text-right">
              <span className="text-[9.5px] uppercase tracking-wider text-white/50 block font-mono">
                MEMBRESÍA
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: accent }}>
                {code}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between text-xs relative z-10">
            <span className="flex items-center gap-2 text-white/85">
              <Gift className="w-4 h-4" style={{ color: accent }} />
              Beneficio acumulativo:
            </span>
            <span className="font-semibold font-mono" style={{ color: accent }}>
              +{ptsPerDollar} pts / $1 USD
            </span>
          </div>

          {/* Scannable Barcode / QR Strip inside Card */}
          <div className="bg-white text-gray-950 rounded-2xl p-4 flex items-center justify-between shadow-inner relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-300 flex items-center justify-center shrink-0">
                <QrCode className="w-8 h-8 text-gray-950" />
              </div>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                  Código de Escaneo en Tienda
                </p>
                <p className="text-xs font-mono font-black text-gray-950">{code}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              VÁLIDO
            </span>
          </div>
        </div>

        {/* Real Native Wallet Buttons */}
        <div className="space-y-3.5 bg-[#161b22] p-5 sm:p-6 rounded-[2rem] border border-white/15 shadow-2xl">
          <div className="space-y-1 pb-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8c9276]" />
              Exportar Pase a Billeteras Digitales
            </h3>
            <p className="text-[11px] text-white/60">
              Descarga el archivo binario oficial o guarda directamente en tu cuenta.
            </p>
          </div>

          {/* Button 1: Apple Wallet .pkpass real download */}
          <button
            type="button"
            onClick={handleDownloadApplePkpass}
            disabled={downloadingApple}
            className="w-full h-12 rounded-2xl bg-white hover:bg-gray-100 text-gray-950 flex items-center justify-center gap-2.5 font-bold text-xs shadow-lg transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
          >
            <Download className="w-4 h-4 text-gray-950" />
            <span>
              {downloadingApple ? "Generando .pkpass..." : "Descargar Apple Wallet (.pkpass oficial)"}
            </span>
          </button>

          {/* Button 2: Google Wallet Save Link */}
          <button
            type="button"
            onClick={handleSaveGoogleWallet}
            disabled={downloadingGoogle}
            className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center gap-2.5 font-bold text-xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>
              {downloadingGoogle ? "Conectando Google Wallet..." : "Guardar en Google Wallet (Android)"}
            </span>
          </button>

          {/* Informative Help Box */}
          {activePlatform === "apple" && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 animate-fade-in text-xs text-white/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px]">
                <p className="font-bold text-white">Archivo binario .pkpass generado</p>
                <p className="text-white/65">
                  En Safari (iPhone / iPad / Mac), el archivo <strong>.pkpass</strong> se abre directamente en la aplicación nativa <strong>Apple Wallet</strong> para añadirlo a tu llavero con 1 toque.
                </p>
              </div>
            </div>
          )}

          {activePlatform === "google" && needsSetup && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 animate-fade-in text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px]">
                <p className="font-bold text-white">Configuración de Google Wallet API (100% Gratis)</p>
                <p className="text-white/70">
                  Para que el botón abra automáticamente la aplicación oficial de Google Wallet en teléfonos Android sin pedir confirmación manual, agrega tus 3 claves gratuitas de Google Cloud Console en tu archivo <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">.env.local</code>:
                </p>
                <ul className="list-disc pl-4 text-white/60 space-y-0.5 pt-1">
                  <li><code className="text-white font-mono">GOOGLE_WALLET_ISSUER_ID</code></li>
                  <li><code className="text-white font-mono">GOOGLE_WALLET_CLIENT_EMAIL</code></li>
                  <li><code className="text-white font-mono">GOOGLE_WALLET_PRIVATE_KEY</code></li>
                </ul>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-white/40">
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
        <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center text-xs font-sans">
          Cargando tarjeta de lealtad...
        </div>
      }
    >
      <LoyaltyPassContent />
    </Suspense>
  );
}
