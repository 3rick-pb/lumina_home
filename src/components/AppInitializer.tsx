"use client";

import { useEffect, Suspense, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { useRadarStore } from "@/lib/radarStore";
import { useCartStore } from "@/lib/store";

function getOrCreateSessionId(userId: string): string {
  if (typeof window === 'undefined') return `sess_${userId}_init`;
  try {
    const key = `lumina_radar_sess_${userId}`;
    let sId = sessionStorage.getItem(key);
    if (!sId) {
      sId = `sess_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(key, sId);
    }
    return sId;
  } catch {
    return `sess_${userId}_${Date.now()}`;
  }
}

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
    currentSection = "";
  } else if (pathname === "/") {
    currentSection = "Inicio • Lumina Home";
  } else {
    currentSection = "Explorando Tienda";
  }

  const lastKeepAliveRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>("");

  // Initialize or retrieve sessionId for this tab
  useEffect(() => {
    if (user?.id && !user.id.startsWith('vis_') && !user.id.startsWith('guest_')) {
      sessionIdRef.current = getOrCreateSessionId(user.id);
    } else {
      sessionIdRef.current = "";
    }
  }, [user?.id]);

  // Sends active presence heartbeat
  const sendHeartbeat = useCallback((sectionOverride?: string) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser?.id || currentUser.id.startsWith('vis_') || currentUser.id.startsWith('guest_')) return;

    const sId = sessionIdRef.current || getOrCreateSessionId(currentUser.id);
    sessionIdRef.current = sId;

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
    const targetSection = sectionOverride || currentSection;

    lastKeepAliveRef.current = Date.now();

    useRadarStore.getState().trackActivity(
      currentUser,
      userCity,
      totalSpent,
      purchasesCount,
      targetSection,
      hasCart,
      cartItemsCount,
      true,
      sId,
      false
    );
  }, [currentSection]);

  // Tab Close / Unload: Report close for this specific tab session
  useEffect(() => {
    const handleClose = () => {
      const activeUser = useUserStore.getState().user;
      const sId = sessionIdRef.current;
      if (activeUser?.id && sId) {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/radar/activity',
            new Blob([JSON.stringify({ id: activeUser.id, sessionId: sId, isOnline: false, allSessions: false })], { type: 'application/json' })
          );
        } else {
          fetch('/api/radar/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeUser.id, sessionId: sId, isOnline: false, allSessions: false }),
            keepalive: true,
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleClose);
    window.addEventListener('pagehide', handleClose);
    return () => {
      window.removeEventListener('beforeunload', handleClose);
      window.removeEventListener('pagehide', handleClose);
    };
  }, []);

  // Exploration Navigation Tracker: immediately dispatches section change
  const lastNavDispatchRef = useRef<number>(0);
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

    const now = Date.now();
    // Immediate dispatch on navigation, throttled to 2.5s for hyper-fast consecutive clicks
    if (now - lastNavDispatchRef.current > 2500) {
      lastNavDispatchRef.current = now;
      sendHeartbeat(currentSection);
    } else {
      const timeout = setTimeout(() => {
        lastNavDispatchRef.current = Date.now();
        sendHeartbeat(currentSection);
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [user, address, addresses, orders, pathname, searchParams, isCartOpen, cartItems.length, currentSection, sendHeartbeat]);

  // Periodic Heartbeat: Dispatches a keepalive every 25 seconds while tab is open
  useEffect(() => {
    if (!user || !user.id || user.id.startsWith('vis_') || user.id.startsWith('guest_')) return;

    // Send initial heartbeat upon login/load
    sendHeartbeat();

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 25000); // 25s regular heartbeat

    return () => clearInterval(heartbeatInterval);
  }, [user, sendHeartbeat]);

  // User Interaction detector: If user interacts after 15s since last heartbeat, trigger keepalive
  useEffect(() => {
    if (!user || !user.id || user.id.startsWith('vis_') || user.id.startsWith('guest_')) return;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastKeepAliveRef.current > 15000) {
        sendHeartbeat();
      }
    };

    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          handleUserActivity();
        }, 1000);
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
  }, [user, sendHeartbeat]);

  // Tab Visibility Tracker: Wake up and send instant heartbeat when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sendHeartbeat]);

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
