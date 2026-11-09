import { BadgeCheck, PackageCheck, ReceiptText, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const promises: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: BadgeCheck,
    title: "procedência verificada",
    text: "Cada par passa por conferência de etiqueta, costura, caixa e SKU antes de sair daqui.",
  },
  {
    icon: ReceiptText,
    title: "nota fiscal em todo pedido",
    text: "Compra registrada, garantia do fabricante e nada de “importado sem nota”.",
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

/** Bloco de confiança — resposta direta para quem tem medo de comprar réplica. */
export function Authenticity() {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <h2
          id="autenticidade-title"
          className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
        >
          100% original. Ou seu dinheiro de volta.
        </h2>
        <p className="mt-5 max-w-[42ch] text-sm text-ink-soft">
          Trabalhamos só com distribuidores oficiais e lojas parceiras auditadas. Se algum item não for original, você
          recebe o valor integral, sem discussão.
        </p>
      </div>
      <ul className="lg:col-span-6 lg:col-start-7">
        {promises.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-4 border-t border-line-soft py-5 last:border-b">
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
