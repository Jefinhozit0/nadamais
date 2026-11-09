import { expect, test } from "@playwright/test";

const PRODUCT = "/produto/court-low-branco";

test("home carrega e leva ao catálogo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/catalogo?categoria=sneakers");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('a[href^="/produto/"]').first()).toBeVisible();
});

test("ordenação do catálogo vai para a URL", async ({ page }) => {
  await page.goto("/catalogo");
  await page.getByRole("combobox", { name: /ordenar/ }).selectOption("menor-preco");
  await expect(page).toHaveURL(/ordem=menor-preco/);
});

test("produto exige tamanho, adiciona à sacola e chega ao pagamento", async ({ page }) => {
  await page.goto(PRODUCT);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const add = page.getByRole("button", { name: "adicionar à sacola" });
  await add.click();
  await expect(page.getByText("Escolha um tamanho disponível para continuar.")).toBeVisible();

  await page.getByRole("radio", { name: "40", exact: true }).check({ force: true });
  await add.click();

  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: /finalizar compra/ }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await page.waitForLoadState("networkidle"); // checkout é client-side: espera hidratar antes de digitar

  // 1. dados
  await page.getByLabel("e-mail", { exact: true }).fill("e2e@exemplo.com.br");
  await page.getByLabel("nome completo", { exact: true }).fill("Teste Automatizado");
  await page.getByLabel("cpf", { exact: true }).fill("52998224725");
  await page.getByLabel("celular", { exact: true }).fill("11912345678");
  await page.getByRole("button", { name: "continuar para entrega" }).click();

  // 2. entrega (endereço preenchido à mão: não depende do ViaCEP estar no ar)
  await page.getByLabel("cep", { exact: true }).fill("01310100");
  await expect(page.getByRole("radio", { name: /econômica/ })).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("rua", { exact: true }).fill("Avenida Paulista");
  await page.getByLabel("número", { exact: true }).fill("1000");
  await page.getByLabel("bairro", { exact: true }).fill("Bela Vista");
  await page.getByLabel("cidade", { exact: true }).fill("São Paulo");
  await page.getByLabel("uf", { exact: true }).selectOption("SP");
  await page.getByRole("radio", { name: /expressa/ }).check();
  await page.getByRole("button", { name: "continuar para pagamento" }).click();

  // 3. pagamento: confere as formas e para aqui (não cria pedido)
  await expect(page.getByText("cartão de crédito")).toBeVisible();
  await expect(page.getByText("boleto", { exact: true })).toBeVisible();
});

test("páginas institucionais e SEO", async ({ page, request }) => {
  for (const path of ["/sobre", "/trocas-e-devolucoes", "/privacidade", "/faq"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
  }
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/produto/court-low-branco");

  await page.goto(PRODUCT);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(ld["@graph"][0]).toMatchObject({ "@type": "Product", offers: { priceCurrency: "BRL" } });
});

test("conta exige login", async ({ page }) => {
  await page.goto("/conta");
  await expect(page).toHaveURL(/\/entrar/);
});
