import { describe, expect, it } from "vitest";
import { emailKindForStatus, renderOrderEmail, wasPaid } from "@/server/email/templates";
import type { Order } from "@/server/orders";

const SITE = "https://loja.test";

function order(over: Partial<Order> = {}): Order {
  return {
    id: "abc123",
    number: "1042",
    createdAt: "2026-11-10T12:00:00.000Z",
    updatedAt: "2026-11-10T12:00:00.000Z",
    status: "pago",
    profileId: "u1",
    customer: { name: "Ana <b>Souza</b>", email: "ana@example.com", cpf: "12345678909", phone: "11999999999" },
    address: { cep: "01310100", street: "Av. Paulista", number: "1000", complement: "", district: "Bela Vista", city: "São Paulo", state: "SP" },
    lines: [{ productId: "p1", slug: "air-max-95", name: "Air Max 95", brand: "Nike", size: "41", quantity: 1, unitPrice: 99900, total: 99900, image: "/images/x.jpg" }],
    shipping: { method: "pac", label: "PAC", price: 0, days: 7 },
    totals: { subtotal: 99900, shipping: 0, discount: 0, total: 99900 },
    payment: { method: "card", provider: "mercadopago", providerStatus: "approved" },
    ...over,
  } as Order;
}

describe("emailKindForStatus", () => {
  it("avisa nas mudanças que importam ao cliente", () => {
    expect(emailKindForStatus("pago")).toBe("pagamento_aprovado");
    expect(emailKindForStatus("enviado")).toBe("pedido_enviado");
    expect(emailKindForStatus("entregue")).toBe("pedido_entregue");
    expect(emailKindForStatus("cancelado")).toBe("pedido_cancelado");
    expect(emailKindForStatus("recusado")).toBe("pedido_cancelado");
    expect(emailKindForStatus("em_separacao")).toBeUndefined();
    expect(emailKindForStatus("aguardando_pagamento")).toBeUndefined();
  });
});

describe("renderOrderEmail", () => {
  it("escapa dados do cliente e usa o primeiro nome", () => {
    const email = renderOrderEmail("pagamento_aprovado", order(), SITE);
    expect(email.html).not.toContain("<b>");
    expect(email.html).toContain("Ana");
    expect(email.subject).toContain("1042");
    expect(email.html).toContain("https://loja.test/images/x.jpg");
    expect(email.html).toContain("https://loja.test/pedido/abc123");
  });

  it("enviado traz o código e o link dos Correios", () => {
    const email = renderOrderEmail("pedido_enviado", order({ status: "enviado", trackingCode: "AA123456789BR" }), SITE);
    expect(email.html).toContain("AA123456789BR");
    expect(email.html).toContain("rastreamento.correios.com.br/app/index.php?objetos=AA123456789BR");
    expect(email.text).toContain("AA123456789BR");
    expect(email.preheader).toContain("AA123456789BR");
  });

  it("entregue só pede avaliação de quem tem conta (avaliar exige login)", () => {
    expect(renderOrderEmail("pedido_entregue", order({ status: "entregue" }), SITE).html).toContain("/produto/air-max-95#avaliacoes");
    expect(renderOrderEmail("pedido_entregue", order({ status: "entregue", profileId: undefined }), SITE).html).not.toContain("#avaliacoes");
  });

  it("pedido recebido no Pix leva o copia e cola", () => {
    const email = renderOrderEmail(
      "pedido_recebido",
      order({ status: "aguardando_pagamento", payment: { method: "pix", provider: "mercadopago", providerStatus: "pending", pix: { qrCode: "00020126PIXCODE" } } }),
      SITE,
    );
    expect(email.html).toContain("00020126PIXCODE");
    expect(email.subject).toMatch(/falta o pagamento/);
  });

  it("cancelamento diferencia estorno de nada cobrado", () => {
    const paid = order({ status: "cancelado" });
    const unpaid = order({ status: "cancelado", payment: { method: "pix", provider: "mercadopago", providerStatus: "cancelled" } });
    expect(wasPaid(paid)).toBe(true);
    expect(wasPaid(unpaid)).toBe(false);
    expect(renderOrderEmail("pedido_cancelado", paid, SITE).text).toMatch(/estorno/);
    expect(renderOrderEmail("pedido_cancelado", unpaid, SITE).text).toMatch(/Nada foi cobrado/);
  });
});
