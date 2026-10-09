import type { MetadataRoute } from "next";
import { brandConfig } from "@/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumina Home",
    short_name: "Lumina Home",
    description: brandConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#121316",
    theme_color: "#e07a3f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
