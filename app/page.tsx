import Link from "next/link";
import { Chapeu } from "@/components/chapeu";
import { ImagemCapa } from "@/components/imagem-capa";
import { ultimosPosts } from "@/lib/consultas";
import { dataCurta } from "@/lib/datas";

// ISR: a capa é regenerada no máximo a cada 5 min (e na hora, via revalidatePath, quando o admin publica).
export const revalidate = 300;

export default async function Capa() {
  const posts = await ultimosPosts();

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="chapeu">Sem notícia</p>
        <h1 className="manchete mt-4 text-5xl">A redação ainda tá no bar</h1>
        <p className="mt-3 text-sutil">Nenhuma matéria publicada. Volta depois da quarta.</p>
      </div>
    );
  }

  const [destaque, ...demais] = posts;

  return (
    <>
      <article className="relative">
        <Link href={`/post/${destaque.slug}`} className="group grid gap-4 lg:grid-cols-12 lg:gap-6">
          <ImagemCapa
            src={destaque.capa_url_full}
            alt={destaque.titulo}
            sizes="(max-width: 1024px) 100vw, 580px"
            prioridade
            rotuloSemFoto={destaque.chapeu ?? "Plantão"}
            className="border-2 border-tinta lg:col-span-7"
          />
          <div className="lg:col-span-5 lg:self-center">
            <Chapeu texto={destaque.chapeu} />
            <h1 className="manchete mt-2 text-[clamp(2.6rem,12vw,4.75rem)] group-hover:text-campo">{destaque.titulo}</h1>
            {destaque.chamada ? <p className="linha-fina mt-3">{destaque.chamada}</p> : null}
            {destaque.publicado_em ? (
              <p className="mt-3 font-rotulo text-sm font-bold uppercase tracking-wider text-sutil">{dataCurta(destaque.publicado_em)}</p>
            ) : null}
          </div>
        </Link>
      </article>

      {demais.length > 0 ? (
        <section aria-label="Outras manchetes" className="mt-8 border-t-4 border-tinta pt-5">
          <ul className="grid gap-5 md:grid-cols-2 md:gap-x-8">
            {demais.map((post) => (
              <li key={post.id} className="border-b-2 border-tinta/15 pb-5 last:border-0 md:[&:nth-last-child(2)]:border-0">
                <Link href={`/post/${post.slug}`} className="group flex gap-3 md:flex-col">
                  <ImagemCapa
                    src={post.capa_url_thumb}
                    alt={post.titulo}
                    sizes="(max-width: 768px) 96px, 400px"
                    proporcao="aspect-square md:aspect-[16/10]"
                    rotuloSemFoto={null}
                    className="w-24 shrink-0 border-2 border-tinta md:w-full"
                  />
                  <div className="min-w-0">
                    <Chapeu texto={post.chapeu} className="text-[0.7rem]" />
                    <h2 className="manchete mt-1 text-2xl group-hover:text-campo md:text-3xl">{post.titulo}</h2>
                    {post.chamada ? <p className="mt-1 hidden font-texto text-sutil md:block">{post.chamada}</p> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 bg-tinta px-5 py-6 text-center text-papel">
        <p className="font-rotulo text-lg font-bold uppercase tracking-wider">Perdeu alguma?</p>
        <p className="manchete mt-1 text-3xl sm:text-4xl">Todo vexame fica guardado no arquivo</p>
        <Link href="/arquivo" className="botao botao-bomba mt-4">
          Abrir o arquivo →
        </Link>
      </div>
    </>
  );
}
