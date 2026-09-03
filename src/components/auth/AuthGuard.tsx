"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isProtected = pathname?.startsWith("/profile") || pathname?.startsWith("/admin");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect to login if the user is trying to access a private dashboard without authentication
    if (mounted && !isLoading && !isAuthenticated && isProtected) {
      router.push("/auth/login");
    }
  }, [mounted, isLoading, isAuthenticated, isProtected, router]);

  // To prevent Next.js build errors (PageNotFoundError), always render children during SSR
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  // If trying to access a protected dashboard route while unauthenticated, hide until redirect occurs
  if (!isLoading && !isAuthenticated && isProtected) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <>{children}</>;
}
