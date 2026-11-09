"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidCpf, isValidPhone, onlyDigits } from "@/lib/br";
import { addressSchema } from "@/lib/checkout-schema";
import { getProfile } from "@/server/auth";
import { db } from "@/server/db";

/**
 * Ações da conta. Toda ação lê o perfil da SESSÃO e filtra por ele —
 * nunca confia em ids de usuário vindos do formulário.
 */

/** `values` devolve o que foi digitado: o React 19 limpa o formulário após cada envio. */
export type FormState = { ok?: boolean; error?: string; fields?: Record<string, string>; values?: Record<string, string> };

function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}

function fieldMap(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

const profileSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe seu nome." }).max(80),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v === "" || isValidCpf(v), { error: "CPF inválido." }),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v === "" || isValidPhone(v), { error: "Telefone com DDD." }),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await getProfile();
  if (!profile) return { error: "Sua sessão expirou. Entre de novo." };
  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    cpf: formData.get("cpf") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { fields: fieldMap(parsed.error), values: formValues(formData) };
  await db.profile.update({
    where: { id: profile.id },
    data: { name: parsed.data.name, cpf: parsed.data.cpf || null, phone: parsed.data.phone || null },
  });
  revalidatePath("/conta", "layout");
  return { ok: true };
}

const newAddressSchema = addressSchema.extend({
  label: z.string().trim().min(1).max(30).default("casa"),
  recipient: z.string().trim().min(2, { error: "Quem recebe?" }).max(80),
});

export async function addAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await getProfile();
  if (!profile) return { error: "Sua sessão expirou. Entre de novo." };
  const parsed = newAddressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fields: fieldMap(parsed.error), values: formValues(formData) };
  const count = await db.address.count({ where: { profileId: profile.id } });
  if (count >= 10) return { error: "Limite de 10 endereços. Remova um antes de adicionar.", values: formValues(formData) };
  const { cep, ...rest } = parsed.data;
  await db.address.create({ data: { ...rest, cep, profileId: profile.id, isDefault: count === 0 } });
  revalidatePath("/conta/enderecos");
  return { ok: true };
}

export async function deleteAddress(formData: FormData): Promise<void> {
  const profile = await getProfile();
  const id = String(formData.get("id") ?? "");
  if (!profile || !id) return;
  await db.address.deleteMany({ where: { id, profileId: profile.id } });
  // se apagou o padrão, promove o mais recente
  const hasDefault = await db.address.count({ where: { profileId: profile.id, isDefault: true } });
  if (!hasDefault) {
    const latest = await db.address.findFirst({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" } });
    if (latest) await db.address.update({ where: { id: latest.id }, data: { isDefault: true } });
  }
  revalidatePath("/conta/enderecos");
}

export async function setDefaultAddress(formData: FormData): Promise<void> {
  const profile = await getProfile();
  const id = String(formData.get("id") ?? "");
  if (!profile || !id) return;
  await db.$transaction([
    db.address.updateMany({ where: { profileId: profile.id }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id, profileId: profile.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/conta/enderecos");
}

/** Liga/desliga um produto nos favoritos. Retorna o estado final (ou null sem login). */
export async function toggleWishlist(productId: string): Promise<{ saved: boolean } | null> {
  const profile = await getProfile();
  if (!profile || typeof productId !== "string" || productId.length > 40) return null;
  const key = { profileId_productId: { profileId: profile.id, productId } };
  const existing = await db.wishlistItem.findUnique({ where: key });
  if (existing) {
    await db.wishlistItem.delete({ where: key });
  } else {
    const product = await db.product.findFirst({ where: { id: productId, active: true }, select: { id: true } });
    if (!product) return null;
    await db.wishlistItem.create({ data: { profileId: profile.id, productId } });
  }
  revalidatePath("/conta/favoritos");
  return { saved: !existing };
}
