/**
 * E-COMMERCE CORE
 * Centralized Configuration Hub
 */

import { brandConfig } from './brand.config';
import { themeConfig } from './theme.config';
import { storeConfig } from './store.config';
import { CoreConfig } from './types';

export * from './types';
export * from './brand.config';
export * from './theme.config';
export * from './store.config';

export const coreConfig: CoreConfig = {
  brand: brandConfig,
  theme: themeConfig,
  store: storeConfig,
};

export default coreConfig;
