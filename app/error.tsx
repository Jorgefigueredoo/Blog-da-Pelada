"use client";

import { useEffect } from "react";

// Mensagem humana para o visitante; o detalhe técnico fica no log do servidor.
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (error.digest) console.error("erro", error.digest);
  }, [error]);

  return (
    <div className="py-14 text-center">
      <p className="chapeu chapeu-alerta">Jogo paralisado</p>
      <h1 className="manchete mt-4 text-4xl sm:text-5xl">Faltou luz no campo</h1>
      <p className="mt-3 text-sutil">Alguma coisa deu errado do nosso lado. Tenta de novo em instantes.</p>
      <button type="button" onClick={reset} className="botao botao-primario mt-8">
        Reiniciar a partida
      </button>
    </div>
  );
}
