import { MetadataRoute } from "next";
import { brandConfig } from "@/config/brand.config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || brandConfig.meta.siteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop", "/product/*"],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/profile",
          "/profile/*",
          "/checkout/*",
          "/_next/*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
