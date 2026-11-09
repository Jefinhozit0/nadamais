"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Favoritar. Estado local por enquanto; persiste na conta na Fase 4. */
export function WishlistButton({ productName, className }: { productName: string; className?: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remover ${productName} dos favoritos` : `Favoritar ${productName}`}
      onClick={() => setSaved((value) => !value)}
      className={cn(
        // 36px visível, 44px de área de toque via pseudo-elemento
        "relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent text-ink transition-colors hover:border-ink",
        "before:absolute before:-inset-1 before:content-['']",
        className,
      )}
    >
      <Heart
        className={cn("size-4 transition-[fill,scale] duration-200", saved && "scale-110 fill-drop text-drop")}
        strokeWidth={1.5}
      />
    </button>
  );
}
