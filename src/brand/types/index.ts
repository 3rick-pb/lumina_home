/**
 * BRAND GENERATOR & PACKAGE TYPES
 * 
 * Formal TypeScript contracts for:
 * 1. BrandManifest (State, lifecycle, asset validation)
 * 2. BrandAnalysis (AI-assisted brand extraction with certainty levels)
 * 3. ValidationResult (Verification outcomes)
 * 4. DoctorFindings (Core code health & hardcoded brand detection)
 */

export type BrandStatus = 
  | 'DRAFT'        // Initial skeleton created, incomplete data
  | 'INCOMPLETE'   // Missing critical assets or configuration
  | 'VALIDATED'    // Passed structural and type validation
  | 'READY'        // Ready for activation or deployment
  | 'ACTIVE'       // Currently active brand in the Core
  | 'ARCHIVED';    // Deprecated or dormant brand

export type BrandSource = 
  | 'manual'
  | 'ai-analysis'
  | 'clone'
  | 'reference-model';

export interface BrandAssetChecklist {
  logo: boolean;
  favicon: boolean;
  ogImage: boolean;
  heroImage?: boolean;
  banners?: boolean;
}

export interface BrandValidationResult {
  status: 'valid' | 'invalid' | 'warning';
  errors: string[];
  warnings: string[];
  lastValidatedAt?: string;
}

export interface BrandManifest {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  version: string;
  status: BrandStatus;
  source: BrandSource;
  description: string;
  createdAt: string;
  updatedAt: string;
  config: {
    brand: boolean;
    theme: boolean;
    store: boolean;
  };
  assets: BrandAssetChecklist;
  validation: BrandValidationResult;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// AI BRAND ANALYZER CONTRACTS
// ============================================================================

export type AnalysisCertainty = 
  | 'CONFIRMED'   // Directly visible or provided in source assets
  | 'INFERRED'    // Derived from analysis of imagery / typography
  | 'PROPOSED'    // AI suggested configuration for the niche
  | 'NEEDS_INFO'; // Missing information requiring human input

export interface AnalyzedField<T> {
  value: T;
  status: AnalysisCertainty;
  confidence: number; // 0.0 to 1.0
  source?: string;
  notes?: string;
}

export interface BrandAnalysisIdentity {
  name: AnalyzedField<string>;
  shortName: AnalyzedField<string>;
  tagline: AnalyzedField<string>;
  slogan: AnalyzedField<string>;
  description: AnalyzedField<string>;
  niche: AnalyzedField<string>;
  toneOfVoice: AnalyzedField<string>;
  targetAudience?: AnalyzedField<string>;
}

export interface BrandAnalysisVisual {
  primaryColor: AnalyzedField<string>; // Hex
  accentColor: AnalyzedField<string>;  // Hex
  brandAccent: AnalyzedField<string>;  // Signature dot/badge color
  heroGold: AnalyzedField<string>;     // Highlight italic display color
  surface: {
    backgroundLight: AnalyzedField<string>;
    backgroundDark: AnalyzedField<string>;
    cardLight: AnalyzedField<string>;
    cardDark: AnalyzedField<string>;
  };
  typography: {
    candidateHeadingFont: AnalyzedField<string>;
    candidateBodyFont: AnalyzedField<string>;
    fontStyle: AnalyzedField<'serif' | 'sans' | 'display' | 'geometric' | 'editorial'>;
  };
  photographyStyle: AnalyzedField<string>;
  artDirection: AnalyzedField<string>;
}

export interface BrandAnalysisEcommerce {
  recommendedVariants: {
    headerStyle: AnalyzedField<'floating-glass-pill' | 'fixed-minimal' | 'centered-classic'>;
    heroStyle: AnalyzedField<'immersive-glass' | 'split-editorial' | 'minimal-banner'>;
    productCardStyle: AnalyzedField<'luxury-editorial' | 'compact-grid' | 'minimal-modern'>;
  };
  featuresSuggested: AnalyzedField<string[]>;
}

export interface BrandAnalysisStore {
  currency: AnalyzedField<{ code: string; symbol: string; decimals: number }>;
  regional: AnalyzedField<{ country: string; countryCode: string; locale: string; defaultCity: string }>;
  shipping: AnalyzedField<{ freeShippingThreshold: number; standardCost: number }>;
}

export interface BrandAnalysis {
  brandId: string;
  sourceType: 'instagram' | 'logo' | 'photos' | 'mixed' | 'manual';
  analyzedAt: string;
  identity: BrandAnalysisIdentity;
  visual: BrandAnalysisVisual;
  ecommerce: BrandAnalysisEcommerce;
  store: BrandAnalysisStore;
  extractedPalette: string[];
  assetsDetected: {
    logoFound: boolean;
    hasFavicon: boolean;
    sampleImagesCount: number;
  };
  missingInfo: string[];
  humanReviewNotes?: string;
}

// ============================================================================
// DOCTOR FINDINGS CONTRACTS
// ============================================================================

export type DoctorFindingCategory = 
  | 'SAFE'
  | 'CONFIGURABLE'
  | 'POTENTIALLY_HARDCODED'
  | 'INTENTIONAL';

export interface DoctorFinding {
  category: DoctorFindingCategory;
  file: string;
  line: number;
  snippet: string;
  match: string;
  description: string;
  recommendation?: string;
}

export interface DoctorReport {
  timestamp: string;
  brandHardcodedCount: number;
  colorHardcodedCount: number;
  totalFindings: number;
  tokenCoveragePercent: number;
  findings: DoctorFinding[];
}
