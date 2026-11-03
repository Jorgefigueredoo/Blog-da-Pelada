import Link from "next/link";
import { z } from "zod";
import { PlacarCota } from "@/components/admin/placar-cota";
import { dataCurta } from "@/lib/datas";
import { clienteServidor } from "@/lib/supabase/servidor";

const POR_PAGINA = 30;

export default async function PainelAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const bruto = await searchParams;
  const pagina = z.coerce.number().int().min(1).catch(1).parse(bruto.pagina);
  const inicio = (pagina - 1) * POR_PAGINA;

  const supabase = await clienteServidor();
  const [{ data: posts, error, count }, { data: cota, error: erroCota }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, slug, titulo, chapeu, publicado, publicado_em, atualizado_em", { count: "exact" })
      .order("atualizado_em", { ascending: false })
      .range(inicio, inicio + POR_PAGINA - 1),
    supabase.from("v_cota_semanal").select("publicadas, limite, fotos, limite_fotos").single(),
  ]);
  if (error) console.error("[admin] posts:", error.message);
  if (erroCota) console.error("[admin] cota:", erroCota.message);

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="manchete text-5xl">Matérias</h1>
        <Link href="/admin/posts/novo" className="botao botao-bomba">
          + Nova matéria
        </Link>
      </div>

      {bruto.apagado ? (
        <p className="aviso-ok mt-4" role="status">
          Matéria apagada, com fotos e tudo.
        </p>
      ) : null}

      {cota ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <PlacarCota rotulo="publicadas esta semana (quarta a terça)" usado={cota.publicadas ?? 0} limite={cota.limite ?? 5} />
          <PlacarCota rotulo="fotos enviadas esta semana" usado={cota.fotos ?? 0} limite={cota.limite_fotos ?? 24} />
        </div>
      ) : null}

      {error ? (
        <p className="aviso-erro mt-6">Não consegui carregar as matérias agora. Recarrega a página.</p>
      ) : posts && posts.length > 0 ? (
        <ul className="mt-6 divide-y-2 divide-tinta/10 border-y-2 border-tinta">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-rotulo text-sm font-bold uppercase">
                  {p.publicado ? (
                    <span className="bg-campo px-1.5 text-white">No ar</span>
                  ) : (
                    <span className="border border-tinta px-1.5">Rascunho</span>
                  )}
                  <span className="text-sutil">
                    {p.publicado && p.publicado_em ? `publicado ${dataCurta(p.publicado_em)}` : `editado ${dataCurta(p.atualizado_em)}`}
                  </span>
                </div>
                <Link href={`/admin/posts/${p.id}`} className="manchete mt-1 block text-2xl hover:text-campo">
                  {p.titulo}
                </Link>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/admin/posts/${p.id}`} className="botao botao-secundario botao-pequeno">
                  Editar
                </Link>
                {p.publicado ? (
                  <Link href={`/post/${p.slug}`} className="botao botao-secundario botao-pequeno" target="_blank">
                    Ver
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 text-center">
          <p className="manchete text-3xl">Redação vazia</p>
          <p className="mt-2 text-sutil">Nenhuma matéria ainda. A primeira bomba é tua.</p>
        </div>
      )}

      {totalPaginas > 1 ? (
        <nav aria-label="Paginação" className="mt-6 flex items-center justify-between font-rotulo font-bold uppercase">
          {pagina > 1 ? (
            <Link href={`/admin?pagina=${pagina - 1}`} className="botao botao-secundario botao-pequeno">
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sutil">
            {pagina} / {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link href={`/admin?pagina=${pagina + 1}`} className="botao botao-secundario botao-pequeno">
              Seguintes →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
