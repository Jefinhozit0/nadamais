import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { DEFAULT_SIZES, type ProductInput } from "@/lib/admin-schema";
import { requireAdmin } from "@/server/admin";
import { listBrands } from "@/server/admin-queries";

export const metadata: Metadata = { title: "Novo produto" };

async function NewProduct() {
  await requireAdmin();
  const blank: ProductInput = {
    name: "",
    shortName: "",
    slug: "",
    sku: "",
    brand: "",
    category: "sneakers",
    type: "tênis",
    colorway: "",
    colors: [],
    description: "",
    details: [],
    price: 0,
    compareAtPrice: null,
    sizeSystem: "sneaker",
    releasedAt: new Date().toISOString().slice(0, 10),
    popularity: 50,
    badge: "novo",
    active: false,
    images: [],
    sizes: DEFAULT_SIZES.sneaker.map((label) => ({ label, stock: 0 })),
  };
  return <ProductForm initial={blank} brands={await listBrands()} />;
}

export default function NewProductPage() {
  return (
    <section aria-labelledby="novo-title" className="max-w-4xl">
      <Link href="/admin/produtos" className="font-mono text-xs text-mute-strong hover:text-ink">
        ← produtos
      </Link>
      <h1 id="novo-title" className="mt-2 mb-6 font-display text-2xl font-medium">
        novo produto
      </h1>
      <p className="mb-8 text-sm text-ink-soft">Começa oculto da loja. Marque “visível na loja” quando estiver pronto.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-haze" />}>
        <NewProduct />
      </Suspense>
    </section>
  );
}
