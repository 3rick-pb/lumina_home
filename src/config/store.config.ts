import { activeStoreConfig } from './active-brand';
import { StoreConfig } from './types';

/**
 * ACTIVE STORE CONFIGURATION (FACADE)
 * 
 * Automatically re-exports from the active brand defined in active-brand.ts.
 * Preserves 100% backwards compatibility with all imports across the engine.
 */
export const storeConfig: StoreConfig = activeStoreConfig;

