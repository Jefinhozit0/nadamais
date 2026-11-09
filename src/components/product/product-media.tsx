import Image from "next/image";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

type ProductMediaProps = {
  product: Pick<Product, "images" | "shortName" | "name" | "sku">;
  /** Atributo `sizes` do next/image — ajuste conforme a grade onde o card aparece. */
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Imagem do produto sobre o halo radial. Sem foto cadastrada, mostra um
 * placeholder tipográfico (nome curto em display com grão) — nada de imagem quebrada.
 */
export function ProductMedia({
  product,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  className,
}: ProductMediaProps) {
  const [primary, secondary] = product.images;

  return (
    <div className={cn("bg-halo relative aspect-[4/5] overflow-hidden", className)}>
      {primary ? (
        <>
          <Image
            src={primary.src}
            alt={primary.alt}
            fill
            sizes={sizes}
            priority={priority}
            className={cn(
              "object-contain p-6 transition-[opacity,scale] duration-500 ease-out-expo group-hover/card:scale-[1.03]",
              secondary && "group-hover/card:opacity-0",
            )}
          />
          {secondary && (
            <Image
              src={secondary.src}
              alt=""
              fill
              sizes={sizes}
              className="object-contain p-6 opacity-0 transition-opacity duration-500 ease-out-expo group-hover/card:opacity-100"
            />
          )}
        </>
      ) : (
        <div
          role="img"
          aria-label={product.name}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"
        >
          <span className="text-grain font-display text-[clamp(1.75rem,5vw,2.75rem)] leading-[0.9] font-semibold tracking-tight lowercase transition-transform duration-500 ease-out-expo group-hover/card:scale-[1.04]">
            {product.shortName}
          </span>
          <span className="font-mono text-micro text-mute-strong">{product.sku}</span>
        </div>
      )}
    </div>
  );
}
