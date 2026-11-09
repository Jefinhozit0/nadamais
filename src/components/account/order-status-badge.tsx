import type { OrderStatus } from "@/server/orders";
import { cn } from "@/lib/utils";

const labels: Record<OrderStatus, string> = {
  aguardando_pagamento: "aguardando pagamento",
  pago: "pago",
  recusado: "recusado",
  cancelado: "cancelado",
  em_separacao: "em separação",
  enviado: "enviado",
  entregue: "entregue",
};

const tones: Record<OrderStatus, string> = {
  aguardando_pagamento: "border-ink",
  pago: "border-success text-success",
  em_separacao: "border-success text-success",
  enviado: "border-success text-success",
  entregue: "border-line-soft text-mute-strong",
  recusado: "border-drop text-drop",
  cancelado: "border-drop text-drop",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full border bg-canvas px-2.5 font-mono text-micro", tones[status])}>
      {labels[status]}
    </span>
  );
}
