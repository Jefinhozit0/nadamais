"use client";

import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useRef, useState, type ReactNode } from "react";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  BADGES,
  CATEGORIES,
  COLORS,
  DEFAULT_SIZES,
  LINES,
  SIZE_SYSTEMS,
  slugify,
  type ProductInput,
} from "@/lib/admin-schema";
import { cn } from "@/lib/utils";

const brl = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
const parseBrl = (text: string): number => {
  const clean = text.replace(/[^\d,]/g, "").replace(",", ".");
  const value = Math.round(Number(clean) * 100);
  return Number.isFinite(value) ? value : 0;
};

const selectClass =
  "h-11 w-full cursor-pointer rounded-sm border border-line-soft bg-canvas px-3 text-base hover:border-ink-soft md:text-sm aria-invalid:border-drop";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 border-t border-line-soft pt-6 sm:grid-cols-6">
      <legend className="mb-4 font-display text-lg font-medium">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ProductForm({ initial, saved }: { initial: ProductInput; saved?: boolean }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [p, setP] = useState<ProductInput>(initial);
  const [priceText, setPriceText] = useState(initial.price ? brl(initial.price) : "");
  const [compareText, setCompareText] = useState(initial.compareAtPrice ? brl(initial.compareAtPrice) : "");
  const [detailsText, setDetailsText] = useState(initial.details.join("\n"));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const f = state.fields ?? {};
  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setP((prev) => ({ ...prev, [key]: value }));

  const payload: ProductInput = {
    ...p,
    price: parseBrl(priceText),
    compareAtPrice: compareText.trim() ? parseBrl(compareText) : null,
    details: detailsText.split("\n").map((d) => d.trim()).filter(Boolean),
  };

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(undefined);
    const added: ProductInput["images"] = [];
    for (const file of Array.from(files).slice(0, 8 - p.images.length)) {
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = (await res.json()) as { src?: string; width?: number; height?: number; error?: string };
        if (!res.ok || !data.src) {
          setUploadError(data.error ?? "Falha no upload.");
          break;
        }
        added.push({ src: data.src, alt: `${p.name} ${p.colorway}`.trim(), kind: "photo", width: data.width ?? 1200, height: data.height ?? 1500 });
      } catch {
        setUploadError("Sem conexão para enviar a foto.");
        break;
      }
    }
    setP((prev) => ({ ...prev, images: [...prev.images, ...added] }));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function moveImage(index: number, dir: -1 | 1) {
    setP((prev) => {
      const images = [...prev.images];
      const target = index + dir;
      if (target < 0 || target >= images.length) return prev;
      [images[index], images[target]] = [images[target]!, images[index]!];
      return { ...prev, images };
    });
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-8">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      {saved && !state.error && (
        <p role="status" className="rounded-card border border-success px-4 py-3 text-sm">
          Produto salvo. A vitrine já mostra a versão nova.
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded-card border border-drop bg-drop-soft px-4 py-3 text-sm text-drop">
          {state.error}
        </p>
      )}

      <Section title="básico">
        <Field label="nome" error={f.name} className="sm:col-span-4">
          {(field) => (
            <Input
              {...field}
              value={p.name}
              onChange={(e) => {
                const name = e.target.value;
                setP((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(`${name} ${prev.colorway}`) }));
              }}
            />
          )}
        </Field>
        <Field label="nome curto (cards)" error={f.shortName} hint="Ex.: court low" className="sm:col-span-2">
          {(field) => <Input {...field} value={p.shortName} maxLength={24} onChange={(e) => set("shortName", e.target.value)} />}
        </Field>
        <Field label="cor (texto)" error={f.colorway} hint="Ex.: branco total" className="sm:col-span-3">
          {(field) => (
            <Input
              {...field}
              value={p.colorway}
              onChange={(e) => {
                const colorway = e.target.value;
                setP((prev) => ({ ...prev, colorway, slug: slugTouched ? prev.slug : slugify(`${prev.name} ${colorway}`) }));
              }}
            />
          )}
        </Field>
        <Field label="endereço (slug)" error={f.slug} hint={`/produto/${p.slug || "…"}`} className="sm:col-span-3">
          {(field) => (
            <Input
              {...field}
              value={p.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          )}
        </Field>
        <Field label="sku" error={f.sku} className="sm:col-span-2">
          {(field) => <Input {...field} value={p.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} className="font-mono" />}
        </Field>
        <Field label="linha" error={f.line} className="sm:col-span-2">
          {(field) => (
            <select {...field} value={p.line} onChange={(e) => set("line", e.target.value as ProductInput["line"])} className={selectClass}>
              {LINES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="categoria" error={f.category} className="sm:col-span-2">
          {(field) => (
            <select
              {...field}
              value={p.category}
              onChange={(e) => set("category", e.target.value as ProductInput["category"])}
              className={selectClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "acessorios" ? "acessórios" : c}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="tipo" error={f.type} hint="tênis, moletom, boné…" className="sm:col-span-2">
          {(field) => <Input {...field} value={p.type} onChange={(e) => set("type", e.target.value)} />}
        </Field>
      </Section>

      <Section title="preço">
        <Field label="preço de venda (R$)" error={f.price} className="sm:col-span-2">
          {(field) => <Input {...field} inputMode="decimal" placeholder="389,90" value={priceText} onChange={(e) => setPriceText(e.target.value)} className="font-mono" />}
        </Field>
        <Field label="preço “de” (opcional)" error={f.compareAtPrice} hint="Mostra riscado, como promoção." className="sm:col-span-2">
          {(field) => (
            <Input {...field} inputMode="decimal" placeholder="—" value={compareText} onChange={(e) => setCompareText(e.target.value)} className="font-mono" />
          )}
        </Field>
      </Section>

      <Section title="descrição">
        <Field label="descrição" error={f.description} className="sm:col-span-6">
          {(field) => (
            <textarea
              {...field}
              rows={4}
              value={p.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-sm border border-line-soft bg-transparent px-4 py-3 text-base hover:border-ink-soft focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-sm"
            />
          )}
        </Field>
        <Field label="detalhes (um por linha)" error={f.details} className="sm:col-span-6">
          {(field) => (
            <textarea
              {...field}
              rows={4}
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
              placeholder={"Cabedal em couro\nSola de borracha"}
              className="w-full rounded-sm border border-line-soft bg-transparent px-4 py-3 text-base hover:border-ink-soft focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-sm"
            />
          )}
        </Field>
        <div className="sm:col-span-6">
          <p className="mb-2 text-sm">cores para o filtro</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Cores">
            {COLORS.map((c) => {
              const on = p.colors.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("colors", on ? p.colors.filter((x) => x !== c) : [...p.colors, c])}
                  className={cn(
                    "h-9 cursor-pointer rounded-full border px-3.5 text-xs transition-colors",
                    on ? "border-ink bg-ink text-canvas" : "border-line-soft hover:border-ink",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
          {f.colors && <p className="mt-2 text-xs text-drop">{f.colors}</p>}
        </div>
      </Section>

      <Section title="tamanhos e estoque">
        <Field label="grade" className="sm:col-span-2">
          {(field) => (
            <select
              {...field}
              value={p.sizeSystem}
              onChange={(e) => {
                const sizeSystem = e.target.value as ProductInput["sizeSystem"];
                // troca a grade preservando estoque dos rótulos que continuam existindo
                setP((prev) => ({
                  ...prev,
                  sizeSystem,
                  sizes: DEFAULT_SIZES[sizeSystem].map((label) => ({
                    label,
                    stock: prev.sizes.find((s) => s.label === label)?.stock ?? 0,
                  })),
                }));
              }}
              className={selectClass}
            >
              {SIZE_SYSTEMS.map((s) => (
                <option key={s} value={s}>
                  {s === "sneaker" ? "tênis (BR 37–44)" : s === "apparel" ? "roupa (P–GG)" : "tamanho único"}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="sm:col-span-6">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {p.sizes.map((size, i) => (
              <li key={i} className="flex flex-col gap-1 rounded-sm border border-line-soft p-2">
                <div className="flex items-center gap-1">
                  <label className="sr-only" htmlFor={`size-${i}`}>
                    Rótulo do tamanho
                  </label>
                  <input
                    id={`size-${i}`}
                    value={size.label}
                    onChange={(e) => set("sizes", p.sizes.map((s, j) => (j === i ? { ...s, label: e.target.value.toUpperCase() } : s)))}
                    className="h-8 w-full min-w-0 rounded-sm bg-haze px-2 text-center font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => set("sizes", p.sizes.filter((_, j) => j !== i))}
                    aria-label={`Remover tamanho ${size.label}`}
                    className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-mute-strong hover:text-drop"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
                <label className="sr-only" htmlFor={`stock-${i}`}>
                  Estoque do tamanho {size.label}
                </label>
                <input
                  id={`stock-${i}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={size.stock}
                  onChange={(e) =>
                    set("sizes", p.sizes.map((s, j) => (j === i ? { ...s, stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) } : s)))
                  }
                  aria-invalid={f[`sizes.${i}.stock`] ? true : undefined}
                  className={cn(
                    "h-9 w-full rounded-sm border px-2 text-center font-mono text-sm tabular-nums",
                    size.stock === 0 ? "border-drop/50 text-drop" : "border-line-soft",
                  )}
                />
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-4">
            <Button type="button" variant="outline" size="sm" onClick={() => set("sizes", [...p.sizes, { label: "", stock: 0 }])}>
              <Plus strokeWidth={1.5} aria-hidden="true" /> tamanho
            </Button>
            <span className="font-mono text-xs text-mute-strong">
              total: {p.sizes.reduce((sum, s) => sum + s.stock, 0)} unidades
            </span>
          </div>
          {f.sizes && <p className="mt-2 text-xs text-drop">{f.sizes}</p>}
        </div>
      </Section>

      <Section title="fotos">
        <div className="sm:col-span-6">
          <p className="mb-3 text-xs text-ink-soft">A primeira foto é a capa. Use fotos sem logos de outras marcas.</p>
          {p.images.length > 0 && (
            <ul className="mb-4 flex flex-col gap-3">
              {p.images.map((img, i) => (
                <li key={`${img.src}-${i}`} className="flex flex-wrap items-center gap-3 rounded-sm border border-line-soft p-2">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-haze">
                    <Image src={img.src} alt="" fill sizes="64px" className={img.kind === "cutout" ? "object-contain" : "object-cover"} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`alt-${i}`} className="font-mono text-micro text-mute-strong">
                      descrição da foto (para leitores de tela)
                    </label>
                    <Input
                      id={`alt-${i}`}
                      value={img.alt}
                      onChange={(e) => set("images", p.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                      aria-invalid={f[`images.${i}.alt`] ? true : undefined}
                      className="h-9"
                    />
                  </div>
                  <select
                    value={img.kind}
                    aria-label="Tipo de foto"
                    onChange={(e) => set("images", p.images.map((x, j) => (j === i ? { ...x, kind: e.target.value as "photo" | "cutout" } : x)))}
                    className="h-9 cursor-pointer rounded-sm border border-line-soft bg-canvas px-2 text-xs"
                  >
                    <option value="photo">foto (preenche)</option>
                    <option value="cutout">recorte (fundo transparente)</option>
                  </select>
                  <div className="flex">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Mover para cima">
                      <ArrowUp strokeWidth={1.5} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveImage(i, 1)} disabled={i === p.images.length - 1} aria-label="Mover para baixo">
                      <ArrowDown strokeWidth={1.5} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => set("images", p.images.filter((_, j) => j !== i))} aria-label="Remover foto">
                      <Trash2 strokeWidth={1.5} />
                    </Button>
                  </div>
                  {f[`images.${i}.src`] && <p className="w-full text-xs text-drop">{f[`images.${i}.src`]}</p>}
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            id="upload"
            onChange={(e) => void upload(e.target.files)}
          />
          <Button type="button" variant="outline" loading={uploading} disabled={p.images.length >= 8} onClick={() => fileRef.current?.click()}>
            <ImagePlus strokeWidth={1.5} aria-hidden="true" /> enviar fotos
          </Button>
          {uploadError && (
            <p role="alert" className="mt-2 text-xs text-drop">
              {uploadError}
            </p>
          )}
          {f.images && <p className="mt-2 text-xs text-drop">{f.images}</p>}
        </div>
      </Section>

      <Section title="publicação">
        <label className="flex items-center gap-3 sm:col-span-6">
          <input type="checkbox" checked={p.active} onChange={(e) => set("active", e.target.checked)} className="size-5 accent-ink" />
          <span className="text-sm">visível na loja</span>
        </label>
        <Field label="selo" className="sm:col-span-2">
          {(field) => (
            <select
              {...field}
              value={p.badge ?? ""}
              onChange={(e) => set("badge", (e.target.value || null) as ProductInput["badge"])}
              className={selectClass}
            >
              <option value="">nenhum</option>
              {BADGES.filter((b) => b !== "esgotado").map((b) => (
                <option key={b} value={b}>
                  {b === "ultimas" ? "últimas unidades" : b}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="lançamento" error={f.releasedAt} hint="Ordena “novos drops”." className="sm:col-span-2">
          {(field) => <Input {...field} type="date" value={p.releasedAt} onChange={(e) => set("releasedAt", e.target.value)} />}
        </Field>
        <Field label="destaque (0–100)" hint="Maior = aparece antes em “em alta”." className="sm:col-span-2">
          {(field) => (
            <Input
              {...field}
              type="number"
              min={0}
              max={100}
              value={p.popularity}
              onChange={(e) => set("popularity", Math.min(100, Math.max(0, Math.floor(Number(e.target.value) || 0))))}
            />
          )}
        </Field>
      </Section>

      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-full border border-line bg-canvas/95 p-2 backdrop-blur-sm">
        <Button type="submit" size="lg" loading={pending}>
          {initial.id ? "salvar alterações" : "criar produto"}
        </Button>
        {p.slug && initial.id && (
          <a href={`/produto/${p.slug}`} target="_blank" rel="noreferrer" className="px-3 text-sm underline underline-offset-4">
            ver na loja
          </a>
        )}
      </div>
    </form>
  );
}
