"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { catalogHref } from "@/lib/catalog";
type BrandRow = { brand: string; count: number; cover?: { src: string } };

/**
 * Índice das marcas em tipografia grande (editorial, não grade de cards).
 * No desktop, passar o mouse mostra a peça mais procurada da marca.
 */
export function BrandIndex({ rows }: { rows: BrandRow[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const active = rows.find((r) => r.brand === hovered);

  return (
    <div className="relative" onMouseLeave={() => setHovered(null)}>
      <ul>
        {rows.map((row) => (
          <li key={row.brand} className="border-t border-line-soft last:border-b">
            <Link
              href={catalogHref({ marcas: [row.brand] })}
              onMouseEnter={() => setHovered(row.brand)}
              onFocus={() => setHovered(row.brand)}
              className="group/line flex items-baseline justify-between gap-4 py-4 md:py-5"
            >
              <span className="min-w-0">
                <span className="block font-display text-[clamp(2rem,6.5vw,5.25rem)] leading-[0.95] font-semibold tracking-[-0.03em] transition-[color,transform] duration-500 ease-out-expo group-hover/line:translate-x-2 group-hover/line:text-ink group-focus-visible/line:text-ink lg:text-mute-strong">
                  {row.brand.toLowerCase()}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3 font-mono text-xs text-mute-strong">
                {row.count} {row.count === 1 ? "produto" : "produtos"}
                <ArrowUpRight className="size-5 text-ink" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active?.cover && (
          <motion.div
            key={active.brand}
            aria-hidden="true"
            initial={reduce ? false : { opacity: 0, scale: 0.96, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute top-1/2 right-[18%] hidden aspect-[4/5] w-56 -translate-y-1/2 overflow-hidden rounded-card border border-line bg-haze lg:block"
          >
            <Image src={active.cover.src} alt="" fill sizes="224px" className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
