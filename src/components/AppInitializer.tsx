"use client";

import { useEffect, Suspense, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { useRadarStore } from "@/lib/radarStore";
import { useCartStore } from "@/lib/store";

function getOrCreateSessionId(userId?: string): string {
  if (typeof window === "undefined") return `sess_${userId || "anon"}_init`;
  try {
    const key = userId ? `lumina_radar_sess_${userId}` : "lumina_radar_anon_sess";
    let sId = sessionStorage.getItem(key);
    if (!sId) {
      sId = `sess_${userId ? `${userId}_` : "anon_"}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(key, sId);
    }
    return sId;
  } catch {
    return `sess_${userId ? `${userId}_` : "anon_"}${Date.now()}`;
  }
}

function ActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const cartItems = useCartStore((state) => state.items);
  const products = useCatalogStore((state) => state.products);

  // Compute readable user location/activity
  let currentSection = "Explorando Tienda";

  if (pathname.startsWith("/auth/")) {
    currentSection = "";
  } else if (isCartOpen) {
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
    const product = products.find((p) => String(p.id) === prodId);
    currentSection = product ? `Viendo: ${product.title.slice(0, 22)}` : "Viendo Producto";
  } else if (pathname === "/profile" || pathname === "/admin") {
    if (user?.role === "ADMIN") {
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
  } else if (pathname === "/") {
    currentSection = "Inicio • Lumina Home";
  } else {
    currentSection = "Explorando Tienda";
  }

  const sessionIdRef = useRef<string>("");

  // Sends active presence heartbeat via pure Supabase Realtime Presence
  const sendHeartbeat = useCallback((sectionOverride?: string) => {
    if (pathname.startsWith("/auth/")) return;

    const currentUser = useUserStore.getState().user;
    const sId = sessionIdRef.current || getOrCreateSessionId(currentUser?.id);
    sessionIdRef.current = sId;

    const targetSection = sectionOverride || currentSection;
    if (!targetSection) return;

    const currentCartItems = useCartStore.getState().items;
    const currentCartOpen = useCartStore.getState().isOpen;
    const cartItemsCount = currentCartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const hasCart = currentCartOpen || cartItemsCount > 0;

    if (currentUser?.id) {
      // Authenticated User
      const currentOrders = useUserStore.getState().orders;
      const currentAddress = useUserStore.getState().address;
      const currentAddresses = useUserStore.getState().addresses;
      const purchasesCount = currentOrders?.length || 0;
      const totalSpent = currentOrders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
      const userCity = currentAddress?.city || currentAddresses?.[0]?.city || "";

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
    } else {
      // Anonymous Visitor
      useRadarStore.getState().trackActivity(
        null,
        "",
        0,
        0,
        targetSection,
        hasCart,
        cartItemsCount,
        true,
        sId,
        false
      );
    }
  }, [pathname, currentSection]);

  // Connect to real-time radar channel upon mount or user change (excluding /auth/*)
  useEffect(() => {
    if (pathname.startsWith("/auth/")) {
      // Excluded: untrack presence if currently on login/register screens
      const chan = useRadarStore.getState().channel;
      if (chan) {
        chan.untrack().catch(() => {});
      }
      return;
    }

    sessionIdRef.current = getOrCreateSessionId(user?.id);
    useRadarStore.getState().initRadar(user, sessionIdRef.current);
    sendHeartbeat();
  }, [user, pathname, currentSection, sendHeartbeat]);

  // Tab Close / Unload: Report close for this specific tab session cleanly
  useEffect(() => {
    const handleClose = () => {
      const activeUser = useUserStore.getState().user;
      const sId = sessionIdRef.current;
      const clientId = activeUser?.id || `anon_${sId}`;
      const chan = useRadarStore.getState().channel;
      if (chan && sId) {
        try {
          chan.send({
            type: "broadcast",
            event: "offline",
            payload: { id: clientId, sessionId: sId, allSessions: false },
          }).catch(() => {});
          chan.untrack().catch(() => {});
        } catch {}
      }
    };

    window.addEventListener("beforeunload", handleClose);
    window.addEventListener("pagehide", handleClose);
    return () => {
      window.removeEventListener("beforeunload", handleClose);
      window.removeEventListener("pagehide", handleClose);
    };
  }, []);

  // Exploration Navigation Tracker: immediately dispatches section change
  const lastNavDispatchRef = useRef<number>(0);
  useEffect(() => {
    // Purge legacy guest tokens
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("lumina_guest_id");
        localStorage.removeItem("lumina_guest_id");
      } catch {}
    }

    if (pathname.startsWith("/auth/") || !currentSection) return;

    const now = Date.now();
    // Immediate dispatch on navigation, throttled to 1.5s for fast consecutive clicks
    if (now - lastNavDispatchRef.current > 1500) {
      lastNavDispatchRef.current = now;
      sendHeartbeat(currentSection);
    } else {
      const timeout = setTimeout(() => {
        lastNavDispatchRef.current = Date.now();
        sendHeartbeat(currentSection);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [pathname, searchParams, isCartOpen, cartItems.length, currentSection, sendHeartbeat]);

  // Tab Visibility Tracker: Wake up and send instant heartbeat when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
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
