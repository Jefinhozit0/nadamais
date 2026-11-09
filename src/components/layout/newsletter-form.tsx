"use client";

import { ArrowUpRight } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/** Formulário de newsletter. O envio real entra na Fase 4 (server action). */
export function NewsletterForm({ className }: { className?: string }) {
  const id = useId();
  const [sent, setSent] = useState(false);

  return (
    <form
      className={cn("flex flex-col gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Seu e-mail
      </label>
      <div className="flex h-12 items-center rounded-full border border-ink pr-1.5 pl-5 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-ink">
        <input
          id={id}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute-strong"
        />
        <button
          type="submit"
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 text-xs text-canvas transition-colors hover:bg-ink-soft"
        >
          assinar <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>
      <p role="status" className="min-h-5 font-mono text-micro text-success">
        {sent ? "pronto. você vai saber do próximo drop primeiro." : ""}
      </p>
    </form>
  );
}
