"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendMagicLink, signIn, signInWithGoogle, signUp, type AuthState } from "@/app/(auth)/actions";
import { TextField } from "@/components/checkout/text-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Feedback({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-card border border-drop bg-drop-soft px-4 py-3 text-sm text-drop">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="rounded-card border border-success px-4 py-3 text-sm">
        {state.message}
      </p>
    );
  }
  return null;
}

function GoogleButton({ next }: { next: string }) {
  if (process.env.NEXT_PUBLIC_AUTH_GOOGLE !== "on") return null;
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <Button type="submit" variant="outline" size="lg" className="w-full">
        continuar com google
      </Button>
    </form>
  );
}

export function SignInForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [passwordState, passwordAction, passwordPending] = useActionState(signIn, {});
  const [linkState, linkAction, linkPending] = useActionState(sendMagicLink, {});
  const state = mode === "password" ? passwordState : linkState;

  return (
    <div className="flex flex-col gap-6">
      {linkError && !state.error && !state.message && (
        <p role="alert" className="rounded-card border border-drop bg-drop-soft px-4 py-3 text-sm text-drop">
          Esse link expirou ou já foi usado. Peça um novo abaixo.
        </p>
      )}

      <div role="group" aria-label="Forma de entrar" className="inline-flex self-start rounded-full border border-line-soft p-1">
        {(
          [
            ["password", "e-mail e senha"],
            ["link", "link por e-mail"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "h-9 cursor-pointer rounded-full px-4 text-xs transition-colors",
              mode === value ? "bg-ink text-canvas" : "text-mute-strong hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Feedback state={state} />

      {mode === "password" ? (
        <form action={passwordAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <TextField
            label="e-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={passwordState.values?.email}
            error={passwordState.fields?.email}
          />
          <TextField
            label="senha"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={passwordState.fields?.password}
          />
          <Button type="submit" size="lg" className="w-full" loading={passwordPending}>
            entrar
          </Button>
        </form>
      ) : (
        <form action={linkAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <TextField
            label="e-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={linkState.values?.email}
            error={linkState.fields?.email}
            hint="Sem senha: mandamos um link que te loga com um clique."
          />
          <Button type="submit" size="lg" className="w-full" loading={linkPending}>
            enviar link de acesso
          </Button>
        </form>
      )}

      <GoogleButton next={next} />

      <p className="text-sm text-ink-soft">
        Primeira vez?{" "}
        <Link href={`/cadastro?next=${encodeURIComponent(next)}`} className="text-ink underline underline-offset-4">
          criar conta
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUp, {});

  return (
    <div className="flex flex-col gap-6">
      <Feedback state={state} />
      {!state.message && (
        <form action={action} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <TextField label="nome" name="name" autoComplete="name" required defaultValue={state.values?.name} error={state.fields?.name} />
          <TextField
            label="e-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.values?.email}
            error={state.fields?.email}
          />
          <TextField
            label="senha"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            error={state.fields?.password}
            hint="Mínimo de 8 caracteres, com letras e números."
          />
          <Button type="submit" size="lg" className="w-full" loading={pending}>
            criar conta
          </Button>
        </form>
      )}
      <GoogleButton next={next} />
      <p className="text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href={`/entrar?next=${encodeURIComponent(next)}`} className="text-ink underline underline-offset-4">
          entrar
        </Link>
      </p>
    </div>
  );
}
