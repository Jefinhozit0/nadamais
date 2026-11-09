import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Quais dados coletamos, para quê, com quem compartilhamos e como exercer seus direitos (LGPD).",
  alternates: { canonical: "/privacidade" },
};

/**
 * Modelo de política alinhado à LGPD (Lei 13.709/2018) para o que o site realmente faz.
 * Revise com um profissional jurídico antes de lançar.
 */
export default function PrivacyPage() {
  const { legal } = siteConfig;
  return (
    <ContentPage
      title="privacidade"
      intro="Coletamos só o necessário para vender, entregar e dar suporte. Aqui está o que, por quê e como você controla isso."
      updatedAt="9 de novembro de 2026"
      toc={[
        { id: "controlador", label: "quem somos" },
        { id: "dados", label: "dados que coletamos" },
        { id: "finalidades", label: "para que usamos" },
        { id: "compartilhamento", label: "com quem compartilhamos" },
        { id: "armazenamento", label: "armazenamento e segurança" },
        { id: "navegador", label: "dados no seu navegador" },
        { id: "direitos", label: "seus direitos" },
      ]}
    >
      <h2 id="controlador">quem somos</h2>
      <p>
        {legal.companyName} (CNPJ {legal.cnpj}), {legal.address}, é a controladora dos dados pessoais tratados nesta loja.
        Encarregado de dados (DPO): <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
      </p>

      <h2 id="dados">dados que coletamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome, e-mail e senha (a senha é guardada de forma criptografada pelo nosso provedor de
          autenticação; não temos acesso a ela).
        </li>
        <li>
          <strong>Compra:</strong> nome, e-mail, CPF, telefone e endereço de entrega.
        </li>
        <li>
          <strong>Pagamento:</strong> processado pelo Mercado Pago. Dados de cartão são digitados direto no formulário do
          Mercado Pago e <strong>nunca passam pelos nossos servidores</strong>.
        </li>
        <li>
          <strong>Navegação:</strong> favoritos e endereços que você salva na conta.
        </li>
      </ul>

      <h2 id="finalidades">para que usamos (e a base legal)</h2>
      <ul>
        <li>Processar e entregar pedidos, emitir nota fiscal — execução de contrato e obrigação legal (LGPD, art. 7º, V e II).</li>
        <li>Prevenção a fraude no pagamento — legítimo interesse e proteção ao crédito (art. 7º, IX e X).</li>
        <li>Atendimento, trocas e devoluções — execução de contrato.</li>
        <li>Newsletter de lançamentos — somente com o seu consentimento, que pode ser retirado a qualquer momento (art. 7º, I).</li>
      </ul>
      <p>Não vendemos seus dados e não usamos seus dados para publicidade de terceiros.</p>

      <h2 id="compartilhamento">com quem compartilhamos</h2>
      <ul>
        <li>
          <strong>Mercado Pago</strong> — processamento do pagamento.
        </li>
        <li>
          <strong>Transportadoras (Correios ou parceiras)</strong> — nome, telefone e endereço para a entrega.
        </li>
        <li>
          <strong>Supabase</strong> — hospedagem do banco de dados e da autenticação.
        </li>
        <li>
          <strong>Vercel</strong> — hospedagem do site.
        </li>
        <li>Autoridades públicas, quando exigido por lei ou ordem judicial.</li>
      </ul>
      <p>Alguns desses provedores armazenam dados fora do Brasil, com as salvaguardas previstas no art. 33 da LGPD.</p>

      <h2 id="armazenamento">armazenamento e segurança</h2>
      <p>
        Os dados ficam em banco de dados com acesso restrito ao servidor da loja, conexões criptografadas (HTTPS) e controle de
        acesso por usuário. Dados de pedidos são mantidos pelo prazo exigido pela legislação fiscal (5 anos); dados de conta,
        enquanto a conta existir.
      </p>

      <h2 id="navegador">dados no seu navegador</h2>
      <p>
        Usamos armazenamento local do navegador só para o funcionamento da loja: sacola, rascunho do checkout, tema claro/escuro
        e o cookie de sessão do login. Não usamos cookies de rastreamento ou de publicidade.
      </p>

      <h2 id="direitos">seus direitos</h2>
      <p>
        Você pode pedir a qualquer momento: confirmação e acesso aos seus dados, correção, anonimização ou exclusão, portabilidade,
        informação sobre compartilhamentos e revogação de consentimento (LGPD, art. 18). Escreva para{" "}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a> — respondemos em até 15 dias. Dados e endereços
        também podem ser editados direto em minha conta.
      </p>
    </ContentPage>
  );
}
