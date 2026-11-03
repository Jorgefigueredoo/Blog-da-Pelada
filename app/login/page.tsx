import type { Metadata } from "next";
import { FormLogin } from "./form-login";

export const metadata: Metadata = {
  title: "Entrar na redação",
  robots: { index: false },
};

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;

  return (
    <div className="mx-auto max-w-md py-10">
      <p className="chapeu">Área restrita</p>
      <h1 className="manchete mt-3 text-5xl">Entrar na redação</h1>
      <p className="mt-3 text-sutil">Sem senha: a gente manda um link mágico pro teu e-mail.</p>
      {erro === "link" && (
        <p className="aviso-erro mt-6" role="alert">
          Esse link expirou ou já foi usado. Pede outro aí embaixo.
        </p>
      )}
      <div className="mt-8">
        <FormLogin />
      </div>
    </div>
  );
}
