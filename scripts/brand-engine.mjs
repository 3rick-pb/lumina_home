#!/usr/bin/env node

/**
 * E-COMMERCE CORE — BRAND GENERATOR & ARCHITECTURE ENGINE
 * 
 * High-performance, zero-dependency Node.js CLI & Automation Engine.
 * Manages brand lifecycle, manifests, validation, AI analysis ingestion,
 * dynamic code generation, atomic activations, and codebase health scanning.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BRANDS_DIR = path.join(PROJECT_ROOT, 'src', 'config', 'brands');
const ACTIVE_BRAND_FILE = path.join(PROJECT_ROOT, 'src', 'config', 'active-brand.ts');
const STATE_DIR = path.join(PROJECT_ROOT, '.brand-state');
const PREVIOUS_BRAND_FILE = path.join(STATE_DIR, 'previous-brand.json');

// Ensure state dir exists
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// ============================================================================
// COLOR MATH & PALETTE GENERATION (HEX -> 50..900 scale)
// ============================================================================

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function mixRgb(rgb1, rgb2, weight) {
  const w = Math.max(0, Math.min(1, weight));
  return {
    r: rgb1.r * (1 - w) + rgb2.r * w,
    g: rgb1.g * (1 - w) + rgb2.g * w,
    b: rgb1.b * (1 - w) + rgb2.b * w
  };
}

export function generateTonalScale(baseHex) {
  const baseRgb = hexToRgb(baseHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 15, g: 23, b: 42 }; // Dark slate

  return {
    50: rgbToHex(mixRgb(baseRgb, white, 0.92).r, mixRgb(baseRgb, white, 0.92).g, mixRgb(baseRgb, white, 0.92).b),
    100: rgbToHex(mixRgb(baseRgb, white, 0.82).r, mixRgb(baseRgb, white, 0.82).g, mixRgb(baseRgb, white, 0.82).b),
    200: rgbToHex(mixRgb(baseRgb, white, 0.65).r, mixRgb(baseRgb, white, 0.65).g, mixRgb(baseRgb, white, 0.65).b),
    300: rgbToHex(mixRgb(baseRgb, white, 0.45).r, mixRgb(baseRgb, white, 0.45).g, mixRgb(baseRgb, white, 0.45).b),
    400: rgbToHex(mixRgb(baseRgb, white, 0.25).r, mixRgb(baseRgb, white, 0.25).g, mixRgb(baseRgb, white, 0.25).b),
    500: baseHex,
    600: rgbToHex(mixRgb(baseRgb, black, 0.20).r, mixRgb(baseRgb, black, 0.20).g, mixRgb(baseRgb, black, 0.20).b),
    700: rgbToHex(mixRgb(baseRgb, black, 0.38).r, mixRgb(baseRgb, black, 0.38).g, mixRgb(baseRgb, black, 0.38).b),
    800: rgbToHex(mixRgb(baseRgb, black, 0.55).r, mixRgb(baseRgb, black, 0.55).g, mixRgb(baseRgb, black, 0.55).b),
    900: rgbToHex(mixRgb(baseRgb, black, 0.72).r, mixRgb(baseRgb, black, 0.72).g, mixRgb(baseRgb, black, 0.72).b),
    DEFAULT: baseHex,
  };
}

// ============================================================================
// SLUG & IDENTIFIER SANITIZATION
// ============================================================================

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'El slug no puede estar vacío.' };
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { 
      valid: false, 
      error: `Slug inválido: "${slug}". Solo se permiten minúsculas, números y guiones sencillos.` 
    };
  }
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    return { valid: false, error: 'Intento de Path Traversal bloqueado.' };
  }
  return { valid: true };
}

// ============================================================================
// TEMPLATE CODE GENERATORS
// ============================================================================

function generateBrandCode(data) {
  return `import { BrandConfig } from '../../types';

/**
 * BRAND IDENTITY CONFIGURATION
 * Brand: ${data.name}
 * Generated automatically by E-Commerce Brand Generator Engine.
 */
export const ${data.camelCase}BrandConfig: BrandConfig = {
  id: '${data.slug}',
  name: '${data.name}',
  shortName: '${data.shortName}',
  tagline: '${data.tagline}',
  slogan: '${data.slogan}',
  description: '${data.description}',
  logo: {
    text: '${data.shortName}',
    accentDot: '${data.accentDot || '.'}',
    markSrc: '/favicon.ico',
  },
  favicon: '/favicon.ico',
  contact: {
    email: '${data.contactEmail}',
    supportEmail: '${data.supportEmail}',
    phone: '${data.phone}',
    whatsapp: '${data.whatsapp}',
    address: '${data.address}',
    schedule: '${data.schedule}',
  },
  social: {
    instagram: '${data.instagram}',
    facebook: '${data.facebook}',
  },
  meta: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '${data.siteUrl}',
    locale: '${data.locale}',
    creator: '${data.name}',
    publisher: '${data.publisher}',
    ogImage: '${data.ogImage}',
    keywords: ${JSON.stringify(data.keywords, null, 6)},
  },
};
`;
}

function generateThemeCode(data) {
  const primaryScale = generateTonalScale(data.primaryColor);
  const accentScale = generateTonalScale(data.accentColor);

  return `import { ThemeConfig } from '../../types';

