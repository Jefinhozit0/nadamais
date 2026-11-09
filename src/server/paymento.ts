import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * Paymento — pagamento em criptomoedas (https://docs.paymento.io).
 * Fluxo: criamos o pedido → pedimos um token → o cliente paga na página da Paymento →
 * a Paymento chama nosso IPN (assinado com HMAC) → confirmamos com /verify antes de marcar como pago.
 */

const API_URL = (process.env.PAYMENTO_API_URL ?? "https://api.paymento.io").replace(/\/$/, "");
const GATEWAY_URL = (process.env.PAYMENTO_GATEWAY_URL ?? "https://app.paymento.io/gateway").replace(/\/$/, "");

export function isPaymentoConfigured(): boolean {
  return Boolean(process.env.PAYMENTO_API_KEY && process.env.PAYMENTO_SECRET_KEY);
}

/** Status de pedido da Paymento (documentação: Payment Callback / Payment Verify). */
export const PaymentoStatus = {
  Initialize: 0,
  Pending: 1,
  PartialPaid: 2,
  WaitingToConfirm: 3,
  Timeout: 4,
  UserCanceled: 5,
  Revert: 6,
  Paid: 7,
  Approve: 8,
  Reject: 9,
  Refunded: 10,
} as const;

const statusNames: Record<number, string> = Object.fromEntries(
  Object.entries(PaymentoStatus).map(([name, value]) => [value, name]),
);

export function paymentoStatusName(status: number): string {
  return statusNames[status] ?? `status ${status}`;
}

/** Mensagem curta para o cliente, guardada em statusDetail. */
export function paymentoStatusDetail(status: number): string | undefined {
  switch (status) {
    case PaymentoStatus.Pending:
      return "moeda escolhida, aguardando a transferência";
    case PaymentoStatus.PartialPaid:
      return "valor recebido menor que o total";
    case PaymentoStatus.WaitingToConfirm:
      return "transação vista na blockchain, aguardando confirmações";
    case PaymentoStatus.Timeout:
      return "prazo de pagamento expirou";
    case PaymentoStatus.UserCanceled:
      return "pagamento cancelado na Paymento";
    case PaymentoStatus.Reject:
      return "pagamento não confirmado";
    case PaymentoStatus.Refunded:
      return "pagamento reembolsado";
    default:
      return undefined;
  }
}

/**
 * Mapeia o status da Paymento para o pedido. "pago" só depois do /verify confirmar (Approve),
 * por isso Paid sozinho ainda conta como aguardando.
 */
export function orderStatusFromPaymento(status: number, verified: boolean): OrderStatus {
  switch (status) {
    case PaymentoStatus.Approve:
      return "pago";
    case PaymentoStatus.Paid:
      return verified ? "pago" : "aguardando_pagamento";
    case PaymentoStatus.Timeout:
    case PaymentoStatus.UserCanceled:
    case PaymentoStatus.Reject:
    case PaymentoStatus.Refunded:
      return "cancelado";
    default:
      return "aguardando_pagamento";
  }
}

type Envelope<T> = { success: boolean; message?: string; body?: T; code?: string };

export class PaymentoError extends Error {}

async function call<T>(path: string, body: unknown): Promise<Envelope<T>> {
  const apiKey = process.env.PAYMENTO_API_KEY;
  if (!apiKey) throw new PaymentoError("PAYMENTO_API_KEY não configurada");
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Api-Key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!data) throw new PaymentoError(`resposta inválida da Paymento (HTTP ${res.status})`);
  // erros de regra de negócio voltam como HTTP 200 com success:false
  if (!res.ok && !("success" in data)) throw new PaymentoError(`HTTP ${res.status}`);
  return data;
}

/** Centavos → "1234.50" (formato exigido: dígitos e ponto, sem separador de milhar). */
export function toFiatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function createPaymentRequest(input: {
  orderId: string;
  amount: number;
  email: string;
  returnUrl: string;
  expiresAt: Date;
}): Promise<{ token: string; url: string }> {
  const result = await call<string | { token?: string }>("/v1/payment/request", {
    fiatAmount: toFiatAmount(input.amount),
    // sempre BRL: os preços da loja são em reais (trocar a moeda sem converter cobraria o valor errado)
    fiatCurrency: "BRL",
    orderId: input.orderId,
    returnUrl: input.returnUrl,
    emailAddress: input.email,
    // 1 = a página da Paymento espera as confirmações antes de mostrar "pago"
    riskSpeed: 1,
    tokenExpiryDate: input.expiresAt.toISOString(),
    additionalData: [{ key: "OrderId", value: input.orderId }],
  });
  const token = typeof result.body === "string" ? result.body : result.body?.token;
  if (!result.success || !token) {
    throw new PaymentoError(result.message || "a Paymento recusou o pedido de pagamento");
  }
  return { token, url: `${GATEWAY_URL}?token=${encodeURIComponent(token)}` };
}

export type PaymentoVerification = {
  /** true só quando o pedido está em Approve na Paymento. */
  approved: boolean;
  orderStatus: number | undefined;
  orderId: string | undefined;
  message?: string;
};

/** Confirma o pagamento na API. O primeiro verify de um pedido Paid o move para Approve. */
export async function verifyPayment(token: string): Promise<PaymentoVerification> {
  const result = await call<{ token?: string; orderId?: string; orderStatus?: number }>("/v1/payment/verify", { token });
  return {
    approved: result.success === true,
    orderStatus: typeof result.body?.orderStatus === "number" ? result.body.orderStatus : undefined,
    orderId: result.body?.orderId || undefined,
    message: result.message,
  };
}

/** Configura o endereço do IPN (uma vez, ou quando o domínio mudar). */
export async function setIpnUrl(url: string): Promise<Envelope<unknown>> {
  return call("/v1/payment/settings", { ipN_URL: url, ipN_Method: 1 });
}

/**
 * Valida o cabeçalho X-HMAC-SHA256-Signature: HMAC-SHA256 do corpo BRUTO com a chave secreta,
 * em hexadecimal maiúsculo. Comparação em tempo constante.
 */
export function verifyCallbackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENTO_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex").toUpperCase();
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim().toUpperCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Corpo do IPN (chaves em PascalCase). */
export type PaymentoCallback = {
  Token?: string;
  PaymentId?: string;
  OrderId?: string;
  OrderStatus?: number;
  AdditionalData?: { Key: string; Value: string }[];
};
