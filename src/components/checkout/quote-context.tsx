"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ShippingOption } from "@/lib/shipping";
import { useCart } from "@/store/cart";

/** Cotação do servidor (preços, estoque e frete) compartilhada entre etapas e resumo. */

export type ServerCart = {
  lines: { productId: string; size: string; quantity: number; unitPrice: number; total: number }[];
  issues: { productId: string; size: string; reason: "indisponivel" | "estoque"; available: number }[];
  subtotal: number;
};

type QuoteState = {
  cep?: string;
  options: ShippingOption[];
  cart?: ServerCart;
  loading: boolean;
  error?: string;
  /** Avisos de estoque já aplicados na sacola (para mostrar ao cliente). */
  notices: string[];
  quote: (cep: string) => Promise<{ street: string; district: string; city: string; state: string } | null>;
};

const QuoteContext = createContext<QuoteState | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const [state, setState] = useState<Omit<QuoteState, "quote">>({ options: [], loading: false, notices: [] });

  const quote = useCallback<QuoteState["quote"]>(
    async (cep) => {
      setState((s) => ({ ...s, loading: true, error: undefined }));
      try {
        const res = await fetch("/api/checkout/cotacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cep,
            items: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          address?: { street: string; district: string; city: string; state: string } | null;
          cart?: ServerCart;
          options?: ShippingOption[];
        };
        if (!res.ok || !data.cart) {
          setState((s) => ({ ...s, loading: false, options: [], error: data.error ?? "Não deu para calcular o frete." }));
          return null;
        }
        // aplica correções de estoque na sacola local
        const notices: string[] = [];
        for (const issue of data.cart.issues) {
          const line = lines.find((l) => l.productId === issue.productId && l.size === issue.size);
          if (!line) continue;
          if (issue.reason === "indisponivel") {
            remove(line.key);
            notices.push(`${line.name} (tam ${line.size}) esgotou e saiu da sacola.`);
          } else {
            setQuantity(line.key, issue.available);
            notices.push(`${line.name} (tam ${line.size}): só ${issue.available} em estoque, ajustamos a quantidade.`);
          }
        }
        setState({ cep, options: data.options ?? [], cart: data.cart, loading: false, notices });
        return data.address ?? null;
      } catch {
        setState((s) => ({ ...s, loading: false, error: "Sem conexão para calcular o frete. Tente de novo." }));
        return null;
      }
    },
    [lines, remove, setQuantity],
  );

  // sacola mudou depois da cotação (quantidade, remoção): recota com o mesmo CEP
  const signature = lines.map((l) => `${l.key}:${l.quantity}`).join("|");
  const lastSignature = useRef(signature);
  useEffect(() => {
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    if (!state.cep || lines.length === 0) return;
    const cep = state.cep;
    // espera o cliente parar de mexer na quantidade antes de recotar
    const timer = window.setTimeout(() => void quote(cep), 300);
    return () => window.clearTimeout(timer);
  }, [signature, state.cep, lines.length, quote]);

  return <QuoteContext.Provider value={{ ...state, quote }}>{children}</QuoteContext.Provider>;
}

export function useQuote(): QuoteState {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote precisa de <QuoteProvider>");
  return ctx;
}
