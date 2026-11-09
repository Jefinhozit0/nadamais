import { ArrowUpRight, Recycle } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Asterisks } from "@/components/brand/asterisks";
import { Price } from "@/components/product/price";
import { ProductBadge } from "@/components/product/product-badge";
import { ProductCard } from "@/components/product/product-card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
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

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line-soft py-12 md:grid-cols-12 md:py-16">
      <header className="md:col-span-3">
        <p className="font-mono text-micro text-mute-strong">{index}</p>
        <h2 className="mt-1 font-display text-xl font-medium tracking-tight">{title}</h2>
      </header>
      <div className="md:col-span-9">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="px-4 md:px-8">
      {/* Abertura: título gigante dividido nas laterais, como na referência */}
      <div className="relative flex min-h-[min(60vh,640px)] flex-col justify-between gap-8 py-10 md:py-14">
        <div className="flex items-start justify-between">
          <p className="font-mono text-micro text-mute-strong">fase 1 · tokens e componentes base</p>
          <ThemeToggle />
        </div>

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
              Fonte única de verdade: <span className="font-mono text-xs">docs/design-system.md</span>. Tudo aqui
              lê os mesmos tokens nos temas claro e escuro.
            </p>
          </div>
          <Button variant="outline" size="sm">
            nova coleção <ArrowUpRight strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <Section index="01" title="cores">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {swatches.map((swatch) => (
            <li key={swatch.token} className="overflow-hidden rounded-card border border-line-soft">
              <div className={`h-20 ${swatch.className}`} />
              <p className="px-3 py-2 font-mono text-micro">{swatch.token}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="02" title="tipografia">
        <div className="flex flex-col gap-8">
          <div>
            <p className="font-mono text-micro text-mute-strong">display-xl · unbounded 600 · grão</p>
            <p className="text-grain font-display text-display-xl font-semibold">drop 07</p>
          </div>
          <div>
            <p className="font-mono text-micro text-mute-strong">display-lg · unbounded 600</p>
            <p className="font-display text-display-lg font-semibold">Sem excesso.</p>
          </div>
          <div>
            <p className="font-mono text-micro text-mute-strong">h1 · unbounded 500</p>
            <p className="max-w-[20ch] font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-medium">
              Só original. Só estilo.
            </p>
          </div>
          <div>
            <p className="font-mono text-micro text-mute-strong">body · lexend exa 400</p>
            <p className="max-w-[45ch] text-ink-soft">
              Silhuetas modernas, materiais de verdade e procedência garantida. Para quem escolhe pouco e escolhe bem.
            </p>
          </div>
          <div>
            <p className="font-mono text-micro text-mute-strong">mono · jetbrains mono 400</p>
            <p className="font-mono text-sm">sku DD1391-100 · tam 42 br / 10.5 us / 44.5 eu · R$ 899,99</p>
          </div>
        </div>
      </Section>

      <Section index="03" title="botões">
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
            <Button size="lg">lg — finalizar compra</Button>
            <Button disabled>desabilitado</Button>
          </div>
        </div>
      </Section>

      <Section index="04" title="selos, preço, campos">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-2">
            <ProductBadge badge="novo" />
            <ProductBadge badge="drop" />
            <ProductBadge badge="ultimas" />
            <ProductBadge badge="esgotado" />
          </div>
          <div className="flex flex-wrap gap-10">
            <Price price={89999} showInstallments className="items-start" />
            <Price price={179999} compareAtPrice={199999} showInstallments className="items-start" />
          </div>
          <div className="grid max-w-md gap-2">
            <label htmlFor="cep" className="text-sm">
              cep
            </label>
            <Input id="cep" inputMode="numeric" placeholder="00000-000" className="h-11 rounded-sm px-4" />
          </div>
        </div>
      </Section>

      <Section index="05" title="card de produto">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sampleProducts.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} priority={index < 2} />
            </li>
          ))}
        </ul>
        <p className="mt-4 font-mono text-micro text-mute-strong">
          sem foto cadastrada → placeholder tipográfico. Com foto → next/image sobre o halo, troca para a 2ª imagem no
          hover.
        </p>
      </Section>
    </div>
  );
}
