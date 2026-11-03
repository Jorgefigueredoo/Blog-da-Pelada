"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { BUCKET, caminhoDaUrl } from "@/lib/midia";
import { gerarSlug, slugLivre } from "@/lib/slug";
import { errosPorCampo, esquemaPost, intencoes, type EntradaPost, type Intencao } from "@/lib/validacao/post";

export type FotoSalva = { id: string; url_thumb: string; url_full: string | null; legenda: string | null };
export type Cota = { publicadas: number; limite: number; fotos: number; limite_fotos: number };

export type ResultadoSalvar =
  | {
      ok: true;
      mensagem: string;
      /** salvou, mas algo não saiu como pedido (ex.: cota cheia → ficou rascunho) */
      alerta: boolean;
      id: string;
      slug: string;
      publicado: boolean;
      publicado_em: string | null;
      fotos: FotoSalva[];
      cota: Cota | null;
    }
  | { ok: false; mensagem: string; erros?: Record<string, string> };

const MSG_COTA = "Calma, Ancelotti. Já são 5 matérias essa semana — guarda essa pra quarta que vem.";
const MSG_ERRO = "Deu ruim no vestiário e não salvou. Tenta de novo em instantes.";

type Supabase = NonNullable<Awaited<ReturnType<typeof exigirAdmin>>>["supabase"];

async function lerCota(supabase: Supabase): Promise<Cota | null> {
  const { data, error } = await supabase.from("v_cota_semanal").select("publicadas, limite, fotos, limite_fotos").single();
  if (error || !data) {
    if (error) console.error("[cota]", error.message);
    return null;
  }
  return {
    publicadas: data.publicadas ?? 0,
    limite: data.limite ?? 5,
    fotos: data.fotos ?? 0,
    limite_fotos: data.limite_fotos ?? 24,
  };
}

