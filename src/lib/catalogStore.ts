import { create } from 'zustand';
import { supabase } from './supabase';

export interface CatalogProduct {
  id: string;
  title: string;
  titleHighlight?: string;
  price: number;
  oldPrice?: number | null;
  discount?: string;
  badge?: string;
  category: string;
  imageUrl: string;
  description?: string;
  images?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  features?: string[];
}

interface CatalogState {
  products: CatalogProduct[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: CatalogProduct) => Promise<void>;
  updateProduct: (id: string, product: CatalogProduct) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

// Convert camelCase to snake_case for Supabase
const toSupabaseProduct = (p: CatalogProduct) => ({
  id: p.id,
  title: p.title,
  title_highlight: p.titleHighlight,
  description: p.description || '',
  price: p.price,
  old_price: p.oldPrice,
  discount: p.discount,
  badge: p.badge,
  image_url: p.imageUrl,
  images: p.images || [],
  colors: p.colors || [],
  sizes: p.sizes || [],
  features: p.features || [],
  category: p.category,
});

// Convert snake_case back to camelCase for frontend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toFrontendProduct = (p: any): CatalogProduct => ({
  id: p.id,
  title: p.title,
  titleHighlight: p.title_highlight,
  description: p.description,
  price: p.price,
  oldPrice: p.old_price,
  discount: p.discount,
  badge: p.badge,
  imageUrl: p.image_url,
  images: p.images,
  colors: p.colors,
  sizes: p.sizes,
  features: p.features,
  category: p.category,
});

export const useCatalogStore = create<CatalogState>((set) => ({
  products: [],
  isLoading: true,
  
  fetchProducts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      set({ products: data.map(toFrontendProduct), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
  
  addProduct: async (product) => {
    const dbProduct = toSupabaseProduct(product);
    const { data, error } = await supabase.from('products').insert([dbProduct]).select().single();
    if (!error && data) {
      set((state) => ({ products: [toFrontendProduct(data), ...state.products] }));
    }
  },
  
  updateProduct: async (id, updatedProduct) => {
    const dbProduct = toSupabaseProduct(updatedProduct);
    const { data, error } = await supabase.from('products').update(dbProduct).eq('id', id).select().single();
    if (!error && data) {
      set((state) => ({
        products: state.products.map(p => p.id === id ? toFrontendProduct(data) : p)
      }));
    }
  },
  
  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      set((state) => ({
        products: state.products.filter(p => p.id !== id)
      }));
    }
  },
}));
