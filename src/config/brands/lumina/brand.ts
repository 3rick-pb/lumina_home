import { BrandConfig } from '../../types';
import { LuminaBrandEmblem } from '@/components/ui/LuminaBrandEmblem';

/**
 * REFERENCE MODEL IMPLEMENTATION
 * Brand: Lumina Home
 * 
 * Defines the complete identity of the active reference brand.
 */
export const luminaBrandConfig: BrandConfig = {
  id: 'lumina-home',
  name: 'Lumina Home',
  shortName: 'Lumina',
  tagline: 'Espacios con Alma y Diseño de Autor',
  slogan: 'Espacios diseñados para perdurar',
  description: 'Descubre piezas exclusivas de diseño contemporáneo, iluminación escultural, aromaterapia, cerámica artesanal y mobiliario minimalista creados para transformar tu hogar.',
  logo: {
    text: 'Lumina',
    accentDot: '.',
    emblemComponent: LuminaBrandEmblem,
    markSrc: '/favicon.ico',
  },
  favicon: '/favicon.ico',
  contact: {
    email: 'soporte@lumina.com',
    supportEmail: 'soporte@lumina.com',
    phone: '+593 99 999 9999',
    whatsapp: '593999999999',
    address: 'Quito, Ecuador',
    schedule: 'Lunes a Sábado: 09:00 - 19:00',
  },
  social: {
    instagram: 'https://instagram.com/lumina.home',
    facebook: 'https://facebook.com/lumina.home',
    pinterest: 'https://pinterest.com/lumina.home',
  },
  meta: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://lumina-home.vercel.app',
    locale: 'es_EC',
    creator: 'Lumina Home',
    publisher: 'Lumina Living Studio',
    ogImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200&auto=format&fit=crop',
    keywords: [
      'Lumina Home',
      'Lumina',
      'muebles de diseño',
      'iluminación escultórica',
      'decoración minimalista',
      'diseño de interiores',
      'cerámica de autor',
      'aromaterapia',
      'textiles naturales',
      'arquitectura de interiores',
      'tienda de diseño'
    ],
  },
};
