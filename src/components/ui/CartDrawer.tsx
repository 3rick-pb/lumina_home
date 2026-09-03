"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/userStore";
import { Button } from "./Button";

export function CartDrawer() {
  const { isOpen, setIsOpen, items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const { isAuthenticated, addOrder } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Rehydrate store on mount to avoid hydration mismatch
  useEffect(() => {
    useCartStore.persist.rehydrate();
    setIsMounted(true);
  }, []);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsOpen(false);
      router.push("/auth/login");
      return;
    }
    
    // Simulate successful order
    const newOrder = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'Procesando' as const,
      trackingNumber: `LM-${Math.floor(Math.random() * 1000000)}`,
      total: getSubtotal(),
      items: [...items]
    };
    
    addOrder(newOrder);
    clearCart();
    setIsOpen(false);
    router.push("/profile");
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white/60 backdrop-blur-2xl border-l border-white/60 z-[70] shadow-[0_8px_32px_rgba(0,0,0,0.1)] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/40">
          <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Tu Carrito
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 hide-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium text-gray-900">Tu carrito está vacío</p>
              <p className="text-sm text-gray-600 mt-2">Aún no has añadido ningún producto.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/50 shadow-sm">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/40 shrink-0 border border-white/50">
                  <Image src={item.product.imageUrl} alt={item.product.title} fill className="object-cover" />
                </div>
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 line-clamp-1">{item.product.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.color} {item.size ? `| Talla: ${item.size}` : ''}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center border border-white/60 rounded-full bg-white/40 backdrop-blur-md">
                      <button 
                        className="w-7 h-7 flex items-center justify-center text-gray-700 hover:text-gray-900"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-gray-900">
                        {item.quantity}
                      </span>
                      <button 
                        className="w-7 h-7 flex items-center justify-center text-gray-700 hover:text-gray-900"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-white/40 backdrop-blur-xl border-t border-white/60">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">${getSubtotal().toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-6 text-center">Los gastos de envío e impuestos se calculan al finalizar la compra.</p>
            <Button className="w-full h-14 rounded-xl text-lg shadow-[0_8px_32px_rgba(0,0,0,0.05)]" onClick={handleCheckout}>
              Proceder al pago
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