/**
 * THEME & VISUAL TOKENS CONFIGURATION
 * Brand: ${data.name}
 * Generated automatically by E-Commerce Brand Generator Engine.
 */
export const ${data.camelCase}ThemeConfig: ThemeConfig = {
  id: '${data.slug}-theme',
  name: '${data.name} Visual Identity',
  colors: {
    primary: ${JSON.stringify(primaryScale, null, 6)},
    accent: ${JSON.stringify(accentScale, null, 6)},
    brandAccent: '${data.brandAccent || data.primaryColor}',
    heroGold: '${data.heroGold || data.accentColor}',
    surface: {
      backgroundLight: '${data.backgroundLight || '#f8f9fa'}',
      backgroundDark: '${data.backgroundDark || '#161618'}',
      cardLight: '${data.cardLight || 'rgba(255, 255, 255, 0.70)'}',
      cardDark: '${data.cardDark || 'rgba(24, 24, 27, 0.70)'}',
      borderLight: '${data.borderLight || 'rgba(255, 255, 255, 0.80)'}',
      borderDark: '${data.borderDark || 'rgba(255, 255, 255, 0.10)'}',
    },
  },
  typography: {
    fontSans: '${data.fontSans || 'var(--font-inter), sans-serif'}',
    fontDisplay: '${data.fontDisplay || 'var(--font-lora), serif'}',
    fontBrand: "${data.fontBrand || "var(--font-moonwalk), sans-serif"}",
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
    headerStyle: '${data.headerStyle || 'floating-glass-pill'}',
    heroStyle: '${data.heroStyle || 'immersive-glass'}',
    productCardStyle: '${data.productCardStyle || 'luxury-editorial'}',
  },
};
`;
}

function generateStoreCode(data) {
  return `import { StoreConfig } from '../../types';

/**
 * STORE OPERATIONS & COMMERCE RULES
 * Brand: ${data.name}
 * Generated automatically by E-Commerce Brand Generator Engine.
 */
