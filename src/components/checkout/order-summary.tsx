"use client";

import { ChevronDown } from "lucide-react";
import { CartLines } from "@/components/cart/cart-lines";
import { siteConfig } from "@/config/site";
import { formatBRL } from "@/lib/format";
import type { CartLine } from "@/store/cart";

export type SummaryTotals = {
  subtotal: number;
  shipping?: number;
  discount: number;
  total: number;
};

function Rows({ totals }: { totals: SummaryTotals }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-y-2 font-mono text-sm tabular-nums">
      <dt className="font-sans">subtotal</dt>
      <dd>{formatBRL(totals.subtotal)}</dd>
      <dt className="font-sans">frete</dt>
      <dd>{totals.shipping === undefined ? "—" : totals.shipping === 0 ? "grátis" : formatBRL(totals.shipping)}</dd>
      {totals.discount > 0 && (
        <>
          <dt className="font-sans text-success">desconto pix ({Math.round(siteConfig.pixDiscount * 100)}%)</dt>
          <dd className="text-success">−{formatBRL(totals.discount)}</dd>
        </>
      )}
      <dt className="border-t border-line-soft pt-3 font-sans font-medium">total</dt>
      <dd className="border-t border-line-soft pt-3 text-lg">{formatBRL(totals.total)}</dd>
    </dl>
  );
}

/** Resumo: aberto e fixo no desktop, recolhível no mobile (mostra o total no topo). */
export function OrderSummary({ lines, totals }: { lines: readonly CartLine[]; totals: SummaryTotals }) {
  return (
    <>
      <details className="group/sum rounded-card border border-line lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 text-sm [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            resumo do pedido
            <ChevronDown className="size-4 transition-transform group-open/sum:rotate-180" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span className="font-mono tabular-nums">{formatBRL(totals.total)}</span>
        </summary>
        <div className="flex flex-col gap-5 border-t border-line-soft p-4">
          <CartLines lines={lines} readOnly />
          <Rows totals={totals} />
        </div>
      </details>

      <aside aria-label="Resumo do pedido" className="hidden lg:block">
        <div className="sticky top-28 flex flex-col gap-5 rounded-card border border-line p-5">
          <h2 className="font-display text-lg font-medium">resumo</h2>
          <div className="max-h-[40vh] overflow-y-auto pr-1">
            <CartLines lines={lines} readOnly />
          </div>
          <Rows totals={totals} />
        </div>
      </aside>
    </>
  );
}
