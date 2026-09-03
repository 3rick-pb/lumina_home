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
  badges: string[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<CatalogProduct, 'id'> & { id?: string }) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, product: CatalogProduct) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  addBadge: (name: string) => void;
  deleteBadge: (name: string) => void;
}

const DEFAULT_CATEGORIES = [
  "Iluminación",
  "Aromaterapia",
  "Textiles",
  "Home Office",
  "Almacenamiento",
  "Gadgets",
  "Cerámica",
  "Decoración",
  "Cocina",
  "Bienestar"
];

const DEFAULT_BADGES = [
  "Más Vendido",
  "Nuevo",
  "Bestseller",
  "Tendencia",
  "Edición Limitada",
  "Exclusivo"
];

export const normalizeCategory = (cat?: string | null): string => {
  if (!cat) return "";
  return cat
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const canonicalCategory = (cat: string, knownCategories: string[]): string => {
  const norm = normalizeCategory(cat);
  const found = knownCategories.find(c => normalizeCategory(c) === norm);
  return found || cat;
};

// Initial pieces for niches to ensure no category is shown empty
const INITIAL_NICHE_PRODUCTS: CatalogProduct[] = [
  {
    id: "prod-ceramica-1",
    title: "Jarrón Luna",
    titleHighlight: "Gres Cerámico",
    description: "Jarrón escultural modelado a mano en gres cerámico de alta temperatura. Textura porosa natural con acabado mate crudo.",
    price: 68.00,
    oldPrice: 85.00,
    discount: "-20%",
    badge: "Artesanal",
    category: "Cerámica",
    imageUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=800&auto=format&fit=crop"],
    colors: [{ name: "Gres Natural", hex: "#d1c7bd" }],
    sizes: ["Mediano (24cm)"],
    features: ["Cerámica gres cocida a 1250°C", "Acabado impermeable interior", "Base pulida suave"]
  },
  {
    id: "prod-decoracion-1",
    title: "Espejo Solar",
    titleHighlight: "Latón Dorado",
    description: "Espejo circular de pared con halo suspendido en latón cepillado macizo. Reflejos limpios para recibidores y salones luminosos.",
    price: 145.00,
    badge: "Nuevo",
    category: "Decoración",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop"],
    colors: [{ name: "Latón Cepillado", hex: "#d4af37" }],
    sizes: ["Diámetro 60cm"],
    features: ["Cristal de alta definición 5mm", "Marco de latón macizo", "Anclaje invisible"]
  },
  {
    id: "prod-cocina-1",
    title: "Molinillo Barista",
    titleHighlight: "Roble & Acero",
    description: "Molinillo manual de café de precisión con cuerpo macizo de roble torneado y muelas cónicas de acero inoxidable grado 420.",
    price: 79.50,
    oldPrice: 95.00,
    discount: "-16%",
    badge: "Exclusivo",
    category: "Cocina",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop"],
    colors: [{ name: "Roble Natural", hex: "#a27f54" }],
    sizes: ["Capacidad 35g"],
    features: ["Muelas cónicas de 38mm CNC", "Ajuste micrométrico", "Manivela ergonómica"]
  },
  {
    id: "prod-bienestar-1",
    title: "Esterilla Zen",
    titleHighlight: "Corcho Natural",
    description: "Tapete orgánico para yoga y meditación elaborado con corcho de alcornoque portugués y base antideslizante de caucho vegetal.",
    price: 89.00,
    badge: "Bestseller",
    category: "Bienestar",
    imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop"],
    colors: [{ name: "Corcho Cálido", hex: "#c89d7c" }],
    sizes: ["183 x 61 cm"],
    features: ["Superficie antimicrobiana natural", "Agarre superior", "100% ecológico"]
  }
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

// Convert snake_case back to camelCase for frontend with canonical category formatting
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
  category: canonicalCategory(p.category, DEFAULT_CATEGORIES),
});

