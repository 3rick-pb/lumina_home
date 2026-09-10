import { create } from 'zustand';
import { Product } from './data';
import { supabase } from './supabase';

export interface CartBundleProduct {
  id: string;
  title: string;
  category?: string;
  imageUrl: string;
  price: number;
  color?: string;
  size?: string;
}

export interface CartItem {
  id: string; // Unique cart item ID (product.id + color + size or bundle-id)
  productId: string;
  product: Product;
  quantity: number;
  color?: string;
  size?: string;

  // Bundle / Combo fields
  isBundle?: boolean;
  bundleName?: string;
  bundleBadge?: string;
  bundleDiscountPercent?: number;
  bundleCustomPrice?: number;
  bundleProducts?: CartBundleProduct[];
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
  addBundle: (bundle: {
    bundleName: string;
    bundleBadge?: string;
    bundleDiscountPercent?: number;
    bundleCustomPrice: number;
    products: Array<{ product: Product; color?: string; size?: string }>;
  }) => void;
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
    // 1. Persist directly to user_carts table in Supabase
    const { error } = await supabase.from('user_carts').upsert({
      user_id: userId,
      items: payload.items,
      coupon_code: payload.couponCode,
      discount_percent: payload.discountPercent,
      is_free_shipping: payload.isFreeShippingCoupon,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn("Could not sync cart to user_carts table:", error.message);
    }
  } catch (e) {
    console.error("Error syncing cart to database:", e);
  }
};

const getGuestCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('lumina_guest_cart');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const setGuestCartItems = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    if (items.length > 0) {
      sessionStorage.setItem('lumina_guest_cart', JSON.stringify(items));
    } else {
      sessionStorage.removeItem('lumina_guest_cart');
    }
  } catch {}
};

