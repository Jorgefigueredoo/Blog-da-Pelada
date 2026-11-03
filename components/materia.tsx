import { Chapeu } from "@/components/chapeu";
import { ImagemCapa } from "@/components/imagem-capa";
import { dataHora } from "@/lib/datas";

/**
 * Peças da matéria compartilhadas entre a página pública (/post/[slug]) e o
 * preview do editor no admin — o que o admin vê é o que vai pro ar.
 */

export type DadosMateria = {
  chapeu: string | null;
  titulo: string;
  chamada: string | null;
  corpo: string;
  capa_url_full: string | null;
  publicado_em: string | null;
};

export function CabecalhoMateria({ post }: { post: DadosMateria }) {
  return (
    <header>
      <Chapeu texto={post.chapeu} />
      <h1 className="manchete mt-3 text-[clamp(2.5rem,11vw,5.5rem)]">{post.titulo || "Sem manchete ainda"}</h1>
      {post.chamada ? <p className="linha-fina mt-4">{post.chamada}</p> : null}
      <p className="mt-4 border-t-2 border-tinta pt-2 font-rotulo text-sm font-bold uppercase tracking-wider text-sutil">
        {post.publicado_em ? <>Publicado em {dataHora(post.publicado_em)}</> : "Rascunho — ainda não saiu"}
      </p>
    </header>
  );
}

export function CapaMateria({ post, prioridade = true }: { post: DadosMateria; prioridade?: boolean }) {
  if (!post.capa_url_full) return null;
  return (
    <ImagemCapa
      src={post.capa_url_full}
      alt={post.titulo}
      sizes="(max-width: 768px) 100vw, 768px"
      prioridade={prioridade}
      className="mt-6 border-2 border-tinta"
    />
  );
}

/** Texto simples: parágrafos separados por linha em branco; quebra simples vira <br>. */
export function CorpoMateria({ corpo }: { corpo: string }) {
  const paragrafos = corpo
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="corpo-materia mt-6">
      {paragrafos.map((p, i) => (
        <p key={i}>
          {p.split("\n").map((linha, j, linhas) => (
            <span key={j}>
              {linha}
              {j < linhas.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
