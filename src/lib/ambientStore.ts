import { create } from 'zustand';

export interface AmbientTheme {
  c1: string;
  c2: string;
  c3: string;
  mood?: string;
}

export const CATEGORY_THEMES: Record<string, AmbientTheme> = {
  iluminacion: {
    c1: "#fef08a", // Cálido ámbar suave
    c2: "#fde047", // Luz dorada suave
    c3: "#fef9c3", // Crema iluminada
    mood: "iluminacion"
  },
  aromaterapia: {
    c1: "#fed7aa", // Melocotón terracota suave
    c2: "#fbcfe8", // Rosa arcilla sutil
    c3: "#ffedd5", // Arena cálida
    mood: "aromaterapia"
  },
  textiles: {
    c1: "#e9d5ff", // Lavanda suave
    c2: "#ddd6fe", // Lino violeta tenue
    c3: "#f3e8ff", // Algodón nube
    mood: "textiles"
  },
  "home office": {
    c1: "#bbf7d0", // Salvia / eucalipto fresco
    c2: "#bae6fd", // Cielo pizarra suave
    c3: "#e0f2fe", // Niebla matutina
    mood: "home office"
  },
  almacenamiento: {
    c1: "#c7d2fe", // Hielo cristalino
    c2: "#e0e7ff", // Acrílico limpio
    c3: "#f1f5f9", // Blanco escarcha
    mood: "almacenamiento"
  },
  gadgets: {
    c1: "#cbd5e1", // Titanio suave
    c2: "#94a3b8", // Pizarra plateada
    c3: "#e2e8f0", // Perla mate
    mood: "gadgets"
  },
  auth: {
    c1: "#eedec7", // Cachemira suave
    c2: "#dce4dc", // Salvia niebla
    c3: "#e7dfd5", // Lino orgánico
    mood: "auth"
  },
  default: {
    c1: "#eae3d9", // Lino natural Lumina
    c2: "#dce4dc", // Salvia tenue
    c3: "#f2e9dc", // Crema cálida
    mood: "default"
  }
};

interface AmbientState {
  theme: AmbientTheme;
  setTheme: (theme: AmbientTheme) => void;
  setCategoryTheme: (category: string) => void;
  resetTheme: () => void;
}

export const useAmbientStore = create<AmbientState>((set) => ({
  theme: CATEGORY_THEMES.default,
  setTheme: (theme) => set({ theme }),
  setCategoryTheme: (category) => {
    const key = category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "default";
    const found = CATEGORY_THEMES[key] || CATEGORY_THEMES.default;
    set({ theme: found });
  },
  resetTheme: () => set({ theme: CATEGORY_THEMES.default }),
}));
