"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  activeFilterCount,
  catalogHref,
  categoryLabels,
  colorFamilies,
  priceRanges,
  sortOptions,
  type CatalogFilters,
  type Facets,
  type SortOption,
} from "@/lib/catalog";
import { useCatalogNav } from "./catalog-provider";
import { FiltersPanel } from "./filters-panel";

type Props = { filters: CatalogFilters; facets: Facets; total: number };

/** Ordenação + botão de filtros (mobile) + chips de filtros ativos com remoção individual. */
export function CatalogToolbar({ filters, facets, total }: Props) {
  const { navigate } = useCatalogNav();
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);
  const go = (change: Partial<CatalogFilters>) => navigate(catalogHref({ ...filters, ...change, pagina: 1 }));

  const chips: { key: string; label: string; remove: Partial<CatalogFilters> }[] = [
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”`, remove: { q: "" } }] : []),
    ...(filters.categoria
      ? [{ key: "cat", label: categoryLabels[filters.categoria], remove: { categoria: undefined } }]
      : []),
    ...filters.linhas.map((l) => ({
      key: `l-${l}`,
      label: `linha ${l}`,
      remove: { linhas: filters.linhas.filter((x) => x !== l) },
    })),
    ...filters.tamanhos.map((t) => ({
      key: `t-${t}`,
      label: `tam ${t}`,
      remove: { tamanhos: filters.tamanhos.filter((x) => x !== t) },
    })),
    ...filters.cores.map((c) => ({
      key: `c-${c}`,
      label: colorFamilies.find((x) => x.value === c)?.label ?? c,
      remove: { cores: filters.cores.filter((x) => x !== c) },
    })),
    ...(filters.preco
      ? [{ key: "p", label: priceRanges.find((r) => r.value === filters.preco)?.label ?? "", remove: { preco: undefined } }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" />}>
            <SlidersHorizontal strokeWidth={1.5} />
            filtros{count > 0 && <span className="font-mono">· {count}</span>}
          </SheetTrigger>
          <SheetContent side="left" className="w-full overflow-y-auto border-r border-line p-5 data-[side=left]:w-full data-[side=left]:sm:max-w-sm">
            <SheetTitle className="font-display text-xl">filtros</SheetTitle>
            <FiltersPanel filters={filters} facets={facets} />
            <SheetFooter className="sticky bottom-0 -mx-5 -mb-5 mt-4 flex-row border-t border-line-soft bg-canvas p-4">
              <Button variant="ghost" className="flex-1" onClick={() => navigate(catalogHref({ q: filters.q, ordem: filters.ordem }))}>
                limpar
              </Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>
                ver {total} {total === 1 ? "produto" : "produtos"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <p className="hidden font-mono text-xs text-mute-strong lg:block" aria-live="polite">
          {total} {total === 1 ? "produto" : "produtos"}
        </p>

        <label className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-mute-strong">ordenar</span>
          <select
            value={filters.ordem}
            onChange={(event) => go({ ordem: event.target.value as SortOption })}
            className="h-10 cursor-pointer rounded-full border border-line-soft bg-canvas px-4 pr-8 text-xs hover:border-ink"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => go(chip.remove)}
                className="relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-ink pr-2.5 pl-3 text-xs lowercase transition-colors before:absolute before:-inset-y-1.5 before:inset-x-0 hover:bg-ink hover:text-canvas"
              >
                {chip.label}
                <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span className="sr-only">(remover filtro)</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => navigate(catalogHref({ ordem: filters.ordem }))}
              className="h-8 cursor-pointer px-2 text-xs underline underline-offset-4"
            >
              limpar tudo
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
