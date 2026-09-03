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
  categories: string[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<CatalogProduct, 'id'> & { id?: string }) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, product: CatalogProduct) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
}

const DEFAULT_CATEGORIES = [
  "Iluminación",
  "Aromaterapia",
  "Textiles",
  "Home Office",
  "Almacenamiento",
  "Gadgets"
];

// Convert camelCase to snake_case for Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSupabaseProduct = (p: Partial<CatalogProduct>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    title: p.title,
    title_highlight: p.titleHighlight || null,
    description: p.description || '',
    price: p.price,
    old_price: p.oldPrice || null,
    discount: p.discount || null,
    badge: p.badge || null,
    image_url: p.imageUrl,
    images: p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []),
    colors: p.colors || [],
    sizes: p.sizes || [],
    features: p.features || [],
    category: p.category,
  };

  // Only pass id if it looks like a valid UUID (has dashes)
  if (p.id && p.id.includes('-') && p.id.length > 20) {
    payload.id = p.id;
  }
  return payload;
};

// Convert snake_case back to camelCase for frontend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toFrontendProduct = (p: any): CatalogProduct => ({
  id: p.id,
  title: p.title,
  titleHighlight: p.title_highlight,
  description: p.description,
  price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
  oldPrice: p.old_price ? (typeof p.old_price === 'string' ? parseFloat(p.old_price) : p.old_price) : null,
  discount: p.discount,
  badge: p.badge,
  imageUrl: p.image_url,
  images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
  colors: Array.isArray(p.colors) ? p.colors : [],
  sizes: Array.isArray(p.sizes) ? p.sizes : [],
  features: Array.isArray(p.features) ? p.features : [],
  category: p.category,
});

export const useCatalogStore = create<CatalogState>((set) => ({
  products: [],
  categories: DEFAULT_CATEGORIES,
  isLoading: true,
  
  fetchProducts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const prods = data.map(toFrontendProduct);
      // Collect unique categories found in DB and combine with defaults
      const dbCategories = Array.from(new Set(prods.map(p => p.category).filter(Boolean)));
      const mergedCats = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories]));
      set({ products: prods, categories: mergedCats, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
  
  addProduct: async (product) => {
    const dbProduct = toSupabaseProduct(product);
    const { data, error } = await supabase.from('products').insert([dbProduct]).select().single();
    if (!error && data) {
      const created = toFrontendProduct(data);
      set((state) => {
        const newCats = state.categories.includes(created.category)
          ? state.categories
          : [...state.categories, created.category];
        return { 
          products: [created, ...state.products],
          categories: newCats
        };
      });
      return { success: true };
    }
    return { success: false, error: error?.message || 'Error al guardar el producto' };
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

  addCategory: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) return state;
      return { categories: [...state.categories, trimmed] };
    });
  },

  deleteCategory: (name) => {
    set((state) => ({
      categories: state.categories.filter(c => c.toLowerCase() !== name.toLowerCase())
    }));
  },
}));
