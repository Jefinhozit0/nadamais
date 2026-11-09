import { BadgeCheck, RotateCcw, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBadge } from "@/components/product/product-badge";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { siteConfig } from "@/config/site";
import { brandSlugs, categoryLabels } from "@/lib/catalog";
import { discountPercent, formatBRL, formatInstallments, pixPrice } from "@/lib/format";
import { getAllProductSlugs, getProductBySlug, getRelatedProducts } from "@/server/queries/products";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };
  const title = `${product.name} ${product.colorway}`;
  return {
    title,
    description: `${product.description} ${formatBRL(product.price)} ou ${formatInstallments(product.price)} sem juros.`,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title,
      images: product.images[0] ? [{ url: product.images[0].src, alt: product.images[0].alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/produto/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  const soldOut = product.sizes.every((s) => s.stock === 0);
  const off = product.compareAtPrice ? discountPercent(product.price, product.compareAtPrice) : 0;
  const pixPercent = Math.round(siteConfig.pixDiscount * 100);

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-8">
      <nav aria-label="Você está em" className="font-mono text-micro text-mute-strong">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="rounded-sm hover:text-ink">
              início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/catalogo?categoria=${product.category}`} className="rounded-sm hover:text-ink">
              {categoryLabels[product.category]}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/catalogo?marca=${brandSlugs[product.brand]}`} className="rounded-sm hover:text-ink">
              {product.brand.toLowerCase()}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {product.shortName}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} name={product.shortName} />
        </div>

        <div className="lg:col-span-5">
          <div className="flex flex-col gap-7 lg:sticky lg:top-28">
            <div>
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/catalogo?marca=${brandSlugs[product.brand]}`}
                  className="rounded-sm font-mono text-xs tracking-wide text-mute-strong hover:text-ink"
                >
                  {product.brand.toLowerCase()}
                </Link>
                {(soldOut || product.badge) && <ProductBadge badge={soldOut ? "esgotado" : product.badge!} />}
              </div>
              <h1 className="mt-2 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.02] font-semibold tracking-[-0.025em] lowercase">
                {product.name}
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
                {product.colorway} · <span className="font-mono text-xs">{product.sku}</span>
              </p>
            </div>

            <div className="font-mono tabular-nums">
              <p className="flex flex-wrap items-baseline gap-x-3 text-2xl">
                {off > 0 && product.compareAtPrice && (
                  <>
                    <span className="sr-only">De</span>
                    <s className="text-sm text-mute-strong">{formatBRL(product.compareAtPrice)}</s>
                    <span className="sr-only">por</span>
                  </>
                )}
                <span className={off > 0 ? "text-drop" : undefined}>{formatBRL(product.price)}</span>
                {off > 0 && <span className="text-xs text-drop">−{off}%</span>}
              </p>
              <p className="mt-1.5 text-xs text-ink-soft">
                ou {formatInstallments(product.price)} sem juros ·{" "}
                <strong className="font-medium text-ink">{formatBRL(pixPrice(product.price))}</strong> no pix ({pixPercent}%
                off)
              </p>
            </div>

            <ProductPurchase product={product} />

            <ul className="flex flex-col text-sm">
              <li className="flex items-start gap-3 border-t border-line-soft py-4">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-ink">
                  <BadgeCheck className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">selo de autenticidade</span>
                  <span className="text-xs text-ink-soft">
                    Conferido por especialista antes do envio. Vai com nota fiscal e lacre numerado.
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3 border-t border-line-soft py-4">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-ink">
                  <Truck className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">
                    {product.price >= siteConfig.freeShippingFrom ? "frete grátis" : `frete grátis acima de ${formatBRL(siteConfig.freeShippingFrom)}`}
                  </span>
                  <span className="text-xs text-ink-soft">Prazo calculado pelo CEP na sacola.</span>
                </span>
              </li>
              <li className="flex items-start gap-3 border-y border-line-soft py-4">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-ink">
                  <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">troca em 30 dias</span>
                  <span className="text-xs text-ink-soft">
                    A primeira troca é grátis.{" "}
                    <Link href="/trocas-e-devolucoes" className="underline underline-offset-4">
                      como funciona
                    </Link>
                  </span>
                </span>
              </li>
            </ul>

            <section aria-labelledby="sobre-produto">
              <h2 id="sobre-produto" className="text-sm font-medium">
                sobre o produto
              </h2>
              <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">{product.description}</p>
              <ul className="mt-4 flex flex-col gap-1.5 text-sm">
                {product.details.map((detail) => (
                  <li key={detail} className="flex gap-2 text-ink-soft">
                    <span aria-hidden="true" className="text-mute-strong">
                      —
                    </span>
                    {detail}
                  </li>
                ))}
              </ul>
              <dl className="mt-5 grid grid-cols-2 gap-y-2 font-mono text-xs">
                <dt className="text-mute-strong">tipo</dt>
                <dd>{product.type}</dd>
                <dt className="text-mute-strong">cor</dt>
                <dd>{product.colorway}</dd>
                <dt className="text-mute-strong">lançamento</dt>
                <dd>{product.releaseYear}</dd>
                <dt className="text-mute-strong">sku</dt>
                <dd>{product.sku}</dd>
              </dl>
            </section>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="mt-24 md:mt-36">
          <h2
            id="relacionados"
            className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
          >
            combina com
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
