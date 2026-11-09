import { z } from "zod";
import { onlyDigits } from "@/lib/br";
import { cartItemSchema } from "@/lib/checkout-schema";
import { priceCart, shippingFor } from "@/server/pricing";

const bodySchema = z.object({
  cep: z.string().transform(onlyDigits).refine((v) => v.length === 8),
  items: z.array(cartItemSchema).min(1).max(30),
});

type ViaCep = { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean | string };

async function lookupCep(cep: string) {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCep;
    if (data.erro) return { notFound: true as const };
    return {
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    // ViaCEP fora do ar: o cliente preenche o endereço manualmente
    return null;
  }
}

/** Cotação: endereço pelo CEP + itens com preço/estoque do servidor + opções de frete. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "CEP ou itens inválidos." }, { status: 400 });
  }
  const { cep, items } = parsed.data;
  const [address, cart] = await Promise.all([lookupCep(cep), priceCart(items)]);

  if (address && "notFound" in address) {
    return Response.json({ error: "CEP não encontrado. Confira os números." }, { status: 404 });
  }

  return Response.json({
    address,
    cart,
    options: cart.lines.length ? shippingFor(cep, cart) : [],
  });
}
