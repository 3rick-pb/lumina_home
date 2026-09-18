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

  const base: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${customBrand.name} | ${customBrand.tagline}`,
      template: `%s | ${customBrand.name}`,
    },
    description: customBrand.description,
    applicationName: customBrand.name,
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
      locale: customBrand.meta.locale,
      url: siteUrl,
      siteName: customBrand.name,
      title: `${customBrand.name} | ${customBrand.tagline}`,
      description: customBrand.description,
      images: [
        {
          url: customBrand.meta.ogImage,
          width: 1200,
          height: 630,
          alt: `${customBrand.name} — Colección de Autor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${customBrand.name} | ${customBrand.tagline}`,
      description: customBrand.description,
      images: [customBrand.meta.ogImage],
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
      icon: customBrand.favicon,
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
