import { siteConfig } from "@/config/site";
import { formatBRL } from "@/lib/format";
import { trackingUrl } from "@/lib/tracking";
import type { Order, OrderStatus } from "@/server/orders";

/**
 * Modelos dos e-mails de pedido. HTML de e-mail é outro mundo: tabelas, estilos inline,
 * fontes do sistema e só tema claro (cada cliente de e-mail inverte cores do seu jeito).
 * Funções puras (sem banco nem rede) — testadas em tests/unit/order-emails.test.ts.
 */

export type EmailKind = "pedido_recebido" | "pagamento_aprovado" | "pedido_enviado" | "pedido_entregue" | "pedido_cancelado";

export const emailKindLabels: Record<EmailKind, string> = {
  pedido_recebido: "pedido recebido (aguardando pagamento)",
  pagamento_aprovado: "pagamento aprovado",
  pedido_enviado: "pedido enviado (rastreio)",
  pedido_entregue: "pedido entregue",
  pedido_cancelado: "pedido cancelado",
};

/** Qual e-mail sai quando o pedido ENTRA em cada status (em separação não avisa: o próximo é o envio). */
export function emailKindForStatus(status: OrderStatus): EmailKind | undefined {
  switch (status) {
    case "pago":
      return "pagamento_aprovado";
    case "enviado":
      return "pedido_enviado";
    case "entregue":
      return "pedido_entregue";
    case "cancelado":
    case "recusado":
      return "pedido_cancelado";
    default:
      return undefined;
  }
}

export type RenderedEmail = { subject: string; preheader: string; html: string; text: string };

const C = {
  paper: "#f3f0ee",
  canvas: "#faf8f7",
  ink: "#121212",
  soft: "#3a3a3a",
  mute: "#6e6b69",
  line: "#d6d2cf",
};
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