async function apagarArquivos(supabase: Supabase, urls: (string | null | undefined)[]) {
  const caminhos = urls.map(caminhoDaUrl).filter((c): c is string => c !== null);
  if (caminhos.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(caminhos);
  if (error) console.error("[apagarArquivos]", error.message, caminhos);
}

async function escolherSlug(supabase: Supabase, titulo: string, proprioId?: string) {
  const base = gerarSlug(titulo);
  let consulta = supabase.from("posts").select("slug").like("slug", `${base}%`);
  if (proprioId) consulta = consulta.neq("id", proprioId);
  const { data, error } = await consulta;
  if (error) throw error;
  return slugLivre(base, new Set(data.map((p) => p.slug)));
}

function revalidarPublico(...slugs: (string | null | undefined)[]) {
  revalidatePath("/");
  revalidatePath("/arquivo");
  revalidatePath("/sitemap.xml");
  for (const s of new Set(slugs)) if (s) revalidatePath(`/post/${s}`);
}

export async function salvarPost(entrada: EntradaPost, intencaoBruta: Intencao): Promise<ResultadoSalvar> {
  const admin = await exigirAdmin();
  if (!admin) return { ok: false, mensagem: "Tua sessão caiu ou você não é admin. Entra de novo." };
  const { supabase, user } = admin;

  const intencao = intencoes.safeParse(intencaoBruta);
  const r = esquemaPost.safeParse(entrada);
  if (!intencao.success || !r.success) {
    return {
      ok: false,
      mensagem: "Tem campo pra arrumar antes de salvar.",
      erros: r.success ? undefined : errosPorCampo(r.error),
    };
  }
  const dados = r.data;

  try {
    // ---------------------------------------------------------------- post
    let existente: {
      id: string;
      slug: string;
      publicado: boolean;
      publicado_em: string | null;
      capa_url_thumb: string | null;
      capa_url_full: string | null;
      titulo: string;
    } | null = null;

    if (dados.id) {
      const { data, error } = await supabase
        .from("posts")
        .select("id, slug, publicado, publicado_em, capa_url_thumb, capa_url_full, titulo")
        .eq("id", dados.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, mensagem: "Essa matéria não existe mais. Alguém apagou?" };
      existente = data;
    }

    // Slug muda com a manchete só enquanto o post nunca foi ao ar.
    // Depois disso o link já circulou no WhatsApp e tem que funcionar pra sempre.
    const podeTrocarSlug = !existente || (existente.publicado_em === null && existente.titulo !== dados.titulo);
    const slug = podeTrocarSlug ? await escolherSlug(supabase, dados.titulo, existente?.id) : existente!.slug;

    const campos = {
      slug,
      titulo: dados.titulo,
      chapeu: dados.chapeu,
      chamada: dados.chamada,
      corpo: dados.corpo,
      capa_url_thumb: dados.capa?.thumb ?? null,
      capa_url_full: dados.capa?.full ?? null,
    };

    let postId: string;
    if (existente) {
      const { error } = await supabase.from("posts").update(campos).eq("id", existente.id);
      if (error) throw error;
      postId = existente.id;
      // capa trocada ou removida: apaga os arquivos antigos
      if (existente.capa_url_full && existente.capa_url_full !== campos.capa_url_full) {
        await apagarArquivos(supabase, [existente.capa_url_full, existente.capa_url_thumb]);
      }
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert({ ...campos, autor_id: user.id, publicado: false })
        .select("id")
        .single();
      if (error) throw error;
      postId = data.id;
    }

    // --------------------------------------------------------------- fotos
    const { data: fotosAtuais, error: erroFotos } = await supabase
      .from("post_fotos")
      .select("id, url_thumb, url_full")
      .eq("post_id", postId);
    if (erroFotos) throw erroFotos;

    const atuaisPorId = new Map(fotosAtuais.map((f) => [f.id, f]));
    const idsMantidos = new Set(dados.fotos.flatMap((f) => (f.id && atuaisPorId.has(f.id) ? [f.id] : [])));
    const removidas = fotosAtuais.filter((f) => !idsMantidos.has(f.id));

    if (removidas.length > 0) {
      const { error } = await supabase.from("post_fotos").delete().in("id", removidas.map((f) => f.id));
      if (error) throw error;
      await apagarArquivos(supabase, removidas.flatMap((f) => [f.url_full, f.url_thumb]));
    }

    // fotos já salvas: só legenda e ordem mudam (URLs vêm do banco, não do cliente)
    const mantidas = dados.fotos.flatMap((f, ordem) => {
      const atual = f.id ? atuaisPorId.get(f.id) : undefined;
      return atual ? [{ id: atual.id, post_id: postId, url_thumb: atual.url_thumb, url_full: atual.url_full, legenda: f.legenda, ordem }] : [];
    });
    if (mantidas.length > 0) {
      const { error } = await supabase.from("post_fotos").upsert(mantidas, { onConflict: "id" });
      if (error) throw error;
    }

    const novas = dados.fotos.flatMap((f, ordem) =>
      f.id && atuaisPorId.has(f.id) ? [] : [{ post_id: postId, url_thumb: f.url_thumb, url_full: f.url_full, legenda: f.legenda, ordem }],
    );
    if (novas.length > 0) {
      const { error } = await supabase.from("post_fotos").insert(novas);
      if (error) throw error;
    }

    // ---------------------------------------------------------- publicação
    let mensagem = "Rascunho salvo. Ninguém viu nada.";
    let alerta = false;
    const estavaPublicado = existente?.publicado ?? false;

    if (intencao.data === "publicar" && !estavaPublicado) {
      // checagem amigável primeiro; o trigger do banco é a trava definitiva
      const cota = await lerCota(supabase);
      let barrado = !!cota && cota.publicadas >= cota.limite;
      if (!barrado) {
        const { error } = await supabase.from("posts").update({ publicado: true }).eq("id", postId);
        if (error && !error.message.includes("COTA_SEMANAL_ESTOURADA")) throw error;
        barrado = !!error;
      }
      if (barrado) {
        alerta = true;
        mensagem = `${MSG_COTA} O texto ficou salvo como rascunho.`;
      } else {
        mensagem = "💣 Bomba solta! A matéria tá no ar.";
      }
    } else if (intencao.data === "despublicar" && estavaPublicado) {
      const { error } = await supabase.from("posts").update({ publicado: false }).eq("id", postId);
      if (error) throw error;
      mensagem = "Matéria recolhida. A vaga da semana foi liberada.";
    } else if (estavaPublicado) {
      mensagem = "Alterações no ar.";
    }

    // ------------------------------------------------------------- retorno
    const [{ data: final, error: erroFinal }, { data: fotosFinais, error: erroFotosFinais }, cota] = await Promise.all([
      supabase.from("posts").select("slug, publicado, publicado_em").eq("id", postId).single(),
      supabase.from("post_fotos").select("id, url_thumb, url_full, legenda").eq("post_id", postId).order("ordem"),
      lerCota(supabase),
    ]);
    if (erroFinal) throw erroFinal;
    if (erroFotosFinais) throw erroFotosFinais;

    // páginas públicas: só precisa revalidar se esteve ou está no ar
    if (estavaPublicado || final.publicado) revalidarPublico(final.slug, existente?.slug);
    revalidatePath("/admin");

    return {
      ok: true,
      mensagem,
      alerta,
      id: postId,
      slug: final.slug,
      publicado: final.publicado,
      publicado_em: final.publicado_em,
      fotos: fotosFinais,
      cota,
    };
  } catch (e) {
    console.error("[salvarPost]", e);
    return { ok: false, mensagem: MSG_ERRO };
  }
}

export async function apagarPost(id: string): Promise<{ ok: false; mensagem: string } | never> {
  const admin = await exigirAdmin();
  if (!admin) return { ok: false, mensagem: "Tua sessão caiu ou você não é admin. Entra de novo." };
  const { supabase } = admin;

  try {
    const [{ data: post, error: e1 }, { data: fotos, error: e2 }] = await Promise.all([
      supabase.from("posts").select("slug, publicado, capa_url_thumb, capa_url_full").eq("id", id).maybeSingle(),
      supabase.from("post_fotos").select("url_thumb, url_full").eq("post_id", id),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (!post) return { ok: false, mensagem: "Essa matéria já não existe." };

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;

    await apagarArquivos(supabase, [post.capa_url_full, post.capa_url_thumb, ...fotos.flatMap((f) => [f.url_full, f.url_thumb])]);
    if (post.publicado) revalidarPublico(post.slug);
    revalidatePath("/admin");
  } catch (e) {
    console.error("[apagarPost]", e);
    return { ok: false, mensagem: "Não consegui apagar. Tenta de novo." };
  }
  redirect("/admin?apagado=1");
}
