/**
 * Configuração central da marca. A loja ainda não tem nome:
 * troque `name` aqui e tudo (header, footer, metadata) acompanha.
 */
export const siteConfig = {
  name: "sem nome",
  shortName: "sem nome",
  tagline: "Sneakers e streetwear originais. Sem excesso.",
  description:
    "Sneakers e streetwear de Nike, Jordan, Adidas, New Balance, Stüssy e Carhartt WIP. Produtos 100% originais, envio para todo o Brasil, Pix, cartão e boleto.",
  locale: "pt-BR",
  currency: "BRL",
  maxInstallments: 10,
  /** Desconto no Pix (5%) — prática comum no varejo BR; ajuste aqui. */
  pixDiscount: 0.05,
  /** Frete grátis a partir de (centavos). */
  freeShippingFrom: 49900,
  city: "são paulo, br",
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export const mainNav: readonly NavItem[] = [
  { label: "início", href: "/" },
  { label: "sneakers", href: "/catalogo?categoria=sneakers" },
  { label: "roupas", href: "/catalogo?categoria=roupas" },
  { label: "acessórios", href: "/catalogo?categoria=acessorios" },
  { label: "drops", href: "/catalogo?ordem=novos" },
];

export const footerNav: readonly { title: string; items: readonly NavItem[] }[] = [
  {
    title: "loja",
    items: [
      { label: "novos drops", href: "/catalogo?ordem=novos" },
      { label: "sneakers", href: "/catalogo?categoria=sneakers" },
      { label: "roupas", href: "/catalogo?categoria=roupas" },
      { label: "acessórios", href: "/catalogo?categoria=acessorios" },
    ],
  },
  {
    title: "ajuda",
    items: [
      { label: "faq", href: "/faq" },
      { label: "trocas e devoluções", href: "/trocas-e-devolucoes" },
      { label: "minha conta", href: "/conta" },
    ],
  },
  {
    title: "sobre",
    items: [
      { label: "quem somos", href: "/sobre" },
      { label: "autenticidade", href: "/sobre#autenticidade" },
      { label: "privacidade", href: "/privacidade" },
    ],
  },
];
