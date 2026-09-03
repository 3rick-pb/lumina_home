export interface Product {
  id: string;
  title: string;
  titleHighlight?: string;
  price: number;
  oldPrice?: number | null;
  discount?: string;
  badge?: string;
  imageUrl: string;
  description?: string;
  images?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  features?: string[];
  category: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    title: "Lámpara de Escritorio",
    titleHighlight: "Orbit",
    price: 129.50,
    oldPrice: 159.00,
    discount: "-18%",
    badge: "Nuevo",
    category: "Iluminación",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    description: "Lámpara inteligente con brazo articulado de aluminio espacial. Ajuste de temperatura de color continuo y carga inalámbrica integrada.",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200&auto=format&fit=crop",
    ],
    colors: [
      { name: "Plata Espacial", hex: "#c0c0c0" },
      { name: "Negro Mate", hex: "#222222" }
    ],
    features: ["Carga Qi de 15W integrada", "Aluminio aeroespacial anodizado", "Control táctil"]
  },
  {
    id: "2",
    title: "Difusor Ultrasónico",
    titleHighlight: "Aroma",
    price: 49.90,
    oldPrice: 65.00,
    discount: "-23%",
    badge: "Bestseller",
    category: "Aromaterapia",
    imageUrl: "https://images.unsplash.com/photo-1608528577891-eb055944f2e1?q=80&w=800&auto=format&fit=crop",
    description: "Difusor de aceites esenciales con diseño minimalista de cerámica mate. Capacidad de 300ml, luz ambiental LED cálida y temporizador.",
    images: [
      "https://images.unsplash.com/photo-1608528577891-eb055944f2e1?q=80&w=1200&auto=format&fit=crop",
    ],
    colors: [
      { name: "Blanco Mate", hex: "#f0f0f0" },
      { name: "Negro Obsidiana", hex: "#1a1a1a" },
    ],
    features: ["Material cerámico artesanal", "Apagado automático"]
  },
  {
    id: "3",
    title: "Manta Nórdica",
    titleHighlight: "Chunky",
    price: 119.90,
    oldPrice: 149.90,
    discount: "-20%",
    badge: "Tendencia",
    category: "Textiles",
    imageUrl: "https://images.unsplash.com/photo-1580828343064-fde4cad202d0?q=80&w=800&auto=format&fit=crop",
    description: "Manta XXL tejida a mano con lana merina 100% natural, extremadamente suave.",
    images: [
      "https://images.unsplash.com/photo-1580828343064-fde4cad202d0?q=80&w=1200&auto=format&fit=crop",
    ],
    colors: [
      { name: "Beige Avena", hex: "#d7cdbc" },
    ],
    sizes: ["Cama Individual (100x120)", "Cama Matrimonial (150x200)"],
    features: ["Lana merina libre de crueldad", "Tejido artesanal sin agujas"]
  },
  {
    id: "4",
    title: "Soporte de Monitor",
    titleHighlight: "ErgoWood",
    price: 89.90,
    oldPrice: null,
    discount: "",
    badge: "",
    category: "Home Office",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
    description: "Soporte elevador para monitor esculpido en una sola pieza de madera de nogal doblada.",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Nogal Oscuro", hex: "#5c4033" },
    ],
    sizes: ["Mediano (50cm)", "Largo (80cm)"],
    features: ["Madera certificada FSC", "Diseño ergonómico (+10cm altura)"]
  },
  {
    id: "5",
    title: "Organizador Modular",
    titleHighlight: "ClearBox",
    price: 34.50,
    oldPrice: null,
    discount: "",
    badge: "",
    category: "Almacenamiento",
    imageUrl: "https://images.unsplash.com/photo-1584852924151-50e93433ea21?q=80&w=800&auto=format&fit=crop",
    description: "Set de cajas organizadoras de acrílico premium transparente apilables.",
    images: [
      "https://images.unsplash.com/photo-1584852924151-50e93433ea21?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: ["Set de 4 Piezas", "Set de 8 Piezas"],
    features: ["Acrílico resistente a arañazos", "Diseño modular encastrable"]
  },
  {
    id: "6",
    title: "Aspiradora Portátil",
    titleHighlight: "AeroClean",
    price: 189.90,
    oldPrice: 220.00,
    discount: "-14%",
    badge: "Top Ventas",
    category: "Gadgets",
    imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop",
    description: "Aspiradora de mano ultraligera con motor brushless de alta potencia.",
    images: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Blanco Ártico", hex: "#f4f6f7" },
    ],
    features: ["Motor digital 120.000 RPM", "Peso pluma: solo 600g"]
  }
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}
