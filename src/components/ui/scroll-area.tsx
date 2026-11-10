"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Área com rolagem vertical e a mesma régua do trilho da home (product-rail):
 * linha de 1px em line-soft com polegar em tinta, que engrossa no hover e pode ser clicada ou arrastada.
 * A barra nativa fica escondida; roda do mouse, toque, teclado e Tab continuam funcionando normalmente.
 */
export function ScrollArea({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ progress: 0, ratio: 1 });
  const [scrubbing, setScrubbing] = useState(false);
  const scrub = useRef<{ offset: number } | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setState({
      progress: max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0,
      ratio: el.scrollHeight > 0 ? Math.min(1, el.clientHeight / el.scrollHeight) : 1,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onChange, { passive: true });
    // muda quando a janela muda de tamanho e quando grupos de filtro abrem/fecham
    const resize = new ResizeObserver(onChange);
    resize.observe(el);
    if (el.firstElementChild) resize.observe(el.firstElementChild);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onChange);
      resize.disconnect();
    };
  }, [measure]);

  function scrubTo(clientY: number, grabOffset: number) {
    const el = ref.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const usable = rect.height - rect.height * state.ratio;
    if (usable <= 0) return;
    const frac = Math.min(1, Math.max(0, (clientY - rect.top - grabOffset) / usable));
    el.scrollTop = frac * (el.scrollHeight - el.clientHeight);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || event.button !== 0) return;
    event.preventDefault();
    const rect = track.getBoundingClientRect();
    const thumbHeight = rect.height * state.ratio;
    const thumbTop = rect.top + (rect.height - thumbHeight) * state.progress;
    const onThumb = event.clientY >= thumbTop && event.clientY <= thumbTop + thumbHeight;
    // segurou no polegar: mantém o ponto de pega; clicou na linha: centraliza o polegar ali
    const offset = onThumb ? event.clientY - thumbTop : thumbHeight / 2;
    scrub.current = { offset };
    track.setPointerCapture(event.pointerId);
    setScrubbing(true);
    scrubTo(event.clientY, offset);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (scrub.current) scrubTo(event.clientY, scrub.current.offset);
  }

  function endScrub(event: ReactPointerEvent<HTMLDivElement>) {
    if (!scrub.current) return;
    scrub.current = null;
    if (trackRef.current?.hasPointerCapture(event.pointerId)) trackRef.current.releasePointerCapture(event.pointerId);
    setScrubbing(false);
  }

  const overflowing = state.ratio < 0.999;

  return (
    <div className={cn("relative flex", className)}>
      <div ref={ref} className="min-h-0 flex-1 overflow-y-auto pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div>{children}</div>
      </div>

      {overflowing && (
        // Decorativa para leitores de tela: roda, teclado e Tab cobrem o acesso.
        <div
          ref={trackRef}
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          className="group/track absolute inset-y-0 right-0 flex w-4 cursor-pointer touch-none justify-center"
        >
          <div className="h-full w-px bg-line-soft" />
          <div
            className={cn(
              "absolute top-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-ink",
              "transition-[width] duration-200 group-hover/track:w-1 motion-reduce:transition-none",
              scrubbing && "w-1",
            )}
            style={{
              height: `${state.ratio * 100}%`,
              transform: `translate(-50%, ${(state.progress * (1 - state.ratio) * 100) / state.ratio}%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
