import { siteConfig } from "@/config/site";
import type { Category } from "@/types/product";
import type { ShippingMethod } from "./checkout-schema";

/**
 * Cotação de frete por tabela (origem: São Paulo/SP).
 * Simplificação deliberada para desenvolvimento: região pelo 1º dígito do CEP e
 * peso estimado por categoria. Para produção, troque `quoteShipping` por uma
 * integração (Melhor Envio, Correios, Frenet) mantendo a mesma assinatura.
 */

type Region = { name: string; base: [number, number]; perKg: [number, number]; days: [number, number] };

// [econômica, expressa] em centavos; prazos em dias úteis
const regions: Record<string, Region> = {
  "0": { name: "Grande SP", base: [1490, 2390], perKg: [300, 600], days: [3, 1] },
  "1": { name: "Interior SP", base: [1890, 2990], perKg: [400, 700], days: [4, 2] },
  "2": { name: "RJ/ES", base: [2290, 3790], perKg: [500, 900], days: [5, 2] },
  "3": { name: "MG", base: [2290, 3690], perKg: [500, 900], days: [5, 2] },
  "4": { name: "BA/SE", base: [2990, 5290], perKg: [700, 1300], days: [8, 4] },
  "5": { name: "PE/AL/PB/RN", base: [3290, 5790], perKg: [800, 1400], days: [9, 4] },
  "6": { name: "Norte e CE/PI/MA", base: [3790, 6490], perKg: [900, 1600], days: [11, 5] },
  "7": { name: "Centro-Oeste/DF/TO", base: [2790, 4890], perKg: [600, 1200], days: [7, 3] },
  "8": { name: "PR/SC", base: [2190, 3590], perKg: [500, 900], days: [5, 2] },
  "9": { name: "RS", base: [2490, 3990], perKg: [600, 1000], days: [6, 3] },
};

const weightKg: Record<Category, number> = { sneakers: 1.4, roupas: 0.6, acessorios: 0.3 };

export type ShippingOption = {
  method: ShippingMethod;
  label: string;
  /** Centavos. */
  price: number;
  days: number;
  free: boolean;
};

export function quoteShipping(
  cep: string,
  items: readonly { category: Category; quantity: number }[],
  subtotal: number,
): ShippingOption[] {
  const region = regions[cep.charAt(0)] ?? regions["6"]!;
  const kg = Math.max(0.3, items.reduce((sum, i) => sum + weightKg[i.category] * i.quantity, 0));
  const extraKg = Math.max(0, Math.ceil(kg) - 1);
  const freeEligible = subtotal >= siteConfig.freeShippingFrom;

  const economica = region.base[0] + region.perKg[0] * extraKg;
  const expressa = region.base[1] + region.perKg[1] * extraKg;

  return [
    {
      method: "economica",
      label: "econômica",
      price: freeEligible ? 0 : economica,
      days: region.days[0],
      free: freeEligible,
    },
    {
      method: "expressa",
      label: "expressa",
      // acima do mínimo, a expressa ganha o valor da econômica como desconto
      price: freeEligible ? Math.max(0, expressa - economica) : expressa,
      days: region.days[1],
      free: false,
    },
  ];
}
