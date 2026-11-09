import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content/content-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: `Troca em até ${siteConfig.exchangeDays} dias, arrependimento em 7 dias e como pedir. Primeira troca por nossa conta.`,
  alternates: { canonical: "/trocas-e-devolucoes" },
};

export default function ExchangesPage() {
  const days = siteConfig.exchangeDays;
  return (
    <ContentPage
      title="trocas e devoluções"
      intro={`Não serviu ou não era o que você esperava? Você tem ${days} dias para trocar, e a primeira troca é por nossa conta.`}
      updatedAt="9 de novembro de 2026"
      toc={[
        { id: "arrependimento", label: "arrependimento (7 dias)" },
        { id: "troca", label: `troca em ${days} dias` },
        { id: "defeito", label: "defeito de fabricação" },
        { id: "como", label: "como pedir" },
        { id: "reembolso", label: "reembolso" },
      ]}
    >
      <h2 id="arrependimento">arrependimento (7 dias)</h2>
      <p>
        Pelo Código de Defesa do Consumidor (art. 49), compras feitas pela internet podem ser desistidas em até{" "}
        <strong>7 dias corridos</strong> a partir do recebimento, sem precisar de justificativa. Nesse caso devolvemos o valor
        total, incluindo o frete de ida, e o envio de volta é por nossa conta.
      </p>

      <h2 id="troca">troca em {days} dias</h2>
      <p>
        Além do prazo legal, aceitamos troca por outro tamanho, cor ou produto em até <strong>{days} dias</strong> do
        recebimento. A primeira troca de cada pedido tem frete grátis nos dois sentidos.
      </p>
      <p>Para trocar, a peça precisa estar:</p>
      <ul>
        <li>sem sinais de uso (tênis sem sujeira na sola, roupas sem lavagem);</li>
        <li>com etiquetas e, no caso de tênis, na caixa original.</li>
      </ul>

      <h2 id="defeito">defeito de fabricação</h2>
      <p>
        Defeitos de fabricação têm garantia legal de <strong>90 dias</strong> (CDC, art. 26). Fale com a gente com fotos do
        problema; se confirmado, trocamos a peça ou devolvemos o valor, à sua escolha.
      </p>

      <h2 id="como">como pedir</h2>
      <ul>
        <li>
          Se você tem conta, abra o pedido em <Link href="/conta/pedidos">minha conta › pedidos</Link> e anote o número.
        </li>
        <li>
          Escreva para <a href={`mailto:${siteConfig.legal.email}`}>{siteConfig.legal.email}</a> com o número do pedido, o
          item e o motivo (troca, arrependimento ou defeito).
        </li>
        <li>Enviamos um código de postagem dos Correios em até 2 dias úteis. É só levar o pacote a uma agência.</li>
      </ul>

      <h2 id="reembolso">reembolso</h2>
      <ul>
        <li>
          <strong>Pix e boleto:</strong> devolução por Pix na conta do titular em até 5 dias úteis após recebermos a peça.
        </li>
        <li>
          <strong>Cartão:</strong> estorno solicitado à operadora em até 5 dias úteis; o prazo para aparecer na fatura depende
          do banco (normalmente 1 a 2 faturas).
        </li>
      </ul>
    </ContentPage>
  );
}
