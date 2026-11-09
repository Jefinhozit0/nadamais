"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { productInputSchema } from "@/lib/admin-schema";
import { requireAdmin } from "@/server/admin";
import { CATALOG_TAG } from "@/server/catalog-source";
import { db } from "@/server/db";
import { updateOrder, type OrderStatus } from "@/server/orders";

/** Vitrine reflete na hora: expira o catálogo em cache e as páginas já geradas (produto, home, catálogo). */
function refreshStorefront() {
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}

/**
 * Ações do painel. TODA ação começa com requireAdmin(): Server Actions são
 * endpoints públicos e podem ser chamadas por qualquer um que conheça o id.
 */

export type ProductFormState = { error?: string; fields?: Record<string, string> };

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "form";
    out[key] ??= issue.message;
  }
  return out;
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Não consegui ler o formulário. Recarregue a página." };
  }
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) return { error: "Confira os campos destacados.", fields: flatten(parsed.error) };
  const p = parsed.data;

  const data = {
    name: p.name,
    shortName: p.shortName,
    slug: p.slug,
    sku: p.sku,
    line: p.line,
    category: p.category,
    type: p.type,
    colorway: p.colorway,
    colors: p.colors,
    description: p.description,
    details: p.details,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    sizeSystem: p.sizeSystem === "one-size" ? ("one_size" as const) : p.sizeSystem,
    releasedAt: new Date(`${p.releasedAt}T00:00:00Z`),
    popularity: p.popularity,
    badge: p.badge,
    active: p.active,
  };

  let id: string;
  try {
    id = await db.$transaction(async (tx) => {
      const product = p.id
        ? await tx.product.update({ where: { id: p.id }, data })
        : await tx.product.create({ data });

      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (p.images.length) {
        await tx.productImage.createMany({
          data: p.images.map((img, position) => ({ ...img, productId: product.id, position })),
        });
      }

      // tamanhos: atualiza/cria pelos rótulos e remove os que saíram (pedidos guardam o rótulo, não a relação)
      const labels = p.sizes.map((s) => s.label);
      await tx.productSize.deleteMany({ where: { productId: product.id, label: { notIn: labels } } });
      for (const [position, size] of p.sizes.entries()) {
        await tx.productSize.upsert({
          where: { productId_label: { productId: product.id, label: size.label } },
          create: { productId: product.id, label: size.label, stock: size.stock, position },
          update: { stock: size.stock, position },
        });
      }
      return product.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String((error.meta?.target as string[] | string | undefined) ?? "");
      return {
        error: "Já existe outro produto com esse dado.",
        fields: target.includes("sku") ? { sku: "SKU já usado em outro produto." } : { slug: "Endereço (slug) já usado." },
      };
    }
    throw error;
  }

  refreshStorefront();
  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${id}?salvo=1`);
}

/** Arquivar/reativar (não apaga: pedidos antigos continuam apontando para o produto). */
export async function setProductActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await db.product.update({ where: { id }, data: { active } });
  refreshStorefront();
}

/** Ajuste rápido de estoque de um tamanho, direto da lista. */
export async function setStock(formData: FormData): Promise<void> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const label = String(formData.get("label") ?? "");
  const stock = Number(formData.get("stock"));
  if (!productId || !label || !Number.isInteger(stock) || stock < 0 || stock > 100_000) return;
  await db.productSize.update({ where: { productId_label: { productId, label } }, data: { stock } });
  refreshStorefront();
}

/** Transições permitidas — evita, por exemplo, voltar um pedido entregue para "aguardando". */
const transitions: Record<OrderStatus, OrderStatus[]> = {
  aguardando_pagamento: ["pago", "cancelado"],
  pago: ["em_separacao", "cancelado"],
  em_separacao: ["enviado", "cancelado"],
  enviado: ["entregue"],
  entregue: [],
  recusado: [],
  cancelado: [],
};

export async function allowedTransitions(status: OrderStatus): Promise<OrderStatus[]> {
  return transitions[status];
}

export type OrderFormState = { error?: string; ok?: boolean };

export async function updateOrderStatus(_prev: OrderFormState, formData: FormData): Promise<OrderFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "") as OrderStatus;
  const tracking = String(formData.get("trackingCode") ?? "").trim().toUpperCase();

  const current = await db.order.findUnique({ where: { id }, select: { status: true } });
  if (!current) return { error: "Pedido não encontrado." };

  const statusChanged = next && next !== current.status;
  if (statusChanged && !transitions[current.status].includes(next)) {
    return { error: `Não dá para mudar de "${current.status}" para "${next}".` };
  }
  if (next === "enviado" && !tracking) return { error: "Informe o código de rastreio para marcar como enviado." };
  if (tracking && !/^[A-Z0-9-]{6,40}$/.test(tracking)) return { error: "Código de rastreio inválido." };

  await updateOrder(id, {
    ...(statusChanged && { status: next }),
    trackingCode: tracking || null,
  });
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return { ok: true };
}
