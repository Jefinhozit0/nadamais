# Design System — Fonte única de verdade visual

> Extraído de `refencias/estetica.jpg`. Qualquer decisão visual do projeto deve partir daqui.
> Em caso de conflito entre este documento e qualquer outra referência, **este documento vence**.

## 1. Clima geral

Editorial, galeria de moda, "lookbook impresso". Claro, quente e silencioso — o produto (ou o modelo) é o único elemento escuro e pesado da tela. Streetwear tratado com o rigor de uma marca de luxo minimalista: pouca coisa na tela, cada uma no lugar certo.

Palavras-chave: **off-white · moldura · tipografia larga · grão · recorte de produto · contenção**.

## 2. Paleta

| Token            | Hex       | Uso                                                             |
|------------------|-----------|-----------------------------------------------------------------|
| `paper`          | `#F3F0EE` | Fundo da página (fora da moldura)                               |
| `canvas`         | `#FAF8F7` | Fundo interno da moldura / superfícies principais               |
| `haze`           | `#E4E0DE` | Brilho radial atrás do produto/modelo, skeletons                |
| `ink`            | `#121212` | Texto principal, bordas, botões sólidos, ícones                 |
| `ink-soft`       | `#3A3A3A` | Texto de corpo longo                                            |
| `mute`           | `#A9A6A4` | Links de navegação inativos, metadados, placeholders            |
| `line`           | `#121212` | Bordas finas (1px) da moldura, cards e pills                    |
| `line-soft`      | `#D6D2CF` | Divisórias secundárias, inputs em repouso                       |
| `drop` (acento)  | `#B23A48` | Único acento: selo "drop", badge "últimas unidades", foco ativo |
| `drop-soft`      | `#F7EAEB` | Fundo de badges com acento (texto `drop` sobre ele = 5:1)       |
| `success`        | `#2F6B4F` | Estoque ok, pagamento aprovado                                  |
| `danger`         | `#B23A48` | Erros (mesmo tom do acento — coerência)                         |

### Tema escuro

Mesma estrutura e mesmos nomes de token, valores invertidos. A ideia é "a mesma loja à noite", sem neon, sem azul e sem preto absoluto. O grão fica um pouco mais fraco.

| Token         | Claro     | Escuro    |
|---------------|-----------|-----------|
| `paper`       | `#F3F0EE` | `#0B0B0B` |
| `canvas`      | `#FAF8F7` | `#141413` |
| `haze`        | `#E4E0DE` | `#262524` |
| `ink`         | `#121212` | `#F1EEEC` |
| `ink-soft`    | `#3A3A3A` | `#C9C5C2` |
| `mute`        | `#A9A6A4` | `#7C7976` |
| `mute-strong` | `#6E6B69` | `#A19D9A` |
| `line-soft`   | `#D6D2CF` | `#2F2D2C` |
| `drop`        | `#B23A48` | `#DA5F6B` |
| `drop-soft`   | `#F7EAEB` | `#2A1518` |
| `success`     | `#2F6B4F` | `#6FBF96` |

- Ativação: classe `.dark` no `<html>`. **Exceção aprovada à regra §9:** na primeira visita vale a preferência do sistema operacional; depois, a escolha do usuário (salva em `localStorage`). Um script inline aplica o tema antes do primeiro paint, então não há flash.
- O `drop` escuro é mais claro para manter contraste AA (≥ 4.5:1) sobre `canvas`.
- Fotos de produto com fundo removido funcionam nos dois temas. Fotos com fundo branco "chapado" devem receber `mix-blend-multiply` no claro e ficar dentro de um card `haze` no escuro.

Regras:
- O acento vermelho-carmim vem da estampa da jaqueta da referência. Usar com **parcimônia** (≤ 5% da tela).
- Nada de gradientes coloridos. O único "gradiente" permitido é o halo radial `haze → canvas` atrás de imagens de destaque.
- Contraste: `ink` sobre `canvas` = 18.6:1; `mute` só para texto ≥ 18px ou não essencial (falha AA em texto pequeno — para metadados pequenos usar `#6E6B69`, token `mute-strong`).

## 3. Tipografia

A referência usa uma grotesca **geométrica e larga (extended)**, com títulos gigantes em peso semibold e navegação em minúsculas.

| Papel              | Google Font (mais próxima) | Peso    | Observações                                         |
|--------------------|----------------------------|---------|-----------------------------------------------------|
| Display / títulos  | **Unbounded**              | 500–700 | Hero em `clamp(3.5rem, 11vw, 10rem)`, tracking -0.02em, textura de grão |
| Interface / corpo  | **Lexend Exa**             | 400–500 | Nav, botões, parágrafos curtos. Sempre minúsculas na nav |
| Dados / técnicos   | **JetBrains Mono**         | 400     | SKU, preço em listas, "account id · 003.201", tamanhos |

