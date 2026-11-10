import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { computeStats, emptyStats, type RatingSummary, type Review, type ReviewStats } from "@/lib/reviews";
import { db } from "./db";

// sem importar catalog-source (que importa este arquivo)
const hasDatabase = () => Boolean(process.env.DATABASE_URL);

/**
 * Avaliação é complemento: se a leitura falhar (ex.: migração ainda não aplicada),
 * a loja continua funcionando sem estrelas em vez de quebrar a vitrine.
 */
async function safely<T>(what: string, fallback: T, read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[avaliações] falha ao ler ${what}; seguindo sem avaliações`, error);
    return fallback;
  }
}

/**
 * Avaliações reais de clientes. Só quem recebeu o produto (pedido "entregue") avalia.
 * Sem banco (modo mock) não há avaliações — nunca exibimos avaliações inventadas.
 */

export const REVIEWS_TAG = "reviews";

const PUBLIC_SELECT = {
  id: true,
  source: true,
  rating: true,
  title: true,
  body: true,
  fit: true,
  size: true,
  authorName: true,
  city: true,
  createdAt: true,
} as const;

type ReviewRow = {
  id: string;
  source: Review["source"];
  rating: number;
  title: string | null;
  body: string;
  fit: Review["fit"] | null;
  size: string | null;
  authorName: string;
  city: string | null;
  createdAt: Date;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    source: row.source,
    rating: row.rating,
    title: row.title || undefined,
    body: row.body,
    fit: row.fit ?? undefined,
    size: row.size ?? undefined,
    authorName: row.authorName,
    city: row.city ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Média e total por produto (cards, catálogo). Lido junto com o catálogo. */
export async function loadRatingMap(): Promise<Map<string, RatingSummary>> {
  if (!hasDatabase()) return new Map();
  return safely("médias", new Map(), async () => {
    const rows = await db.review.groupBy({
      by: ["productId"],
      where: { hidden: false },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return new Map(
      rows.map((r) => [r.productId, { average: Math.round((r._avg.rating ?? 0) * 10) / 10, count: r._count._all }]),
    );
  });
}

export type ProductReviews = {
  stats: ReviewStats;
  /** Só compras verificadas — é o que vai para as estrelas do Google. */
  verified: { average: number; count: number };
  reviews: Review[];
};

/** Resumo completo + avaliações mais recentes de um produto. */
export async function getProductReviews(productId: string, take = 30): Promise<ProductReviews> {
  "use cache";
  cacheLife("minutes");
  cacheTag(REVIEWS_TAG);
  if (!hasDatabase()) return { stats: emptyStats(), verified: { average: 0, count: 0 }, reviews: [] };
  const where = { productId, hidden: false };
  const empty: ProductReviews = { stats: emptyStats(), verified: { average: 0, count: 0 }, reviews: [] };
  return safely("avaliações do produto", empty, async () => {
    const [all, latest] = await Promise.all([
      db.review.findMany({ where, select: { rating: true, fit: true, source: true } }),
      db.review.findMany({ where, select: PUBLIC_SELECT, orderBy: { createdAt: "desc" }, take }),
    ]);
    const verified = computeStats(all.filter((r) => r.source === "site"));
    return {
      stats: computeStats(all),
      verified: { average: verified.average, count: verified.count },
      reviews: latest.map(toReview),
    };
  });
}

export type FeaturedReview = Review & { product: { slug: string; name: string; image?: string } };

/** Depoimentos da home: notas 4–5 com texto, um por produto, mais recentes primeiro. */
export async function getFeaturedReviews(limit = 6): Promise<FeaturedReview[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(REVIEWS_TAG);
  if (!hasDatabase()) return [];
  const rows = await safely("depoimentos", [], () => db.review.findMany({
    where: { hidden: false, rating: { gte: 4 }, product: { active: true } },
    select: {
      ...PUBLIC_SELECT,
      productId: true,
      product: { select: { slug: true, name: true, images: { select: { src: true }, orderBy: { position: "asc" }, take: 1 } } },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit * 4,
  }));
  const seen = new Set<string>();
  const out: FeaturedReview[] = [];
  for (const row of rows) {
    if (seen.has(row.productId)) continue;
    seen.add(row.productId);
    out.push({
      ...toReview(row),
      product: { slug: row.product.slug, name: row.product.name, image: row.product.images[0]?.src },
    });
    if (out.length === limit) break;
  }
  return out;
}

export type ReviewEligibility =
  | { kind: "anonymous" }
  | { kind: "not-delivered" }
  | { kind: "eligible"; orderId: string; size: string; existing?: Review };

/** Pode avaliar? Precisa de um pedido entregue deste cliente com este produto. */
export async function getReviewEligibility(profileId: string, productId: string): Promise<ReviewEligibility> {
  const [order, existing] = await Promise.all([
    db.order.findFirst({
      where: { profileId, status: "entregue", items: { some: { productId } } },
      orderBy: { createdAt: "desc" },
      select: { id: true, items: { where: { productId }, select: { size: true }, take: 1 } },
    }),
    db.review.findUnique({ where: { profileId_productId: { profileId, productId } }, select: PUBLIC_SELECT }),
  ]);
  if (!order) return { kind: "not-delivered" };
  return { kind: "eligible", orderId: order.id, size: order.items[0]?.size ?? "", existing: existing ? toReview(existing) : undefined };
}

/** Lista do admin (inclui ocultas). */
export async function listAdminReviews(filter: { hidden?: boolean }, take = 100) {
  const rows = await db.review.findMany({
    where: filter.hidden === undefined ? {} : { hidden: filter.hidden },
    select: {
      ...PUBLIC_SELECT,
      hidden: true,
      orderId: true,
      consentNote: true,
      importedBy: true,
      product: { select: { name: true, slug: true } },
      profile: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((r) => ({
    ...toReview(r),
    hidden: r.hidden,
    orderId: r.orderId ?? undefined,
    product: r.product,
    email: r.profile?.email,
    consentNote: r.consentNote ?? undefined,
    importedBy: r.importedBy ?? undefined,
  }));
}

/** Média geral da loja (home). */
export async function getStoreRating(): Promise<RatingSummary> {
  "use cache";
  cacheLife("minutes");
  cacheTag(REVIEWS_TAG);
  if (!hasDatabase()) return { average: 0, count: 0 };
  return safely("média da loja", { average: 0, count: 0 }, async () => {
    const agg = await db.review.aggregate({ where: { hidden: false }, _avg: { rating: true }, _count: { _all: true } });
    return { average: Math.round((agg._avg.rating ?? 0) * 10) / 10, count: agg._count._all };
  });
}

/** Produtos para o cadastro manual de depoimentos. */
export async function listReviewableProducts() {
  return db.product.findMany({
    where: { active: true },
    select: { id: true, name: true, colorway: true, sizeSystem: true, sizes: { select: { label: true }, orderBy: { position: "asc" } } },
    orderBy: { name: "asc" },
  });
}
