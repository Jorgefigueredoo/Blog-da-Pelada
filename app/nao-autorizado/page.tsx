import type { Metadata } from "next";
import Link from "next/link";
import { sair } from "@/app/auth/acoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = {
  title: "Impedido",
  robots: { index: false },
};

export default async function NaoAutorizado() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <div aria-hidden className="mx-auto h-24 w-16 rotate-6 rounded-md bg-vermelho shadow-[6px_6px_0_var(--tinta)]" />
      <p className="chapeu chapeu-alerta mt-8">403 · Impedimento</p>
      <h1 className="manchete mt-3 text-5xl sm:text-6xl">Você não é admin aqui, parça.</h1>
      <p className="mt-4 text-lg">
        A bandeirinha subiu. Esse e-mail{user?.email ? <> (<strong className="break-all">{user.email}</strong>)</> : null} não
        está na lista da redação.
      </p>
      <p className="mt-2 text-sutil">Se era pra estar, chama quem manda no grupo do WhatsApp.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <form action={sair}>
          <button type="submit" className="botao botao-secundario w-full sm:w-auto">
            Sair e tentar outro e-mail
          </button>
        </form>
        <Link href="/" className="botao botao-primario">
          Voltar pra capa
        </Link>
      </div>
    </div>
  );
}
