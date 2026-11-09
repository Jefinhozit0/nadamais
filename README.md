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
pnpm test         # testes unitários (Vitest)
pnpm test:e2e     # e2e + acessibilidade (Playwright; rode `pnpm build` antes)
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

### Cripto (Paymento)

Quarta forma de pagamento, ao lado de Pix, cartão e boleto. Só aparece no checkout quando `PAYMENTO_API_KEY` e `PAYMENTO_SECRET_KEY` estão definidas.

1. Crie a conta em [app.paymento.io](https://app.paymento.io), configure as carteiras/moedas aceitas e copie a **API Key** e a **Secret Key**.
2. Coloque as duas no `.env.local` e nas variáveis da Vercel.
3. Depois do deploy, registre o IPN: `pnpm paymento:setup https://SEU_DOMINIO` (aponta para `/api/webhooks/paymento`).

Fluxo: o pedido é criado (estoque reservado) → a loja pede um token à Paymento com o total **em BRL** → o cliente paga na página da Paymento → a Paymento chama o IPN → a loja valida a assinatura HMAC, confirma com `/verify` e só então marca como pago. Expirou ou foi cancelado: o pedido é cancelado e o estoque volta. Um pedido pago nunca volta para não pago; se alguém pagar depois do cancelamento, o admin vê um aviso no pedido. O link de pagamento vale 2 horas.

Testes: a Paymento não tem sandbox; use as redes de teste (Bitcoin testnet, Ethereum Sepolia, Tron Shasta) — veja "Testing and Simulation" na documentação deles.

**Provisório:** o frete vem de uma tabela por região (`src/lib/shipping.ts`). Para produção, troque `quoteShipping` por Melhor Envio, Correios ou Frenet.

## Testes

- **Unitários** (`pnpm test`, `tests/unit/`): CPF/telefone/CEP, preço e parcelas, tamanhos, frete por CEP, filtros e ordenação do catálogo, preço autoritativo do pedido (estoque, desconto Pix) e validação do checkout. Não precisam de banco.
- **E2E** (`pnpm test:e2e`, `tests/e2e/`): sobe o build de produção na porta 4310 (mude com `E2E_PORT`) e testa em desktop e celular: catálogo, produto → sacola → checkout até a etapa de pagamento, páginas institucionais, SEO e proteção da conta. **Não cria pedidos nem contas**, então pode rodar contra o banco real.
- **Acessibilidade** (dentro do e2e): axe-core verifica WCAG 2.2 A/AA em 9 páginas, nos temas claro e escuro.

Na primeira vez: `pnpm exec playwright install chromium`.

## SEO e páginas institucionais

- `/sobre`, `/trocas-e-devolucoes`, `/privacidade` (LGPD) e `/faq`. Dados da empresa (razão social, CNPJ, endereço, e-mails) ficam em `siteConfig.legal`, hoje com **valores provisórios**.
- `sitemap.xml` (páginas e produtos, com imagens), `robots.txt` (bloqueia admin, conta, checkout, pedido e API), imagem de compartilhamento padrão (`src/app/opengraph-image.tsx`), canonical por página e JSON-LD (Product com preço/estoque/política de troca, BreadcrumbList e FAQPage).

## Antes de lançar

- [ ] Preencher `siteConfig.legal` (razão social, CNPJ, endereço, e-mails) e o nome definitivo da loja.
- [ ] Revisar `/privacidade` e `/trocas-e-devolucoes` com um profissional jurídico.
- [ ] Trocar as fotos do Unsplash por fotos próprias dos produtos.
- [ ] Credenciais de **produção** do Mercado Pago + webhook apontando para o domínio.
- [ ] Frete real (Melhor Envio, Correios ou Frenet) no lugar da tabela.
- [ ] SMTP próprio no Supabase (Authentication → Emails): o embutido manda poucos e-mails por hora.
- [ ] Gerar novas chaves/senha do Supabase se alguma já foi exposta fora do `.env.local`.

## Deploy (Vercel)

1. Importe o repositório na Vercel (framework detectado: Next.js; o build já roda `prisma generate`).
2. Em **Settings → Environment Variables**, cadastre as mesmas variáveis do `.env.example`, com `NEXT_PUBLIC_SITE_URL` = domínio final (ex.: `https://sualoja.com.br`).
3. Migrações não rodam no build: aplique com `pnpm db:migrate` (usa `DIRECT_URL`) antes de publicar uma versão que mude o schema.
4. No Supabase, em **Authentication → URL Configuration**: Site URL = domínio final e `https://SEU_DOMINIO/auth/callback` em Redirect URLs.
5. No Mercado Pago, aponte o webhook para `https://SEU_DOMINIO/api/webhooks/mercadopago`.
6. Depois do primeiro deploy: envie `https://SEU_DOMINIO/sitemap.xml` no Google Search Console.

## Estrutura

```
docs/                 design system (fonte única da verdade visual) e créditos de imagens
public/images/        fotos de produto e recorte do hero
src/app/              rotas: home, /catalogo, /produto/[slug], /carrinho, /checkout, /pedido/[id], /entrar, /cadastro, /conta/*, /admin/*, /api/*,
                      (institucional)/ sobre, trocas, privacidade, faq; sitemap, robots, opengraph-image
src/components/       ui/ (shadcn customizado), layout/, product/, catalog/, home/, search/, cart/, checkout/, order/, account/, admin/, content/, seo/
tests/                unit/ (Vitest) e e2e/ (Playwright + axe)
src/config/site.ts    nome, textos, parcelas, desconto Pix, frete grátis
src/data/             catálogo mock
src/lib/              formatação BRL, CPF/telefone/CEP, esquemas zod, frete, filtros, tamanhos
src/server/           db (Prisma), auth, catálogo, preço autoritativo, pedidos, Mercado Pago
prisma/               schema, migrações e seed
src/store/            sacola e rascunho do checkout (Zustand)
```

## Painel admin (`/admin`)

1. Crie sua conta na loja (`/cadastro`) e entre uma vez.
2. Promova a conta: `pnpm admin:grant voce@email.com` (para remover: `--revoke`).
3. Acesse `/admin` (também aparece um atalho em `/conta`).

O que dá para fazer:
- **Visão geral:** pedidos de hoje, aguardando pagamento, a separar/enviar, receita do mês e tamanhos com estoque baixo.
- **Produtos:** criar, editar, arquivar/reativar (nunca apaga, para não quebrar pedidos antigos), estoque por tamanho e até 8 fotos.
- **Pedidos:** filtros por status, busca por nº/nome/e-mail e mudança de status com transições permitidas (aguardando → pago → em separação → enviado → entregue). "Enviado" exige código de rastreio, que aparece para o cliente; "cancelado" devolve o estoque.
- **Fotos:** o upload converte para WebP (até 1600px), remove metadados (EXIF/GPS) e envia ao Supabase Storage (bucket público `produtos`, criado no primeiro upload). Exige `SUPABASE_SECRET_KEY` no servidor.

Segurança: quem não é admin recebe 404 (o painel não se anuncia), e toda página, Server Action e rota de upload confere o papel de novo. Edições de produto atualizam a vitrine na hora.

## Design

Tudo segue [docs/design-system.md](docs/design-system.md). A página `/design-system` mostra os tokens e componentes nos temas claro e escuro.

## Imagens

As fotos são do Unsplash e servem só para desenvolvimento. Veja [docs/creditos-imagens.md](docs/creditos-imagens.md).
