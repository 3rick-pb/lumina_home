/**
 * E-COMMERCE CORE ARCHITECTURE
 * Configuration Types & Contracts
 * 
 * Formal boundary contracts for:
 * 1. BrandConfig (Identity & SEO)
 * 2. ThemeConfig (Visual Tokens & Variants)
 * 3. StoreConfig (Operational & Commercial Rules)
 */

import React from 'react';

// ============================================================================
// 1. BRAND CONFIGURATION CONTRACT
// ============================================================================
export interface BrandLogoConfig {
  text: string;
  accentDot: string;
  lightSrc?: string;
  darkSrc?: string;
  markSrc?: string;
  width?: number;
  height?: number;
  emblemComponent?: React.ComponentType<{ size?: number; className?: string; withGlow?: boolean }>;
}

export interface BrandContactConfig {
  email: string;
  supportEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  schedule?: string;
}

export interface BrandSocialConfig {
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export interface BrandMetaConfig {
  siteUrl: string;
  locale: string;
  creator: string;
  publisher: string;
  ogImage: string;
  keywords: string[];
}

export interface BrandConfig {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  slogan: string;
  description: string;
  logo: BrandLogoConfig;
  favicon: string;
  contact: BrandContactConfig;
  social: BrandSocialConfig;
  meta: BrandMetaConfig;
}

// ============================================================================
// 2. THEME CONFIGURATION CONTRACT
// ============================================================================
export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  DEFAULT: string;
}

export interface ThemeColorsConfig {
  primary: ColorPalette;
  accent: ColorPalette;
  brandAccent: string; // Signature highlight (e.g. olive dot / sparkles)
  heroGold: string; // Signature display accent
  surface: {
    backgroundLight: string;
    backgroundDark: string;
    cardLight: string;
    cardDark: string;
    borderLight: string;
    borderDark: string;
  };
}

export interface ThemeTypographyConfig {
  fontSans: string;
  fontDisplay: string;
  fontBrand: string;
}

export interface ThemeBorderRadiusConfig {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface ThemeVariantsConfig {
  headerStyle: 'floating-glass-pill' | 'fixed-minimal' | 'centered-classic';
  heroStyle: 'immersive-glass' | 'split-editorial' | 'minimal-banner';
  productCardStyle: 'luxury-editorial' | 'compact-grid' | 'minimal-modern';
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: ThemeColorsConfig;
  typography: ThemeTypographyConfig;
  borderRadius: ThemeBorderRadiusConfig;
  variants: ThemeVariantsConfig;
}

// ============================================================================
// 3. STORE CONFIGURATION CONTRACT
// ============================================================================
export interface StoreCurrencyConfig {
  code: string; // e.g. "USD", "EUR"
  symbol: string; // e.g. "$"
  decimals: number; // e.g. 2
  format: 'standard' | 'symbol-first' | 'code-first';
}

export interface StoreRegionalConfig {
  country: string;
  countryCode: string;
  locale: string;
  defaultCity: string;
  defaultState: string;
}

export interface StoreShippingConfig {
  freeShippingThreshold: number; // Order total threshold for free shipping
  standardCost: number; // Flat rate when below threshold
  deliveryEstimate: string; // e.g. "Express 24/48h"
  freeShippingLabel: string; // e.g. "Gratis en compras superiores a $100"
}

export interface StoreTaxConfig {
  rate: number; // e.g. 0.15 for 15%
  includedInPrice: boolean;
  taxLabel: string; // e.g. "IVA incluido"
}

export interface StoreFeaturesConfig {
  enableReviews: boolean;
  enableCoupons: boolean;
  enableSoundEffects: boolean;
  enableCartAlerts: boolean;
  enableLiveRadar: boolean;
  enableCombos: boolean;
  enableDropiExport: boolean;
  enablePayPhone: boolean;
  enableCashOnDelivery: boolean;
  enableBankTransfer: boolean;
}

export interface StoreCouponFallback {
  code: string;
  discountPercent: number;
  isFreeShipping: boolean;
  message: string;
}

export interface StoreConfig {
  id: string;
  currency: StoreCurrencyConfig;
  regional: StoreRegionalConfig;
  shipping: StoreShippingConfig;
  tax: StoreTaxConfig;
  features: StoreFeaturesConfig;
  defaultCoupons: StoreCouponFallback[];
}

// ============================================================================
// 4. UNIFIED COMPOSITE CORE CONFIG
// ============================================================================
export interface CoreConfig {
  brand: BrandConfig;
  theme: ThemeConfig;
  store: StoreConfig;
}
