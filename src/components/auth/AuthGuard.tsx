"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAuthInitialized } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isProtected = pathname?.startsWith("/profile") || pathname?.startsWith("/admin");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect to login if auth is fully initialized and the user is trying to access a private dashboard without authentication
    if (mounted && isAuthInitialized && !isLoading && !isAuthenticated && isProtected) {
      router.push("/auth/login");
    }
  }, [mounted, isAuthInitialized, isLoading, isAuthenticated, isProtected, router]);

  // To prevent Next.js build errors (PageNotFoundError), always render children during SSR
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  // If trying to access a protected dashboard route while unauthenticated or initializing, show loader while redirecting
  if (isProtected && (!isAuthInitialized || isLoading || !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
