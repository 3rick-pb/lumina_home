"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAuthInitialized } = useUserStore();
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

    // 2. If already authenticated and visiting login/register, redirect to store home
    if (isAuthenticated && isAuthPage) {
      router.replace("/");
      return;
    }
  }, [mounted, isAuthInitialized, isLoading, isAuthenticated, isStrictProtected, isAuthPage, router]);

  // For strict protected routes (/profile, /admin), render deterministic loader on both SSR and CSR until session is verified
  if (isStrictProtected && (!mounted || !isAuthInitialized || isLoading || !isAuthenticated)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#8c9276] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-stone-500 font-medium">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
