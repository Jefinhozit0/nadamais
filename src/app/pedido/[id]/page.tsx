import { Check, Clock, X } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CopyButton } from "@/components/order/copy-button";
import { StatusWatcher } from "@/components/order/status-watcher";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getOrder, type Order, type OrderStatus } from "@/server/orders";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

const statusCopy: Record<OrderStatus, { title: string; text: string; tone: "ok" | "wait" | "bad" }> = {
  aguardando_pagamento: { title: "Falta só pagar.", text: "Seu pedido está reservado. Assim que o pagamento cair, a gente separa.", tone: "wait" },
  pago: { title: "Pedido confirmado.", text: "Pagamento aprovado. Você vai receber o código de rastreio por e-mail.", tone: "ok" },
  recusado: { title: "Pagamento recusado.", text: "Nada foi cobrado. Volte à sacola e tente outro meio de pagamento.", tone: "bad" },
  cancelado: { title: "Pedido cancelado.", text: "Nenhuma cobrança foi feita. Se foi engano, é só montar a sacola de novo.", tone: "bad" },
  em_separacao: { title: "Em separação.", text: "Estamos conferindo cada item antes de despachar.", tone: "ok" },
  enviado: { title: "A caminho.", text: "Seu pedido saiu daqui. Acompanhe pelo código de rastreio.", tone: "ok" },
  entregue: { title: "Entregue.", text: "Bom uso. Qualquer coisa, a troca é por nossa conta na primeira vez.", tone: "ok" },
};

