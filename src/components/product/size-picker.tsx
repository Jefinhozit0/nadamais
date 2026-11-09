"use client";

import { useId, useState } from "react";
import type { ProductSize } from "@/types/product";
import { cn } from "@/lib/utils";

type SizePickerProps = {
  sizes: readonly ProductSize[];
  value?: string;
  onChange?: (label: string) => void;
  /** Abaixo deste estoque, avisa "últimas". */
  lowStockThreshold?: number;
  name?: string;
  legend?: string;
  className?: string;
};

/**
 * Chips de tamanho (design-system §7) como radios nativos:
 * setas do teclado, leitor de tela e formulários funcionam sem JS extra.
 * Disponível = borda ink · selecionado = sólido · esgotado = riscado e desabilitado.
 */
export function SizePicker({
  sizes,
  value,
  onChange,
  lowStockThreshold = 2,
  name,
  legend = "tamanho",
  className,
}: SizePickerProps) {
  const fallbackName = useId();
  const groupName = name ?? fallbackName;
  // Controlado quando `value` é passado; senão guarda a escolha internamente
  const [internal, setInternal] = useState<string | undefined>(undefined);
  const current = value ?? internal;
  const selected = sizes.find((size) => size.label === current);

  return (
    <fieldset className={cn("grid gap-3", className)}>
      <legend className="mb-3 flex w-full items-baseline justify-between text-sm">
        <span>{legend}</span>
        <span className="font-mono text-micro text-mute-strong" aria-live="polite">
          {selected
            ? selected.stock <= lowStockThreshold
              ? `restam ${selected.stock}`
              : "em estoque"
            : "selecione"}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const soldOut = size.stock === 0;
          const low = !soldOut && size.stock <= lowStockThreshold;
          return (
            <label
              key={size.label}
              className={cn(
                "relative inline-flex h-11 min-w-14 cursor-pointer items-center justify-center rounded-full border px-4 font-mono text-sm tabular-nums transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink",
                soldOut
                  ? "cursor-not-allowed border-line-soft text-mute-strong line-through"
                  : "border-ink hover:bg-haze has-[:checked]:bg-ink has-[:checked]:text-canvas",
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={size.label}
                disabled={soldOut}
                checked={current === size.label}
                onChange={() => {
                  setInternal(size.label);
                  onChange?.(size.label);
                }}
                className="sr-only"
              />
              {size.label}
              {soldOut && <span className="sr-only"> (esgotado)</span>}
              {low && (
                <>
                  <span aria-hidden="true" className="absolute top-1.5 right-2 size-1.5 rounded-full bg-drop" />
                  <span className="sr-only"> (últimas unidades)</span>
                </>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
