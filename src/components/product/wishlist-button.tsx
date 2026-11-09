"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toggleWishlist } from "@/app/conta/actions";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/store/wishlist";

/**
 * Favoritar. Logado: salva na conta (otimista, desfaz se falhar).
 * Sem login: leva para /entrar e volta para a página atual.
 */
export function WishlistButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const load = useWishlist((s) => s.load);
  const authenticated = useWishlist((s) => s.authenticated);
  const status = useWishlist((s) => s.status);
  const saved = useWishlist((s) => s.ids.has(productId));
  const setSaved = useWishlist((s) => s.set);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void load();
  }, [load]);

  function onClick() {
    if (status === "ready" && !authenticated) {
      router.push(`/entrar?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const next = !saved;
    setSaved(productId, next);
    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (!result) {
        setSaved(productId, !next);
        router.push(`/entrar?next=${encodeURIComponent(pathname)}`);
      } else if (result.saved !== next) {
        setSaved(productId, result.saved);
      }
    });
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-busy={pending || undefined}
      aria-label={saved ? `Remover ${productName} dos favoritos` : `Favoritar ${productName}`}
      onClick={onClick}
      className={cn(
        // 36px visível, 44px de área de toque via pseudo-elemento
        "relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent bg-canvas/85 text-ink backdrop-blur-sm transition-colors hover:border-ink",
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
