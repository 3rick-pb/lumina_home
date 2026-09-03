"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isAuthRoute = pathname?.startsWith("/auth");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Always open on the login page if the user is unauthenticated
    if (mounted && !isLoading && !isAuthenticated && !isAuthRoute) {
      router.push("/auth/login");
    }
  }, [mounted, isLoading, isAuthenticated, isAuthRoute, router]);

  // To prevent Next.js build errors (PageNotFoundError), always render children during SSR
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  // If not authenticated and trying to access store/dashboard, hide while redirecting to login
  if (!isLoading && !isAuthenticated && !isAuthRoute) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <>{children}</>;
}
