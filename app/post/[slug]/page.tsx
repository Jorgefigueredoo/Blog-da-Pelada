import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GaleriaPost } from "@/components/galeria-post";
import { CabecalhoMateria, CapaMateria, CorpoMateria } from "@/components/materia";
import { fotosDoPost, postPorSlug } from "@/lib/consultas";

export const revalidate = 300;

// Nenhuma página gerada no build: cada matéria é gerada no primeiro acesso e
// fica em cache (ISR). Publicar/editar chama revalidatePath nesta rota.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await postPorSlug(slug);
  if (!post) return { title: "Bola fora" };

  const descricao = post.chamada ?? post.corpo.slice(0, 160);
  return {
    title: post.titulo,
    description: descricao,
    alternates: { canonical: `/post/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.titulo,
      description: descricao,
      url: `/post/${post.slug}`,
      publishedTime: post.publicado_em ?? undefined,
      images: post.capa_url_full ? [{ url: post.capa_url_full, width: 1600, alt: post.titulo }] : undefined,
    },
    twitter: {
      card: post.capa_url_full ? "summary_large_image" : "summary",
      title: post.titulo,
      description: descricao,
      images: post.capa_url_full ? [post.capa_url_full] : undefined,
    },
  };
}

export default async function PaginaPost({ params }: Props) {
  const { slug } = await params;
  const post = await postPorSlug(slug);
  if (!post) notFound();

  const fotos = await fotosDoPost(post.id);

  return (
    <article className="mx-auto max-w-3xl">
      <CabecalhoMateria post={post} />
      <CapaMateria post={post} />
      <CorpoMateria corpo={post.corpo} />
      <GaleriaPost fotos={fotos} />
      <div className="mt-12 border-t-4 border-tinta pt-4">
        <Link href="/" className="font-rotulo text-lg font-bold uppercase hover:text-campo">
          ← Voltar pra capa
        </Link>
      </div>
    </article>
  );
}
