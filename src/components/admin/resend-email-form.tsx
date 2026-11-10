"use client";

import { useActionState } from "react";
import { resendOrderEmail, type EmailFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

/** kinds vem do servidor (os modelos de e-mail não entram no bundle do navegador). */
export function ResendEmailForm({ id, kinds, suggested }: { id: string; kinds: { value: string; label: string }[]; suggested?: string }) {
  const [state, action, pending] = useActionState<EmailFormState, FormData>(resendOrderEmail, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">reenviar e-mail</span>
        <select
          name="kind"
          defaultValue={suggested}
          className="h-11 w-full cursor-pointer rounded-sm border border-line-soft bg-canvas px-3 text-base hover:border-ink-soft md:text-sm"
        >
          {kinds.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" loading={pending}>
          enviar ao cliente
        </Button>
        <p role="status" className="text-sm text-success">
          {state.ok ?? ""}
        </p>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-drop">
          {state.error}
        </p>
      )}
    </form>
  );
}