Escala (mobile → desktop):
- `display-xl` clamp(3.25rem, 11vw, 10rem) / 0.9, tracking -0.03em
- `display-lg` clamp(2.5rem, 6vw, 5rem) / 0.95
- `h1` clamp(1.75rem, 3vw, 2.5rem) / 1.1 — ex.: "Clothes without excess. Only style."
- `h2` 1.5rem / 1.2
- `body` 0.9375rem / 1.5
- `small` 0.75rem / 1.4 — parágrafo descritivo da referência
- `micro` 0.75rem / 1.3 (12px: mínimo para metadados), tracking +0.04em

Regras:
- Navegação, botões e labels em **minúsculas** (assinatura da referência). Itens inativos da nav usam `mute-strong` (o `mute` da referência falha AA em texto pequeno).
- Títulos de produto em minúsculas ou sentence case, nunca CAIXA ALTA total.
- Parágrafos curtos, no máximo ~45 caracteres por linha em blocos descritivos.

## 4. Layout e espaçamento

- **Moldura (frame):** todo o conteúdo principal vive dentro de um container com borda `1px ink`, `border-radius: 20px`, afastado da viewport por `12px` (mobile) / `20px` (desktop). É o elemento mais reconhecível da estética.
- **Grid:** 12 colunas no desktop, 4 no mobile, gutter 16/24px. Composições **assimétricas**: texto ancorado nos cantos (inferior-esquerdo, superior-direito), imagem central sobrepondo a tipografia.
- **Sobreposição:** a imagem do produto/modelo fica *entre* as palavras do título gigante (palavras nas laterais, imagem no meio).
- **Cantos como informação:** canto superior-esquerdo = logo; superior-direito = dado técnico (conta/carrinho); inferior-esquerdo = manifesto; inferior-direito = card de chamada.
- **Espaço negativo:** muito. Seções separadas por 96–160px no desktop, 64px no mobile.
- Escala de espaçamento: base 4px → 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160.

## 5. Raios, bordas, sombras

| Token        | Valor  | Uso                                  |
|--------------|--------|--------------------------------------|
| `radius-frame` | 20px | Moldura principal                    |
| `radius-card`  | 16px | Cards de produto, drawer             |
| `radius-pill`  | 999px | Botões, chips de filtro, tamanhos   |
| `radius-sm`    | 8px  | Inputs, thumbnails                   |

- Bordas: sempre **1px `ink`** em elementos de destaque; `line-soft` em elementos secundários.
- **Sem sombras** (drop shadows). Profundidade vem do halo radial e da sobreposição.

## 6. Texturas e elementos gráficos

- **Grão/ruído** sutil sobre títulos display (SVG `feTurbulence` como máscara, opacidade ~0.15) e opcionalmente sobre o fundo `paper`.
- **Halo radial** cinza (`haze`) atrás de recortes de produto: `radial-gradient(ellipse at center, #E4E0DE 0%, transparent 65%)`.
- **Recortes:** fotos de produto com fundo removido (PNG/WebP transparente) sempre que possível; quando não, fundo `canvas` puro.
- **Ornamento:** cluster de asteriscos/estrelas (✳) junto ao logo — usar como marca d'água pequena e em loaders.
- **Ícones:** linha 1.5px, cantos arredondados, contidos em quadrado com borda (como o ícone de reciclagem da referência). Biblioteca: Lucide, stroke 1.5.
- **Seta diagonal ↗** em links/CTAs ("new collection ↗").

## 7. Componentes-assinatura

- **Botão pill outline:** borda 1px `ink`, fundo transparente, texto minúsculo Lexend Exa, seta ↗ opcional. Hover: inverte (fundo `ink`, texto `canvas`).
- **Botão sólido:** fundo `ink`, texto `canvas`. Uso: "adicionar à sacola", "finalizar".
- **Card de produto:** borda 1px `ink`, raio 16px, imagem recortada sobre `canvas`, ano/drop em mono embaixo (como "2025" na referência), nome + preço em linha.
- **Nav:** item ativo em `ink` peso 500, inativos em `mute`; tudo minúsculo e espaçado.
- **Chip de tamanho:** pill de 44px, radio nativo; disponível = borda `ink`; esgotado = `line-soft` + texto riscado; selecionado = sólido `ink`; últimas unidades = ponto `drop` no canto.
- **Campo:** 44px, raio 8px, borda `line-soft`; foco = contorno 2px `ink`; erro = borda `drop` + mensagem dizendo o problema e a solução.
- **Área de toque:** mínimo 44px em tudo que é clicável (pseudo-elemento quando o visual é menor).

## 8. Movimento (Framer Motion)

- Duração 200–450ms, easing `[0.22, 1, 0.36, 1]`.
- Entradas: fade + translateY 12px. Título hero: revelação por máscara, palavra a palavra.
- Imagem hero: leve parallax (≤ 20px) no scroll.
- Respeitar `prefers-reduced-motion` (desliga tudo exceto opacidade).

## 9. Não fazer

- Forçar o tema escuro como padrão. O claro é a identidade; o escuro só aparece por preferência do sistema ou escolha do usuário.
- Gradientes coloridos, glassmorphism, sombras pesadas, neon.
- Mais de um acento de cor.
- CAIXA ALTA em blocos longos; fontes condensadas (a referência é *extended*).
- Grids "template" perfeitamente simétricos em seções de destaque.
