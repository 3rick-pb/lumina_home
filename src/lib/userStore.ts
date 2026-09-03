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

export interface PaymentCard {
  id: string;
  number: string;
  holder: string;
  exp: string;
  type: 'mastercard' | 'visa';
  isDefault?: boolean;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  favorites: string[]; // array of product IDs
  orders: Order[];
  cards: PaymentCard[];
  
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

  updateUserName: (name: string) => Promise<{ error: string | null }>;
  updateUserPassword: (password: string) => Promise<{ error: string | null }>;
}

const DEFAULT_CARDS: PaymentCard[] = [
  {
    id: "card_1",
    number: "•••• •••• 6782",
    holder: "Lumina Member",
    exp: "09/29",
    type: "mastercard",
    isDefault: true,
  },
  {
    id: "card_2",
    number: "•••• •••• 4356",
    holder: "Lumina Member",
    exp: "11/28",
    type: "visa",
    isDefault: false,
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "INV_000076",
    date: "17 Abr, 2026",
    status: "Entregado",
    trackingNumber: "TRK-984210",
    total: 129.50,
    items: []
  },
  {
    id: "INV_000075",
    date: "15 Abr, 2026",
    status: "Enviado",
    trackingNumber: "TRK-872341",
    total: 89.90,
    items: []
  },
  {
    id: "INV_000073",
    date: "14 Abr, 2026",
    status: "Procesando",
    trackingNumber: "TRK-741209",
    total: 49.90,
    items: []
  }
];

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  favorites: [],
  orders: DEFAULT_ORDERS,
  cards: DEFAULT_CARDS,
  
  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const email = session.user.email || '';
      const role = (email.toLowerCase() === 'admin@lumina.com' || session.user.user_metadata?.role === 'ADMIN') ? 'ADMIN' : 'USER';
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
        const role = (email.toLowerCase() === 'admin@lumina.com' || session.user.user_metadata?.role === 'ADMIN') ? 'ADMIN' : 'USER';
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
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (!error && data?.user) {
      // Deterministic immediate role assignment with no race condition
      const userEmail = data.user.email || cleanEmail;
      const role = (userEmail.toLowerCase() === 'admin@lumina.com' || data.user.user_metadata?.role === 'ADMIN') ? 'ADMIN' : 'USER';
      const name = data.user.user_metadata?.name || userEmail.split('@')[0];
      set({ 
        user: { id: data.user.id, email: userEmail, name, role }, 
        isAuthenticated: true 
      });
      // Synchronously trigger favorites load
      const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', data.user.id);
      if (favs) set({ favorites: favs.map(f => f.product_id) });
    }
    return { error: error?.message || null };
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, favorites: [] });
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
        isAuthenticated: true 
      });
    }
    return { error: error?.message || null };
  },

  addCard: (card) => {
    const newCard: PaymentCard = {
      ...card,
      id: Math.random().toString(36).substring(7)
    };
    set((state) => ({ cards: [newCard, ...state.cards] }));
  },

  removeCard: (id) => {
    set((state) => ({ cards: state.cards.filter(c => c.id !== id) }));
  },

  setDefaultCard: (id) => {
    set((state) => ({
      cards: state.cards.map(c => ({
        ...c,
        isDefault: c.id === id
      }))
    }));
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
