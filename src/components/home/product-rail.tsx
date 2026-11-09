"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RailState = {
  /** 0–1: quanto já rolou. */
  progress: number;
  /** 0–1: fração visível do trilho (largura do polegar). */
  ratio: number;
  first: number;
  last: number;
  total: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Trilho horizontal com scroll-snap. Funciona com toque, trackpad, teclado (Tab entre cards),
 * arrastar com o mouse, e uma régua própria (contador + linha arrastável + setas) no lugar da barra nativa.
 */
export function ProductRail({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RailState>({ progress: 0, ratio: 1, first: 1, last: 1, total: 0 });
  const [scrubbing, setScrubbing] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const items = Array.from(el.children) as HTMLElement[];
    const left = el.scrollLeft;
    const right = left + el.clientWidth;
    // um card conta como visível quando mais da metade dele está na tela
    const visible = items
      .map((item, i) => ({ i, mid: item.offsetLeft + item.offsetWidth / 2 }))
      .filter(({ mid }) => mid >= left && mid <= right)
      .map(({ i }) => i + 1);
    setState({
      progress: max > 0 ? Math.min(1, Math.max(0, left / max)) : 0,
      ratio: el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1,
      first: visible[0] ?? 1,
      last: visible.at(-1) ?? 1,
      total: items.length,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(onScroll);
    resize.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      resize.disconnect();
    };
  }, [measure]);

  function scroll(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  /* ---------------- arrastar o próprio trilho com o mouse ---------------- */
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);

  function onRailPointerDown(event: ReactPointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return; // toque já rola nativamente
    const el = ref.current;
    if (!el) return;
    drag.current = { x: event.clientX, scroll: el.scrollLeft, moved: false };
  }

  function onRailPointerMove(event: ReactPointerEvent<HTMLUListElement>) {
    const el = ref.current;
    const d = drag.current;
    if (!el || !d) return;
    const dx = event.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) {
      d.moved = true;
      el.setPointerCapture(event.pointerId);
      el.style.scrollSnapType = "none";
      el.dataset.dragging = "true";
    }
    el.scrollLeft = d.scroll - dx;
  }

  function endRailDrag(event: ReactPointerEvent<HTMLUListElement>) {
    const el = ref.current;
    const d = drag.current;
    drag.current = null;
    if (!el || !d?.moved) return;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    el.style.scrollSnapType = "";
    delete el.dataset.dragging;
    // o clique que encerra o arraste não deve abrir o produto
    const swallow = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => el.removeEventListener("click", swallow, { capture: true }), 0);
  }

  /* ---------------- régua: clicar ou arrastar a linha ---------------- */
  function scrubTo(clientX: number, grabOffset: number) {
    const el = ref.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const thumb = rect.width * state.ratio;
    const usable = rect.width - thumb;
    if (usable <= 0) return;
    const frac = Math.min(1, Math.max(0, (clientX - rect.left - grabOffset) / usable));
    el.scrollLeft = frac * (el.scrollWidth - el.clientWidth);
  }

  const scrub = useRef<{ offset: number } | null>(null);

  function onTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const track = trackRef.current;
    if (!el || !track || event.button !== 0) return;
    event.preventDefault();
    const rect = track.getBoundingClientRect();
    const thumbWidth = rect.width * state.ratio;
    const thumbLeft = rect.left + (rect.width - thumbWidth) * state.progress;
    const onThumb = event.clientX >= thumbLeft && event.clientX <= thumbLeft + thumbWidth;
    // segurou no polegar: mantém o ponto de pega; clicou na linha: centraliza o polegar ali
    const offset = onThumb ? event.clientX - thumbLeft : thumbWidth / 2;
    scrub.current = { offset };
    track.setPointerCapture(event.pointerId);
    el.style.scrollSnapType = "none";
    setScrubbing(true);
    scrubTo(event.clientX, offset);
  }

  function onTrackPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (scrub.current) scrubTo(event.clientX, scrub.current.offset);
  }

  function endScrub(event: ReactPointerEvent<HTMLDivElement>) {
    if (!scrub.current) return;
    scrub.current = null;
    const track = trackRef.current;
    if (track?.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (ref.current) ref.current.style.scrollSnapType = "";
    setScrubbing(false);
  }

  const overflowing = state.ratio < 0.999;
  const atStart = state.progress <= 0.005;
  const atEnd = state.progress >= 0.995;

  return (
    <div className="relative">
      <ul
        ref={ref}
        aria-label={label}
        onPointerDown={onRailPointerDown}
        onPointerMove={onRailPointerMove}
        onPointerUp={endRailDrag}
        onPointerCancel={endRailDrag}
        onDragStart={(event) => event.preventDefault()}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:scroll-px-8 md:gap-4 md:px-8",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "md:cursor-grab data-[dragging=true]:cursor-grabbing data-[dragging=true]:select-none",
        )}
      >
        {children}
      </ul>

      {overflowing && (
        <div className="mt-5 flex items-center gap-4 md:gap-6">
          <p className="shrink-0 font-mono text-micro text-mute-strong tabular-nums" aria-live="polite">
            <span className="text-ink">
              {pad(state.first)}
              {state.last !== state.first && `–${pad(state.last)}`}
            </span>
            <span aria-hidden="true"> / </span>
            <span className="sr-only"> de </span>
            {pad(state.total)}
          </p>

          {/* Régua: linha de 1px com polegar em tinta. Decorativa para leitores de tela (setas e Tab cobrem o acesso). */}
          <div
            ref={trackRef}
            aria-hidden="true"
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
            className="group/track relative flex h-8 flex-1 cursor-pointer touch-none items-center"
          >
            <div className="h-px w-full bg-line-soft" />
            <div
              className={cn(
                "absolute top-1/2 left-0 h-0.5 -translate-y-1/2 rounded-full bg-ink",
                "transition-[height] duration-200 group-hover/track:h-1 motion-reduce:transition-none",
                scrubbing && "h-1",
              )}
              style={{
                width: `${state.ratio * 100}%`,
                transform: `translate(${(state.progress * (1 - state.ratio) * 100) / state.ratio}%, -50%)`,
              }}
            />
          </div>

          <div className="hidden shrink-0 gap-2 md:flex">
            <Button variant="outline" size="icon-sm" onClick={() => scroll(-1)} disabled={atStart} aria-label="Anteriores">
              <ArrowLeft strokeWidth={1.5} />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => scroll(1)} disabled={atEnd} aria-label="Próximos">
              <ArrowRight strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
