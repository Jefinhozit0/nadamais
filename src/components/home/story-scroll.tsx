"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Scrollytelling da home: "da origem ao seu pé" — o caminho de um par original até o cliente.
 * A foto fica presa (sticky) enquanto as 4 etapas rolam ao lado; cada etapa aproxima
 * a câmera de um ponto da MESMA foto (zoom com transform-origin no ponto focal).
 * Sem JS ou com movimento reduzido, vira uma lista comum com a foto inteira.
 */

type Step = {
  n: string;
  title: string;
  text: string;
  /** Ponto focal na foto (% x, % y) e quanto aproximar. */
  focus: { x: number; y: number; scale: number };
  detail: string;
};

const steps: Step[] = [
  {
    n: "01",
    title: "procedência",
    text: "Cada par entra no estoque com nota fiscal do fornecedor. Sem origem comprovada, não vai para a loja.",
    focus: { x: 55, y: 60, scale: 1 },
    detail: "nota fiscal de origem",
  },
  {
    n: "02",
    title: "autenticidade",
    text: "Antes de anunciar, conferimos etiqueta, numeração, costura e acabamento de cada par, comparando com o padrão do modelo.",
    focus: { x: 72, y: 50, scale: 2.1 },
    detail: "etiqueta e acabamento",
  },
  {
    n: "03",
    title: "conferência",
    text: "Na hora de separar o pedido, olhamos de novo: tamanho certo, sem marca de uso, sola e colagem perfeitas. Se não passar, não vai.",
    focus: { x: 66, y: 72, scale: 2.4 },
    detail: "sola e colagem",
  },
  {
    n: "04",
    title: "entrega",
    text: "Vai na caixa original, protegida para a viagem, com nota fiscal e rastreio até a sua porta. Não serviu? A primeira troca é por nossa conta.",
    focus: { x: 22, y: 74, scale: 1.7 },
    detail: "embalagem",
  },
];

const IMAGE = {
  src: "/images/products/court-gum-areia.jpg",
  alt: "Par de tênis de camurça areia com sola de borracha cor de mel, um apoiado sobre a caixa verde.",
};

export function StoryScroll() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const els = stepRefs.current.filter((el): el is HTMLLIElement => el !== null);
    // a etapa "ativa" é a que cruza uma faixa abaixo do meio da tela (no celular, abaixo da foto presa)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-58% 0px -30% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const focus = steps[active]!.focus;

  return (
    <div className="grid gap-x-12 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <p className="font-mono text-micro text-mute-strong">do estoque até você</p>
        <h2
          id="historia-title"
          className="reveal mt-3 max-w-[14ch] font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
        >
          da origem ao seu pé.
        </h2>
      </div>

      {/* Foto presa: no celular fica no topo; no desktop, à direita */}
      <div className="sticky top-[4.75rem] z-10 mt-8 -mx-4 px-4 lg:top-28 lg:order-2 lg:col-span-6 lg:col-start-7 lg:mx-0 lg:mt-16 lg:self-start lg:px-0">
        <figure className="relative mx-auto aspect-[4/5] max-h-[40svh] overflow-hidden rounded-card border border-line bg-haze lg:aspect-[2/3] lg:max-h-[calc(100svh-9rem)]">
          <div
            className="absolute inset-0 transition-[transform,transform-origin] duration-[900ms] ease-out-expo will-change-transform motion-reduce:transition-none"
            style={{ transform: `scale(${focus.scale})`, transformOrigin: `${focus.x}% ${focus.y}%` }}
          >
            <Image src={IMAGE.src} alt={IMAGE.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>

          {/* Legenda técnica (cantos como informação) */}
          <figcaption
            aria-hidden="true"
            className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-full border border-line bg-canvas/90 px-4 py-2 font-mono text-micro backdrop-blur-sm"
          >
            <span className="tabular-nums">
              {steps[active]!.n} <span className="text-mute-strong">/ 0{steps.length}</span>
            </span>
            <span key={active} className="truncate animate-[fade-in_400ms_var(--ease-out-expo)_both]">
              {steps[active]!.detail}
            </span>
          </figcaption>

          {/* Régua de progresso das etapas */}
          <div aria-hidden="true" className="absolute inset-x-3 top-3 flex gap-1.5">
            {steps.map((s, i) => (
              <span key={s.n} className="h-0.5 flex-1 overflow-hidden rounded-full bg-canvas/60">
                <span
                  className={cn(
                    "block h-full origin-left bg-ink transition-transform duration-500 ease-out-expo",
                    i <= active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </span>
            ))}
          </div>
        </figure>
      </div>

      <ol className="relative lg:order-1 lg:col-span-5 lg:mt-16">
        {steps.map((step, i) => (
          <li
            key={step.n}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            data-step={i}
            className="flex min-h-[70svh] items-end pb-[6svh] lg:min-h-[78svh] lg:items-center lg:pb-0"
          >
            <div
              className={cn(
                "relative z-20 w-full rounded-card border bg-canvas p-5 transition-[border-color] duration-500 lg:border-0 lg:bg-transparent lg:p-0",
                i === active ? "border-line" : "border-line-soft",
              )}
            >
              <p className="font-mono text-micro text-mute-strong tabular-nums">
                {step.n} <span aria-hidden="true">—</span>
              </p>
              {/* etapa inativa: título em mute-strong (passa AA) em vez de opacidade, que reprovaria o contraste */}
              <h3
                className={cn(
                  "mt-2 font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-none font-semibold tracking-[-0.03em] transition-colors duration-500",
                  i !== active && "lg:text-mute-strong",
                )}
              >
                {step.title}
              </h3>
              <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-ink-soft">{step.text}</p>
              {i === steps.length - 1 && (
                <Link
                  href="/catalogo?categoria=sneakers"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-sm py-2 text-sm underline-offset-4 hover:underline"
                >
                  ver sneakers <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
