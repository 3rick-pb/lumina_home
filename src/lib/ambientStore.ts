import { create } from 'zustand';

export interface AmbientTheme {
  c1: string;
  c2: string;
  c3: string;
  mood?: string;
  browserColor?: string;
}

export function syncBrowserThemeColor(color: string) {
  if (typeof document === "undefined") return;
  try {
    const metaTags = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (metaTags.length === 0) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = color;
      document.head.appendChild(meta);
    } else {
      metaTags.forEach((meta) => {
        meta.setAttribute("content", color);
      });
    }

    const msMeta = document.querySelector<HTMLMetaElement>('meta[name="msapplication-navbutton-color"]');
    if (msMeta) {
      msMeta.setAttribute("content", color);
    }
  } catch {}
}

export const CATEGORY_THEMES: Record<string, AmbientTheme> = {
  iluminacion: {
    c1: "#fef08a", // Cálido ámbar suave
    c2: "#fde047", // Luz dorada suave
    c3: "#fef9c3", // Crema iluminada
    mood: "iluminacion",
    browserColor: "#c89e3a",
  },
  aromaterapia: {
    c1: "#fed7aa", // Melocotón terracota suave
    c2: "#fbcfe8", // Rosa arcilla sutil
    c3: "#ffedd5", // Arena cálida
    mood: "aromaterapia",
    browserColor: "#c28562",
  },
  textiles: {
    c1: "#e9d5ff", // Lavanda suave
    c2: "#ddd6fe", // Lino violeta tenue
    c3: "#f3e8ff", // Algodón nube
    mood: "textiles",
    browserColor: "#857099",
  },
  "home office": {
    c1: "#bbf7d0", // Salvia / eucalipto fresco
    c2: "#bae6fd", // Cielo pizarra suave
    c3: "#e0f2fe", // Niebla matutina
    mood: "home office",
    browserColor: "#588373",
  },
  almacenamiento: {
    c1: "#c7d2fe", // Hielo cristalino
    c2: "#e0e7ff", // Acrílico limpio
    c3: "#f1f5f9", // Blanco escarcha
    mood: "almacenamiento",
    browserColor: "#5e7794",
  },
  gadgets: {
    c1: "#cbd5e1", // Titanio suave
    c2: "#94a3b8", // Pizarra plateada
    c3: "#e2e8f0", // Perla mate
    mood: "gadgets",
    browserColor: "#5f6a75",
  },
  ceramica: {
    c1: "#fed7aa", // Arcilla cocida suave
    c2: "#f5d0b0", // Terracota fina
    c3: "#fbf3ea", // Caolín suave
    mood: "ceramica",
    browserColor: "#b0775a",
  },
  decoracion: {
    c1: "#e2e8f0", // Piedra caliza
    c2: "#cbd5e1", // Travertino
    c3: "#f8fafc", // Mármol cálido
    mood: "decoracion",
    browserColor: "#70757a",
  },
  cocina: {
    c1: "#fed7aa", // Roble y café tostado
    c2: "#fde68a", // Canela sutil
    c3: "#fef3c7", // Vainilla
    mood: "cocina",
    browserColor: "#9c6d48",
  },
  bienestar: {
    c1: "#dcfce7", // Salvia fresca
    c2: "#d1fae5", // Menta suave
    c3: "#f0fdf4", // Nube verde
    mood: "bienestar",
    browserColor: "#56876c",
  },
  auth: {
    c1: "#eedec7", // Cachemira suave
    c2: "#dce4dc", // Salvia niebla
    c3: "#e7dfd5", // Lino orgánico
    mood: "auth",
    browserColor: "#8c9276",
  },
  default: {
    c1: "#eae3d9", // Lino natural Lumina
    c2: "#dce4dc", // Salvia tenue
    c3: "#f2e9dc", // Crema cálida
    mood: "default",
    browserColor: "#8c9276",
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
  setTheme: (theme) => set((state) => {
    if (state.theme.mood === theme.mood && state.theme.c1 === theme.c1) return state;
    syncBrowserThemeColor(theme.browserColor || "#8c9276");
    return { theme };
  }),
  setCategoryTheme: (category) => {
    const key = category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "default";
    const found = CATEGORY_THEMES[key] || CATEGORY_THEMES.default;
    set((state) => {
      if (state.theme.mood === found.mood) return state;
      syncBrowserThemeColor(found.browserColor || "#8c9276");
      return { theme: found };
    });
  },
  resetTheme: () => set((state) => {
    if (state.theme.mood === CATEGORY_THEMES.default.mood) return state;
    syncBrowserThemeColor(CATEGORY_THEMES.default.browserColor || "#8c9276");
    return { theme: CATEGORY_THEMES.default };
  }),
}));
