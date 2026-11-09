import type { Metadata } from "next";
import { Suspense } from "react";
import { AddressForm } from "@/components/account/address-form";
import { requireProfile } from "@/server/auth";
import { db } from "@/server/db";
import { deleteAddress, setDefaultAddress } from "../actions";

export const metadata: Metadata = { title: "Endereços" };

async function Addresses() {
  const profile = await requireProfile("/conta/enderecos");
  const addresses = await db.address.findMany({
    where: { profileId: profile.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      {addresses.length === 0 ? (
        <p className="text-sm text-ink-soft">Nenhum endereço salvo. Os endereços usados no checkout aparecem aqui.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-card border border-line-soft p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{a.label}</span>
                {a.isDefault && (
                  <span className="rounded-full border border-ink px-2 py-0.5 font-mono text-micro">padrão</span>
                )}
              </div>
              <p className="text-sm text-ink-soft">
                {a.recipient}
                <br />
                {a.street}, {a.number}
                {a.complement && ` · ${a.complement}`}
                <br />
                {a.district} — {a.city}/{a.state} · {a.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
              </p>
              <div className="mt-auto flex gap-4 text-xs">
                {!a.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="h-9 cursor-pointer underline underline-offset-4">
                      tornar padrão
                    </button>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="h-9 cursor-pointer text-drop underline underline-offset-4">
                    remover
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddressForm />
    </div>
  );
}

export default function AddressesPage() {
  return (
    <section aria-labelledby="enderecos-title">
      <h2 id="enderecos-title" className="mb-4 font-display text-xl font-medium">
        endereços
      </h2>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-card bg-haze" />}>
        <Addresses />
      </Suspense>
    </section>
  );
}
