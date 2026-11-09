import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // áreas privadas, transacionais ou internas não devem aparecer na busca
      disallow: ["/admin", "/conta", "/checkout", "/carrinho", "/pedido", "/api", "/auth", "/design-system"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
