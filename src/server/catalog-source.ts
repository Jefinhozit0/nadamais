import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { products as mockProducts } from "@/data/products";
import type { Prisma } from "@/generated/prisma/client";
import type { Product } from "@/types/product";
import { db } from "./db";
import { loadRatingMap } from "./reviews";

/**
 * Fonte do catálogo.
 * - Com DATABASE_URL: lê do Postgres (Supabase) via Prisma.
 * - Sem banco: usa o mock de src/data/products.ts (o site continua navegável em dev).
 */

export const CATALOG_TAG = "products";

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const include = {
  images: { orderBy: { position: "asc" } },
  sizes: { orderBy: { position: "asc" } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof include }>;

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    line: row.line,
    category: row.category,
    type: row.type,
    colorway: row.colorway,
    colors: row.colors as Product["colors"],
    sku: row.sku,
    description: row.description,
    details: row.details,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    images: row.images.map((i) => ({
      src: i.src,
      alt: i.alt,
      width: i.width,
      height: i.height,
      kind: i.kind,
      credit: i.credit ?? undefined,
    })),
    sizeSystem: row.sizeSystem === "one_size" ? "one-size" : row.sizeSystem,
    sizes: row.sizes.map((s) => ({ label: s.label, stock: s.stock })),
    releaseYear: row.releasedAt.getUTCFullYear(),
    releasedAt: row.releasedAt.toISOString().slice(0, 10),
    popularity: row.popularity,
    badge: row.badge ?? undefined,
  };
}

/** Catálogo ativo (com média das avaliações), em cache. Invalidado com updateTag(CATALOG_TAG). */
export async function loadCatalog(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);
  if (!hasDatabase()) return [...mockProducts];
  const [rows, ratings] = await Promise.all([
    db.product.findMany({ where: { active: true }, include, orderBy: { popularity: "desc" } }),
    loadRatingMap(),
  ]);
  return rows.map((row) => ({ ...toProduct(row), rating: ratings.get(row.id) }));
}

/** Produtos sem cache (preço e estoque autoritativos para o checkout). */
export async function loadProductsFresh(ids: readonly string[]): Promise<Product[]> {
  if (!hasDatabase()) return mockProducts.filter((p) => ids.includes(p.id));
  const rows = await db.product.findMany({ where: { id: { in: [...ids] }, active: true }, include });
  return rows.map(toProduct);
}