export const ${data.camelCase}StoreConfig: StoreConfig = {
  id: '${data.slug}-store',
  currency: {
    code: '${data.currencyCode || 'USD'}',
    symbol: '${data.currencySymbol || '$'}',
    decimals: ${data.currencyDecimals ?? 2},
    format: '${data.currencyFormat || 'standard'}',
  },
  regional: {
    country: '${data.country || 'Ecuador'}',
    countryCode: '${data.countryCode || 'EC'}',
    locale: '${data.locale || 'es-EC'}',
    defaultCity: '${data.defaultCity || 'Quito'}',
    defaultState: '${data.defaultState || 'Pichincha'}',
  },
  shipping: {
    freeShippingThreshold: ${data.freeShippingThreshold ?? 100},
    standardCost: ${data.standardShippingCost ?? 4.99},
    deliveryEstimate: '${data.deliveryEstimate || 'Express 24/48h'}',
    freeShippingLabel: '${data.freeShippingLabel || 'Envío gratis en compras seleccionadas'}',
  },
  tax: {
    rate: ${data.taxRate ?? 0.15},
    includedInPrice: ${data.taxIncludedInPrice ?? true},
    taxLabel: '${data.taxLabel || 'IVA incluido'}',
  },
  features: {
    enableReviews: ${data.enableReviews ?? false},
    enableCoupons: ${data.enableCoupons ?? true},
    enableSoundEffects: ${data.enableSoundEffects ?? true},
    enableCartAlerts: ${data.enableCartAlerts ?? true},
    enableLiveRadar: ${data.enableLiveRadar ?? true},
    enableCombos: ${data.enableCombos ?? true},
    enableDropiExport: ${data.enableDropiExport ?? true},
    enablePayPhone: ${data.enablePayPhone ?? true},
    enableCashOnDelivery: ${data.enableCashOnDelivery ?? true},
    enableBankTransfer: ${data.enableBankTransfer ?? true},
  },
  defaultCoupons: [
    {
      code: 'BIENVENIDO',
      discountPercent: 10,
      isFreeShipping: false,
      message: '¡Cupón BIENVENIDO aplicado con éxito!',
    },
    {
      code: 'ENVIOGRATIS',
      discountPercent: 0,
      isFreeShipping: true,
      message: '¡Cupón de Envío Gratuito aplicado con éxito!',
    },
  ],
};
`;
}

function toCamelCase(str) {
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}

// ============================================================================
// CORE COMMAND IMPLEMENTATIONS
// ============================================================================

export async function createBrand(name, options = {}) {
  let slug = options.slug;
  if (slug) {
    const rawSlugValidation = validateSlug(slug);
    if (!rawSlugValidation.valid) {
      throw new Error(rawSlugValidation.error);
    }
  } else {
    slug = slugify(name);
  }
  const slugValidation = validateSlug(slug);
  if (!slugValidation.valid) {
    throw new Error(slugValidation.error);
  }

  if (slug === 'lumina') {
    throw new Error('No se puede crear o sobrescribir la marca protegida "lumina".');
  }

  const brandDir = path.join(BRANDS_DIR, slug);
  const exists = fs.existsSync(brandDir);

  if (exists && !options.rebuild) {
    throw new Error(`La marca "${slug}" ya existe en ${brandDir}. Usa -Rebuild para sobrescribir conscientemente.`);
  }

  // Handle AI analysis ingestion if provided
  let analysisData = null;
  if (options.analysis) {
    const analysisPath = path.resolve(process.cwd(), options.analysis);
    if (!fs.existsSync(analysisPath)) {
      throw new Error(`Archivo de análisis de marca no encontrado: ${analysisPath}`);
    }
    try {
      analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    } catch (err) {
      throw new Error(`Error al parsear el JSON de análisis: ${err.message}`);
    }
  }

  const camelCase = toCamelCase(slug);

  // Compile brand data from analysis or defaults
  const brandData = {
    slug,
    camelCase,
    name: analysisData?.identity?.name?.value || name,
    shortName: analysisData?.identity?.shortName?.value || name.split(' ')[0],
    tagline: analysisData?.identity?.tagline?.value || `Colección exclusiva de ${name}`,
    slogan: analysisData?.identity?.slogan?.value || 'Diseño y calidad para tu estilo de vida',
    description: analysisData?.identity?.description?.value || `Descubre productos seleccionados de ${name}. Calidad garantizada y envíos directos.`,
    accentDot: '.',
    contactEmail: `contacto@${slug}.com`,
    supportEmail: `soporte@${slug}.com`,
    phone: '+593 99 000 0000',
    whatsapp: '593990000000',
    address: 'Ecuador',
    schedule: 'Lunes a Viernes: 09:00 - 18:00',
    instagram: `https://instagram.com/${slug}`,
    facebook: `https://facebook.com/${slug}`,
    siteUrl: `https://${slug}.com`,
    locale: analysisData?.store?.regional?.value?.locale || 'es-EC',
    publisher: `${name} Studio`,
    ogImage: '/og-image.jpg',
    keywords: [name, 'tienda online', 'compras', 'ecommerce', 'ecuador'],

    // Theme values
    primaryColor: analysisData?.visual?.primaryColor?.value || '#2563eb',
    accentColor: analysisData?.visual?.accentColor?.value || '#ea580c',
    brandAccent: analysisData?.visual?.brandAccent?.value || '#3b82f6',
    heroGold: analysisData?.visual?.heroGold?.value || '#f59e0b',
    backgroundLight: analysisData?.visual?.surface?.backgroundLight?.value || '#f8f9fa',
    backgroundDark: analysisData?.visual?.surface?.backgroundDark?.value || '#161618',
    cardLight: analysisData?.visual?.surface?.cardLight?.value || 'rgba(255, 255, 255, 0.70)',
    cardDark: analysisData?.visual?.surface?.cardDark?.value || 'rgba(24, 24, 27, 0.70)',
    headerStyle: analysisData?.ecommerce?.recommendedVariants?.headerStyle?.value || 'floating-glass-pill',
    heroStyle: analysisData?.ecommerce?.recommendedVariants?.heroStyle?.value || 'immersive-glass',
    productCardStyle: analysisData?.ecommerce?.recommendedVariants?.productCardStyle?.value || 'luxury-editorial',

    // Store values
    currencyCode: analysisData?.store?.currency?.value?.code || 'USD',
    currencySymbol: analysisData?.store?.currency?.value?.symbol || '$',
    currencyDecimals: analysisData?.store?.currency?.value?.decimals || 2,
    country: analysisData?.store?.regional?.value?.country || 'Ecuador',
    countryCode: analysisData?.store?.regional?.value?.countryCode || 'EC',
    defaultCity: analysisData?.store?.regional?.value?.defaultCity || 'Quito',
    freeShippingThreshold: analysisData?.store?.shipping?.value?.freeShippingThreshold || 100,
    standardShippingCost: analysisData?.store?.shipping?.value?.standardCost || 4.99,
  };

  const manifest = {
    id: slug,
    slug,
    name: brandData.name,
    shortName: brandData.shortName,
    version: '1.0.0',
    status: 'DRAFT',
    source: analysisData ? 'ai-analysis' : 'manual',
    description: brandData.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: {
      brand: true,
      theme: true,
      store: true,
    },
    assets: {
      logo: false,
      favicon: false,
      ogImage: false,
      heroImage: false,
      banners: false,
    },
    validation: {
      status: 'pending',
      errors: [],
      warnings: analysisData?.missingInfo || ['Assets personalizados pendientes', 'Revisar datos de contacto'],
    },
    metadata: {
      analysisSource: options.analysis || null,
      certaintyScore: analysisData ? 0.85 : 0.50,
    }
  };

  const readmeContent = `# ${brandData.name} — Brand Package

> **ESTADO: ${manifest.status} · FUENTE: ${manifest.source.toUpperCase()}**
> Generado automáticamente por el E-Commerce Brand Generator Engine.

---

## 📋 Pasos para completar el lanzamiento de esta marca

1. **Revisar Identidad:** Verifica los datos de contacto y slogans en \`brand.ts\`.
2. **Revisar Paleta Visual:** Ajusta los colores principales en \`theme.ts\` si deseas afinar tonos.
3. **Colocar Assets:** Añade el logotipo y favicon en la carpeta \`assets/\`.
4. **Validar:** Ejecuta \`brand.ps1 validate "${slug}"\`.
5. **Previsualizar:** Ejecuta \`brand.ps1 preview "${slug}"\`.
6. **Activar:** Cuando todo esté validado, ejecuta \`brand.ps1 activate "${slug}"\`.

## 🎨 Identidad Visual
- **Primario:** \`${brandData.primaryColor}\`
- **Acento:** \`${brandData.accentColor}\`
- **Variantes:** Header (\`${brandData.headerStyle}\`), Hero (\`${brandData.heroStyle}\`), Cards (\`${brandData.productCardStyle}\`).
`;

  if (options.dryRun) {
    return {
      dryRun: true,
      slug,
      name: brandData.name,
      targetDir: brandDir,
      filesWouldCreate: [
        path.join(brandDir, 'brand.ts'),
        path.join(brandDir, 'theme.ts'),
        path.join(brandDir, 'store.ts'),
        path.join(brandDir, 'manifest.json'),
        path.join(brandDir, 'README.md'),
        path.join(brandDir, 'assets'),
      ],
      manifest,
      brandData,
    };
  }

  // Create directories
  fs.mkdirSync(brandDir, { recursive: true });
  fs.mkdirSync(path.join(brandDir, 'assets'), { recursive: true });

  // Write package files
  fs.writeFileSync(path.join(brandDir, 'brand.ts'), generateBrandCode(brandData), 'utf-8');
  fs.writeFileSync(path.join(brandDir, 'theme.ts'), generateThemeCode(brandData), 'utf-8');
  fs.writeFileSync(path.join(brandDir, 'store.ts'), generateStoreCode(brandData), 'utf-8');
  fs.writeFileSync(path.join(brandDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  fs.writeFileSync(path.join(brandDir, 'README.md'), readmeContent, 'utf-8');

  if (analysisData) {
    fs.writeFileSync(path.join(brandDir, 'analysis.json'), JSON.stringify(analysisData, null, 2), 'utf-8');
  }

  return {
    success: true,
    slug,
    name: brandData.name,
    brandDir,
    manifest,
  };
}

export function validateBrand(slug) {
  const slugValidation = validateSlug(slug);
  if (!slugValidation.valid) {
    return { status: 'invalid', errors: [slugValidation.error], warnings: [] };
  }

  const brandDir = path.join(BRANDS_DIR, slug);
  if (!fs.existsSync(brandDir)) {
    return { status: 'invalid', errors: [`La marca "${slug}" no existe en ${brandDir}.`], warnings: [] };
  }

  const errors = [];
  const warnings = [];

  // Check required files
  const brandFile = path.join(brandDir, 'brand.ts');
  const themeFile = path.join(brandDir, 'theme.ts');
  const storeFile = path.join(brandDir, 'store.ts');
  const manifestFile = path.join(brandDir, 'manifest.json');

  if (!fs.existsSync(brandFile)) errors.push('Falta archivo requerido: brand.ts');
  if (!fs.existsSync(themeFile)) errors.push('Falta archivo requerido: theme.ts');
  if (!fs.existsSync(storeFile)) errors.push('Falta archivo requerido: store.ts');

  let manifest = null;
  if (fs.existsSync(manifestFile)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
    } catch (e) {
      errors.push(`manifest.json corrupto o mal formateado: ${e.message}`);
    }
  } else {
    warnings.push('manifest.json no encontrado en el paquete de la marca.');
  }

  // Check content sanity if files exist
  if (fs.existsSync(brandFile)) {
    const content = fs.readFileSync(brandFile, 'utf-8');
    if (!content.includes('export const') || !content.includes('BrandConfig')) {
      errors.push('brand.ts no exporta una constante BrandConfig válida.');
    }
    if (content.includes('contacto@') && content.includes('.com') && slug !== 'lumina') {
      warnings.push('El email de contacto parece ser un placeholder.');
    }
  }

  if (fs.existsSync(themeFile)) {
    const content = fs.readFileSync(themeFile, 'utf-8');
    if (!content.includes('export const') || !content.includes('ThemeConfig')) {
      errors.push('theme.ts no exporta una constante ThemeConfig válida.');
    }
  }

  if (fs.existsSync(storeFile)) {
    const content = fs.readFileSync(storeFile, 'utf-8');
    if (!content.includes('export const') || !content.includes('StoreConfig')) {
      errors.push('store.ts no exporta una constante StoreConfig válida.');
    }
  }

  // Check assets folder
  const assetsDir = path.join(brandDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    warnings.push('Carpeta assets/ no encontrada en el paquete.');
  }

  const resultStatus = errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid';

  // Update manifest validation section if manifest exists
  if (manifest && fs.existsSync(manifestFile)) {
    manifest.validation = {
      status: resultStatus,
      errors,
      warnings,
      lastValidatedAt: new Date().toISOString(),
    };
    const isActive = slug === getActiveBrandId();
    if (isActive) {
      manifest.status = 'ACTIVE';
    } else if (resultStatus === 'valid') {
      manifest.status = 'READY';
    } else if (resultStatus === 'warning') {
      manifest.status = 'VALIDATED';
    } else {
      manifest.status = 'INCOMPLETE';
    }
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  return {
    status: resultStatus,
    slug,
    errors,
    warnings,
    manifest,
  };
}

export function getActiveBrandId() {
  if (!fs.existsSync(ACTIVE_BRAND_FILE)) {
    return 'lumina';
  }
  const content = fs.readFileSync(ACTIVE_BRAND_FILE, 'utf-8');
  const match = content.match(/ACTIVE_BRAND_ID\s*=\s*['"]([^'"]+)['"]/);
  return match ? match[1] : 'lumina';
}

export function listBrands() {
  if (!fs.existsSync(BRANDS_DIR)) {
    return [];
  }

  const activeId = getActiveBrandId();
  const entries = fs.readdirSync(BRANDS_DIR, { withFileTypes: true });

  const brands = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const slug = entry.name;
      const manifestPath = path.join(BRANDS_DIR, slug, 'manifest.json');
      let manifest = null;
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        } catch (_) {}
      }

      brands.push({
        slug,
        name: manifest?.name || slug,
        status: slug === activeId ? 'ACTIVE' : (manifest?.status || 'UNKNOWN'),
        source: manifest?.source || 'unknown',
        isActive: slug === activeId,
        hasManifest: !!manifest,
      });
    }
  }

  return brands;
}

