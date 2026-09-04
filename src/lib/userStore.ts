import { create } from 'zustand';
import { supabase } from './supabase';
import { CartItem, useCartStore } from './store';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface Order {
  id: string;
  date: string;
  time?: string;
  createdAt?: string;
  status: 'Procesando' | 'Enviado' | 'Entregado';
  trackingNumber?: string;
  total: number;
  items: CartItem[];
  customerName?: string;
  customerEmail?: string;
  recipient?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  userId?: string;
}

export interface PaymentCard {
  id: string;
  number: string;
  holder: string;
  exp: string;
  type: 'mastercard' | 'visa';
  isDefault?: boolean;
}

export interface ShippingAddress {
  id: string;
  recipient: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  favorites: string[]; // array of product IDs
  orders: Order[];
  cards: PaymentCard[];
  address: ShippingAddress | null;
  addresses: ShippingAddress[];
  
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  
  addCard: (card: Omit<PaymentCard, 'id'>) => void;
  removeCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
  
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  refreshOrders: () => Promise<void>;

  addAddress: (address: Omit<ShippingAddress, 'id'>) => Promise<boolean>;
  removeAddress: (id?: string) => void;
  setDefaultAddress: (id: string) => void;
  setAddress: (address: ShippingAddress | Omit<ShippingAddress, 'id'>) => void;

  updateUserName: (name: string) => Promise<{ error: string | null }>;
  updateUserPassword: (password: string) => Promise<{ error: string | null }>;
}

