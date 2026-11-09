import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Asterisks } from "@/components/brand/asterisks";
import { footerNav, siteConfig } from "@/config/site";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
  const year = 2026;

  return (
    <footer className="mt-24 border-t border-line-soft px-4 pt-14 pb-6 md:mt-40 md:px-8 md:pt-20">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <p className="max-w-[22ch] font-display text-xl leading-tight font-medium tracking-tight text-balance sm:text-2xl md:text-3xl">
            Peças de verdade. Sem excesso.
          </p>
          <p className="mt-4 max-w-[42ch] text-sm text-mute-strong">
            Receba os drops antes de todo mundo. Um e-mail por lançamento, nada além disso.
          </p>
          <NewsletterForm className="mt-6 max-w-md" />
        </div>

        <nav aria-label="Rodapé" className="grid min-w-0 grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="font-mono text-micro tracking-wider text-mute-strong uppercase">
                {group.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="group inline-flex items-center gap-1 rounded-sm hover:underline underline-offset-4">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-16 flex items-end justify-between gap-6 md:mt-24" aria-hidden="true">
        <span className="text-grain min-w-0 font-display text-display-xl font-semibold lowercase">
          {siteConfig.name}
        </span>
        <Asterisks className="mb-3 hidden size-10 shrink-0 md:block" />
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-line-soft pt-5 font-mono text-micro text-mute-strong md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {siteConfig.name} · cnpj 00.000.000/0001-00 · {siteConfig.city}
        </p>
        <p>pix · cartão em até {siteConfig.maxInstallments}x · boleto</p>
        <Link href="/sobre#qualidade" className="inline-flex items-center gap-1 rounded-sm text-ink hover:underline underline-offset-4">
          como garantimos cada peça <ArrowUpRight className="size-3" strokeWidth={1.5} />
        </Link>
      </div>
    </footer>
  );
}