// Triggers real-time alert exclusively for registered customers in the store
const triggerRegisteredUserAlert = (product: Product, quantity: number) => {
  if (typeof window === 'undefined') return;
  try {
    import('./userStore').then(({ useUserStore }) => {
      const { user, isAuthenticated, address, addresses } = useUserStore.getState();
      if (isAuthenticated && user && !user.id.startsWith('anon_')) {
        const userLoc = address?.city 
          ? `${address.city}${address.country ? `, ${address.country}` : ''}`
          : addresses?.[0]?.city
          ? `${addresses[0].city}${addresses[0].country ? `, ${addresses[0].country}` : ''}`
          : 'Ecuador';

        import('./adminAlertStore').then(({ broadcastCartAddition }) => {
          broadcastCartAddition({
            userId: user.id,
            userName: user.name || user.email.split('@')[0],
            userEmail: user.email,
            location: userLoc,
            product: {
              id: product.id,
              title: product.title,
              price: product.price,
              imageUrl: product.imageUrl,
              quantity,
            },
            timestamp: Date.now(),
          });
        }).catch(() => {});
      }
    }).catch(() => {});
  } catch {}
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
    if (!newUserId) {
      // Guest or unauthenticated: restore items from active guest session
      const guestItems = getGuestCartItems();
      set({
        currentUserId: null,
        items: guestItems,
        couponCode: null,
        discountPercent: 0,
        isFreeShippingCoupon: false,
        isOpen: false,
      });
      return;
    }

    // Authenticated / registered customer!
    // Retrieve any guest items that were added prior to login/registration
    const currentMemoryItems = get().items;
    const guestStoredItems = getGuestCartItems();
    const preLoginGuestItems = currentMemoryItems.length > 0 ? currentMemoryItems : guestStoredItems;

    let items: CartItem[] = [];
    let couponCode: string | null = null;
    let discountPercent = 0;
    let isFreeShippingCoupon = false;

    try {
      // 1. Fetch from Supabase user_carts table (single source of truth)
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
      }
    } catch (e) {
      console.error("Error loading cart from database:", e);
    }

    // Merge pre-login guest items with user's permanent account cart
    if (preLoginGuestItems.length > 0) {
      const mergedMap = new Map<string, CartItem>();
      for (const it of items) {
        mergedMap.set(it.id, { ...it });
      }
      for (const git of preLoginGuestItems) {
        if (mergedMap.has(git.id)) {
          const existing = mergedMap.get(git.id)!;
          mergedMap.set(git.id, {
            ...existing,
            quantity: existing.quantity + git.quantity,
          });
        } else {
          mergedMap.set(git.id, { ...git });
        }
      }
      items = Array.from(mergedMap.values());

      // Sync merged cart to Supabase for this user
      const payload: CartStoragePayload = {
        items,
        couponCode,
        discountPercent,
        isFreeShippingCoupon,
      };
      await syncCartToDatabase(newUserId, payload);

      // Clean up temporary guest storage
      setGuestCartItems([]);
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

    if (currentUserId) {
      syncCartToDatabase(currentUserId, payload);
    } else {
      setGuestCartItems(newItems);
    }

    // Trigger real-time alert for registered customers
    triggerRegisteredUserAlert(product, quantity);

    set({ items: newItems, isOpen: true });
  },

  addBundle: (bundle) => {
    const currentUserId = get().currentUserId;
    const bundleKey = `${bundle.bundleName}-${bundle.products.map(p => `${p.product.id}_${p.color || ''}_${p.size || ''}`).join('-')}`;
    const cartItemId = `bundle-${bundleKey}`;
    const existingItem = get().items.find((item) => item.id === cartItemId);

    const bundleProducts: CartBundleProduct[] = bundle.products.map(p => ({
      id: p.product.id,
      title: p.product.title,
      category: p.product.category,
      imageUrl: p.product.imageUrl,
      price: p.product.price,
      color: p.color,
      size: p.size,
    }));

    const mainProd = bundle.products[0]?.product;

    let newItems: CartItem[];
    if (existingItem) {
      newItems = get().items.map((item) =>
        item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [
        ...get().items,
        {
          id: cartItemId,
          productId: mainProd?.id || 'bundle',
          product: mainProd,
          quantity: 1,
          isBundle: true,
          bundleName: bundle.bundleName,
          bundleBadge: bundle.bundleBadge,
          bundleDiscountPercent: bundle.bundleDiscountPercent,
          bundleCustomPrice: bundle.bundleCustomPrice,
          bundleProducts,
        },
      ];
    }

    const payload: CartStoragePayload = {
      items: newItems,
      couponCode: get().couponCode,
      discountPercent: get().discountPercent,
      isFreeShippingCoupon: get().isFreeShippingCoupon,
    };

    if (currentUserId) {
      syncCartToDatabase(currentUserId, payload);
    } else {
      setGuestCartItems(newItems);
    }

    if (mainProd) {
      triggerRegisteredUserAlert(mainProd, 1);
    }

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

    if (currentUserId) {
      syncCartToDatabase(currentUserId, payload);
    } else {
      setGuestCartItems(newItems);
    }

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

    if (currentUserId) {
      syncCartToDatabase(currentUserId, payload);
    } else {
      setGuestCartItems(newItems);
    }

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

    if (currentUserId) {
      syncCartToDatabase(currentUserId, payload);
    } else {
      setGuestCartItems([]);
    }

    set({ items: [], couponCode: null, discountPercent: 0, isFreeShippingCoupon: false });
  },
  
  setIsOpen: (isOpen) => set({ isOpen }),
  
  setOriginCoords: (coords) => set({ originCoords: coords }),

  toggleCart: (coords) => set((state) => ({ 
    isOpen: !state.isOpen,
    originCoords: coords !== undefined ? coords : state.originCoords 
  })),
  
  getTotalItems: () => {
    return get().items.reduce((total, item) => {
      if (item.isBundle && item.bundleProducts) {
        return total + (item.bundleProducts.length * item.quantity);
      }
      return total + item.quantity;
    }, 0);
  },
  
  getSubtotal: () => {
    return get().items.reduce((total, item) => {
      const itemPrice = (item.isBundle && item.bundleCustomPrice !== undefined)
        ? item.bundleCustomPrice
        : item.product.price;
      return total + (itemPrice * item.quantity);
    }, 0);
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
