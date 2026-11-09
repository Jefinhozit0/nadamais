import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Home provisória — a home real é construída na Fase 2. */
export default function HomePage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-start justify-end gap-8 px-4 py-16 md:px-8">
      <h1 className="text-grain max-w-[12ch] font-display text-display-lg font-semibold">
        A home chega na fase 2.
      </h1>
      <Link href="/design-system" className={buttonVariants({ variant: "outline" })}>
        ver design system <ArrowUpRight strokeWidth={1.5} />
      </Link>
    </section>
  );
}
