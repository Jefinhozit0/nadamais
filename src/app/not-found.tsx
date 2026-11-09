import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="bg-halo flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <p className="text-grain font-display text-[clamp(5rem,22vw,14rem)] leading-[0.85] font-semibold tracking-[-0.04em]">
        404
      </p>
      <h1 className="font-display text-xl font-medium">Essa página saiu de linha.</h1>
      <p className="max-w-[40ch] text-sm text-ink-soft">
        O link pode estar errado ou o produto não está mais no catálogo.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/catalogo" className={buttonVariants()}>
          ver catálogo
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          início <ArrowUpRight strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
