import { createClient } from '@supabase/supabase-js';
import { PRODUCTS } from './src/lib/data.js'; // Wait, it's a ts file, I'll just hardcode them in seed.js or use tsc

// I will just copy the pruned data array directly here to avoid TS issues
const INITIAL_PRODUCTS = [
  {
    id: "prod_001",
    title: "Lámpara Nova",
    titleHighlight: "LED",
    price: 129.99,
    oldPrice: 159.99,
    discount: "-18%",
    badge: "Más Vendido",
    category: "iluminacion",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop"],
    description: "Lámpara de pie minimalista con tecnología LED de luz cálida regulable. Perfecta para crear atmósferas acogedoras en cualquier rincón del hogar.",
    colors: [{ name: "Latón", hex: "#E5A952" }, { name: "Negro Mate", hex: "#1A1A1A" }],
    features: ["Luz LED 3000K", "Regulador táctil", "Estructura de acero"]
  },
  {
    id: "prod_002",
    title: "Difusor Zen",
    titleHighlight: "Cerámica",
    price: 89.50,
    category: "aromaterapia",
    imageUrl: "https://images.unsplash.com/photo-1608528577891-eb055847f2e5?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1608528577891-eb055847f2e5?q=80&w=800&auto=format&fit=crop"],
    description: "Difusor ultrasónico de aceites esenciales. Su cuerpo de cerámica artesanal lo convierte en una pieza decorativa que purifica tu espacio.",
    colors: [{ name: "Blanco Piedra", hex: "#F3F4F6" }, { name: "Terracota", hex: "#E2725B" }],
    features: ["Apagado automático", "Luz ambiente suave", "Capacidad 120ml"]
  },
  {
    id: "prod_003",
    title: "Manta Nube",
    titleHighlight: "Algodón",
    price: 65.00,
    category: "textiles",
    imageUrl: "https://images.unsplash.com/photo-1580828369066-608b6f3a746f?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1580828369066-608b6f3a746f?q=80&w=800&auto=format&fit=crop"],
    description: "Manta tejida a mano con hilo de algodón 100% orgánico. Su textura extra suave es ideal para las tardes de lectura en el sofá.",
    colors: [{ name: "Crema", hex: "#FFFDD0" }, { name: "Gris Ceniza", hex: "#B2BEB5" }],
    sizes: ["Throw (130x170cm)", "Queen (200x230cm)"],
    features: ["Hipoalergénica", "Tejido transpirable", "Lavable a máquina"]
  },
  {
    id: "prod_004",
    title: "Soporte Ergo",
    titleHighlight: "Madera",
    price: 45.00,
    oldPrice: 55.00,
    discount: "-18%",
    category: "home office",
    imageUrl: "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?q=80&w=800&auto=format&fit=crop"],
    description: "Eleva tu monitor a la altura perfecta para prevenir tensión en el cuello. Incluye espacio inferior para guardar el teclado.",
    colors: [{ name: "Nogal", hex: "#5C4033" }, { name: "Roble Claro", hex: "#DEB887" }],
    features: ["Soporta hasta 20kg", "Acabado mate ecológico", "Bases antideslizantes"]
  },
  {
    id: "prod_005",
    title: "Organizador Clarity",
    price: 34.90,
    category: "almacenamiento",
    badge: "Nuevo",
    imageUrl: "https://images.unsplash.com/photo-1622372738946-62e02505feb3?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1622372738946-62e02505feb3?q=80&w=800&auto=format&fit=crop"],
    description: "Cajas apilables de acrílico transparente de alta resistencia. Mantén tus accesorios visibles, ordenados y libres de polvo.",
    colors: [{ name: "Transparente", hex: "#FFFFFF" }],
    sizes: ["Pack 3 mediano", "Pack 2 grande"],
    features: ["Acrílico Premium 4mm", "Diseño modular", "A prueba de ralladuras"]
  },
  {
    id: "prod_006",
    title: "Aspiradora Swift",
    titleHighlight: "Inalámbrica",
    price: 249.99,
    oldPrice: 299.99,
    discount: "-16%",
    category: "gadgets",
    imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop"],
    description: "Limpieza profunda con máxima libertad. Motor digital sin escobillas, batería de 45 minutos y sistema de filtración HEPA.",
    colors: [{ name: "Gris Espacial", hex: "#4A4A4A" }, { name: "Blanco Perla", hex: "#FDF5E6" }],
    features: ["Batería intercambiable", "Filtro HEPA lavable", "Motor de 120W"]
  }
];

const supabaseUrl = 'https://wegtielydjzrckbafbfv.supabase.co';
const supabaseAnonKey = 'sb_publishable_8eJA4C3xm-7PGjwiFN8juQ_Cj1TWxhA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("Seeding Database...");
  const dbProducts = INITIAL_PRODUCTS.map(p => ({
    title: p.title,
    title_highlight: p.titleHighlight || null,
    description: p.description || '',
    price: p.price,
    old_price: p.oldPrice || null,
    discount: p.discount || null,
    badge: p.badge || null,
    image_url: p.imageUrl,
    images: p.images || [],
    colors: p.colors || [],
    sizes: p.sizes || [],
    features: p.features || [],
    category: p.category,
  }));
  
  // Since we have RLS that requires auth.uid() IS NOT NULL, we can't seed anonymously.
  // Wait, I will just temporarily run it by disabling RLS or I can create an anon policy for insert.
  // But wait, they already ran the SQL which required auth!
  console.log("Seed requires Auth. I should create an auth user first or login.");
}

seed();
