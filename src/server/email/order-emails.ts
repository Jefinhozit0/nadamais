import "server-only";
import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import type { Order } from "@/server/orders";
import { renderOrderEmail, type EmailKind } from "./templates";

/**
 * Envio dos e-mails de pedido pelo Resend (API HTTP, sem SDK).
 * Sem RESEND_API_KEY + EMAIL_FROM nada sai: o histórico do admin registra "desativado".
 * Um e-mail nunca derruba o fluxo do pedido — falhas ficam no histórico para reenvio manual.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function deliver(message: { to: string; subject: string; html: string; text: string; idempotencyKey?: string }): Promise<string> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      // reenvio do mesmo envio automático (retry) não duplica a mensagem no Resend
      ...(message.idempotencyKey && { "Idempotency-Key": message.idempotencyKey }),
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(process.env.EMAIL_REPLY_TO && { reply_to: process.env.EMAIL_REPLY_TO }),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
  if (!response.ok || !body.id) throw new Error(body.message ?? body.name ?? `Resend respondeu ${response.status}`);
  return body.id;
}

export type SendResult = { status: "enviado" | "falhou" | "desativado" | "duplicado"; error?: string };

/**
 * Envia (e registra) um e-mail do pedido.
 * Automático: no máximo um por pedido e tipo (dedupeKey único), mesmo com webhooks repetidos ou simultâneos.
 * Manual (reenvio do admin): sempre envia.
 */
export async function sendOrderEmail(order: Order, kind: EmailKind, opts: { sentBy?: string } = {}): Promise<SendResult> {
  const manual = Boolean(opts.sentBy);
  const to = order.customer.email;

  if (!isEmailConfigured()) {
    await db.orderEmail.create({ data: { orderId: order.id, kind, to, status: "desativado", sentBy: opts.sentBy } });
    return { status: "desativado" };
  }

  // reserva o envio antes de mandar: quem perder a corrida pelo dedupeKey não envia
  let logId: string;
  try {
    const log = await db.orderEmail.create({
      data: { orderId: order.id, kind, to, status: "pendente", dedupeKey: manual ? null : `${order.id}:${kind}`, sentBy: opts.sentBy },
    });
    logId = log.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "duplicado" };
    throw error;
  }

  try {
    const email = renderOrderEmail(kind, order, siteUrl());
    const providerId = await deliver({ to, subject: email.subject, html: email.html, text: email.text, idempotencyKey: manual ? undefined : `${order.id}-${kind}` });
    await db.orderEmail.update({ where: { id: logId }, data: { status: "enviado", providerId } });
    return { status: "enviado" };
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
    console.error(`[email] ${kind} do pedido ${order.number} falhou`, error);
    await db.orderEmail.update({ where: { id: logId }, data: { status: "falhou", error: message } }).catch(() => {});
    return { status: "falhou", error: message };
  }
}

/** Agenda o envio para depois da resposta (webhook e admin respondem na hora). */
export function queueOrderEmail(order: Order, kind: EmailKind): void {
  const job = () =>
    sendOrderEmail(order, kind).catch((error) => {
      console.error(`[email] ${kind} do pedido ${order.number}`, error);
    });
  try {
    after(job);
  } catch {
    // fora de uma requisição (scripts): envia direto
    void job();
  }
}

export type OrderEmailLog = {
  id: string;
  kind: EmailKind;
  to: string;
  status: "pendente" | "enviado" | "falhou" | "desativado";
  error?: string;
  sentBy?: string;
  createdAt: string;
};

export async function listOrderEmails(orderId: string): Promise<OrderEmailLog[]> {
  const rows = await db.orderEmail.findMany({ where: { orderId }, orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    to: r.to,
    status: r.status,
    error: r.error ?? undefined,
    sentBy: r.sentBy ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}