export function getBrandInfo(slug) {
  const brandDir = path.join(BRANDS_DIR, slug);
  if (!fs.existsSync(brandDir)) {
    throw new Error(`Marca "${slug}" no encontrada.`);
  }

  const activeId = getActiveBrandId();
  const manifestPath = path.join(brandDir, 'manifest.json');
  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (_) {}
  }

  const validation = validateBrand(slug);

  return {
    slug,
    name: manifest?.name || slug,
    shortName: manifest?.shortName || slug,
    status: slug === activeId ? 'ACTIVE' : (manifest?.status || 'UNKNOWN'),
    isActive: slug === activeId,
    manifest,
    validation,
    directory: brandDir,
  };
}

export async function activateBrand(slug, options = {}) {
  const slugValidation = validateSlug(slug);
  if (!slugValidation.valid) {
    throw new Error(slugValidation.error);
  }

  const brandDir = path.join(BRANDS_DIR, slug);
  if (!fs.existsSync(brandDir)) {
    throw new Error(`La marca "${slug}" no existe.`);
  }

  // Pre-activation validation
  const validation = validateBrand(slug);
  if (validation.status === 'invalid' && !options.force) {
    throw new Error(`La marca "${slug}" tiene errores críticos de validación:\n- ${validation.errors.join('\n- ')}`);
  }

  const currentActiveId = getActiveBrandId();
  if (currentActiveId === slug) {
    return {
      success: true,
      alreadyActive: true,
      slug,
      message: `La marca "${slug}" ya se encuentra activa actualmente.`,
    };
  }

  // Save rollback snapshot
  const backupData = {
    previousBrandId: currentActiveId,
    timestamp: new Date().toISOString(),
    activeBrandFileBackup: fs.existsSync(ACTIVE_BRAND_FILE) ? fs.readFileSync(ACTIVE_BRAND_FILE, 'utf-8') : null,
  };
  fs.writeFileSync(PREVIOUS_BRAND_FILE, JSON.stringify(backupData, null, 2), 'utf-8');

  // Generate new active-brand.ts content
  const camelCase = toCamelCase(slug);
  const newActiveContent = `/**
 * SINGLE SOURCE OF TRUTH FOR THE ACTIVE BRAND
 * 
 * Generated and automatically managed by Brand Generator Engine.
 * Active Brand: ${slug}
 * Activated at: ${new Date().toISOString()}
 */

import { ${camelCase}BrandConfig } from './brands/${slug}/brand';
import { ${camelCase}ThemeConfig } from './brands/${slug}/theme';
import { ${camelCase}StoreConfig } from './brands/${slug}/store';
import { BrandConfig, ThemeConfig, StoreConfig } from './types';

export const ACTIVE_BRAND_ID = '${slug}';

export const activeBrandConfig: BrandConfig = ${camelCase}BrandConfig;
export const activeThemeConfig: ThemeConfig = ${camelCase}ThemeConfig;
export const activeStoreConfig: StoreConfig = ${camelCase}StoreConfig;
`;

  fs.writeFileSync(ACTIVE_BRAND_FILE, newActiveContent, 'utf-8');

  // Run TypeScript compilation check to verify safety
  try {
    execSync('npx tsc --noEmit', { cwd: PROJECT_ROOT, stdio: 'pipe' });
  } catch (error) {
    // AUTOMATIC ROLLBACK TRIGGERED
    if (backupData.activeBrandFileBackup) {
      fs.writeFileSync(ACTIVE_BRAND_FILE, backupData.activeBrandFileBackup, 'utf-8');
    }
    const stdout = error.stdout ? error.stdout.toString() : '';
    const stderr = error.stderr ? error.stderr.toString() : '';
    throw new Error(`ACTIVACIÓN ABORTADA POR ERROR DE TIPOS TYPESCRIPT. Se ejecutó un rollback automático a "${currentActiveId}".\nDetalles:\n${stdout || stderr || error.message}`);
  }

  // Update manifests if they exist
  // 1. Previous brand manifest -> READY
  const prevManifestPath = path.join(BRANDS_DIR, currentActiveId, 'manifest.json');
  if (fs.existsSync(prevManifestPath)) {
    try {
      const prevM = JSON.parse(fs.readFileSync(prevManifestPath, 'utf-8'));
      prevM.status = 'READY';
      prevM.updatedAt = new Date().toISOString();
      fs.writeFileSync(prevManifestPath, JSON.stringify(prevM, null, 2), 'utf-8');
    } catch (_) {}
  }

  // 2. Target brand manifest -> ACTIVE
  const targetManifestPath = path.join(brandDir, 'manifest.json');
  if (fs.existsSync(targetManifestPath)) {
    try {
      const targetM = JSON.parse(fs.readFileSync(targetManifestPath, 'utf-8'));
      targetM.status = 'ACTIVE';
      targetM.updatedAt = new Date().toISOString();
      fs.writeFileSync(targetManifestPath, JSON.stringify(targetM, null, 2), 'utf-8');
    } catch (_) {}
  }

  return {
    success: true,
    previousBrand: currentActiveId,
    activeBrand: slug,
    message: `Marca activada exitosamente: "${slug}".`,
  };
}

