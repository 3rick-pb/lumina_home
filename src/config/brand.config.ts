import { activeBrandConfig } from './active-brand';
import { BrandConfig } from './types';

/**
 * ACTIVE BRAND CONFIGURATION (FACADE)
 * 
 * Automatically re-exports from the active brand defined in active-brand.ts.
 * Preserves 100% backwards compatibility with all imports across the engine.
 */
export const brandConfig: BrandConfig = activeBrandConfig;

