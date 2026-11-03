import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { Chapeu } from "@/components/chapeu";
import { paginaDoArquivo, POSTS_POR_PAGINA_ARQUIVO } from "@/lib/consultas";
import { chaveMes, dataCurta, mesAno } from "@/lib/datas";

export const metadata: Metadata = {
  title: "Arquivo",
  description: "Todas as matérias da Pelada de Quarta, mês a mês.",
};

const parametros = z.object({
  pagina: z.coerce.number().int().min(1).max(10_000).catch(1),
  q: z.string().trim().max(80).catch(""),
});

export default async function Arquivo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const bruto = await searchParams;
  const { pagina, q } = parametros.parse({
    pagina: typeof bruto.pagina === "string" ? bruto.pagina : undefined,
    q: typeof bruto.q === "string" ? bruto.q : "",
  });

  const { posts, total } = await paginaDoArquivo({ pagina, busca: q });
  const totalPaginas = Math.max(1, Math.ceil(total / POSTS_POR_PAGINA_ARQUIVO));

  const meses: { chave: string; rotulo: string; itens: typeof posts }[] = [];
  for (const post of posts) {
    if (!post.publicado_em) continue;
    const chave = chaveMes(post.publicado_em);
    const atual = meses.at(-1);
    if (atual?.chave === chave) atual.itens.push(post);
    else meses.push({ chave, rotulo: mesAno(post.publicado_em), itens: [post] });
  }

  const link = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (p > 1) s.set("pagina", String(p));
    const qs = s.toString();
    return qs ? `/arquivo?${qs}` : "/arquivo";
  };

  return (
    <div>
      <p className="chapeu">Hemeroteca</p>
      <h1 className="manchete mt-3 text-6xl">Arquivo</h1>
      <p className="mt-2 text-sutil">
        {total} {total === 1 ? "matéria" : "matérias"}
        {q ? <> com &ldquo;{q}&rdquo; na manchete</> : " desde o apito inicial"}.
      </p>

      <form action="/arquivo" method="get" role="search" className="mt-5 flex gap-2">
        <label htmlFor="busca" className="sr-only">
          Buscar por manchete
        </label>
        <input id="busca" name="q" type="search" defaultValue={q} placeholder="Buscar manchete… (ex: gol contra)" maxLength={80} className="campo" />
        <button type="submit" className="botao botao-primario shrink-0">
          Buscar
        </button>
      </form>

      {meses.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="manchete text-3xl">Nada por aqui</p>
          <p className="mt-2 text-sutil">{q ? "Nenhuma manchete com esse termo. Tenta outra palavra." : "Essa página do arquivo está em branco."}</p>
          {q ? (
            <Link href="/arquivo" className="botao botao-secundario mt-4">
              Limpar busca
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {meses.map((mes) => (
            <section key={mes.chave} aria-labelledby={`mes-${mes.chave}`}>
              <h2 id={`mes-${mes.chave}`} className="border-b-4 border-tinta pb-1 font-rotulo text-2xl font-extrabold uppercase tracking-wide">
                {mes.rotulo}
              </h2>
              <ul className="divide-y-2 divide-tinta/10">
                {mes.itens.map((post) => (
                  <li key={post.id}>
                    <Link href={`/post/${post.slug}`} className="group block py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.publicado_em ? <span className="font-rotulo text-sm font-bold text-sutil">{dataCurta(post.publicado_em)}</span> : null}
                        <Chapeu texto={post.chapeu} className="text-[0.65rem]" />
                      </div>
                      <h3 className="manchete mt-1 text-2xl group-hover:text-campo">{post.titulo}</h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {totalPaginas > 1 ? (
        <nav aria-label="Paginação" className="mt-10 flex items-center justify-between gap-3 font-rotulo font-bold uppercase">
          {pagina > 1 ? (
            <Link href={link(pagina - 1)} className="botao botao-secundario botao-pequeno">
              ← Mais recentes
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sutil">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link href={link(pagina + 1)} className="botao botao-secundario botao-pequeno">
              Mais antigas →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
