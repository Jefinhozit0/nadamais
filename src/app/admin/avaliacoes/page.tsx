import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ManualReviewForm } from "@/components/admin/manual-review-form";
import { SourceTag } from "@/components/reviews/reviews-section";
import { Stars, starsLabel } from "@/components/reviews/stars";
import { Button } from "@/components/ui/button";
import { fitLabels } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import { deleteManualReview, setReviewHidden } from "@/app/admin/actions";
import { requireAdmin } from "@/server/admin";
import { listAdminReviews, listReviewableProducts } from "@/server/reviews";

export const metadata: Metadata = { title: "Avaliações" };

const tabs = [
  { value: undefined, label: "todas" },
  { value: "publicadas", label: "publicadas" },
  { value: "ocultas", label: "ocultas" },
  { value: "mensagem", label: "por mensagem" },
] as const;

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Sao_Paulo" });

async function Reviews({ searchParams }: { searchParams: PageProps<"/admin/avaliacoes">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = tabs.find((t) => t.value && t.value === sp.filtro)?.value;
  const all = await listAdminReviews({ hidden: tab === "ocultas" ? true : tab === "publicadas" ? false : undefined });
  const rows = tab === "mensagem" ? all.filter((r) => r.source === "mensagem") : all;

  return (
    <>
      <nav aria-label="Filtrar avaliações">
        <ul className="flex gap-1">
          {tabs.map((t) => (
            <li key={t.label}>
              <Link
                href={t.value ? `/admin/avaliacoes?filtro=${t.value}` : "/admin/avaliacoes"}
                aria-current={t.value === tab ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-xs transition-colors",
                  t.value === tab ? "bg-ink text-canvas" : "border border-line-soft hover:border-ink",
                )}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">Nenhuma avaliação aqui. Elas chegam quando clientes com pedido entregue avaliam.</p>
      ) : (
        <ul className="mt-6 flex flex-col">
          {rows.map((r) => (
            <li key={r.id} className={cn("grid gap-3 border-t border-line-soft py-5 last:border-b md:grid-cols-[1fr_auto]", r.hidden && "opacity-60")}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-mute-strong">
                  <Stars value={r.rating} label={starsLabel(r.rating)} />
                  <span>{dateFmt.format(new Date(r.createdAt))}</span>
                  <Link href={`/produto/${r.product.slug}#avaliacoes`} className="lowercase text-ink underline-offset-4 hover:underline">
                    {r.product.name}
                  </Link>
                  <SourceTag source={r.source} />
                  {r.hidden && <span className="text-drop">oculta</span>}
                </p>
                {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
                <p className="mt-1 max-w-[80ch] text-sm whitespace-pre-line text-ink-soft">{r.body}</p>
                <p className="mt-2 font-mono text-micro text-mute-strong">
                  {r.authorName}
                  {r.email && ` · ${r.email}`}
                  {r.city && ` · ${r.city}`}
                  {r.size && ` · tam ${r.size}`}
                  {r.fit && ` · ${fitLabels[r.fit]}`}
                  {r.orderId && (
                    <>
                      {" · "}
                      <Link href={`/admin/pedidos/${r.orderId}`} className="underline underline-offset-4">
                        pedido
                      </Link>
                    </>
                  )}
                </p>
                {r.source === "mensagem" && (
                  <p className="mt-1 font-mono text-micro text-mute-strong">
                    autorização: {r.consentNote} · cadastrado por {r.importedBy ?? "—"}
                  </p>
                )}
              </div>
              <div className="flex gap-2 self-start">
                <form action={setReviewHidden}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="hidden" value={String(!r.hidden)} />
                  <Button type="submit" size="sm" variant="outline">
                    {r.hidden ? "publicar" : "ocultar"}
                  </Button>
                </form>
                {r.source === "mensagem" && (
                  <form action={deleteManualReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      excluir
                    </Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

async function NewManualReview() {
  await requireAdmin();
  const products = await listReviewableProducts();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return (
    <details className="group mb-10 border-y border-line-soft py-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-sm font-medium [&::-webkit-details-marker]:hidden">
        cadastrar depoimento recebido por mensagem
        <span aria-hidden="true" className="font-mono text-mute-strong group-open:rotate-45 transition-transform">
          +
        </span>
      </summary>
      <p className="mt-2 mb-5 max-w-[65ch] text-sm text-ink-soft">
        Para depoimentos que clientes mandaram por WhatsApp, Instagram ou e-mail. Aparecem com o selo “recebida por
        mensagem” e a data em que chegaram, e não entram nas estrelas do Google. Copie o texto como o cliente escreveu
        e guarde o print da autorização.
      </p>
      <ManualReviewForm
        today={today}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          colorway: p.colorway,
          oneSize: p.sizeSystem === "one_size",
          sizes: p.sizes.map((s) => s.label),
        }))}
      />
    </details>
  );
}

export default function AdminReviewsPage({ searchParams }: PageProps<"/admin/avaliacoes">) {
  return (
    <section aria-labelledby="avaliacoes-admin-title">
      <h1 id="avaliacoes-admin-title" className="mb-2 font-display text-2xl font-medium">
        avaliações
      </h1>
      <p className="mb-6 max-w-[60ch] text-sm text-ink-soft">
        Oculte só o que fere as regras (ofensa, dados pessoais, spam ou outro produto). Esconder avaliação negativa
        legítima é proibido pelo Código de Defesa do Consumidor.
      </p>
      <Suspense fallback={<div className="h-14 animate-pulse rounded-card bg-haze" />}>
        <NewManualReview />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-haze" />}>
        <Reviews searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
