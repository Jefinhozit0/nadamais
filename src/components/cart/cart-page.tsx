"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatBRL, formatInstallments } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cartSubtotal, useCart } from "@/store/cart";
import { CartLines } from "./cart-lines";
import { FreeShippingMeter } from "./free-shipping-meter";

/** Versão em página da sacola (links diretos para /carrinho). */
export function CartPage() {
  const lines = useCart((s) => s.lines);
  // A sacola vem do navegador: espera reidratar para não piscar "vazia"
  // (no servidor não há localStorage, então `persist` não existe)
  const [ready, setReady] = useState(() => useCart.persist?.hasHydrated() ?? false);
  useEffect(() => {
    if (useCart.persist?.hasHydrated()) {
      const t = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(t);
    }
    return useCart.persist?.onFinishHydration(() => setReady(true));
  }, []);
  const subtotal = cartSubtotal(lines);

  return (
    <div className="px-4 pt-8 md:px-8 md:pt-12">
      <h1 className="font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.9] font-semibold tracking-[-0.035em]">
        <span className="text-grain">sacola</span>
      </h1>

      {!ready ? (
        <div className="mt-10 h-40 animate-pulse rounded-card bg-haze" aria-hidden="true" />
      ) : lines.length === 0 ? (
        <div className="mt-10 flex flex-col items-start gap-4">
          <p className="text-ink-soft">Sua sacola está vazia.</p>
          <Link href="/catalogo?ordem=novos" className={buttonVariants({ variant: "outline" })}>
            ver novos drops <ArrowUpRight strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <CartLines lines={lines} className="lg:col-span-7" />
          <aside className="flex flex-col gap-5 self-start rounded-card border border-line p-5 lg:col-span-4 lg:col-start-9">
            <FreeShippingMeter subtotal={subtotal} />
            <div className="flex items-baseline justify-between border-t border-line-soft pt-4">
              <span className="text-sm">subtotal</span>
              <span className="font-mono text-lg tabular-nums">{formatBRL(subtotal)}</span>
            </div>
            <p className="-mt-3 text-right font-mono text-micro text-mute-strong">
              ou {formatInstallments(subtotal)} sem juros
            </p>
            <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
              finalizar compra
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
