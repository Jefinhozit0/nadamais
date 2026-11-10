import "server-only";
import {
  applyFilters,
  computeFacets,
  brandsOf,
  inStock,
  matchesQuery,
  normalize,
  PAGE_SIZE,
  sameBrand,
  sortProducts,
  type CatalogFilters,
  type Facets,
} from "@/lib/catalog";
import type { Product } from "@/types/product";
import { loadCatalog } from "../catalog-source";

/**
 * Consultas da vitrine. Todas partem do catálogo em cache (loadCatalog) e aplicam
 * filtro/ordenação em memória — adequado até alguns milhares de produtos.
 * Acima disso, mova filtros para SQL (where/orderBy no Prisma) mantendo estas assinaturas.
 */

export type CatalogResult = {
  items: Product[];
  total: number;
  hasMore: boolean;
  facets: Facets;
};

export async function listProducts(filters: CatalogFilters): Promise<CatalogResult> {
  const products = await loadCatalog();
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
  return (await loadCatalog()).find((p) => p.slug === slug);
}

export async function getAllProductSlugs(): Promise<string[]> {
  return (await loadCatalog()).map((p) => p.slug);
}

/** Mesma categoria, priorizando a mesma marca; exclui o próprio produto. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return (await loadCatalog())
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort(
      (a, b) =>
        Number(sameBrand(b.brand, product.brand)) - Number(sameBrand(a.brand, product.brand)) ||
        Number(inStock(b)) - Number(inStock(a)) ||
        b.popularity - a.popularity,
    )
    .slice(0, limit);
}

export async function getNewDrops(limit = 8): Promise<Product[]> {
  return sortProducts((await loadCatalog()).filter(inStock), "novos").slice(0, limit);
}

export async function getTrending(limit = 8): Promise<Product[]> {
  return (await loadCatalog())
    .filter(inStock)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/** Drop em destaque no hero: o mais recente com foto de produto (o recorte da campanha já está no hero). */
export async function getFeaturedDrop(): Promise<Product | undefined> {
  const products = await loadCatalog();
  const withPhoto = products.filter((p) => inStock(p) && p.images[0]?.kind === "photo");
  const [latestDrop] = sortProducts(
    withPhoto.filter((p) => p.badge === "drop"),
    "novos",
  );
  return latestDrop ?? sortProducts(withPhoto, "novos")[0];
}

/** Marcas para o índice da home, com a peça mais procurada de cada uma. */
export async function getBrandSummary(): Promise<{ brand: string; count: number; cover?: Product }[]> {
  const products = await loadCatalog();
  return brandsOf(products).map((brand) => {
    const items = products.filter((p) => sameBrand(p.brand, brand));
    return {
      brand,
      count: items.length,
      cover: items.filter((p) => p.images.length > 0).sort((a, b) => b.popularity - a.popularity)[0],
    };
  });
}

// Capas preferidas (fotos que aguentam texto por cima); se sumirem do catálogo, usa a mais popular com foto
const preferredCovers: Record<Product["category"], string> = {
  sneakers: "court-gum-areia",
  roupas: "calca-cargo-ripstop",
  acessorios: "bone-6-gomos-branco",
};

export async function getCategoryCovers(): Promise<Record<Product["category"], Product | undefined>> {
  const products = await loadCatalog();
  const pick = (category: Product["category"]) =>
    products.find((p) => p.slug === preferredCovers[category] && p.images[0]?.kind === "photo") ??
    products
      .filter((p) => p.category === category && p.images[0]?.kind === "photo")
      .sort((a, b) => b.popularity - a.popularity)[0];
  return { sneakers: pick("sneakers"), roupas: pick("roupas"), acessorios: pick("acessorios") };
}

export type SearchSuggestion =
  | { kind: "product"; slug: string; name: string; brand: string; price: number; image?: string }
  | { kind: "brand"; brand: string; count: number };

export async function searchSuggestions(q: string, limit = 6): Promise<SearchSuggestion[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const products = await loadCatalog();
  const needle = normalize(query);
  const brandHits = brandsOf(products)
    .filter((brand) => normalize(brand).includes(needle))
    .map((brand) => ({ kind: "brand" as const, brand, count: products.filter((p) => sameBrand(p.brand, brand)).length }));
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
  return [...brandHits.slice(0, 1), ...productHits].slice(0, limit);
}
