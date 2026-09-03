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

  if (!mounted) {
    return <div className="min-h-screen bg-[#f8f9fa]" />; // Prevent flicker
  }

  // If not authenticated and trying to access a protected route, render nothing while redirecting
  if (!isAuthenticated && pathname !== "/auth/login" && pathname !== "/auth/register") {
    return <div className="min-h-screen bg-[#f8f9fa]" />;
  }

  return <>{children}</>;
}
