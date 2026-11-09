"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "visão geral" },
  { href: "/admin/produtos", label: "produtos" },
  { href: "/admin/pedidos", label: "pedidos" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line-soft pb-4">
      <p className="font-display text-3xl font-semibold tracking-tight">
        admin<span className="text-mute-strong">.</span>
      </p>
      <nav aria-label="Painel">
        <ul className="flex gap-1">
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full px-4 text-sm transition-colors",
                    active ? "bg-ink text-canvas" : "text-mute-strong hover:bg-haze hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
