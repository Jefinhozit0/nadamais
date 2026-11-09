import Link from "next/link";
import { Suspense } from "react";
import { OrderList } from "@/components/account/order-list";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/server/auth";
import { db } from "@/server/db";
import { listOrdersByProfile } from "@/server/orders";

async function Overview() {
  const profile = await requireProfile("/conta");
  const [orders, addresses, favorites] = await Promise.all([
    listOrdersByProfile(profile.id, 3),
    db.address.count({ where: { profileId: profile.id } }),
    db.wishlistItem.count({ where: { profileId: profile.id } }),
  ]);
  const firstName = profile.name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-10">
      <p className="font-display text-2xl font-medium tracking-tight">
        {firstName ? `Oi, ${firstName}.` : "Oi."}{" "}
        <span className="text-mute-strong">{profile.email}</span>
      </p>

      <dl className="grid grid-cols-3 gap-3">
        {[
          ["pedidos", orders.length === 3 ? "3+" : String(orders.length), "/conta/pedidos"],
          ["endereços", String(addresses), "/conta/enderecos"],
          ["favoritos", String(favorites), "/conta/favoritos"],
        ].map(([label, value, href]) => (
          <div key={label} className="rounded-card border border-line-soft">
            <Link href={href!} className="flex flex-col gap-1 p-4 hover:bg-haze">
              <dt className="font-mono text-micro text-mute-strong">{label}</dt>
              <dd className="font-display text-3xl font-semibold tabular-nums">{value}</dd>
            </Link>
          </div>
        ))}
      </dl>

      <section aria-labelledby="ultimos">
        <div className="flex items-baseline justify-between">
          <h2 id="ultimos" className="font-display text-xl font-medium">
            últimos pedidos
          </h2>
          {orders.length > 0 && (
            <Link href="/conta/pedidos" className="text-sm underline underline-offset-4">
              ver todos
            </Link>
          )}
        </div>
        <div className="mt-4">
          {orders.length ? (
            <OrderList orders={orders} />
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-soft p-6">
              <p className="text-sm text-ink-soft">Nenhum pedido ainda.</p>
              <Link href="/catalogo" className={buttonVariants({ variant: "outline", size: "sm" })}>
                ver catálogo
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-card bg-haze" />}>
      <Overview />
    </Suspense>
  );
}
