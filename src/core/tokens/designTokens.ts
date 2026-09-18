import { themeConfig } from '@/config/theme.config';

/**
 * Centrally declared design tokens derived from the active ThemeConfig.
 */
export const tokens = {
  colors: themeConfig.colors,
  typography: themeConfig.typography,
  borderRadius: themeConfig.borderRadius,
  variants: themeConfig.variants,
};

export default tokens;
