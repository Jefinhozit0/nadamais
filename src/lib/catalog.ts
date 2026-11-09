import type { Brand, Category, ColorFamily, Product } from "@/types/product";
import { compareSizes } from "./sizes";

/* -------------------------------------------------------------------------- */
/*  Parâmetros de URL do catálogo — fonte única para servidor e cliente        */
/* -------------------------------------------------------------------------- */

export const PAGE_SIZE = 12;

export const brandSlugs: Record<Brand, string> = {
  Nike: "nike",
  Jordan: "jordan",
  Adidas: "adidas",
  "New Balance": "new-balance",
  "Stüssy": "stussy",
  "Carhartt WIP": "carhartt-wip",
};

const brandBySlug = Object.fromEntries(Object.entries(brandSlugs).map(([brand, slug]) => [slug, brand])) as Record<
  string,
  Brand
>;

export const categoryLabels: Record<Category, string> = {
  sneakers: "sneakers",
  roupas: "roupas",
  acessorios: "acessórios",
};

export const colorFamilies: readonly { value: ColorFamily; label: string; swatch: string }[] = [
  { value: "preto", label: "preto", swatch: "#121212" },
  { value: "branco", label: "branco", swatch: "#f5f3f1" },
  { value: "cinza", label: "cinza", swatch: "#9a9794" },
  { value: "bege", label: "bege", swatch: "#d8c6a8" },
  { value: "vermelho", label: "vermelho", swatch: "#b8202f" },
  { value: "laranja", label: "laranja", swatch: "#e2672a" },
  { value: "rosa", label: "rosa", swatch: "#eab0bd" },
  { value: "verde", label: "verde", swatch: "#2f7a4f" },
  { value: "azul", label: "azul", swatch: "#2d4f8f" },
];

export const priceRanges = [
  { value: "ate-500", label: "até R$ 500", min: 0, max: 50000 },
  { value: "500-1000", label: "R$ 500 – 1.000", min: 50000, max: 100000 },
  { value: "1000-1500", label: "R$ 1.000 – 1.500", min: 100000, max: 150000 },
  { value: "acima-1500", label: "acima de R$ 1.500", min: 150000, max: Number.POSITIVE_INFINITY },
] as const;

export type PriceRange = (typeof priceRanges)[number]["value"];

export const sortOptions = [
  { value: "relevancia", label: "relevância" },
  { value: "novos", label: "mais novos" },
  { value: "menor-preco", label: "menor preço" },
  { value: "maior-preco", label: "maior preço" },
] as const;

export type SortOption = (typeof sortOptions)[number]["value"];

export type CatalogFilters = {
  q: string;
  categoria?: Category;
  marcas: Brand[];
  tamanhos: string[];
  cores: ColorFamily[];
  preco?: PriceRange;
  ordem: SortOption;
  pagina: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : value.split(",")).map((v) => v.trim()).filter(Boolean);
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isCategory(value: string | undefined): value is Category {
  return value === "sneakers" || value === "roupas" || value === "acessorios";
}

/** Converte searchParams (tolerante a lixo) em filtros tipados. */
export function parseCatalogParams(params: RawParams): CatalogFilters {
  const categoria = first(params.categoria);
  const ordem = first(params.ordem);
  const preco = first(params.preco);
  const pagina = Number(first(params.pagina) ?? "1");
  const colorValues = colorFamilies.map((c) => c.value);

  return {
    q: (first(params.q) ?? "").slice(0, 80),
    categoria: isCategory(categoria) ? categoria : undefined,
    marcas: list(params.marca)
      .map((slug) => brandBySlug[slug])
      .filter((b): b is Brand => b !== undefined),
    tamanhos: list(params.tamanho).slice(0, 20),
    cores: list(params.cor).filter((c): c is ColorFamily => colorValues.includes(c as ColorFamily)),
    preco: priceRanges.some((r) => r.value === preco) ? (preco as PriceRange) : undefined,
    ordem: sortOptions.some((s) => s.value === ordem) ? (ordem as SortOption) : "relevancia",
    pagina: Number.isInteger(pagina) && pagina > 0 && pagina < 50 ? pagina : 1,
  };
}

/** Gera a query string a partir dos filtros (omite valores padrão para URLs limpas). */
export function catalogHref(filters: Partial<CatalogFilters>): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.categoria) sp.set("categoria", filters.categoria);
  if (filters.marcas?.length) sp.set("marca", filters.marcas.map((b) => brandSlugs[b]).join(","));
  if (filters.tamanhos?.length) sp.set("tamanho", filters.tamanhos.join(","));
  if (filters.cores?.length) sp.set("cor", filters.cores.join(","));
  if (filters.preco) sp.set("preco", filters.preco);
  if (filters.ordem && filters.ordem !== "relevancia") sp.set("ordem", filters.ordem);
  if (filters.pagina && filters.pagina > 1) sp.set("pagina", String(filters.pagina));
  const qs = sp.toString();
  return qs ? `/catalogo?${qs}` : "/catalogo";
}

