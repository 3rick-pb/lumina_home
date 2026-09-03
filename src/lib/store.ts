import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './data';

export interface CartItem {
  id: string; // Unique cart item ID (product.id + color + size)
  productId: string;
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;
  discountPercent: number;
  isFreeShippingCoupon: boolean;
  originCoords: { x: number; y: number } | null;
  
  addItem: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: (coords?: { x: number; y: number }) => void;
  setOriginCoords: (coords: { x: number; y: number } | null) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getShipping: () => number;
  getTotal: () => number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: null,
      discountPercent: 0,
      isFreeShippingCoupon: false,
      originCoords: null,
      
      addItem: (product, quantity = 1, color, size) => {
        set((state) => {
          const cartItemId = `${product.id}-${color || 'default'}-${size || 'default'}`;
          const existingItem = state.items.find((item) => item.id === cartItemId);
          
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === cartItemId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isOpen: true, // Auto-open cart when adding items
            };
          }
          
          return {
            items: [
              ...state.items,
              { id: cartItemId, productId: product.id, product, quantity, color, size },
            ],
            isOpen: true,
          };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [], couponCode: null, discountPercent: 0, isFreeShippingCoupon: false }),
      
      setIsOpen: (isOpen) => set({ isOpen }),
      
      setOriginCoords: (coords) => set({ originCoords: coords }),

      toggleCart: (coords) => set((state) => ({ 
        isOpen: !state.isOpen,
        originCoords: coords !== undefined ? coords : state.originCoords 
      })),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const percent = get().discountPercent;
        if (!percent || percent <= 0) return 0;
        return (subtotal * percent) / 100;
      },

      getShipping: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        if (get().isFreeShippingCoupon || subtotal >= 100) return 0;
        return 4.99;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const discount = get().getDiscountAmount();
        const shipping = get().getShipping();
        return Math.max(0, subtotal - discount + shipping);
      },

      applyCoupon: (code: string) => {
        const clean = code.trim().toUpperCase();
        if (clean === 'LUMINA10') {
          set({ couponCode: 'LUMINA10', discountPercent: 10, isFreeShippingCoupon: false });
          return { success: true, message: '¡Cupón LUMINA10 aplicado! 10% de descuento.' };
        }
        if (clean === 'VIP20') {
          set({ couponCode: 'VIP20', discountPercent: 20, isFreeShippingCoupon: false });
          return { success: true, message: '¡Cupón VIP20 aplicado! 20% de descuento exclusivo.' };
        }
        if (clean === 'BIENVENIDO') {
          set({ couponCode: 'BIENVENIDO', discountPercent: 15, isFreeShippingCoupon: false });
          return { success: true, message: '¡Cupón BIENVENIDO aplicado! 15% de descuento.' };
        }
        if (clean === 'ENVIOGRATIS') {
          set({ couponCode: 'ENVIOGRATIS', discountPercent: 0, isFreeShippingCoupon: true });
          return { success: true, message: '¡Cupón de Envío Gratuito aplicado con éxito!' };
        }
        return { success: false, message: 'Código no válido o expirado. Prueba con LUMINA10.' };
      },

      removeCoupon: () => {
        set({ couponCode: null, discountPercent: 0, isFreeShippingCoupon: false });
      },
    }),
    {
      name: 'lumina-cart-storage',
      skipHydration: true,
    }
  )
);