export function rollbackBrand() {
  if (!fs.existsSync(PREVIOUS_BRAND_FILE)) {
    throw new Error('No existe historial de rollback disponible (.brand-state/previous-brand.json).');
  }

  let backupData;
  try {
    backupData = JSON.parse(fs.readFileSync(PREVIOUS_BRAND_FILE, 'utf-8'));
  } catch (e) {
    throw new Error(`Error al leer archivo de rollback: ${e.message}`);
  }

  if (!backupData.previousBrandId || !backupData.activeBrandFileBackup) {
    throw new Error('El archivo de respaldo está incompleto o corrupto.');
  }

  const currentActive = getActiveBrandId();
  fs.writeFileSync(ACTIVE_BRAND_FILE, backupData.activeBrandFileBackup, 'utf-8');

  // Verify rollback
  try {
    execSync('npx tsc --noEmit', { cwd: PROJECT_ROOT, stdio: 'pipe' });
  } catch (err) {
    throw new Error(`Falla crítica durante rollback: TypeScript falló al restaurar.\n${err.message}`);
  }

  // Delete rollback file so we don't double-rollback blindly
  fs.unlinkSync(PREVIOUS_BRAND_FILE);

  return {
    success: true,
    restoredBrand: backupData.previousBrandId,
    previousBrand: currentActive,
  };
}

