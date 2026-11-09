import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CartButton } from "@/components/cart/cart-button";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/**
 * Cantos como informação (ver design-system §4):
 * esquerda = marca · centro = navegação · direita = dados técnicos (busca, conta, sacola).
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 rounded-t-frame border-b border-line-soft bg-canvas/90 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75">
      <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-4 px-4 md:h-20 md:px-8 lg:grid-cols-[1fr_auto_1fr]">
        <Logo className="justify-self-start" />

        <nav aria-label="Principal" className="hidden lg:block">
          <NavLinks className="flex items-center gap-8 text-[0.8125rem]" />
        </nav>

        <div className="flex items-center justify-self-end gap-2">
          <SearchDialog />
          <ThemeToggle className="hidden lg:inline-flex" />
          <Link
            href="/conta"
            className="hidden rounded-sm px-2 py-3 font-mono text-xs text-mute-strong transition-colors hover:text-ink md:inline"
          >
            conta
          </Link>
          <CartButton />
          <div className="lg:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
