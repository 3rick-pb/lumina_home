import { ThemeConfig } from '../../types';

/**
 * THEME & VISUAL TOKENS CONFIGURATION
 * Brand: Aura Studio
 * Generated automatically by E-Commerce Brand Generator Engine.
 */
export const auraStudioThemeConfig: ThemeConfig = {
  id: 'aura-studio-theme',
  name: 'Aura Studio Visual Identity',
  colors: {
    primary: {
      "50": "#ededec",
      "100": "#d6d6d5",
      "200": "#b0afae",
      "300": "#82817f",
      "400": "#555351",
      "500": "#1c1917",
      "600": "#19191b",
      "700": "#17181e",
      "800": "#151821",
      "900": "#131825",
      "DEFAULT": "#1c1917"
},
    accent: {
      "50": "#f7f5f4",
      "100": "#eee8e6",
      "200": "#ded3ce",
      "300": "#cbb9b1",
      "400": "#b9a095",
      "500": "#a18072",
      "600": "#846b64",
      "700": "#6a5857",
      "800": "#51464a",
      "900": "#38343e",
      "DEFAULT": "#a18072"
},
    brandAccent: '#d4a574',
    heroGold: '#c5a059',
    surface: {
      backgroundLight: '#fafaf9',
      backgroundDark: '#0c0a09',
      cardLight: 'rgba(255, 255, 255, 0.75)',
      cardDark: 'rgba(28, 25, 23, 0.75)',
      borderLight: 'rgba(255, 255, 255, 0.80)',
      borderDark: 'rgba(255, 255, 255, 0.10)',
    },
  },
  typography: {
    fontSans: 'var(--font-inter), sans-serif',
    fontDisplay: 'var(--font-lora), serif',
    fontBrand: "var(--font-moonwalk), sans-serif",
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },
  variants: {
    headerStyle: 'floating-glass-pill',
    heroStyle: 'split-editorial',
    productCardStyle: 'luxury-editorial',
  },
};
