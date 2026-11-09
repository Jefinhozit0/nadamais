"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const items = [
  { href: "/conta", label: "resumo" },
  { href: "/conta/pedidos", label: "pedidos" },
  { href: "/conta/enderecos", label: "endereços" },
  { href: "/conta/favoritos", label: "favoritos" },
  { href: "/conta/dados", label: "meus dados" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Minha conta" className="flex flex-col gap-4">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {items.map((item) => {
          const active = item.href === "/conta" ? pathname === "/conta" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center rounded-full px-4 text-sm transition-colors lg:rounded-sm lg:px-3",
                  active ? "bg-ink text-canvas" : "text-mute-strong hover:bg-haze hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={signOut} className="hidden lg:block">
        <button type="submit" className="h-10 cursor-pointer px-3 text-sm text-mute-strong underline-offset-4 hover:text-ink hover:underline">
          sair
        </button>
      </form>
    </nav>
  );
}
