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
import type { Brand, Product } from "@/types/product";

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

/** Mesma categoria, priorizando mesma marca; exclui o próprio produto. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort(
      (a, b) =>
        Number(b.brand === product.brand) - Number(a.brand === product.brand) ||
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
    products.filter((p) => p.badge === "drop" && inStock(p)),
    "novos",
  );
  return latest ?? products[0]!;
}

export async function getBrandSummary(): Promise<{ brand: Brand; count: number; cover?: Product }[]> {
  const map = new Map<Brand, Product[]>();
  for (const p of products) map.set(p.brand, [...(map.get(p.brand) ?? []), p]);
  return Array.from(map.entries())
    .map(([brand, items]) => ({
      brand,
      count: items.length,
      cover: [...items].sort((a, b) => b.popularity - a.popularity)[0],
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getCategoryCovers(): Promise<Record<Product["category"], Product | undefined>> {
  // Capas escolhidas a dedo: fotos que aguentam texto por cima (sem estampa competindo)
  const bySlug = (slug: string) => products.find((p) => p.slug === slug);
  return {
    sneakers: bySlug("air-jordan-1-retro-high-og-lost-found"),
    roupas: bySlug("carhartt-wip-regular-cargo-pant-black"),
    acessorios: bySlug("carhartt-wip-acrylic-watch-hat-black"),
  };
}

export type SearchSuggestion =
  | { kind: "product"; slug: string; name: string; brand: Brand; price: number; image?: string }
  | { kind: "brand"; brand: Brand; count: number };

export async function searchSuggestions(q: string, limit = 6): Promise<SearchSuggestion[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const needle = normalize(query);
  const brandHits = (Array.from(new Set(products.map((p) => p.brand))) as Brand[])
    .filter((brand) => normalize(brand).includes(needle))
    .map((brand) => ({ kind: "brand" as const, brand, count: products.filter((p) => p.brand === brand).length }));
  const productHits = sortProducts(
    products.filter((p) => matchesQuery(p, query)),
    "relevancia",
  )
    .slice(0, limit)
    .map((p) => ({
      kind: "product" as const,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: p.price,
      image: p.images[0]?.src,
    }));
  return [...brandHits.slice(0, 2), ...productHits].slice(0, limit);
}
