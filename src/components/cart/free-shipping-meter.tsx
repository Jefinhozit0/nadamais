import { siteConfig } from "@/config/site";
import { formatBRL } from "@/lib/format";

/** Barra de progresso até o frete grátis (só a faixa econômica). */
export function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const goal = siteConfig.freeShippingFrom;
  const remaining = Math.max(0, goal - subtotal);
  const pct = Math.min(100, Math.round((subtotal / goal) * 100));

  return (
    <div>
      <p className="text-xs">
        {remaining === 0 ? (
          <>
            <strong className="font-medium">Frete grátis</strong> liberado na entrega econômica.
          </>
        ) : (
          <>
            Faltam <strong className="font-mono font-medium tabular-nums">{formatBRL(remaining)}</strong> para frete
            grátis.
          </>
        )}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Progresso até o frete grátis"
        className="mt-2 h-1 overflow-hidden rounded-full bg-haze"
      >
        <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out-expo" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
