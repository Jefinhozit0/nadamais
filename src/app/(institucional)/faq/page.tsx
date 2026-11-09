import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { formatBRL } from "@/lib/format";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description: "Prazos de entrega, frete, pagamento, tamanhos, trocas e conta — respostas rápidas.",
  alternates: { canonical: "/faq" },
};

const faqs: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "entrega",
    items: [
      {
        q: "Qual o prazo de entrega?",
        a: "Despachamos em até 2 dias úteis após a confirmação do pagamento. O prazo de transporte aparece no checkout, depois que você informa o CEP: na entrega expressa, de 1 a 5 dias úteis; na econômica, de 3 a 11 dias úteis, conforme a região.",
      },
      {
        q: "O frete é grátis?",
        a: `A entrega econômica é grátis em compras a partir de ${formatBRL(siteConfig.freeShippingFrom)}. Acima desse valor, a expressa também fica mais barata.`,
      },
      {
        q: "Como acompanho meu pedido?",
        a: "Quando o pedido é enviado, o código de rastreio aparece na página do pedido (o link chega no seu e-mail) e em minha conta › pedidos.",
      },
    ],
  },
  {
    group: "pagamento",
    items: [
      {
        q: "Quais formas de pagamento vocês aceitam?",
        a: `Pix (com ${Math.round(siteConfig.pixDiscount * 100)}% de desconto), cartão de crédito em até ${siteConfig.maxInstallments}x sem juros e boleto. Os pagamentos são processados pelo Mercado Pago.`,
      },
      {
        q: "Quanto tempo leva para o pagamento ser aprovado?",
        a: "Pix e cartão são aprovados na hora, na maioria dos casos. Boleto leva até 2 dias úteis para compensar.",
      },
      {
        q: "Meus dados de cartão ficam salvos na loja?",
        a: "Não. Os dados do cartão são digitados no formulário do Mercado Pago e nunca passam pelos nossos servidores.",
      },
    ],
  },
  {
    group: "tamanhos",
    items: [
      {
        q: "Como escolho meu número de tênis?",
        a: "A numeração é brasileira. Na página do produto dá para ver a conversão para US e EU. Se ficar entre dois números, escolha o maior.",
      },
      {
        q: "As roupas têm modelagem grande ou pequena?",
        a: "Os moletons Heavy e as camisetas Pesadas têm caimento reto; a Camiseta Oversized é mais larga de propósito. Na dúvida, use seu tamanho habitual.",
      },
    ],
  },
  {
    group: "trocas",
    items: [
      {
        q: "Posso trocar se não servir?",
        a: `Sim. Você tem ${siteConfig.exchangeDays} dias para trocar, e a primeira troca é grátis. Pelo direito de arrependimento, também pode desistir em até 7 dias e receber o valor de volta.`,
      },
      {
        q: "Como peço uma troca ou devolução?",
        a: `Escreva para ${siteConfig.legal.email} com o número do pedido. Enviamos o código de postagem em até 2 dias úteis.`,
      },
    ],
  },
  {
    group: "conta",
    items: [
      {
        q: "Preciso ter conta para comprar?",
        a: "Não. Com conta, você acompanha pedidos, salva endereços e favoritos, e o checkout fica mais rápido.",
      },
      {
        q: "Esqueci minha senha. E agora?",
        a: "Na tela de entrar, use “link por e-mail”: mandamos um link que entra na sua conta sem senha.",
      },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.flatMap((g) =>
      g.items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    ),
  };

  return (
    <ContentPage
      title="perguntas frequentes"
      intro="Não achou o que procurava? Fale com a gente pelo e-mail no rodapé."
      toc={faqs.map((g) => ({ id: g.group, label: g.group }))}
    >
      <JsonLd data={jsonLd} />
      {faqs.map((group) => (
        <section key={group.group} aria-labelledby={group.group}>
          <h2 id={group.group}>{group.group}</h2>
          <div className="mt-4 border-t border-line-soft">
            {group.items.map((item) => (
              <details key={item.q} className="group/faq border-b border-line-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-ink [&::-webkit-details-marker]:hidden">
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown
                    className="size-4 shrink-0 transition-transform group-open/faq:rotate-180 motion-reduce:transition-none"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </summary>
                <p className="pb-5">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </ContentPage>
  );
}
