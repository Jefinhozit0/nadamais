import { getOrder, updateOrder } from "@/server/orders";
import {
  orderStatusFromPaymento,
  paymentoStatusDetail,
  paymentoStatusName,
  verifyCallbackSignature,
  verifyPayment,
  type PaymentoCallback,
} from "@/server/paymento";

/**
 * IPN da Paymento (pagamento em cripto).
 * 1. Valida a assinatura HMAC sobre o corpo bruto.
 * 2. Nunca confia no status do corpo: consulta /verify, que também aprova um pedido Paid.
 * 3. Só mexe no status de pedidos ainda aguardando pagamento (um pedido pago nunca volta atrás).
 * A Paymento manda POST ou PUT, conforme a configuração — aceitamos os dois.
 */
async function handle(request: Request): Promise<Response> {
  const raw = await request.text();
  if (!verifyCallbackSignature(raw, request.headers.get("x-hmac-sha256-signature"))) {
    return new Response("assinatura inválida", { status: 401 });
  }

  let payload: PaymentoCallback;
  try {
    payload = JSON.parse(raw) as PaymentoCallback;
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }
  const token = payload.Token;
  const orderId = payload.OrderId || payload.AdditionalData?.find((d) => d.Key === "OrderId")?.Value;
  if (!token || !orderId) return new Response(null, { status: 200 });

  const order = await getOrder(orderId);
  // pedido desconhecido ou token que não é o deste pedido: confirma o recebimento e ignora
  if (!order || order.payment.provider !== "paymento" || order.payment.providerPaymentId !== token) {
    return new Response(null, { status: 200 });
  }

  let verification;
  try {
    verification = await verifyPayment(token);
  } catch (error) {
    console.error("[paymento] verify falhou", error);
    // 500: a Paymento tenta de novo (para pedidos Paid)
    return new Response(null, { status: 500 });
  }
  if (verification.orderId && verification.orderId !== orderId) {
    console.error("[paymento] verify devolveu outro pedido", { token, orderId, other: verification.orderId });
    return new Response(null, { status: 200 });
  }

  const status = verification.orderStatus ?? payload.OrderStatus ?? 0;
  const next = orderStatusFromPaymento(status, verification.approved);
  const canChangeStatus = order.status === "aguardando_pagamento";

  // pagou depois que o pedido expirou/foi cancelado (estoque já devolvido): sinaliza para o admin resolver
  const paidTooLate = order.status === "cancelado" && next === "pago";

  await updateOrder(orderId, {
    ...(canChangeStatus && next !== order.status && { status: next }),
    payment: {
      providerStatus: paymentoStatusName(status),
      statusDetail: paidTooLate
        ? "ATENÇÃO: pago em cripto depois do cancelamento — confirmar estoque e enviar ou reembolsar"
        : paymentoStatusDetail(status),
    },
  });
  return new Response(null, { status: 200 });
}

export const POST = handle;
export const PUT = handle;
