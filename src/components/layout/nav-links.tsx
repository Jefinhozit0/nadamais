"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { mainNav, type NavItem } from "@/config/site";
import { cn } from "@/lib/utils";

function isActive(item: NavItem, pathname: string, search: URLSearchParams): boolean {
  const url = new URL(item.href, "http://x");
  if (url.pathname !== pathname) return false;
  for (const [key, value] of url.searchParams) {
    if (search.get(key) !== value) return false;
  }
  // Item sem query (ex.: "/") só fica ativo quando a URL atual também não tem query
  return url.search !== "" || search.size === 0;
}

type NavLinksProps = {
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
};

function NavLinksInner({ className, linkClassName, onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <NavList
      className={className}
      linkClassName={linkClassName}
      onNavigate={onNavigate}
      activeHref={mainNav.find((item) => isActive(item, pathname, search))?.href}
    />
  );
}

function NavList({
  className,
  linkClassName,
  onNavigate,
  activeHref,
}: NavLinksProps & { activeHref?: string }) {
  return (
    <ul className={className}>
      {mainNav.map((item) => {
        const active = item.href === activeHref;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-block rounded-sm py-2 transition-colors duration-200",
                active ? "text-ink" : "text-mute-strong hover:text-ink",
                linkClassName,
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Links principais com estado ativo. useSearchParams exige Suspense; o fallback é a lista sem destaque. */
export function NavLinks(props: NavLinksProps) {
  return (
    <Suspense fallback={<NavList {...props} />}>
      <NavLinksInner {...props} />
    </Suspense>
  );
}
