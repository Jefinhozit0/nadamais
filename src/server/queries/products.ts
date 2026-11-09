import "server-only";
import { products } from "@/data/products";
import {
  applyFilters,
  computeFacets,
  inStock,
  matchesQuery,
  normalize,
  PAGE_SIZE,
  sortProducts,
  type CatalogFilters,
  type Facets,
} from "@/lib/catalog";
import type { Line, Product } from "@/types/product";

/**
 * Camada de acesso a dados. Hoje lê o mock em memória; na Fase 4 passa a
 * consultar o Prisma mantendo as mesmas assinaturas (por isso já são async).
 */

export type CatalogResult = {
  items: Product[];
  total: number;
  hasMore: boolean;
  facets: Facets;
};

export async function listProducts(filters: CatalogFilters): Promise<CatalogResult> {
  const filtered = sortProducts(applyFilters(products, filters), filters.ordem);
  const end = filters.pagina * PAGE_SIZE;
  return {
    items: filtered.slice(0, end),
    total: filtered.length,
    hasMore: filtered.length > end,
    facets: computeFacets(products, filters),
  };
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return products.find((p) => p.slug === slug);
}

export async function getAllProductSlugs(): Promise<string[]> {
  return products.map((p) => p.slug);
}

/** Mesma categoria, priorizando a mesma linha; exclui o próprio produto. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort(
      (a, b) =>
        Number(b.line === product.line) - Number(a.line === product.line) ||
        Number(inStock(b)) - Number(inStock(a)) ||
        b.popularity - a.popularity,
    )
    .slice(0, limit);
}

export async function getNewDrops(limit = 8): Promise<Product[]> {
  return sortProducts(products.filter(inStock), "novos").slice(0, limit);
}

export async function getTrending(limit = 8): Promise<Product[]> {
  return [...products]
    .filter(inStock)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export async function getFeaturedDrop(): Promise<Product> {
  const [latest] = sortProducts(
    // foto de produto (não o recorte da campanha, que já está no hero)
    products.filter((p) => p.badge === "drop" && inStock(p) && p.images[0]?.kind === "photo"),
    "novos",
  );
  return latest ?? products[0]!;
}

export async function getLineSummary(): Promise<{ line: Line; count: number; cover?: Product }[]> {
  const order: Line[] = ["essencial", "court", "volume", "utility"];
  return order.map((line) => {
    const items = products.filter((p) => p.line === line);
    return {
      line,
      count: items.length,
      cover: [...items].filter((p) => p.images.length > 0).sort((a, b) => b.popularity - a.popularity)[0],
    };
  });
}

export async function getCategoryCovers(): Promise<Record<Product["category"], Product | undefined>> {
  // Capas escolhidas a dedo: fotos que aguentam texto por cima (sem estampa competindo)
  const bySlug = (slug: string) => products.find((p) => p.slug === slug);
  return {
    sneakers: bySlug("court-gum-areia"),
    roupas: bySlug("calca-cargo-ripstop"),
    acessorios: bySlug("bone-6-gomos-branco"),
  };
}

export type SearchSuggestion =
  | { kind: "product"; slug: string; name: string; line: Line; price: number; image?: string }
  | { kind: "line"; line: Line; count: number };

export async function searchSuggestions(q: string, limit = 6): Promise<SearchSuggestion[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const needle = normalize(query);
  const lineHits = (["essencial", "court", "volume", "utility"] as const)
    .filter((line) => line.includes(needle))
    .map((line) => ({ kind: "line" as const, line, count: products.filter((p) => p.line === line).length }));
  const productHits = sortProducts(
    products.filter((p) => matchesQuery(p, query)),
    "relevancia",
  )
    .slice(0, limit)
    .map((p) => ({
      kind: "product" as const,
      slug: p.slug,
      name: p.name,
      line: p.line,
      price: p.price,
      image: p.images[0]?.src,
    }));
  return [...lineHits.slice(0, 1), ...productHits].slice(0, limit);
}
