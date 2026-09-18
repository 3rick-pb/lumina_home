import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/data";
import { brandConfig } from "@/config/brand.config";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = PRODUCTS.find((p) => p.id === resolvedParams.id);

  if (!product) {
    return {
      title: "Pieza de Autor",
      description:
        `Descubre piezas de autor seleccionadas con precisión artesanal y diseño minimalista en ${brandConfig.name}.`,
    };
  }

  const title = `${product.title} ${product.titleHighlight || ""}`.trim();
  const description =
    product.description ||
    `Explora ${title} en ${brandConfig.name}. Calidad excepcional, confort y acabados de autor para tus espacios.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${brandConfig.name}`,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brandConfig.name}`,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default function ProductDetailLayout({ children }: Props) {
  return <>{children}</>;
}
