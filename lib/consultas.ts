import "server-only";
import { cache } from "react";
import { clientePublico } from "@/lib/supabase/publico";

/**
 * Leituras públicas (cliente anônimo). Regra do orçamento: nada de select('*');
 * cada consulta pede só as colunas que a tela usa. `corpo` só na página do post.
 */

const CAMPOS_FEED = "id, slug, chapeu, titulo, chamada, capa_url_thumb, capa_url_full, publicado_em";
const CAMPOS_MATERIA = `${CAMPOS_FEED}, corpo`;

export const POSTS_NA_CAPA = 5;
export const POSTS_POR_PAGINA_ARQUIVO = 20;

/** Erro de banco nunca chega ao visitante: loga aqui e o error.tsx mostra mensagem humana. */
function falhar(onde: string, mensagem: string): never {
  console.error(`[consultas] ${onde}:`, mensagem);
  throw new Error("Falha ao carregar dados");
}

export async function ultimosPosts() {
  const { data, error } = await clientePublico()
    .from("posts")
    .select(CAMPOS_FEED)
    .eq("publicado", true)
    .order("publicado_em", { ascending: false })
    .limit(POSTS_NA_CAPA);
  if (error) falhar("ultimosPosts", error.message);
  return data;
}

export const postPorSlug = cache(async (slug: string) => {
  const { data, error } = await clientePublico()
    .from("posts")
    .select(CAMPOS_MATERIA)
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();
  if (error) falhar("postPorSlug", error.message);
  return data;
});

export async function fotosDoPost(postId: string) {
  const { data, error } = await clientePublico()
    .from("post_fotos")
    .select("id, url_thumb, url_full, legenda")
    .eq("post_id", postId)
    .order("ordem", { ascending: true });
  if (error) falhar("fotosDoPost", error.message);
  return data;
}

/** Escapa curingas do ILIKE para a busca do visitante ser literal. */
function escaparLike(texto: string) {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function paginaDoArquivo({ pagina, busca }: { pagina: number; busca: string }) {
  const inicio = (pagina - 1) * POSTS_POR_PAGINA_ARQUIVO;
  let consulta = clientePublico()
    .from("posts")
    .select("id, slug, chapeu, titulo, publicado_em", { count: "exact" })
    .eq("publicado", true)
    .order("publicado_em", { ascending: false })
    .range(inicio, inicio + POSTS_POR_PAGINA_ARQUIVO - 1);

  if (busca) consulta = consulta.ilike("titulo", `%${escaparLike(busca)}%`);

  const { data, error, count } = await consulta;
  // PostgREST responde 416 quando a página pedida passa do fim: trata como página vazia.
  if (error && error.code !== "PGRST103") falhar("paginaDoArquivo", error.message);
  return { posts: data ?? [], total: count ?? 0 };
}

export async function slugsPublicados() {
  const { data, error } = await clientePublico()
    .from("posts")
    .select("slug, atualizado_em")
    .eq("publicado", true)
    .order("publicado_em", { ascending: false });
  if (error) falhar("slugsPublicados", error.message);
  return data;
}
