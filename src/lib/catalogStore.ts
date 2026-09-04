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
  materials?: string;
  shipping?: string;
  dimensions?: string;
  warranty?: string;
  careInstructions?: string;
  packageContents?: string;
  stock?: number;
}

interface CatalogState {
  products: CatalogProduct[];
  categories: string[];
  badges: string[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<CatalogProduct, 'id'> & { id?: string }) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, product: CatalogProduct) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
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
  "Exclusivo",
  "AGOTADO"
];

export const isAgotadoBadge = (badge?: string | null): boolean => {
  if (!badge) return false;
  return badge.trim().toUpperCase() === "AGOTADO";
};

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
    features: ["Cerámica gres cocida a 1250°C", "Acabado impermeable interior", "Base pulida suave"],
    materials: "Gres cerámico mineral de alta temperatura (1250°C), esmalte interior vitrificado impermeable y base tratada con fieltro protector.",
    shipping: "Envío express 24-48 horas en caja doble corrugada con esquineras de absorción de impactos. Devolución gratuita durante 30 días.",
    dimensions: "Alto: 24 cm | Diámetro máximo: 15 cm | Diámetro boca: 7 cm | Peso neto: 1.15 kg",
    warranty: "2 años de garantía artesanal contra fisuras estructurales o porosidad no deseada.",
    careInstructions: "Lavar a mano con agua tibia y jabón neutro. Secar al aire. Evitar frotar con estropajos abrasivos.",
    packageContents: "1x Jarrón Luna Cerámica Gres, 1x Certificado artesanal numerado, 1x Almohadilla protectora para mesa.",
    stock: 14
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
    features: ["Cristal de alta definición 5mm", "Marco de latón macizo", "Anclaje invisible"],
    materials: "Cristal belga de 5mm con película de seguridad anti-astillas posterior y marco exterior de latón macizo cepillado con sellado anticorrosión.",
    shipping: "Envío asegurado en embalaje de madera reforzada anti-rotura. Entrega concertada en 48-72h laborales.",
    dimensions: "Diámetro total: 60 cm | Profundidad del marco: 3.2 cm | Peso neto: 4.6 kg",
    warranty: "3 años de garantía oficial Lumina en acabado metálico y nitidez del cristal.",
    careInstructions: "Limpiar el espejo con paño de microfibra humedecido con limpiacristales sin amoníaco. El marco debe limpiarse exclusivamente en seco.",
    packageContents: "1x Espejo Solar de latón 60cm, 1x Set de fijación invisible (tacos Fischer y tornillos reforzados), 1x Nivel de precisión para colgar.",
    stock: 8
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
    features: ["Muelas cónicas de 38mm CNC", "Ajuste micrométrico", "Manivela ergonómica"],
    materials: "Cuerpo de madera maciza de roble europeo torneado a mano con acabado en cera vegetal, muelas cónicas CNC de acero inoxidable grado 420 y eje de aluminio aeroespacial.",
    shipping: "Envío rápido en 24-48 horas. Empaque de lujo en cartón reciclado ideal para regalo.",
    dimensions: "Altura: 18.5 cm | Diámetro: 5.2 cm | Longitud de manivela: 15 cm | Capacidad: 35g de café | Peso: 560g",
    warranty: "5 años de garantía oficial en las muelas cónicas y mecanismo de rotación.",
    careInstructions: "No sumergir en agua ni introducir en lavavajillas. Limpiar periódicamente las muelas con el cepillo de cerdas duras incluido.",
    packageContents: "1x Molinillo manual Barista, 1x Brocha de cerdas naturales para limpieza, 1x Bolsa de transporte de lino puro, 1x Tabla de molienda según método.",
    stock: 22
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
    features: ["Superficie antimicrobiana natural", "Agarre superior", "100% ecológico"],
    materials: "Lámina superior de corcho virgen de alcornoque portugués 100% natural y antimicrobiano. Base inferior de caucho puro de savia de árbol sin PVC ni tóxicos.",
    shipping: "Envío express 24-48h con correa de transporte y embalaje 100% libre de plásticos.",
    dimensions: "Largo: 183 cm | Ancho: 61 cm | Grosor de alta densidad: 4.5 mm | Peso: 2.35 kg",
    warranty: "2 años de garantía contra descamación, deformación o pérdida de adherencia.",
    careInstructions: "Enrollar siempre con la cara de corcho mirando hacia afuera. Limpiar una vez por semana con un paño húmedo con unas gotas de agua y limón o aceite de árbol de té.",
    packageContents: "1x Esterilla Zen de corcho natural, 1x Correa portadora de algodón orgánico crudo, 1x Guía de respiración y posturas esenciales.",
    stock: 5
  }
];

