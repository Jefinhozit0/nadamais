"use client";

import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { siteConfig } from "@/config/site";
import type { PaymentMethod } from "@/lib/checkout-schema";
import { onlyDigits } from "@/lib/br";
import type { AddressDraft, CustomerDraft } from "@/store/checkout";

export type BrickSubmit = {
  token?: string;
  issuer_id?: string | number;
  payment_method_id: string;
  installments?: number;
};

let initializedKey: string | undefined;

/** Inicializa o SDK uma única vez por chave pública (idempotente). */
function ensureMercadoPago(publicKey: string) {
  if (initializedKey === publicKey) return;
  initMercadoPago(publicKey, { locale: "pt-BR" });
  initializedKey = publicKey;
}

type Props = {
  publicKey: string;
  method: Exclude<PaymentMethod, "crypto">;
  /** Centavos. */
  amount: number;
  customer: CustomerDraft;
  address: AddressDraft;
  onSubmit: (data: BrickSubmit) => Promise<void>;
};

/**
 * Payment Brick do Mercado Pago restrito ao meio escolhido (pix, cartão ou boleto),
 * com o valor certo para cada um (o Pix já vem com desconto).
 * Os dados do cartão são tokenizados pelo próprio Mercado Pago — nunca passam pelo nosso servidor.
 */
export function MercadoPagoBrick({ publicKey, method, amount, customer, address, onSubmit }: Props) {
  // Componente só roda no navegador (dynamic + ssr:false)
  ensureMercadoPago(publicKey);

  const [firstName, ...rest] = customer.name.trim().split(/\s+/);
  const paymentMethods =
    method === "pix"
      ? { bankTransfer: ["pix"] }
      : method === "boleto"
        ? { ticket: ["bolbradesco"] }
        : { creditCard: "all" as const, maxInstallments: siteConfig.maxInstallments };

  return (
    <Payment
      initialization={{
        amount: amount / 100,
        payer: {
          email: customer.email,
          firstName,
          lastName: rest.join(" "),
          identification: { type: "CPF", number: onlyDigits(customer.cpf) },
          address: {
            zipCode: onlyDigits(address.cep),
            federalUnit: address.state,
            city: address.city,
            neighborhood: address.district,
            streetName: address.street,
            streetNumber: address.number,
            complement: address.complement,
          },
        },
      }}
      customization={{
        paymentMethods,
        visual: {
          hideFormTitle: true,
          style: {
            theme: "default",
            customVariables: {
              baseColor: "#121212",
              borderRadiusLarge: "16px",
              borderRadiusMedium: "8px",
              borderRadiusSmall: "8px",
              borderRadiusFull: "999px",
            },
          },
        },
      }}
      onSubmit={async ({ formData }) => {
        await onSubmit({
          token: formData.token,
          issuer_id: formData.issuer_id,
          payment_method_id: formData.payment_method_id,
          installments: formData.installments,
        });
      }}
      onError={(error) => console.error("[mercado pago brick]", error)}
    />
  );
}
