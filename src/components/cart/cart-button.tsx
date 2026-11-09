"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cartCount, useCart } from "@/store/cart";

/** Botão "sacola · 00" do header. O drawer lateral entra na Fase 3. */
export function CartButton() {
  const count = useCart((state) => cartCount(state.lines));

  return (
    <Link
      href="/carrinho"
      aria-label={`Sacola, ${count} ${count === 1 ? "item" : "itens"}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-mono tabular-nums normal-case")}
    >
      sacola · <span key={count} className="inline-block animate-in fade-in zoom-in-75 duration-300">
        {String(count).padStart(2, "0")}
      </span>
    </Link>
  );
}
