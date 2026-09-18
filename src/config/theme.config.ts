import { luminaThemeConfig } from './brands/lumina/theme';
import { ThemeConfig } from './types';

/**
 * ACTIVE THEME CONFIGURATION
 * 
 * To switch the active visual theme in the E-Commerce Core, point this to another ThemeConfig implementation.
 * Defaults to the reference model: Lumina Luxury Editorial & Liquid Glass.
 */
export const themeConfig: ThemeConfig = luminaThemeConfig;
