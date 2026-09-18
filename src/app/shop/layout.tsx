import type { Metadata } from "next";
import { brandConfig } from "@/config";

export const metadata: Metadata = {
  title: `Catálogo y Colecciones | ${brandConfig.name}`,
  description:
    brandConfig.description,
  openGraph: {
    title: `Catálogo y Colecciones | ${brandConfig.name}`,
    description:
      brandConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `Catálogo y Colecciones | ${brandConfig.name}`,
    description:
      brandConfig.description,
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
