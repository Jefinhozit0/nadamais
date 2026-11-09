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
 * ano do drop em mono, nome + preço na mesma linha.
 * O link cobre o card inteiro via pseudo-elemento; o botão de favoritar fica acima dele.
 */
export function ProductCard({ product, sizes, priority, className }: ProductCardProps) {
  const soldOut = product.sizes.every((size) => size.stock === 0);
  const badge = soldOut ? "esgotado" : product.badge;

  return (
    <article
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-card border border-line bg-canvas",
        "focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-ink",
        className,
      )}
    >
      <div className="relative">
        <ProductMedia product={product} sizes={sizes} priority={priority} className={cn(soldOut && "opacity-50")} />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          {badge ? <ProductBadge badge={badge} /> : <span />}
          <WishlistButton productName={product.name} className="relative z-10 -mt-1.5 -mr-1.5" />
        </div>

        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-micro font-medium">
          {product.releaseYear}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 border-t border-line-soft px-4 pt-3 pb-4">
        <div className="min-w-0">
          <p className="font-mono text-micro tracking-wide text-mute-strong uppercase">{product.brand}</p>
          <h3 className="mt-1 truncate text-[0.8125rem] lowercase">
            <Link
              href={`/produto/${product.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {product.name}
            </Link>
          </h3>
        </div>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} className="shrink-0" />
      </div>
    </article>
  );
}
