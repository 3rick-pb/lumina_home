import { StoreConfig } from '../../types';

/**
 * STORE OPERATIONS & COMMERCE RULES
 * Brand: Aura Studio
 * Generated automatically by E-Commerce Brand Generator Engine.
 */
export const auraStudioStoreConfig: StoreConfig = {
  id: 'aura-studio-store',
  currency: {
    code: 'USD',
    symbol: '$',
    decimals: 2,
    format: 'standard',
  },
  regional: {
    country: 'Ecuador',
    countryCode: 'EC',
    locale: 'es-EC',
    defaultCity: 'Guayaquil',
    defaultState: 'Pichincha',
  },
  shipping: {
    freeShippingThreshold: 80,
    standardCost: 3.99,
    deliveryEstimate: 'Express 24/48h',
    freeShippingLabel: 'Envío gratis en compras seleccionadas',
  },
  tax: {
    rate: 0.15,
    includedInPrice: true,
    taxLabel: 'IVA incluido',
  },
  features: {
    enableReviews: false,
    enableCoupons: true,
    enableSoundEffects: true,
    enableCartAlerts: true,
    enableLiveRadar: true,
    enableCombos: true,
    enableDropiExport: true,
    enablePayPhone: true,
    enableCashOnDelivery: true,
    enableBankTransfer: true,
  },
  defaultCoupons: [
    {
      code: 'BIENVENIDO',
      discountPercent: 10,
      isFreeShipping: false,
      message: '¡Cupón BIENVENIDO aplicado con éxito!',
    },
    {
      code: 'ENVIOGRATIS',
      discountPercent: 0,
      isFreeShipping: true,
      message: '¡Cupón de Envío Gratuito aplicado con éxito!',
    },
  ],
};
