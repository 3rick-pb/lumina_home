import { activeThemeConfig } from './active-brand';
import { ThemeConfig } from './types';

/**
 * ACTIVE THEME CONFIGURATION (FACADE)
 * 
 * Automatically re-exports from the active brand defined in active-brand.ts.
 * Preserves 100% backwards compatibility with all imports across the engine.
 */
export const themeConfig: ThemeConfig = activeThemeConfig;

