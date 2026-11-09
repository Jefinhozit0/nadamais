"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { maskCep } from "@/lib/format";
import { UFS } from "@/lib/br";
import { addressSchema, fieldErrors } from "@/lib/checkout-schema";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toAddressDraft, useCheckout, type AddressDraft } from "@/store/checkout";
import { useQuote } from "./quote-context";
import { TextField } from "./text-field";

type SavedAddress = AddressDraft & { id: string; label: string; isDefault: boolean };

export function DeliveryStep({ savedAddresses = [] }: { savedAddresses?: SavedAddress[] }) {
  const address = useCheckout((s) => s.address);
  const setAddress = useCheckout((s) => s.setAddress);
  const shippingMethod = useCheckout((s) => s.shippingMethod);
  const setShippingMethod = useCheckout((s) => s.setShippingMethod);
  const complete = useCheckout((s) => s.complete);
  const { quote, options, loading, error, cep: quotedCep } = useQuote();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const numberRef = useRef<HTMLInputElement>(null);
  const digits = address.cep.replace(/\D/g, "");

  // cota quando o CEP fica completo (e na volta para esta etapa)
  useEffect(() => {
    if (digits.length !== 8 || digits === quotedCep) return;
    let cancelled = false;
    void quote(digits).then((found) => {
      if (cancelled || !found) return;
      setAddress({
        street: found.street || address.street,
        district: found.district || address.district,
        city: found.city || address.city,
        state: found.state || address.state,
      });
      if (found.street) numberRef.current?.focus();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage ao CEP
  }, [digits]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addressSchema.safeParse(address);
    const errs = result.success ? {} : fieldErrors(result.error);
    if (options.length === 0) errs.shipping = errs.shipping ?? "Informe o CEP para calcular o frete.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = Object.keys(errs)[0];
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    complete(2);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-6">
      {savedAddresses.length > 0 && (
        <fieldset className="sm:col-span-6">
          <legend className="mb-3 text-sm">endereços salvos</legend>
          <div className="flex flex-wrap gap-2">
            {savedAddresses.map((saved) => {
              const selected = saved.cep === address.cep.replace(/\D/g, "") && saved.number === address.number;
              return (
                <button
                  key={saved.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    const fields = toAddressDraft(saved);
                    setAddress({ ...fields, cep: maskCep(fields.cep) });
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-start rounded-card border px-4 py-3 text-left text-xs transition-colors",
                    selected ? "border-ink" : "border-line-soft hover:border-ink-soft",
                  )}
                >
                  <span className="font-mono">{saved.label}</span>
                  <span className="text-ink-soft">
                    {saved.street}, {saved.number} — {saved.city}/{saved.state}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <TextField
        label="cep"
        name="cep"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
        maxLength={9}
        value={address.cep}
        onChange={(e) => setAddress({ cep: maskCep(e.target.value) })}
        error={errors.cep ?? error}
        hint={loading ? "buscando endereço e frete…" : undefined}
        fieldClassName="sm:col-span-2"
      />
      <div className="flex items-end pb-2 sm:col-span-4">
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noreferrer"
          className="text-xs underline underline-offset-4"
        >
          não sei meu cep
        </a>
      </div>

      <TextField
        label="rua"
        name="street"
        autoComplete="address-line1"
        value={address.street}
        onChange={(e) => setAddress({ street: e.target.value })}
        error={errors.street}
        fieldClassName="sm:col-span-4"
      />
      <Field label="número" error={errors.number} className="sm:col-span-2">
        {(field) => (
          <Input
            {...field}
            ref={numberRef}
            name="number"
            inputMode="numeric"
            value={address.number}
            onChange={(e) => setAddress({ number: e.target.value })}
          />
        )}
      </Field>
      <TextField
        label="complemento (opcional)"
        name="complement"
        autoComplete="address-line2"
        value={address.complement}
        onChange={(e) => setAddress({ complement: e.target.value })}
        fieldClassName="sm:col-span-3"
      />
      <TextField
        label="bairro"
        name="district"
        value={address.district}
        onChange={(e) => setAddress({ district: e.target.value })}
        error={errors.district}
        fieldClassName="sm:col-span-3"
      />
      <TextField
        label="cidade"
        name="city"
        autoComplete="address-level2"
        value={address.city}
        onChange={(e) => setAddress({ city: e.target.value })}
        error={errors.city}
        fieldClassName="sm:col-span-4"
      />
      <Field label="uf" error={errors.state} className="sm:col-span-2">
        {(field) => (
          <select
            {...field}
            name="state"
            autoComplete="address-level1"
            value={address.state}
            onChange={(e) => setAddress({ state: e.target.value })}
            className="h-11 w-full cursor-pointer rounded-sm border border-line-soft bg-canvas px-3 text-base hover:border-ink-soft md:text-sm aria-invalid:border-drop"
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

      <fieldset className="sm:col-span-6" aria-describedby={errors.shipping ? "ship-err" : undefined}>
        <legend className="mb-3 text-sm">entrega</legend>
        {options.length === 0 ? (
          <p id="ship-err" className={cn("text-xs", errors.shipping ? "text-drop" : "text-mute-strong")}>
            {errors.shipping ?? "Digite o CEP para ver prazos e valores."}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => (
              <label
                key={option.method}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-card border p-4 transition-colors",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                  shippingMethod === option.method ? "border-ink" : "border-line-soft hover:border-ink-soft",
                )}
              >
                <input
                  type="radio"
                  name="shipping"
                  value={option.method}
                  checked={shippingMethod === option.method}
                  onChange={() => setShippingMethod(option.method)}
                  className="size-4 accent-ink"
                />
                <span className="flex-1">
                  <span className="block text-sm">{option.label}</span>
                  <span className="block font-mono text-micro text-mute-strong">
                    até {option.days} {option.days === 1 ? "dia útil" : "dias úteis"}
                  </span>
                </span>
                <span className={cn("font-mono text-sm tabular-nums", option.price === 0 && "text-success")}>
                  {option.price === 0 ? "grátis" : formatBRL(option.price)}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="sm:col-span-6">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
          continuar para pagamento
        </Button>
      </div>
    </form>
  );
}
