import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Checkout, type CheckoutAccount } from "@/components/checkout/checkout";
import { getProfile } from "@/server/auth";
import { hasDatabase } from "@/server/catalog-source";
import { db } from "@/server/db";
import { isMercadoPagoConfigured } from "@/server/mercadopago";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

async function loadAccount(): Promise<CheckoutAccount | undefined> {
  await connection();
  if (!hasDatabase()) return undefined;
  const profile = await getProfile();
  if (!profile) return undefined;
  const addresses = await db.address.findMany({
    where: { profileId: profile.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return {
    email: profile.email,
    name: profile.name ?? "",
    cpf: profile.cpf ?? "",
    phone: profile.phone ?? "",
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label,
      isDefault: a.isDefault,
      cep: a.cep,
      street: a.street,
      number: a.number,
      complement: a.complement,
      district: a.district,
      city: a.city,
      state: a.state,
    })),
  };
}

async function CheckoutWithAccount() {
  const account = await loadAccount();
  return (
    <>
      {!account && hasDatabase() && (
        <p className="mb-6 text-sm text-ink-soft">
          Tem conta?{" "}
          <Link href="/entrar?next=/checkout" className="text-ink underline underline-offset-4">
            entre
          </Link>{" "}
          para usar seus dados e endereços salvos.
        </p>
      )}
      <Checkout live={isMercadoPagoConfigured()} publicKey={process.env.NEXT_PUBLIC_MP_PUBLIC_KEY} account={account} />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <div className="px-4 pt-8 pb-8 md:px-8 md:pt-12">
      <h1 className="mb-8 font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.92] font-semibold tracking-[-0.035em]">
        <span className="text-grain">finalizar compra</span>
      </h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-haze" aria-label="Carregando checkout" />}>
        <CheckoutWithAccount />
      </Suspense>
    </div>
  );
}
