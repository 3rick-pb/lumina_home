import { create } from 'zustand';
import { Product } from './data';
import { supabase } from './supabase';

export interface CartItem {
  id: string; // Unique cart item ID (product.id + color + size)
  productId: string;
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
}

export interface CartStoragePayload {
  items: CartItem[];
  couponCode: string | null;
  discountPercent: number;
  isFreeShippingCoupon: boolean;
}

interface CartState {
  currentUserId: string | null;
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;
  discountPercent: number;
  isFreeShippingCoupon: boolean;
  originCoords: { x: number; y: number } | null;
  
  initCartForUser: (userId: string | null) => Promise<void>;
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

// Helper to push cart payload directly to Supabase cloud database
const syncCartToDatabase = async (userId: string | null, payload: CartStoragePayload) => {
  if (!userId) return;
  try {
    // 1. Persist to user_carts table in Supabase
    const { error } = await supabase.from('user_carts').upsert({
      user_id: userId,
      items: payload.items,
      coupon_code: payload.couponCode,
      discount_percent: payload.discountPercent,
      is_free_shipping: payload.isFreeShippingCoupon,
      updated_at: new Date().toISOString()
    });

    // 2. Also keep user_metadata synced as reliable cloud backup
    if (error) {
      await supabase.auth.updateUser({
        data: { cart: payload }
      });
    }
  } catch (e) {
    console.error("Error syncing cart to database:", e);
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  currentUserId: null,
  items: [],
  isOpen: false,
  couponCode: null,
  discountPercent: 0,
  isFreeShippingCoupon: false,
  originCoords: null,
  
  initCartForUser: async (newUserId: string | null) => {
    // Purge any local computer storage so nothing stays on disk
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('lumina-cart-storage');
        localStorage.removeItem('lumina_cart_guest');
        if (!newUserId) {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('lumina_cart_')) keysToRemove.push(k);
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        }
      } catch {}
    }

    if (!newUserId) {
      // Guest or logged out: completely empty cart in memory, nothing on computer
      set({
        currentUserId: null,
        items: [],
        couponCode: null,
        discountPercent: 0,
        isFreeShippingCoupon: false,
        isOpen: false,
      });
      return;
    }

    let items: CartItem[] = [];
    let couponCode: string | null = null;
    let discountPercent = 0;
    let isFreeShippingCoupon = false;

    try {
      // 1. Fetch from Supabase user_carts table
      const { data: dbCart, error } = await supabase
        .from('user_carts')
        .select('*')
        .eq('user_id', newUserId)
        .maybeSingle();

      if (dbCart && !error) {
        items = Array.isArray(dbCart.items) ? dbCart.items : [];
        couponCode = dbCart.coupon_code || null;
        discountPercent = Number(dbCart.discount_percent) || 0;
        isFreeShippingCoupon = !!dbCart.is_free_shipping;
      } else {
        // 2. Fallback to Supabase auth user_metadata
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.cart) {
          const c = user.user_metadata.cart;
          items = Array.isArray(c.items) ? c.items : [];
          couponCode = c.couponCode || null;
          discountPercent = Number(c.discountPercent) || 0;
          isFreeShippingCoupon = !!c.isFreeShippingCoupon;
        }
      }
    } catch (e) {
      console.error("Error loading cart from database:", e);
    }

    set({
      currentUserId: newUserId,
      items,
      couponCode,
      discountPercent,
      isFreeShippingCoupon,
      isOpen: false,
    });
  },

  addItem: (product, quantity = 1, color, size) => {
    const currentUserId = get().currentUserId;
    const cartItemId = `${product.id}-${color || 'default'}-${size || 'default'}`;
    const existingItem = get().items.find((item) => item.id === cartItemId);
    
    let newItems: CartItem[];
    if (existingItem) {
      newItems = get().items.map((item) =>
        item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newItems = [
        ...get().items,
        { id: cartItemId, productId: product.id, product, quantity, color, size },
      ];
    }

    const payload: CartStoragePayload = {
      items: newItems,
      couponCode: get().couponCode,
      discountPercent: get().discountPercent,
      isFreeShippingCoupon: get().isFreeShippingCoupon,
    };

    // Sync to Supabase cloud database
    syncCartToDatabase(currentUserId, payload);

    set({ items: newItems, isOpen: true });
  },
  
  removeItem: (id) => {
    const currentUserId = get().currentUserId;
    const newItems = get().items.filter((item) => item.id !== id);
    const payload: CartStoragePayload = {
      items: newItems,
      couponCode: get().couponCode,
      discountPercent: get().discountPercent,
      isFreeShippingCoupon: get().isFreeShippingCoupon,
    };

    // Sync to Supabase cloud database
    syncCartToDatabase(currentUserId, payload);

    set({ items: newItems });
  },
  
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    const currentUserId = get().currentUserId;
    const newItems = get().items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
    const payload: CartStoragePayload = {
      items: newItems,
      couponCode: get().couponCode,
      discountPercent: get().discountPercent,
      isFreeShippingCoupon: get().isFreeShippingCoupon,
    };

    // Sync to Supabase cloud database
    syncCartToDatabase(currentUserId, payload);

    set({ items: newItems });
  },
  
  clearCart: () => {
    const currentUserId = get().currentUserId;
    const payload: CartStoragePayload = {
      items: [],
      couponCode: null,
      discountPercent: 0,
      isFreeShippingCoupon: false,
    };

    // Sync empty cart to Supabase cloud database
    syncCartToDatabase(currentUserId, payload);

    set({ items: [], couponCode: null, discountPercent: 0, isFreeShippingCoupon: false });
  },
  
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
    const currentUserId = get().currentUserId;
    let codeName: string | null = null;
    let discount = 0;
    let freeShipping = false;
    let message = "";

    if (clean === 'LUMINA10') {
      codeName = 'LUMINA10';
      discount = 10;
      message = '¡Cupón LUMINA10 aplicado! 10% de descuento.';
    } else if (clean === 'VIP20') {
      codeName = 'VIP20';
      discount = 20;
      message = '¡Cupón VIP20 aplicado! 20% de descuento exclusivo.';
    } else if (clean === 'BIENVENIDO') {
      codeName = 'BIENVENIDO';
      discount = 15;
      message = '¡Cupón BIENVENIDO aplicado! 15% de descuento.';
    } else if (clean === 'ENVIOGRATIS') {
      codeName = 'ENVIOGRATIS';
      freeShipping = true;
      message = '¡Cupón de Envío Gratuito aplicado con éxito!';
    } else {
      return { success: false, message: 'Código no válido o expirado. Prueba con LUMINA10.' };
    }

    const payload: CartStoragePayload = {
      items: get().items,
      couponCode: codeName,
      discountPercent: discount,
      isFreeShippingCoupon: freeShipping,
    };

    // Sync to Supabase cloud database
    syncCartToDatabase(currentUserId, payload);

    set({ couponCode: codeName, discountPercent: discount, isFreeShippingCoupon: freeShipping });
    return { success: true, message };
  },

  removeCoupon: () => {
    const currentUserId = get().currentUserId;
    const payload: CartStoragePayload = {
      items: get().items,
      couponCode: null,
      discountPercent: 0,
      isFreeShippingCoupon: false,
    };

    // Sync to Supabase cloud database
    syncCartToDatabase(currentUserId, payload);

    set({ couponCode: null, discountPercent: 0, isFreeShippingCoupon: false });
  },
}));
