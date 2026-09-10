"use client";

import React from "react";
import dynamic from 'next/dynamic';
import { useUserStore } from "@/lib/userStore";
import { useCatalogStore } from "@/lib/catalogStore";

const AnalyticsRadarView = dynamic(() => import('@/components/profile/AnalyticsRadarView'), {
  loading: () => (
    <div className="h-[720px] w-full bg-[#181d1b] rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl dark:shadow-none animate-pulse text-white/50 dark:text-gray-900/50 font-mono text-xs tracking-widest uppercase">
      Inicializando Radar Lumina...
    </div>
  ),
  ssr: false
});

class RadarErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("Radar view caught an error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[660px] rounded-[2.5rem] bg-[#181d1b] border border-white/10 flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="w-12 h-12 rounded-full border-2 border-[#ccff00]/40 border-t-[#ccff00] animate-spin mb-4" />
          <h3 className="text-lg font-bold">Conectando con el Radar en Vivo...</h3>
          <p className="text-xs text-white/60 max-w-sm mt-2">
            Sincronizando coordenadas y telemetría de clientes en tiempo real con Supabase.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-5 px-6 py-2.5 rounded-full bg-[#ccff00] text-gray-950 font-bold text-xs hover:scale-105 transition-all cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.3)]"
          >
            Reconectar Radar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AnalyticsTabProps {
  onNavigateToAddresses: () => void;
}

export function AnalyticsTab({ onNavigateToAddresses }: AnalyticsTabProps) {
  const { user, addresses, orders } = useUserStore();
  const { products, categories } = useCatalogStore();

  if (!user) return null;

  return (
    <RadarErrorBoundary>
      <AnalyticsRadarView 
        user={user}
        addresses={addresses}
        orders={orders}
        products={products}
        categories={categories}
        onNavigateToAddresses={onNavigateToAddresses}
      />
    </RadarErrorBoundary>
  );
}