function PaymentBlock({ order }: { order: Order }) {
  const { payment } = order;
  if (order.status !== "aguardando_pagamento") return null;

  if (payment.method === "pix" && payment.pix) {
    return (
      <div className="flex flex-col gap-4 rounded-card border border-line p-5 sm:flex-row sm:items-center">
        <div className="flex size-44 shrink-0 items-center justify-center rounded-sm border border-line-soft bg-white">
          {payment.pix.qrCodeBase64 ? (
            <Image
              src={`data:image/png;base64,${payment.pix.qrCodeBase64}`}
              alt="QR code do Pix"
              width={164}
              height={164}
              unoptimized
            />
          ) : (
            <span className="px-4 text-center font-mono text-micro text-black/70">QR code aparece aqui com o Mercado Pago configurado</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-sm">
            Abra o app do banco, escolha <strong className="font-medium">Pix › copia e cola</strong> e cole o código.
          </p>
          <code className="block max-h-20 overflow-y-auto rounded-sm bg-haze px-3 py-2 font-mono text-micro break-all">
            {payment.pix.qrCode}
          </code>
          <CopyButton value={payment.pix.qrCode} label="copiar código pix" />
        </div>
      </div>
    );
  }

  if (payment.method === "boleto" && payment.boleto) {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-line p-5">
        {payment.boleto.barcode && (
          <code className="block rounded-sm bg-haze px-3 py-2 font-mono text-xs break-all">{payment.boleto.barcode}</code>
        )}
        <div className="flex flex-wrap gap-2">
          {payment.boleto.barcode && <CopyButton value={payment.boleto.barcode} label="copiar linha digitável" />}
          {payment.boleto.url !== "#demo" && (
            <a href={payment.boleto.url} target="_blank" rel="noreferrer" className={buttonVariants()}>
              abrir boleto
            </a>
          )}
        </div>
      </div>
    );
  }

  return null;
}

async function OrderView({ params }: { params: PageProps<"/pedido/[id]">["params"] }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const copy = statusCopy[order.status];
  const Icon = copy.tone === "ok" ? Check : copy.tone === "wait" ? Clock : X;
  const demo = order.payment.provider === "demo" && process.env.NODE_ENV !== "production";

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <div>
          <p className="font-mono text-xs text-mute-strong">pedido nº {order.number}</p>
          <h1 className="mt-3 flex items-center gap-4 font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.95] font-semibold tracking-[-0.03em]">
            <span
              className={cn(
                "inline-flex size-12 shrink-0 items-center justify-center rounded-full border",
                copy.tone === "ok" && "border-success text-success",
                copy.tone === "wait" && "border-ink",
                copy.tone === "bad" && "border-drop text-drop",
              )}
            >
              <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
            </span>
            {copy.title}
          </h1>
          <p className="mt-3 max-w-[50ch] text-ink-soft">{copy.text}</p>
        </div>

        <PaymentBlock order={order} />
        {order.trackingCode && (
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-line p-5">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-micro text-mute-strong">código de rastreio</p>
              <p className="mt-1 font-mono text-lg tracking-wide">{order.trackingCode}</p>
            </div>
            <CopyButton value={order.trackingCode} label="copiar código" />
            <a
              href={`https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(order.trackingCode)}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              rastrear
            </a>
          </div>
        )}
        {order.status === "aguardando_pagamento" && <StatusWatcher orderId={order.id} demo={demo} />}

        <div className="grid gap-6 border-t border-line-soft pt-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-medium">entrega</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {order.customer.name}
              <br />
              {order.address.street}, {order.address.number}
              {order.address.complement && ` · ${order.address.complement}`}
              <br />
              {order.address.district} — {order.address.city}/{order.address.state}
              <br />
              <span className="font-mono text-xs">
                {order.shipping.label} · até {order.shipping.days} dias úteis após a aprovação
              </span>
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium">contato</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {order.customer.email}
              <br />
              recibo e rastreio vão para este e-mail
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/catalogo" className={buttonVariants({ variant: "outline" })}>
            continuar comprando
          </Link>
        </div>
      </div>

      <aside className="self-start rounded-card border border-line p-5 lg:col-span-5">
        <h2 className="font-display text-lg font-medium">itens</h2>
        <ul className="mt-4 flex flex-col">
          {order.lines.map((line) => (
            <li key={`${line.productId}-${line.size}`} className="flex gap-3 border-b border-line-soft py-3 last:border-b-0">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-sm border border-line-soft bg-haze">
                {line.image && <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-micro text-mute-strong">linha {line.line}</span>
                <span className="block truncate text-sm lowercase">{line.name}</span>
                <span className="block font-mono text-xs text-mute-strong">
                  tam {line.size} · {line.quantity}×
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums">{formatBRL(line.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 border-t border-line-soft pt-4 font-mono text-sm tabular-nums">
          <dt className="font-sans">subtotal</dt>
          <dd>{formatBRL(order.totals.subtotal)}</dd>
          <dt className="font-sans">frete</dt>
          <dd>{order.totals.shipping === 0 ? "grátis" : formatBRL(order.totals.shipping)}</dd>
          {order.totals.discount > 0 && (
            <>
              <dt className="font-sans text-success">desconto pix ({Math.round(siteConfig.pixDiscount * 100)}%)</dt>
              <dd className="text-success">−{formatBRL(order.totals.discount)}</dd>
            </>
          )}
          <dt className="border-t border-line-soft pt-3 font-sans font-medium">total</dt>
          <dd className="border-t border-line-soft pt-3 text-lg">{formatBRL(order.totals.total)}</dd>
        </dl>
        <p className="mt-3 font-mono text-micro text-mute-strong">
          {order.payment.method === "pix" ? "pix" : order.payment.method === "boleto" ? "boleto" : `cartão${order.payment.card?.installments ? ` · ${order.payment.card.installments}x` : ""}`}
          {order.payment.provider === "demo" && " · demonstração"}
        </p>
      </aside>
    </div>
  );
}

export default function OrderPage({ params }: PageProps<"/pedido/[id]">) {
  return (
    <div className="px-4 pt-8 md:px-8 md:pt-12">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-haze" aria-label="Carregando pedido" />}>
        <OrderView params={params} />
      </Suspense>
    </div>
  );
}
