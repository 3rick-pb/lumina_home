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
  status: 'Procesando' | 'Enviado' | 'Entregado';
  trackingNumber?: string;
  total: number;
  items: CartItem[];
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
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  favorites: string[]; // array of product IDs
  orders: Order[];
  cards: PaymentCard[];
  address: ShippingAddress | null;
  
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

  setAddress: (address: ShippingAddress) => void;
  removeAddress: () => void;

  updateUserName: (name: string) => Promise<{ error: string | null }>;
  updateUserPassword: (password: string) => Promise<{ error: string | null }>;
}

const fetchUserDataFromDatabase = async (userId: string) => {
  try {
    // 1. Fetch orders from Supabase orders table
    const { data: dbOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orders: Order[] = (dbOrders || []).map((o: any) => ({
      id: o.id,
      date: o.created_at ? new Date(o.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Reciente',
      status: o.status || 'Procesando',
      trackingNumber: o.tracking_number,
      total: Number(o.total) || 0,
      items: Array.isArray(o.items) ? o.items : [],
    }));

    // 2. Fetch address from Supabase addresses table
    const { data: dbAddr } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    let address: ShippingAddress | null = null;
    if (dbAddr) {
      address = {
        street: dbAddr.street || '',
        city: dbAddr.city || '',
        state: dbAddr.state || '',
        postalCode: dbAddr.postal_code || '',
        country: dbAddr.country || 'España',
      };
    }

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
      if (!address && user?.user_metadata?.address) {
        address = user.user_metadata.address;
      }
      if (orders.length === 0 && user?.user_metadata?.orders) {
        orders = user.user_metadata.orders;
      }
    }

    return { cards, orders, address };
  } catch (e) {
    console.error("Error fetching user data from Supabase:", e);
    return { cards: [], orders: [], address: null };
  }
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  favorites: [],
  orders: [],
  cards: [],
  address: null,
  
  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email || '';
        const role = (email.toLowerCase() === 'admin@lumina.com' || session.user.user_metadata?.role === 'ADMIN') ? 'ADMIN' : 'USER';
        const name = session.user.user_metadata?.name || email.split('@')[0];
        
        // Fetch all user private data directly from Supabase database
        const personalData = await fetchUserDataFromDatabase(session.user.id);

        set({ 
          user: { id: session.user.id, email, name, role }, 
          isAuthenticated: true,
          cards: personalData.cards,
          orders: personalData.orders,
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
        set({ user: null, isAuthenticated: false, cards: [], orders: [], address: null, favorites: [] });
      }
    } finally {
      set({ isLoading: false });
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const role = (email.toLowerCase() === 'admin@lumina.com' || session.user.user_metadata?.role === 'ADMIN') ? 'ADMIN' : 'USER';
        const name = session.user.user_metadata?.name || email.split('@')[0];
        const personalData = await fetchUserDataFromDatabase(session.user.id);

        set({ 
          user: { id: session.user.id, email, name, role }, 
          isAuthenticated: true, 
          isLoading: false,
          cards: personalData.cards,
          orders: personalData.orders,
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
      const personalData = await fetchUserDataFromDatabase(data.user.id);

      set({ 
        user: { id: data.user.id, email: userEmail, name, role }, 
        isAuthenticated: true,
        cards: personalData.cards,
        orders: personalData.orders,
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
    const nextOrders = [order, ...get().orders];
    set({ orders: nextOrders });

    if (user) {
      try {
        await supabase.from('orders').insert({
          id: order.id,
          user_id: user.id,
          status: order.status,
          total: order.total,
          items: order.items,
          tracking_number: order.trackingNumber,
        });
      } catch (e) {
        console.error("Error saving order to Supabase:", e);
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

    if (user) {
      try {
        await supabase.from('orders').update({ status }).eq('id', orderId);
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { orders: nextOrders } });
      } catch {}
    }
  },

  setAddress: async (address) => {
    const user = get().user;
    set({ address });

    if (user) {
      try {
        const { data: existing } = await supabase.from('addresses').select('id').eq('user_id', user.id).maybeSingle();
        if (existing) {
          await supabase.from('addresses').update({
            street: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postalCode,
            country: address.country,
          }).eq('user_id', user.id);
        } else {
          await supabase.from('addresses').insert({
            user_id: user.id,
            street: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postalCode,
            country: address.country,
          });
        }
      } catch (e) {
        console.error("Error saving address to Supabase:", e);
      }
      try {
        await supabase.auth.updateUser({ data: { address } });
      } catch {}
    }
  },

  removeAddress: async () => {
    const user = get().user;
    set({ address: null });

    if (user) {
      try {
        await supabase.from('addresses').delete().eq('user_id', user.id);
      } catch {}
      try {
        await supabase.auth.updateUser({ data: { address: null } });
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
