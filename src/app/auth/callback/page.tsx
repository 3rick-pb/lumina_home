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

    async function handleAuthVerification() {
      try {
        const nextTarget = sanitizeRedirectPath(
          searchParams.get("next") || searchParams.get("redirectTo") || "/"
        );

        // 1. Check if Google OAuth returned an error directly in URL
        const oauthError = searchParams.get("error");
        if (oauthError) {
          // If user cancelled midway or denied access, return cleanly to login without underage error
          if (
            oauthError === "access_denied" ||
            oauthError === "cancelled" ||
            oauthError.includes("denied") ||
            oauthError.includes("cancel")
          ) {
            router.replace("/auth/login");
            return;
          }
          router.replace("/auth/login?error=google_auth_failed");
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
          // Missing session caused by user cancelling or aborting flow -> clean login redirect
          router.replace("/auth/login");
          return;
        }

        // 4. Retrieve provider_token (Google Access Token)
        const providerToken = activeSession.provider_token;
        const accessToken = activeSession.access_token;

        if (!providerToken) {
          // If session exists but provider token is absent, proceed to destination
          router.replace(nextTarget);
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

        // UNDERAGE OR MISSING BIRTH YEAR -> Sign out immediately and redirect to login
        if (
          (verifyRes.status === 403 && (verifyData.code === "UNDERAGE" || verifyData.code === "MISSING_BIRTH_YEAR")) ||
          !verifyRes.ok ||
          !verifyData.success
        ) {
          await supabase.auth.signOut();
          try {
            sessionStorage.removeItem("lumina_guest_mode");
          } catch {}
          router.replace("/auth/login?error=underage");
          return;
        }

        // LEGAL AGE (+18) -> Pass directly to destination without delays, modals or visible notices
        const isLinkedFlow = searchParams.get("linked") === "true";
        const isMerged = Boolean(verifyData.isMerged);

        const alreadyNotified = typeof window !== "undefined" && Boolean(
          verifyData.mergedEmail &&
          localStorage.getItem(`lumina_merged_notified_${verifyData.mergedEmail.toLowerCase().trim()}`) === "true"
        );

        let finalRedirect = nextTarget;
        if (isMerged && !alreadyNotified) {
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
          const separator = finalRedirect.includes("?") ? "&" : "?";
          finalRedirect = `${finalRedirect}${separator}google_linked=success`;
        }

        router.replace(finalRedirect);
      } catch (err) {
        console.error("[auth/callback] Unexpected verification error:", err);
        if (!isCancelled) {
          await supabase.auth.signOut();
          router.replace("/auth/login");
        }
      }
    }

    handleAuthVerification();

    return () => {
      isCancelled = true;
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
