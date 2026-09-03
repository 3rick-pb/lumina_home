import { create } from 'zustand';
import { Product } from './data';

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
  
  initCartForUser: (userId: string | null, mergeGuest?: boolean) => void;
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

const getStorageKey = (userId: string | null) => {
  return userId ? `lumina_cart_${userId}` : `lumina_cart_guest`;
};

const loadCartData = (userId: string | null): CartStoragePayload => {
  if (typeof window === 'undefined') {
    return { items: [], couponCode: null, discountPercent: 0, isFreeShippingCoupon: false };
  }
  try {
    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (!saved) return { items: [], couponCode: null, discountPercent: 0, isFreeShippingCoupon: false };
    const parsed = JSON.parse(saved);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      couponCode: parsed.couponCode || null,
      discountPercent: typeof parsed.discountPercent === 'number' ? parsed.discountPercent : 0,
      isFreeShippingCoupon: !!parsed.isFreeShippingCoupon,
    };
  } catch {
    return { items: [], couponCode: null, discountPercent: 0, isFreeShippingCoupon: false };
  }
};

const saveCartData = (userId: string | null, data: CartStoragePayload) => {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving cart to storage:", e);
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
  
  initCartForUser: (newUserId: string | null, mergeGuest = false) => {
    if (typeof window !== 'undefined') {
      // Purge legacy shared storage key so it never leaks
      try {
        localStorage.removeItem('lumina-cart-storage');
      } catch {}
    }

    const prevUserId = get().currentUserId;
    
    // Save current active cart to previous user before switching
    if (prevUserId !== newUserId && get().items.length > 0) {
      saveCartData(prevUserId, {
        items: get().items,
        couponCode: get().couponCode,
        discountPercent: get().discountPercent,
        isFreeShippingCoupon: get().isFreeShippingCoupon,
      });
    }

    // If a guest added items and is now logging in, optionally merge guest items into the user's cart
    let guestItems: CartItem[] = [];
    if (mergeGuest && !prevUserId && newUserId) {
      const guestData = loadCartData(null);
      guestItems = guestData.items;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('lumina_cart_guest');
        } catch {}
      }
    }

    // Load target user's private cart
    const userData = loadCartData(newUserId);
    const finalItems = [...userData.items];

    if (guestItems.length > 0) {
      for (const gItem of guestItems) {
        const existingIdx = finalItems.findIndex(i => i.id === gItem.id);
        if (existingIdx >= 0) {
          finalItems[existingIdx] = {
            ...finalItems[existingIdx],
            quantity: finalItems[existingIdx].quantity + gItem.quantity,
          };
        } else {
          finalItems.push(gItem);
        }
      }
    }

    const payload: CartStoragePayload = {
      items: finalItems,
      couponCode: userData.couponCode,
      discountPercent: userData.discountPercent,
      isFreeShippingCoupon: userData.isFreeShippingCoupon,
    };

    saveCartData(newUserId, payload);

    set({
      currentUserId: newUserId,
      items: payload.items,
      couponCode: payload.couponCode,
      discountPercent: payload.discountPercent,
      isFreeShippingCoupon: payload.isFreeShippingCoupon,
      isOpen: false, // Ensure cart modal is closed upon account switch
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
    saveCartData(currentUserId, payload);

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
    saveCartData(currentUserId, payload);
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
    saveCartData(currentUserId, payload);
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
    saveCartData(currentUserId, payload);
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
    saveCartData(currentUserId, payload);

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
    saveCartData(currentUserId, payload);
    set({ couponCode: null, discountPercent: 0, isFreeShippingCoupon: false });
  },
}));
