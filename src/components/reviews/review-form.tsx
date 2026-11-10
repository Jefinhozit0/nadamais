"use client";

import { Star } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { deleteReview, saveReview, type ReviewFormState } from "@/app/produto/actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fitLabels, REVIEW_BODY_MAX, REVIEW_BODY_MIN, type Review, type ReviewFit } from "@/lib/reviews";
import { cn } from "@/lib/utils";

const ratingWords = ["", "não gostei", "abaixo do esperado", "ok", "gostei", "amei"];

type Props = { productId: string; productName: string; showFit: boolean; existing?: Review };

/** Formulário de avaliação (só aparece para quem recebeu o produto). */
export function ReviewForm({ productId, productName, showFit, existing }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(async (prev, formData) => {
    const result = await saveReview(prev, formData);
    if (result.ok) setOpen(false);
    return result;
  }, {});
  const v = state.values;
  const [rating, setRating] = useState(Number(v?.rating ?? existing?.rating ?? 0));
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(v?.body ?? existing?.body ?? "");
  const f = state.fields ?? {};
  const ratingErrorId = useId();
  const shown = hover || rating;

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button variant="outline" onClick={() => setOpen(true)} aria-expanded={false}>
          {existing ? "editar minha avaliação" : "avaliar este produto"}
        </Button>
        <p role="status" className="text-sm text-success">
          {state.ok ? "Obrigado! Sua avaliação já está no ar." : ""}
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-5 rounded-card border border-line p-5"
      aria-label={`Avaliar ${productName}`}
    >
      <input type="hidden" name="productId" value={productId} />

      <fieldset aria-describedby={f.rating ? ratingErrorId : undefined}>
        <legend className="text-sm">sua nota</legend>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="relative inline-flex size-11 cursor-pointer items-center justify-center" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                />
                <Star
                  className={cn("size-6 transition-colors", n <= shown ? "text-ink" : "text-line-soft")}
                  strokeWidth={1.5}
                  fill={n <= shown ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                <span className="absolute inset-1 rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-ink" />
                <span className="sr-only">
                  {n} {n === 1 ? "estrela" : "estrelas"} — {ratingWords[n]}
                </span>
              </label>
            ))}
          </div>
          <span aria-hidden="true" className="font-mono text-xs text-mute-strong">
            {ratingWords[shown]}
          </span>
        </div>
        {f.rating && (
          <p id={ratingErrorId} className="mt-1 text-xs text-drop">
            {f.rating}
          </p>
        )}
      </fieldset>

      {showFit && (
        <fieldset>
          <legend className="text-sm">
            como ficou o tamanho? <span className="text-mute-strong">(opcional)</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(fitLabels) as ReviewFit[]).map((fit) => (
              <label key={fit} className="cursor-pointer">
                <input
                  type="radio"
                  name="fit"
                  value={fit}
                  defaultChecked={(v?.fit || existing?.fit) === fit}
                  className="peer sr-only"
                />
                <span className="inline-flex h-10 items-center rounded-full border border-line-soft px-4 text-xs transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:border-ink">
                  {fitLabels[fit]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Field label="título (opcional)" error={f.title}>
        {(field) => <Input {...field} name="title" maxLength={80} defaultValue={v?.title ?? existing?.title ?? ""} placeholder="em uma frase" />}
      </Field>

      <Field
        label="sua avaliação"
        error={f.body}
        hint={`Conforto, material, se veio como na foto. ${body.trim().length}/${REVIEW_BODY_MAX}`}
      >
        {(field) => (
          <textarea
            {...field}
            name="body"
            rows={5}
            minLength={REVIEW_BODY_MIN}
            maxLength={REVIEW_BODY_MAX}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-sm border border-line-soft bg-transparent px-4 py-3 text-base hover:border-ink-soft focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-sm"
          />
        )}
      </Field>

      <p className="text-xs text-mute-strong">
        Publicamos seu primeiro nome, a inicial do sobrenome e a cidade do pedido.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          {existing ? "salvar alterações" : "publicar avaliação"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          cancelar
        </Button>
        {existing && (
          <Button type="submit" variant="link" formAction={deleteReview} formNoValidate className="text-mute-strong">
            remover avaliação
          </Button>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-drop">
          {state.error}
        </p>
      )}
    </form>
  );
}