export const useCatalogStore = create<CatalogState>((set) => ({
  products: [],
  categories: DEFAULT_CATEGORIES,
  badges: DEFAULT_BADGES,
  isLoading: true,
  
  fetchProducts: async () => {
    set({ isLoading: true });
    
    // Load custom badges from localStorage if present
    let initialBadges = DEFAULT_BADGES;
    if (typeof window !== 'undefined') {
      try {
        const savedBadges = localStorage.getItem('lumina_marketing_badges');
        if (savedBadges) {
          initialBadges = Array.from(new Set([...DEFAULT_BADGES, ...JSON.parse(savedBadges)]));
        }
      } catch {
        // Ignore JSON error
      }
    }

    // 1. Dynamic Categories from Supabase database
    let activeCategories: string[] = [];
    try {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('name')
        .order('created_at', { ascending: true });
      if (!catError && catData && catData.length > 0) {
        activeCategories = catData.map(c => c.name).filter(Boolean);
      }
    } catch {}

    // 2. Fetch Products
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    let prods: CatalogProduct[] = [];
    if (!error && data && data.length > 0) {
      prods = data.map(toFrontendProduct);
    } else {
      prods = INITIAL_NICHE_PRODUCTS;
    }

    // 3. If categories table is not yet populated, discover niches dynamically from active products
    if (activeCategories.length === 0) {
      const productCategories = Array.from(new Set(prods.map(p => p.category).filter(Boolean)));
      activeCategories = productCategories.length > 0 ? productCategories : DEFAULT_CATEGORIES;
    }

    // 4. Badges
    const dbBadges = Array.from(new Set(prods.map(p => p.badge).filter((b): b is string => Boolean(b))));
    const mergedBadges = Array.from(new Set([...initialBadges, ...dbBadges]));

    set({ products: prods, categories: activeCategories, badges: mergedBadges, isLoading: false });
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
        const newBadges = created.badge && !state.badges.includes(created.badge)
          ? [...state.badges, created.badge]
          : state.badges;
        return { 
          products: [created, ...state.products],
          categories: newCats,
          badges: newBadges
        };
      });
      return { success: true };
    }
    return { success: false, error: error?.message || 'Error al guardar el producto' };
  },
  
  updateProduct: async (id, updatedProduct) => {
    // If it's a UUID, update in Supabase database
    if (id.includes('-') && id.length > 20) {
      const dbProduct = toSupabaseProduct(updatedProduct);
      const { data, error } = await supabase.from('products').update(dbProduct).eq('id', id).select().single();
      if (!error && data) {
        const updated = toFrontendProduct(data);
        set((state) => ({
          products: state.products.map(p => p.id === id ? updated : p),
          categories: state.categories.includes(updated.category)
            ? state.categories
            : [...state.categories, updated.category]
        }));
        return { success: true };
      }
      return { success: false, error: error?.message || 'Error al actualizar en la base de datos' };
    } else {
      // Direct catalog state update
      const updated: CatalogProduct = {
        ...updatedProduct,
        id,
        category: canonicalCategory(updatedProduct.category, DEFAULT_CATEGORIES),
      };
      set((state) => ({
        products: state.products.map(p => p.id === id ? updated : p),
        categories: state.categories.includes(updated.category)
          ? state.categories
          : [...state.categories, updated.category]
      }));
      return { success: true };
    }
  },
  
  deleteProduct: async (id) => {
    if (id.includes('-') && id.length > 20) {
      await supabase.from('products').delete().eq('id', id);
    }
    set((state) => ({
      products: state.products.filter(p => p.id !== id)
    }));
  },

  addCategory: async (name) => {
    const clean = name.trim();
    if (!clean) return;
    set((state) => {
      if (state.categories.some(c => normalizeCategory(c) === normalizeCategory(clean))) {
        return state;
      }
      return { categories: [...state.categories, clean] };
    });

    try {
      await supabase.from('categories').insert([{ name: clean }]);
    } catch (e) {
      console.error("Error saving category to database:", e);
    }
  },

  deleteCategory: async (name) => {
    const clean = name.trim();
    set((state) => ({
      categories: state.categories.filter(c => normalizeCategory(c) !== normalizeCategory(clean))
    }));

    try {
      await supabase.from('categories').delete().ilike('name', clean);
    } catch (e) {
      console.error("Error deleting category from database:", e);
    }
  },

  addBadge: (name) => {
    const clean = name.trim();
    if (!clean) return;
    set((state) => {
      if (state.badges.includes(clean)) return state;
      const next = [...state.badges, clean];
      if (typeof window !== 'undefined') {
        localStorage.setItem('lumina_marketing_badges', JSON.stringify(next));
      }
      return { badges: next };
    });
  },

  deleteBadge: (name) => {
    set((state) => {
      const next = state.badges.filter(b => b !== name);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lumina_marketing_badges', JSON.stringify(next));
      }
      return { badges: next };
    });
  },
}));
