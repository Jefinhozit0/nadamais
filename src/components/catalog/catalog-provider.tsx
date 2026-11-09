"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CatalogNav = { pending: boolean; navigate: (href: string) => void };

const CatalogContext = createContext<CatalogNav | null>(null);

/** Navegação dos filtros em transição: a grade antiga continua visível (esmaecida) até a nova chegar. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <CatalogContext.Provider
      value={{
        pending,
        navigate: (href) => startTransition(() => router.push(href, { scroll: false })),
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalogNav(): CatalogNav {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalogNav precisa de <CatalogProvider>");
  return ctx;
}

export function CatalogResultsArea({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useCatalogNav();
  return (
    <div
      aria-busy={pending}
      className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50", className)}
    >
      {children}
    </div>
  );
}
