import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import type { Order } from "@/server/orders";
import { OrderStatusBadge } from "./order-status-badge";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul className="flex flex-col">
      {orders.map((order) => (
        <li key={order.id} className="border-t border-line-soft last:border-b">
          <Link href={`/pedido/${order.id}`} className="group/order flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
            <span className="flex -space-x-3">
              {order.lines.slice(0, 3).map((line) => (
                <span
                  key={`${line.productId}-${line.size}`}
                  className="relative size-12 overflow-hidden rounded-sm border border-line-soft bg-haze"
                >
                  {line.image && <Image src={line.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-xs text-mute-strong">
                nº {order.number} · {dateFmt.format(new Date(order.createdAt))}
              </span>
              <span className="block truncate text-sm lowercase">
                {order.lines.map((l) => l.name).join(", ")}
              </span>
            </span>
            <OrderStatusBadge status={order.status} />
            <span className="font-mono text-sm tabular-nums">{formatBRL(order.totals.total)}</span>
            <ArrowUpRight className="size-4 transition-transform group-hover/order:translate-x-0.5" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