const fetchUserDataFromDatabase = async (userId: string, role: 'USER' | 'ADMIN' = 'USER', email: string = '') => {
  try {
    const isAdmin = role === 'ADMIN' || email.toLowerCase() === 'admin@lumina.com';

    // 1. Fetch store/user orders from persistent API with instant synchronization
    let orders: Order[] = [];
    try {
      const res = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders)) {
          orders = json.orders;
        }
      }
    } catch (apiErr) {
      console.warn("Could not fetch orders from /api/orders, checking Supabase/metadata fallback", apiErr);
    }

    // Supabase fallback if API returned no orders
    if (orders.length === 0) {
      try {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!isAdmin) {
          query = query.eq('user_id', userId);
        }
        const { data: dbOrders } = await query;
        if (dbOrders && dbOrders.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          orders = dbOrders.map((o: any) => ({
            id: o.id,
            userId: o.user_id,
            customerName: o.customer_name || 'Cliente Lumina',
            customerEmail: o.customer_email || email,
            recipient: o.recipient || '',
            shippingAddress: o.shipping_address,
            paymentMethod: o.payment_method,
            date: o.created_at ? new Date(o.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Reciente',
            time: o.created_at ? new Date(o.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '12:00',
            createdAt: o.created_at,
            status: o.status || 'Procesando',
            trackingNumber: o.tracking_number,
            total: Number(o.total) || 0,
            items: Array.isArray(o.items) ? o.items : [],
          }));
        }
      } catch {}
    }

    // 2. Fetch addresses from Supabase addresses table
    let addresses: ShippingAddress[] = [];
    try {
      const { data: dbAddrs, error: aErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4);

      if (dbAddrs && !aErr && dbAddrs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addresses = dbAddrs.map((dbAddr: any, index: number) => ({
          id: dbAddr.id || `addr-${index}`,
          recipient: dbAddr.recipient || dbAddr.receiver_name || '',
          street: dbAddr.street || '',
          city: dbAddr.city || '',
          state: dbAddr.state || '',
          postalCode: dbAddr.postal_code || '',
          country: dbAddr.country || 'España',
          isDefault: dbAddr.is_default !== undefined ? !!dbAddr.is_default : index === 0,
        }));
      }
    } catch {}

    // 3. Fetch cards from Supabase payment_cards or user_metadata
    let cards: PaymentCard[] = [];
    const { data: dbCards, error: cErr } = await supabase
      .from('payment_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dbCards && !cErr && dbCards.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cards = dbCards.map((c: any) => ({
        id: c.id,
        number: c.number,
        holder: c.holder,
        exp: c.exp,
        type: c.type,
        isDefault: !!c.is_default,
      }));
    } else {
      // Check user_metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.cards) {
        cards = user.user_metadata.cards;
      }
      if (orders.length === 0 && user?.user_metadata?.orders) {
        orders = user.user_metadata.orders;
      }
    }

    // Check user_metadata if addresses was empty
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (addresses.length === 0) {
      if (Array.isArray(currentUser?.user_metadata?.addresses) && currentUser.user_metadata.addresses.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addresses = currentUser.user_metadata.addresses.slice(0, 4).map((a: any, idx: number) => ({
          ...a,
          id: a.id || `addr-meta-${idx}`,
          recipient: a.recipient || currentUser?.user_metadata?.name || '',
          isDefault: a.isDefault !== undefined ? a.isDefault : idx === 0,
        }));
      } else if (currentUser?.user_metadata?.address) {
        const single = currentUser.user_metadata.address;
        addresses = [{
          id: 'addr-default',
          recipient: single.recipient || currentUser?.user_metadata?.name || '',
          street: single.street || '',
          city: single.city || '',
          state: single.state || '',
          postalCode: single.postalCode || '',
          country: single.country || 'España',
          isDefault: true,
        }];
      }
    }

    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || null;

    return { cards, orders, addresses, address: defaultAddr };
  } catch (e) {
    console.error("Error fetching user data from Supabase:", e);
    return { cards: [], orders: [], addresses: [], address: null };
  }
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  favorites: [],
  orders: [],
  cards: [],
  addresses: [],
  address: null,
  
  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email || '';
        const role = (email.toLowerCase() === 'admin@lumina.com' || session.user.user_metadata?.role === 'ADMIN') ? 'ADMIN' : 'USER';
        const name = session.user.user_metadata?.name || email.split('@')[0];
        
        // Fetch all user private data directly from Supabase database and API
        const personalData = await fetchUserDataFromDatabase(session.user.id, role, email);

        set({ 
          user: { id: session.user.id, email, name, role }, 
          isAuthenticated: true,
          cards: personalData.cards,
          orders: personalData.orders,
          addresses: personalData.addresses,
          address: personalData.address
        });

        // Initialize and isolate cart from Supabase cloud database
        await useCartStore.getState().initCartForUser(session.user.id);
        
        // Load favorites from Supabase
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
        if (favs) {
          set({ favorites: favs.map(f => f.product_id) });
        }
      } else {
        await useCartStore.getState().initCartForUser(null);
        set({ user: null, isAuthenticated: false, cards: [], orders: [], addresses: [], address: null, favorites: [] });
      }
    } finally {
      set({ isLoading: false });
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const role = (email.toLowerCase() === 'admin@lumina.com' || session.user.user_metadata?.role === 'ADMIN') ? 'ADMIN' : 'USER';
        const name = session.user.user_metadata?.name || email.split('@')[0];
        const personalData = await fetchUserDataFromDatabase(session.user.id, role, email);

        set({ 
          user: { id: session.user.id, email, name, role }, 
          isAuthenticated: true, 
          isLoading: false,
          cards: personalData.cards,
          orders: personalData.orders,
          addresses: personalData.addresses,
          address: personalData.address
        });

        // Switch active cart strictly to this account from Supabase
        await useCartStore.getState().initCartForUser(session.user.id);

        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
        if (favs) set({ favorites: favs.map(f => f.product_id) });
      } else {
        // Reset and wipe data when signed out
        await useCartStore.getState().initCartForUser(null);
        set({ user: null, isAuthenticated: false, favorites: [], cards: [], orders: [], address: null, isLoading: false });
      }
    });
  },

  login: async (email, password) => {
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (!error && data?.user) {
      const userEmail = data.user.email || cleanEmail;
      const role = (userEmail.toLowerCase() === 'admin@lumina.com' || data.user.user_metadata?.role === 'ADMIN') ? 'ADMIN' : 'USER';
      const name = data.user.user_metadata?.name || userEmail.split('@')[0];
      const personalData = await fetchUserDataFromDatabase(data.user.id, role, userEmail);

      set({ 
        user: { id: data.user.id, email: userEmail, name, role }, 
        isAuthenticated: true,
        cards: personalData.cards,
        orders: personalData.orders,
        addresses: personalData.addresses,
        address: personalData.address
      });

      // Synchronize and load user's private cart from Supabase
      await useCartStore.getState().initCartForUser(data.user.id);

      const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', data.user.id);
      if (favs) set({ favorites: favs.map(f => f.product_id) });
    }
    return { error: error?.message || null };
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    
    // Disconnect and reset cart
    await useCartStore.getState().initCartForUser(null);
    
    // Reset all in-memory user data
    set({ user: null, isAuthenticated: false, favorites: [], cards: [], orders: [], address: null });

    // WIPE ENTIRE LOCAL DATA ON COMPUTER SO NOTHING STAYS BEHIND
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('lumina') || k.startsWith('sb-') || k.includes('cart') || k.includes('user'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch {}
    }
  },
  
  register: async (email, password, name) => {
    const cleanEmail = email.trim();
    const role = cleanEmail.toLowerCase() === 'admin@lumina.com' ? 'ADMIN' : 'USER';
    const { data, error } = await supabase.auth.signUp({ 
      email: cleanEmail, 
      password,
      options: { data: { name, role } } 
    });
    if (!error && data?.user) {
      set({ 
        user: { id: data.user.id, email: cleanEmail, name, role }, 
        isAuthenticated: true,
        cards: [],
        orders: [],
        address: null,
        favorites: []
      });

      // Initialize empty private cart for new user in Supabase
      await useCartStore.getState().initCartForUser(data.user.id);
    }
    return { error: error?.message || null };
  },

  addCard: async (card) => {
    const user = get().user;
    const newCard: PaymentCard = {
      ...card,
      id: Math.random().toString(36).substring(7)
    };
    const nextCards = [newCard, ...get().cards];
    set({ cards: nextCards });

    if (user) {
      try {
        await supabase.from('payment_cards').insert({
          id: newCard.id,
          user_id: user.id,
          number: card.number,
          holder: card.holder,
          exp: card.exp,
          type: card.type,
          is_default: card.isDefault || false,
        });
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { cards: nextCards } });
      } catch {}
    }
  },

  removeCard: async (id) => {
    const user = get().user;
    const nextCards = get().cards.filter(c => c.id !== id);
    set({ cards: nextCards });

    if (user) {
      try {
        await supabase.from('payment_cards').delete().eq('id', id);
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { cards: nextCards } });
      } catch {}
    }
  },

  setDefaultCard: async (id) => {
    const user = get().user;
    const nextCards = get().cards.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    set({ cards: nextCards });

    if (user) {
      try {
        await supabase.from('payment_cards').update({ is_default: false }).eq('user_id', user.id);
        await supabase.from('payment_cards').update({ is_default: true }).eq('id', id);
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { cards: nextCards } });
      } catch {}
    }
  },
  
  toggleFavorite: async (productId) => {
    const { user, favorites } = get();
    if (!user) return;
    
    const isFav = favorites.includes(productId);
    if (isFav) {
      set({ favorites: favorites.filter(id => id !== productId) });
      await supabase.from('favorites').delete().match({ user_id: user.id, product_id: productId });
    } else {
      set({ favorites: [...favorites, productId] });
      await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
    }
  },
  
  isFavorite: (productId) => get().favorites.includes(productId),
  
  addOrder: async (order) => {
    const user = get().user;
    const enrichedOrder: Order = {
      ...order,
      userId: user?.id,
      customerName: order.customerName || user?.name || 'Cliente Lumina',
      customerEmail: order.customerEmail || user?.email || 'cliente@lumina.com',
      time: order.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      createdAt: order.createdAt || new Date().toISOString()
    };
    const nextOrders = [enrichedOrder, ...get().orders];
    set({ orders: nextOrders });

    // 1. Sync via API route for store-wide live persistence
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: enrichedOrder })
      });
    } catch (e) {
      console.warn("Could not sync order to /api/orders", e);
    }

    // 2. Sync to Supabase
    if (user) {
      try {
        await supabase.from('orders').upsert({
          id: enrichedOrder.id,
          user_id: user.id,
          status: enrichedOrder.status,
          total: enrichedOrder.total,
          items: enrichedOrder.items,
          tracking_number: enrichedOrder.trackingNumber,
          customer_name: enrichedOrder.customerName,
          customer_email: enrichedOrder.customerEmail,
          recipient: enrichedOrder.recipient,
          shipping_address: enrichedOrder.shippingAddress,
          payment_method: enrichedOrder.paymentMethod,
          created_at: enrichedOrder.createdAt
        });
      } catch (e) {
        console.warn("Error saving order to Supabase:", e);
      }
      try {
        await supabase.auth.updateUser({ data: { orders: nextOrders } });
      } catch {}
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const user = get().user;
    const nextOrders = get().orders.map(order => order.id === orderId ? { ...order, status } : order);
    set({ orders: nextOrders });

    // 1. Sync status change to /api/orders
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });
    } catch (e) {
      console.warn("Could not sync status change to /api/orders", e);
    }

    // 2. Sync to Supabase
    if (user) {
      try {
        await supabase.from('orders').update({ status }).eq('id', orderId);
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { orders: nextOrders } });
      } catch {}
    }
  },

  refreshOrders: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const res = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}&role=${encodeURIComponent(user.role)}&email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders)) {
          set({ orders: json.orders });
        }
      }
    } catch {}
  },

  addAddress: async (addrData) => {
    const current = get().addresses;
    if (current.length >= 4) return false;

    const user = get().user;
    const newId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const shouldBeDefault = current.length === 0 || !!addrData.isDefault;

    const newAddr: ShippingAddress = {
      ...addrData,
      recipient: addrData.recipient?.trim() || user?.name || 'Destinatario',
      id: newId,
      isDefault: shouldBeDefault,
    };

    let nextAddresses: ShippingAddress[];
    if (shouldBeDefault) {
      nextAddresses = [newAddr, ...current.map(a => ({ ...a, isDefault: false }))];
    } else {
      nextAddresses = [...current, newAddr];
    }

    const activeAddr = nextAddresses.find(a => a.isDefault) || nextAddresses[0] || null;
    set({ addresses: nextAddresses, address: activeAddr });

    if (user) {
      try {
        await supabase.from('addresses').insert({
          id: newAddr.id,
          user_id: user.id,
          recipient: newAddr.recipient,
          street: newAddr.street,
          city: newAddr.city,
          state: newAddr.state,
          postal_code: newAddr.postalCode,
          country: newAddr.country,
          is_default: newAddr.isDefault,
        });
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { addresses: nextAddresses, address: activeAddr } });
      } catch {}
    }
    return true;
  },

  removeAddress: async (id) => {
    const current = get().addresses;
    const targetId = id || get().address?.id || current[0]?.id;
    if (!targetId) {
      set({ addresses: [], address: null });
      return;
    }

    const removedWasDefault = current.find(a => a.id === targetId)?.isDefault;
    let nextAddresses = current.filter(a => a.id !== targetId);
    if (removedWasDefault && nextAddresses.length > 0) {
      nextAddresses = nextAddresses.map((a, idx) => ({ ...a, isDefault: idx === 0 }));
    }
    const activeAddr = nextAddresses.find(a => a.isDefault) || nextAddresses[0] || null;
    set({ addresses: nextAddresses, address: activeAddr });

    const user = get().user;
    if (user) {
      try {
        await supabase.from('addresses').delete().eq('id', targetId);
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { addresses: nextAddresses, address: activeAddr } });
      } catch {}
    }
  },

  setDefaultAddress: async (id) => {
    const current = get().addresses;
    const nextAddresses = current.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    const activeAddr = nextAddresses.find(a => a.id === id) || null;
    set({ addresses: nextAddresses, address: activeAddr });

    const user = get().user;
    if (user) {
      try {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
        await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { addresses: nextAddresses, address: activeAddr } });
      } catch {}
    }
  },

  setAddress: async (addressInput) => {
    const current = get().addresses;
    // If it has an id and already exists in addresses, set it as the active address
    if ('id' in addressInput && addressInput.id && current.some(a => a.id === addressInput.id)) {
      set({ address: addressInput as ShippingAddress });
      return;
    }
    // If no addresses registered yet, add it
    if (current.length === 0) {
      await get().addAddress(addressInput);
      return;
    }
    // Otherwise update the active/default address
    const targetId = get().address?.id || current[0].id;
    const nextAddresses = current.map(a => a.id === targetId ? { ...a, ...addressInput } : a);
    const activeAddr = nextAddresses.find(a => a.id === targetId) || nextAddresses[0];
    set({ addresses: nextAddresses, address: activeAddr });
    const user = get().user;
    if (user) {
      try {
        await supabase.auth.updateUser({ data: { addresses: nextAddresses, address: activeAddr } });
      } catch {}
    }
  },

  updateUserName: async (name) => {
    const { error } = await supabase.auth.updateUser({ data: { name } });
    if (!error) {
      set((state) => ({
        user: state.user ? { ...state.user, name } : null
      }));
    }
    return { error: error?.message || null };
  },

  updateUserPassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message || null };
  },
}));
