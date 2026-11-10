import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content/content-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sobre",
  description: `Quem somos, de onde vêm os produtos e como cada peça da ${siteConfig.name} é conferida antes de sair.`,
  alternates: { canonical: "/sobre" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title="sobre"
      intro="Sneakers e streetwear originais das marcas que você curte, numa seleção enxuta. Pouca coisa, bem escolhida."
      toc={[
        { id: "ideia", label: "a ideia" },
        { id: "originais", label: "só original" },
        { id: "qualidade", label: "como garantimos cada peça" },
        { id: "contato", label: "contato" },
      ]}
    >
      <h2 id="ideia">a ideia</h2>
      <p>
        A {siteConfig.name} nasceu de um incômodo: guarda-roupa cheio e nada para vestir. Em vez de centenas de modelos,
        selecionamos poucos — os sneakers e as peças que valem o investimento — e cuidamos de cada um como se fosse nosso.
      </p>
      <p>O que você vê na foto é exatamente o que chega na sua casa.</p>

      <h2 id="originais">só original</h2>
      <p>
        Revendemos produtos originais, comprados de fornecedores com nota fiscal. Não vendemos réplica, &quot;primeira
        linha&quot; nem &quot;inspired&quot;.
      </p>
      <p>
        As marcas e os nomes de modelos citados no site pertencem aos seus donos e aparecem só para identificar o produto. A{" "}
        {siteConfig.name} é uma loja independente, sem vínculo com essas marcas.
      </p>

      <h2 id="qualidade">como garantimos cada peça</h2>
      <p>Antes de qualquer envio, cada peça passa por uma conferência manual:</p>
      <ul>
        <li>procedência — só entra no estoque com nota fiscal do fornecedor;</li>
        <li>autenticidade — etiqueta, numeração e acabamento comparados com o padrão do modelo;</li>
        <li>costura, colagem e estado — sem fio solto, sem cola aparente, sem marca de uso;</li>
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
