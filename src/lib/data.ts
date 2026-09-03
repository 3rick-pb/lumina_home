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
    badge: "Más Vendido",
    category: "Iluminación",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    description: "Lámpara inteligente con brazo articulado de aluminio espacial. Ajuste de temperatura de color continuo y luz cálida regulable.",
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
    imageUrl: "https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=800&auto=format&fit=crop",
    description: "Difusor de aceites esenciales con diseño minimalista de cerámica mate. Capacidad de 300ml, luz ambiental LED cálida y temporizador.",
    images: [
      "https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Blanco Piedra", hex: "#f0f0f0" },
      { name: "Terracota", hex: "#e2725b" },
    ],
    features: ["Material cerámico artesanal", "Apagado automático", "Vapor frío ultrasónico"]
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
    imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop",
    description: "Manta XXL tejida a mano con hilo de algodón 100% orgánico, extraordinariamente suave y acogedora para tu sofá o cama.",
    images: [
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Beige Avena", hex: "#d7cdbc" },
      { name: "Gris Nube", hex: "#cbd5e1" }
    ],
    sizes: ["Individual (120x150cm)", "Queen (160x200cm)"],
    features: ["Algodón orgánico peinado", "Tejido térmico transpirable", "Lavable a máquina"]
  },
  {
    id: "4",
    title: "Soporte de Monitor",
    titleHighlight: "ErgoWood",
    price: 89.90,
    oldPrice: 109.90,
    discount: "-18%",
    badge: "Recomendado",
    category: "Home Office",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
    description: "Soporte elevador para monitor esculpido en una sola pieza de madera de nogal doblada, con bandeja para teclado.",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Nogal Oscuro", hex: "#5c4033" },
      { name: "Roble Claro", hex: "#deb887" }
    ],
    sizes: ["Estándar (50cm)", "Doble Monitor (100cm)"],
    features: ["Madera natural curvada", "Soporta hasta 25kg", "Pies de corcho antiarañazos"]
  },
  {
    id: "5",
    title: "Organizador Modular",
    titleHighlight: "ClearBox",
    price: 34.50,
    oldPrice: null,
    discount: "",
    badge: "Nuevo",
    category: "Almacenamiento",
    imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop",
    description: "Set de cajones y bandejas de acrílico premium transparente apilables para cosméticos, joyería o papelería.",
    images: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: ["Pack 3 mediano", "Pack 2 grande"],
    features: ["Acrílico cristalino 4mm", "Diseño apilable modular", "Bordes pulidos a diamante"]
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
    description: "Aspiradora de mano ultraligera con motor brushless de alta potencia y filtro HEPA lavable.",
    images: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Gris Espacial", hex: "#374151" },
      { name: "Blanco Perla", hex: "#f8fafc" }
    ],
    features: ["Motor digital 120.000 RPM", "Autonomía de 45 minutos", "Filtro ciclónico multicapa"]
  }
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}
