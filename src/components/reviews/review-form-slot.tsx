import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getProfile } from "@/server/auth";
import { hasDatabase } from "@/server/catalog-source";
import { getReviewEligibility } from "@/server/reviews";
import { ReviewForm } from "./review-form";

/** Parte dinâmica (depende da sessão): convite para entrar, aviso ou o formulário de quem comprou. */
export async function ReviewFormSlot({ product }: { product: { id: string; slug: string; name: string; sizeSystem: string } }) {
  if (!hasDatabase()) return null;
  const profile = await getProfile();

  if (!profile) {
    return (
      <Link
        href={`/entrar?next=${encodeURIComponent(`/produto/${product.slug}#avaliacoes`)}`}
        className="inline-flex items-center gap-1.5 rounded-sm py-2 text-sm underline-offset-4 hover:underline"
      >
        comprou? entre para avaliar <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </Link>
    );
  }

  const eligibility = await getReviewEligibility(profile.id, product.id).catch((error: unknown) => {
    console.error("[avaliações] falha ao checar se o cliente pode avaliar", error);
    return null;
  });
  if (!eligibility) return null;
  if (eligibility.kind !== "eligible") {
    return (
      <p className="max-w-[38ch] font-mono text-xs text-mute-strong">
        a avaliação libera quando um pedido seu com este produto for entregue.
      </p>
    );
  }

  return <ReviewForm productId={product.id} productName={product.name} showFit={product.sizeSystem !== "one-size"} existing={eligibility.existing} />;
}
