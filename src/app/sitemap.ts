import { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/data";
import { brandConfig } from "@/config/brand.config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || brandConfig.meta.siteUrl;

const CATEGORIES = [
  "iluminacion",
  "aromaterapia",
  "textiles",
  "home-office",
  "almacenamiento",
  "gadgets",
  "ceramica",
  "decoracion",
  "cocina",
  "bienestar"
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // 1. Static Core Routes
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/auth/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/auth/register`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // 2. Category Filter URLs
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/shop?category=${encodeURIComponent(cat)}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 3. Dynamic Products
  // Collect product IDs from static repository and optionally Supabase if configured
  const productIds = new Set<string>(PRODUCTS.map((p) => p.id));

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const res = await fetch(`${supabaseUrl}/rest/v1/products?select=id,updated_at`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const dbProducts: Array<{ id: string; updated_at?: string }> = await res.json();
        dbProducts.forEach((p) => {
          if (p.id) productIds.add(p.id);
        });
      }
    }
  } catch {
    // If Supabase is unreachable at build time, continue safely with standard products
  }

  const productRoutes: MetadataRoute.Sitemap = Array.from(productIds).map((id) => ({
    url: `${SITE_URL}/product/${encodeURIComponent(id)}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...coreRoutes, ...categoryRoutes, ...productRoutes];
}
