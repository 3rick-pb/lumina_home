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

  const absoluteOgImage = customBrand.meta.ogImage.startsWith('http') 
    ? customBrand.meta.ogImage 
    : `${siteUrl}${customBrand.meta.ogImage.startsWith('/') ? '' : '/'}${customBrand.meta.ogImage}`;

  const base: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Lumina Home",
      template: `%s | Lumina Home`,
    },
    description: customBrand.description,
    applicationName: "Lumina Home",
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: "Lumina Home",
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
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: customBrand.meta.locale || 'es_EC',
      url: siteUrl,
      siteName: "Lumina Home",
      title: "Lumina Home",
      description: customBrand.description,
      images: [
        {
          url: absoluteOgImage,
          secureUrl: absoluteOgImage,
          width: 1200,
          height: 630,
          type: 'image/jpeg',
          alt: `${customBrand.name} — Colección de Autor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: "Lumina Home",
      description: customBrand.description,
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
