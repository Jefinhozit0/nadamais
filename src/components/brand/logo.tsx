import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Asterisks } from "./asterisks";

type LogoProps = {
  className?: string;
};

/** Wordmark provisório: nome em duas linhas + cluster de asteriscos, como na referência. */
export function Logo({ className }: LogoProps) {
  const [first, ...rest] = siteConfig.name.split(" ");
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — página inicial`}
      className={cn("inline-flex items-start gap-1.5 rounded-sm py-1.5", className)}
    >
      <span className="font-display text-[0.95rem] leading-[1.05] font-medium tracking-tight">
        {first}
        {rest.length > 0 && (
          <>
            <br />
            {rest.join(" ")}
          </>
        )}
      </span>
      <Asterisks className="mt-0.5 size-4" />
    </Link>
  );
}
