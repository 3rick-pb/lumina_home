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
  } else if (pathname === "/profile") {
    currentSection = "Mi Perfil / Pedidos";
  } else if (pathname === "/admin") {
    currentSection = "Panel Administrativo";
  } else if (pathname === "/auth/login") {
    currentSection = "Iniciando Sesión";
  } else if (pathname === "/auth/register") {
    currentSection = "Registrando Cuenta";
  } else if (pathname === "/") {
    currentSection = "Inicio • Lumina Home";
  } else {
    currentSection = "Explorando Tienda";
  }

  // Presence Tracking & Live Activity Updates
  useEffect(() => {
    // Detect authenticated user or assign a stable anonymous visitor session
    let activeUser = user;
    if (!activeUser?.id && typeof window !== 'undefined') {
      let guestId = sessionStorage.getItem('lumina_guest_id');
      if (!guestId) {
        guestId = 'vis_' + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('lumina_guest_id', guestId);
      }
      activeUser = {
        id: guestId,
        name: 'Visitante en Tienda',
        email: '',
        role: 'USER' as const,
      };
    }

    if (!activeUser?.id) return;

    const purchasesCount = orders?.length || 0;
    const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
    const userCity = address?.city || (activeUser.id.startsWith('vis_') ? "Guayaquil" : "Quito");
    const cartItemsCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const hasCart = isCartOpen || cartItemsCount > 0;

    // Track on channel & Database immediately on navigation/state change
    useRadarStore.getState().initRadar(
      activeUser,
      userCity,
      totalSpent,
      purchasesCount,
      currentSection,
      hasCart,
      cartItemsCount
    );

    useRadarStore.getState().trackActivity(
      activeUser,
      userCity,
      totalSpent,
      purchasesCount,
      currentSection,
      hasCart,
      cartItemsCount
    );
  }, [user, address, orders, pathname, searchParams, isCartOpen, cartItems, currentSection]);

  // Fast 1.5-second heartbeat to refresh DB activity and maintain instant real-time live radar
  useEffect(() => {
    let activeUser = user;
    if (!activeUser?.id && typeof window !== 'undefined') {
      const guestId = sessionStorage.getItem('lumina_guest_id');
      if (guestId) {
        activeUser = {
          id: guestId,
          name: 'Visitante en Tienda',
          email: '',
          role: 'USER' as const,
        };
      }
    }

    if (!activeUser?.id) return;

    const interval = setInterval(() => {
      const purchasesCount = orders?.length || 0;
      const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
      const userCity = address?.city || (activeUser.id.startsWith('vis_') ? "Guayaquil" : "Quito");
      const cartItemsCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const hasCart = isCartOpen || cartItemsCount > 0;

      useRadarStore.getState().trackActivity(
        activeUser,
        userCity,
        totalSpent,
        purchasesCount,
        currentSection,
        hasCart,
        cartItemsCount
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [user, address, orders, isCartOpen, cartItems, currentSection]);

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
