"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Alterna claro/escuro. Os ícones trocam via CSS (classe .dark no <html>),
 * então o HTML do servidor e do cliente é idêntico — sem erro de hidratação.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // armazenamento indisponível (modo privado): o tema vale só para esta visita
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      className={cn(className)}
    >
      <Moon className="dark:hidden" strokeWidth={1.5} />
      <Sun className="hidden dark:block" strokeWidth={1.5} />
    </Button>
  );
}
