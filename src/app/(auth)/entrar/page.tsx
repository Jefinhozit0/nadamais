import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/auth-forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/server/auth";

export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: false } };

async function Form({ searchParams }: { searchParams: PageProps<"/entrar">["searchParams"] }) {
  const sp = await searchParams;
  return <SignInForm next={safeNext(sp.next)} linkError={sp.erro === "link"} />;
}

export default function SignInPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-[clamp(2.75rem,7vw,5rem)] leading-[0.9] font-semibold tracking-[-0.035em]">
        <span className="text-grain">entrar</span>
      </h1>
      <p className="-mt-4 max-w-[40ch] text-sm text-ink-soft">
        Acompanhe pedidos, salve endereços e guarde o que você quer comprar depois.
      </p>
      {isSupabaseConfigured() ? (
        <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-haze" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      ) : (
        <p className="rounded-card border border-dashed border-line-soft px-4 py-3 text-sm text-ink-soft">
          Login indisponível: o Supabase ainda não foi configurado (veja o README).
        </p>
      )}
    </div>
  );
}
