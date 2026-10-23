"use client";

import React, { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/lib/userStore";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoadingScreen } from "@/components/ui/BrandLoadingScreen";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAuthInitialized } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // Failsafe: si isLoading no se resetea en 6s, forzamos salida del loader.
  // Previene que un error silenciado en userStore deje la pantalla congelada indefinidamente.
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isStrictProtected = pathname?.startsWith("/profile") || pathname?.startsWith("/admin");
  // IMPORTANT: /auth/callback must NOT be considered an "auth page" for redirect purposes.
  // Only /auth/login and /auth/register should be redirected when already authenticated.
  const isAuthLoginOrRegister =
    pathname === "/auth/login" || pathname === "/auth/register";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Failsafe timer: si isLoading se queda en true por más de 6s en rutas protegidas,
  // lo tratamos como resuelto para que el usuario no quede atrapado en el loading screen.
  useEffect(() => {
    if (!isStrictProtected) return;
    if (!isLoading || !mounted) {
      setLoadingTimedOut(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      return;
    }
    // Iniciar watchdog de 6 segundos
    loadingTimerRef.current = setTimeout(() => {
      setLoadingTimedOut(true);
      // Resetear isLoading en el store para desbloquear el guard
      useUserStore.setState({ isLoading: false });
    }, 6000);

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [isLoading, isStrictProtected, mounted]);

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

  // For strict protected routes (/profile, /admin), render canonical brand loader until session is verified.
  // loadingTimedOut es el failsafe: si el loader lleva más de 6s, dejamos pasar para evitar congelamiento.
  const isEffectivelyLoading = isLoading && !loadingTimedOut;
  if (isStrictProtected && (!mounted || !isAuthInitialized || isEffectivelyLoading || !isAuthenticated)) {
    return <BrandLoadingScreen isFixed={true} />;
  }

  // CRITICAL FIX: Do NOT use key={pathname} here.
  // key={pathname} causes React to unmount+remount all children on every route change,
  // which cancels in-flight click events and causes buttons to require two clicks.
  return <>{children}</>;
}
