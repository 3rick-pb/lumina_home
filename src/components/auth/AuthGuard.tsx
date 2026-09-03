"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      if (pathname !== "/auth/login" && pathname !== "/auth/register") {
        router.push("/auth/login");
      }
    }
  }, [mounted, isAuthenticated, pathname, router]);

  // To prevent Next.js build errors (PageNotFoundError), we must always render children during SSR
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  // If not authenticated and trying to access a protected route, render hidden children while redirecting
  if (!isAuthenticated && pathname !== "/auth/login" && pathname !== "/auth/register") {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <>{children}</>;
}
