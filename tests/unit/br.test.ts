import { describe, expect, it } from "vitest";
import { isValidCpf, isValidPhone, maskCpf, maskPhone, onlyDigits } from "@/lib/br";

describe("CPF", () => {
  it("aceita CPF válido, com ou sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejeita dígito verificador errado, tamanho errado e sequências repetidas", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("5299822472")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });

  it("aplica a máscara progressivamente e corta em 11 dígitos", () => {
    expect(maskCpf("529")).toBe("529");
    expect(maskCpf("5299")).toBe("529.9");
    expect(maskCpf("5299822")).toBe("529.982.2");
    expect(maskCpf("52998224725999")).toBe("529.982.247-25");
  });
});

describe("telefone", () => {
  it("mascara fixo e celular", () => {
    expect(maskPhone("1132345678")).toBe("(11) 3234-5678");
    expect(maskPhone("11912345678")).toBe("(11) 91234-5678");
    expect(maskPhone("11")).toBe("(11");
    expect(maskPhone("")).toBe("");
  });

  it("valida 10 ou 11 dígitos", () => {
    expect(isValidPhone("(11) 91234-5678")).toBe(true);
    expect(isValidPhone("(11) 3234-5678")).toBe(true);
    expect(isValidPhone("1191234")).toBe(false);
  });

  it("onlyDigits remove tudo que não é número", () => {
    expect(onlyDigits("a1-2.3 4")).toBe("1234");
  });
});
