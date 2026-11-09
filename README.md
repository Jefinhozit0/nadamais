# sem nome — e-commerce de sneakers e streetwear

Loja de sneakers e streetwear originais (Nike, Jordan, adidas, New Balance, Stüssy, Carhartt WIP) para o mercado brasileiro.

> O nome da loja ainda não foi definido. Troque em `src/config/site.ts` e tudo acompanha.

## Stack

- Next.js 16 (App Router, Cache Components) + TypeScript estrito
- Tailwind CSS v4 + shadcn/ui (Base UI), customizado pelo design system
- Motion (Framer Motion) para animações pontuais
- Zustand (sacola persistida no navegador)
- Próximas fases: PostgreSQL + Prisma, Auth, Mercado Pago (sandbox)

## Rodando localmente

Requisitos: Node 22+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
```

Outros comandos:

```bash
pnpm build        # build de produção
pnpm start        # serve o build
pnpm lint
```

Os dados ainda são mock (`src/data/products.ts`, 27 produtos). O seed do banco entra na Fase 4.

## Estrutura

```
docs/                 design system (fonte única da verdade visual) e créditos de imagens
public/images/        fotos de produto e recorte do hero
src/app/              rotas: home, /catalogo, /produto/[slug], /api/search, /design-system
src/components/       ui/ (shadcn customizado), layout/, product/, catalog/, home/, search/, cart/
src/config/site.ts    nome, textos, parcelas, desconto Pix, frete grátis
src/data/             catálogo mock
src/lib/              formatação BRL, filtros do catálogo, conversão de tamanhos
src/server/queries/   acesso a dados (troca para Prisma sem mudar as assinaturas)
src/store/            sacola (Zustand)
```

## Design

Tudo segue [docs/design-system.md](docs/design-system.md). A página `/design-system` mostra os tokens e componentes nos temas claro e escuro.

## Imagens

As fotos são do Unsplash e servem só para desenvolvimento. Veja [docs/creditos-imagens.md](docs/creditos-imagens.md).
