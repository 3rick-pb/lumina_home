import { create } from 'zustand';
import { Product } from './data';
import { supabase } from './supabase';
import { playAddToCartSound } from './soundUtils';
import { storeConfig } from '@/config';

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
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

// Helper to push cart payload directly to Supabase cloud database
const syncCartToDatabase = async (userId: string | null, payload: CartStoragePayload) => {
  if (!userId) return;
  try {
    await supabase.from('user_carts').upsert({
      user_id: userId,
      items: payload.items,
      coupon_code: payload.couponCode,
      discount_percent: payload.discountPercent,
      is_free_shipping: payload.isFreeShippingCoupon,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  } catch {}
};

const GUEST_CART_KEY = 'lumina_guest_cart';

const getGuestCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const rawLocal = localStorage.getItem(GUEST_CART_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const rawSession = sessionStorage.getItem(GUEST_CART_KEY);
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
};

const setGuestCartItems = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    if (items.length > 0) {
      const serialized = JSON.stringify(items);
      localStorage.setItem(GUEST_CART_KEY, serialized);
      sessionStorage.setItem(GUEST_CART_KEY, serialized);
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
      sessionStorage.removeItem(GUEST_CART_KEY);
    }
  } catch {}
};

let cartInitPromise: Promise<void> | null = null;
let cartInitTargetUser: string | null = null;

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
  items: typeof window !== 'undefined' ? getGuestCartItems() : [],
  isOpen: false,
  couponCode: null,
  discountPercent: 0,
  isFreeShippingCoupon: false,
  originCoords: null,
  
  initCartForUser: async (newUserId: string | null) => {
    if (!newUserId) {
      const wasAuthenticatedUser = get().currentUserId !== null;
      if (wasAuthenticatedUser) {
        // Explicit logout from an authenticated account: clear memory and guest storage
        setGuestCartItems([]);
        set({
          currentUserId: null,
          items: [],
          couponCode: null,
          discountPercent: 0,
          isFreeShippingCoupon: false,
          isOpen: false,
        });
      } else {
        // Unauthenticated visitor browsing the catalog: preserve and hydrate guest cart
        const guestItems = getGuestCartItems();
        const currentMemoryItems = get().items;
        const activeGuestItems = currentMemoryItems.length > 0 ? currentMemoryItems : guestItems;
        if (activeGuestItems.length > 0) {
          setGuestCartItems(activeGuestItems);
        }
        set({
          currentUserId: null,
          items: activeGuestItems,
        });
      }
      return;
    }

    // Deduplicate concurrent initCartForUser calls for the same user (e.g. onAuthStateChange + login/register)
    if (cartInitPromise && cartInitTargetUser === newUserId) {
      return cartInitPromise;
    }

    cartInitTargetUser = newUserId;
    cartInitPromise = (async () => {
      // Capture any guest items from storage AND from unauthenticated memory BEFORE switching user
      const inMemoryGuestItems = get().currentUserId === null ? [...get().items] : [];
      const storedGuestItems = getGuestCartItems();
      const combinedGuestMap = new Map<string, CartItem>();
      for (const item of storedGuestItems) {
        combinedGuestMap.set(item.id, { ...item });
      }
      for (const item of inMemoryGuestItems) {
        combinedGuestMap.set(item.id, { ...item });
      }
      const preLoginGuestItems = Array.from(combinedGuestMap.values());

      let items: CartItem[] = [];
      let couponCode: string | null = get().couponCode;
      let discountPercent = get().discountPercent;
      let isFreeShippingCoupon = get().isFreeShippingCoupon;

      try {
        // 1. Fetch from Supabase user_carts table (single source of truth for the account)
        const { data: dbCart, error } = await supabase
          .from('user_carts')
          .select('*')
          .eq('user_id', newUserId)
          .maybeSingle();

        if (dbCart && !error) {
          items = Array.isArray(dbCart.items) ? dbCart.items : [];
          couponCode = dbCart.coupon_code || couponCode || null;
          discountPercent = Number(dbCart.discount_percent) || discountPercent || 0;
          isFreeShippingCoupon = !!dbCart.is_free_shipping || isFreeShippingCoupon;
        }
      } catch (e) {
        console.error("Error loading cart from database:", e);
      }

      // 2. Merge guest items captured before login/registration into the user's cart
      if (preLoginGuestItems.length > 0) {
        setGuestCartItems([]);

        const mergedMap = new Map<string, CartItem>();
        for (const it of items) {
          mergedMap.set(it.id, { ...it });
        }
        for (const git of preLoginGuestItems) {
          if (mergedMap.has(git.id)) {
            const existing = mergedMap.get(git.id)!;
            mergedMap.set(git.id, {
              ...existing,
              quantity: Math.max(existing.quantity, git.quantity),
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
      }

      set({
        currentUserId: newUserId,
        items,
        couponCode,
        discountPercent,
        isFreeShippingCoupon,
      });
    })().finally(() => {
      cartInitPromise = null;
      cartInitTargetUser = null;
    });

    return cartInitPromise;
  },

  addItem: (product, quantity = 1, color, size) => {
    const alreadyInBag = get().items.some(
      (item) => !item.isBundle && (item.productId === product.id || item.product?.id === product.id)
    );
    if (alreadyInBag) {
      return;
    }

    // Play signature luxury add-to-cart chime
    playAddToCartSound();

    const currentUserId = get().currentUserId;
    const cartItemId = `${product.id}-${color || 'default'}-${size || 'default'}`;
    const newItems: CartItem[] = [
      ...get().items,
      { id: cartItemId, productId: product.id, product, quantity, color, size },
    ];

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
    // Play signature luxury add-to-cart chime
    playAddToCartSound();

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
    if (get().isFreeShippingCoupon || subtotal >= storeConfig.shipping.freeShippingThreshold) return 0;
    return storeConfig.shipping.standardCost;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    const discount = get().getDiscountAmount();
    const shipping = get().getShipping();
    return Math.max(0, subtotal - discount + shipping);
  },

  applyCoupon: async (code: string) => {
    const clean = code.trim().toUpperCase();
    const currentUserId = get().currentUserId;
    const subtotal = get().getSubtotal();
    let codeName: string | null = null;
    let discount = 0;
    let freeShipping = false;
    let message = "";

    // 1. Query public.coupons table in Supabase
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('code, discount_percent, is_free_shipping, min_order_amount, is_active')
        .eq('code', clean)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        if (data.min_order_amount && subtotal < Number(data.min_order_amount)) {
          return {
            success: false,
            message: `Este cupón requiere un pedido mínimo de $${Number(data.min_order_amount).toFixed(2)}.`
          };
        }
        codeName = data.code;
        discount = Number(data.discount_percent) || 0;
        freeShipping = Boolean(data.is_free_shipping);
        message = discount > 0 
          ? `¡Cupón ${data.code} aplicado! ${discount}% de descuento.`
          : `¡Cupón ${data.code} aplicado con éxito!`;
      }
    } catch (e) {
      console.warn("Could not query coupons from Supabase:", e);
    }

    // 2. Fallback to predefined store config coupons if offline or table not yet migrated
    if (!codeName) {
      const fallback = storeConfig.defaultCoupons.find(c => c.code === clean);
      if (fallback) {
        codeName = clean;
        discount = fallback.discountPercent;
        freeShipping = fallback.isFreeShipping;
        message = fallback.message;
      } else {
        const primaryCoupon = storeConfig.defaultCoupons[0]?.code || "LUMINA10";
        return { success: false, message: `Código no válido o expirado. Prueba con ${primaryCoupon}.` };
      }
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
