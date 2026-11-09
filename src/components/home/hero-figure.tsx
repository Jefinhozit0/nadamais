"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import type { ProductImage } from "@/types/product";
import { cn } from "@/lib/utils";

/**
 * Recorte do hero com parallax leve (≤ 24px) no scroll.
 * A imagem não tem fade de entrada: ela é o LCP e precisa pintar imediatamente.
 */
export function HeroFigure({ image, className }: { image: ProductImage; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 24]);

  return (
    <div ref={ref} className={cn("pointer-events-none", className)}>
      <motion.div style={{ y }} className="relative h-full w-full">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          fetchPriority="high"
          sizes="(min-width: 1024px) 30vw, 70vw"
          className="object-contain object-bottom"
        />
      </motion.div>
    </div>
  );
}