export function activeFilterCount(filters: CatalogFilters): number {
  return (
    (filters.categoria ? 1 : 0) +
    filters.marcas.length +
    filters.tamanhos.length +
    filters.cores.length +
    (filters.preco ? 1 : 0)
  );
}

/* -------------------------------------------------------------------------- */
/*  Busca, filtro e ordenação                                                 */
/* -------------------------------------------------------------------------- */

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function searchableText(product: Product): string {
  return normalize(
    [product.name, product.shortName, product.brand, product.type, product.colorway, product.sku, ...product.colors].join(" "),
  );
}

export function matchesQuery(product: Product, q: string): boolean {
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = searchableText(product);
  return terms.every((term) => haystack.includes(term));
}

export function inStock(product: Product): boolean {
  return product.sizes.some((size) => size.stock > 0);
}

type FilterKey = "categoria" | "marcas" | "tamanhos" | "cores" | "preco";

/** Aplica todos os filtros, exceto `skip` (usado para calcular contagens de facetas). */
export function applyFilters(items: readonly Product[], filters: CatalogFilters, skip?: FilterKey): Product[] {
  const range = priceRanges.find((r) => r.value === filters.preco);
  return items.filter((p) => {
    if (!matchesQuery(p, filters.q)) return false;
    if (skip !== "categoria" && filters.categoria && p.category !== filters.categoria) return false;
    if (skip !== "marcas" && filters.marcas.length && !filters.marcas.includes(p.brand)) return false;
    if (
      skip !== "tamanhos" &&
      filters.tamanhos.length &&
      !p.sizes.some((s) => s.stock > 0 && filters.tamanhos.includes(s.label))
    )
      return false;
    if (skip !== "cores" && filters.cores.length && !p.colors.some((c) => filters.cores.includes(c))) return false;
    if (skip !== "preco" && range && (p.price < range.min || p.price >= range.max)) return false;
    return true;
  });
}

export function sortProducts(items: readonly Product[], ordem: SortOption): Product[] {
  const sorted = [...items];
  switch (ordem) {
    case "novos":
      return sorted.sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
    case "menor-preco":
      return sorted.sort((a, b) => a.price - b.price);
    case "maior-preco":
      return sorted.sort((a, b) => b.price - a.price);
    default:
      // relevância: em estoque primeiro, depois popularidade
      return sorted.sort((a, b) => Number(inStock(b)) - Number(inStock(a)) || b.popularity - a.popularity);
  }
}

export type Facets = {
  categorias: { value: Category; count: number }[];
  marcas: { value: Brand; count: number }[];
  tamanhos: { value: string; count: number }[];
  cores: { value: ColorFamily; count: number }[];
  precos: { value: PriceRange; count: number }[];
};

/** Contagens por faceta respeitando os demais filtros ativos (padrão de e-commerce). */
export function computeFacets(items: readonly Product[], filters: CatalogFilters): Facets {
  const count = <T,>(source: Product[], values: readonly T[], test: (p: Product, v: T) => boolean) =>
    values.map((value) => ({ value, count: source.filter((p) => test(p, value)).length }));

  const byCategory = applyFilters(items, filters, "categoria");
  const byBrand = applyFilters(items, filters, "marcas");
  const bySize = applyFilters(items, filters, "tamanhos");
  const byColor = applyFilters(items, filters, "cores");
  const byPrice = applyFilters(items, filters, "preco");

  const sizeLabels = Array.from(new Set(items.flatMap((p) => p.sizes.map((s) => s.label)))).filter((l) => l !== "U");
  sizeLabels.sort(compareSizes);

  return {
    categorias: count(byCategory, ["sneakers", "roupas", "acessorios"] as const, (p, v) => p.category === v),
    marcas: count(byBrand, Object.keys(brandSlugs) as Brand[], (p, v) => p.brand === v),
    tamanhos: count(sizeLabels.length ? bySize : [], sizeLabels, (p, v) =>
      p.sizes.some((s) => s.label === v && s.stock > 0),
    ),
    cores: count(byColor, colorFamilies.map((c) => c.value), (p, v) => p.colors.includes(v)),
    precos: count(byPrice, priceRanges.map((r) => r.value), (p, v) => {
      const r = priceRanges.find((range) => range.value === v);
      return r !== undefined && p.price >= r.min && p.price < r.max;
    }),
  };
}
