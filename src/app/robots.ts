import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lumina-home.vercel.app";

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
