import { connection } from "next/server";
import { getProfile } from "@/server/auth";
import { hasDatabase } from "@/server/catalog-source";
import { db } from "@/server/db";

/** Ids favoritados do usuário logado (para marcar os corações na vitrine). */
export async function GET() {
  await connection();
  if (!hasDatabase()) return Response.json({ authenticated: false, ids: [] });
  const profile = await getProfile();
  if (!profile) {
    return Response.json({ authenticated: false, ids: [] }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const items = await db.wishlistItem.findMany({ where: { profileId: profile.id }, select: { productId: true } });
  return Response.json(
    { authenticated: true, ids: items.map((i) => i.productId) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
