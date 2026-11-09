"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { maskCpf, maskPhone } from "@/lib/br";
import { customerSchema, fieldErrors } from "@/lib/checkout-schema";
import { useCheckout } from "@/store/checkout";
import { TextField } from "./text-field";

export function CustomerStep() {
  const customer = useCheckout((s) => s.customer);
  const setCustomer = useCheckout((s) => s.setCustomer);
  const complete = useCheckout((s) => s.complete);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = customerSchema.safeParse(customer);
    if (!result.success) {
      const errs = fieldErrors(result.error);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    complete(1);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="e-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={customer.email}
        onChange={(e) => setCustomer({ email: e.target.value })}
        error={errors.email}
        hint="Para o recibo e o rastreio."
        fieldClassName="sm:col-span-2"
      />
      <TextField
        label="nome completo"
        name="name"
        autoComplete="name"
        value={customer.name}
        onChange={(e) => setCustomer({ name: e.target.value })}
        error={errors.name}
        fieldClassName="sm:col-span-2"
      />
      <TextField
        label="cpf"
        name="cpf"
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        value={customer.cpf}
        onChange={(e) => setCustomer({ cpf: maskCpf(e.target.value) })}
        error={errors.cpf}
        hint="Obrigatório para a nota fiscal."
      />
      <TextField
        label="celular"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(11) 91234-5678"
        value={customer.phone}
        onChange={(e) => setCustomer({ phone: maskPhone(e.target.value) })}
        error={errors.phone}
      />
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          continuar para entrega
        </Button>
      </div>
    </form>
  );
}
