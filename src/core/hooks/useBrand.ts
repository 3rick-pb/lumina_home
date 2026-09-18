'use client';

import { brandConfig } from '@/config/brand.config';
import { BrandConfig } from '@/config/types';

/**
 * Hook to access the current active brand identity configuration in React components.
 */
export function useBrand(): BrandConfig {
  return brandConfig;
}
