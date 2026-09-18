import { StoreConfig } from '../../types';

/**
 * REFERENCE MODEL IMPLEMENTATION
 * Store: Lumina Operations & Commerce Rules
 * 
 * Defines commercial policies, shipping thresholds, currency, and active feature gates.
 */
export const luminaStoreConfig: StoreConfig = {
  id: 'lumina-store',
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
    defaultCity: 'Quito',
    defaultState: 'Pichincha',
  },
  shipping: {
    freeShippingThreshold: 100,
    standardCost: 4.99,
    deliveryEstimate: 'Express 24/48h',
    freeShippingLabel: 'Gratis en compras superiores a $100',
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
      code: 'LUMINA10',
      discountPercent: 10,
      isFreeShipping: false,
      message: '¡Cupón LUMINA10 aplicado! 10% de descuento.',
    },
    {
      code: 'VIP20',
      discountPercent: 20,
      isFreeShipping: false,
      message: '¡Cupón VIP20 aplicado! 20% de descuento exclusivo.',
    },
    {
      code: 'BIENVENIDO',
      discountPercent: 15,
      isFreeShipping: false,
      message: '¡Cupón BIENVENIDO aplicado! 15% de descuento.',
    },
    {
      code: 'ENVIOGRATIS',
      discountPercent: 0,
      isFreeShipping: true,
      message: '¡Cupón de Envío Gratuito aplicado con éxito!',
    },
  ],
};
