# nada mais — e-commerce de sneakers e streetwear

Loja de sneakers e streetwear de desenho próprio para o mercado brasileiro, organizada em linhas (essencial, court, volume, utility).

> **Política de catálogo:** a loja não vende produtos com marcas registradas de terceiros. Cadastre só produtos de marca própria, peças sem marca ou de fornecedores *white label*.

> "nada mais" é um nome provisório. Troque em `src/config/site.ts` e tudo acompanha.

## Stack

- Next.js 16 (App Router, Cache Components) + TypeScript estrito
- Tailwind CSS v4 + shadcn/ui (Base UI), customizado pelo design system
- Motion (Framer Motion) para animações pontuais
- Zustand (sacola persistida no navegador)
- Mercado Pago — Payment Brick (Pix, cartão e boleto) + webhook
- zod (validação no cliente e no servidor)
- Supabase: Postgres (via Prisma 7) e Auth (login com senha, link mágico e Google opcional)

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

Sem banco configurado, a vitrine usa o catálogo mock (`src/data/products.ts`) e o checkout fica desativado.

## Banco de dados e login (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. Em **Connect → ORMs → Prisma**, copie `DATABASE_URL` (porta 6543) e `DIRECT_URL` (porta 5432) para o `.env.local`.
3. Em **Project Settings → API**, copie a URL e a *publishable/anon key* para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Crie as tabelas e carregue o catálogo:

   ```bash
   pnpm db:setup     # prisma migrate deploy + seed (25 produtos)
   ```

5. Em **Authentication → URL Configuration**, defina **Site URL** = `NEXT_PUBLIC_SITE_URL` e adicione `http://localhost:3000/auth/callback` (e a URL de produção) em **Redirect URLs**. Sem isso, os links de e-mail não voltam para o site.
6. Opcional: **Authentication → Providers → Google** e `NEXT_PUBLIC_AUTH_GOOGLE=on`.

Outros comandos: `pnpm db:migrate` (só migrações), `pnpm db:seed` (só catálogo, idempotente), `pnpm db:studio` (navegar no banco).

**Segurança:** todas as tabelas têm RLS ligada e nenhuma política, então a API REST pública do Supabase (chave anon/publishable) não lê nem escreve nada. O app acessa o banco só pelo servidor, via Prisma. As ações da conta sempre filtram pelo usuário da sessão. O estoque é reservado na criação do pedido com decremento condicional (evita vender a mesma última unidade duas vezes) e devolvido se o pagamento for recusado ou cancelado.

## Checkout e Mercado Pago

Fluxo: sacola lateral → `/checkout` (dados → entrega → pagamento) → `/pedido/[id]`.

- **Modo demonstração** (padrão, sem credenciais): o pedido é criado e o pagamento é simulado. Nada é cobrado. Em `pnpm dev` a página do pedido mostra "simular pagamento aprovado".
- **Sandbox**: preencha `NEXT_PUBLIC_MP_PUBLIC_KEY` e `MP_ACCESS_TOKEN` com as **credenciais de teste** da sua aplicação no [painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel/app). O checkout passa a usar o Payment Brick.
  - Cartões e CPF de teste: na [documentação do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs), procure "cartões de teste" em Checkout Bricks. O nome do titular define o resultado (ex.: `APRO` aprova, `OTHE` recusa).
  - "10x sem juros" precisa estar ativado na sua conta (Seu negócio › Custos › Parcelamento sem juros); senão o Brick mostra juros.
- **Webhook**: configure `https://SEU_DOMINIO/api/webhooks/mercadopago` no painel (evento *Pagamentos*) e copie a assinatura secreta para `MP_WEBHOOK_SECRET`. Localmente, use um túnel https (ex.: `cloudflared tunnel --url http://localhost:3000`) e coloque a URL em `NEXT_PUBLIC_SITE_URL`.

Segurança: o navegador só envia produto, tamanho e quantidade. Preço, estoque, frete e desconto são recalculados no servidor (`src/server/pricing.ts`), a cobrança usa o id do pedido como chave de idempotência, e o webhook valida a assinatura e consulta o pagamento na API antes de mudar o status.

**Provisório:** o frete vem de uma tabela por região (`src/lib/shipping.ts`). Para produção, troque `quoteShipping` por Melhor Envio, Correios ou Frenet.

## Estrutura

```
docs/                 design system (fonte única da verdade visual) e créditos de imagens
public/images/        fotos de produto e recorte do hero
src/app/              rotas: home, /catalogo, /produto/[slug], /carrinho, /checkout, /pedido/[id], /entrar, /cadastro, /conta/*, /api/*
src/components/       ui/ (shadcn customizado), layout/, product/, catalog/, home/, search/, cart/, checkout/, order/
src/config/site.ts    nome, textos, parcelas, desconto Pix, frete grátis
src/data/             catálogo mock
src/lib/              formatação BRL, CPF/telefone/CEP, esquemas zod, frete, filtros, tamanhos
src/server/           db (Prisma), auth, catálogo, preço autoritativo, pedidos, Mercado Pago
prisma/               schema, migrações e seed
src/store/            sacola e rascunho do checkout (Zustand)
```

## Design

Tudo segue [docs/design-system.md](docs/design-system.md). A página `/design-system` mostra os tokens e componentes nos temas claro e escuro.

## Imagens

As fotos são do Unsplash e servem só para desenvolvimento. Veja [docs/creditos-imagens.md](docs/creditos-imagens.md).
