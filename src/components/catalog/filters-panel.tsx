"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  catalogHref,
  categoryLabels,
  colorFamilies,
  priceRanges,
  type CatalogFilters,
  type Facets,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { ColorFamily, Line } from "@/types/product";
import { useCatalogNav } from "./catalog-provider";

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group/f border-t border-line-soft py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-sm py-1 text-sm [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 transition-transform group-open/f:rotate-180" strokeWidth={1.5} aria-hidden="true" />
      </summary>
      <fieldset className="mt-3">
        <legend className="sr-only">{title}</legend>
        {children}
      </fieldset>
    </details>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-auto font-mono text-micro text-mute-strong tabular-nums">{n}</span>;
}

/** Painel de filtros. Cada mudança vira uma URL nova (compartilhável e indexável). */
export function FiltersPanel({ filters, facets }: { filters: CatalogFilters; facets: Facets }) {
  const { navigate } = useCatalogNav();
  const go = (change: Partial<CatalogFilters>) => navigate(catalogHref({ ...filters, ...change, pagina: 1 }));

  const sneakerSizes = facets.tamanhos.filter((t) => /^\d+$/.test(t.value));
  const apparelSizes = facets.tamanhos.filter((t) => !/^\d+$/.test(t.value));
  const showSneakerSizes = filters.categoria !== "roupas" && filters.categoria !== "acessorios";
  const showApparelSizes = filters.categoria !== "sneakers";

  const sizeChip = (value: string, count: number) => {
    const checked = filters.tamanhos.includes(value);
    const disabled = count === 0 && !checked;
    return (
      <label
        key={value}
        className={cn(
          "relative inline-flex h-10 min-w-12 cursor-pointer items-center justify-center rounded-full border px-3 font-mono text-xs tabular-nums transition-colors",
          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
          checked ? "border-ink bg-ink text-canvas" : "border-line-soft hover:border-ink",
          disabled && "cursor-not-allowed text-mute-strong line-through opacity-60 hover:border-line-soft",
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={() => go({ tamanhos: toggle(filters.tamanhos, value) })}
        />
        {value}
      </label>
    );
  };

  return (
    <div className="text-sm">
      <Group title="categoria">
        <ul className="flex flex-col gap-1">
          {facets.categorias.map(({ value, count }) => {
            const checked = filters.categoria === value;
            return (
              <li key={value}>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
                  <input
                    type="radio"
                    name="categoria"
                    checked={checked}
                    onChange={() => go({ categoria: value })}
                    onClick={() => checked && go({ categoria: undefined })}
                    className="size-4 accent-ink"
                  />
                  <span className={cn(checked && "font-medium")}>{categoryLabels[value]}</span>
                  <Count n={count} />
                </label>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group title="linha">
        <ul className="flex flex-col gap-1">
          {facets.linhas.map(({ value, count }) => (
            <li key={value}>
              <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
                <input
                  type="checkbox"
                  checked={filters.linhas.includes(value)}
                  onChange={() => go({ linhas: toggle<Line>(filters.linhas, value) })}
                  className="size-4 accent-ink"
                />
                <span>{value}</span>
                <Count n={count} />
              </label>
            </li>
          ))}
        </ul>
      </Group>

      {(showSneakerSizes || showApparelSizes) && (
        <Group title="tamanho">
          {showSneakerSizes && sneakerSizes.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-micro text-mute-strong">tênis · br</p>
              <div className="flex flex-wrap gap-1.5">{sneakerSizes.map((t) => sizeChip(t.value, t.count))}</div>
            </div>
          )}
          {showApparelSizes && apparelSizes.length > 0 && (
            <div className={cn(showSneakerSizes && "mt-4")}>
              <p className="mb-2 font-mono text-micro text-mute-strong">roupas</p>
              <div className="flex flex-wrap gap-1.5">{apparelSizes.map((t) => sizeChip(t.value, t.count))}</div>
            </div>
          )}
        </Group>
      )}

      <Group title="cor">
        <ul className="grid grid-cols-2 gap-1">
          {facets.cores.map(({ value, count }) => {
            const color = colorFamilies.find((c) => c.value === value);
            const checked = filters.cores.includes(value);
            return (
              <li key={value}>
                <label
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
                    count === 0 && !checked && "opacity-50",
                  )}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={() => go({ cores: toggle<ColorFamily>(filters.cores, value) })}
                  />
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: color?.swatch }}
                    className="size-5 shrink-0 rounded-full border border-line-soft ring-offset-2 ring-offset-canvas peer-checked:ring-2 peer-checked:ring-ink"
                  />
                  <span className={cn(checked && "font-medium")}>{color?.label}</span>
                  <Count n={count} />
                </label>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group title="preço">
        <ul className="flex flex-col gap-1">
          {facets.precos.map(({ value, count }) => {
            const checked = filters.preco === value;
            return (
              <li key={value}>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
                  <input
                    type="radio"
                    name="preco"
                    checked={checked}
                    onChange={() => go({ preco: value })}
                    onClick={() => checked && go({ preco: undefined })}
                    className="size-4 accent-ink"
                  />
                  <span>{priceRanges.find((r) => r.value === value)?.label}</span>
                  <Count n={count} />
                </label>
              </li>
            );
          })}
        </ul>
      </Group>
    </div>
  );
}
