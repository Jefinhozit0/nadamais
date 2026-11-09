"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart, type CartLine } from "@/store/cart";

type CartLinesProps = {
  lines: readonly CartLine[];
  /** Somente leitura (resumo do checkout). */
  readOnly?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export function CartLines({ lines, readOnly = false, onNavigate, className }: CartLinesProps) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  return (
    <ul className={cn("flex flex-col", className)}>
      {lines.map((line) => (
        <li key={line.key} className="flex gap-3 border-b border-line-soft py-4 first:pt-0 last:border-b-0">
          <Link
            href={`/produto/${line.slug}`}
            onClick={onNavigate}
            className="relative size-20 shrink-0 overflow-hidden rounded-sm border border-line-soft bg-haze"
            tabIndex={-1}
            aria-hidden="true"
          >
            {line.image && <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-micro text-mute-strong">linha {line.line}</p>
                <Link
                  href={`/produto/${line.slug}`}
                  onClick={onNavigate}
                  className="line-clamp-2 text-sm lowercase hover:underline underline-offset-4"
                >
                  {line.name}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-mute-strong">
                  tam {line.size}
                  {readOnly && ` · ${line.quantity}×`}
                </p>
              </div>
              <p className="shrink-0 font-mono text-sm tabular-nums">{formatBRL(line.price * line.quantity)}</p>
            </div>

            {!readOnly && (
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="inline-flex h-9 items-center rounded-full border border-line-soft" role="group" aria-label={`Quantidade de ${line.name}`}>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.key, line.quantity - 1)}
                    aria-label={line.quantity === 1 ? "Remover da sacola" : "Diminuir quantidade"}
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-haze"
                  >
                    <Minus className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <span className="w-7 text-center font-mono text-xs tabular-nums" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.key, line.quantity + 1)}
                    disabled={line.quantity >= line.maxQuantity}
                    aria-label="Aumentar quantidade"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-haze disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
                {line.quantity >= line.maxQuantity && (
                  <span className="font-mono text-micro text-drop">máx. em estoque</span>
                )}
                <button
                  type="button"
                  onClick={() => remove(line.key)}
                  className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-full px-2 text-xs text-mute-strong hover:text-ink"
                >
                  <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  remover
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
