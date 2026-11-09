import Link from "next/link";
import { OrderList } from "@/components/account/order-list";
import { formatBRL } from "@/lib/format";
import { requireAdmin } from "@/server/admin";
import { getDashboard } from "@/server/admin-queries";

export default async function AdminHome() {
  await requireAdmin();
  const d = await getDashboard();

  const stats: { label: string; value: string; href?: string; tone?: "alert" }[] = [
    { label: "pedidos hoje", value: String(d.ordersToday), href: "/admin/pedidos" },
    { label: "aguardando pagamento", value: String(d.awaiting), href: "/admin/pedidos?status=aguardando_pagamento" },
    { label: "para separar/enviar", value: String(d.toShip), href: "/admin/pedidos?status=pago", tone: d.toShip ? "alert" : undefined },
    { label: `receita do mês · ${d.monthPaidOrders} pedidos`, value: formatBRL(d.monthRevenue) },
  ];

  return (
    <div className="flex flex-col gap-12">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <dt className="font-mono text-micro text-mute-strong">{s.label}</dt>
              <dd className={`mt-2 font-display text-3xl font-semibold tabular-nums ${s.tone === "alert" ? "text-drop" : ""}`}>
                {s.value}
              </dd>
            </>
          );
          return (
            <div key={s.label} className="rounded-card border border-line-soft">
              {s.href ? (
                <Link href={s.href} className="block p-4 hover:bg-haze">
                  {body}
                </Link>
              ) : (
                <div className="p-4">{body}</div>
              )}
            </div>
          );
        })}
      </dl>

      <div className="grid gap-10 lg:grid-cols-12">
        <section aria-labelledby="recentes" className="lg:col-span-8">
          <div className="flex items-baseline justify-between">
            <h2 id="recentes" className="font-display text-xl font-medium">
              pedidos recentes
            </h2>
            <Link href="/admin/pedidos" className="text-sm underline underline-offset-4">
              todos
            </Link>
          </div>
          <div className="mt-4">
            {d.recent.length ? (
              <OrderList orders={d.recent} hrefFor={(o) => `/admin/pedidos/${o.id}`} />
            ) : (
              <p className="text-sm text-ink-soft">Nenhum pedido ainda.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="estoque-baixo" className="lg:col-span-4">
          <h2 id="estoque-baixo" className="font-display text-xl font-medium">
            estoque baixo
          </h2>
          {d.lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Tudo abastecido.</p>
          ) : (
            <ul className="mt-4 flex flex-col">
              {d.lowStock.map((s) => (
                <li key={s.id} className="border-t border-line-soft last:border-b">
                  <Link
                    href={`/admin/produtos/${s.product.id}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm hover:underline underline-offset-4"
                  >
                    <span className="min-w-0 truncate lowercase">
                      {s.product.name} <span className="text-mute-strong">· {s.product.colorway}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs">
                      tam {s.label} ·{" "}
                      <span className={s.stock === 0 ? "text-drop" : undefined}>{s.stock === 0 ? "esgotado" : `${s.stock} un`}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
