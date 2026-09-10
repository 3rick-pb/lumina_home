"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAuthInitialized, isGuestMode } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isStrictProtected = pathname?.startsWith("/profile") || pathname?.startsWith("/admin");
  const isAuthPage = pathname?.startsWith("/auth");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthInitialized || isLoading) return;

    // 1. Strict Protected Routes (/profile, /admin) require full authentication
    if (isStrictProtected && !isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    // 2. Default Store Entry Gatekeeper:
    // New / unauthenticated visitors who haven't selected "Continuar sin cuenta" are routed to /auth/login
    if (!isAuthenticated && !isGuestMode && !isAuthPage) {
      router.replace("/auth/login");
      return;
    }

    // 3. If already authenticated and visiting login/register, redirect to store home
    if (isAuthenticated && isAuthPage) {
      router.replace("/");
      return;
    }
  }, [mounted, isAuthInitialized, isLoading, isAuthenticated, isGuestMode, isStrictProtected, isAuthPage, router]);

  // To prevent Next.js build errors (PageNotFoundError), always render children during SSR
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  // Visual Shield: Block rendering if user is not authorized to prevent flash of content
  const shouldBlock = 
    (isStrictProtected && (!isAuthInitialized || isLoading || !isAuthenticated)) ||
    (!isAuthPage && !isAuthInitialized) ||
    (!isAuthPage && isAuthInitialized && !isLoading && !isAuthenticated && !isGuestMode);

  if (shouldBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="w-8 h-8 border-2 border-[#8c9276] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