export async function cloneBrand(sourceSlug, targetName, options = {}) {
  const targetSlug = options.slug ? slugify(options.slug) : slugify(targetName);
  const slugValidation = validateSlug(targetSlug);
  if (!slugValidation.valid) {
    throw new Error(slugValidation.error);
  }

  const sourceDir = path.join(BRANDS_DIR, sourceSlug);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Marca origen "${sourceSlug}" no existe en ${sourceDir}.`);
  }

  const targetDir = path.join(BRANDS_DIR, targetSlug);
  if (fs.existsSync(targetDir) && !options.rebuild) {
    throw new Error(`La marca destino "${targetSlug}" ya existe. Usa -Rebuild si deseas sobrescribir.`);
  }

  // Read source files
  const sourceBrandTs = fs.readFileSync(path.join(sourceDir, 'brand.ts'), 'utf-8');
  const sourceThemeTs = fs.readFileSync(path.join(sourceDir, 'theme.ts'), 'utf-8');
  const sourceStoreTs = fs.readFileSync(path.join(sourceDir, 'store.ts'), 'utf-8');

  const sourceCamel = toCamelCase(sourceSlug);
  const targetCamel = toCamelCase(targetSlug);

  // Smart sanitization & replacement (not blind copy)
  let targetBrandTs = sourceBrandTs
    .replace(new RegExp(sourceCamel + 'BrandConfig', 'g'), targetCamel + 'BrandConfig')
    .replace(new RegExp(`id:\\s*['"]${sourceSlug}['"]`, 'g'), `id: '${targetSlug}'`)
    .replace(/name:\s*['"][^'"]+['"]/, `name: '${targetName}'`)
    .replace(/shortName:\s*['"][^'"]+['"]/, `shortName: '${targetName.split(' ')[0]}'`)
    .replace(/email:\s*['"][^'"]+['"]/, `email: 'contacto@${targetSlug}.com'`)
    .replace(/supportEmail:\s*['"][^'"]+['"]/, `supportEmail: 'soporte@${targetSlug}.com'`)
    .replace(/whatsapp:\s*['"][^'"]+['"]/, `whatsapp: '593990000000'`)
    .replace(/phone:\s*['"][^'"]+['"]/, `phone: '+593 99 000 0000'`);

  let targetThemeTs = sourceThemeTs
    .replace(new RegExp(sourceCamel + 'ThemeConfig', 'g'), targetCamel + 'ThemeConfig')
    .replace(new RegExp(`id:\\s*['"][^'"]+['"]`), `id: '${targetSlug}-theme'`)
    .replace(/name:\s*['"][^'"]+['"]/, `name: '${targetName} Theme'`);

  let targetStoreTs = sourceStoreTs
    .replace(new RegExp(sourceCamel + 'StoreConfig', 'g'), targetCamel + 'StoreConfig')
    .replace(new RegExp(`id:\\s*['"][^'"]+['"]`), `id: '${targetSlug}-store'`);

  const manifest = {
    id: targetSlug,
    slug: targetSlug,
    name: targetName,
    shortName: targetName.split(' ')[0],
    version: '1.0.0',
    status: 'DRAFT',
    source: 'clone',
    clonedFrom: sourceSlug,
    description: `Clonado inteligente a partir de ${sourceSlug}. Requiere revisión de textos y assets.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: { brand: true, theme: true, store: true },
    assets: { logo: false, favicon: false, ogImage: false },
    validation: {
      status: 'warning',
      errors: [],
      warnings: ['Verificar datos de contacto', 'Añadir assets propios de la marca', 'Revisar paleta de color'],
    },
  };

  const readmeContent = `# ${targetName} — Brand Package (Clonado)

> **ESTADO: DRAFT · CLONADO DE: ${sourceSlug.toUpperCase()}**

### Checklist de personalización pendiente:
- [ ] Configurar colores únicos en \`theme.ts\`
- [ ] Personalizar textos comerciales en \`brand.ts\`
- [ ] Añadir logo en \`assets/logo.png\`
- [ ] Validar con: \`brand.ps1 validate "${targetSlug}"\`
`;

  if (options.dryRun) {
    return {
      dryRun: true,
      source: sourceSlug,
      targetSlug,
      targetName,
      targetDir,
      filesWouldCreate: [
        path.join(targetDir, 'brand.ts'),
        path.join(targetDir, 'theme.ts'),
        path.join(targetDir, 'store.ts'),
        path.join(targetDir, 'manifest.json'),
        path.join(targetDir, 'README.md'),
      ],
    };
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

  fs.writeFileSync(path.join(targetDir, 'brand.ts'), targetBrandTs, 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'theme.ts'), targetThemeTs, 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'store.ts'), targetStoreTs, 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf-8');

  return {
    success: true,
    sourceSlug,
    targetSlug,
    targetName,
    targetDir,
  };
}

// ============================================================================
// DOCTOR — CORE HEALTH & HARDCODED BRAND SCANNER
// ============================================================================

export function doctorScan() {
  const srcDir = path.join(PROJECT_ROOT, 'src');
  const findings = [];

  const ignoreExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.ttf', '.otf', '.woff'];

  function scanDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        if (file.name === 'node_modules' || file.name === '.next') continue;
        scanDir(fullPath);
      } else if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase();
        if (ignoreExtensions.includes(ext)) continue;

        const relPath = path.relative(PROJECT_ROOT, fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const lineNum = index + 1;

          // Check brand names
          if (/Lumina\s+Home/i.test(line) || /['"]Lumina['"]/i.test(line)) {
            let category = 'POTENTIALLY_HARDCODED';
            let description = 'Referencia textual directa a Lumina';

            if (relPath.includes(path.join('brands', 'lumina')) || relPath.includes('manifest.json')) {
              category = 'SAFE';
              description = 'Modelo de referencia canónico Lumina';
            } else if (relPath.includes('serverAuth.ts')) {
              category = 'SAFE';
              description = 'Fallback de correo admin maestro';
            } else if (relPath.includes('LuminaBrandEmblem')) {
              category = 'INTENTIONAL';
              description = 'Componente de emblema vectorial de Lumina';
            }

            findings.push({
              category,
              file: relPath,
              line: lineNum,
              snippet: line.trim().slice(0, 100),
              match: 'Lumina',
              description,
            });
          }

          // Check hardcoded colors
          const hexMatches = line.match(/#(8c9276|526437|c24b33|d2b48c)/gi);
          if (hexMatches) {
            for (const hex of hexMatches) {
              let category = 'CONFIGURABLE';
              let description = `Color de acento fijo de Lumina (${hex})`;

              if (relPath.includes(path.join('brands', 'lumina'))) {
                category = 'SAFE';
                description = 'Declaración en ThemeConfig de Lumina';
              } else if (relPath.includes('tailwind.config')) {
                category = 'INTENTIONAL';
                description = 'Paleta por defecto de Tailwind';
              }

              findings.push({
                category,
                file: relPath,
                line: lineNum,
                snippet: line.trim().slice(0, 100),
                match: hex,
                description,
              });
            }
          }
        });
      }
    }
  }

  scanDir(srcDir);

  const safeCount = findings.filter(f => f.category === 'SAFE' || f.category === 'INTENTIONAL').length;
  const configurableCount = findings.filter(f => f.category === 'CONFIGURABLE').length;
  const hardcodedCount = findings.filter(f => f.category === 'POTENTIALLY_HARDCODED').length;

  const total = findings.length;
  const tokenCoveragePercent = total > 0 ? Math.round(((safeCount + configurableCount) / total) * 100) : 100;

  return {
    timestamp: new Date().toISOString(),
    totalFindings: total,
    safeCount,
    configurableCount,
    hardcodedCount,
    tokenCoveragePercent,
    findings,
  };
}

