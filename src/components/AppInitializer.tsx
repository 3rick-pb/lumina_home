"use client";

import { useEffect } from "react";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";

export function AppInitializer() {
  const fetchProducts = useCatalogStore((state) => state.fetchProducts);
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  useEffect(() => {
    fetchProducts();
    initializeAuth();
  }, [fetchProducts, initializeAuth]);

  return null;
}
