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
import "lenis/dist/lenis.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { MacOSScrollbar } from "@/components/ui/MacOSScrollbar";

import localFont from "next/font/local";

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

const moonwalk = localFont({
  src: "../../public/fonts/moonwalk.ttf",
  variable: "--font-moonwalk",
  display: "swap",
});

import { buildBrandMetadata } from "@/core/services/seo";
import { brandConfig, themeConfig } from "@/config";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#161618" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = buildBrandMetadata(brandConfig);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        style={{
          '--brand-primary': themeConfig.colors.primary.DEFAULT,
          '--brand-accent': themeConfig.colors.accent.DEFAULT,
          '--brand-signature': themeConfig.colors.brandAccent,
          '--hero-gold': themeConfig.colors.heroGold,
          '--bg-light': themeConfig.colors.surface.backgroundLight,
          '--bg-dark': themeConfig.colors.surface.backgroundDark,
        } as React.CSSProperties}
        className={`${inter.variable} ${lora.variable} ${moonwalk.variable} font-sans antialiased text-gray-900 bg-[#faf9f6] flex flex-col min-h-screen relative`}
      >
        <SmoothScrollProvider>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <Suspense fallback={null}>
            <AmbientBackground />
          </Suspense>
          <MacOSScrollbar />
          <AppInitializer />
          <AdminCartNotifier />
          <Header />
          <main className="flex-1">
            <AuthGuard>
              {children}
            </AuthGuard>
          </main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
