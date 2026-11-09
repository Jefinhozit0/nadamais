import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = {
  title: { default: "Minha conta", template: "%s · Minha conta" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-8 pb-8 md:px-8 md:pt-12">
      <h1 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.92] font-semibold tracking-[-0.035em]">
        <span className="text-grain">minha conta</span>
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <AccountNav />
        </aside>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
