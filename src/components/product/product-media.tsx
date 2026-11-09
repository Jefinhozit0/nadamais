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
 * Mídia do card.
 * - recorte (fundo transparente): fica sobre o halo, com respiro;
 * - foto (cena inteira): preenche o quadro 4:5;
 * - sem imagem: placeholder tipográfico (nome curto em display com grão).
 * Com 2ª imagem, troca no hover.
 */
export function ProductMedia({
  product,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw",
  priority = false,
  className,
}: ProductMediaProps) {
  const [primary, secondary] = product.images;
  const fit = (kind: "photo" | "cutout") => (kind === "cutout" ? "object-contain p-[8%]" : "object-cover");

  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden",
        !primary || primary.kind === "cutout" ? "bg-halo" : "bg-haze",
        className,
      )}
    >
      {primary ? (
        <>
          <Image
            src={primary.src}
            alt={primary.alt}
            fill
            sizes={sizes}
            priority={priority}
            className={cn(
              fit(primary.kind),
              "transition-[opacity,scale] duration-700 ease-out-expo group-hover/card:scale-[1.03]",
              secondary && "group-hover/card:opacity-0",
            )}
          />
          {secondary && (
            <Image
              src={secondary.src}
              alt=""
              fill
              sizes={sizes}
              className={cn(
                fit(secondary.kind),
                "opacity-0 transition-opacity duration-700 ease-out-expo group-hover/card:opacity-100",
              )}
            />
          )}
        </>
      ) : (
        <div
          role="img"
          aria-label={product.name}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
        >
          <span className="text-grain font-display text-[clamp(1.375rem,4.5vw,2.75rem)] leading-[0.9] font-semibold tracking-tight text-balance lowercase transition-transform duration-500 ease-out-expo group-hover/card:scale-[1.04]">
            {product.shortName}
          </span>
          <span className="font-mono text-micro text-ink-soft">{product.sku}</span>
        </div>
      )}
    </div>
  );
}
