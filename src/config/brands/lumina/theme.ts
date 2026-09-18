import { ThemeConfig } from '../../types';

/**
 * REFERENCE MODEL IMPLEMENTATION
 * Theme: Lumina Luxury Editorial & Liquid Glass
 * 
 * Defines all design tokens and visual expressions of Lumina Home.
 */
export const luminaThemeConfig: ThemeConfig = {
  id: 'lumina-theme',
  name: 'Lumina Luxury Editorial',
  colors: {
    primary: {
      50: '#f4f5f0',
      100: '#e5e8da',
      200: '#cbd4b7',
      300: '#aab88c',
      400: '#899b66',
      500: '#6c804b',
      600: '#526437',
      700: '#42502e',
      800: '#364128',
      900: '#303825',
      DEFAULT: '#526437',
    },
    accent: {
      50: '#fdf6f5',
      100: '#fbf0ed',
      200: '#f6dbd5',
      300: '#f0beb2',
      400: '#e59785',
      500: '#d56b53',
      600: '#c24b33',
      700: '#a33b26',
      800: '#873322',
      900: '#712d1f',
      DEFAULT: '#c24b33',
    },
    brandAccent: '#8c9276', // Signature Lumina Olive hue for badges, dots, sparkles
    heroGold: '#d2b48c', // Signature italic display highlight in Hero
    surface: {
      backgroundLight: '#f8f9fa',
      backgroundDark: '#161618',
      cardLight: 'rgba(255, 255, 255, 0.70)',
      cardDark: 'rgba(24, 24, 27, 0.70)',
      borderLight: 'rgba(255, 255, 255, 0.80)',
      borderDark: 'rgba(255, 255, 255, 0.10)',
    },
  },
  typography: {
    fontSans: 'var(--font-inter), sans-serif',
    fontDisplay: 'var(--font-lora), serif',
    fontBrand: "var(--font-moonwalk), 'Moonwalk', sans-serif",
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
    heroStyle: 'immersive-glass',
    productCardStyle: 'luxury-editorial',
  },
};
