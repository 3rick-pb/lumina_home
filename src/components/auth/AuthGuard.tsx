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

  // For strict protected routes (/profile, /admin), render canonical brand loader until session is verified
  if (isStrictProtected && (!mounted || !isAuthInitialized || isLoading || !isAuthenticated)) {
    return <BrandLoadingScreen isFixed={true} />;
  }

  return (
    <div key={pathname} className="contents">
      {children}
    </div>
  );
}
