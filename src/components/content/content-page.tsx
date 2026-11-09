import type { ReactNode } from "react";

/**
 * Moldura das páginas de texto (institucionais): título display com grão,
 * índice lateral no desktop e coluna de leitura com medida confortável (~65ch).
 */
export function ContentPage({
  title,
  intro,
  updatedAt,
  toc,
  children,
}: {
  title: string;
  intro?: ReactNode;
  updatedAt?: string;
  toc?: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <article className="px-4 pt-8 pb-8 md:px-8 md:pt-12">
      <header className="border-b border-line-soft pb-8">
        <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.92] font-semibold tracking-[-0.035em]">
          <span className="text-grain">{title}</span>
        </h1>
        {intro && <p className="mt-5 max-w-[56ch] text-ink-soft">{intro}</p>}
        {updatedAt && <p className="mt-3 font-mono text-micro text-mute-strong">atualizado em {updatedAt}</p>}
      </header>
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        {toc && toc.length > 0 && (
          <nav aria-label="Nesta página" className="hidden lg:col-span-3 lg:block">
            <ul className="sticky top-28 flex flex-col gap-2 text-sm">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-mute-strong underline-offset-4 hover:text-ink hover:underline">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className={toc ? "lg:col-span-8 lg:col-start-5" : "lg:col-span-8"}>
          <div className="prose-content">{children}</div>
        </div>
      </div>
    </article>
  );
}
