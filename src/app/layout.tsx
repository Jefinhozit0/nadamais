import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Lexend_Exa, Unbounded } from "next/font/google";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartHydrator } from "@/components/cart/cart-hydrator";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeScript } from "@/components/theme/theme-script";
import { siteConfig } from "@/config/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  display: "swap",
});

const lexendExa = Lexend_Exa({
  variable: "--font-lexend-exa",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — sneakers e streetwear originais`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: siteConfig.name,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${unbounded.variable} ${lexendExa.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="p-3 md:p-5">
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-sm text-canvas focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          pular para o conteúdo
        </a>
        <div className="frame flex min-h-[calc(100dvh-1.5rem)] flex-col md:min-h-[calc(100dvh-2.5rem)]">
          <Header />
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <CartHydrator />
        <CartDrawer />
      </body>
    </html>
  );
}
