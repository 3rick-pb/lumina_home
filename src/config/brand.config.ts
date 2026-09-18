import { luminaBrandConfig } from './brands/lumina/brand';
import { BrandConfig } from './types';

/**
 * ACTIVE BRAND CONFIGURATION
 * 
 * To switch the active brand in the E-Commerce Core, point this to another BrandConfig implementation.
 * Defaults to the reference model: Lumina Home.
 */
export const brandConfig: BrandConfig = luminaBrandConfig;
