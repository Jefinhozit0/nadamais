"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { createManualReview, type ManualReviewState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { displayName, fitLabels, REVIEW_BODY_MAX, type ReviewFit } from "@/lib/reviews";
import { cn } from "@/lib/utils";

type ProductOption = { id: string; name: string; colorway: string; oneSize: boolean; sizes: string[] };

const inputClass =
  "h-11 w-full rounded-sm border border-line-soft bg-transparent px-4 text-base hover:border-ink-soft focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-sm";

/** Cadastro de depoimento recebido por mensagem (WhatsApp, Instagram…), com registro da autorização. */
export function ManualReviewForm({ products, today }: { products: ProductOption[]; today: string }) {
  const [formKey, setFormKey] = useState(0);
  // controlados: sobrevivem ao reenvio com erro (o React limpa o formulário a cada envio)
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [state, action, pending] = useActionState<ManualReviewState, FormData>(async (prev, formData) => {
    const result = await createManualReview(prev, formData);
    if (result.ok) {
      setFormKey((k) => k + 1);
      setProductId("");
      setRating(0);
      setName("");
    }
    return result;
  }, {});
  const v = state.ok ? undefined : state.values;
  const f = state.ok ? {} : (state.fields ?? {});
  const product = products.find((p) => p.id === productId);

  return (
    <form key={formKey} action={action} noValidate className="grid gap-5 rounded-card border border-line p-5 md:grid-cols-6 md:p-6">
      <Field label="produto" error={f.productId} className="md:col-span-4">
        {(field) => (
          <select
            {...field}
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={inputClass}
          >
            <option value="">escolha…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.colorway}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="recebido em" error={f.receivedAt} className="md:col-span-2">
        {(field) => <Input {...field} type="date" name="receivedAt" max={today} defaultValue={v?.receivedAt ?? ""} />}
      </Field>

      <Field
        label="nome do cliente"
        error={f.customerName}
        hint={name.trim() ? `Aparece como "${displayName(name)}".` : "Aparece só o primeiro nome e a inicial do sobrenome."}
        className="md:col-span-3"
      >
        {(field) => <Input {...field} name="customerName" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
      </Field>

      <Field label="cidade (opcional)" error={f.city} className="md:col-span-3">
        {(field) => <Input {...field} name="city" placeholder="Recife, PE" defaultValue={v?.city ?? ""} />}
      </Field>

      <fieldset className="md:col-span-3" aria-describedby={f.rating ? "manual-rating-error" : undefined}>
        <legend className="text-sm">nota</legend>
        <div className="mt-1 flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="relative inline-flex size-11 cursor-pointer items-center justify-center">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
              <Star
                className={cn("size-6", n <= rating ? "text-ink" : "text-line-soft")}
                strokeWidth={1.5}
                fill={n <= rating ? "currentColor" : "none"}
                aria-hidden="true"
              />
              <span className="absolute inset-1 rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-ink" />
              <span className="sr-only">
                {n} {n === 1 ? "estrela" : "estrelas"}
              </span>
            </label>
          ))}
        </div>
        {f.rating && (
          <p id="manual-rating-error" className="text-xs text-drop">
            {f.rating}
          </p>
        )}
      </fieldset>

      {product && !product.oneSize && (
        <>
          <Field label="tamanho (opcional)" error={f.size} className="md:col-span-1">
            {(field) => (
              <select {...field} name="size" defaultValue={v?.size ?? ""} className={inputClass}>
                <option value="">—</option>
                {product.sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="caimento (opcional)" className="md:col-span-2">
            {(field) => (
              <select {...field} name="fit" defaultValue={v?.fit ?? ""} className={inputClass}>
                <option value="">—</option>
                {(Object.keys(fitLabels) as ReviewFit[]).map((fit) => (
                  <option key={fit} value={fit}>
                    {fitLabels[fit]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </>
      )}

      <Field label="título (opcional)" error={f.title} className="md:col-span-6">
        {(field) => <Input {...field} name="title" maxLength={80} defaultValue={v?.title ?? ""} />}
      </Field>

      <Field label="depoimento (como o cliente escreveu)" error={f.body} className="md:col-span-6">
        {(field) => (
          <textarea
            {...field}
            name="body"
            rows={4}
            maxLength={REVIEW_BODY_MAX}
            defaultValue={v?.body ?? ""}
            className="w-full rounded-sm border border-line-soft bg-transparent px-4 py-3 text-base hover:border-ink-soft focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-sm"
          />
        )}
      </Field>

      <Field
        label="onde recebeu e como o cliente autorizou"
        error={f.consentNote}
        hint="Só o admin vê. Ex.: WhatsApp em 02/11, cliente autorizou por mensagem, print salvo na pasta da loja."
        className="md:col-span-6"
      >
        {(field) => <Input {...field} name="consentNote" maxLength={300} defaultValue={v?.consentNote ?? ""} />}
      </Field>

      <div className="md:col-span-6">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={v?.consent === "on"}
            aria-invalid={f.consent ? true : undefined}
            aria-describedby={f.consent ? "manual-consent-error" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-ink"
          />
          <span>
            Confirmo que este depoimento foi escrito por um cliente real, que o texto não foi alterado e que ele autorizou a
            publicação. Guardo o comprovante.
          </span>
        </label>
        {f.consent && (
          <p id="manual-consent-error" className="mt-1 text-xs text-drop">
            {f.consent}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 md:col-span-6">
        <Button type="submit" loading={pending}>
          cadastrar depoimento
        </Button>
        <p role="status" className="text-sm text-success">
          {state.ok ? "Depoimento publicado com o selo “recebida por mensagem”." : ""}
        </p>
        {state.error && !state.ok && (
          <p role="alert" className="text-sm text-drop">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
