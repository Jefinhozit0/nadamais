import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";
import { loadCatalog } from "@/server/catalog-source";

const staticRoutes: { path: string; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/catalogo", changeFrequency: "daily", priority: 0.9 },
  { path: "/sobre", changeFrequency: "yearly", priority: 0.4 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.4 },
  { path: "/trocas-e-devolucoes", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacidade", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await loadCatalog();
  return [
    ...staticRoutes.map((r) => ({ url: absoluteUrl(r.path), changeFrequency: r.changeFrequency, priority: r.priority })),
    ...products.map((p) => ({
      url: absoluteUrl(`/produto/${p.slug}`),
      lastModified: p.releasedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images.slice(0, 3).map((img) => absoluteUrl(img.src)),
    })),
  ];
}
