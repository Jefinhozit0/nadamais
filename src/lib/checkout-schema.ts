import { z } from "zod";
import { isValidCpf, isValidPhone, onlyDigits, UFS } from "./br";

/** Esquemas compartilhados: o cliente valida para dar feedback, o servidor valida de novo (fonte da verdade). */

export const customerSchema = z.object({
  email: z.email({ error: "E-mail inválido. Confira o endereço, ex.: voce@email.com" }).max(120),
  name: z
    .string()
    .trim()
    .min(5, { error: "Escreva nome e sobrenome." })
    .max(80)
    .refine((v) => v.split(/\s+/).length >= 2, { error: "Escreva nome e sobrenome." }),
  cpf: z.string().refine(isValidCpf, { error: "CPF inválido. Confira os 11 dígitos." }).transform(onlyDigits),
  phone: z.string().refine(isValidPhone, { error: "Telefone com DDD, ex.: (11) 91234-5678." }).transform(onlyDigits),
});

export const addressSchema = z.object({
  cep: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 8, { error: "CEP com 8 dígitos." }),
  street: z.string().trim().min(2, { error: "Informe a rua." }).max(120),
  number: z.string().trim().min(1, { error: "Informe o número (ou s/n)." }).max(10),
  complement: z.string().trim().max(60).optional().default(""),
  district: z.string().trim().min(2, { error: "Informe o bairro." }).max(80),
  city: z.string().trim().min(2, { error: "Informe a cidade." }).max(80),
  state: z.enum(UFS, { error: "UF inválida." }),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(40),
  size: z.string().min(1).max(8),
  quantity: z.number().int().min(1).max(10),
});

export const shippingMethodSchema = z.enum(["economica", "expressa"]);

export const paymentMethodSchema = z.enum(["pix", "card", "boleto"]);

export type Customer = z.infer<typeof customerSchema>;
export type Address = z.infer<typeof addressSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type ShippingMethod = z.infer<typeof shippingMethodSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/** Primeira mensagem de erro por campo, para exibir no formulário. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
