import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Asterisks } from "@/components/brand/asterisks";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { heroImage } from "@/data/products";
import type { Product } from "@/types/product";
import { HeroFigure } from "./hero-figure";

/**
 * Hero da home — tradução direta da referência:
 * nome gigante dividido nas laterais, recorte do modelo ENTRE as palavras (sobrepondo),
 * manifesto no canto inferior esquerdo, card do drop no canto inferior direito.
 */
export function Hero({ drop }: { drop: Product }) {
  const words = siteConfig.name.split(" ");
  const [left, right] = words.length > 1 ? [words[0], words.slice(1).join(" ")] : [siteConfig.name, ""];
  const dropImage = drop.images[0];

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden px-4 pt-6 md:px-8 lg:h-[min(calc(100svh-7.5rem),860px)] lg:min-h-[640px] lg:pt-8"
    >
      {/* halo atrás do modelo */}
      <div aria-hidden="true" className="bg-halo absolute inset-x-0 top-[10%] bottom-0 -z-10" />

      <div className="flex items-start justify-between font-mono text-micro text-mute-strong">
        <p>
          drop {drop.releasedAt.slice(5, 7)}.{drop.releaseYear}
        </p>
        <p className="hidden sm:block">sneakers · roupas · acessórios</p>
      </div>

      {/* Título: palavras nas laterais. No mobile empilham (esq. em cima, dir. embaixo). */}
      <h1
        id="hero-title"
        className="relative z-0 mt-6 flex items-baseline justify-between font-display text-[12.5vw] leading-[0.86] font-semibold tracking-[-0.035em] lg:absolute lg:inset-x-8 lg:top-[26%] lg:mt-0 lg:text-[clamp(5rem,9.5vw,9.5rem)]"
      >
        <span className="block overflow-hidden pb-[0.06em]">
          <span className="text-grain block animate-rise">{left}</span>
        </span>
        {right && (
          <span className="block overflow-hidden pb-[0.06em]">
            <span className="text-grain block animate-rise [--rise-delay:120ms]">{right}</span>
          </span>
        )}
        <span className="sr-only">: sneakers e streetwear originais</span>
      </h1>

      {/* Recorte: sobrepõe o título (z-10), ancorado na base */}
      <HeroFigure
        image={heroImage}
        className="relative z-10 mx-auto -mt-[4vw] aspect-[1051/1800] h-[min(100vw,500px)] max-w-none lg:absolute lg:bottom-0 lg:left-1/2 lg:mt-0 lg:h-[90%] lg:-translate-x-1/2"
      />

      {/* Canto inferior esquerdo: manifesto */}
      <div className="relative z-20 mt-8 max-w-sm pb-8 lg:max-w-[min(24rem,29vw)] lg:absolute lg:bottom-10 lg:left-8 lg:mt-0 lg:pb-0">
        <span className="inline-flex size-10 items-center justify-center rounded-sm border border-ink bg-canvas">
          <ShieldCheck className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="mt-4 font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.1] font-medium tracking-tight">
          Só original. Nada além do necessário.
        </p>
        <p className="mt-3 max-w-[34ch] text-xs leading-relaxed text-ink-soft">
          Sneakers e streetwear de Nike, Jordan, adidas, New Balance, Stüssy e Carhartt WIP. Procedência verificada em
          cada par.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/catalogo?categoria=sneakers" className={buttonVariants({ variant: "solid" })}>
            ver sneakers
          </Link>
          <Link href="/catalogo" className={buttonVariants({ variant: "outline" })}>
            catálogo
          </Link>
        </div>
      </div>

      {/* Canto inferior direito: card do drop */}
      <div className="relative z-20 pb-8 lg:absolute lg:right-8 lg:bottom-10 lg:pb-0">
        <Link
          href={`/produto/${drop.slug}`}
          className="group/drop flex items-center gap-4 lg:flex-col lg:items-stretch lg:gap-3"
        >
          <span className="relative block aspect-square w-28 shrink-0 overflow-hidden rounded-card border border-line bg-haze lg:w-52">
            {dropImage && (
              <Image
                src={dropImage.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 208px, 112px"
                className="object-cover transition-transform duration-700 ease-out-expo group-hover/drop:scale-105"
              />
            )}
            <span className="absolute inset-x-0 bottom-2 text-center font-mono text-micro font-medium text-white mix-blend-difference">
              {drop.releaseYear}
            </span>
          </span>
          <span className="flex flex-col gap-2 lg:items-stretch">
            <span className="text-sm lowercase lg:hidden">{drop.name}</span>
            <span className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit lg:w-full" })}>
              novo drop <ArrowUpRight strokeWidth={1.5} aria-hidden="true" />
              <span className="sr-only">: {drop.name}</span>
            </span>
          </span>
        </Link>
      </div>

      <Asterisks className="absolute top-[18%] right-8 hidden size-8 lg:block" />
    </section>
  );
}
