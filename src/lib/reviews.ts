import { z } from "zod";

/** Avaliações: tipos e regras puras (usados no cliente e no servidor). */

export type ReviewFit = "pequeno" | "certo" | "grande";

export const fitLabels: Record<ReviewFit, string> = {
  pequeno: "veste pequeno",
  certo: "tamanho certo",
  grande: "veste grande",
};

export type Review = {
  id: string;
  rating: number;
  title?: string;
  body: string;
  fit?: ReviewFit;
  size?: string;
  authorName: string;
  city?: string;
  createdAt: string;
};

export type RatingSummary = {
  /** Média com 1 casa decimal. */
  average: number;
  count: number;
};

export type ReviewStats = RatingSummary & {
  /** Quantidade por nota: índice 0 = 1 estrela … índice 4 = 5 estrelas. */
  distribution: [number, number, number, number, number];
  fit: Record<ReviewFit, number>;
};

export const REVIEW_BODY_MIN = 20;
export const REVIEW_BODY_MAX = 1000;

export const reviewInputSchema = z.object({
  productId: z.string().min(1).max(40),
  rating: z.coerce
    .number({ error: "Escolha de 1 a 5 estrelas." })
    .int()
    .min(1, { error: "Escolha de 1 a 5 estrelas." })
    .max(5, { error: "Escolha de 1 a 5 estrelas." }),
  title: z.string().trim().max(80, { error: "Título de até 80 caracteres." }).optional().default(""),
  body: z
    .string()
    .trim()
    .min(REVIEW_BODY_MIN, { error: `Conte um pouco mais (mínimo de ${REVIEW_BODY_MIN} caracteres).` })
    .max(REVIEW_BODY_MAX, { error: `Até ${REVIEW_BODY_MAX} caracteres.` }),
  fit: z.enum(["pequeno", "certo", "grande"]).optional().catch(undefined),
});

/** "ana clara de souza" → "Ana S." — nunca exibimos o nome completo do cliente. */
export function displayName(fullName: string | null | undefined): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Cliente";
  const cap = (w: string) => w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1).toLocaleLowerCase("pt-BR");
  const first = cap(parts[0]!);
  const last = parts.length > 1 ? parts[parts.length - 1]! : "";
  return last ? `${first} ${last.charAt(0).toLocaleUpperCase("pt-BR")}.` : first;
}

export function emptyStats(): ReviewStats {
  return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0], fit: { pequeno: 0, certo: 0, grande: 0 } };
}

export function computeStats(rows: readonly { rating: number; fit?: ReviewFit | null }[]): ReviewStats {
  const stats = emptyStats();
  let sum = 0;
  for (const row of rows) {
    const r = Math.min(5, Math.max(1, Math.round(row.rating)));
    stats.distribution[r - 1]++;
    sum += r;
    if (row.fit) stats.fit[row.fit]++;
  }
  stats.count = rows.length;
  stats.average = rows.length ? Math.round((sum / rows.length) * 10) / 10 : 0;
  return stats;
}

/** Tendência de caimento, quando há votos suficientes para dizer algo. */
export function fitVerdict(fit: ReviewStats["fit"]): { fit: ReviewFit; percent: number } | undefined {
  const total = fit.pequeno + fit.certo + fit.grande;
  if (total < 3) return undefined;
  const top = (Object.entries(fit) as [ReviewFit, number][]).sort((a, b) => b[1] - a[1])[0]!;
  return { fit: top[0], percent: Math.round((top[1] / total) * 100) };
}

export function formatRating(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function reviewCountLabel(count: number): string {
  return `${count} ${count === 1 ? "avaliação" : "avaliações"}`;
}
