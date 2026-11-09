import { discountPercent, formatBRL, formatInstallments } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceProps = {
  price: number;
  compareAtPrice?: number;
  showInstallments?: boolean;
  className?: string;
};

export function Price({ price, compareAtPrice, showInstallments = false, className }: PriceProps) {
  const off = compareAtPrice ? discountPercent(price, compareAtPrice) : 0;

  return (
    <div className={cn("flex flex-col items-end gap-0.5 font-mono tabular-nums", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        {off > 0 && compareAtPrice && (
          <>
            <span className="sr-only">De</span>
            <s className="text-micro text-mute-strong">{formatBRL(compareAtPrice)}</s>
            <span className="sr-only">por</span>
          </>
        )}
        <span className={cn(off > 0 && "text-drop")}>{formatBRL(price)}</span>
      </p>
      {showInstallments && (
        <p className="text-micro text-mute-strong">ou {formatInstallments(price)} sem juros</p>
      )}
    </div>
  );
}
