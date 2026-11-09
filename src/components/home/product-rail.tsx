"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Trilho horizontal com scroll-snap. Funciona com toque, trackpad e teclado (Tab entre cards);
 * os botões ← → são atalho para mouse.
 */
export function ProductRail({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function scroll(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={ref}
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] md:-mx-8 md:scroll-px-8 md:gap-4 md:px-8"
      >
        {children}
      </ul>
      <div className="mt-2 hidden justify-end gap-2 md:flex">
        <Button variant="outline" size="icon-sm" onClick={() => scroll(-1)} disabled={edges.start} aria-label="Anteriores">
          <ArrowLeft strokeWidth={1.5} />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => scroll(1)} disabled={edges.end} aria-label="Próximos">
          <ArrowRight strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
