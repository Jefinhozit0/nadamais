"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cartCount, useCart } from "@/store/cart";
import { useCartDrawer } from "@/store/cart-ui";

/** Botão "sacola · 00" do header: abre a sacola lateral. */
export function CartButton() {
  const count = useCart((state) => cartCount(state.lines));
  const setOpen = useCartDrawer((s) => s.setOpen);
  const padded = String(count).padStart(2, "0");

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      // o nome acessível começa pelo texto visível (WCAG 2.5.3): quem usa comando de voz diz "sacola"
      aria-label={`sacola · ${padded}, ${count} ${count === 1 ? "item" : "itens"}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-mono tabular-nums normal-case")}
    >
      sacola · <span key={count} className="inline-block animate-in fade-in zoom-in-75 duration-300">
        {padded}
      </span>
    </button>
  );
}
