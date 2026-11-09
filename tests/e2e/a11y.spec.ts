import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Verificação automática WCAG 2.2 A/AA (axe-core) nas páginas principais, nos temas claro e escuro. */
const pages = ["/", "/catalogo", "/produto/court-low-branco", "/carrinho", "/checkout", "/entrar", "/cadastro", "/faq", "/privacidade"];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`acessibilidade (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    for (const path of pages) {
      test(path, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const summary = results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
        }));
        expect(summary).toEqual([]);
      });
    }
  });
}
