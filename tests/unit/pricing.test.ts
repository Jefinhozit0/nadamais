import { describe, expect, it, vi } from "vitest";
import type { Product } from "@/types/product";

/**
 * O preço do pedido é autoritativo no servidor: o navegador só manda produto, tamanho e quantidade.
 * O catálogo é substituído por um produto fixo para testar as regras sem banco.
 */
const fixture = {
  id: "p1",
  slug: "teste",
  name: "Tênis Teste",
  shortName: "teste",
  line: "court",
  category: "sneakers",
  type: "tênis",
  colorway: "preto",
  colors: ["preto"],
  sku: "T-1",
  description: "",
  details: [],
  price: 40000,
  images: [],
  sizeSystem: "sneaker",
  sizes: [
    { label: "40", stock: 2 },
    { label: "41", stock: 0 },
  ],
  releaseYear: 2026,
  releasedAt: "2026-01-01",
  popularity: 50,
} satisfies Product;

vi.mock("@/server/catalog-source", () => ({
  loadProductsFresh: async (ids: string[]) => (ids.includes("p1") ? [fixture] : []),
}));

const { priceCart, computeTotals, shippingFor, pickShipping } = await import("@/server/pricing");

describe("priceCart", () => {
  it("usa o preço do catálogo, ignorando qualquer preço vindo do navegador", async () => {
    const forged = { productId: "p1", size: "40", quantity: 1, price: 1 };
    const cart = await priceCart([forged]);
    expect(cart.lines[0]).toMatchObject({ unitPrice: 40000, total: 40000 });
    expect(cart.subtotal).toBe(40000);
  });

  it("limita a quantidade ao estoque e avisa", async () => {
    const cart = await priceCart([{ productId: "p1", size: "40", quantity: 5 }]);
    expect(cart.lines[0]!.quantity).toBe(2);
    expect(cart.issues).toEqual([{ productId: "p1", size: "40", reason: "estoque", available: 2 }]);
  });

  it("remove tamanho esgotado e produto inexistente", async () => {
    const cart = await priceCart([
      { productId: "p1", size: "41", quantity: 1 },
      { productId: "nao-existe", size: "40", quantity: 1 },
    ]);
    expect(cart.lines).toHaveLength(0);
    expect(cart.subtotal).toBe(0);
    expect(cart.issues.map((i) => i.reason)).toEqual(["indisponivel", "indisponivel"]);
  });
});

describe("computeTotals", () => {
  it("desconto Pix incide só nos produtos, não no frete", async () => {
    const cart = await priceCart([{ productId: "p1", size: "40", quantity: 1 }]);
    const shipping = pickShipping(shippingFor("01310100", cart), "expressa");

    const pix = computeTotals(cart, shipping, "pix");
    expect(pix.discount).toBe(2000);
    expect(pix.total).toBe(40000 - 2000 + shipping.price);

    const card = computeTotals(cart, shipping, "card");
    expect(card.discount).toBe(0);
    expect(card.total).toBe(40000 + shipping.price);
  });

  it("frete grátis na econômica acima do mínimo", async () => {
    const cart = await priceCart([{ productId: "p1", size: "40", quantity: 2 }]);
    expect(pickShipping(shippingFor("90000000", cart), "economica").price).toBe(0);
  });
});
