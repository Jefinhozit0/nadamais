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
import { createPaymentRequest, isPaymentoConfigured } from "@/server/paymento";
import { getSessionUser } from "@/server/auth";
import { queueOrderEmail } from "@/server/email/order-emails";
import { db } from "@/server/db";
import { hasDatabase } from "@/server/catalog-source";
import { createOrder, OutOfStockError, statusFromProvider, updateOrder, type PaymentInfo } from "@/server/orders";
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

async function saveToProfile(profileId: string, customer: z.infer<typeof customerSchema>, address: z.infer<typeof addressSchema>) {
  const exists = await db.address.findFirst({ where: { profileId, cep: address.cep, number: address.number } });
  if (!exists) {
    const count = await db.address.count({ where: { profileId } });
    if (count < 10) {
      await db.address.create({
        data: { ...address, profileId, recipient: customer.name, label: count === 0 ? "casa" : `endereço ${count + 1}`, isDefault: count === 0 },
      });
    }
  }
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (profile) {
    await db.profile.update({
      where: { id: profileId },
      data: {
        name: profile.name ?? customer.name,
        cpf: profile.cpf ?? customer.cpf,
        phone: profile.phone ?? customer.phone,
      },
    });
  }
}

/** Validade do link de pagamento em cripto (e da reserva de estoque). */
const CRYPTO_WINDOW_MS = 2 * 60 * 60 * 1000;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return Response.json(
      { error: "Banco de dados não configurado: pedidos estão desativados. Veja o README (Banco de dados)." },
      { status: 503 },
    );
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Confira os dados do pedido.", fields: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { items, customer, address, shippingMethod, payment } = parsed.data;

  // 1. Preços, estoque e frete recalculados no servidor
  const cart = await priceCart(items);
  if (cart.issues.length > 0 || cart.lines.length === 0) {
    return Response.json(
      { error: "Algum item mudou de estoque. Revise a sacola.", issues: cart.issues, cart },
      { status: 409 },
    );
  }
  const shipping = pickShipping(shippingFor(address.cep, cart), shippingMethod);
  const totals = computeTotals(cart, shipping, payment.method);

  const crypto = payment.method === "crypto";
  if (crypto && !isPaymentoConfigured()) {
    return Response.json({ error: "Pagamento em cripto indisponível no momento. Escolha outra forma." }, { status: 400 });
  }
  const live = !crypto && isMercadoPagoConfigured();
  if (live && !payment.brick) {
    return Response.json({ error: "Pagamento incompleto. Tente de novo." }, { status: 400 });
  }

  // 2. Pedido criado antes da cobrança (referência externa do pagamento), já reservando o estoque
  const user = await getSessionUser();
  let order;
  try {
    order = await createOrder({
    profileId: user?.id,
    customer,
    address,
    lines: cart.lines,
    shipping,
    totals,
    payment: { method: payment.method, provider: crypto ? "paymento" : live ? "mercadopago" : "demo" },
  });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return Response.json(
        { error: "Alguém levou a última unidade antes de você. Revise a sacola.", issues: [{ productId: error.productId, size: error.size, reason: "indisponivel", available: 0 }] },
        { status: 409 },
      );
    }
    throw error;
  }

  // Cliente logado: guarda o endereço na conta (se ainda não existir) e completa CPF/telefone do perfil
  if (user) {
    await saveToProfile(user.id, customer, address).catch((e) => console.error("[checkout] perfil", e));
  }

  // 3a. Cripto (Paymento): o cliente paga na página da Paymento; a confirmação chega pelo IPN
  if (crypto) {
    try {
      const { token, url } = await createPaymentRequest({
        orderId: order.id,
        amount: totals.total,
        email: customer.email,
        returnUrl: `${siteUrl()}/pedido/${order.id}`,
        // o estoque fica reservado enquanto o link vale
        expiresAt: new Date(Date.now() + CRYPTO_WINDOW_MS),
      });
      const updated = await updateOrder(order.id, {
        payment: { method: "crypto", provider: "paymento", providerPaymentId: token, providerStatus: "Initialize", checkoutUrl: url },
      });
      if (updated) queueOrderEmail(updated, "pedido_recebido");
      return Response.json({ orderId: order.id, redirectUrl: url });
    } catch (error) {
      console.error("[checkout] falha na Paymento", error);
      await updateOrder(order.id, { status: "cancelado", payment: { statusDetail: "falha ao gerar o pagamento em cripto" } }, { notify: false });
      return Response.json(
        { error: "Não conseguimos gerar o pagamento em cripto. Nada foi cobrado — tente de novo ou escolha outra forma." },
        { status: 502 },
      );
    }
  }

  // 3b. Modo demonstração: nada é cobrado
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
    const updated = await updateOrder(order.id, { payment: demo, status: statusFromProvider(demo.providerStatus) });
    if (updated?.status === "aguardando_pagamento") queueOrderEmail(updated, "pedido_recebido");
    return Response.json({ orderId: order.id, demo: true });
  }

  // 3c. Mercado Pago (sandbox ou produção, conforme as credenciais)
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
    // cartão recusado já aparece na tela: sem e-mail de cancelamento
    const updated = await updateOrder(order.id, { payment: info, status: statusFromProvider(result.status) }, { notify: result.status !== "rejected" });
    if (updated?.status === "aguardando_pagamento") queueOrderEmail(updated, "pedido_recebido");

    if (result.status === "rejected") {
      return Response.json(
        { orderId: order.id, rejected: true, error: "Pagamento recusado. Confira os dados ou use outro meio." },
        { status: 402 },
      );
    }
    return Response.json({ orderId: order.id });
  } catch (error) {
    console.error("[checkout] falha no Mercado Pago", error);
    await updateOrder(order.id, { status: "cancelado" }, { notify: false });
    return Response.json(
      { error: "Não conseguimos falar com o meio de pagamento. Nada foi cobrado — tente de novo em instantes." },
      { status: 502 },
    );
  }
}
