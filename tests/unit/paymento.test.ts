import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "segredo-de-teste";

beforeEach(() => {
  process.env.PAYMENTO_API_KEY = "api-key-teste";
  process.env.PAYMENTO_SECRET_KEY = SECRET;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const sign = (body: string, key = SECRET) => createHmac("sha256", key).update(body, "utf8").digest("hex").toUpperCase();

const {
  createPaymentRequest,
  orderStatusFromPaymento,
  PaymentoStatus,
  toFiatAmount,
  verifyCallbackSignature,
} = await import("@/server/paymento");

describe("assinatura do IPN", () => {
  const body = JSON.stringify({ Token: "t1", OrderId: "o1", OrderStatus: 7 });

  it("aceita HMAC-SHA256 hex maiúsculo do corpo bruto", () => {
    expect(verifyCallbackSignature(body, sign(body))).toBe(true);
    expect(verifyCallbackSignature(body, sign(body).toLowerCase())).toBe(true);
  });

  it("rejeita corpo alterado, chave errada e cabeçalho ausente", () => {
    expect(verifyCallbackSignature(body.replace("7", "8"), sign(body))).toBe(false);
    expect(verifyCallbackSignature(body, sign(body, "outra-chave"))).toBe(false);
    expect(verifyCallbackSignature(body, null)).toBe(false);
    expect(verifyCallbackSignature(body, "abc")).toBe(false);
  });

  it("sem chave secreta configurada, nada passa", () => {
    delete process.env.PAYMENTO_SECRET_KEY;
    expect(verifyCallbackSignature(body, sign(body))).toBe(false);
  });
});

describe("status", () => {
  it("só marca pago com Approve, ou Paid confirmado pelo verify", () => {
    expect(orderStatusFromPaymento(PaymentoStatus.Approve, true)).toBe("pago");
    expect(orderStatusFromPaymento(PaymentoStatus.Paid, true)).toBe("pago");
    expect(orderStatusFromPaymento(PaymentoStatus.Paid, false)).toBe("aguardando_pagamento");
  });

  it("em andamento continua aguardando", () => {
    for (const s of [PaymentoStatus.Initialize, PaymentoStatus.Pending, PaymentoStatus.PartialPaid, PaymentoStatus.WaitingToConfirm]) {
      expect(orderStatusFromPaymento(s, false)).toBe("aguardando_pagamento");
    }
  });

  it("expirado, cancelado, rejeitado e reembolsado cancelam (e devolvem o estoque)", () => {
    for (const s of [PaymentoStatus.Timeout, PaymentoStatus.UserCanceled, PaymentoStatus.Reject, PaymentoStatus.Refunded]) {
      expect(orderStatusFromPaymento(s, false)).toBe("cancelado");
    }
  });
});

describe("pedido de pagamento", () => {
  it("valor em reais com ponto decimal, sem separador de milhar", () => {
    expect(toFiatAmount(123450)).toBe("1234.50");
    expect(toFiatAmount(5)).toBe("0.05");
  });

  it("envia BRL, pedido, retorno e chave; devolve o link do gateway", async () => {
    const fetchMock = vi.fn(async () => Response.json({ success: true, message: "", body: "tok_123" }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await createPaymentRequest({
      orderId: "o1",
      amount: 49990,
      email: "a@b.com",
      returnUrl: "https://loja/pedido/o1",
      expiresAt: new Date("2030-01-01T00:00:00Z"),
    });
    expect(result).toEqual({ token: "tok_123", url: "https://app.paymento.io/gateway?token=tok_123" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.paymento.io/v1/payment/request");
    expect((init.headers as Record<string, string>)["Api-Key"]).toBe("api-key-teste");
    expect(JSON.parse(init.body as string)).toMatchObject({
      fiatAmount: "499.90",
      fiatCurrency: "BRL",
      orderId: "o1",
      returnUrl: "https://loja/pedido/o1",
      tokenExpiryDate: "2030-01-01T00:00:00.000Z",
    });
  });

  it("erro de regra (HTTP 200 com success:false) vira exceção com a mensagem", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: false, message: "Currency not supported", body: null })));
    await expect(
      createPaymentRequest({ orderId: "o1", amount: 100, email: "a@b.com", returnUrl: "https://x", expiresAt: new Date(Date.now() + 1000) }),
    ).rejects.toThrow("Currency not supported");
  });
});

/* -------------------------------------------------------------------------- */
/*  Webhook                                                                    */
/* -------------------------------------------------------------------------- */

const orders = new Map<string, { status: string; payment: { provider: string; providerPaymentId?: string } }>();
const updates: { id: string; patch: Record<string, unknown> }[] = [];

vi.mock("@/server/orders", () => ({
  getOrder: async (id: string) => orders.get(id),
  updateOrder: async (id: string, patch: Record<string, unknown>) => {
    updates.push({ id, patch });
    return orders.get(id);
  },
}));

const { POST } = await import("@/app/api/webhooks/paymento/route");

function ipn(payload: Record<string, unknown>, signature?: string) {
  const body = JSON.stringify(payload);
  return new Request("https://loja/api/webhooks/paymento", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-HMAC-SHA256-Signature": signature ?? sign(body) },
    body,
  });
}

