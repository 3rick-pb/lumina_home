"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";

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

  useEffect(() => {
    let isCancelled = false;
    const nextTarget = sanitizeRedirectPath(
      searchParams.get("next") || searchParams.get("redirectTo") || "/"
    );

    const doRedirect = (url: string) => {
      // MUST use window.location.replace for OAuth callbacks.
      // Next.js router.replace() does NOT work reliably when returning from an
      // external OAuth provider (Google), because the page is not yet hydrated
      // as a proper Next.js SPA segment — it's a full external navigation return.
      if (typeof window !== "undefined") {
        window.location.replace(url);
      } else {
        router.replace(url);
      }
    };

    // Watchdog de seguridad (máximo 4s) para garantizar que jamás se quede congelado en la pantalla de carga
    const safetyWatchdog = setTimeout(() => {
      if (!isCancelled) {
        console.warn("[auth/callback] Safety watchdog triggered, navigating to target");
        doRedirect(nextTarget);
      }
    }, 4000);

    async function handleAuthVerification() {
      try {
        // 1. Check if Google OAuth returned an error directly in URL
        const oauthError = searchParams.get("error");
        if (oauthError) {
          clearTimeout(safetyWatchdog);
          if (
            oauthError === "access_denied" ||
            oauthError === "cancelled" ||
            oauthError.includes("denied") ||
            oauthError.includes("cancel")
          ) {
            doRedirect("/auth/login");
            return;
          }
          doRedirect("/auth/login?error=google_auth_failed");
          return;
        }

        // 2. Exchange PKCE code for session if present in URL query
        const code = searchParams.get("code");
        let activeSession = null;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
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
          clearTimeout(safetyWatchdog);
          doRedirect("/auth/login");
          return;
        }

        // 4. Retrieve provider_token (Google Access Token)
        const providerToken = activeSession.provider_token;
        const accessToken = activeSession.access_token;

        if (!providerToken) {
          clearTimeout(safetyWatchdog);
          doRedirect(nextTarget);
          return;
        }

        // 5. Query Google People API & Verify +18 Age silently in background
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
        clearTimeout(safetyWatchdog);

        // Solo revocar sesión si explícitamente se comprobó minoría de edad (< 18)
        if (verifyRes.status === 403 && verifyData?.code === "UNDERAGE") {
          await supabase.auth.signOut();
          try {
            sessionStorage.removeItem("lumina_guest_mode");
          } catch {}
          doRedirect("/auth/login?error=underage");
          return;
        }

        // LEGAL AGE (+18) -> Pass directly to destination without delays, modals or visible notices
        const isLinkedFlow = searchParams.get("linked") === "true";
        const isMerged = Boolean(verifyData?.isMerged);
        const emailKey = (verifyData?.mergedEmail || activeSession.user?.email || "").toLowerCase().trim();

        const alreadyNotified = Boolean(
          typeof window !== "undefined" &&
          (localStorage.getItem("lumina_merged_notified_all") === "true" ||
            (emailKey && localStorage.getItem(`lumina_merged_notified_${emailKey}`) === "true"))
        );

        let finalRedirect = nextTarget;
        if (isMerged && !alreadyNotified) {
          // Marcar de inmediato en localStorage para que NUNCA vuelva a salir en futuros logeos
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("lumina_merged_notified_all", "true");
              if (emailKey) {
                localStorage.setItem(`lumina_merged_notified_${emailKey}`, "true");
              }
            } catch {}
          }

          try {
            sessionStorage.setItem(
              "lumina_merged_account_notification",
              JSON.stringify({
                email: emailKey,
                name: verifyData.user?.name,
                timestamp: Date.now(),
              })
            );
          } catch {}
          const separator = finalRedirect.includes("?") ? "&" : "?";
          finalRedirect = `${finalRedirect}${separator}merged=true`;
        } else if (isLinkedFlow) {
          const separator = finalRedirect.includes("?") ? "&" : "?";
          finalRedirect = `${finalRedirect}${separator}google_linked=success`;
        }

        doRedirect(finalRedirect);
      } catch (err) {
        console.error("[auth/callback] Non-fatal verification error:", err);
        clearTimeout(safetyWatchdog);
        if (!isCancelled) {
          // Si hubo un error no fatal en la verificación pero el usuario tiene sesión válida de Google,
          // jamás cerrar sesión a menos que explícitamente se confirme minoría de edad (< 18).
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            doRedirect(nextTarget);
          } else {
            doRedirect("/auth/login?error=auth_failed");
          }
        }
      }
    }

    handleAuthVerification();

    return () => {
      isCancelled = true;
      clearTimeout(safetyWatchdog);
    };
  }, [router, searchParams]);

  return <BrandLoadingScreen isFixed={true} />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<BrandLoadingScreen isFixed={true} />}
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
