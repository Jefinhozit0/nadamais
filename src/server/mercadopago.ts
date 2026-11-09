import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";

/**
 * Cliente do Mercado Pago (servidor). Sem MP_ACCESS_TOKEN o checkout roda em
 * "modo demonstração": nada é cobrado e o pagamento é simulado.
 */

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN && process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
}

let client: MercadoPagoConfig | undefined;

export function paymentClient(): Payment {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MP_ACCESS_TOKEN não configurado");
  client ??= new MercadoPagoConfig({ accessToken, options: { timeout: 10_000 } });
  return new Payment(client);
}

/**
 * Valida a assinatura do webhook (cabeçalho x-signature: "ts=...,v1=...").
 * Manifesto: `id:{data.id};request-id:{x-request-id};ts:{ts};` com HMAC-SHA256 da chave secreta.
 */
export function verifyWebhookSignature(params: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !params.signature) return false;
  const parts = Object.fromEntries(
    params.signature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  let manifest = `id:${params.dataId.toLowerCase()};`;
  if (params.requestId) manifest += `request-id:${params.requestId};`;
  manifest += `ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