// Convert camelCase to snake_case for Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSupabaseProduct = (p: Partial<CatalogProduct>) => {
  // Helper to extract and sanitize clean image URLs
  const rawList: string[] = [];
  if (p.imageUrl && typeof p.imageUrl === 'string') {
    p.imageUrl.split(/[\n,]+/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(s => s.startsWith('http')).forEach(u => rawList.push(u));
  }
  if (Array.isArray(p.images)) {
    p.images.forEach(img => {
      if (typeof img === 'string') {
        img.split(/[\n,]+/).map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(s => s.startsWith('http')).forEach(u => {
          if (!rawList.includes(u)) rawList.push(u);
        });
      }
    });
  }
  const fallbackImg = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
  const cleanMain = rawList[0] || p.imageUrl || fallbackImg;
  const cleanImages = rawList.length > 0 ? rawList : [cleanMain];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    title: p.title,
    title_highlight: p.titleHighlight || null,
    description: p.description || '',
    price: p.price,
    old_price: p.oldPrice || null,
    discount: p.discount || null,
    badge: p.badge || null,
    image_url: cleanMain,
    images: cleanImages,
    colors: p.colors || [],
    sizes: p.sizes || [],
    features: p.features || [],
    category: p.category,
    materials: p.materials || null,
    shipping: p.shipping || null,
    dimensions: p.dimensions || null,
    warranty: p.warranty || null,
    care_instructions: p.careInstructions || null,
    package_contents: p.packageContents || null,
    stock: typeof p.stock === 'number' ? p.stock : 20,
  };

  // Only pass id if it looks like a valid UUID (has dashes)
  if (p.id && p.id.includes('-') && p.id.length > 20) {
    payload.id = p.id;
  }
  return payload;
};

// Helper to detect missing column / schema cache errors in Supabase PostgREST
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isMissingColumnError = (err: any): boolean => {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  return code === 'PGRST204' || code === '42703' || msg.includes('column') || msg.includes('schema cache');
};

