"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type FotoGaleria = {
  id: string;
  url_thumb: string;
  url_full: string | null;
  legenda: string | null;
};

/**
 * Grid de thumbs (400px, lazy) + lightbox.
 * A versão `full` só é baixada quando alguém abre a foto. Se a poda de
 * 6 meses já apagou o `full`, o lightbox mostra o thumb ampliado com aviso.
 */
export function GaleriaPost({ fotos }: { fotos: FotoGaleria[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const fechar = useCallback(() => setAberta(null), []);
  const anterior = useCallback(() => setAberta((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length)), [fotos.length]);
  const proxima = useCallback(() => setAberta((i) => (i === null ? i : (i + 1) % fotos.length)), [fotos.length]);

  if (fotos.length === 0) return null;

  return (
    <section className="mt-10" aria-labelledby="titulo-galeria">
      <h2 id="titulo-galeria" className="manchete text-3xl">
        Galeria <span className="font-rotulo text-xl text-sutil">({fotos.length})</span>
      </h2>
      <ul className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
        {fotos.map((f, i) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => setAberta(i)}
              className="relative block aspect-square w-full overflow-hidden bg-campo"
              aria-label={`Abrir foto ${i + 1}${f.legenda ? `: ${f.legenda}` : ""}`}
            >
              <Image
                src={f.url_thumb}
                alt={f.legenda ?? ""}
                fill
                sizes="(max-width: 640px) 33vw, 260px"
                quality={70}
                loading="lazy"
                className="object-cover transition-transform hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>
      {aberta !== null ? (
        <Lightbox foto={fotos[aberta]} posicao={aberta} total={fotos.length} onFechar={fechar} onAnterior={anterior} onProxima={proxima} />
      ) : null}
    </section>
  );
}

function Lightbox({
  foto,
  posicao,
  total,
  onFechar,
  onAnterior,
  onProxima,
}: {
  foto: FotoGaleria;
  posicao: number;
  total: number;
  onFechar: () => void;
  onAnterior: () => void;
  onProxima: () => void;
}) {
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const toqueInicio = useRef<number | null>(null);
  const arquivada = !foto.url_full;

  useEffect(() => {
    const focoAnterior = document.activeElement as HTMLElement | null;
    botaoFechar.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function teclas(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
      else if (e.key === "ArrowLeft") onAnterior();
      else if (e.key === "ArrowRight") onProxima();
    }
    window.addEventListener("keydown", teclas);
    return () => {
      window.removeEventListener("keydown", teclas);
      document.body.style.overflow = overflow;
      focoAnterior?.focus();
    };
  }, [onFechar, onAnterior, onProxima]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${posicao + 1} de ${total}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
      onTouchStart={(e) => (toqueInicio.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toqueInicio.current === null) return;
        const dx = e.changedTouches[0].clientX - toqueInicio.current;
        toqueInicio.current = null;
        if (dx > 50) onAnterior();
        else if (dx < -50) onProxima();
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 font-rotulo text-lg font-bold uppercase">
        <span>
          {posicao + 1} / {total}
        </span>
        <button ref={botaoFechar} type="button" onClick={onFechar} className="botao botao-pequeno border-white bg-black text-white" aria-label="Fechar">
          Fechar ✕
        </button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={(e) => e.target === e.currentTarget && onFechar()}>
        <Image
          key={foto.id}
          src={foto.url_full ?? foto.url_thumb}
          alt={foto.legenda ?? ""}
          fill
          // thumb tem 400px: pedir largura maior só gastaria transformação à toa
          sizes={arquivada ? "400px" : "100vw"}
          quality={75}
          className="object-contain"
        />
      </div>

      <div className="space-y-1 px-4 py-3 text-center">
        {foto.legenda ? <p className="font-texto text-lg">{foto.legenda}</p> : null}
        {arquivada ? <p className="font-rotulo text-sm uppercase tracking-wider text-cartao">Foto arquivada em baixa resolução</p> : null}
        {total > 1 ? (
          <div className="flex justify-center gap-3 pt-2">
            <button type="button" onClick={onAnterior} className="botao botao-pequeno border-white bg-black text-white" aria-label="Foto anterior">
              ← Anterior
            </button>
            <button type="button" onClick={onProxima} className="botao botao-pequeno border-white bg-black text-white" aria-label="Próxima foto">
              Próxima →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
