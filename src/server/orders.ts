import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Address, Customer, PaymentMethod } from "@/lib/checkout-schema";
import type { ShippingOption } from "@/lib/shipping";
import type { OrderTotals, PricedLine } from "./pricing";

/**
 * Repositório de pedidos — PROVISÓRIO (Fase 3).
 * Guarda em `.data/orders.json` (fora do git) para o fluxo funcionar em desenvolvimento.
 * Na Fase 4 é substituído pelo Prisma/PostgreSQL mantendo estas funções.
 * Não use em produção serverless: o disco não é persistente.
 */

export type OrderStatus = "aguardando_pagamento" | "pago" | "recusado" | "cancelado" | "em_separacao" | "enviado" | "entregue";

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

export type Order = {
  id: string;
  /** Número curto exibido ao cliente. */
  number: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customer: Customer;
  address: Address;
  lines: PricedLine[];
  shipping: ShippingOption;
  totals: OrderTotals;
  payment: PaymentInfo;
};

const file = path.join(process.cwd(), ".data", "orders.json");
const memory = globalThis as unknown as { __orders?: Map<string, Order> };

async function load(): Promise<Map<string, Order>> {
  if (memory.__orders) return memory.__orders;
  try {
    const raw = JSON.parse(await readFile(file, "utf8")) as Order[];
    memory.__orders = new Map(raw.map((o) => [o.id, o]));
  } catch {
    memory.__orders = new Map();
  }
  return memory.__orders;
}

async function persist(map: Map<string, Order>) {
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify([...map.values()], null, 2));
  } catch {
    // ambiente somente-leitura: segue em memória
  }
}

export async function createOrder(data: Omit<Order, "id" | "number" | "createdAt" | "updatedAt" | "status">): Promise<Order> {
  const map = await load();
  const now = new Date().toISOString();
  const order: Order = {
    ...data,
    // id não sequencial e difícil de adivinhar: a página do pedido é acessada por ele
    id: randomBytes(12).toString("base64url"),
    number: String(100000 + map.size + 1),
    createdAt: now,
    updatedAt: now,
    status: "aguardando_pagamento",
  };
  map.set(order.id, order);
  await persist(map);
  return order;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return (await load()).get(id);
}

export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; payment?: Partial<PaymentInfo> },
): Promise<Order | undefined> {
  const map = await load();
  const current = map.get(id);
  if (!current) return undefined;
  const next: Order = {
    ...current,
    ...patch,
    payment: patch.payment ? { ...current.payment, ...patch.payment } : current.payment,
    updatedAt: new Date().toISOString(),
  };
  map.set(id, next);
  await persist(map);
  return next;
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
