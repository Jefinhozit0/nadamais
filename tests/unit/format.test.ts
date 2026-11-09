import { describe, expect, it } from "vitest";
import { discountPercent, formatBRL, formatInstallments, maskCep, pixPrice } from "@/lib/format";
import { compareSizes, convertSneakerSize } from "@/lib/sizes";
import { slugify } from "@/lib/admin-schema";

// Intl usa espaço não separável entre "R$" e o valor
const nbsp = (s: string) => s.replace(/ /g, " ");

describe("formatação de preço", () => {
  it("formata centavos em reais", () => {
    expect(nbsp(formatBRL(38990))).toBe("R$ 389,90");
    expect(nbsp(formatBRL(0))).toBe("R$ 0,00");
  });

  it("parcela sem juros arredondando o centavo para cima", () => {
    expect(nbsp(formatInstallments(38990))).toBe("10x de R$ 38,99");
    expect(nbsp(formatInstallments(10001, 10))).toBe("10x de R$ 10,01");
  });

  it("desconto Pix de 5%", () => {
    expect(pixPrice(10000)).toBe(9500);
    expect(pixPrice(38990)).toBe(37041);
  });

  it("percentual de desconto só quando o preço 'de' é maior", () => {
    expect(discountPercent(7500, 10000)).toBe(25);
    expect(discountPercent(10000, 10000)).toBe(0);
    expect(discountPercent(12000, 10000)).toBe(0);
  });

  it("máscara de CEP", () => {
    expect(maskCep("01310100")).toBe("01310-100");
    expect(maskCep("01310")).toBe("01310");
    expect(maskCep("01.310-100xx9")).toBe("01310-100");
  });
});

describe("tamanhos", () => {
  it("converte numeração BR para US/EU", () => {
    expect(convertSneakerSize("40", "us")).toBe("8.5");
    expect(convertSneakerSize("40", "eu")).toBe("42");
    expect(convertSneakerSize("40", "br")).toBe("40");
    expect(convertSneakerSize("99", "us")).toBe("99");
  });

  it("ordena roupas PP→XGG e tênis numericamente", () => {
    expect(["G", "PP", "XGG", "M"].sort(compareSizes)).toEqual(["PP", "M", "G", "XGG"]);
    expect(["42", "38", "40"].sort(compareSizes)).toEqual(["38", "40", "42"]);
  });
});

describe("slugify", () => {
  it("remove acentos, espaços e símbolos", () => {
    expect(slugify("  Moletom Heavy — Grafite Ação! ")).toBe("moletom-heavy-grafite-acao");
  });
});
