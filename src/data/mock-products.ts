import type { Product, ProductSize } from "@/types/product";

/**
 * Amostra mínima para validar os componentes da Fase 1.
 * O catálogo completo (24+ produtos) vem na Fase 2 e depois migra para o seed do Prisma.
 */

const sneakerSizes = (stock: readonly number[]): ProductSize[] =>
  ["37", "38", "39", "40", "41", "42", "43", "44"].map((label, index) => ({
    label,
    stock: stock[index] ?? 0,
  }));

const apparelSizes = (stock: readonly number[]): ProductSize[] =>
  ["P", "M", "G", "GG"].map((label, index) => ({ label, stock: stock[index] ?? 0 }));

export const sampleProducts: readonly Product[] = [
  {
    id: "p-001",
    slug: "nike-dunk-low-panda",
    name: "Nike Dunk Low Retro",
    shortName: "dunk low",
    brand: "Nike",
    category: "sneakers",
    colorway: "white / black",
    sku: "DD1391-100",
    price: 89999,
    images: [],
    sizes: sneakerSizes([2, 4, 6, 5, 3, 2, 1, 0]),
    releaseYear: 2025,
    badge: "novo",
  },
  {
    id: "p-002",
    slug: "new-balance-990v6-grey",
    name: "New Balance Made in USA 990v6",
    shortName: "990v6",
    brand: "New Balance",
    category: "sneakers",
    colorway: "grey",
    sku: "M990GL6",
    price: 179999,
    compareAtPrice: 199999,
    images: [],
    sizes: sneakerSizes([0, 1, 2, 2, 1, 0, 1, 0]),
    releaseYear: 2024,
    badge: "ultimas",
  },
  {
    id: "p-003",
    slug: "stussy-basic-hoodie-black",
    name: "Stüssy Basic Hoodie",
    shortName: "basic hoodie",
    brand: "Stüssy",
    category: "roupas",
    colorway: "black",
    sku: "118422",
    price: 109999,
    images: [],
    sizes: apparelSizes([3, 6, 4, 2]),
    releaseYear: 2025,
    badge: "drop",
  },
  {
    id: "p-004",
    slug: "carhartt-wip-acrylic-watch-hat",
    name: "Carhartt WIP Acrylic Watch Hat",
    shortName: "watch hat",
    brand: "Carhartt WIP",
    category: "acessorios",
    colorway: "black",
    sku: "I020222",
    price: 34999,
    images: [],
    sizes: [{ label: "U", stock: 0 }],
    releaseYear: 2023,
  },
];
