import Image from "next/image";
import Link from "next/link";
import { SourceTag } from "@/components/reviews/reviews-section";
import { Stars, starsLabel } from "@/components/reviews/stars";
import { formatRating, reviewCountLabel, type RatingSummary } from "@/lib/reviews";
import type { FeaturedReview } from "@/server/reviews";

/**
 * Depoimentos de clientes na home. Só avaliações reais (compra entregue);
 * a seção não aparece enquanto não houver nenhuma.
 */
export function Testimonials({ reviews, store }: { reviews: FeaturedReview[]; store: RatingSummary }) {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-4">
        <h2
          id="avaliacoes-title"
          className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
        >
          quem comprou, conta.
        </h2>
        <div className="mt-8 flex items-end gap-4">
          <p className="font-display text-6xl leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {formatRating(store.average)}
          </p>
          <div className="flex flex-col gap-1.5 pb-1">
            <Stars value={store.average} starClassName="size-4" label={starsLabel(store.average)} />
            <p className="font-mono text-xs text-mute-strong">{reviewCountLabel(store.count)}</p>
          </div>
        </div>
        <p className="mt-5 max-w-[38ch] text-sm text-ink-soft">
          Avaliações de pedidos entregues e depoimentos que clientes mandaram por mensagem, publicados com autorização. Na página de cada produto estão todas, boas ou ruins.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:col-span-8">
        {reviews.map((review, i) => (
          <li key={review.id} className={i === 0 ? "sm:col-span-2" : undefined}>
            <figure className="flex h-full flex-col gap-4 rounded-card border border-line bg-canvas p-5 md:p-6">
              <Stars value={review.rating} label={starsLabel(review.rating)} />
              <blockquote className="flex-1">
                {review.title && <p className="text-sm font-medium">{review.title}</p>}
                <p
                  className={
                    i === 0
                      ? "mt-2 font-display text-[clamp(1.125rem,2vw,1.5rem)] leading-snug font-medium tracking-[-0.01em]"
                      : "mt-2 line-clamp-6 text-sm leading-relaxed text-ink-soft"
                  }
                >
                  “{review.body}”
                </p>
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-line-soft pt-4">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-sm border border-line-soft bg-haze">
                  {review.product.image && <Image src={review.product.image} alt="" fill sizes="44px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 font-mono text-micro">
                    <span className="text-ink">{review.authorName}</span>
                    {review.city && <span className="text-mute-strong">{review.city}</span>}
                    <SourceTag source={review.source} short />
                  </span>
                  <Link
                    href={`/produto/${review.product.slug}#avaliacoes`}
                    className="block truncate rounded-sm text-xs lowercase underline-offset-4 hover:underline"
                  >
                    {review.product.name}
                  </Link>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
