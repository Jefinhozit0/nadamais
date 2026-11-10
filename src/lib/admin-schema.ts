import { z } from "zod";

/** Validação do produto no painel (cliente dá feedback; servidor é a fonte da verdade). */

export const CATEGORIES = ["sneakers", "roupas", "acessorios"] as const;
export const SIZE_SYSTEMS = ["sneaker", "apparel", "one-size"] as const;
export const BADGES = ["novo", "drop", "ultimas", "esgotado"] as const;
export const COLORS = ["preto", "branco", "cinza", "bege", "vermelho", "laranja", "rosa", "verde", "azul", "multicolor"] as const;

/** Só aceita imagens locais (/images/...) ou do Storage do Supabase — o next/image bloqueia outros domínios. */
const imageSrc = z
  .string()
  .trim()
  .refine((v) => v.startsWith("/images/") || /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(v), {
    error: "Use uma imagem enviada pelo painel ou um caminho /images/…",
  });

export const productInputSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, { error: "Nome obrigatório." }).max(80),
    shortName: z.string().trim().min(2, { error: "Nome curto obrigatório (aparece nos cards sem foto)." }).max(24),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Só letras minúsculas, números e hífen (ex.: court-low-branco)." })
      .max(80),
    sku: z.string().trim().min(2, { error: "SKU obrigatório." }).max(40),
    brand: z.string().trim().min(1, { error: "Informe a marca (ex.: Nike)." }).max(40),
    category: z.enum(CATEGORIES),
    type: z.string().trim().min(2, { error: "Ex.: tênis, moletom, boné." }).max(40),
    colorway: z.string().trim().min(2, { error: "Descreva a cor (ex.: branco total)." }).max(80),
    colors: z.array(z.enum(COLORS)).min(1, { error: "Marque pelo menos uma cor para o filtro." }),
    description: z.string().trim().min(10, { error: "Escreva uma descrição (mín. 10 caracteres)." }).max(1200),
    details: z.array(z.string().trim().min(1).max(120)).max(12),
    price: z.number().int().min(100, { error: "Preço mínimo R$ 1,00." }).max(10_000_000),
    compareAtPrice: z.number().int().positive().nullable(),
    sizeSystem: z.enum(SIZE_SYSTEMS),
    releasedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Data inválida." }),
    popularity: z.number().int().min(0).max(100),
    badge: z.enum(BADGES).nullable(),
    active: z.boolean(),
    images: z
      .array(
        z.object({
          src: imageSrc,
          alt: z.string().trim().min(3, { error: "Descreva a foto (acessibilidade)." }).max(200),
          kind: z.enum(["photo", "cutout"]),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        }),
      )
      .max(8, { error: "Máximo de 8 fotos." }),
    sizes: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(8),
          stock: z.number().int().min(0, { error: "Estoque não pode ser negativo." }).max(100_000),
        }),
      )
      .min(1, { error: "Cadastre pelo menos um tamanho." })
      .max(20),
  })
  .refine((p) => p.compareAtPrice === null || p.compareAtPrice > p.price, {
    error: "O preço \"de\" precisa ser maior que o preço de venda.",
    path: ["compareAtPrice"],
  })
  .refine((p) => new Set(p.sizes.map((s) => s.label.toUpperCase())).size === p.sizes.length, {
    error: "Há tamanhos repetidos.",
    path: ["sizes"],
  });

export type ProductInput = z.infer<typeof productInputSchema>;

export const DEFAULT_SIZES: Record<(typeof SIZE_SYSTEMS)[number], string[]> = {
  sneaker: ["37", "38", "39", "40", "41", "42", "43", "44"],
  apparel: ["P", "M", "G", "GG"],
  "one-size": ["U"],
};

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
