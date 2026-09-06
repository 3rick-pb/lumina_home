"use client";

import { useEffect } from "react";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { useRadarStore } from "@/lib/radarStore";

export function AppInitializer() {
  const fetchProducts = useCatalogStore((state) => state.fetchProducts);
  const initializeAuth = useUserStore((state) => state.initializeAuth);
  const user = useUserStore((state) => state.user);
  const address = useUserStore((state) => state.address);
  const orders = useUserStore((state) => state.orders);

  useEffect(() => {
    fetchProducts();
    initializeAuth();
  }, [fetchProducts, initializeAuth]);

  // Presence Tracking via Centralized Radar Store
  useEffect(() => {
    if (!user) return;

    const purchasesCount = orders?.length || 0;
    const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
    const userCity = address?.city || 'Quito';

    useRadarStore.getState().initRadar(
      user,
      userCity,
      totalSpent,
      purchasesCount,
      'Explorando Tienda'
    );
  }, [user, address, orders]);

  return null;
}
