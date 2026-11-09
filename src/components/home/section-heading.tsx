import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id: string;
  title: string;
  aside?: ReactNode;
  link?: { href: string; label: string };
  className?: string;
};

/** Título de seção: display à esquerda, link ↗ à direita (cantos como informação). */
export function SectionHeading({ id, title, aside, link, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <h2 id={id} className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      <div className="flex items-center gap-4">
        {aside}
        {link && (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1.5 rounded-sm py-2 text-sm underline-offset-4 hover:underline"
          >
            {link.label} <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
