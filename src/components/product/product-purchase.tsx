"use client";

import { Check } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { convertSneakerSize, sizeNotations, type SizeNotation } from "@/lib/sizes";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useCartDrawer } from "@/store/cart-ui";
import type { Product } from "@/types/product";
import { SizePicker } from "./size-picker";

type Props = {
  product: Pick<Product, "id" | "slug" | "name" | "brand" | "price" | "images" | "sizes" | "sizeSystem">;
};

/** Seleção de tamanho (BR/US/EU para tênis) + adicionar à sacola. */
export function ProductPurchase({ product }: Props) {
  const add = useCart((state) => state.add);
  const openDrawer = useCartDrawer((state) => state.setOpen);
  const errorId = useId();
  const oneSize = product.sizeSystem === "one-size";
  const [size, setSize] = useState<string | undefined>(oneSize ? product.sizes[0]?.label : undefined);
  const [notation, setNotation] = useState<SizeNotation>("br");
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const soldOut = product.sizes.every((s) => s.stock === 0);

  function onAdd() {
    const chosen = product.sizes.find((s) => s.label === size);
    if (!chosen || chosen.stock === 0) {
      setError(true);
      document.getElementById(errorId)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      size: chosen.label,
      price: product.price,
      image: product.images[0]?.src,
      maxQuantity: chosen.stock,
    });
    setError(false);
    setAdded(true);
    openDrawer(true);
    window.setTimeout(() => setAdded(false), 2600);
  }

  const notationToggle =
    product.sizeSystem === "sneaker" ? (
      <span role="radiogroup" aria-label="Numeração" className="inline-flex rounded-full border border-line-soft p-0.5">
        {sizeNotations.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={notation === n}
            onClick={() => setNotation(n)}
            className={cn(
              "relative h-7 cursor-pointer rounded-full px-2.5 font-mono text-micro uppercase transition-colors before:absolute before:-inset-y-2 before:inset-x-0",
              notation === n ? "bg-ink text-canvas" : "text-mute-strong hover:text-ink",
            )}
          >
            {n}
          </button>
        ))}
      </span>
    ) : null;

  return (
    <div className="flex flex-col gap-5">
      {!oneSize && (
        <div>
          <SizePicker
            sizes={product.sizes}
            value={size}
            onChange={(label) => {
              setSize(label);
              setError(false);
            }}
            legend={product.sizeSystem === "sneaker" ? "tamanho" : "tamanho"}
            legendAside={notationToggle}
            formatLabel={
              product.sizeSystem === "sneaker" ? (label) => convertSneakerSize(label, notation) : undefined
            }
            invalid={error}
            describedBy={error ? errorId : undefined}
          />
          <p id={errorId} role="alert" className="mt-3 min-h-5 text-xs text-drop">
            {error ? "Escolha um tamanho disponível para continuar." : ""}
          </p>
          {product.sizeSystem === "sneaker" && (
            <p className="text-xs text-mute-strong">
              Conversão de referência; a forma varia por modelo. Na dúvida entre dois, vá no maior.
            </p>
          )}
        </div>
      )}

      <Button size="lg" className="w-full" onClick={onAdd} disabled={soldOut}>
        {soldOut ? (
          "esgotado"
        ) : added ? (
          <>
            <Check strokeWidth={1.5} aria-hidden="true" /> adicionado à sacola
          </>
        ) : (
          "adicionar à sacola"
        )}
      </Button>
      <p role="status" className="sr-only">
        {added ? `${product.name} adicionado à sacola.` : ""}
      </p>
    </div>
  );
}
