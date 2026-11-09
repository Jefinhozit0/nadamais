"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Asterisks } from "@/components/brand/asterisks";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { NavLinks } from "./nav-links";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Abrir menu" />}>
        <Menu strokeWidth={1.5} />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full border-l border-line bg-canvas p-6 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetTitle className="flex items-center gap-2 font-display text-sm font-medium">
          {siteConfig.name}
          <Asterisks className="size-4" />
        </SheetTitle>

        <nav aria-label="Menu principal" className="mt-10">
          <NavLinks
            onNavigate={() => setOpen(false)}
            className="flex flex-col gap-3"
            linkClassName="font-display text-4xl font-medium tracking-tight"
          />
        </nav>

        <div className="mt-auto border-t border-line-soft pt-5 text-sm">
          <Link href="/conta" onClick={() => setOpen(false)} className="inline-block py-2 text-mute-strong hover:text-ink">
            minha conta
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
