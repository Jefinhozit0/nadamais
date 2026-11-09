import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/auth-forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/server/auth";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false, follow: false } };

async function Form({ searchParams }: { searchParams: PageProps<"/cadastro">["searchParams"] }) {
  const sp = await searchParams;
  return <SignUpForm next={safeNext(sp.next)} />;
}

export default function SignUpPage({ searchParams }: PageProps<"/cadastro">) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-[clamp(2.75rem,7vw,5rem)] leading-[0.9] font-semibold tracking-[-0.035em]">
        <span className="text-grain">criar conta</span>
      </h1>
      <p className="-mt-4 max-w-[40ch] text-sm text-ink-soft">
        Um minuto. Depois disso, checkout mais rápido e todos os pedidos num lugar só.
      </p>
      {isSupabaseConfigured() ? (
        <Suspense fallback={<div className="h-80 animate-pulse rounded-card bg-haze" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      ) : (
        <p className="rounded-card border border-dashed border-line-soft px-4 py-3 text-sm text-ink-soft">
          Cadastro indisponível: o Supabase ainda não foi configurado (veja o README).
        </p>
      )}
    </div>
  );
}
