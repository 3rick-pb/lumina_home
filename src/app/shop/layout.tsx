import type { Metadata } from "next";
import { brandConfig } from "@/config";

const siteUrl = brandConfig.meta.siteUrl || "https://luminahome-3rick.vercel.app";
const shopTitle = `Catálogo de Muebles y Decoración de Autor · ${brandConfig.name}`;
const shopDescription = "Explora piezas exclusivas de diseño contemporáneo, iluminación escultural y mobiliario minimalista con envíos a todo el país. 15% OFF en tu primera compra.";
const shopOgImage = `${siteUrl}/og-default.jpg`;

export const metadata: Metadata = {
  title: {
    absolute: shopTitle,
  },
  description: shopDescription,
  alternates: {
    canonical: `${siteUrl}/shop`,
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: `${siteUrl}/shop`,
    siteName: brandConfig.name,
    title: shopTitle,
    description: shopDescription,
    images: [
      {
        url: shopOgImage,
        secureUrl: shopOgImage,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: `${brandConfig.name} — Catálogo Oficial de Colecciones de Autor`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shopTitle,
    description: shopDescription,
    images: [shopOgImage],
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
