import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { ProfileForm } from "@/components/account/profile-form";
import { requireProfile } from "@/server/auth";

export const metadata: Metadata = { title: "Meus dados" };

async function Data() {
  const profile = await requireProfile("/conta/dados");
  return (
    <ProfileForm
      initial={{ name: profile.name ?? "", email: profile.email, cpf: profile.cpf ?? "", phone: profile.phone ?? "" }}
    />
  );
}

export default function DataPage() {
  return (
    <section aria-labelledby="dados-title" className="flex flex-col gap-10">
      <div>
        <h2 id="dados-title" className="mb-4 font-display text-xl font-medium">
          meus dados
        </h2>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-haze" />}>
          <Data />
        </Suspense>
      </div>
      <form action={signOut} className="border-t border-line-soft pt-6 lg:hidden">
        <button type="submit" className="h-10 cursor-pointer text-sm underline underline-offset-4">
          sair da conta
        </button>
      </form>
    </section>
  );
}
