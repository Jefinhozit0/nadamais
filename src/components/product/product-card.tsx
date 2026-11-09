import Link from "next/link";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { Price } from "./price";
import { ProductBadge } from "./product-badge";
import { ProductMedia } from "./product-media";
import { WishlistButton } from "./wishlist-button";

type ProductCardProps = {
  product: Product;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Card-assinatura (design-system §7): moldura de 1px, produto sobre halo,
 * ano do drop em mono. Abaixo: marca → nome (até 2 linhas) → preço + parcelas.
 * O link cobre o card inteiro via pseudo-elemento; o botão de favoritar fica acima dele.
 */
export function ProductCard({ product, sizes, priority, className }: ProductCardProps) {
  const soldOut = product.sizes.every((size) => size.stock === 0);
  const badge = soldOut ? "esgotado" : product.badge;

  return (
    <article
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-canvas",
        "focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-ink",
        className,
      )}
    >
      <div className="relative">
        <ProductMedia
          product={product}
          sizes={sizes}
          priority={priority}
          className={cn(soldOut && "[&>*]:opacity-45")}
        />

        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2 md:inset-x-3 md:top-3">
          {badge ? <ProductBadge badge={badge} className="min-w-0 truncate" /> : <span />}
          <WishlistButton productName={product.name} className="relative z-10 -mt-1.5 -mr-1.5" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-line-soft px-3 pt-3 pb-4 md:px-4">
        <p className="flex justify-between gap-2 font-mono text-micro tracking-wide text-mute-strong">
          <span className="truncate">{product.brand.toLowerCase()}</span>
          <span className="shrink-0">{product.releaseYear}</span>
        </p>
        <h3 className="line-clamp-2 text-[0.8125rem] leading-snug lowercase">
          <Link
            href={`/produto/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {product.name}
            {soldOut && <span className="sr-only"> — esgotado</span>}
          </Link>
        </h3>
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          showInstallments={!soldOut}
          className="mt-auto items-start pt-2"
        />
      </div>
    </article>
  );
}
