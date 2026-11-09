"use client";

import { useActionState, useState } from "react";
import { updateProfile, type FormState } from "@/app/conta/actions";
import { TextField } from "@/components/checkout/text-field";
import { Button } from "@/components/ui/button";
import { maskCpf, maskPhone } from "@/lib/br";

export function ProfileForm({ initial }: { initial: { name: string; email: string; cpf: string; phone: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const [cpf, setCpf] = useState(maskCpf(initial.cpf));
  const [phone, setPhone] = useState(maskPhone(initial.phone));
  const f = state.fields ?? {};

  return (
    <form action={action} noValidate className="grid max-w-xl gap-4 sm:grid-cols-2">
      <TextField label="nome" name="name" autoComplete="name" defaultValue={initial.name} error={f.name} fieldClassName="sm:col-span-2" />
      <TextField
        label="e-mail"
        name="email"
        value={initial.email}
        readOnly
        disabled
        hint="O e-mail é o login da conta."
        fieldClassName="sm:col-span-2"
      />
      <TextField
        label="cpf"
        name="cpf"
        inputMode="numeric"
        value={cpf}
        onChange={(e) => setCpf(maskCpf(e.target.value))}
        error={f.cpf}
        hint="Agiliza o checkout."
      />
      <TextField
        label="celular"
        name="phone"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(maskPhone(e.target.value))}
        error={f.phone}
      />
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" loading={pending}>
          salvar
        </Button>
        <p role="status" className="text-sm text-success">
          {state.ok ? "Dados salvos." : ""}
        </p>
        {state.error && (
          <p role="alert" className="text-sm text-drop">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