function abs(base: string, path: string): string {
  return /^https?:\/\//.test(path) ? path : `${base.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

const PAID_PROVIDER_STATUSES = new Set(["approved", "authorized", "refunded", "charged_back", "Paid", "Approve", "Refunded"]);

/** O pedido chegou a ser pago? Decide o texto do cancelamento (estorno ou "nada foi cobrado"). */
export function wasPaid(order: Order): boolean {
  return order.payment.providerStatus ? PAID_PROVIDER_STATUSES.has(order.payment.providerStatus) : false;
}

/* ------------------------------------------------------------------ blocos */

type Block = { html: string; text: string };

const p = (content: string, plain: string): Block => ({
  html: `<p style="margin:0 0 16px;font:15px/1.6 ${SANS};color:${C.soft}">${content}</p>`,
  text: plain,
});

function button(label: string, href: string): Block {
  return {
    html: `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${C.ink}"><a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font:600 14px ${SANS};color:${C.canvas};text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`,
    text: `${label}: ${href}`,
  };
}

/** Caixa com um código para copiar (rastreio, Pix copia e cola). */
function codeBox(label: string, code: string, size: "lg" | "sm" = "lg"): Block {
  const font = size === "lg" ? `600 20px/1.3 ${MONO};letter-spacing:1px` : `12px/1.5 ${MONO};word-break:break-all`;
  return {
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${C.ink};border-radius:12px"><tr><td style="padding:16px 18px"><div style="font:11px ${MONO};text-transform:lowercase;color:${C.mute}">${esc(label)}</div><div style="margin-top:6px;font:${font};color:${C.ink}">${esc(code)}</div></td></tr></table>`,
    text: `${label}: ${code}`,
  };
}

function items(order: Order, base: string, opts: { review?: boolean } = {}): Block {
  const rows = order.lines
    .map((l) => {
      const img = l.image
        ? `<img src="${esc(abs(base, l.image))}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:8px;background:${C.paper}">`
        : `<div style="width:64px;height:64px;border-radius:8px;background:${C.paper}"></div>`;
      const review = opts.review
        ? `<div style="margin-top:6px"><a href="${esc(abs(base, `/produto/${l.slug}#avaliacoes`))}" style="font:13px ${SANS};color:${C.ink}">avaliar</a></div>`
        : "";
      return `<tr><td width="64" style="padding:12px 14px 12px 0;vertical-align:top">${img}</td><td style="padding:12px 0;vertical-align:top;font:14px/1.45 ${SANS};color:${C.ink}"><div style="font:11px ${MONO};color:${C.mute}">${esc(l.brand)}</div>${esc(l.name)}<div style="font:12px ${MONO};color:${C.mute}">tam ${esc(l.size)} · ${l.quantity}x</div>${review}</td><td align="right" style="padding:12px 0;vertical-align:top;font:13px ${MONO};color:${C.ink};white-space:nowrap">${formatBRL(l.total)}</td></tr>`;
    })
    .join("");
  const text = order.lines.map((l) => `- ${l.name} (${l.brand}) · tam ${l.size} · ${l.quantity}x · ${formatBRL(l.total)}`).join("\n");
  return {
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-top:1px solid ${C.line}">${rows}</table>`,
    text,
  };
}

function totals(order: Order): Block {
  const t = order.totals;
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font:${strong ? "600 " : ""}14px ${SANS};color:${strong ? C.ink : C.soft}">${label}</td><td align="right" style="padding:4px 0;font:${strong ? "600 " : ""}13px ${MONO};color:${C.ink}">${value}</td></tr>`;
  const lines = [
    row("subtotal", formatBRL(t.subtotal)),
    row(`frete (${esc(order.shipping.label)})`, t.shipping === 0 ? "grátis" : formatBRL(t.shipping)),
    t.discount > 0 ? row("desconto", `−${formatBRL(t.discount)}`) : "",
    row("total", formatBRL(t.total), true),
  ].join("");
  return {
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-top:1px solid ${C.line};padding-top:8px">${lines}</table>`,
    text: `total: ${formatBRL(t.total)}`,
  };
}

function address(order: Order): Block {
  const a = order.address;
  const cep = a.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  const lines = [`${a.street}, ${a.number}${a.complement ? ` · ${a.complement}` : ""}`, `${a.district} — ${a.city}/${a.state}`, `CEP ${cep}`];
  return {
    html: `<div style="margin:0 0 24px;font:14px/1.6 ${SANS};color:${C.soft}"><div style="font:11px ${MONO};color:${C.mute}">entrega</div>${lines.map(esc).join("<br>")}</div>`,
    text: `entrega: ${lines.join(", ")}`,
  };
}

/* ------------------------------------------------------------------ layout */

function layout(opts: { preheader: string; kicker: string; title: string; blocks: Block[] }): { html: string; text: string } {
  const { legal } = siteConfig;
  const help = legal.whatsapp ? `Dúvidas? Responda este e-mail ou chame no WhatsApp ${legal.whatsapp}.` : "Dúvidas? É só responder este e-mail.";
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${C.paper}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 8px 18px;font:700 20px ${SANS};letter-spacing:-0.5px;color:${C.ink}">${esc(siteConfig.name)}</td></tr>
<tr><td style="background:${C.canvas};border:1px solid ${C.ink};border-radius:20px;padding:32px 28px">
<div style="font:12px ${MONO};color:${C.mute}">${esc(opts.kicker)}</div>
<h1 style="margin:8px 0 20px;font:700 28px/1.1 ${SANS};letter-spacing:-0.8px;color:${C.ink}">${esc(opts.title)}</h1>
${opts.blocks.map((b) => b.html).join("\n")}
</td></tr>
<tr><td style="padding:20px 8px 0;font:12px/1.6 ${SANS};color:${C.mute}">${esc(help)}<br>${esc(legal.companyName)} · CNPJ ${esc(legal.cnpj)}<br>Você recebeu este e-mail por causa de uma compra na ${esc(siteConfig.name)}.</td></tr>
</table></td></tr></table>
</body></html>`;
  const text = [opts.title, "", ...opts.blocks.map((b) => b.text).filter(Boolean).flatMap((t) => [t, ""]), help, `${legal.companyName} · CNPJ ${legal.cnpj}`].join("\n");
  return { html, text };
}

/* ------------------------------------------------------------------ e-mails */

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export function renderOrderEmail(kind: EmailKind, order: Order, siteUrl: string): RenderedEmail {
  const n = order.number;
  const orderUrl = abs(siteUrl, `/pedido/${order.id}`);
  const hi = firstName(order.customer.name);
  const kicker = `pedido ${n}`;

  let subject: string;
  let preheader: string;
  let title: string;
  let blocks: Block[];

  switch (kind) {
    case "pedido_recebido": {
      const pay = order.payment;
      subject = `Pedido ${n} recebido: falta o pagamento`;
      title = "recebemos seu pedido.";
      blocks = [p(`Oi, ${esc(hi)}. Seu pedido está reservado. Assim que o pagamento cair, a gente começa a separar.`, `Oi, ${hi}. Seu pedido está reservado. Assim que o pagamento cair, a gente começa a separar.`)];
      if (pay.method === "pix" && pay.pix) {
        const until = pay.pix.expiresAt ? ` O código vale até ${dateFmt.format(new Date(pay.pix.expiresAt))}.` : "";
        preheader = `Pague o Pix de ${formatBRL(order.totals.total)} para confirmar.`;
        blocks.push(p(`Copie o código abaixo no app do seu banco (Pix copia e cola).${esc(until)}`, `Copie o código abaixo no app do seu banco (Pix copia e cola).${until}`));
        blocks.push(codeBox("pix copia e cola", pay.pix.qrCode, "sm"));
        blocks.push(button("ver QR code e pedido", orderUrl));
      } else if (pay.method === "boleto" && pay.boleto) {
        preheader = `Pague o boleto de ${formatBRL(order.totals.total)} até o vencimento.`;
        blocks.push(p("O boleto compensa em até 3 dias úteis depois de pago.", "O boleto compensa em até 3 dias úteis depois de pago."));
        if (pay.boleto.barcode) blocks.push(codeBox("linha digitável", pay.boleto.barcode, "sm"));
        blocks.push(button("abrir boleto", pay.boleto.url.startsWith("http") ? pay.boleto.url : orderUrl));
      } else if (pay.method === "crypto" && pay.checkoutUrl) {
        preheader = "Conclua o pagamento em cripto para confirmar o pedido.";
        blocks.push(p("O link de pagamento em cripto vale por 2 horas. Depois disso, a reserva é liberada.", "O link de pagamento em cripto vale por 2 horas. Depois disso, a reserva é liberada."));
        blocks.push(button("pagar em cripto", pay.checkoutUrl));
      } else {
        preheader = "Seu pedido está reservado.";
        blocks.push(button("ver pedido", orderUrl));
      }
      blocks.push(items(order, siteUrl), totals(order));
      break;
    }
    case "pagamento_aprovado":
      subject = `Pagamento aprovado · pedido ${n}`;
      preheader = "Agora a gente separa e confere seu pedido.";
      title = "pagamento aprovado.";
      blocks = [
        p(
          `Valeu, ${esc(hi)}. Agora a gente separa e confere cada peça. Quando o pedido sair, o código de rastreio chega por aqui.`,
          `Valeu, ${hi}. Agora a gente separa e confere cada peça. Quando o pedido sair, o código de rastreio chega por aqui.`,
        ),
        items(order, siteUrl),
        totals(order),
        address(order),
        button("acompanhar pedido", orderUrl),
      ];
      break;
    case "pedido_enviado": {
      const code = order.trackingCode;
      subject = `Pedido ${n} enviado: código de rastreio`;
      preheader = code ? `Rastreio ${code} · ${order.shipping.label}` : "Seu pedido está a caminho.";
      title = "seu pedido está a caminho.";
      blocks = [
        p(
          `${esc(hi)}, seu pedido foi postado (${esc(order.shipping.label)}, até ${order.shipping.days} dias úteis). O rastreio pode levar até 24 horas para aparecer no site dos Correios.`,
          `${hi}, seu pedido foi postado (${order.shipping.label}, até ${order.shipping.days} dias úteis). O rastreio pode levar até 24 horas para aparecer no site dos Correios.`,
        ),
      ];
      if (code) blocks.push(codeBox("código de rastreio", code), button("rastrear nos Correios", trackingUrl(code)));
      else blocks.push(button("ver pedido", orderUrl));
      blocks.push(address(order), items(order, siteUrl));
      break;
    }
    case "pedido_entregue": {
      const canReview = Boolean(order.profileId);
      subject = `Pedido ${n} entregue. Serviu?`;
      preheader = canReview ? "Conta pra gente o que achou." : "Esperamos que tenha curtido.";
      title = "chegou.";
      blocks = [
        p(
          `${esc(hi)}, o pedido consta como entregue. Se o tamanho não serviu, você tem ${siteConfig.exchangeDays} dias para trocar e a primeira troca é por nossa conta.`,
          `${hi}, o pedido consta como entregue. Se o tamanho não serviu, você tem ${siteConfig.exchangeDays} dias para trocar e a primeira troca é por nossa conta.`,
        ),
      ];
      if (canReview) {
        blocks.push(p("Curtiu? Uma avaliação ajuda quem está em dúvida sobre o tamanho e o modelo.", "Curtiu? Uma avaliação ajuda quem está em dúvida sobre o tamanho e o modelo."));
      }
      blocks.push(items(order, siteUrl, { review: canReview }), button("ver pedido", orderUrl));
      blocks.push(p(`Não recebeu? Responda este e-mail que a gente resolve.`, "Não recebeu? Responda este e-mail que a gente resolve."));
      break;
    }
    case "pedido_cancelado": {
      const paid = wasPaid(order);
      const declined = order.status === "recusado";
      subject = `Pedido ${n} cancelado`;
      title = "pedido cancelado.";
      const msg = declined
        ? "O pagamento não foi aprovado, então o pedido foi cancelado. Nada foi cobrado."
        : paid
          ? "Seu pedido foi cancelado. O estorno sai no mesmo meio de pagamento: no cartão, aparece em até duas faturas; no Pix, volta para a conta de origem."
          : "O prazo de pagamento acabou ou o pedido foi cancelado antes do pagamento. Nada foi cobrado.";
      preheader = declined || !paid ? "Nada foi cobrado." : "O estorno sai no mesmo meio de pagamento.";
      blocks = [p(`${esc(hi)}, ${esc(msg.charAt(0).toLowerCase() + msg.slice(1))}`, `${hi}, ${msg.charAt(0).toLowerCase() + msg.slice(1)}`)];
      blocks.push(items(order, siteUrl));
      blocks.push(p("Ainda quer as peças? Se tiver estoque, é só fazer um pedido novo.", "Ainda quer as peças? Se tiver estoque, é só fazer um pedido novo."));
      blocks.push(button("voltar à loja", abs(siteUrl, "/catalogo")));
      break;
    }
  }

  const { html, text } = layout({ preheader, kicker, title, blocks });
  return { subject, preheader, html, text };
}
