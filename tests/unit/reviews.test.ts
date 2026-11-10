import { beforeEach, describe, expect, it, vi } from "vitest";
import { computeStats, displayName, fitVerdict, formatRating, reviewInputSchema } from "@/lib/reviews";

describe("regras de avaliação", () => {
  it("nome exibido: primeiro nome + inicial do sobrenome", () => {
    expect(displayName("ana clara de souza")).toBe("Ana S.");
    expect(displayName("  JOÃO  ")).toBe("João");
    expect(displayName("")).toBe("Cliente");
    expect(displayName(null)).toBe("Cliente");
  });

  it("média com 1 casa, distribuição e caimento", () => {
    const s = computeStats([
      { rating: 5, fit: "certo" },
      { rating: 4, fit: "certo" },
      { rating: 4, fit: "pequeno" },
      { rating: 2 },
    ]);
    expect(s.count).toBe(4);
    expect(s.average).toBe(3.8);
    expect(s.distribution).toEqual([0, 1, 0, 2, 1]);
    expect(fitVerdict(s.fit)).toEqual({ fit: "certo", percent: 67 });
    expect(formatRating(s.average)).toBe("3,8");
  });

  it("caimento só com 3 votos ou mais", () => {
    expect(fitVerdict({ pequeno: 0, certo: 2, grande: 0 })).toBeUndefined();
  });

  it("valida nota e tamanho do texto", () => {
    expect(reviewInputSchema.safeParse({ productId: "p", rating: "0", body: "x".repeat(30) }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ productId: "p", rating: "5", body: "curto" }).success).toBe(false);
    const ok = reviewInputSchema.safeParse({ productId: "p", rating: "5", body: "veio certinho, muito confortável", fit: "xx" });
    expect(ok.success && ok.data.fit).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/*  Ação de salvar: só quem recebeu o produto                                 */
/* -------------------------------------------------------------------------- */

const state = {
  profile: null as null | { id: string; name: string | null },
  deliveredOrder: null as null | { id: string; items: { size: string }[] },
  upserts: [] as unknown[],
};

vi.mock("next/cache", () => ({ updateTag: vi.fn(), cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/server/auth", () => ({ getProfile: async () => state.profile }));
vi.mock("@/server/db", () => ({
  db: {
    order: {
      findFirst: async () => state.deliveredOrder,
      findUnique: async () => ({ customerName: "Bruna Lima Alves", address: { city: "Recife", state: "PE" } }),
    },
    review: {
      findUnique: async () => null,
      upsert: async (args: unknown) => state.upserts.push(args),
      deleteMany: async () => ({ count: 0 }),
    },
  },
}));

const { saveReview } = await import("@/app/produto/actions");

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const valid = { productId: "prod-1", rating: "5", body: "Chegou rápido e o couro é muito bom.", fit: "certo" };

describe("salvar avaliação", () => {
  beforeEach(() => {
    state.profile = { id: "user-1", name: null };
    state.deliveredOrder = { id: "ord-1", items: [{ size: "41" }] };
    state.upserts = [];
  });

  it("sem login não salva", async () => {
    state.profile = null;
    const res = await saveReview({}, form(valid));
    expect(res.error).toMatch(/sessão/);
    expect(state.upserts).toHaveLength(0);
  });

  it("sem pedido entregue com o produto não salva", async () => {
    state.deliveredOrder = null;
    const res = await saveReview({}, form(valid));
    expect(res.error).toMatch(/recebeu/);
    expect(state.upserts).toHaveLength(0);
  });

  it("com pedido entregue: salva com nome abreviado, cidade e tamanho do pedido", async () => {
    const res = await saveReview({}, form(valid));
    expect(res.ok).toBe(true);
    expect(state.upserts[0]).toMatchObject({
      where: { profileId_productId: { profileId: "user-1", productId: "prod-1" } },
      create: { rating: 5, authorName: "Bruna A.", city: "Recife, PE", size: "41", orderId: "ord-1", fit: "certo" },
    });
  });

  it("dados inválidos voltam com erro por campo", async () => {
    const res = await saveReview({}, form({ ...valid, rating: "", body: "ok" }));
    expect(res.fields?.rating).toBeDefined();
    expect(res.fields?.body).toBeDefined();
    expect(state.upserts).toHaveLength(0);
  });
});
