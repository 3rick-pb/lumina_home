import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/data";
import { brandConfig } from "@/config/brand.config";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

import { supabase } from "@/lib/supabase";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const decodedId = (() => {
    try {
      return decodeURIComponent(rawId);
    } catch {
      return rawId;
    }
  })();

  const siteUrl = brandConfig.meta.siteUrl || "https://luminahome-3rick.vercel.app";
  const defaultOgImage = `${siteUrl}/og-default.jpg`;

  // 1. Intentar obtener producto desde Supabase
  let product: any = null;
  try {
    const { data } = await supabase
      .from("products")
      .select("*")
      .or(`id.eq.${rawId},id.eq.${decodedId}`)
      .limit(1)
      .maybeSingle();
    if (data) {
      product = data;
    }
  } catch {
    // Si falla la consulta a Supabase, continuar al fallback
  }

  // 2. Fallback a catálogo estático si no existe en Supabase
  if (!product) {
    const staticProd = PRODUCTS.find((p) => p.id === rawId || p.id === decodedId);
    if (staticProd) {
      product = {
        title: staticProd.title,
        title_highlight: staticProd.titleHighlight,
        description: staticProd.description,
        price: staticProd.price,
        image_url: staticProd.imageUrl,
        images: staticProd.images,
      };
    }
  }

  // Si no se encuentra el producto, retornar metadata de autor
  if (!product) {
    const fallbackTitle = `Pieza de Autor · ${brandConfig.name}`;
    const fallbackDesc = `Descubre piezas de autor seleccionadas con precisión artesanal y diseño minimalista en ${brandConfig.name}.`;
    return {
      title: {
        absolute: fallbackTitle,
      },
      description: fallbackDesc,
      openGraph: {
        type: "website",
        locale: "es_EC",
        url: `${siteUrl}/product/${rawId}`,
        siteName: brandConfig.name,
        title: fallbackTitle,
        description: fallbackDesc,
        images: [
          {
            url: defaultOgImage,
            secureUrl: defaultOgImage,
            width: 1200,
            height: 630,
            type: "image/jpeg",
            alt: fallbackTitle,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDesc,
        images: [defaultOgImage],
      },
    };
  }

  // Formato de Alta Conversión SEO & Redes Sociales
  const rawTitle = `${product.title || "Pieza de Diseño"} ${product.title_highlight || product.titleHighlight || ""}`.trim();
  const ogTitle = `${rawTitle} · ${brandConfig.name}`;

  // Formato: "[Precio / Beneficio] - [Descripción corta atractiva]"
  const formattedPrice = typeof product.price === "number" ? `$${product.price.toFixed(2)} USD` : (product.price ? `$${product.price}` : "");
  const cleanDescription = (product.description || "Pieza de autor exclusiva con acabados de primera calidad y diseño contemporáneo.").trim();
  const shortDescription = cleanDescription.length > 120 ? cleanDescription.slice(0, 117).trim() + "..." : cleanDescription;
  const ogDescription = formattedPrice ? `${formattedPrice} · ${shortDescription}` : shortDescription;

  // Resolver imagen principal absoluta
  const rawImage = product.image_url || product.imageUrl || (Array.isArray(product.images) && product.images[0]) || "";
  const absoluteImageUrl = rawImage && typeof rawImage === "string"
    ? (rawImage.startsWith("http") ? rawImage : `${siteUrl}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`)
    : defaultOgImage;

  const productUrl = `${siteUrl}/product/${rawId}`;

  return {
    title: {
      absolute: ogTitle,
    },
    description: ogDescription,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: "website",
      locale: "es_EC",
      url: productUrl,
      siteName: brandConfig.name,
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: absoluteImageUrl,
          secureUrl: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: `${rawTitle} — ${brandConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [absoluteImageUrl],
    },
  };
}

export default function ProductDetailLayout({ children }: Props) {
  return <>{children}</>;
}
