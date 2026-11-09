import { Moon, Sun } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Alterna claro/escuro. O clique é tratado pelo ThemeScript (delegação no document),
 * então funciona antes mesmo da hidratação. Os ícones trocam via CSS (classe .dark),
 * mantendo o HTML do servidor e do cliente idênticos.
 */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      data-theme-toggle=""
      aria-label="Alternar tema claro/escuro"
      className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), className)}
    >
      <Moon className="dark:hidden" strokeWidth={1.5} aria-hidden="true" />
      <Sun className="hidden dark:block" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
