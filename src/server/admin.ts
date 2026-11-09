import "server-only";
import { notFound } from "next/navigation";
import type { Profile } from "@/generated/prisma/client";
import { getProfile } from "./auth";

/**
 * Exige um administrador. Para quem não é admin, responde 404 —
 * não revela que o painel existe.
 * Use em TODA página e Server Action do admin (actions são endpoints públicos).
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") notFound();
  return profile;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}
