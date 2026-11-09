import { describe, expect, it } from "vitest";
import { addressSchema, customerSchema } from "@/lib/checkout-schema";

describe("dados do cliente", () => {
  const valid = { email: "ana@exemplo.com.br", name: "Ana Souza", cpf: "529.982.247-25", phone: "(11) 91234-5678" };

  it("aceita dados válidos e normaliza CPF e telefone para dígitos", () => {
    const parsed = customerSchema.parse(valid);
    expect(parsed.cpf).toBe("52998224725");
    expect(parsed.phone).toBe("11912345678");
  });

  it("exige nome e sobrenome", () => {
    expect(customerSchema.safeParse({ ...valid, name: "Ana" }).success).toBe(false);
  });

  it("rejeita CPF inválido com mensagem clara", () => {
    const r = customerSchema.safeParse({ ...valid, cpf: "123.456.789-00" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/CPF inválido/);
  });
});

describe("endereço", () => {
  const valid = {
    cep: "01310-100",
    street: "Av. Paulista",
    number: "1000",
    district: "Bela Vista",
    city: "São Paulo",
    state: "SP",
  };

  it("normaliza CEP e preenche complemento vazio", () => {
    const parsed = addressSchema.parse(valid);
    expect(parsed.cep).toBe("01310100");
    expect(parsed.complement).toBe("");
  });

  it("rejeita UF inexistente e CEP curto", () => {
    expect(addressSchema.safeParse({ ...valid, state: "XX" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, cep: "0131" }).success).toBe(false);
  });
});
