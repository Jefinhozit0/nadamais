import type { ReactNode } from "react";
import { Asterisks } from "@/components/brand/asterisks";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-10 px-4 pt-10 pb-8 md:px-8 md:pt-16 lg:grid-cols-12">
      <div className="bg-halo hidden items-center justify-center rounded-card lg:col-span-6 lg:flex">
        <Asterisks className="size-24 opacity-80" />
      </div>
      <div className="lg:col-span-5 lg:col-start-8">{children}</div>
    </div>
  );
}
