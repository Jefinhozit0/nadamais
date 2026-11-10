import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { setProductActive } from "@/app/admin/actions";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import type { ProductInput } from "@/lib/admin-schema";
import { requireAdmin } from "@/server/admin";
import { getAdminProduct, listBrands } from "@/server/admin-queries";

export const metadata: Metadata = { title: "Editar produto" };

async function EditProduct({ params, searchParams }: PageProps<"/admin/produtos/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [product, brands] = await Promise.all([getAdminProduct(id), listBrands()]);
  if (!product) notFound();

  const initial: ProductInput = {
    id: product.id,
    name: product.name,
    shortName: product.shortName,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    category: product.category,
    type: product.type,
    colorway: product.colorway,
    colors: [...product.colors],
    description: product.description,
    details: [...product.details],
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    sizeSystem: product.sizeSystem,
    releasedAt: product.releasedAt,
    popularity: product.popularity,
    badge: product.badge === "esgotado" ? null : (product.badge ?? null),
    active: product.active,
    images: product.images.map((i) => ({ src: i.src, alt: i.alt, kind: i.kind, width: i.width, height: i.height })),
    sizes: product.sizes.map((s) => ({ label: s.label, stock: s.stock })),
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 id="editar-title" className="font-display text-2xl font-medium lowercase">
          {product.name} <span className="text-mute-strong">· {product.colorway}</span>
        </h1>
        <form action={setProductActive}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="active" value={product.active ? "false" : "true"} />
          <Button type="submit" variant={product.active ? "ghost" : "outline"} size="sm">
            {product.active ? "arquivar (tirar da loja)" : "reativar na loja"}
          </Button>
        </form>
      </div>
      {/* key: remonta o formulário com os dados salvos depois de cada gravação */}
      <ProductForm key={`${product.id}-${sp.salvo ?? ""}-${product.active}`} initial={initial} saved={sp.salvo === "1"} brands={brands} />
    </>
  );
}

export default function EditProductPage(props: PageProps<"/admin/produtos/[id]">) {
  return (
    <section aria-labelledby="editar-title" className="max-w-4xl">
      <Link href="/admin/produtos" className="font-mono text-xs text-mute-strong hover:text-ink">
        ← produtos
      </Link>
      <div className="mt-2">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-haze" />}>
          <EditProduct {...props} />
        </Suspense>
      </div>
    </section>
  );
}
