"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cartCount, useCart } from "@/store/cart";
import { useCartDrawer } from "@/store/cart-ui";

/** Botão "sacola · 00" do header: abre a sacola lateral. */
export function CartButton() {
  const count = useCart((state) => cartCount(state.lines));
  const setOpen = useCartDrawer((s) => s.setOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      aria-label={`Abrir sacola, ${count} ${count === 1 ? "item" : "itens"}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-mono tabular-nums normal-case")}
    >
      sacola · <span key={count} className="inline-block animate-in fade-in zoom-in-75 duration-300">
        {String(count).padStart(2, "0")}
      </span>
    </button>
  );
}
