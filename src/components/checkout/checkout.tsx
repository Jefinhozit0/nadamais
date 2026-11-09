"use client";

import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { cartSubtotal, useCart } from "@/store/cart";
import { toAddressDraft, useCheckout, type AddressDraft, type CheckoutStep } from "@/store/checkout";
import { CustomerStep } from "./customer-step";
import { DeliveryStep } from "./delivery-step";
import { OrderSummary } from "./order-summary";
import { PaymentStep } from "./payment-step";
import { QuoteProvider, useQuote } from "./quote-context";

export type CheckoutAccount = {
  email: string;
  name: string;
  cpf: string;
  phone: string;
  addresses: (AddressDraft & { id: string; label: string; isDefault: boolean })[];
};

function useHydrated(account?: CheckoutAccount): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void Promise.all([useCart.persist.rehydrate(), useCheckout.persist.rehydrate()]).then(() => {
      // cliente logado: preenche o que ainda estiver vazio no rascunho
      if (account) {
        const { customer, address, setCustomer, setAddress } = useCheckout.getState();
        if (!customer.email) {
          setCustomer({ email: account.email, name: account.name, cpf: account.cpf, phone: account.phone });
        }
        const preferred = account.addresses.find((a) => a.isDefault) ?? account.addresses[0];
        if (!address.cep && preferred) {
          setAddress(toAddressDraft(preferred));
        }
      }
      setReady(true);
    });
  }, [account]);
  return ready;
}

function Step({
  n,
  title,
  summary,
  children,
}: {
  n: CheckoutStep;
  title: string;
  summary?: ReactNode;
  children: ReactNode;
}) {
  const step = useCheckout((s) => s.step);
  const done = useCheckout((s) => s.done);
  const setStep = useCheckout((s) => s.setStep);
  const active = step === n;
  const completed = done.includes(n) && !active;
  const reachable = n === 1 || done.includes((n - 1) as CheckoutStep);

  return (
    <section
      aria-labelledby={`step-${n}`}
      aria-current={active ? "step" : undefined}
      className={cn("border-t border-line-soft py-6", !reachable && "opacity-50")}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`step-${n}`} className="flex items-baseline gap-3 font-display text-xl font-medium tracking-tight">
          <span
            className={cn(
              "inline-flex size-7 shrink-0 translate-y-0.5 items-center justify-center rounded-full border font-mono text-xs",
              completed ? "border-ink bg-ink text-canvas" : active ? "border-ink" : "border-line-soft text-mute-strong",
            )}
          >
            {completed ? <Check className="size-3.5" strokeWidth={2} aria-hidden="true" /> : n}
          </span>
          {title}
        </h2>
        {completed && (
          <button type="button" onClick={() => setStep(n)} className="h-9 cursor-pointer text-xs underline underline-offset-4">
            editar<span className="sr-only"> {title}</span>
          </button>
        )}
      </div>
      {completed && summary && <div className="mt-3 pl-10 text-sm text-ink-soft">{summary}</div>}
      {active && <div className="mt-6">{children}</div>}
    </section>
  );
}

function CheckoutFlow({ live, publicKey, crypto, account }: { live: boolean; publicKey?: string; crypto: boolean; account?: CheckoutAccount }) {
  const lines = useCart((s) => s.lines);
  const customer = useCheckout((s) => s.customer);
  const address = useCheckout((s) => s.address);
  const shippingMethod = useCheckout((s) => s.shippingMethod);
  const paymentMethod = useCheckout((s) => s.paymentMethod);
  const { options, notices } = useQuote();

  const subtotal = cartSubtotal(lines);
  const shipping = options.find((o) => o.method === shippingMethod) ?? options[0];
  const discount = paymentMethod === "pix" ? Math.round(subtotal * siteConfig.pixDiscount) : 0;
  const totals = {
    subtotal,
    shipping: shipping?.price,
    discount,
    total: subtotal - discount + (shipping?.price ?? 0),
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:order-2 lg:col-span-5">
        <OrderSummary lines={lines} totals={totals} />
      </div>

      <div className="lg:order-1 lg:col-span-7">
        {notices.length > 0 && (
          <ul role="status" className="mb-6 flex flex-col gap-1 rounded-card border border-drop bg-drop-soft px-4 py-3 text-sm text-drop">
            {notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <Step n={1} title="seus dados" summary={<>{customer.name} · {customer.email}</>}>
          <CustomerStep />
        </Step>
        <Step
          n={2}
          title="entrega"
          summary={
            <>
              {address.street}, {address.number}
              {address.complement && ` · ${address.complement}`} — {address.city}/{address.state}
              {shipping && (
                <span className="block font-mono text-xs">
                  {shipping.label} · até {shipping.days} dias úteis
                </span>
              )}
            </>
          }
        >
          <DeliveryStep savedAddresses={account?.addresses ?? []} />
        </Step>
        <Step n={3} title="pagamento">
          <PaymentStep live={live} publicKey={publicKey} crypto={crypto} totals={{ total: totals.total, subtotal, shipping: shipping?.price ?? 0 }} />
        </Step>
        <p className="flex items-center gap-2 border-t border-line-soft pt-6 text-xs text-mute-strong">
          <Lock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Pagamento processado pelo Mercado Pago. Não guardamos dados de cartão.
        </p>
      </div>
    </div>
  );
}

export function Checkout({
  live,
  publicKey,
  crypto = false,
  account,
}: {
  live: boolean;
  publicKey?: string;
  /** Paymento configurada: mostra a opção "cripto". */
  crypto?: boolean;
  account?: CheckoutAccount;
}) {
  const hydrated = useHydrated(account);
  const lines = useCart((s) => s.lines);

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-card bg-haze" aria-label="Carregando checkout" />;
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-ink-soft">Sua sacola está vazia — não há o que finalizar.</p>
        <Link href="/catalogo" className={buttonVariants({ variant: "outline" })}>
          ir para o catálogo
        </Link>
      </div>
    );
  }

  return (
    <QuoteProvider>
      <CheckoutFlow live={live} publicKey={publicKey} crypto={crypto} account={account} />
    </QuoteProvider>
  );
}
