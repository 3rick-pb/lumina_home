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
    title: "Difusor Ultrasónico",
    titleHighlight: "Aroma",
    price: 49.90,
    oldPrice: 65.00,
    discount: "-23%",
    badge: "Bestseller",
    category: "Aromaterapia",
    imageUrl: "https://images.unsplash.com/photo-1608528577891-eb055944f2e1?q=80&w=800&auto=format&fit=crop",
    description: "Difusor de aceites esenciales con diseño minimalista de cerámica mate. Capacidad de 300ml, luz ambiental LED cálida y temporizador inteligente.",
    images: [
      "https://images.unsplash.com/photo-1608528577891-eb055944f2e1?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Blanco Mate", hex: "#f0f0f0" },
      { name: "Negro Obsidiana", hex: "#1a1a1a" },
      { name: "Terracota", hex: "#e2725b" }
    ],
    features: [
      "Material cerámico artesanal",
      "Apagado automático",
      "Cubre hasta 40 metros cuadrados",
      "Ultrasilencioso (< 20dB)"
    ]
  },
  {
    id: "2",
    title: "Lámpara de Escritorio",
    titleHighlight: "Orbit",
    price: 129.50,
    oldPrice: 159.00,
    discount: "-18%",
    badge: "Nuevo",
    category: "Iluminación",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    description: "Lámpara inteligente con brazo articulado de aluminio espacial. Ajuste de temperatura de color continuo y carga inalámbrica integrada en la base.",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517070208541-6ddc4d3efbcb?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Plata Espacial", hex: "#c0c0c0" },
      { name: "Negro Mate", hex: "#222222" }
    ],
    features: [
      "Carga Qi de 15W integrada",
      "Aluminio aeroespacial anodizado",
      "Control táctil sin botones",
      "Luz sin parpadeo (Eye-care)"
    ]
  },
  {
    id: "3",
    title: "Soporte de Monitor",
    titleHighlight: "ErgoWood",
    price: 89.90,
    oldPrice: null,
    discount: "",
    badge: "",
    category: "Home Office",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
    description: "Soporte elevador para monitor esculpido en una sola pieza de madera de nogal doblada. Mejora la postura y ofrece espacio de almacenamiento inferior para el teclado.",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Nogal Oscuro", hex: "#5c4033" },
      { name: "Arce Claro", hex: "#d8c3a5" }
    ],
    sizes: ["Mediano (50cm)", "Largo (80cm)"],
    features: [
      "Madera certificada FSC",
      "Diseño ergonómico (+10cm altura)",
      "Acabado a mano con cera natural",
      "Soporta hasta 30kg"
    ]
  },
  {
    id: "4",
    title: "Manta Nórdica",
    titleHighlight: "Chunky",
    price: 119.90,
    oldPrice: 149.90,
    discount: "-20%",
    badge: "Tendencia",
    category: "Textiles",
    imageUrl: "https://images.unsplash.com/photo-1580828343064-fde4cad202d0?q=80&w=800&auto=format&fit=crop",
    description: "Manta XXL tejida a mano con lana merina 100% natural, extremadamente suave. El peso aporta propiedades relajantes y decorativas inigualables.",
    images: [
      "https://images.unsplash.com/photo-1580828343064-fde4cad202d0?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1572973715694-df9f37cbb1a9?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Beige Avena", hex: "#d7cdbc" },
      { name: "Gris Nube", hex: "#a4a8aa" },
      { name: "Mostaza", hex: "#e1ad01" }
    ],
    sizes: ["Cama Individual (100x120)", "Cama Matrimonial (150x200)"],
    features: [
      "Lana merina libre de crueldad",
      "Tejido artesanal sin agujas",
      "Termorreguladora y transpirable",
      "Propiedades hipoalergénicas"
    ]
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
    description: "Set de cajas organizadoras de acrílico premium transparente apilables. Ideales para maquillaje, papelería de oficina o accesorios pequeños.",
    images: [
      "https://images.unsplash.com/photo-1584852924151-50e93433ea21?q=80&w=1200&auto=format&fit=crop"
    ],
    sizes: ["Set de 4 Piezas", "Set de 8 Piezas"],
    features: [
      "Acrílico resistente a arañazos",
      "Diseño modular encastrable",
      "Totalmente transparente",
      "Fácil limpieza"
    ]
  },
  {
    id: "6",
    title: "Set Velas de Soja",
    titleHighlight: "Serenity",
    price: 59.00,
    oldPrice: 75.00,
    discount: "-21%",
    badge: "Regalo Ideal",
    category: "Aromaterapia",
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800&auto=format&fit=crop",
    description: "Trío de velas aromáticas vertidas a mano con cera de soja 100% natural. Fragancias: Higo Salvaje, Lavanda & Sándalo, y Té Blanco.",
    images: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1200&auto=format&fit=crop"
    ],
    features: [
      "Cera de soja ecológica",
      "Mecha de algodón sin plomo",
      "Duración total: 120 horas",
      "Aceites esenciales botánicos"
    ]
  },
  {
    id: "7",
    title: "Aspiradora Portátil",
    titleHighlight: "AeroClean",
    price: 189.90,
    oldPrice: 220.00,
    discount: "-14%",
    badge: "Top Ventas",
    category: "Gadgets",
    imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop",
    description: "Aspiradora de mano ultraligera con motor brushless de alta potencia. Diseño cilíndrico futurista en aluminio, tan bonita que querrás dejarla a la vista.",
    images: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Blanco Ártico", hex: "#f4f6f7" },
      { name: "Gris Titanio", hex: "#5f6368" }
    ],
    features: [
      "Motor digital 120.000 RPM",
      "Peso pluma: solo 600g",
      "Filtro HEPA lavable",
      "Carga rápida USB-C"
    ]
  },
  {
    id: "8",
    title: "Teclado Mecánico",
    titleHighlight: "ZenType",
    price: 149.50,
    oldPrice: null,
    discount: "",
    badge: "",
    category: "Home Office",
    imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop",
    description: "Teclado mecánico inalámbrico de perfil bajo diseñado para productividad y estética de escritorio. Switches táctiles silenciosos y conectividad multi-dispositivo.",
    images: [
      "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1200&auto=format&fit=crop"
    ],
    colors: [
      { name: "Blanco Leche", hex: "#fdfdfd" },
      { name: "Bicolor Nuez/Gris", hex: "#8b7e71" }
    ],
    features: [
      "Conexión Bluetooth hasta 3 dispositivos",
      "Batería para 2 meses",
      "Teclas PBT antidesgaste",
      "Compatible con Mac y Windows"
    ]
  }
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}
