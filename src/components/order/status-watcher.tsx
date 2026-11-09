"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Enquanto o pagamento está pendente (Pix/boleto), consulta o status a cada 4s
 * e atualiza a página quando muda. Em modo demonstração, oferece "simular pagamento".
 */
export function StatusWatcher({ orderId, demo }: { orderId: string; demo: boolean }) {
  const router = useRouter();
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    let stopped = false;
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/pedidos/${orderId}`, { cache: "no-store" });
        const data = (await res.json()) as { status?: string };
        if (!stopped && data.status && data.status !== "aguardando_pagamento") {
          window.clearInterval(timer);
          router.refresh();
        }
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, 4000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [orderId, router]);

  if (!demo) {
    return <p className="font-mono text-micro text-mute-strong">esta página atualiza sozinha quando o pagamento cair.</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="outline"
        size="sm"
        loading={simulating}
        onClick={async () => {
          setSimulating(true);
          await fetch(`/api/pedidos/${orderId}`, { method: "POST" });
          router.refresh();
        }}
      >
        simular pagamento aprovado
      </Button>
      <p className="font-mono text-micro text-mute-strong">modo demonstração · só aparece em desenvolvimento</p>
    </div>
  );
}
