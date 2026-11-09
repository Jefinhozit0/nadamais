"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { formatBRL, formatInstallments } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { useCartDrawer } from "@/store/cart-ui";
import { CartLines } from "./cart-lines";
import { FreeShippingMeter } from "./free-shipping-meter";

/** Sacola lateral. Abre pelo header e automaticamente ao adicionar um produto. */
export function CartDrawer() {
  const { open, setOpen } = useCartDrawer();
  const lines = useCart((s) => s.lines);
  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-l border-line p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <div className="flex items-baseline gap-3 border-b border-line-soft px-5 py-5 pr-14">
          <SheetTitle className="font-display text-2xl font-semibold tracking-tight">sacola</SheetTitle>
          <span className="font-mono text-xs text-mute-strong">
            {String(count).padStart(2, "0")} {count === 1 ? "item" : "itens"}
          </span>
        </div>
        <SheetDescription className="sr-only">Itens da sua sacola e resumo do pedido</SheetDescription>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-display text-xl font-medium">Sua sacola está vazia.</p>
            <p className="max-w-[30ch] text-sm text-ink-soft">Os drops saem rápido. Dá uma olhada no que chegou.</p>
            <Link href="/catalogo?ordem=novos" onClick={close} className={buttonVariants({ variant: "outline" })}>
              ver novos drops <ArrowUpRight strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line-soft px-5 py-4">
              <FreeShippingMeter subtotal={subtotal} />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <CartLines lines={lines} onNavigate={close} />
            </div>
            <SheetFooter className="gap-3 border-t border-line-soft bg-canvas px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">subtotal</span>
                <span className="font-mono text-lg tabular-nums">{formatBRL(subtotal)}</span>
              </div>
              <p className="-mt-2 text-right font-mono text-micro text-mute-strong">
                ou {formatInstallments(subtotal)} sem juros · frete calculado no checkout
              </p>
              <Link href="/checkout" onClick={close} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                finalizar compra
              </Link>
              <button type="button" onClick={close} className="h-10 cursor-pointer text-xs underline underline-offset-4">
                continuar comprando
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
