import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/product-card";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/server/auth";
import { loadCatalog } from "@/server/catalog-source";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Favoritos" };

async function Favorites() {
  const profile = await requireProfile("/conta/favoritos");
  const [items, catalog] = await Promise.all([
    db.wishlistItem.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" } }),
    loadCatalog(),
  ]);
  const products = items
    .map((i) => catalog.find((p) => p.id === i.productId))
    .filter((p) => p !== undefined);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-soft p-6">
        <p className="text-sm text-ink-soft">Toque no coração de qualquer produto para guardar aqui.</p>
        <Link href="/catalogo" className={buttonVariants({ variant: "outline", size: "sm" })}>
          ver catálogo
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export default function FavoritesPage() {
  return (
    <section aria-labelledby="favoritos-title">
      <h2 id="favoritos-title" className="mb-4 font-display text-xl font-medium">
        favoritos
      </h2>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-haze" />}>
        <Favorites />
      </Suspense>
    </section>
  );
}
