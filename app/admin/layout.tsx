import type { Metadata } from "next";
import Link from "next/link";
import { sair } from "@/app/auth/acoes";

export const metadata: Metadata = {
  title: { default: "Redação", template: "%s | Redação" },
  robots: { index: false },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="-mt-2 mb-6 flex flex-wrap items-center justify-between gap-3 bg-tinta px-3 py-2 text-papel">
        <nav aria-label="Redação" className="flex flex-wrap items-center gap-4 font-rotulo text-lg font-bold uppercase">
          <span className="bg-cartao px-1.5 text-tinta">Redação</span>
          <Link href="/admin" className="hover:text-cartao">
            Matérias
          </Link>
          <Link href="/admin/posts/novo" className="hover:text-cartao">
            + Nova
          </Link>
        </nav>
        <form action={sair}>
          <button type="submit" className="font-rotulo text-sm font-bold uppercase underline hover:text-cartao">
            Sair
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
