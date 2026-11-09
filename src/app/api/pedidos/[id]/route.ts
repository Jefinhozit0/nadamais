import { getOrder, updateOrder } from "@/server/orders";
import { isMercadoPagoConfigured } from "@/server/mercadopago";

/** Status do pedido para a página de confirmação acompanhar o Pix/boleto. */
export async function GET(_request: Request, { params }: RouteContext<"/api/pedidos/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  return Response.json(
    { status: order.status, updatedAt: order.updatedAt },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Só no modo demonstração e fora de produção: simula a confirmação do pagamento. */
export async function POST(_request: Request, { params }: RouteContext<"/api/pedidos/[id]">) {
  if (isMercadoPagoConfigured() || process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }
  const { id } = await params;
  const order = await updateOrder(id, { status: "pago", payment: { providerStatus: "approved" } });
  if (!order) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  return Response.json({ status: order.status });
}
