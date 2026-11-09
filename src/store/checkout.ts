"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PaymentMethod, ShippingMethod } from "@/lib/checkout-schema";

/** Rascunho do checkout. Fica no sessionStorage: some ao fechar a aba (dados pessoais). */

export type CustomerDraft = { email: string; name: string; cpf: string; phone: string };
export type AddressDraft = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

/** Copia só os campos de endereço (descarta id, apelido etc. de um endereço salvo). */
export function toAddressDraft(a: AddressDraft): AddressDraft {
  return {
    cep: a.cep,
    street: a.street,
    number: a.number,
    complement: a.complement,
    district: a.district,
    city: a.city,
    state: a.state,
  };
}

export type CheckoutStep = 1 | 2 | 3;

type CheckoutState = {
  step: CheckoutStep;
  /** Etapas já concluídas (permite voltar e editar). */
  done: CheckoutStep[];
  customer: CustomerDraft;
  address: AddressDraft;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  setStep: (step: CheckoutStep) => void;
  complete: (step: CheckoutStep) => void;
  setCustomer: (patch: Partial<CustomerDraft>) => void;
  setAddress: (patch: Partial<AddressDraft>) => void;
  setShippingMethod: (method: ShippingMethod) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  resetFlow: () => void;
};

const emptyCustomer: CustomerDraft = { email: "", name: "", cpf: "", phone: "" };
const emptyAddress: AddressDraft = { cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" };

export const useCheckout = create<CheckoutState>()(
  persist(
    (set) => ({
      step: 1,
      done: [],
      customer: emptyCustomer,
      address: emptyAddress,
      shippingMethod: "economica",
      paymentMethod: "pix",
      setStep: (step) => set({ step }),
      complete: (step) =>
        set((s) => ({
          done: s.done.includes(step) ? s.done : [...s.done, step],
          step: step < 3 ? ((step + 1) as CheckoutStep) : 3,
        })),
      setCustomer: (patch) => set((s) => ({ customer: { ...s.customer, ...patch } })),
      setAddress: (patch) => set((s) => ({ address: { ...s.address, ...patch } })),
      setShippingMethod: (shippingMethod) => set({ shippingMethod }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      // depois do pedido: volta ao início, mas mantém dados e endereço para a próxima compra nesta sessão
      resetFlow: () => set({ step: 1, done: [] }),
    }),
    {
      name: "checkout-v1",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    },
  ),
);
