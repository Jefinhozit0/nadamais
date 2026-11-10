/**
 * Configuração central da loja. O nome é provisório:
 * troque `name` aqui e tudo (header, footer, metadata) acompanha.
 */
export const siteConfig = {
  name: "nada mais",
  shortName: "nada mais",
  tagline: "Sneakers e streetwear. Sem excesso.",
  description:
    "Tênis, moletons, camisetas e acessórios das marcas que você curte. Peças conferidas uma a uma, envio para todo o Brasil, Pix, cartão e boleto.",
  locale: "pt-BR",
  currency: "BRL",
  maxInstallments: 10,
  /** Desconto no Pix (5%) — prática comum no varejo BR; ajuste aqui. */
  pixDiscount: 0.05,
  /** Frete grátis a partir de (centavos). */
  freeShippingFrom: 49900,
  city: "são paulo, br",
  /** Prazo próprio de troca (dias). O direito de arrependimento legal é de 7 dias (CDC, art. 49). */
  exchangeDays: 30,
  /**
   * Dados legais e de contato — PREENCHER antes de lançar (aparecem no rodapé, privacidade e trocas).
   * Os valores abaixo são provisórios.
   */
  legal: {
    companyName: "Nome da Empresa LTDA",
    cnpj: "00.000.000/0001-00",
    address: "Rua Exemplo, 123 — São Paulo/SP — CEP 00000-000",
    email: "contato@sualoja.com.br",
    privacyEmail: "privacidade@sualoja.com.br",
    whatsapp: "",
  },
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
      { label: "como garantimos", href: "/sobre#qualidade" },
      { label: "privacidade", href: "/privacidade" },
    ],
  },
];
