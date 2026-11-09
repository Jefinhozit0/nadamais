"use client";

import { Barcode, CreditCard, QrCode, type LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { PaymentMethod } from "@/lib/checkout-schema";
import { formatBRL, formatInstallments } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useCheckout } from "@/store/checkout";
import type { BrickSubmit } from "./mercado-pago-brick";

// O SDK do Mercado Pago só carrega quando a etapa de pagamento aparece
const MercadoPagoBrick = dynamic(() => import("./mercado-pago-brick").then((m) => m.MercadoPagoBrick), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-card bg-haze" aria-label="Carregando pagamento" />,
});

const methods: { value: PaymentMethod; label: string; detail: string; icon: LucideIcon }[] = [
  { value: "pix", label: "pix", detail: `${Math.round(siteConfig.pixDiscount * 100)}% off · aprovação na hora`, icon: QrCode },
  { value: "card", label: "cartão de crédito", detail: `até ${siteConfig.maxInstallments}x sem juros`, icon: CreditCard },
  { value: "boleto", label: "boleto", detail: "vence em 3 dias úteis · aprova em até 2 dias", icon: Barcode },
];

type PaymentStepProps = {
  live: boolean;
  publicKey?: string;
  totals: { total: number; subtotal: number; shipping: number };
};

export function PaymentStep({ live, publicKey, totals }: PaymentStepProps) {
  const router = useRouter();
  const method = useCheckout((s) => s.paymentMethod);
  const setMethod = useCheckout((s) => s.setPaymentMethod);
  const customer = useCheckout((s) => s.customer);
  const address = useCheckout((s) => s.address);
  const shippingMethod = useCheckout((s) => s.shippingMethod);
  const resetFlow = useCheckout((s) => s.resetFlow);
  const lines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function placeOrder(brick?: BrickSubmit) {
    setSubmitting(true);
    setError(undefined);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
          customer,
          address,
          shippingMethod,
          payment: { method, brick },
        }),
      });
      const data = (await res.json()) as { orderId?: string; error?: string; rejected?: boolean };
      if (!res.ok || !data.orderId || data.rejected) {
        setError(data.error ?? "Não foi possível finalizar. Tente de novo.");
        setSubmitting(false);
        return;
      }
      clearCart();
      resetFlow();
      router.push(`/pedido/${data.orderId}`);
    } catch {
      setError("Sem conexão. Nada foi cobrado — tente de novo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 text-sm">forma de pagamento</legend>
        <div className="grid gap-2">
          {methods.map(({ value, label, detail, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-card border p-4 transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                method === value ? "border-ink" : "border-line-soft hover:border-ink-soft",
              )}
            >
              <input
                type="radio"
                name="payment"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
                className="size-4 accent-ink"
              />
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-ink">
                <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm">{label}</span>
                <span className="block text-xs text-mute-strong">{detail}</span>
              </span>
              {value === "pix" && (
                <span className="font-mono text-xs text-success tabular-nums">
                  {formatBRL(totals.subtotal - Math.round(totals.subtotal * siteConfig.pixDiscount) + totals.shipping)}
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-card border border-drop bg-drop-soft px-4 py-3 text-sm text-drop">
          {error}
        </p>
      )}

      {live && publicKey ? (
        <MercadoPagoBrick
          key={`${method}-${totals.total}`}
          publicKey={publicKey}
          method={method}
          amount={totals.total}
          customer={customer}
          address={address}
          onSubmit={placeOrder}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="rounded-card border border-dashed border-line-soft px-4 py-3 text-xs text-ink-soft">
            <strong className="font-medium text-ink">Modo demonstração.</strong> O Mercado Pago ainda não está
            configurado (veja o README). Nenhum valor será cobrado: o pedido é criado e o pagamento é simulado.
          </p>
          <Button size="lg" className="w-full" loading={submitting} onClick={() => placeOrder()}>
            {method === "pix" ? "gerar pix" : method === "boleto" ? "gerar boleto" : "pagar"} ·{" "}
            <span className="font-mono normal-case tabular-nums">{formatBRL(totals.total)}</span>
          </Button>
          {method === "card" && (
            <p className="text-center font-mono text-micro text-mute-strong">ou {formatInstallments(totals.total)} sem juros</p>
          )}
        </div>
      )}
    </div>
  );
}
