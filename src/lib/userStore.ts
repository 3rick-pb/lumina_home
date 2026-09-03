import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './store';

export interface User {
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
  
  login: (email: string, name: string) => void;
  logout: () => void;
  register: (email: string, name: string) => void;
  
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      favorites: [],
      orders: [],
      
      login: (email, name) => {
        const role = email === 'admin@lumina.com' ? 'ADMIN' : 'USER';
        set({ user: { email, name, role }, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      register: (email, name) => {
        const role = email === 'admin@lumina.com' ? 'ADMIN' : 'USER';
        set({ user: { email, name, role }, isAuthenticated: true });
      },
      
      toggleFavorite: (productId) => {
        set((state) => {
          const isFav = state.favorites.includes(productId);
          if (isFav) {
            return { favorites: state.favorites.filter(id => id !== productId) };
          }
          return { favorites: [...state.favorites, productId] };
        });
      },
      
      isFavorite: (productId) => get().favorites.includes(productId),
      
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map(order => order.id === orderId ? { ...order, status } : order)
      })),
    }),
    {
      name: 'lumina-user-storage',
      skipHydration: true,
    }
  )
);
