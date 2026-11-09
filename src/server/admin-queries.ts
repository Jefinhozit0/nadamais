import "server-only";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { toProduct } from "./catalog-source";
import { db } from "./db";
import { getOrder } from "./orders";

/** Consultas do painel admin (sem cache — dados sempre frescos). */

export const LOW_STOCK = 2;

export async function getDashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidStatuses: OrderStatus[] = ["pago", "em_separacao", "enviado", "entregue"];

  const [ordersToday, awaiting, toShip, revenue, sizes, recent] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfDay } } }),
    db.order.count({ where: { status: "aguardando_pagamento" } }),
    db.order.count({ where: { status: { in: ["pago", "em_separacao"] } } }),
    db.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth }, status: { in: paidStatuses } },
    }),
    db.productSize.findMany({
      where: { stock: { lte: LOW_STOCK }, product: { active: true } },
      include: { product: { select: { id: true, name: true, colorway: true } } },
      orderBy: [{ stock: "asc" }],
      take: 12,
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true } }),
  ]);

  return {
    ordersToday,
    awaiting,
    toShip,
    monthRevenue: revenue._sum.total ?? 0,
    monthPaidOrders: revenue._count,
    lowStock: sizes,
    recent: (await Promise.all(recent.map((o) => getOrder(o.id)))).filter((o) => o !== undefined),
  };
}

export type AdminProductFilter = { q?: string; status?: "ativos" | "arquivados" | "todos" };

export async function listAdminProducts(filter: AdminProductFilter) {
  const where: Prisma.ProductWhereInput = {};
  if (filter.status !== "todos") where.active = filter.status !== "arquivados";
  if (filter.q) {
    where.OR = [
      { name: { contains: filter.q, mode: "insensitive" } },
      { sku: { contains: filter.q, mode: "insensitive" } },
      { slug: { contains: filter.q, mode: "insensitive" } },
    ];
  }
  const rows = await db.product.findMany({
    where,
    include: { images: { orderBy: { position: "asc" }, take: 1 }, sizes: { orderBy: { position: "asc" } } },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    colorway: r.colorway,
    sku: r.sku,
    line: r.line,
    category: r.category,
    price: r.price,
    active: r.active,
    image: r.images[0]?.src,
    totalStock: r.sizes.reduce((sum, s) => sum + s.stock, 0),
    lowSizes: r.sizes.filter((s) => s.stock <= LOW_STOCK).length,
    sizes: r.sizes.map((s) => ({ label: s.label, stock: s.stock })),
  }));
}

export async function getAdminProduct(id: string) {
  const row = await db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, sizes: { orderBy: { position: "asc" } } },
  });
  if (!row) return undefined;
  return { ...toProduct(row), active: row.active };
}

export type AdminOrderFilter = { q?: string; status?: OrderStatus };

export async function listAdminOrders(filter: AdminOrderFilter, take = 100) {
  const where: Prisma.OrderWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.q) {
    const asNumber = Number(filter.q.replace(/\D/g, ""));
    where.OR = [
      { customerEmail: { contains: filter.q, mode: "insensitive" } },
      { customerName: { contains: filter.q, mode: "insensitive" } },
      ...(Number.isInteger(asNumber) && asNumber > 0 ? [{ number: asNumber }] : []),
    ];
  }
  const [rows, counts] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        number: true,
        status: true,
        customerName: true,
        customerEmail: true,
        total: true,
        paymentMethod: true,
        paymentProvider: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  return {
    rows,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) as Partial<Record<OrderStatus, number>>,
  };
}
