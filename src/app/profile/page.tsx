"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/userStore";
import { Package, Heart, Settings, LogOut, MapPin, CreditCard, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getProduct } from "@/lib/data";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, favorites, orders } = useUserStore();
  const [activeTab, setActiveTab] = useState("orders");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Simple redirect if not authenticated
    if (isMounted && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isMounted, router]);

  if (!isMounted || !isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#f8f9fa] relative">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#8c9276] rounded-full blur-[200px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] sticky top-32">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/60">
                <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold font-display">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{user?.name}</h2>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "orders" ? "bg-white/80 text-gray-900 shadow-sm border border-white/90" : "text-gray-600 hover:bg-white/40 border border-transparent"}`}
                >
                  <Package className="w-4 h-4" /> Mis Pedidos
                </button>
                <button 
                  onClick={() => setActiveTab("favorites")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "favorites" ? "bg-white/80 text-gray-900 shadow-sm border border-white/90" : "text-gray-600 hover:bg-white/40 border border-transparent"}`}
                >
                  <Heart className="w-4 h-4" /> Favoritos
                </button>
                <button 
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "settings" ? "bg-white/80 text-gray-900 shadow-sm border border-white/90" : "text-gray-600 hover:bg-white/40 border border-transparent"}`}
                >
                  <Settings className="w-4 h-4" /> Ajustes
                </button>
              </nav>

              <div className="mt-8 pt-8 border-t border-white/60">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-white/40 border border-transparent transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-[500px]">
            {activeTab === "orders" && (
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] h-full">
                <h3 className="text-2xl font-display italic font-bold text-gray-900 mb-6">Mis Pedidos</h3>
                
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Package className="w-16 h-16 mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900">No tienes pedidos aún</p>
                    <p className="text-sm text-gray-600 mt-2">Tus próximas compras aparecerán aquí para hacerles seguimiento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white/60 backdrop-blur-md border border-white/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Pedido #{order.id}</p>
                          <p className="text-xs text-gray-500 mb-3">{order.date}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">
                              {order.status}
                            </span>
                            <span className="text-xs text-gray-600 font-mono tracking-wider">{order.trackingNumber}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 sm:text-right">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Total</p>
                            <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
                          </div>
                          <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] h-full">
                <h3 className="text-2xl font-display italic font-bold text-gray-900 mb-6">Lista de Deseos</h3>
                
                {favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Heart className="w-16 h-16 mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900">No hay favoritos</p>
                    <p className="text-sm text-gray-600 mt-2">Guarda los productos que te gusten dando clic al corazón.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((favId) => {
                      const prod = getProduct(favId);
                      if (!prod) return null;
                      return (
                        <Link href={`/product/${prod.id}`} key={prod.id} className="group bg-white/60 backdrop-blur-md border border-white/80 p-3 rounded-2xl flex items-center gap-4 hover:bg-white/80 transition-colors">
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <Image src={prod.imageUrl} alt={prod.title} fill className="object-cover" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{prod.title}</h4>
                            <p className="font-bold text-gray-900 mt-1">${prod.price.toFixed(2)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] h-full">
                <h3 className="text-2xl font-display italic font-bold text-gray-900 mb-6">Ajustes de Cuenta</h3>
                
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-md border border-white/80 p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-xl text-gray-600"><MapPin className="w-5 h-5" /></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Dirección de envío</h4>
                        <p className="text-sm text-gray-500">Ninguna dirección guardada</p>
                      </div>
                    </div>
                    <button className="text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-[#8c9276]">Añadir</button>
                  </div>

                  <div className="bg-white/60 backdrop-blur-md border border-white/80 p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-xl text-gray-600"><CreditCard className="w-5 h-5" /></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Métodos de pago</h4>
                        <p className="text-sm text-gray-500">Ninguna tarjeta vinculada</p>
                      </div>
                    </div>
                    <button className="text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-[#8c9276]">Añadir</button>
                  </div>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
