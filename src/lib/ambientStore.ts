import { create } from 'zustand';

export interface AmbientTheme {
  c1: string;
  c2: string;
  c3: string;
  mood?: string;
  browserColor?: string;
}

export const LUMINA_DEFAULT_BROWSER_COLOR = "#8c9276";

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

function hexToHsl(hex: string): [number, number, number] {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return [40, 20, 90];
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return [h, Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function createProductAmbientTheme(hex?: string, category?: string): AmbientTheme {
  const normCat = category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "default";
  const catTheme = CATEGORY_THEMES[normCat] || CATEGORY_THEMES.default;

  if (!hex || !hex.startsWith("#")) {
    return catTheme;
  }

  const [h, s] = hexToHsl(hex);
  // Ensure soft, pastel, airy matte background tones (91-96% lightness)
  const effectiveSat = Math.max(20, Math.min(s, 60));
  const c1 = hslToHex(h, effectiveSat, 92);
  const c2 = hslToHex((h + 18) % 360, Math.max(15, effectiveSat - 5), 94);
  const c3 = hslToHex((h - 15 + 360) % 360, Math.max(12, effectiveSat - 10), 96);
  
  // Browser toolbar color requires good contrast for Chrome Android (lightness 38-46%, saturation 45-75%)
  const browserColor = catTheme.browserColor || hslToHex(h, Math.max(45, Math.min(s, 75)), 42);

  return {
    c1,
    c2,
    c3,
    mood: `product-${hex}`,
    browserColor,
  };
}

interface AmbientState {
  theme: AmbientTheme;
  isProductView: boolean;
  setTheme: (theme: AmbientTheme) => void;
  // Used when exploring catalog (scroll or hover) - updates ONLY the matte background, NEVER the browser color
  setCategoryTheme: (category: string) => void;
  resetTheme: () => void;
  // Used ONLY when viewing a specific product - updates BOTH the matte background AND the browser toolbar color
  setProductAmbient: (params: { category: string; colorHex?: string }) => void;
  resetProductAmbient: () => void;
}

export const useAmbientStore = create<AmbientState>((set) => ({
  theme: CATEGORY_THEMES.default,
  isProductView: false,
  setTheme: (theme) => set({ theme }),
  setCategoryTheme: (category) => {
    const key = category?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "default";
    const found = CATEGORY_THEMES[key] || CATEGORY_THEMES.default;
    set((state) => {
      // If currently on a product detail page, do not override with catalog background
      if (state.isProductView) return state;
      if (state.theme.mood === found.mood) return state;
      // NOTE: During catalog exploration, browser color is conserved! We DO NOT call syncBrowserThemeColor.
      return { theme: found };
    });
  },
  resetTheme: () => set((state) => {
    if (state.isProductView) return state;
    if (state.theme.mood === CATEGORY_THEMES.default.mood) return state;
    return { theme: CATEGORY_THEMES.default };
  }),
  setProductAmbient: ({ category, colorHex }) => {
    const theme = createProductAmbientTheme(colorHex, category);
    set(() => {
      // In product view, we ALWAYS update both the matte background and the browser toolbar color across all devices!
      syncBrowserThemeColor(theme.browserColor || LUMINA_DEFAULT_BROWSER_COLOR);
      return { theme, isProductView: true };
    });
  },
  resetProductAmbient: () => {
    set(() => {
      // When leaving product view, reset browser color back to Lumina Olive #8c9276 and theme to default
      syncBrowserThemeColor(LUMINA_DEFAULT_BROWSER_COLOR);
      return { theme: CATEGORY_THEMES.default, isProductView: false };
    });
  },
}));
