"use client";

import { useActionState } from "react";
import { enviarLink, type EstadoLogin } from "./acoes";

export function FormLogin() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(enviarLink, { status: "ocioso" });

  if (estado.status === "enviado") {
    return (
      <div className="space-y-3" role="status">
        <p className="font-rotulo text-2xl uppercase">Confere teu e-mail 📬</p>
        <p>
          Mandamos um link de entrada para <strong className="break-all">{estado.email}</strong>. Ele vale por 1 hora e
          funciona uma vez só.
        </p>
        <p className="text-sm text-sutil">Não chegou? Olha o spam — ou o goleiro defendeu. Recarrega a página e tenta de novo.</p>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <label className="block">
        <span className="font-rotulo text-lg uppercase">Teu e-mail</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="craque@pelada.com"
          className="campo mt-1"
        />
      </label>
      {estado.status === "erro" && (
        <p className="aviso-erro" role="alert">
          {estado.mensagem}
        </p>
      )}
      <button type="submit" disabled={enviando} className="botao botao-primario w-full">
        {enviando ? "Chamando o gandula…" : "Me manda o link"}
      </button>
    </form>
  );
}
