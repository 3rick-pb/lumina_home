"use client";

import { useEffect, Suspense } from "react";
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

  // Compute readable user location/activity
  let currentSection = "Explorando Tienda";

  if (isCartOpen) {
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    currentSection = count > 0 ? `Revisando Carrito (${count} prod.)` : "Carrito (Vacío)";
  } else if (pathname === "/shop") {
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    if (category) {
      currentSection = `Catálogo: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    } else if (search) {
      currentSection = `Buscando: ${search.slice(0, 20)}`;
    } else {
      currentSection = "Catálogo General";
    }
  } else if (pathname.startsWith("/product/")) {
    currentSection = "Viendo Producto";
  } else if (pathname === "/profile" || pathname === "/admin") {
    currentSection = user?.role === 'ADMIN' ? "Mi Perfil / Mapa" : "Mi Perfil / Pedidos";
  } else if (pathname.startsWith("/auth/")) {
    // Stop tracking when navigating to login/register
    currentSection = "";
  } else if (pathname === "/") {
    currentSection = "Inicio • Lumina Home";
  } else {
    currentSection = "Explorando Tienda";
  }

  // Disconnect radar presence immediately when closing web or tab
  useEffect(() => {
    const handleClose = () => {
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
  }, []);

  // Presence Tracking & Live Activity Updates (Real Authenticated Users Only)
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

    const purchasesCount = orders?.length || 0;
    const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
    const userCity = address?.city || addresses?.[0]?.city || "";
    const cartItemsCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const hasCart = isCartOpen || cartItemsCount > 0;

    // Track on channel & Database immediately on navigation/state change
    useRadarStore.getState().initRadar(
      user,
      userCity,
      totalSpent,
      purchasesCount,
      currentSection,
      hasCart,
      cartItemsCount
    );

    useRadarStore.getState().trackActivity(
      user,
      userCity,
      totalSpent,
      purchasesCount,
      currentSection,
      hasCart,
      cartItemsCount
    );
  }, [user, address, addresses, orders, pathname, searchParams, isCartOpen, cartItems, currentSection]);

  // Fast 1.5-second heartbeat to refresh DB activity and maintain instant real-time live radar for the active user
  useEffect(() => {
    if (pathname.startsWith("/auth/") || !currentSection) return;
    if (!user || !user.id || user.id.startsWith('vis_') || user.id.startsWith('guest_')) return;

    const interval = setInterval(() => {
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

      useRadarStore.getState().trackActivity(
        currentUser,
        userCity,
        totalSpent,
        purchasesCount,
        currentSection,
        hasCart,
        cartItemsCount
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [user, address, addresses, orders, pathname, isCartOpen, cartItems, currentSection]);

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
