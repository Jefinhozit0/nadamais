"use client";

import { useActionState, useState } from "react";
import { updateOrderStatus, type OrderFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OrderStatus } from "@/server/orders";

const labels: Record<OrderStatus, string> = {
  aguardando_pagamento: "aguardando pagamento",
  pago: "pago",
  em_separacao: "em separação",
  enviado: "enviado",
  entregue: "entregue",
  cancelado: "cancelado (devolve estoque)",
  recusado: "recusado",
};

export function OrderStatusForm({
  id,
  status,
  allowed,
  trackingCode,
}: {
  id: string;
  status: OrderStatus;
  allowed: OrderStatus[];
  trackingCode?: string;
}) {
  const [state, action, pending] = useActionState<OrderFormState, FormData>(updateOrderStatus, {});
  const [next, setNext] = useState<OrderStatus>(status);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-card border border-line p-5">
      <input type="hidden" name="id" value={id} />
      <h2 className="font-display text-lg font-medium">atualizar pedido</h2>
      {allowed.length === 0 ? (
        <p className="text-sm text-ink-soft">Status final — nada mais a mudar.</p>
      ) : (
        <Field label="próximo status">
          {(field) => (
            <select
              {...field}
              name="status"
              value={next}
              onChange={(e) => setNext(e.target.value as OrderStatus)}
              className="h-11 w-full cursor-pointer rounded-sm border border-line-soft bg-canvas px-3 text-base hover:border-ink-soft md:text-sm"
            >
              <option value={status}>manter: {labels[status]}</option>
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}
      <Field
        label="código de rastreio"
        hint={next === "enviado" ? "Obrigatório para marcar como enviado." : "Aparece para o cliente na página do pedido."}
      >
        {(field) => <Input {...field} name="trackingCode" defaultValue={trackingCode} placeholder="AA123456789BR" className="font-mono uppercase" />}
      </Field>
      {next === "cancelado" && next !== status && (
        <p className="text-xs text-drop">Cancelar devolve as unidades ao estoque. Se já houve pagamento, faça o estorno no Mercado Pago.</p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          salvar
        </Button>
        <p role="status" className="text-sm text-success">
          {state.ok ? "Atualizado." : ""}
        </p>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-drop">
          {state.error}
        </p>
      )}
    </form>
  );
}
