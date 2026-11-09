import type { NextRequest } from "next/server";
import { searchSuggestions } from "@/server/queries/products";

/** Sugestões de busca (marcas + produtos). Lê a query da requisição, então roda por request. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  const suggestions = await searchSuggestions(q);
  return Response.json(
    { q, suggestions },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
