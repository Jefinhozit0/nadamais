import { cn } from "@/lib/utils";

/** Cluster de cinco asteriscos — ornamento da marca. Decorativo. */
export function Asterisks({ className }: { className?: string }) {
  const stars: readonly [number, number][] = [
    [6, 4],
    [14, 6],
    [4, 12],
    [12, 14],
    [20, 13],
  ];
  return (
    <svg
      viewBox="0 0 24 18"
      aria-hidden="true"
      className={cn("text-ink", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
    >
      {stars.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <path d="M0 -2.6V2.6M-2.25 -1.3L2.25 1.3M-2.25 1.3L2.25 -1.3" />
        </g>
      ))}
    </svg>
  );
}
