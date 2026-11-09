import { siteConfig } from "@/config/site";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Preços são sempre armazenados em centavos (inteiros) para evitar erros de ponto flutuante. */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function formatInstallments(
  cents: number,
  max: number = siteConfig.maxInstallments,
): string {
  return `${max}x de ${formatBRL(Math.ceil(cents / max))}`;
}

export function discountPercent(price: number, compareAt: number): number {
  if (compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
