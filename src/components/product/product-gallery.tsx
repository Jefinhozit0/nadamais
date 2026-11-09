"use client";

import { Maximize2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ProductImage } from "@/types/product";
import { cn } from "@/lib/utils";

/**
 * Galeria com zoom:
 * - desktop (ponteiro fino): lupa — a imagem amplia 2.2× seguindo o cursor;
 * - qualquer dispositivo: botão "ampliar" abre a foto em tela cheia;
 * - miniaturas trocam a imagem principal.
 */
export function ProductGallery({ images, name }: { images: readonly ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const current = images[index];

  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoom({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  if (!current) {
    return (
      <div className="bg-halo flex aspect-[4/5] items-center justify-center rounded-card border border-line">
        <span className="text-grain font-display text-5xl font-semibold lowercase">{name}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div
        ref={frameRef}
        onPointerMove={onMove}
        onPointerLeave={() => setZoom(null)}
        className={cn(
          "relative aspect-[4/5] flex-1 overflow-hidden rounded-card border border-line bg-haze",
          zoom && "cursor-zoom-in",
        )}
      >
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          className={cn(
            "animate-in fade-in duration-500",
            current.kind === "cutout" ? "object-contain p-[8%]" : "object-cover",
            "transition-transform duration-300 ease-out-expo",
            zoom && "scale-[2.2]",
          )}
        />
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute right-3 bottom-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-canvas/90 backdrop-blur-sm transition-colors hover:bg-ink hover:text-canvas"
        >
          <Maximize2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only">Ampliar foto</span>
        </button>
        {images.length > 1 && (
          <span className="absolute bottom-4 left-4 rounded-full bg-canvas/90 px-2.5 py-1 font-mono text-micro tabular-nums backdrop-blur-sm">
            {index + 1}/{images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 lg:w-20 lg:flex-col" aria-label="Fotos do produto">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                className={cn(
                  "relative block aspect-square w-20 cursor-pointer overflow-hidden rounded-sm border bg-haze transition-colors",
                  i === index ? "border-ink" : "border-line-soft hover:border-ink-soft",
                )}
              >
                <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="h-[92dvh] max-w-[calc(100%-1.5rem)] p-0 sm:max-w-[min(92vw,1100px)]">
          <DialogTitle className="sr-only">{current.alt}</DialogTitle>
          <div className="relative h-full w-full overflow-auto rounded-frame">
            <Image src={current.src} alt={current.alt} fill sizes="92vw" className="object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
