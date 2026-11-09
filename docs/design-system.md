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
| `drop-soft`      | `#E7C3C6` | Fundo de badges com acento                                      |
| `success`        | `#2F6B4F` | Estoque ok, pagamento aprovado                                  |
| `danger`         | `#B23A48` | Erros (mesmo tom do acento — coerência)                         |

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
- `display-xl` clamp(3.5rem, 11vw, 10rem) / 0.9
- `display-lg` clamp(2.5rem, 6vw, 5rem) / 0.95
- `h1` clamp(1.75rem, 3vw, 2.5rem) / 1.1 — ex.: "Clothes without excess. Only style."
- `h2` 1.5rem / 1.2
- `body` 0.9375rem / 1.5
- `small` 0.75rem / 1.4 — parágrafo descritivo da referência
- `micro` 0.6875rem / 1.3, uppercase opcional, tracking +0.04em

Regras:
- Navegação, botões e labels em **minúsculas** (assinatura da referência).
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
- **Chip de tamanho:** pill; disponível = borda `ink`; esgotado = `line-soft` + texto riscado; selecionado = sólido `ink`.

## 8. Movimento (Framer Motion)

- Duração 200–450ms, easing `[0.22, 1, 0.36, 1]`.
- Entradas: fade + translateY 12px. Título hero: revelação por máscara, palavra a palavra.
- Imagem hero: leve parallax (≤ 20px) no scroll.
- Respeitar `prefers-reduced-motion` (desliga tudo exceto opacidade).

## 9. Não fazer

- Fundo preto/dark como padrão (a referência é clara).
- Gradientes coloridos, glassmorphism, sombras pesadas, neon.
- Mais de um acento de cor.
- CAIXA ALTA em blocos longos; fontes condensadas (a referência é *extended*).
- Grids "template" perfeitamente simétricos em seções de destaque.