// Convert snake_case back to camelCase for frontend with canonical category formatting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toFrontendProduct = (p: any): CatalogProduct => {
  const parsedImages: string[] = [];
  if (p.image_url && typeof p.image_url === 'string') {
    p.image_url.split(/[\n,]+/).map((s: string) => s.trim().replace(/^['"]|['"]$/g, '')).filter((s: string) => s.startsWith('http')).forEach((u: string) => {
      if (!parsedImages.includes(u)) parsedImages.push(u);
    });
  }
  if (Array.isArray(p.images)) {
    p.images.forEach((img: unknown) => {
      if (typeof img === 'string') {
        img.split(/[\n,]+/).map((s: string) => s.trim().replace(/^['"]|['"]$/g, '')).filter((s: string) => s.startsWith('http')).forEach((u: string) => {
          if (!parsedImages.includes(u)) parsedImages.push(u);
        });
      }
    });
  }
  const fallback = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop";
  const frontMain = parsedImages[0] || p.image_url || fallback;
  const frontImages = parsedImages.length > 0 ? parsedImages : [frontMain];

  // Retrieve cached local metadata if extended columns are not yet in Supabase schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extraMeta: any = {};
  if (typeof window !== 'undefined' && p.id) {
    try {
      const saved = localStorage.getItem(`lumina_prod_meta_${p.id}`);
      if (saved) extraMeta = JSON.parse(saved);
    } catch {}
  }

  return {
    id: p.id,
    title: p.title,
    titleHighlight: p.title_highlight,
    description: p.description,
    price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    oldPrice: p.old_price ? (typeof p.old_price === 'string' ? parseFloat(p.old_price) : p.old_price) : null,
    discount: p.discount,
    badge: p.badge,
    imageUrl: frontMain,
    images: frontImages,
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    features: Array.isArray(p.features) ? p.features : [],
    category: canonicalCategory(p.category, DEFAULT_CATEGORIES),
    materials: p.materials || extraMeta.materials || undefined,
    shipping: p.shipping || extraMeta.shipping || undefined,
    dimensions: p.dimensions || extraMeta.dimensions || undefined,
    warranty: p.warranty || extraMeta.warranty || undefined,
    careInstructions: p.care_instructions || extraMeta.careInstructions || undefined,
    packageContents: p.package_contents || extraMeta.packageContents || undefined,
    stock: typeof p.stock === 'number' ? p.stock : (typeof extraMeta.stock === 'number' ? extraMeta.stock : 18),
  };
};

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
    let { data, error } = await supabase.from('products').insert([dbProduct]).select().single();
    
    // Auto-retry with base columns if extended columns are not yet present in Supabase table
    if (isMissingColumnError(error)) {
      const basicProduct = { ...dbProduct };
      delete basicProduct.materials;
      delete basicProduct.shipping;
      delete basicProduct.dimensions;
      delete basicProduct.warranty;
      delete basicProduct.care_instructions;
      delete basicProduct.package_contents;
      delete basicProduct.stock;
      const retry = await supabase.from('products').insert([basicProduct]).select().single();
      data = retry.data;
      error = retry.error;
    }

    // Fallback to server API if needed
    if (error) {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbProduct)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.product) {
            data = json.product;
            error = null;
          }
        }
      } catch (apiErr) {
        console.warn('API fallback error in addProduct:', apiErr);
      }
    }

    if (!error && data) {
      // Save extended metadata locally so user gets full fidelity immediately
      if (typeof window !== 'undefined' && data.id) {
        try {
          const meta = {
            materials: product.materials,
            shipping: product.shipping,
            dimensions: product.dimensions,
            warranty: product.warranty,
            careInstructions: product.careInstructions,
            packageContents: product.packageContents,
            stock: product.stock
          };
          localStorage.setItem(`lumina_prod_meta_${data.id}`, JSON.stringify(meta));
        } catch {}
      }

      const created: CatalogProduct = { ...toFrontendProduct(data), ...product, id: data.id };
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
    return { success: false, error: error?.message || 'Error al guardar el producto en la base de datos' };
  },
  
  updateProduct: async (id, updatedProduct) => {
    // If it's a UUID, update in Supabase database
    if (id.includes('-') && id.length > 20) {
      const dbProduct = toSupabaseProduct(updatedProduct);
      let { data, error } = await supabase.from('products').update(dbProduct).eq('id', id).select().single();
      
      if (isMissingColumnError(error)) {
        const basicProduct = { ...dbProduct };
        delete basicProduct.materials;
        delete basicProduct.shipping;
        delete basicProduct.dimensions;
        delete basicProduct.warranty;
        delete basicProduct.care_instructions;
        delete basicProduct.package_contents;
        delete basicProduct.stock;
        const retry = await supabase.from('products').update(basicProduct).eq('id', id).select().single();
        data = retry.data;
        error = retry.error;
      }

      // Fallback to server API if needed
      if (error) {
        try {
          const res = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...dbProduct })
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.product) {
              data = json.product;
              error = null;
            }
          }
        } catch (apiErr) {
          console.warn('API fallback error in updateProduct:', apiErr);
        }
      }

      if (!error && data) {
        // Cache metadata locally
        if (typeof window !== 'undefined') {
          try {
            const meta = {
              materials: updatedProduct.materials,
              shipping: updatedProduct.shipping,
              dimensions: updatedProduct.dimensions,
              warranty: updatedProduct.warranty,
              careInstructions: updatedProduct.careInstructions,
              packageContents: updatedProduct.packageContents,
              stock: updatedProduct.stock
            };
            localStorage.setItem(`lumina_prod_meta_${id}`, JSON.stringify(meta));
          } catch {}
        }

        const updated: CatalogProduct = { ...toFrontendProduct(data), ...updatedProduct, id };
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
    let deletedInDb = false;
    let lastError: string | null = null;

    if (id.includes('-') && id.length > 20) {
      // 1. Direct Supabase client deletion
      try {
        const { data, error } = await supabase.from('products').delete().eq('id', id).select();
        if (!error && data && data.length > 0) {
          deletedInDb = true;
        } else if (error) {
          lastError = error.message;
        }
      } catch (err) {
        lastError = String(err);
      }

      // 2. Server API fallback if direct delete was blocked by client RLS
      if (!deletedInDb) {
        try {
          const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.deletedCount > 0) {
              deletedInDb = true;
            } else if (json.error) {
              lastError = json.error;
            }
          }
        } catch (apiErr) {
          console.warn('Notice: API delete fallback error:', apiErr);
        }
      }
    } else {
      // Mock/in-memory product
      deletedInDb = true;
    }

    // Clean up cached metadata
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`lumina_prod_meta_${id}`);
      } catch {}
    }

    // Update local state reactively
    set((state) => ({
      products: state.products.filter(p => p.id !== id)
    }));

    if (!deletedInDb && lastError) {
      console.error('deleteProduct DB warning:', lastError);
      return { success: false, error: lastError };
    }

    return { success: true };
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
