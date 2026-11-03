"use client";

import { formatarBytes } from "@/lib/imagem/comprimir";
import type { EtapaEnvio } from "@/lib/imagem/enviar";

export type EstadoEnvio = EtapaEnvio | { etapa: "erro"; mensagem: string };

/** Progresso do upload mostrando o tamanho antes e depois da compressão. */
export function BarraEnvio({ nome, estado, onDispensar }: { nome: string; estado: EstadoEnvio; onDispensar?: () => void }) {
  if (estado.etapa === "erro") {
    return (
      <div className="aviso-erro flex items-start justify-between gap-3" role="alert">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{nome}</p>
          <p className="text-sm font-normal">{estado.mensagem}</p>
        </div>
        {onDispensar ? (
          <button type="button" onClick={onDispensar} className="shrink-0 text-sm underline">
            OK
          </button>
        ) : null}
      </div>
    );
  }

  const comprimindo = estado.etapa === "comprimindo";
  const final = comprimindo ? 0 : estado.full + estado.thumb;
  const pct = comprimindo ? 100 : Math.round(estado.progresso * 100);

  return (
    <div className="border-2 border-tinta bg-superficie p-2" role="status" aria-live="polite">
      <div className="flex justify-between gap-2 text-sm">
        <span className="truncate font-bold">{nome}</span>
        <span className="shrink-0 font-rotulo font-bold uppercase">{comprimindo ? "Comprimindo…" : `Enviando ${pct}%`}</span>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden bg-tinta/10">
        <div
          className={`h-full transition-[width] duration-150 ${comprimindo ? "animate-pulse bg-cartao" : "bg-campo"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-sutil tabular-nums">
        {comprimindo ? (
          <>Original: {formatarBytes(estado.original)}</>
        ) : (
          <>
            {formatarBytes(estado.original)} → {formatarBytes(final)} ({formatarBytes(estado.full)} full + {formatarBytes(estado.thumb)} thumb ·{" "}
            {Math.max(1, Math.round(estado.original / Math.max(1, final)))}× menor)
          </>
        )}
      </p>
    </div>
  );
}
