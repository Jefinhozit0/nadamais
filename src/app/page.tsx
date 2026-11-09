import { Authenticity } from "@/components/home/authenticity";
import { BrandIndex } from "@/components/home/brand-index";
import { CategoryTiles } from "@/components/home/category-tiles";
import { Hero } from "@/components/home/hero";
import { ProductRail } from "@/components/home/product-rail";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import {
  getBrandSummary,
  getCategoryCovers,
  getFeaturedDrop,
  getNewDrops,
  getTrending,
} from "@/server/queries/products";

export default async function HomePage() {
  const [drop, newDrops, trending, brands, covers] = await Promise.all([
    getFeaturedDrop(),
    getNewDrops(8),
    getTrending(8),
    getBrandSummary(),
    getCategoryCovers(),
  ]);

  return (
    <>
      <Hero drop={drop} />

      <div className="flex flex-col gap-24 px-4 pt-16 md:gap-36 md:px-8 md:pt-24">
        <section aria-labelledby="drops-title">
          <SectionHeading id="drops-title" title="novos drops" link={{ href: "/catalogo?ordem=novos", label: "ver todos" }} />
          <div className="mt-8">
            <ProductRail label="Novos drops">
              {newDrops.map((product) => (
                <li key={product.id} className="w-[46vw] shrink-0 snap-start sm:w-[34vw] md:w-[26vw] lg:w-[21%]">
                  <ProductCard product={product} sizes="(min-width: 1024px) 21vw, (min-width: 768px) 26vw, 46vw" />
                </li>
              ))}
            </ProductRail>
          </div>
        </section>

        <section aria-labelledby="categorias-title">
          <h2 id="categorias-title" className="sr-only">
            Categorias
          </h2>
          <CategoryTiles covers={covers} />
        </section>

        <section aria-labelledby="marcas-title">
          <SectionHeading id="marcas-title" title="marcas" />
          <div className="mt-8">
            <BrandIndex
              rows={brands.map((b) => ({
                brand: b.brand,
                count: b.count,
                cover: b.cover?.images[0] ? { src: b.cover.images[0].src } : undefined,
              }))}
            />
          </div>
        </section>

        <section aria-labelledby="alta-title">
          <SectionHeading id="alta-title" title="em alta" link={{ href: "/catalogo", label: "catálogo completo" }} />
          <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {trending.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>

        <section id="autenticidade" aria-labelledby="autenticidade-title">
          <Authenticity />
        </section>
      </div>
    </>
  );
}
