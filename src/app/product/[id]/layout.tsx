import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/data";

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = PRODUCTS.find((p) => p.id === params.id);

  if (!product) {
    return {
      title: "Pieza de Autor",
      description:
        "Descubre piezas de autor seleccionadas con precisión artesanal y diseño minimalista en Lumina Home.",
    };
  }

  const title = `${product.title} ${product.titleHighlight || ""}`.trim();
  const description =
    product.description ||
    `Explora ${title} en Lumina Home. Calidad excepcional, confort y acabados de autor para tus espacios.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Lumina Home`,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Lumina Home`,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default function ProductDetailLayout({ children }: Props) {
  return <>{children}</>;
}
