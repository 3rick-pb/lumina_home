import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo y Colecciones",
  description:
    "Descubre nuestra selección de artículos diseñados para convertir tu hogar en tu refugio ideal: iluminación de autor, cerámica, aromaterapia y mobiliario minimalista.",
  openGraph: {
    title: "Catálogo y Colecciones | Lumina Home",
    description:
      "Descubre nuestra selección de artículos diseñados para convertir tu hogar en tu refugio ideal: iluminación de autor, cerámica, aromaterapia y mobiliario minimalista.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo y Colecciones | Lumina Home",
    description:
      "Descubre nuestra selección de artículos diseñados para convertir tu hogar en tu refugio ideal: iluminación de autor, cerámica, aromaterapia y mobiliario minimalista.",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
