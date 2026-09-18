'use client';

import { storeConfig } from '@/config/store.config';
import { StoreConfig } from '@/config/types';

/**
 * Hook to access active store operational parameters (currency, shipping, features) in React components.
 */
export function useStoreConfig(): StoreConfig {
  return storeConfig;
}
