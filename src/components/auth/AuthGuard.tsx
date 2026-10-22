"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAuthInitialized } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isStrictProtected = pathname?.startsWith("/profile") || pathname?.startsWith("/admin");
  // IMPORTANT: /auth/callback must NOT be considered an "auth page" for redirect purposes.
  // Only /auth/login and /auth/register should be redirected when already authenticated.
  const isAuthLoginOrRegister =
    pathname === "/auth/login" || pathname === "/auth/register";

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

    // 2. If already authenticated and visiting login/register only, redirect to store home
    if (isAuthenticated && isAuthLoginOrRegister) {
      router.replace("/");
      return;
    }
  }, [mounted, isAuthInitialized, isLoading, isAuthenticated, isStrictProtected, isAuthLoginOrRegister, router]);

  // For strict protected routes (/profile, /admin), render canonical brand loader until session is verified
  if (isStrictProtected && (!mounted || !isAuthInitialized || isLoading || !isAuthenticated)) {
    return <BrandLoadingScreen isFixed={true} />;
  }

  // CRITICAL FIX: Do NOT use key={pathname} here.
  // key={pathname} causes React to unmount+remount all children on every route change,
  // which cancels in-flight click events and causes buttons to require two clicks.
  return <>{children}</>;
}
