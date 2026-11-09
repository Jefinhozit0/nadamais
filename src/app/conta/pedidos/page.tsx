import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderList } from "@/components/account/order-list";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/server/auth";
import { listOrdersByProfile } from "@/server/orders";

export const metadata: Metadata = { title: "Pedidos" };

async function Orders() {
  const profile = await requireProfile("/conta/pedidos");
  const orders = await listOrdersByProfile(profile.id);
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-soft p-6">
        <p className="text-sm text-ink-soft">Você ainda não fez nenhum pedido com esta conta.</p>
        <Link href="/catalogo" className={buttonVariants({ variant: "outline", size: "sm" })}>
          ver catálogo
        </Link>
      </div>
    );
  }
  return <OrderList orders={orders} />;
}

export default function OrdersPage() {
  return (
    <section aria-labelledby="pedidos-title">
      <h2 id="pedidos-title" className="mb-4 font-display text-xl font-medium">
        pedidos
      </h2>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-haze" />}>
        <Orders />
      </Suspense>
    </section>
  );
}
