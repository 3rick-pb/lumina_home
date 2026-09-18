'use client';

import { themeConfig } from '@/config/theme.config';
import { ThemeConfig } from '@/config/types';

/**
 * Hook to access active design tokens, colors, and variant choices in React components.
 */
export function useThemeConfig(): ThemeConfig {
  return themeConfig;
}
