import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { quoteShipping } from "@/lib/shipping";

const tenis = [{ category: "sneakers" as const, quantity: 1 }];

describe("frete por CEP", () => {
  it("cota econômica e expressa pela região (1º dígito do CEP)", () => {
    const [eco, exp] = quoteShipping("01310100", tenis, 10000);
    expect(eco).toMatchObject({ method: "economica", price: 1790, days: 3, free: false });
    expect(exp).toMatchObject({ method: "expressa", price: 2990, days: 1 });
  });

  it("regiões mais distantes custam mais e demoram mais", () => {
    const [spEco] = quoteShipping("01310100", tenis, 10000);
    const [norteEco] = quoteShipping("69000000", tenis, 10000);
    expect(norteEco!.price).toBeGreaterThan(spEco!.price);
    expect(norteEco!.days).toBeGreaterThan(spEco!.days);
  });

  it("peso extra cobra por kg acima do primeiro", () => {
    const [um] = quoteShipping("01310100", [{ category: "roupas", quantity: 1 }], 10000);
    const [tres] = quoteShipping("01310100", [{ category: "sneakers", quantity: 3 }], 10000);
    expect(um!.price).toBe(1490);
    expect(tres!.price).toBe(1490 + 300 * 4); // 4,2 kg → 5 kg → 4 kg extras
  });

  it(`frete grátis na econômica a partir de ${siteConfig.freeShippingFrom / 100} reais e expressa com desconto`, () => {
    const [eco, exp] = quoteShipping("01310100", tenis, siteConfig.freeShippingFrom);
    expect(eco).toMatchObject({ price: 0, free: true });
    expect(exp!.price).toBe(2990 - 1790);
  });

  it("logo abaixo do mínimo ainda cobra", () => {
    const [eco] = quoteShipping("01310100", tenis, siteConfig.freeShippingFrom - 1);
    expect(eco!.free).toBe(false);
  });
});
