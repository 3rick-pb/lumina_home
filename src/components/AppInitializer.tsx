"use client";

import { useEffect, Suspense, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { useRadarStore } from "@/lib/radarStore";
import { useCartStore } from "@/lib/store";

function ActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  const address = useUserStore((state) => state.address);
  const addresses = useUserStore((state) => state.addresses);
  const orders = useUserStore((state) => state.orders);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const cartItems = useCartStore((state) => state.items);
  const products = useCatalogStore((state) => state.products);

  // Compute readable user location/activity
  let currentSection = "Explorando Tienda";

  if (isCartOpen) {
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    currentSection = count > 0 ? `Revisando Carrito (${count} prod.)` : "Carrito (Vacío)";
  } else if (pathname === "/shop") {
    const category = searchParams?.get("category");
    const search = searchParams?.get("search");
    if (category) {
      currentSection = `Catálogo: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    } else if (search) {
      currentSection = `Buscando: "${search.slice(0, 18)}"`;
    } else {
      currentSection = "Catálogo General";
    }
  } else if (pathname.startsWith("/product/")) {
    const prodId = pathname.replace("/product/", "").split("/")[0].trim();
    const product = products.find(p => String(p.id) === prodId);
    currentSection = product ? `Viendo: ${product.title.slice(0, 22)}` : "Viendo Producto";
  } else if (pathname === "/profile" || pathname === "/admin") {
    if (user?.role === 'ADMIN') {
      currentSection = "Mi Perfil / Mapa";
    } else {
      const tab = searchParams?.get("tab");
      if (tab === "orders") currentSection = "Mi Perfil / Pedidos";
      else if (tab === "cards") currentSection = "Mi Perfil / Tarjetas";
      else if (tab === "favorites") currentSection = "Mi Perfil / Favoritos";
      else if (tab === "settings") currentSection = "Mi Perfil / Ajustes";
      else currentSection = "Mi Perfil / Resumen";
    }
  } else if (pathname === "/checkout") {
    currentSection = "En Proceso de Pago";
  } else if (pathname.startsWith("/auth/")) {
    // Stop tracking when navigating to login/register
    currentSection = "";
  } else if (pathname === "/") {
    currentSection = "Inicio • Lumina Home";
  } else {
    currentSection = "Explorando Tienda";
  }

  const lastInteractionRef = useRef<number>(Date.now());
  const isOnlineRef = useRef<boolean>(true);
  const lastKeepAliveRef = useRef<number>(Date.now());

  // Reports online status to Store, Broadcast & Database
  const reportOnline = useCallback((section?: string) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser?.id || currentUser.id.startsWith('vis_') || currentUser.id.startsWith('guest_')) return;

    const currentOrders = useUserStore.getState().orders;
    const currentAddress = useUserStore.getState().address;
    const currentAddresses = useUserStore.getState().addresses;
    const purchasesCount = currentOrders?.length || 0;
    const totalSpent = currentOrders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
    const userCity = currentAddress?.city || currentAddresses?.[0]?.city || "";
    const currentCartItems = useCartStore.getState().items;
    const currentCartOpen = useCartStore.getState().isOpen;
    const cartItemsCount = currentCartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const hasCart = currentCartOpen || cartItemsCount > 0;
    const targetSection = section || currentSection;

    isOnlineRef.current = true;
    lastKeepAliveRef.current = Date.now();

    useRadarStore.getState().initRadar(
      currentUser,
      userCity,
      totalSpent,
      purchasesCount,
      targetSection,
      hasCart,
      cartItemsCount
    );

    useRadarStore.getState().trackActivity(
      currentUser,
      userCity,
      totalSpent,
      purchasesCount,
      targetSection,
      hasCart,
      cartItemsCount,
      true
    );
  }, [currentSection]);

  // Reports offline status upon 30 seconds of inactivity or tab close
  const reportOffline = useCallback(() => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser?.id || currentUser.id.startsWith('vis_') || currentUser.id.startsWith('guest_')) return;

    isOnlineRef.current = false;
    useRadarStore.getState().trackActivity(
      currentUser,
      '',
      0,
      0,
      '',
      false,
      0,
      false
    );
  }, []);

  // Disconnect immediately on page close / unload
  useEffect(() => {
    const handleClose = () => {
      reportOffline();
      const activeUser = useUserStore.getState().user;
      if (activeUser?.id && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/radar/activity',
          new Blob([JSON.stringify({ id: activeUser.id, isOnline: false })], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleClose);
    window.addEventListener('pagehide', handleClose);
    return () => {
      window.removeEventListener('beforeunload', handleClose);
      window.removeEventListener('pagehide', handleClose);
    };
  }, [reportOffline]);

  // Exploration change: URL, section, or cart navigation constitutes active exploration
  useEffect(() => {
    // Purge legacy guest tokens
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('lumina_guest_id');
        localStorage.removeItem('lumina_guest_id');
      } catch {}
    }

    if (pathname.startsWith("/auth/") || !currentSection) return;
    if (!user || !user.id || user.id.startsWith('vis_') || user.id.startsWith('guest_')) return;

    // Navigation is active exploration: update timestamp and trigger online state
    lastInteractionRef.current = Date.now();
    reportOnline(currentSection);
  }, [user, address, addresses, orders, pathname, searchParams, isCartOpen, cartItems.length, currentSection, reportOnline]);

  // User DOM interaction tracker: clicks, typing, mouse movement, touches, scrolls
  useEffect(() => {
    if (!user || !user.id || user.id.startsWith('vis_') || user.id.startsWith('guest_')) return;

    const handleUserActivity = () => {
      const now = Date.now();
      lastInteractionRef.current = now;

      // If user was offline/inactive, reactivate instantly!
      if (!isOnlineRef.current) {
        reportOnline();
      } else if (now - lastKeepAliveRef.current > 8000) {
        // Active keepalive sent every 8s while interacting to maintain freshness
        reportOnline();
      }
    };

    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          handleUserActivity();
        }, 500);
      }
    };

    window.addEventListener('mousemove', throttledActivity, { passive: true });
    window.addEventListener('scroll', throttledActivity, { passive: true });
    window.addEventListener('mousedown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('click', handleUserActivity, { passive: true });

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      window.removeEventListener('mousemove', throttledActivity);
      window.removeEventListener('scroll', throttledActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [user, reportOnline]);

  // Tab visibility tracker: resume immediately when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        lastInteractionRef.current = Date.now();
        reportOnline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [reportOnline]);

  // 30-Second Inactivity Watchdog: Automatically sets isOnline to false when idle on same section for 30s
  useEffect(() => {
    if (!user || !user.id || user.id.startsWith('vis_') || user.id.startsWith('guest_')) return;

    const watchdogInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastInteractionRef.current;

      if (idleTime >= 30000) {
        if (isOnlineRef.current) {
          reportOffline();
        }
      }
    }, 1000);

    return () => clearInterval(watchdogInterval);
  }, [user, reportOffline]);

  return null;
}

export function AppInitializer() {
  const fetchProducts = useCatalogStore((state) => state.fetchProducts);
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  useEffect(() => {
    fetchProducts();
    initializeAuth();
  }, [fetchProducts, initializeAuth]);

  return (
    <Suspense fallback={null}>
      <ActivityTracker />
    </Suspense>
  );
}
