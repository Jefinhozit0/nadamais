import { z } from "zod";

/** Avaliações: tipos e regras puras (usados no cliente e no servidor). */

export type ReviewFit = "pequeno" | "certo" | "grande";

export const fitLabels: Record<ReviewFit, string> = {
  pequeno: "veste pequeno",
  certo: "tamanho certo",
  grande: "veste grande",
};

/** site = compra verificada; mensagem = depoimento recebido fora do site e cadastrado pelo admin. */
export type ReviewSource = "site" | "mensagem";

export const sourceLabels: Record<ReviewSource, string> = {
  site: "compra verificada",
  mensagem: "recebida por mensagem",
};

export type Review = {
  id: string;
  source: ReviewSource;
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

/** Depoimento recebido por mensagem, cadastrado no admin. */
export const manualReviewSchema = z.object({
  productId: z.string().min(1, { error: "Escolha o produto." }).max(40),
  customerName: z.string().trim().min(2, { error: "Informe o nome do cliente." }).max(80),
  city: z.string().trim().max(60).optional().default(""),
  rating: reviewInputSchema.shape.rating,
  title: reviewInputSchema.shape.title,
  body: reviewInputSchema.shape.body,
  fit: reviewInputSchema.shape.fit,
  size: z.string().trim().max(10).optional().default(""),
  receivedAt: z.iso
    .date({ error: "Informe a data em que recebeu o depoimento." })
    .refine((d) => new Date(`${d}T12:00:00-03:00`).getTime() <= Date.now(), { error: "A data não pode estar no futuro." })
    .refine((d) => d >= "2000-01-01", { error: "Data inválida." }),
  consentNote: z
    .string()
    .trim()
    .min(10, { error: "Diga onde recebeu e como o cliente autorizou (ex.: WhatsApp, print guardado)." })
    .max(300),
  consent: z.literal("on", { error: "Confirme que o depoimento é real e que o cliente autorizou a publicação." }),
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
