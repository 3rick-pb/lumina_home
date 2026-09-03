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

const loadUserData = (userId: string) => {
  if (typeof window === 'undefined') return { cards: [], orders: [], address: null };
  try {
    const savedCards = localStorage.getItem(`lumina_cards_${userId}`);
    const savedOrders = localStorage.getItem(`lumina_orders_${userId}`);
    const savedAddress = localStorage.getItem(`lumina_address_${userId}`);
    return {
      cards: savedCards ? JSON.parse(savedCards) : [],
      orders: savedOrders ? JSON.parse(savedOrders) : [],
      address: savedAddress ? JSON.parse(savedAddress) : null,
    };
  } catch {
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
        
        const personalData = loadUserData(session.user.id);

        set({ 
          user: { id: session.user.id, email, name, role }, 
          isAuthenticated: true,
          cards: personalData.cards,
          orders: personalData.orders,
          address: personalData.address
        });

        // Initialize and isolate cart for this specific user
        useCartStore.getState().initCartForUser(session.user.id);
        
        // Load favorites from Supabase
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
        if (favs) {
          set({ favorites: favs.map(f => f.product_id) });
        }
      } else {
        useCartStore.getState().initCartForUser(null);
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
        const personalData = loadUserData(session.user.id);

        set({ 
          user: { id: session.user.id, email, name, role }, 
          isAuthenticated: true, 
          isLoading: false,
          cards: personalData.cards,
          orders: personalData.orders,
          address: personalData.address
        });

        // Switch active cart strictly to this account
        useCartStore.getState().initCartForUser(session.user.id);

        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
        if (favs) set({ favorites: favs.map(f => f.product_id) });
      } else {
        // Reset and isolate guest cart when signed out
        useCartStore.getState().initCartForUser(null);
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
      const personalData = loadUserData(data.user.id);

      set({ 
        user: { id: data.user.id, email: userEmail, name, role }, 
        isAuthenticated: true,
        cards: personalData.cards,
        orders: personalData.orders,
        address: personalData.address
      });

      // Synchronize and load user's private cart
      useCartStore.getState().initCartForUser(data.user.id, true);

      const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', data.user.id);
      if (favs) set({ favorites: favs.map(f => f.product_id) });
    }
    return { error: error?.message || null };
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    // Isolate & reset cart to guest session (empty) so no data leaks into the next account
    useCartStore.getState().initCartForUser(null);
    set({ user: null, isAuthenticated: false, favorites: [], cards: [], orders: [], address: null });
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

      // Initialize empty private cart for new user
      useCartStore.getState().initCartForUser(data.user.id, true);
    }
    return { error: error?.message || null };
  },

  addCard: (card) => {
    const userId = get().user?.id || 'guest';
    const newCard: PaymentCard = {
      ...card,
      id: Math.random().toString(36).substring(7)
    };
    const nextCards = [newCard, ...get().cards];
    set({ cards: nextCards });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lumina_cards_${userId}`, JSON.stringify(nextCards));
    }
  },

  removeCard: (id) => {
    const userId = get().user?.id || 'guest';
    const nextCards = get().cards.filter(c => c.id !== id);
    set({ cards: nextCards });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lumina_cards_${userId}`, JSON.stringify(nextCards));
    }
  },

  setDefaultCard: (id) => {
    const userId = get().user?.id || 'guest';
    const nextCards = get().cards.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    set({ cards: nextCards });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lumina_cards_${userId}`, JSON.stringify(nextCards));
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
  
  addOrder: (order) => {
    const userId = get().user?.id || 'guest';
    const nextOrders = [order, ...get().orders];
    set({ orders: nextOrders });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lumina_orders_${userId}`, JSON.stringify(nextOrders));
    }
  },

  updateOrderStatus: (orderId, status) => {
    const userId = get().user?.id || 'guest';
    const nextOrders = get().orders.map(order => order.id === orderId ? { ...order, status } : order);
    set({ orders: nextOrders });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lumina_orders_${userId}`, JSON.stringify(nextOrders));
    }
  },

  setAddress: (address) => {
    const userId = get().user?.id || 'guest';
    set({ address });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lumina_address_${userId}`, JSON.stringify(address));
    }
  },

  removeAddress: () => {
    const userId = get().user?.id || 'guest';
    set({ address: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`lumina_address_${userId}`);
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
