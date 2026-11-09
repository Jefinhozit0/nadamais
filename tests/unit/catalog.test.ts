import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import {
  activeFilterCount,
  applyFilters,
  catalogHref,
  computeFacets,
  matchesQuery,
  parseCatalogParams,
  sortProducts,
} from "@/lib/catalog";

const base = parseCatalogParams({});

describe("parseCatalogParams", () => {
  it("usa padrões quando não há parâmetros", () => {
    expect(base).toEqual({
      q: "",
      categoria: undefined,
      linhas: [],
      tamanhos: [],
      cores: [],
      preco: undefined,
      ordem: "relevancia",
      pagina: 1,
    });
  });

  it("aceita listas separadas por vírgula e ignora lixo", () => {
    const f = parseCatalogParams({
      categoria: "sneakers",
      linha: "court,xpto,volume",
      cor: "preto,roxo",
      ordem: "menor-preco",
      pagina: "2",
    });
    expect(f.categoria).toBe("sneakers");
    expect(f.linhas).toEqual(["court", "volume"]);
    expect(f.cores).toEqual(["preto"]);
    expect(f.ordem).toBe("menor-preco");
    expect(f.pagina).toBe(2);
  });

  it("descarta valores inválidos", () => {
    const f = parseCatalogParams({ categoria: "carros", ordem: "aleatorio", pagina: "-3", preco: "gratis" });
    expect(f.categoria).toBeUndefined();
    expect(f.ordem).toBe("relevancia");
    expect(f.pagina).toBe(1);
    expect(f.preco).toBeUndefined();
  });

  it("ida e volta pela URL preserva os filtros", () => {
    const f = parseCatalogParams({ categoria: "roupas", linha: "essencial", tamanho: "M,G", ordem: "novos" });
    const sp = Object.fromEntries(new URL(catalogHref(f), "http://x").searchParams);
    expect(parseCatalogParams(sp)).toEqual(f);
  });

  it("URL limpa quando só há padrões", () => {
    expect(catalogHref(base)).toBe("/catalogo");
  });
});

describe("busca", () => {
  const court = products.find((p) => p.slug === "court-low-branco")!;

  it("ignora maiúsculas e acentos", () => {
    expect(matchesQuery(court, "COURT")).toBe(true);
    expect(matchesQuery(court, "brânco")).toBe(true);
  });

  it("exige todos os termos; busca vazia casa tudo", () => {
    expect(matchesQuery(court, "court zzz")).toBe(false);
    expect(matchesQuery(court, "   ")).toBe(true);
  });
});

describe("filtros", () => {
  it("filtra por categoria", () => {
    const result = applyFilters(products, { ...base, categoria: "sneakers" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.category === "sneakers")).toBe(true);
  });

  it("filtro de tamanho só considera tamanhos com estoque", () => {
    const result = applyFilters(products, { ...base, tamanhos: ["40"] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.sizes.some((s) => s.label === "40" && s.stock > 0))).toBe(true);
  });

  it("combina filtros: E entre grupos, OU dentro do grupo", () => {
    const result = applyFilters(products, { ...base, linhas: ["court", "volume"], cores: ["preto"] });
    for (const p of result) {
      expect(["court", "volume"]).toContain(p.line);
      expect(p.colors).toContain("preto");
    }
  });

  it("conta filtros ativos", () => {
    expect(activeFilterCount({ ...base, categoria: "roupas", tamanhos: ["M", "G"] })).toBe(3);
  });

  it("facetas de categoria ignoram o próprio filtro de categoria", () => {
    const facets = computeFacets(products, { ...base, categoria: "sneakers" });
    const total = facets.categorias.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(products.length);
  });
});

describe("ordenação", () => {
  it("menor e maior preço", () => {
    const asc = sortProducts(products, "menor-preco").map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = sortProducts(products, "maior-preco").map((p) => p.price);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it("relevância coloca esgotados no fim", () => {
    const soldOut = (p: (typeof products)[number]) => p.sizes.every((s) => s.stock === 0);
    const sorted = sortProducts(products, "relevancia");
    const first = sorted.findIndex(soldOut);
    if (first !== -1) expect(sorted.slice(first).every(soldOut)).toBe(true);
  });

  it("não altera o array original", () => {
    const before = products.map((p) => p.id);
    sortProducts(products, "menor-preco");
    expect(products.map((p) => p.id)).toEqual(before);
  });
});
