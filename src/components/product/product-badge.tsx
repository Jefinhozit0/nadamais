import type { ProductBadge as Badge } from "@/types/product";
import { cn } from "@/lib/utils";

const labels: Record<Badge, string> = {
  novo: "novo",
  drop: "drop",
  ultimas: "últimas unidades",
  esgotado: "esgotado",
};

const styles: Record<Badge, string> = {
  novo: "border-ink text-ink",
  drop: "border-drop bg-drop text-canvas",
  ultimas: "border-drop bg-drop-soft text-drop",
  esgotado: "border-line-soft text-mute-strong",
};

export function ProductBadge({ badge, className }: { badge: Badge; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-micro lowercase",
        styles[badge],
        className,
      )}
    >
      {labels[badge]}
    </span>
  );
}
