import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRODUCTS as INITIAL_PRODUCTS } from './data';

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
  addProduct: (product: CatalogProduct) => void;
  updateProduct: (id: string, product: CatalogProduct) => void;
  deleteProduct: (id: string) => void;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      products: INITIAL_PRODUCTS,
      addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),
      updateProduct: (id, updatedProduct) => set((state) => ({
        products: state.products.map(p => p.id === id ? updatedProduct : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),
    }),
    {
      name: 'lumina-catalog-storage',
      version: 2,
      skipHydration: true,
    }
  )
);
