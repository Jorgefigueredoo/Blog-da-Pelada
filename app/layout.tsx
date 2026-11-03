import type { Metadata, Viewport } from "next";
import { Anton, Barlow_Condensed } from "next/font/google";
import Link from "next/link";
import { env } from "@/lib/env";
import { dataDeHoje } from "@/lib/datas";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const barlow = Barlow_Condensed({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-barlow", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Pelada de Quarta — o jornal mais parcial do futebol amador",
    template: "%s | Pelada de Quarta",
  },
  description: "Tudo o que acontece (e o que a gente inventa) na pelada de toda quarta-feira.",
  openGraph: { siteName: "Pelada de Quarta", locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b7a3b" },
    { media: "(prefers-color-scheme: dark)", color: "#0d120f" },
  ],
};

const MENU = [
  { href: "/", rotulo: "Capa" },
  { href: "/arquivo", rotulo: "Arquivo" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${barlow.variable}`}>
      <body className="min-h-dvh antialiased">
        <header>
          <div className="bg-campo text-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-1.5 font-rotulo text-sm uppercase tracking-wider">
              <span className="truncate">{dataDeHoje()}</span>
              <span className="shrink-0">Edição de quarta</span>
            </div>
          </div>
          <div className="mx-auto max-w-5xl px-4 pt-4">
            <Link href="/" className="block text-center">
              <span className="manchete block text-[13.5vw] leading-[0.92] sm:text-8xl">Pelada de Quarta</span>
              <span className="mt-1 block font-rotulo text-sm uppercase tracking-[0.2em] text-sutil sm:text-base">
                O jornal mais parcial do futebol amador
              </span>
            </Link>
            <nav aria-label="Seções" className="mt-3 border-y-4 border-double border-tinta">
              <ul className="flex justify-center gap-6 py-1.5 font-rotulo text-lg font-bold uppercase tracking-wide">
                {MENU.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-campo hover:underline hover:decoration-4">
                      {item.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

        <footer className="mt-12 border-t-4 border-tinta">
          <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-sutil">
            <p className="font-rotulo text-base font-bold uppercase tracking-wider text-tinta">Pelada de Quarta</p>
            <p className="mt-1">Nenhum jogador foi ouvido na apuração destas matérias.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
