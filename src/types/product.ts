export type Category = "sneakers" | "roupas" | "acessorios";

export type Brand =
  | "Nike"
  | "Jordan"
  | "Adidas"
  | "New Balance"
  | "Stüssy"
  | "Carhartt WIP";

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/** Um tamanho e seu estoque. Para tênis, `label` é a numeração BR; para roupas, P–GG. */
export type ProductSize = {
  label: string;
  stock: number;
};

export type ProductBadge = "novo" | "drop" | "ultimas" | "esgotado";

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Nome curto usado em placeholders tipográficos e chamadas (ex.: "dunk low"). */
  shortName: string;
  brand: Brand;
  category: Category;
  colorway: string;
  sku: string;
  /** Em centavos. */
  price: number;
  /** Em centavos. Preço "de" quando há desconto. */
  compareAtPrice?: number;
  images: readonly ProductImage[];
  sizes: readonly ProductSize[];
  releaseYear: number;
  badge?: ProductBadge;
};
