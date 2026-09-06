"use client";

import { useEffect } from "react";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore } from "@/lib/userStore";
import { supabase } from "@/lib/supabase";

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

  // Presence Tracking
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('radar:clients');
    
    // Generate pseudo-coordinates around South America (Ecuador focused)
    const x = 45 + Math.random() * 20;
    const y = 20 + Math.random() * 15;
    
    const purchasesCount = orders?.length || 0;
    const totalSpent = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;

    channel
      .on('presence', { event: 'sync' }, () => {
        // Handle sync if needed
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: user.name,
            email: user.email,
            city: address?.city || 'Conectado',
            country: address?.country || 'Local',
            x: x,
            y: y,
            frequency: purchasesCount > 3 ? 'Frecuente' : 'Nuevo',
            purchasesCount: purchasesCount,
            totalSpent: totalSpent,
            currentSection: 'Explorando Tienda',
            intentScore: 85,
            device: 'Navegador',
            hasCart: true,
            cartItemsCount: 1,
            onlineAt: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, address, orders]);

  return null;
}
