import { BadgeCheck } from "lucide-react";
import { Suspense } from "react";
import {
  fitLabels,
  fitVerdict,
  formatRating,
  reviewCountLabel,
  type Review,
  type ReviewStats,
} from "@/lib/reviews";
import { ReviewFormSlot } from "./review-form-slot";
import { Stars, starsLabel } from "./stars";

const verdictText = { pequeno: "veste pequeno", certo: "o tamanho é o certo", grande: "veste grande" } as const;

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

type Props = {
  product: { id: string; slug: string; name: string; sizeSystem: string };
  stats: ReviewStats;
  reviews: Review[];
};

/** Avaliações na página do produto: resumo (média, distribuição, caimento) + lista + formulário. */
export function ReviewsSection({ product, stats, reviews }: Props) {
  const verdict = product.sizeSystem === "one-size" ? undefined : fitVerdict(stats.fit);

  return (
    <section id="avaliacoes" aria-labelledby="avaliacoes-title" className="mt-24 scroll-mt-28 md:mt-36">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <h2
            id="avaliacoes-title"
            className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
          >
            avaliações
          </h2>

          {stats.count > 0 ? (
            <div className="mt-8 flex flex-col gap-6">
              <div className="flex items-end gap-4">
                <p className="font-display text-6xl leading-none font-semibold tracking-[-0.03em] tabular-nums">
                  {formatRating(stats.average)}
                </p>
                <div className="flex flex-col gap-1.5 pb-1">
                  <Stars value={stats.average} starClassName="size-4" label={starsLabel(stats.average)} />
                  <p className="font-mono text-xs text-mute-strong">{reviewCountLabel(stats.count)} de quem comprou</p>
                </div>
              </div>

              <ul className="flex flex-col gap-2" aria-label="Distribuição das notas">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = stats.distribution[n - 1];
                  const pct = stats.count ? Math.round((count / stats.count) * 100) : 0;
                  return (
                    <li key={n} className="grid grid-cols-[3.25rem_1fr_2.5rem] items-center gap-3 font-mono text-xs tabular-nums">
                      <span className="text-ink-soft">
                        {n} <span className="sr-only">{n === 1 ? "estrela" : "estrelas"}:</span>
                        <span aria-hidden="true">★</span>
                      </span>
                      <span aria-hidden="true" className="relative h-px bg-line-soft">
                        <span className="absolute inset-y-[-1px] left-0 bg-ink" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="text-right text-mute-strong">
                        {count}
                        <span className="sr-only"> ({pct}%)</span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              {verdict && (
                <p className="border-t border-line-soft pt-4 text-sm">
                  <span className="font-medium">caimento:</span>{" "}
                  <span className="text-ink-soft">
                    {verdict.percent}% dizem que {verdictText[verdict.fit]}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="mt-6 max-w-[38ch] text-sm text-ink-soft">
              Ainda sem avaliações. Quem recebe o pedido pode avaliar — só publicamos opiniões de compras confirmadas.
            </p>
          )}

          <div className="mt-8">
            <Suspense fallback={<div className="h-11 w-48 animate-pulse rounded-full bg-haze" />}>
              <ReviewFormSlot product={product} />
            </Suspense>
          </div>
        </div>

        {reviews.length > 0 && (
          <ul className="flex flex-col lg:col-span-7 lg:col-start-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-t border-line-soft py-6 last:border-b">
                <article aria-label={`Avaliação de ${review.authorName}`}>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <Stars value={review.rating} label={starsLabel(review.rating)} />
                    <time dateTime={review.createdAt} className="font-mono text-micro text-mute-strong">
                      {dateFmt.format(new Date(review.createdAt))}
                    </time>
                  </div>
                  {review.title && <h3 className="mt-3 text-sm font-medium">{review.title}</h3>}
                  <p className="mt-2 max-w-[65ch] text-sm leading-relaxed whitespace-pre-line text-ink-soft">{review.body}</p>
                  <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-micro text-mute-strong">
                    <span className="text-ink">{review.authorName}</span>
                    {review.city && <span>{review.city}</span>}
                    <span className="inline-flex items-center gap-1 text-success">
                      <BadgeCheck className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                      compra verificada
                    </span>
                    {review.size && review.size !== "U" && <span>comprou tam {review.size}</span>}
                    {review.fit && <span>{fitLabels[review.fit]}</span>}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
