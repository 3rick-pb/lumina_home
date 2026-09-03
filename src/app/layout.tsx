import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppInitializer } from "@/components/AppInitializer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Lumina Home | Espacios con alma",
  description: "Diseño elegante y minimalista para tu hogar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased text-gray-900 bg-[#f8f9fa] flex flex-col min-h-screen relative`}
      >
        <Suspense fallback={null}>
          <AmbientBackground />
        </Suspense>
        <AppInitializer />
        <AuthGuard>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthGuard>
      </body>
    </html>
  );
}
