"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import { BeUILoaderMetaballs } from "@/components/ui/BeUIControls";

/**
 * Validates that redirect paths are strictly safe relative internal routes
 * preventing open-redirect vulnerabilities (CVE-level security hardening).
 */
function sanitizeRedirectPath(path: string | null | undefined, fallback: string = "/"): string {
  if (!path) return fallback;
  const trimmed = path.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("\\") &&
    !trimmed.includes(":")
  ) {
    return trimmed;
  }
  return fallback;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState("Verificando autenticación con Google...");
  const [subMessage, setSubMessage] = useState("Iniciando validación de credenciales seguras...");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function handleAuthVerification() {
      try {
        const nextTarget = sanitizeRedirectPath(
          searchParams.get("next") || searchParams.get("redirectTo") || "/"
        );

        // 1. Check if Google OAuth returned an error directly in URL
        const oauthError = searchParams.get("error");
        const oauthErrorDescription = searchParams.get("error_description");
        if (oauthError) {
          console.error("[auth/callback] OAuth error from provider:", oauthError, oauthErrorDescription);
          router.replace("/auth/login?error=google_auth_failed");
          return;
        }

        // 2. Exchange PKCE code for session if present in URL query
        const code = searchParams.get("code");
        let activeSession = null;

        if (code) {
          setStatusMessage("Intercambiando token de sesión...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[auth/callback] exchangeCodeForSession error:", error);
          } else {
            activeSession = data.session;
          }
        }

        // 3. Fallback: inspect detected session in storage/url
        if (!activeSession) {
          const { data: sessionData } = await supabase.auth.getSession();
          activeSession = sessionData.session;
        }

        if (isCancelled) return;

        if (!activeSession) {
          console.warn("[auth/callback] No active session found after OAuth exchange.");
          router.replace("/auth/login?error=google_auth_failed");
          return;
        }

        // 4. Retrieve provider_token (Google Access Token)
        const providerToken = activeSession.provider_token;
        const accessToken = activeSession.access_token;

        if (!providerToken) {
          console.warn("[auth/callback] Provider token missing from session.");
          // Sign out and request user to log in granting profile permissions
          await supabase.auth.signOut();
          router.replace("/auth/login?error=missing_birth_year");
          return;
        }

        // 5. Query Google People API & Verify +18 Age via backend Route Handler
        setStatusMessage("Verificando mayoría de edad (+18)...");
        setSubMessage("Consultando fecha de nacimiento oficial con Google People API...");

        const verifyRes = await fetch("/api/auth/verify-age", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider_token: providerToken,
            access_token: accessToken,
          }),
        });

        const verifyData = await verifyRes.json();
        if (isCancelled) return;

        // CASE 1: Underage (< 18 years old)
        if (verifyRes.status === 403 && verifyData.code === "UNDERAGE") {
          setIsError(true);
          setErrorMessage(verifyData.error || `Acceso restringido: tienes ${verifyData.age} años.`);
          
          // Revoke & clean session immediately on client
          await supabase.auth.signOut();
          try {
            sessionStorage.removeItem("lumina_guest_mode");
          } catch {}

          setTimeout(() => {
            router.replace(`/auth/login?error=underage&age=${encodeURIComponent(String(verifyData.age || 0))}`);
          }, 1200);
          return;
        }

        // CASE 2: Missing birth year in Google account
        if (verifyRes.status === 403 && verifyData.code === "MISSING_BIRTH_YEAR") {
          setIsError(true);
          setErrorMessage(verifyData.error || "Fecha de nacimiento incompleta en tu cuenta de Google.");

          await supabase.auth.signOut();
          setTimeout(() => {
            router.replace("/auth/login?error=missing_birth_year");
          }, 1200);
          return;
        }

        // Generic Google API or token failure
        if (!verifyRes.ok || !verifyData.success) {
          setIsError(true);
          setErrorMessage(verifyData.error || "No se pudo verificar la mayoría de edad con Google.");

          await supabase.auth.signOut();
          setTimeout(() => {
            router.replace("/auth/login?error=google_auth_failed");
          }, 1200);
          return;
        }

        // CASE 3: Legal Age (+18) Verified successfully!
        const isLinkedFlow = searchParams.get("linked") === "true";
        const isMerged = Boolean(verifyData.isMerged);

        let finalRedirect = nextTarget;

        if (isMerged) {
          setStatusMessage("¡Cuenta unificada con éxito!");
          setSubMessage(
            `Detectamos tu cuenta previa con ${verifyData.mergedEmail || "este correo"}. Tus datos han sido unificados con Google manteniendo todos tus pedidos y favoritos intactos.`
          );
          try {
            sessionStorage.setItem(
              "lumina_merged_account_notification",
              JSON.stringify({
                email: verifyData.mergedEmail,
                name: verifyData.user?.name,
                timestamp: Date.now(),
              })
            );
          } catch {}
          const separator = finalRedirect.includes("?") ? "&" : "?";
          finalRedirect = `${finalRedirect}${separator}merged=true`;
        } else if (isLinkedFlow) {
          setStatusMessage("¡Cuenta de Google vinculada!");
          setSubMessage("Tu cuenta ha sido vinculada con Google con éxito y tu mayoría de edad (+18) está verificada.");
          const separator = finalRedirect.includes("?") ? "&" : "?";
          finalRedirect = `${finalRedirect}${separator}google_linked=success`;
        } else {
          setStatusMessage("¡Mayoría de edad confirmada!");
          setSubMessage(`Acceso concedido (${verifyData.age} años cumplidos). Redirigiendo a Lumina Home...`);
        }

        setTimeout(() => {
          router.replace(finalRedirect);
        }, isMerged || isLinkedFlow ? 1400 : 700);
      } catch (err) {
        console.error("[auth/callback] Unexpected verification error:", err);
        if (!isCancelled) {
          await supabase.auth.signOut();
          router.replace("/auth/login?error=google_auth_failed");
        }
      }
    }

    handleAuthVerification();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121214] flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] bg-white/90 dark:bg-[#1a1a1e]/90 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.08)] text-center space-y-6">
        
        {/* Animated Badge Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center p-1.5 ring-2 transition-colors duration-500 ${
            isError 
              ? "bg-rose-500/10 ring-rose-500/30 text-rose-600 dark:text-rose-400" 
              : "bg-emerald-500/10 ring-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          }`}>
            <div className="w-full h-full rounded-full bg-white dark:bg-[#202024] flex items-center justify-center shadow-sm">
              {isError ? (
                <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
              ) : (
                <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
              )}
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold uppercase tracking-wider">
            Google OAuth 2.0 • People API
          </span>
          <h2 className="font-display italic font-bold text-2xl text-stone-950 dark:text-white tracking-tight">
            {statusMessage}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
            {errorMessage || subMessage}
          </p>
        </div>

        {/* Animated Loader Bar */}
        {!isError && (
          <div className="pt-2 flex flex-col items-center justify-center gap-3">
            <BeUILoaderMetaballs size={36} className="text-[#8c9276]" />
            <span className="text-[11px] font-mono font-semibold text-stone-400 dark:text-stone-500">
              Validación Criptográfica en Progreso
            </span>
          </div>
        )}

        {isError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-medium">
            Redirigiendo a la pantalla de acceso...
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121214] flex items-center justify-center">
          <BeUILoaderMetaballs size={40} className="text-[#8c9276]" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
