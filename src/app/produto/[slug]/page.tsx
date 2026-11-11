import { BadgeCheck, RotateCcw, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductBadge } from "@/components/product/product-badge";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Stars, starsLabel } from "@/components/reviews/stars";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { catalogHref, categoryLabels } from "@/lib/catalog";
import { discountPercent, formatBRL, formatInstallments, pixPrice } from "@/lib/format";
import { formatRating, reviewCountLabel, type Review } from "@/lib/reviews";
import { absoluteUrl } from "@/lib/site-url";
import { getAllProductSlugs, getProductBySlug, getRelatedProducts } from "@/server/queries/products";
import { getProductReviews } from "@/server/reviews";
import type { Product } from "@/types/product";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };
  // marca na frente ("Nike Air Max 95 Neo"), salvo quando o nome já a traz ou é a própria loja
  const brand = product.brand.trim();
  const withBrand = brand && brand !== siteConfig.name && !product.name.toLowerCase().startsWith(brand.toLowerCase());
  const title = `${withBrand ? `${brand} ` : ""}${product.name} ${product.colorway}`;
  return {
    title,
    description: `${product.description} ${formatBRL(product.price)} ou ${formatInstallments(product.price)} sem juros.`,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: siteConfig.name,
      title,
      images: product.images[0] ? [{ url: product.images[0].src, alt: product.images[0].alt }] : undefined,
    },
  };
}

/**
 * O conteúdo fica dentro de <Suspense>: produtos criados no admin depois do build
 * (slugs fora do generateStaticParams) são renderizados sob demanda sem bloquear a rota.
 */
export default function ProductPage({ params }: PageProps<"/produto/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-8 px-4 pt-6 md:px-8 md:pt-8 lg:grid-cols-12 lg:gap-12">
      <div className="aspect-[4/5] animate-pulse rounded-card bg-haze lg:col-span-7" />
      <div className="flex flex-col gap-4 lg:col-span-5">
        <div className="h-12 w-3/4 animate-pulse rounded-sm bg-haze" />
        <div className="h-6 w-1/3 animate-pulse rounded-sm bg-haze" />
        <div className="h-40 animate-pulse rounded-card bg-haze" />
      </div>
    </div>
  );
}

async function ProductView({ params }: { params: PageProps<"/produto/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, { stats, verified, reviews }] = await Promise.all([getRelatedProducts(product, 4), getProductReviews(product.id)]);
  const soldOut = product.sizes.every((s) => s.stock === 0);
  const off = product.compareAtPrice ? discountPercent(product.price, product.compareAtPrice) : 0;
  const pixPercent = Math.round(siteConfig.pixDiscount * 100);

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-8">
      <JsonLd data={productJsonLd(product, soldOut, verified, reviews)} />
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
            <Link href={catalogHref({ marcas: [product.brand] })} className="rounded-sm hover:text-ink">
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
                  href={catalogHref({ marcas: [product.brand] })}
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
              {stats.count > 0 && (
                <a
                  href="#avaliacoes"
                  className="mt-3 inline-flex items-center gap-2 rounded-sm py-1 font-mono text-xs tabular-nums underline-offset-4 hover:underline"
                >
                  <Stars value={stats.average} />
                  <span>
                    {formatRating(stats.average)} <span className="text-mute-strong">· {reviewCountLabel(stats.count)}</span>
                    <span className="sr-only"> — {starsLabel(stats.average)}, ver avaliações</span>
                  </span>
                </a>
              )}
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
                  <span className="block font-medium">conferido antes do envio</span>
                  <span className="text-xs text-ink-soft">
                    Cada par é revisado (numeração, costura e acabamento) antes de sair.
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
                  <span className="block font-medium">troca em {siteConfig.exchangeDays} dias</span>
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

      <ReviewsSection product={product} stats={stats} reviews={reviews} />

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

/** Product + BreadcrumbList (schema.org) — habilita preço, estoque e trilha nos resultados do Google. */
function productJsonLd(
  product: Product,
  soldOut: boolean,
  verified: { average: number; count: number },
  reviews: Review[],
): Record<string, unknown> {
  const url = absoluteUrl(`/produto/${product.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#produto`,
        name: `${product.brand} ${product.name} ${product.colorway}`,
        description: product.description,
        sku: product.sku,
        color: product.colorway,
        category: categoryLabels[product.category],
        image: product.images.map((img) => absoluteUrl(img.src)),
        brand: { "@type": "Brand", name: product.brand },
        // só compras verificadas pelo site: depoimentos recebidos por mensagem não entram (regra do Google)
        ...(verified.count > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: verified.average,
            reviewCount: verified.count,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews
            .filter((r) => r.source === "site")
            .slice(0, 5)
            .map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            author: { "@type": "Person", name: r.authorName },
            datePublished: r.createdAt.slice(0, 10),
            ...(r.title && { name: r.title }),
            reviewBody: r.body,
          })),
        }),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: siteConfig.currency,
          price: (product.price / 100).toFixed(2),
          availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: siteConfig.name },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "BR",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: siteConfig.exchangeDays,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "início", item: absoluteUrl("/") },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryLabels[product.category],
            item: absoluteUrl(`/catalogo?categoria=${product.category}`),
          },
          { "@type": "ListItem", position: 3, name: product.name, item: url },
        ],
      },
    ],
  };
}
