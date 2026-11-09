import { Search } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin";
import { listAdminOrders } from "@/server/admin-queries";
import type { OrderStatus } from "@/server/orders";

export const metadata: Metadata = { title: "Pedidos" };

const tabs: { value?: OrderStatus; label: string }[] = [
  { label: "todos" },
  { value: "aguardando_pagamento", label: "aguardando" },
  { value: "pago", label: "pagos" },
  { value: "em_separacao", label: "em separação" },
  { value: "enviado", label: "enviados" },
  { value: "entregue", label: "entregues" },
  { value: "cancelado", label: "cancelados" },
  { value: "recusado", label: "recusados" },
];

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

async function Orders({ searchParams }: { searchParams: PageProps<"/admin/pedidos">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const status = tabs.find((t) => t.value && t.value === sp.status)?.value;
  const { rows, counts } = await listAdminOrders({ q, status });
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <>
      <nav aria-label="Filtrar por status" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex gap-1">
          {tabs.map((t) => {
            const active = t.value === status;
            const count = t.value ? (counts[t.value] ?? 0) : total;
            const href = `/admin/pedidos${t.value ? `?status=${t.value}` : ""}${q ? `${t.value ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`;
            return (
              <li key={t.label} className="shrink-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs transition-colors",
                    active ? "bg-ink text-canvas" : "border border-line-soft hover:border-ink",
                  )}
                >
                  {t.label}
                  <span className="font-mono tabular-nums opacity-70">{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Form action="/admin/pedidos" className="mt-4 flex h-10 w-full max-w-sm items-center gap-2 rounded-full border border-line-soft px-4 focus-within:border-ink">
        <Search className="size-4 text-mute-strong" strokeWidth={1.5} aria-hidden="true" />
        <label htmlFor="pedido-q" className="sr-only">
          Buscar pedido
        </label>
        <input id="pedido-q" name="q" defaultValue={q} placeholder="nº, nome ou e-mail" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        {status && <input type="hidden" name="status" value={status} />}
      </Form>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">Nenhum pedido aqui.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line-soft text-left font-mono text-micro text-mute-strong">
                <th scope="col" className="py-2 pr-4 font-normal">nº</th>
                <th scope="col" className="py-2 pr-4 font-normal">data</th>
                <th scope="col" className="py-2 pr-4 font-normal">cliente</th>
                <th scope="col" className="py-2 pr-4 font-normal">itens</th>
                <th scope="col" className="py-2 pr-4 font-normal">pagamento</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">total</th>
                <th scope="col" className="py-2 font-normal">status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-line-soft">
                  <td className="py-3 pr-4 font-mono">
                    <Link href={`/admin/pedidos/${o.id}`} className="underline-offset-4 hover:underline">
                      {o.number}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{dateFmt.format(o.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className="block">{o.customerName}</span>
                    <span className="block text-xs text-mute-strong">{o.customerEmail}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{o._count.items}</td>
                  <td className="py-3 pr-4 text-xs">
                    {o.paymentMethod === "card" ? "cartão" : o.paymentMethod}
                    {o.paymentProvider === "demo" && <span className="text-mute-strong"> · demo</span>}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums">{formatBRL(o.total)}</td>
                  <td className="py-3">
                    <OrderStatusBadge status={o.status} />
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

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  return (
    <section aria-labelledby="pedidos-admin-title">
      <h1 id="pedidos-admin-title" className="mb-6 font-display text-2xl font-medium">
        pedidos
      </h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-haze" />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
