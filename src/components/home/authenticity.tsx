import { PackageCheck, ReceiptText, RotateCcw, Ruler } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const promises: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Ruler,
    title: "só original, conferido antes de sair",
    text: "Etiqueta, numeração, costura e acabamento revisados um a um. Se não passar, não vai.",
  },
  {
    icon: ReceiptText,
    title: "nota fiscal em todo pedido",
    text: "Compra registrada, com garantia contra defeito de fabricação.",
  },
  {
    icon: RotateCcw,
    title: "troca ou devolução em 30 dias",
    text: "Não serviu? A primeira troca é por nossa conta.",
  },
  {
    icon: PackageCheck,
    title: "envio para todo o Brasil",
    text: "Frete grátis acima de R$ 499. Rastreio do despacho até a sua porta.",
  },
];

/** Bloco de confiança: o que a loja garante em cada pedido. */
export function Authenticity() {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <h2
          id="qualidade-title"
          className="reveal font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
        >
          Só original. Com nota fiscal.
        </h2>
        <p className="mt-5 max-w-[42ch] text-sm text-ink-soft">
          Cada produto vem de fornecedor com nota fiscal e passa pela nossa conferência antes de entrar na loja. O
          que está na foto é o que chega na sua casa.
        </p>
      </div>
      <ul className="lg:col-span-6 lg:col-start-7">
        {promises.map(({ icon: Icon, title, text }) => (
          <li key={title} className="reveal flex gap-4 border-t border-line-soft py-5 last:border-b">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-ink">
              <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-medium">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
