import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Nome e ícone quando o cliente adiciona a loja à tela inicial do celular. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} · sneakers e streetwear`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f3f0ee",
    theme_color: "#0b0b0b",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
