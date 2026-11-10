"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartLine = {
  /** `${productId}:${size}` — a mesma peça em tamanhos diferentes são linhas diferentes. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  /** Marca do produto. */
  brand: string;
  size: string;
  /** Em centavos, no momento da adição (revalidado no checkout). */
  price: number;
  image?: string;
  quantity: number;
  /** Estoque disponível do tamanho quando adicionado — limita a quantidade. */
  maxQuantity: number;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "key" | "quantity">, quantity?: number) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((state) => {
          const key = `${line.productId}:${line.size}`;
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key ? { ...l, quantity: Math.min(l.quantity + quantity, l.maxQuantity) } : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, key, quantity: Math.min(quantity, line.maxQuantity) }] };
        }),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.key === key ? { ...l, quantity: Math.max(0, Math.min(quantity, l.maxQuantity)) } : l))
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "cart-v2",
      // v1: itens guardavam a "linha" da antiga marca própria; agora guardam a marca
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { lines?: (Partial<CartLine> & { line?: string })[] };
        if (version < 1 && state?.lines) {
          state.lines = state.lines.map((item) => {
            const { line, ...rest } = item;
            return { ...rest, brand: rest.brand ?? line ?? "" };
          });
        }
        return state as CartState;
      },
      storage: createJSONStorage(() => localStorage),
      // Reidratação manual após montar, para o HTML do servidor e do cliente baterem
      skipHydration: true,
    },
  ),
);

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartSubtotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}