function verifyReturns(orderStatus: number, success: boolean, orderId = "o1") {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success, message: "", body: { token: "tok", orderId, orderStatus } })));
}

describe("webhook da Paymento", () => {
  beforeEach(() => {
    orders.clear();
    updates.length = 0;
    orders.set("o1", { status: "aguardando_pagamento", payment: { provider: "paymento", providerPaymentId: "tok" } });
  });

  it("assinatura inválida → 401 e nada muda", async () => {
    const res = await POST(ipn({ Token: "tok", OrderId: "o1", OrderStatus: 7 }, "FORJADA"));
    expect(res.status).toBe(401);
    expect(updates).toHaveLength(0);
  });

  it("Paid + verify aprovado → pedido pago", async () => {
    verifyReturns(PaymentoStatus.Approve, true);
    const res = await POST(ipn({ Token: "tok", OrderId: "o1", OrderStatus: 7 }));
    expect(res.status).toBe(200);
    expect(updates[0]?.patch).toMatchObject({ status: "pago", payment: { providerStatus: "Approve" } });
  });

  it("não confia no status do corpo: verify diz que ainda falta confirmar", async () => {
    verifyReturns(PaymentoStatus.WaitingToConfirm, false);
    await POST(ipn({ Token: "tok", OrderId: "o1", OrderStatus: 7 }));
    expect(updates[0]?.patch.status).toBeUndefined();
    expect(updates[0]?.patch).toMatchObject({ payment: { providerStatus: "WaitingToConfirm" } });
  });

  it("token de outro pedido é ignorado", async () => {
    verifyReturns(PaymentoStatus.Approve, true);
    const res = await POST(ipn({ Token: "outro-token", OrderId: "o1", OrderStatus: 7 }));
    expect(res.status).toBe(200);
    expect(updates).toHaveLength(0);
  });

  it("pedido já pago nunca volta para cancelado", async () => {
    orders.set("o1", { status: "pago", payment: { provider: "paymento", providerPaymentId: "tok" } });
    verifyReturns(PaymentoStatus.Refunded, false);
    await POST(ipn({ Token: "tok", OrderId: "o1", OrderStatus: 10 }));
    expect(updates[0]?.patch.status).toBeUndefined();
  });

  it("expirou → cancelado (devolve estoque)", async () => {
    verifyReturns(PaymentoStatus.Timeout, false);
    await POST(ipn({ Token: "tok", OrderId: "o1", OrderStatus: 4 }));
    expect(updates[0]?.patch).toMatchObject({ status: "cancelado" });
  });

  it("pagou depois de cancelado → mantém cancelado e sinaliza para o admin", async () => {
    orders.set("o1", { status: "cancelado", payment: { provider: "paymento", providerPaymentId: "tok" } });
    verifyReturns(PaymentoStatus.Approve, true);
    await POST(ipn({ Token: "tok", OrderId: "o1", OrderStatus: 7 }));
    expect(updates[0]?.patch.status).toBeUndefined();
    expect(String((updates[0]?.patch.payment as { statusDetail?: string }).statusDetail)).toMatch(/ATENÇÃO/);
  });

  it("falha ao consultar o verify → 500 para a Paymento tentar de novo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("rede"); }));
    const res = await POST(ipn({ Token: "tok", OrderId: "o1", OrderStatus: 7 }));
    expect(res.status).toBe(500);
    expect(updates).toHaveLength(0);
  });
});
