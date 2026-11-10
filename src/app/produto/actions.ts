"use server";

import { updateTag } from "next/cache";
import { displayName, reviewInputSchema } from "@/lib/reviews";
import type { Address } from "@/lib/checkout-schema";
import { getProfile } from "@/server/auth";
import { CATALOG_TAG } from "@/server/catalog-source";
import { db } from "@/server/db";
import { getReviewEligibility, REVIEWS_TAG } from "@/server/reviews";

/**
 * Avaliações. Server Actions são endpoints públicos: o cliente vem da SESSÃO e a compra
 * é conferida no banco (pedido entregue com o produto) — nada vem do formulário além do texto.
 */

export type ReviewFormState = { ok?: boolean; error?: string; fields?: Record<string, string>; values?: Record<string, string> };

function refresh() {
  updateTag(REVIEWS_TAG);
  // média nos cards e na página do produto
  updateTag(CATALOG_TAG);
}

export async function saveReview(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const values = {
    rating: String(formData.get("rating") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    fit: String(formData.get("fit") ?? ""),
  };
  const profile = await getProfile();
  if (!profile) return { error: "Sua sessão expirou. Entre de novo para avaliar.", values };

  const parsed = reviewInputSchema.safeParse({
    productId: formData.get("productId"),
    rating: values.rating,
    title: values.title,
    body: values.body,
    fit: values.fit || undefined,
  });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
    return { fields, values };
  }
  const input = parsed.data;

  const eligibility = await getReviewEligibility(profile.id, input.productId);
  if (eligibility.kind !== "eligible") {
    return { error: "Só quem recebeu este produto pode avaliar. A avaliação libera quando o pedido é entregue.", values };
  }

  const order = await db.order.findUnique({
    where: { id: eligibility.orderId },
    select: { customerName: true, address: true },
  });
  const address = order?.address as Partial<Address> | undefined;
  const data = {
    rating: input.rating,
    title: input.title || null,
    body: input.body,
    fit: input.fit ?? null,
    size: eligibility.size || null,
    orderId: eligibility.orderId,
    authorName: displayName(profile.name || order?.customerName),
    city: address?.city && address.state ? `${address.city}, ${address.state}` : null,
  };

  await db.review.upsert({
    where: { profileId_productId: { profileId: profile.id, productId: input.productId } },
    create: { ...data, profileId: profile.id, productId: input.productId },
    // editar não "desoculta" uma avaliação moderada
    update: data,
  });
  refresh();
  return { ok: true };
}

export async function deleteReview(formData: FormData): Promise<void> {
  const profile = await getProfile();
  const productId = String(formData.get("productId") ?? "");
  if (!profile || !productId) return;
  await db.review.deleteMany({ where: { profileId: profile.id, productId } });
  refresh();
}
