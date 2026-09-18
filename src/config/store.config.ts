import { luminaStoreConfig } from './brands/lumina/store';
import { StoreConfig } from './types';

/**
 * ACTIVE STORE CONFIGURATION
 * 
 * To switch the active store operational rules, point this to another StoreConfig implementation.
 * Defaults to the reference model: Lumina Home.
 */
export const storeConfig: StoreConfig = luminaStoreConfig;
