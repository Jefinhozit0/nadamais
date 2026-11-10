import { ArrowDown, Search } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogProvider, CatalogResultsArea } from "@/components/catalog/catalog-provider";
import { CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiltersPanel } from "@/components/catalog/filters-panel";
import { ProductCard } from "@/components/product/product-card";
import { buttonVariants } from "@/components/ui/button";
import { catalogHref, categoryLabels, parseCatalogParams, type CatalogFilters } from "@/lib/catalog";
import { getTrending, listProducts } from "@/server/queries/products";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Sneakers e streetwear das marcas que você curte: tênis, moletons, camisetas e acessórios.",
  alternates: { canonical: "/catalogo" },
};

function titleFor(filters: CatalogFilters): string {
  if (filters.q) return `“${filters.q}”`;
  if (filters.marcas.length === 1 && !filters.categoria) return filters.marcas[0]!.toLowerCase();
  if (filters.categoria) return categoryLabels[filters.categoria];
  if (filters.ordem === "novos") return "novos drops";
  return "catálogo";
}

async function Catalog({ searchParams }: { searchParams: PageProps<"/catalogo">["searchParams"] }) {
  const filters = parseCatalogParams(await searchParams);
  const { items, total, hasMore, facets } = await listProducts(filters);
  const empty = items.length === 0;
  const fallback = empty ? await getTrending(4) : [];

  return (
    <CatalogProvider>
      <header className="flex flex-col gap-6 border-b border-line-soft pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.9] font-semibold tracking-[-0.035em]">
            <span className="text-grain">{titleFor(filters)}</span>
          </h1>
          <p className="mt-3 font-mono text-xs text-mute-strong lg:hidden">
            {total} {total === 1 ? "produto" : "produtos"}
          </p>
        </div>

        <Form action="/catalogo" className="w-full md:max-w-sm" role="search">
          {/* preserva os filtros atuais ao buscar */}
          {filters.categoria && <input type="hidden" name="categoria" value={filters.categoria} />}
          {filters.marcas.length > 0 && <input type="hidden" name="marca" value={filters.marcas.join(",")} />}
          <label htmlFor="catalog-q" className="sr-only">
            Buscar no catálogo
          </label>
          <div className="flex h-12 items-center gap-3 rounded-full border border-line-soft pr-1.5 pl-5 focus-within:border-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink hover:border-ink-soft">
            <Search className="size-4 shrink-0 text-mute-strong" strokeWidth={1.5} aria-hidden="true" />
            <input
              id="catalog-q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="buscar marca, modelo, cor…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute-strong"
            />
            <button type="submit" className={buttonVariants({ size: "sm" })}>
              buscar
            </button>
          </div>
        </Form>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <aside aria-label="Filtros" className="hidden lg:col-span-3 lg:block">
          {/* régua igual à do trilho da home, no lugar da barra de rolagem nativa */}
          <ScrollArea className="sticky top-28 max-h-[calc(100dvh-8rem)]">
            <FiltersPanel filters={filters} facets={facets} />
          </ScrollArea>
        </aside>

        <div className="lg:col-span-9">
          <CatalogToolbar filters={filters} facets={facets} total={total} />

          <CatalogResultsArea className="mt-6">
            {empty ? (
              <div className="rounded-card border border-dashed border-line-soft px-6 py-14 text-center">
                <p className="font-display text-2xl font-medium">Nada com esses filtros.</p>
                <p className="mt-2 text-sm text-ink-soft">Tire um filtro ou dois — ou veja o que está saindo agora.</p>
                <Link href={catalogHref({})} className={buttonVariants({ variant: "outline", className: "mt-6" })}>
                  limpar filtros
                </Link>
                <ul className="mt-12 grid grid-cols-2 gap-3 text-left md:grid-cols-4">
                  {fallback.map((product) => (
                    <li key={product.id}>
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                  {items.map((product, index) => (
                    <li key={product.id}>
                      <ProductCard
                        product={product}
                        priority={index < 3}
                        sizes="(min-width: 1024px) 23vw, (min-width: 768px) 31vw, 50vw"
                      />
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="font-mono text-xs text-mute-strong">
                    {items.length} de {total}
                  </p>
                  {hasMore && (
                    <Link
                      href={catalogHref({ ...filters, pagina: filters.pagina + 1 })}
                      scroll={false}
                      className={buttonVariants({ variant: "outline", size: "lg" })}
                    >
                      carregar mais <ArrowDown strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </>
            )}
          </CatalogResultsArea>
        </div>
      </div>
    </CatalogProvider>
  );
}

function CatalogSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-[clamp(2.75rem,8vw,6.5rem)] w-2/3 max-w-xl rounded-sm bg-haze" />
      <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-3 lg:ml-[25%] lg:w-3/4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[4/6] animate-pulse rounded-card bg-haze" />
        ))}
      </div>
    </div>
  );
}

export default function CatalogPage({ searchParams }: PageProps<"/catalogo">) {
  return (
    <div className="px-4 pt-8 md:px-8 md:pt-12">
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
