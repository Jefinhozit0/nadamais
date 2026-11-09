import type { NextRequest } from "next/server";
import { paymentClient, verifyWebhookSignature } from "@/server/mercadopago";
import { getOrder, statusFromProvider, updateOrder } from "@/server/orders";

/**
 * Notificações do Mercado Pago (tópico "payment").
 * Nunca confia no corpo: valida a assinatura e busca o pagamento na API antes de atualizar o pedido.
 */
export async function POST(request: NextRequest) {
  const url = request.nextUrl;
  const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const dataId = String(url.searchParams.get("data.id") ?? body.data?.id ?? "");
  const type = url.searchParams.get("type") ?? body.type;

  if (type !== "payment" || !dataId) return new Response(null, { status: 200 });

  const valid = verifyWebhookSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) return new Response("assinatura inválida", { status: 401 });

  try {
    const payment = await paymentClient().get({ id: dataId });
    const orderId = payment.external_reference;
    if (!orderId || !(await getOrder(orderId))) return new Response(null, { status: 200 });
    await updateOrder(orderId, {
      status: statusFromProvider(payment.status),
      payment: {
        method: payment.payment_method_id === "pix" ? "pix" : payment.payment_type_id === "ticket" ? "boleto" : "card",
        provider: "mercadopago",
        providerPaymentId: String(payment.id),
        providerStatus: payment.status,
        statusDetail: payment.status_detail,
      },
    });
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("[webhook] erro ao consultar pagamento", error);
    // 500 faz o Mercado Pago tentar de novo mais tarde
    return new Response(null, { status: 500 });
  }
}
