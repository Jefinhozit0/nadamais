import { beforeEach, describe, expect, it, vi } from "vitest";
import { manualReviewSchema } from "@/lib/reviews";

const base = {
  productId: "prod-1",
  customerName: "maria eduarda lopes",
  city: "Belém, PA",
  rating: "5",
  body: "Comprei no drop de outubro e o moletom é muito grosso, amei.",
  receivedAt: "2026-10-02",
  consentNote: "WhatsApp em 02/10, autorizou por mensagem, print salvo",
  consent: "on",
};

describe("depoimento por mensagem: validação", () => {
  it("aceita com autorização registrada", () => {
    expect(manualReviewSchema.safeParse(base).success).toBe(true);
  });

  it("exige a confirmação e a nota da autorização", () => {
    const { consent, ...noConsent } = base;
    void consent;
    expect(manualReviewSchema.safeParse(noConsent).success).toBe(false);
    expect(manualReviewSchema.safeParse({ ...base, consentNote: "ok" }).success).toBe(false);
  });

  it("não aceita data no futuro", () => {
    expect(manualReviewSchema.safeParse({ ...base, receivedAt: "2999-01-01" }).success).toBe(false);
  });
});

const created: Record<string, unknown>[] = [];
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn(), cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/admin", () => ({ requireAdmin: async () => ({ email: "admin@loja.com" }) }));
vi.mock("@/server/orders", () => ({ updateOrder: vi.fn() }));
vi.mock("@/server/db", () => ({
  db: {
    product: { findUnique: async ({ where }: { where: { id: string } }) => (where.id === "prod-1" ? { id: "prod-1" } : null) },
    review: { create: async ({ data }: { data: Record<string, unknown> }) => created.push(data) },
  },
}));

const { createManualReview } = await import("@/app/admin/actions");

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

describe("depoimento por mensagem: cadastro", () => {
  beforeEach(() => {
    created.length = 0;
  });

  it("grava como 'mensagem', nome abreviado, data recebida e quem cadastrou", async () => {
    const res = await createManualReview({}, form(base));
    expect(res.ok).toBe(true);
    expect(created[0]).toMatchObject({
      source: "mensagem",
      authorName: "Maria L.",
      city: "Belém, PA",
      importedBy: "admin@loja.com",
      consentNote: base.consentNote,
    });
    expect((created[0]!.createdAt as Date).toISOString()).toBe("2026-10-02T15:00:00.000Z");
    expect(created[0]).not.toHaveProperty("profileId");
  });

  it("sem confirmação não grava", async () => {
    const { consent, ...rest } = base;
    void consent;
    const res = await createManualReview({}, form(rest));
    expect(res.fields?.consent).toBeDefined();
    expect(created).toHaveLength(0);
  });

  it("produto inexistente não grava", async () => {
    const res = await createManualReview({}, form({ ...base, productId: "nao-existe" }));
    expect(res.fields?.productId).toBeDefined();
    expect(created).toHaveLength(0);
  });
});
