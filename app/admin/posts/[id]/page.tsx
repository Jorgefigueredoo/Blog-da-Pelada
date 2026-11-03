import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/servidor";
import { EditorPost } from "../editor-post";

export const metadata: Metadata = { title: "Editar matéria" };

export default async function EditarPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await clienteServidor();
  const [{ data: post, error }, { data: fotos, error: erroFotos }, { data: cota, error: erroCota }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, slug, chapeu, titulo, chamada, corpo, capa_url_thumb, capa_url_full, publicado, publicado_em")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("post_fotos").select("id, url_thumb, url_full, legenda").eq("post_id", id).order("ordem"),
    supabase.from("v_cota_semanal").select("publicadas, limite, fotos, limite_fotos").single(),
  ]);
  if (error || erroFotos) {
    console.error("[editar post]", error?.message ?? erroFotos?.message);
    throw new Error("Falha ao carregar a matéria");
  }
  if (erroCota) console.error("[editar post] cota:", erroCota.message);
  if (!post) notFound();

  return (
    <EditorPost
      inicial={{
        id: post.id,
        slug: post.slug,
        chapeu: post.chapeu ?? "",
        titulo: post.titulo,
        chamada: post.chamada ?? "",
        corpo: post.corpo,
        capa: post.capa_url_full && post.capa_url_thumb ? { thumb: post.capa_url_thumb, full: post.capa_url_full } : null,
        fotos: fotos ?? [],
        publicado: post.publicado,
        publicado_em: post.publicado_em,
      }}
      cotaInicial={
        cota
          ? { publicadas: cota.publicadas ?? 0, limite: cota.limite ?? 5, fotos: cota.fotos ?? 0, limite_fotos: cota.limite_fotos ?? 24 }
          : null
      }
    />
  );
}
