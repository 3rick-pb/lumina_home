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
    c1: "#fef08a",
    c2: "#fde047",
    c3: "#fef9c3",
    mood: "iluminacion",
    browserColor: "#edd387", // Cálido ámbar mate visible
  },
  aromaterapia: {
    c1: "#fed7aa",
    c2: "#fbcfe8",
    c3: "#ffedd5",
    mood: "aromaterapia",
    browserColor: "#dfb79c", // Terracota melocotón mate visible
  },
  textiles: {
    c1: "#e9d5ff",
    c2: "#ddd6fe",
    c3: "#f3e8ff",
    mood: "textiles",
    browserColor: "#ccbde3", // Lavanda artesanal mate visible
  },
  "home office": {
    c1: "#bbf7d0",
    c2: "#bae6fd",
    c3: "#e0f2fe",
    mood: "home office",
    browserColor: "#b5d3c3", // Eucalipto fresco mate visible
  },
  almacenamiento: {
    c1: "#c7d2fe",
    c2: "#e0e7ff",
    c3: "#f1f5f9",
    mood: "almacenamiento",
    browserColor: "#bccfe3", // Pizarra cristal mate visible
  },
  gadgets: {
    c1: "#cbd5e1",
    c2: "#94a3b8",
    c3: "#e2e8f0",
    mood: "gadgets",
    browserColor: "#c3ccd6", // Titanio plateado mate visible
  },
  ceramica: {
    c1: "#fed7aa",
    c2: "#f5d0b0",
    c3: "#fbf3ea",
    mood: "ceramica",
    browserColor: "#dec0a8", // Arcilla gres mate visible
  },
  decoracion: {
    c1: "#e2e8f0",
    c2: "#cbd5e1",
    c3: "#f8fafc",
    mood: "decoracion",
    browserColor: "#c9ced4", // Travertino piedra mate visible
  },
  cocina: {
    c1: "#fed7aa",
    c2: "#fde68a",
    c3: "#fef3c7",
    mood: "cocina",
    browserColor: "#d8ba9e", // Roble tostado café mate visible
  },
  bienestar: {
    c1: "#dcfce7",
    c2: "#d1fae5",
    c3: "#f0fdf4",
    mood: "bienestar",
    browserColor: "#b6d6c1", // Menta y salvia mate visible
  },
  auth: {
    c1: "#eedec7",
    c2: "#dce4dc",
    c3: "#e7dfd5",
    mood: "auth",
    browserColor: "#8c9276",
  },
  default: {
    c1: "#eae3d9",
    c2: "#dce4dc",
    c3: "#f2e9dc",
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
  // Ensure a rich, visible matte tone that matches both browser bar and page background
  const effectiveSat = Math.max(22, Math.min(s, 42));
  const unifiedColor = hslToHex(h, effectiveSat, 71);

  return {
    c1: unifiedColor,
    c2: hslToHex((h + 15) % 360, Math.max(18, effectiveSat - 5), 74),
    c3: hslToHex((h - 12 + 360) % 360, Math.max(15, effectiveSat - 8), 76),
    mood: `product-${hex}`,
    browserColor: unifiedColor,
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
