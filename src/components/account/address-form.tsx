"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addAddress, type FormState } from "@/app/conta/actions";
import { TextField } from "@/components/checkout/text-field";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { UFS } from "@/lib/br";
import { maskCep } from "@/lib/format";

/** Novo endereço, com preenchimento pelo CEP (ViaCEP). */
export function AddressForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addAddress, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [cep, setCep] = useState("");
  const [addr, setAddr] = useState({ street: "", district: "", city: "", state: "" });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    const t = window.setTimeout(() => {
      setCep("");
      setAddr({ street: "", district: "", city: "", state: "" });
      setOpen(false);
    }, 0);
    return () => window.clearTimeout(t);
  }, [state]);

  async function lookup(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean };
      if (data.erro) return;
      setAddr({ street: data.logradouro ?? "", district: data.bairro ?? "", city: data.localidade ?? "", state: data.uf ?? "" });
    } catch {
      // sem ViaCEP: preenchimento manual
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="self-start" onClick={() => setOpen(true)}>
        adicionar endereço
      </Button>
    );
  }

  const f = state.fields ?? {};
  const v = state.values ?? {};
  return (
    <form ref={formRef} action={action} noValidate className="grid gap-4 rounded-card border border-line p-5 sm:grid-cols-6">
      {state.error && (
        <p role="alert" className="text-sm text-drop sm:col-span-6">
          {state.error}
        </p>
      )}
      <TextField label="apelido" name="label" defaultValue={v.label ?? "casa"} fieldClassName="sm:col-span-2" error={f.label} />
      <TextField label="quem recebe" name="recipient" autoComplete="name" defaultValue={v.recipient} fieldClassName="sm:col-span-4" error={f.recipient} />
      <TextField
        label="cep"
        name="cep"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={9}
        value={cep}
        onChange={(e) => {
          const masked = maskCep(e.target.value);
          setCep(masked);
          void lookup(masked);
        }}
        fieldClassName="sm:col-span-2"
        error={f.cep}
      />
      <TextField
        label="rua"
        name="street"
        value={addr.street}
        onChange={(e) => setAddr({ ...addr, street: e.target.value })}
        fieldClassName="sm:col-span-4"
        error={f.street}
      />
      <TextField label="número" name="number" inputMode="numeric" defaultValue={v.number} fieldClassName="sm:col-span-2" error={f.number} />
      <TextField label="complemento (opcional)" name="complement" defaultValue={v.complement} fieldClassName="sm:col-span-4" />
      <TextField
        label="bairro"
        name="district"
        value={addr.district}
        onChange={(e) => setAddr({ ...addr, district: e.target.value })}
        fieldClassName="sm:col-span-2"
        error={f.district}
      />
      <TextField
        label="cidade"
        name="city"
        value={addr.city}
        onChange={(e) => setAddr({ ...addr, city: e.target.value })}
        fieldClassName="sm:col-span-3"
        error={f.city}
      />
      <Field label="uf" error={f.state} className="sm:col-span-1">
        {(field) => (
          <select
            {...field}
            name="state"
            value={addr.state}
            onChange={(e) => setAddr({ ...addr, state: e.target.value })}
            className="h-11 w-full cursor-pointer rounded-sm border border-line-soft bg-canvas px-2 text-base hover:border-ink-soft md:text-sm"
          >
            <option value="">—</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        )}
      </Field>
      <div className="flex gap-2 sm:col-span-6">
        <Button type="submit" loading={pending}>
          salvar endereço
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          cancelar
        </Button>
      </div>
    </form>
  );
}
