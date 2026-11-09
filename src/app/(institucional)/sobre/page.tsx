import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content/content-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sobre",
  description: `Quem somos e como cada peça da ${siteConfig.name} é conferida antes de sair.`,
  alternates: { canonical: "/sobre" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title="sobre"
      intro="Sneakers e streetwear de desenho próprio, feitos para durar e para combinar entre si. Pouca coisa, bem escolhida."
      toc={[
        { id: "ideia", label: "a ideia" },
        { id: "linhas", label: "as linhas" },
        { id: "qualidade", label: "como garantimos cada peça" },
        { id: "contato", label: "contato" },
      ]}
    >
      <h2 id="ideia">a ideia</h2>
      <p>
        A {siteConfig.name} nasceu de um incômodo: guarda-roupa cheio e nada para vestir. Em vez de dezenas de lançamentos por
        mês, trabalhamos com poucas peças, em cores que conversam, com materiais escolhidos para aguentar uso de verdade.
      </p>
      <p>
        Todo o desenho é próprio. Não vendemos peças com logotipos ou marcas de terceiros — o que você vê na foto é exatamente
        o que chega na sua casa.
      </p>

      <h2 id="linhas">as linhas</h2>
      <ul>
        <li>
          <strong>essencial</strong> — moletons, camisetas e bonés que você usa toda semana.
        </li>
        <li>
          <strong>court</strong> — tênis baixos de couro e lona, desenho limpo.
        </li>
        <li>
          <strong>volume</strong> — solas em camadas e peças com presença.
        </li>
        <li>
          <strong>utility</strong> — cargo, mule e bolsas feitos para uso pesado.
        </li>
      </ul>

      <h2 id="qualidade">como garantimos cada peça</h2>
      <p>Antes de qualquer envio, cada peça passa por uma conferência manual:</p>
      <ul>
        <li>costura, colagem e acabamento — sem fio solto, sem cola aparente;</li>
        <li>tamanho e numeração conferidos com a etiqueta e com a grade do produto;</li>
        <li>embalagem com caixa (tênis) ou saco protetor (roupas);</li>
        <li>nota fiscal emitida em todo pedido.</li>
      </ul>
      <p>
        Se mesmo assim algo chegar com defeito de fabricação, a gente troca ou devolve o valor — veja{" "}
        <Link href="/trocas-e-devolucoes">trocas e devoluções</Link>.
      </p>

      <h2 id="contato">contato</h2>
      <p>
        E-mail: <a href={`mailto:${siteConfig.legal.email}`}>{siteConfig.legal.email}</a>
        {siteConfig.legal.whatsapp && <> · WhatsApp: {siteConfig.legal.whatsapp}</>}
        <br />
        {siteConfig.legal.companyName} · CNPJ {siteConfig.legal.cnpj}
        <br />
        {siteConfig.legal.address}
      </p>
    </ContentPage>
  );
}
