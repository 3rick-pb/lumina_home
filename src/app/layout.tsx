import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
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
