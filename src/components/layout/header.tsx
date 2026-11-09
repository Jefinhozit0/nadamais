import { Search } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

type HeaderProps = {
  /** Quantidade de itens na sacola. Ligado ao Zustand na Fase 3. */
  cartCount?: number;
};

/**
 * Cantos como informação (ver design-system §4):
 * esquerda = marca · centro = navegação · direita = dados técnicos (conta, sacola).
 */
export function Header({ cartCount = 0 }: HeaderProps) {
  const count = String(cartCount).padStart(2, "0");

  return (
    <header className="sticky top-0 z-40 rounded-t-frame border-b border-line-soft bg-canvas/90 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75">
      <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-4 px-4 md:h-20 md:px-8 lg:grid-cols-[1fr_auto_1fr]">
        <Logo className="justify-self-start" />

        <nav aria-label="Principal" className="hidden lg:block">
          <NavLinks className="flex items-center gap-8 text-[0.8125rem]" />
        </nav>

        <div className="flex items-center justify-self-end gap-1 md:gap-2">
          <Link
            href="/catalogo"
            aria-label="Buscar produtos"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <Search strokeWidth={1.5} />
          </Link>
          <ThemeToggle className="hidden lg:inline-flex" />
          <Link
            href="/conta"
            className="hidden rounded-sm px-2 font-mono text-xs text-mute-strong transition-colors hover:text-ink md:inline"
          >
            conta
          </Link>
          <Link
            href="/carrinho"
            aria-label={`Sacola, ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "font-mono normal-case",
            )}
          >
            sacola · {count}
          </Link>
          <div className="lg:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
