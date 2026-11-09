import { z } from "zod";
import { siteConfig } from "@/config/site";
import {
  addressSchema,
  cartItemSchema,
  customerSchema,
  fieldErrors,
  paymentMethodSchema,
  shippingMethodSchema,
} from "@/lib/checkout-schema";
import { isMercadoPagoConfigured, paymentClient } from "@/server/mercadopago";
import { createOrder, statusFromProvider, updateOrder, type PaymentInfo } from "@/server/orders";
import { computeTotals, pickShipping, priceCart, shippingFor } from "@/server/pricing";

/** Dados vindos do Payment Brick (só quando o Mercado Pago está configurado). */
const brickSchema = z
  .object({
    token: z.string().optional(),
    issuer_id: z.union([z.string(), z.number()]).optional(),
    payment_method_id: z.string(),
    installments: z.number().int().min(1).max(12).optional(),
  })
  .optional();

const bodySchema = z.object({
  items: z.array(cartItemSchema).min(1).max(30),
  customer: customerSchema,
  address: addressSchema,
  shippingMethod: shippingMethodSchema,
  payment: z.object({ method: paymentMethodSchema, brick: brickSchema }),
});

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Confira os dados do pedido.", fields: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { items, customer, address, shippingMethod, payment } = parsed.data;

  // 1. Preços, estoque e frete recalculados no servidor
  const cart = priceCart(items);
  if (cart.issues.length > 0 || cart.lines.length === 0) {
    return Response.json(
      { error: "Algum item mudou de estoque. Revise a sacola.", issues: cart.issues, cart },
      { status: 409 },
    );
  }
  const shipping = pickShipping(shippingFor(address.cep, cart), shippingMethod);
  const totals = computeTotals(cart, shipping, payment.method);

  const live = isMercadoPagoConfigured();
  if (live && !payment.brick) {
    return Response.json({ error: "Pagamento incompleto. Tente de novo." }, { status: 400 });
  }

  // 2. Pedido criado antes da cobrança (referência externa do pagamento)
  const order = await createOrder({
    customer,
    address,
    lines: cart.lines,
    shipping,
    totals,
    payment: { method: payment.method, provider: live ? "mercadopago" : "demo" },
  });

  // 3a. Modo demonstração: nada é cobrado
  if (!live) {
    const demo: PaymentInfo =
      payment.method === "card"
        ? { method: "card", provider: "demo", providerStatus: "approved", card: { lastFour: "0000", installments: 1 } }
        : payment.method === "pix"
          ? {
              method: "pix",
              provider: "demo",
              providerStatus: "pending",
              pix: { qrCode: `00020126DEMO-${order.number}-NAO-PAGUE-ESTE-CODIGO6304ABCD` },
            }
          : { method: "boleto", provider: "demo", providerStatus: "pending", boleto: { url: "#demo", barcode: "00000.00000 00000.000000 00000.000000 0 00000000000000" } };
    await updateOrder(order.id, { payment: demo, status: statusFromProvider(demo.providerStatus) });
    return Response.json({ orderId: order.id, demo: true });
  }

  // 3b. Mercado Pago (sandbox ou produção, conforme as credenciais)
  const brick = payment.brick!;
  const [firstName, ...rest] = customer.name.split(/\s+/);
  try {
    const result = await paymentClient().create({
      body: {
        transaction_amount: totals.total / 100,
        description: `Pedido ${order.number} · ${siteConfig.name}`,
        payment_method_id: brick.payment_method_id,
        token: brick.token,
        installments: brick.installments ?? 1,
        issuer_id: brick.issuer_id ? Number(brick.issuer_id) : undefined,
        external_reference: order.id,
        notification_url: siteUrl().startsWith("https://") ? `${siteUrl()}/api/webhooks/mercadopago` : undefined,
        statement_descriptor: siteConfig.name.toUpperCase().slice(0, 13),
        payer: {
          email: customer.email,
          first_name: firstName,
          last_name: rest.join(" "),
          identification: { type: "CPF", number: customer.cpf },
          address: {
            zip_code: address.cep,
            street_name: address.street,
            street_number: address.number,
            neighborhood: address.district,
            city: address.city,
            federal_unit: address.state,
          },
        },
      },
      // mesma chave = mesma cobrança, mesmo se o cliente clicar duas vezes
      requestOptions: { idempotencyKey: order.id },
    });

    const tx = result.point_of_interaction?.transaction_data;
    const info: PaymentInfo = {
      method: payment.method,
      provider: "mercadopago",
      providerPaymentId: String(result.id),
      providerStatus: result.status,
      statusDetail: result.status_detail,
      pix: tx?.qr_code ? { qrCode: tx.qr_code, qrCodeBase64: tx.qr_code_base64, expiresAt: result.date_of_expiration } : undefined,
      boleto: result.transaction_details?.external_resource_url
        ? { url: result.transaction_details.external_resource_url, barcode: result.transaction_details.digitable_line, expiresAt: result.date_of_expiration }
        : undefined,
      card: result.card?.last_four_digits
        ? { lastFour: result.card.last_four_digits, installments: result.installments, brand: result.payment_method_id }
        : undefined,
    };
    await updateOrder(order.id, { payment: info, status: statusFromProvider(result.status) });

    if (result.status === "rejected") {
      return Response.json(
        { orderId: order.id, rejected: true, error: "Pagamento recusado. Confira os dados ou use outro meio." },
        { status: 402 },
      );
    }
    return Response.json({ orderId: order.id });
  } catch (error) {
    console.error("[checkout] falha no Mercado Pago", error);
    await updateOrder(order.id, { status: "cancelado" });
    return Response.json(
      { error: "Não conseguimos falar com o meio de pagamento. Nada foi cobrado — tente de novo em instantes." },
      { status: 502 },
    );
  }
}
