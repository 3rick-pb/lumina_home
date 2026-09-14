import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "blobatar/motion.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppInitializer } from "@/components/AppInitializer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AdminCartNotifier } from "@/components/admin/AdminCartNotifier";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  style: ["normal", "italic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lumina-home.vercel.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#161618" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Lumina Home | Espacios con Alma y Diseño de Autor",
    template: "%s | Lumina Home",
  },
  description:
    "Descubre piezas exclusivas de diseño contemporáneo, iluminación escultural, aromaterapia, cerámica artesanal y mobiliario minimalista creados para transformar tu hogar.",
  applicationName: "Lumina Home",
  keywords: [
    "Lumina Home",
    "muebles de diseño",
    "iluminación escultórica",
    "decoración minimalista",
    "diseño de interiores",
    "cerámica de autor",
    "aromaterapia",
    "textiles naturales",
    "arquitectura de interiores",
    "tienda de diseño"
  ],
  authors: [{ name: "Lumina Home Studio" }],
  creator: "Lumina Home",
  publisher: "Lumina Home",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: SITE_URL,
    siteName: "Lumina Home",
    title: "Lumina Home | Espacios con Alma y Diseño de Autor",
    description:
      "Descubre piezas exclusivas de diseño contemporáneo, iluminación escultural, aromaterapia, cerámica artesanal y mobiliario minimalista creados para transformar tu hogar.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Lumina Home — Colección de Autor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumina Home | Espacios con Alma y Diseño de Autor",
    description:
      "Descubre piezas exclusivas de diseño contemporáneo, iluminación escultural y mobiliario minimalista para tu hogar.",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${lora.variable} font-sans antialiased text-gray-900 bg-transparent flex flex-col min-h-screen relative`}
      >
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <Suspense fallback={null}>
          <AmbientBackground />
        </Suspense>
        <AppInitializer />
        <AdminCartNotifier />
        <Header />
        <main className="flex-1">
          <AuthGuard>
            {children}
          </AuthGuard>
        </main>
        <Footer />
      </body>
    </html>
  );
}
