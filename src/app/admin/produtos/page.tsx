import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin";
import { listAdminProducts, type AdminProductFilter } from "@/server/admin-queries";

export const metadata: Metadata = { title: "Produtos" };

const statuses = [
  { value: "ativos", label: "ativos" },
  { value: "arquivados", label: "arquivados" },
  { value: "todos", label: "todos" },
] as const;

async function ProductTable({ searchParams }: { searchParams: PageProps<"/admin/produtos">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const status = (statuses.find((s) => s.value === sp.status)?.value ?? "ativos") as AdminProductFilter["status"];
  const products = await listAdminProducts({ q, status });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Form action="/admin/produtos" className="flex h-10 w-full max-w-xs items-center gap-2 rounded-full border border-line-soft px-4 focus-within:border-ink">
          <Search className="size-4 text-mute-strong" strokeWidth={1.5} aria-hidden="true" />
          <label htmlFor="admin-q" className="sr-only">
            Buscar produto
          </label>
          <input id="admin-q" name="q" defaultValue={q} placeholder="nome, sku ou slug" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          {status !== "ativos" && <input type="hidden" name="status" value={status} />}
        </Form>
        <nav aria-label="Filtrar por status" className="flex gap-1">
          {statuses.map((s) => (
            <Link
              key={s.value}
              href={`/admin/produtos?status=${s.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={status === s.value ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center rounded-full px-4 text-xs transition-colors",
                status === s.value ? "bg-ink text-canvas" : "border border-line-soft hover:border-ink",
              )}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto font-mono text-xs text-mute-strong">{products.length} produtos</span>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">Nenhum produto encontrado.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line-soft text-left font-mono text-micro text-mute-strong">
                <th scope="col" className="py-2 pr-4 font-normal">produto</th>
                <th scope="col" className="py-2 pr-4 font-normal">sku</th>
                <th scope="col" className="py-2 pr-4 font-normal">linha</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">preço</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">estoque</th>
                <th scope="col" className="py-2 font-normal">status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={cn("border-b border-line-soft", !p.active && "text-mute-strong")}>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3 hover:underline underline-offset-4">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-sm border border-line-soft bg-haze">
                        {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate lowercase">{p.name}</span>
                        <span className="block truncate text-xs text-mute-strong">{p.colorway}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 pr-4 text-xs">{p.line}</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums">{formatBRL(p.price)}</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums">
                    <span className={p.totalStock === 0 ? "text-drop" : undefined}>{p.totalStock}</span>
                    {p.lowSizes > 0 && p.totalStock > 0 && (
                      <span className="ml-2 text-micro text-drop">{p.lowSizes} tam. baixo</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-micro",
                        p.active ? "border-success text-success" : "border-line-soft",
                      )}
                    >
                      {p.active ? "ativo" : "arquivado"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/produtos">) {
  return (
    <section aria-labelledby="produtos-title">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 id="produtos-title" className="font-display text-2xl font-medium">
          produtos
        </h1>
        <Link href="/admin/produtos/novo" className={buttonVariants()}>
          <Plus strokeWidth={1.5} aria-hidden="true" /> novo produto
        </Link>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-haze" />}>
        <ProductTable searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
