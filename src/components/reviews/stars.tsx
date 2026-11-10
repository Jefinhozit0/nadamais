import { Star } from "lucide-react";
import { formatRating } from "@/lib/reviews";
import { cn } from "@/lib/utils";

type StarsProps = {
  /** 0–5, aceita fração (4,6 pinta 4 estrelas e 60% da quinta). */
  value: number;
  className?: string;
  /** Tamanho de cada estrela (classe Tailwind). */
  starClassName?: string;
  /** Texto para leitores de tela; sem ele as estrelas ficam decorativas. */
  label?: string;
};

/** Estrelas em ink (o acento drop fica reservado para urgência — design-system §2). */
export function Stars({ value, className, starClassName = "size-3.5", label }: StarsProps) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (filled: boolean) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn("shrink-0", starClassName)}
        strokeWidth={1.5}
        fill={filled ? "currentColor" : "none"}
        aria-hidden="true"
      />
    ));

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-flex w-fit shrink-0 text-ink", className)}
    >
      <span className="flex gap-0.5 text-line-soft">{row(false)}</span>
      <span className="absolute inset-0 flex gap-0.5 overflow-hidden" style={{ width: `${percent}%` }}>
        {row(true)}
      </span>
    </span>
  );
}

export function starsLabel(value: number): string {
  return `nota ${formatRating(value)} de 5`;
}
