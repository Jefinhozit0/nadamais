import { ResendEmailForm } from "@/components/admin/resend-email-form";
import { cn } from "@/lib/utils";
import { isEmailConfigured, listOrderEmails } from "@/server/email/order-emails";
import { emailKindForStatus, emailKindLabels, type EmailKind } from "@/server/email/templates";
import type { Order } from "@/server/orders";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

const statusText = { pendente: "enviando", enviado: "enviado", falhou: "falhou", desativado: "não enviado (desligado)" } as const;

/** Histórico dos e-mails do pedido + reenvio manual (admin). */
export async function OrderEmails({ order }: { order: Order }) {
  const [logs, configured] = await Promise.all([listOrderEmails(order.id).catch(() => []), isEmailConfigured()]);
  const kinds = (Object.keys(emailKindLabels) as EmailKind[]).map((value) => ({ value, label: emailKindLabels[value] }));
  const suggested = emailKindForStatus(order.status) ?? (order.status === "aguardando_pagamento" ? "pedido_recebido" : "pagamento_aprovado");

  return (
    <section aria-labelledby="emails-admin" className="flex flex-col gap-4 rounded-card border border-line-soft p-5">
      <h2 id="emails-admin" className="font-display text-lg font-medium">
        e-mails ao cliente
      </h2>
      {!configured && (
        <p className="text-xs text-ink-soft">
          Envio desligado: falta configurar <code className="font-mono">RESEND_API_KEY</code> e <code className="font-mono">EMAIL_FROM</code> (veja o README).
        </p>
      )}
      {logs.length === 0 ? (
        <p className="text-sm text-ink-soft">Nenhum e-mail ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-soft text-sm">
          {logs.map((log) => (
            <li key={log.id} className="py-2.5 first:pt-0">
              <div className="flex items-baseline justify-between gap-3">
                <span>{emailKindLabels[log.kind]}</span>
                <span className="shrink-0 font-mono text-xs text-mute-strong tabular-nums">{dateFmt.format(new Date(log.createdAt))}</span>
              </div>
              <p className={cn("mt-0.5 font-mono text-xs", log.status === "falhou" ? "text-drop" : log.status === "enviado" ? "text-success" : "text-mute-strong")}>
                {statusText[log.status]}
                {log.sentBy ? ` · reenviado por ${log.sentBy}` : ""}
                {log.error ? ` · ${log.error}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      <ResendEmailForm id={order.id} kinds={kinds} suggested={suggested} />
    </section>
  );
}
