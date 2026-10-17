import type { Metadata } from 'next';
import { brandConfig } from '@/config/brand.config';
import { BrandConfig } from '@/config/types';

/**
 * Generates Next.js Metadata based on the active BrandConfig.
 * Allows overriding specific fields per page (e.g., product details, categories).
 */
export function buildBrandMetadata(
  customBrand: BrandConfig = brandConfig,
  overrides?: Partial<Metadata>
): Metadata {
  const siteUrl = customBrand.meta.siteUrl;

  const baseTitle = "Muebles de Diseño y Decoración Contemporánea · Lumina Home";
  const persuasiveDescription = "Descubre piezas de autor, iluminación escultural y diseño minimalista. Envíos a todo el país · 15% OFF en tu primera compra.";
  const absoluteOgImage = customBrand.meta.ogImage.startsWith('http') 
    ? customBrand.meta.ogImage 
    : `${siteUrl}${customBrand.meta.ogImage.startsWith('/') ? '' : '/'}${customBrand.meta.ogImage}`;

  const base: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
      default: baseTitle,
      template: `%s · ${customBrand.name}`,
    },
    description: persuasiveDescription,
    applicationName: customBrand.name,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: customBrand.name,
    },
    keywords: customBrand.meta.keywords,
    authors: [{ name: customBrand.meta.publisher }],
    creator: customBrand.meta.creator,
    publisher: customBrand.meta.publisher,
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: 'website',
      locale: customBrand.meta.locale || 'es_EC',
      url: siteUrl,
      siteName: customBrand.name,
      title: baseTitle,
      description: persuasiveDescription,
      images: [
        {
          url: absoluteOgImage,
          secureUrl: absoluteOgImage,
          width: 1200,
          height: 630,
          type: 'image/jpeg',
          alt: `${customBrand.name} — Muebles de Diseño Contemporáneo y Piezas de Autor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description: persuasiveDescription,
      images: [absoluteOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico' },
      ],
      apple: '/icon.svg',
    },
  };

  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    openGraph: {
      ...base.openGraph,
      ...overrides.openGraph,
    },
    twitter: {
      ...base.twitter,
      ...overrides.twitter,
    },
  };
}
