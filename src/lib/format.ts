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

/** "01310100" → "01310-100". Ignora tudo que não for dígito. */
export function maskCep(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function discountPercent(price: number, compareAt: number): number {
  if (compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
