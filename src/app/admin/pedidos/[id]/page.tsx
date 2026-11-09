import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { allowedTransitions } from "@/app/admin/actions";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { formatBRL } from "@/lib/format";
import { requireAdmin } from "@/server/admin";
import { getOrder } from "@/server/orders";

export const metadata: Metadata = { title: "Pedido" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const cpfFmt = (v: string) => v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
const phoneFmt = (v: string) => v.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");

async function OrderDetail({ params }: { params: PageProps<"/admin/pedidos/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const allowed = await allowedTransitions(order.status);
  const a = order.address;

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="flex flex-col gap-8 lg:col-span-7">
        <div>
          <p className="font-mono text-xs text-mute-strong">{dateFmt.format(new Date(order.createdAt))}</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-3xl font-semibold">
            pedido {order.number} <OrderStatusBadge status={order.status} />
          </h1>
        </div>

        <section aria-labelledby="itens-admin">
          <h2 id="itens-admin" className="mb-3 text-sm font-medium">
            itens
          </h2>
          <ul className="flex flex-col">
            {order.lines.map((l) => (
              <li key={`${l.productId}-${l.size}`} className="flex items-center gap-3 border-t border-line-soft py-3 last:border-b">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-sm border border-line-soft bg-haze">
                  {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm lowercase">{l.name}</span>
                  <span className="block font-mono text-xs text-mute-strong">
                    tam {l.size} · {l.quantity}× {formatBRL(l.unitPrice)}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums">{formatBRL(l.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-y-1.5 font-mono text-sm tabular-nums">
            <dt className="font-sans">subtotal</dt>
            <dd>{formatBRL(order.totals.subtotal)}</dd>
            <dt className="font-sans">frete ({order.shipping.label})</dt>
            <dd>{order.totals.shipping === 0 ? "grátis" : formatBRL(order.totals.shipping)}</dd>
            {order.totals.discount > 0 && (
              <>
                <dt className="font-sans">desconto pix</dt>
                <dd>−{formatBRL(order.totals.discount)}</dd>
              </>
            )}
            <dt className="border-t border-line-soft pt-2 font-sans font-medium">total</dt>
            <dd className="border-t border-line-soft pt-2">{formatBRL(order.totals.total)}</dd>
          </dl>
        </section>

        <div className="grid gap-6 border-t border-line-soft pt-6 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-medium">cliente</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {order.customer.name}
              <br />
              {order.customer.email}
              <br />
              CPF {cpfFmt(order.customer.cpf)} · {phoneFmt(order.customer.phone)}
              <br />
              <span className="font-mono text-xs">{order.profileId ? "cliente com conta" : "compra sem conta"}</span>
            </p>
          </section>
          <section>
            <h2 className="text-sm font-medium">entrega</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {a.street}, {a.number}
              {a.complement && ` · ${a.complement}`}
              <br />
              {a.district} — {a.city}/{a.state}
              <br />
              CEP {a.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
              <br />
              <span className="font-mono text-xs">
                {order.shipping.label} · até {order.shipping.days} dias úteis
              </span>
            </p>
          </section>
          <section className="sm:col-span-2">
            <h2 className="text-sm font-medium">pagamento</h2>
            <p className="mt-2 font-mono text-xs text-ink-soft">
              {order.payment.method === "card" ? "cartão" : order.payment.method} · {order.payment.provider}
              {order.payment.card?.installments ? ` · ${order.payment.card.installments}x` : ""}
              {order.payment.providerPaymentId && ` · id ${order.payment.providerPaymentId}`}
              {order.payment.providerStatus && ` · ${order.payment.providerStatus}`}
              {order.payment.statusDetail && ` (${order.payment.statusDetail})`}
            </p>
          </section>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <OrderStatusForm id={order.id} status={order.status} allowed={allowed} trackingCode={order.trackingCode} />
          <Link href={`/pedido/${order.id}`} target="_blank" className="mt-3 inline-block text-xs underline underline-offset-4">
            ver como o cliente vê
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  return (
    <section>
      <Link href="/admin/pedidos" className="font-mono text-xs text-mute-strong hover:text-ink">
        ← pedidos
      </Link>
      <div className="mt-4">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-haze" />}>
          <OrderDetail params={params} />
        </Suspense>
      </div>
    </section>
  );
}
