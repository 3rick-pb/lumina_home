import { BrandConfig } from '../../types';

/**
 * BRAND IDENTITY CONFIGURATION
 * Brand: Aura Studio
 * Generated automatically by E-Commerce Brand Generator Engine.
 */
export const auraStudioBrandConfig: BrandConfig = {
  id: 'aura-studio',
  name: 'Aura Studio',
  shortName: 'Aura',
  tagline: 'Moda Atemporal & Lino Orgánico',
  slogan: 'Vestimenta de autor con fibras sustentables',
  description: 'Colecciones cápsula de indumentaria en lino 100% orgánico confeccionadas artesanalmente con diseño consciente.',
  logo: {
    text: 'Aura',
    accentDot: '.',
    markSrc: '/favicon.ico',
  },
  favicon: '/favicon.ico',
  contact: {
    email: 'contacto@aura-studio.com',
    supportEmail: 'soporte@aura-studio.com',
    phone: '+593 99 000 0000',
    whatsapp: '593990000000',
    address: 'Ecuador',
    schedule: 'Lunes a Viernes: 09:00 - 18:00',
  },
  social: {
    instagram: 'https://instagram.com/aura-studio',
    facebook: 'https://facebook.com/aura-studio',
  },
  meta: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://aura-studio.com',
    locale: 'es-EC',
    creator: 'Aura Studio',
    publisher: 'Aura Studio Studio',
    ogImage: '/og-image.jpg',
    keywords: [
      "Aura Studio",
      "tienda online",
      "compras",
      "ecommerce",
      "ecuador"
],
  },
};
