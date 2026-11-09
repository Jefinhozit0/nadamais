import { ArrowUpRight, Recycle } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Asterisks } from "@/components/brand/asterisks";
import { CepInput } from "@/components/forms/cep-input";
import { Price } from "@/components/product/price";
import { ProductBadge } from "@/components/product/product-badge";
import { ProductCard } from "@/components/product/product-card";
import { SizePicker } from "@/components/product/size-picker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sampleProducts } from "@/data/mock-products";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const swatches = [
  { token: "paper", className: "bg-paper" },
  { token: "canvas", className: "bg-canvas" },
  { token: "haze", className: "bg-haze" },
  { token: "line-soft", className: "bg-line-soft" },
  { token: "mute", className: "bg-mute" },
  { token: "mute-strong", className: "bg-mute-strong" },
  { token: "ink-soft", className: "bg-ink-soft" },
  { token: "ink", className: "bg-ink" },
  { token: "drop", className: "bg-drop" },
  { token: "drop-soft", className: "bg-drop-soft" },
  { token: "success", className: "bg-success" },
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line-soft py-12 md:grid-cols-12 md:py-16">
      <h2 className="font-display text-xl font-medium tracking-tight md:col-span-3">{title}</h2>
      <div className="min-w-0 md:col-span-9">{children}</div>
    </section>
  );
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      {children}
      <figcaption className="order-first font-mono text-micro text-mute-strong">{label}</figcaption>
    </figure>
  );
}

export default function DesignSystemPage() {
  const dunk = sampleProducts[0];

  return (
    <div className="px-4 md:px-8">
      {/* Abertura: título gigante dividido nas laterais, como na referência */}
      <div className="relative flex min-h-[min(60vh,640px)] flex-col justify-center gap-10 py-12 md:py-16">
        <h1 className="bg-halo relative flex flex-wrap items-center justify-between gap-x-6 py-6 font-display text-[clamp(2.75rem,9vw,8.5rem)] leading-[0.9] font-semibold tracking-[-0.03em]">
          <span className="text-grain">design</span>
          <Asterisks className="hidden size-14 lg:block" />
          <span className="text-grain">system</span>
        </h1>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-sm items-start gap-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-ink">
              <Recycle className="size-5" strokeWidth={1.5} />
            </span>
            <p className="text-sm text-ink-soft">
              Tokens e componentes base, lidos de <span className="font-mono text-xs">docs/design-system.md</span>.
              Use o botão de tema no topo para ver o modo escuro.
            </p>
          </div>
          <Button variant="outline" size="sm">
            nova coleção <ArrowUpRight strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <Section title="cores">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {swatches.map((swatch) => (
            <li key={swatch.token} className="overflow-hidden rounded-card border border-line-soft">
              <div className={`h-20 ${swatch.className}`} />
              <p className="px-3 py-2 font-mono text-micro">{swatch.token}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="tipografia">
        <div className="flex flex-col gap-10">
          <Specimen label="display-xl · unbounded 600 · grão">
            <p className="text-grain font-display text-display-xl font-semibold">drop 07</p>
          </Specimen>
          <Specimen label="display-lg · unbounded 600">
            <p className="font-display text-display-lg font-semibold">Sem excesso.</p>
          </Specimen>
          <Specimen label="h1 · unbounded 500">
            <p className="max-w-[20ch] font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-medium">
              Só original. Só estilo.
            </p>
          </Specimen>
          <Specimen label="body · lexend exa 400">
            <p className="max-w-[45ch] text-ink-soft">
              Silhuetas modernas, materiais de verdade e procedência garantida. Para quem escolhe pouco e escolhe bem.
            </p>
          </Specimen>
          <Specimen label="mono · jetbrains mono 400 · dados e medidas">
            <p className="font-mono text-sm tabular-nums">sku DD1391-100 · 42 br / 10.5 us / 44.5 eu · R$ 899,99</p>
          </Specimen>
        </div>
      </Section>

      <Section title="botões">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>adicionar à sacola</Button>
            <Button variant="outline">
              ver coleção <ArrowUpRight strokeWidth={1.5} />
            </Button>
            <Button variant="accent">entrar no drop</Button>
            <Button variant="ghost">cancelar</Button>
            <Button variant="link">ver guia de tamanhos</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">sm</Button>
            <Button size="md">md</Button>
            <Button size="lg">lg · finalizar compra</Button>
          </div>
        </div>
      </Section>

      <Section title="estados">
        <div className="grid gap-10 lg:grid-cols-2">
          <Specimen label="botão · carregando e desabilitado">
            <div className="flex flex-wrap items-center gap-3">
              <Button loading>processando pagamento</Button>
              <Button disabled>escolha um tamanho</Button>
            </div>
          </Specimen>

          <Specimen label="selos">
            <div className="flex flex-wrap gap-2">
              <ProductBadge badge="novo" />
              <ProductBadge badge="drop" />
              <ProductBadge badge="ultimas" />
              <ProductBadge badge="esgotado" />
            </div>
          </Specimen>

          <Field label="cep" hint="Usamos o CEP para calcular frete e prazo.">
            {(field) => <CepInput {...field} />}
          </Field>

          <Field label="e-mail" error="Faltou o @. Confira o endereço, ex.: voce@email.com">
            {(field) => <Input {...field} type="email" defaultValue="voce.email.com" />}
          </Field>

          <Specimen label="preço · cheio e com desconto">
            <div className="flex flex-wrap gap-10">
              <Price price={89999} showInstallments className="items-start" />
              <Price price={179999} compareAtPrice={199999} showInstallments className="items-start" />
            </div>
          </Specimen>

          {dunk && <SizePicker sizes={dunk.sizes} legend="tamanho (br)" />}
        </div>
      </Section>

      <Section title="card de produto">
        <ul className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          {sampleProducts.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} priority={index < 2} />
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-[60ch] text-xs text-mute-strong">
          Sem foto cadastrada, o card mostra o nome em display com grão. Com foto, a imagem aparece sobre o halo e troca
          para a segunda no hover.
        </p>
      </Section>
    </div>
  );
}
