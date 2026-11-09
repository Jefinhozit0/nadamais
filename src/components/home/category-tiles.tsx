import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { categories } from "@/data/products";
import type { Category, Product } from "@/types/product";
import { cn } from "@/lib/utils";

/**
 * Categorias em grade assimétrica: sneakers grande à esquerda, roupas e acessórios empilhados.
 * Texto sobre foto usa scrim escuro e branco fixo (legível nos dois temas).
 */
export function CategoryTiles({ covers }: { covers: Record<Category, Product | undefined> }) {
  return (
    <ul className="grid gap-3 md:grid-cols-12 md:grid-rows-2 md:gap-4">
      {categories.map((category, index) => {
        const cover = covers[category.slug]?.images[0];
        const big = index === 0;
        return (
          <li
            key={category.slug}
            className={cn(big ? "md:col-span-7 md:row-span-2" : "md:col-span-5", "min-h-0")}
          >
            <Link
              href={`/catalogo?categoria=${category.slug}`}
              className={cn(
                "group/tile relative flex h-full overflow-hidden rounded-card border border-line bg-haze",
                big ? "aspect-[4/5] md:aspect-auto md:min-h-[560px]" : "aspect-[16/10] md:aspect-auto md:min-h-[272px]",
              )}
            >
              {cover && (
                <Image
                  src={cover.src}
                  alt=""
                  fill
                  sizes={big ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 768px) 40vw, 100vw"}
                  className="object-cover transition-transform duration-1000 ease-out-expo group-hover/tile:scale-[1.04]"
                />
              )}
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="relative mt-auto flex w-full items-end justify-between gap-4 p-5 text-white md:p-6">
                <span>
                  <span
                    className={cn(
                      "block font-display leading-[0.9] font-semibold tracking-[-0.03em]",
                      big ? "text-[clamp(2.5rem,6vw,5rem)]" : "text-[clamp(2rem,3.6vw,3rem)]",
                    )}
                  >
                    {category.label}
                  </span>
                  <span className="mt-2 block text-xs text-white/85">{category.description}</span>
                </span>
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/70 transition-colors group-hover/tile:bg-white group-hover/tile:text-black">
                  <ArrowUpRight className="size-5" strokeWidth={1.5} aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
