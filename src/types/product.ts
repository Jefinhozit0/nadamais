export type Category = "sneakers" | "roupas" | "acessorios";


/** Família de cor usada no filtro do catálogo (o nome exato da cor fica em `colorway`). */
export type ColorFamily =
  | "preto"
  | "branco"
  | "cinza"
  | "bege"
  | "vermelho"
  | "laranja"
  | "rosa"
  | "verde"
  | "azul"
  | "multicolor";

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** "cutout" = fundo transparente (vai sobre o halo); "photo" = cena inteira (preenche o quadro). */
  kind: "photo" | "cutout";
  /** Página de origem da foto (licença Unsplash) — ver docs/creditos-imagens.md. */
  credit?: string;
};

/** Grade de tamanhos: tênis em numeração BR, roupas P–GG, acessórios tamanho único. */
export type SizeSystem = "sneaker" | "apparel" | "one-size";

/** Um tamanho e seu estoque. Para tênis, `label` é a numeração BR. */
export type ProductSize = {
  label: string;
  stock: number;
};

export type ProductBadge = "novo" | "drop" | "ultimas" | "esgotado";

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Nome curto usado em chamadas e placeholders tipográficos (ex.: "court low"). */
  shortName: string;
  /** Marca do produto (ex.: "Nike"). A loja revende produtos originais de várias marcas. */
  brand: string;
  category: Category;
  /** Subtipo exibido na página (ex.: "tênis", "moletom", "gorro"). */
  type: string;
  colorway: string;
  colors: readonly ColorFamily[];
  sku: string;
  description: string;
  details: readonly string[];
  /** Em centavos. */
  price: number;
  /** Em centavos. Preço "de" quando há desconto. */
  compareAtPrice?: number;
  images: readonly ProductImage[];
  sizeSystem: SizeSystem;
  sizes: readonly ProductSize[];
  releaseYear: number;
  /** ISO (AAAA-MM-DD). Usado em "novos drops". */
  releasedAt: string;
  /** 0–100. Usado em "em alta" e na ordenação por relevância. */
  popularity: number;
  badge?: ProductBadge;
  /** Média das avaliações publicadas (só quando há pelo menos uma). */
  rating?: { average: number; count: number };
};
