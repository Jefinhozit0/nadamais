import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/server/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Só renderiza o painel para admin. Cada página e ação checa de novo (defesa em profundidade). */
async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminNav />
      <div className="mt-8">{children}</div>
    </>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-8 pb-8 md:px-8 md:pt-10">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-haze" aria-label="Carregando painel" />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}
