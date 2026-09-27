"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * /wallet/add?code=LUM-XXX&email=xxx&name=xxx&pts=200&tier=Nivel+Plata
 *
 * Ultra-minimal bridge page. When a user scans the QR on a desktop modal,
 * their phone opens THIS page, which immediately:
 *   1. Calls the backend to generate the Google Wallet save URL
 *   2. Redirects instantly via window.location.href → Google Wallet
 *
 * No second QR. No buttons. No intermediate UI. Just a loading spinner
 * that disappears in <1s as the redirect fires.
 */
function WalletAddContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";
  const pts = searchParams.get("pts") || "200";
  const tier = searchParams.get("tier") || "";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      try {
        const res = await fetch("/api/wallet/google/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: email,
            customerName: name,
            memberCode: code,
            pointsBalance: Number(pts) || 200,
            tierName: tier || undefined,
          }),
        });

        const data = await res.json();

        if (cancelled) return;

        if (data.success && data.saveUrl) {
          // Instant redirect to Google Wallet — no intermediate UI
          window.location.href = data.saveUrl;
          return;
        }

        setError(data.error || "No se pudo generar la tarjeta.");
      } catch {
        if (!cancelled) {
          setError("Error de conexión con el servidor.");
        }
      }
    }

    redirect();
    return () => { cancelled = true; };
  }, [code, email, name, pts, tier]);

  return (
    <div className="min-h-screen bg-[#0E0E10] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-xs">
        {!error ? (
          <>
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
            <p className="text-sm text-white/70 font-medium">
              Preparando tu tarjeta de Google Wallet…
            </p>
            <p className="text-[11px] text-white/40">
              Serás redirigido automáticamente
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-red-400 text-lg font-bold">!</span>
            </div>
            <p className="text-sm text-red-300 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white font-semibold hover:bg-white/20 transition-colors"
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function WalletAddPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0E0E10] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      }
    >
      <WalletAddContent />
    </Suspense>
  );
}
