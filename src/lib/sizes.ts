/**
 * Conversão de numeração de tênis (referência masculina, padrão de mercado BR).
 * Varia por marca/forma — a página de produto deixa isso claro ao cliente.
 */
const sneakerTable: Record<string, { us: string; eu: string }> = {
  "34": { us: "4", eu: "36" },
  "35": { us: "4.5", eu: "36.5" },
  "36": { us: "5.5", eu: "38" },
  "37": { us: "6", eu: "38.5" },
  "38": { us: "7", eu: "40" },
  "39": { us: "7.5", eu: "40.5" },
  "40": { us: "8.5", eu: "42" },
  "41": { us: "9", eu: "42.5" },
  "42": { us: "10", eu: "44" },
  "43": { us: "11", eu: "45" },
  "44": { us: "12", eu: "46" },
  "45": { us: "13", eu: "47.5" },
};

export type SizeNotation = "br" | "us" | "eu";

export const sizeNotations: readonly SizeNotation[] = ["br", "us", "eu"];

export function convertSneakerSize(br: string, to: SizeNotation): string {
  if (to === "br") return br;
  return sneakerTable[br]?.[to] ?? br;
}

export const apparelSizeOrder = ["PP", "P", "M", "G", "GG", "XGG"] as const;
export const sneakerSizeOrder = Object.keys(sneakerTable);

/** Ordena rótulos de tamanho de forma natural (numérico para tênis, PP→XGG para roupas). */
export function compareSizes(a: string, b: string): number {
  const ai = apparelSizeOrder.indexOf(a as (typeof apparelSizeOrder)[number]);
  const bi = apparelSizeOrder.indexOf(b as (typeof apparelSizeOrder)[number]);
  if (ai !== -1 && bi !== -1) return ai - bi;
  const an = Number(a);
  const bn = Number(b);
  if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
  if (!Number.isNaN(an)) return -1;
  if (!Number.isNaN(bn)) return 1;
  return a.localeCompare(b);
}
