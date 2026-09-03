"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/userStore";
import Link from "next/link";
import { LayoutDashboard, Package, Users, Settings, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useUserStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (isMounted) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        router.push("/");
      }
    }
  }, [isAuthenticated, user, isMounted, router]);

  if (!isMounted || !isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex pt-24">
      {/* Sidebar Admin */}
      <aside className="w-64 fixed top-24 bottom-0 left-0 bg-white border-r border-gray-200 z-10 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">DASHBOARD</p>
          <h2 className="text-lg font-bold text-gray-900">Propietario</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium">
            <LayoutDashboard className="w-5 h-5" /> Vista General
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
            <Package className="w-5 h-5" /> Productos
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
            <Users className="w-5 h-5" /> Clientes
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
            <Settings className="w-5 h-5" /> Configuración
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => { logout(); router.push("/"); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Salir de Admin
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8c9276] rounded-full blur-[150px] opacity-10 pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
