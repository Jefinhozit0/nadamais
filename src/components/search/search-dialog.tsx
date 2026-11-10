"use client";

import { ArrowUpRight, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { catalogHref } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/server/queries/products";

const popular = ["court", "chunky", "moletom", "cargo", "boné"];

function hrefFor(s: SearchSuggestion): string {
  return s.kind === "product" ? `/produto/${s.slug}` : catalogHref({ marcas: [s.brand] });
}

/**
 * Busca com sugestões (padrão combobox WAI-ARIA):
 * ↑/↓ navegam, Enter abre a sugestão ativa ou busca o termo no catálogo.
 */
export function SearchDialog() {
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      abortRef.current?.abort();
      return;
    }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = (await res.json()) as { suggestions: SearchSuggestion[] };
        setResults(data.suggestions);
        setActive(-1);
      } catch {
        // requisição cancelada por uma digitação mais nova
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 140);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Atalho "/" abre a busca (fora de campos de texto)
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !open && !/input|textarea|select/i.test(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const visible = query.trim().length >= 2 ? results : [];

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && visible.length) {
      event.preventDefault();
      setActive((i) => (i + 1) % visible.length);
    } else if (event.key === "ArrowUp" && visible.length) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? visible.length - 1 : i - 1));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Buscar produtos (atalho: /)" />}>
        <Search strokeWidth={1.5} />
      </DialogTrigger>
      <DialogContent className="top-[12vh] translate-y-0 gap-0 p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Buscar produtos</DialogTitle>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const chosen = visible[active];
            if (chosen) go(hrefFor(chosen));
            else if (query.trim()) go(`/catalogo?q=${encodeURIComponent(query.trim())}`);
          }}
          className="flex items-center gap-3 border-b border-line-soft px-5"
        >
          <Search className="size-4 shrink-0 text-mute-strong" strokeWidth={1.5} aria-hidden="true" />
          <input
            autoFocus
            type="search"
            role="combobox"
            aria-expanded={visible.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-label="Buscar por marca, produto ou cor"
            placeholder="court, moletom, cargo…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            className="h-16 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-mute-strong"
          />
          <kbd className="hidden rounded-sm border border-line-soft px-1.5 font-mono text-micro text-mute-strong sm:inline">
            esc
          </kbd>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
          {query.trim().length < 2 ? (
            <div className="p-3">
              <p className="font-mono text-micro text-mute-strong">mais buscados</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {popular.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => setQuery(term)}
                      className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line-soft px-3.5 text-xs transition-colors hover:border-ink"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : visible.length === 0 ? (
            <p className="p-3 text-sm text-mute-strong">
              {loading ? "buscando…" : `Nada para “${query.trim()}”. Tente a marca, o nome do modelo ou a cor.`}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Sugestões">
              {visible.map((s, index) => (
                <li
                  key={s.kind === "product" ? s.slug : `marca-${s.brand}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(hrefFor(s))}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5",
                    index === active && "bg-haze",
                  )}
                >
                  {s.kind === "product" ? (
                    <>
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-sm bg-haze">
                        {s.image && <Image src={s.image} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-micro text-mute-strong lowercase">{s.brand}</span>
                        <span className="block truncate text-sm lowercase">{s.name}</span>
                      </span>
                      <span className="font-mono text-xs tabular-nums">{formatBRL(s.price)}</span>
                    </>
                  ) : (
                    <>
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-ink font-display text-xs">
                        {s.brand.slice(0, 2).toLowerCase()}
                      </span>
                      <span className="flex-1 text-sm">
                        marca <strong className="font-medium lowercase">{s.brand}</strong>
                        <span className="ml-2 font-mono text-micro text-mute-strong">{s.count} produtos</span>
                      </span>
                      <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {query.trim().length >= 2 && (
          <button
            type="button"
            onClick={() => go(`/catalogo?q=${encodeURIComponent(query.trim())}`)}
            className="flex w-full cursor-pointer items-center justify-between border-t border-line-soft px-5 py-4 text-sm hover:bg-haze"
          >
            ver todos os resultados para “{query.trim()}”
            <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
