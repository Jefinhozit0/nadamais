import "server-only";
import { randomBytes } from "node:crypto";
import { revalidateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import type { Address, Customer, PaymentMethod } from "@/lib/checkout-schema";
import type { ShippingOption } from "@/lib/shipping";
import { CATALOG_TAG } from "./catalog-source";
import { db } from "./db";
import type { OrderTotals, PricedLine } from "./pricing";

/** Pedidos no Postgres. Estoque é reservado na criação e devolvido se o pagamento for recusado/cancelado. */

export type OrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "recusado"
  | "cancelado"
  | "em_separacao"
  | "enviado"
  | "entregue";

export type PaymentInfo = {
  method: PaymentMethod;
  provider: "mercadopago" | "demo";
  providerPaymentId?: string;
  providerStatus?: string;
  statusDetail?: string;
  pix?: { qrCode: string; qrCodeBase64?: string; expiresAt?: string };
  boleto?: { url: string; barcode?: string; expiresAt?: string };
  card?: { lastFour?: string; installments?: number; brand?: string };
};

export type OrderLine = Omit<PricedLine, "category">;

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  profileId?: string;
  customer: Customer;
  address: Address;
  lines: OrderLine[];
  shipping: Pick<ShippingOption, "method" | "label" | "price" | "days">;
  totals: OrderTotals;
  payment: PaymentInfo;
  trackingCode?: string;
};

export class OutOfStockError extends Error {
  constructor(public readonly productId: string, public readonly size: string) {
    super("estoque insuficiente");
  }
}

const withItems = { items: true } satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof withItems }>;

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: String(row.number),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status,
    trackingCode: row.trackingCode ?? undefined,
    profileId: row.profileId ?? undefined,
    customer: { name: row.customerName, email: row.customerEmail, cpf: row.customerCpf, phone: row.customerPhone },
    address: row.address as Address,
    lines: row.items.map((i) => ({
      productId: i.productId ?? "",
      slug: i.slug,
      name: i.name,
      line: i.line,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
      image: i.image ?? undefined,
    })),
    shipping: {
      method: row.shippingMethod as ShippingOption["method"],
      label: row.shippingLabel,
      price: row.shippingCost,
      days: row.shippingDays,
    },
    totals: { subtotal: row.subtotal, shipping: row.shippingCost, discount: row.discount, total: row.total },
    payment: {
      method: row.paymentMethod,
      provider: row.paymentProvider,
      providerPaymentId: row.providerPaymentId ?? undefined,
      providerStatus: row.providerStatus ?? undefined,
      statusDetail: row.statusDetail ?? undefined,
      pix: row.pixQrCode
        ? { qrCode: row.pixQrCode, qrCodeBase64: row.pixQrCodeBase64 ?? undefined, expiresAt: row.pixExpiresAt ?? undefined }
        : undefined,
      boleto: row.boletoUrl ? { url: row.boletoUrl, barcode: row.boletoBarcode ?? undefined } : undefined,
      card: row.cardLastFour || row.installments ? { lastFour: row.cardLastFour ?? undefined, installments: row.installments ?? undefined } : undefined,
    },
  };
}

function paymentColumns(p: Partial<PaymentInfo>): Prisma.OrderUpdateInput {
  return {
    ...(p.providerPaymentId !== undefined && { providerPaymentId: p.providerPaymentId }),
    ...(p.providerStatus !== undefined && { providerStatus: p.providerStatus }),
    ...(p.statusDetail !== undefined && { statusDetail: p.statusDetail }),
    ...(p.pix && { pixQrCode: p.pix.qrCode, pixQrCodeBase64: p.pix.qrCodeBase64, pixExpiresAt: p.pix.expiresAt }),
    ...(p.boleto && { boletoUrl: p.boleto.url, boletoBarcode: p.boleto.barcode }),
    ...(p.card && { cardLastFour: p.card.lastFour, installments: p.card.installments }),
  };
}

type NewOrder = {
  profileId?: string;
  customer: Customer;
  address: Address;
  lines: PricedLine[];
  shipping: ShippingOption;
  totals: OrderTotals;
  payment: Pick<PaymentInfo, "method" | "provider">;
};

/**
 * Cria o pedido e reserva o estoque na mesma transação.
 * O decremento é condicional (stock >= quantidade): dois clientes não compram a última unidade.
 */
export async function createOrder(data: NewOrder): Promise<Order> {
  const row = await db.$transaction(async (tx) => {
    for (const line of data.lines) {
      const { count } = await tx.productSize.updateMany({
        where: { productId: line.productId, label: line.size, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (count === 0) throw new OutOfStockError(line.productId, line.size);
    }
    return tx.order.create({
      data: {
        // id não sequencial e difícil de adivinhar: a página do pedido é acessada por ele
        id: randomBytes(12).toString("base64url"),
        profileId: data.profileId,
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        customerCpf: data.customer.cpf,
        customerPhone: data.customer.phone,
        address: data.address,
        shippingMethod: data.shipping.method,
        shippingLabel: data.shipping.label,
        shippingDays: data.shipping.days,
        subtotal: data.totals.subtotal,
        shippingCost: data.totals.shipping,
        discount: data.totals.discount,
        total: data.totals.total,
        paymentMethod: data.payment.method,
        paymentProvider: data.payment.provider,
        items: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            slug: l.slug,
            name: l.name,
            line: l.line,
            size: l.size,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            total: l.total,
            image: l.image,
          })),
        },
      },
      include: withItems,
    });
  });
  revalidateTag(CATALOG_TAG, "max");
  return toOrder(row);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const row = await db.order.findUnique({ where: { id }, include: withItems });
  return row ? toOrder(row) : undefined;
}

export async function listOrdersByProfile(profileId: string, take = 50): Promise<Order[]> {
  const rows = await db.order.findMany({
    where: { profileId },
    include: withItems,
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toOrder);
}

/** Atualiza status/pagamento. Recusado ou cancelado devolve o estoque (uma única vez). */
export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; payment?: Partial<PaymentInfo>; trackingCode?: string | null },
): Promise<Order | undefined> {
  const releasing = patch.status === "recusado" || patch.status === "cancelado";
  try {
    const row = await db.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: withItems });
      if (!current) return null;
      const release = releasing && !current.stockReleased;
      if (release) {
        for (const item of current.items) {
          if (!item.productId) continue;
          await tx.productSize.updateMany({
            where: { productId: item.productId, label: item.size },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      return tx.order.update({
        where: { id },
        data: {
          ...(patch.status && { status: patch.status }),
          ...(release && { stockReleased: true }),
          ...(patch.trackingCode !== undefined && { trackingCode: patch.trackingCode }),
          ...(patch.payment && paymentColumns(patch.payment)),
        },
        include: withItems,
      });
    });
    if (row && releasing) revalidateTag(CATALOG_TAG, "max");
    return row ? toOrder(row) : undefined;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return undefined;
    throw error;
  }
}

/** Mapeia o status do Mercado Pago para o status do pedido. */
export function statusFromProvider(providerStatus: string | undefined): OrderStatus {
  switch (providerStatus) {
    case "approved":
    case "authorized":
      return "pago";
    case "rejected":
      return "recusado";
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelado";
    default:
      return "aguardando_pagamento";
  }
}
