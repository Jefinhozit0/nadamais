import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import type { Profile } from "@/generated/prisma/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServer } from "@/lib/supabase/server";
import { db } from "./db";

export type SessionUser = { id: string; email: string; name?: string };

/** Usuário autenticado (validado no servidor do Supabase) ou null. Memoizado por requisição. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Sempre por requisição — mesmo sem Supabase configurado, nunca pré-renderizar estado de login no build
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  const meta = data.user.user_metadata as { name?: unknown; full_name?: unknown } | undefined;
  const name = typeof meta?.name === "string" ? meta.name : typeof meta?.full_name === "string" ? meta.full_name : undefined;
  return { id: data.user.id, email: data.user.email, name };
});

/** Perfil da loja do usuário logado; criado no primeiro acesso. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  return db.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email, name: user.name },
    update: { email: user.email },
  });
});

/** Exige login; senão manda para /entrar e volta depois. */
export async function requireProfile(next: string): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return profile;
}

/** Só aceita caminhos internos (evita redirecionamento aberto para outro site). */
export function safeNext(value: unknown, fallback = "/conta"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
