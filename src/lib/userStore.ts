import { create } from 'zustand';
import { supabase } from './supabase';
import { CartItem } from './store';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface Order {
  id: string;
  date: string;
  status: 'Procesando' | 'Enviado' | 'Entregado';
  trackingNumber: string;
  total: number;
  items: CartItem[];
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  favorites: string[]; // array of product IDs
  orders: Order[];
  
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  
  // Dummy order functions for now
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  favorites: [],
  orders: [],
  
  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const email = session.user.email || '';
      const role = email === 'admin@lumina.com' ? 'ADMIN' : 'USER';
      const name = session.user.user_metadata?.name || email.split('@')[0];
      set({ user: { id: session.user.id, email, name, role }, isAuthenticated: true });
      
      // Load favorites
      const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
      if (favs) {
        set({ favorites: favs.map(f => f.product_id) });
      }
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const role = email === 'admin@lumina.com' ? 'ADMIN' : 'USER';
        const name = session.user.user_metadata?.name || email.split('@')[0];
        set({ user: { id: session.user.id, email, name, role }, isAuthenticated: true });
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', session.user.id);
        if (favs) set({ favorites: favs.map(f => f.product_id) });
      } else {
        set({ user: null, isAuthenticated: false, favorites: [] });
      }
    });
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  },
  
  logout: async () => {
    await supabase.auth.signOut();
  },
  
  register: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { name } } 
    });
    return { error: error?.message || null };
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
  
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(order => order.id === orderId ? { ...order, status } : order)
  })),
}));