// ============================================================================
// CLI DISPATCHER
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  function getArg(name) {
    const idx = args.indexOf(name);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  }

  const hasFlag = (name) => args.includes(name);

  try {
    switch (command) {
      case 'create': {
        const name = args[1];
        if (!name) {
          console.error('Error: Se requiere el nombre de la marca. Ej: node scripts/brand-engine.mjs create "Aura Studio"');
          process.exit(1);
        }
        const result = await createBrand(name, {
          slug: getArg('--slug'),
          analysis: getArg('--analysis'),
          dryRun: hasFlag('--dry-run'),
          rebuild: hasFlag('--rebuild'),
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'validate': {
        const slug = args[1];
        if (!slug) {
          console.error('Error: Se requiere el slug de la marca.');
          process.exit(1);
        }
        const result = validateBrand(slug);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'list': {
        const brands = listBrands();
        console.log(JSON.stringify(brands, null, 2));
        break;
      }

      case 'info': {
        const slug = args[1];
        if (!slug) {
          console.error('Error: Se requiere el slug de la marca.');
          process.exit(1);
        }
        const info = getBrandInfo(slug);
        console.log(JSON.stringify(info, null, 2));
        break;
      }

      case 'activate': {
        const slug = args[1];
        if (!slug) {
          console.error('Error: Se requiere el slug de la marca.');
          process.exit(1);
        }
        const result = await activateBrand(slug, {
          force: hasFlag('--force'),
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'rollback': {
        const result = rollbackBrand();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'clone': {
        const source = args[1];
        const target = args[2];
        if (!source || !target) {
          console.error('Error: Se requieren marca origen y nombre destino.');
          process.exit(1);
        }
        const result = await cloneBrand(source, target, {
          slug: getArg('--slug'),
          dryRun: hasFlag('--dry-run'),
          rebuild: hasFlag('--rebuild'),
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'doctor': {
        const report = doctorScan();
        console.log(JSON.stringify(report, null, 2));
        break;
      }

      default: {
        console.log(`E-COMMERCE BRAND ENGINE CLI (Node.js backend)
Comandos:
  create <name> [--slug <slug>] [--analysis <path>] [--dry-run] [--rebuild]
  validate <slug>
  activate <slug> [--force]
  rollback
  list
  info <slug>
  clone <source> <targetName> [--slug <slug>] [--dry-run]
  doctor
`);
      }
    }
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
