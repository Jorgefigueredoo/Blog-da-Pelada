"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { BarraEnvio, type EstadoEnvio } from "@/components/admin/barra-envio";
import { PlacarCota } from "@/components/admin/placar-cota";
import { GaleriaPost } from "@/components/galeria-post";
import { CabecalhoMateria, CapaMateria, CorpoMateria } from "@/components/materia";
import { ErroImagem, formatarBytes } from "@/lib/imagem/comprimir";
import { descartarImagem, subirImagemDePost } from "@/lib/imagem/enviar";
import { errosPorCampo, esquemaPost, LIMITES_POST, type EntradaPost, type Intencao } from "@/lib/validacao/post";
import { apagarPost, salvarPost, type Cota, type FotoSalva } from "./acoes";

export type PostInicial = {
  id?: string;
  slug?: string;
  chapeu: string;
  titulo: string;
  chamada: string;
  corpo: string;
  capa: { thumb: string; full: string } | null;
  fotos: FotoSalva[];
  publicado: boolean;
  publicado_em: string | null;
};

type Reducao = { original: number; final: number };
type FotoEditor = { chave: string; id?: string; url_thumb: string; url_full: string | null; legenda: string; reducao?: Reducao };
type Envio = { chave: string; nome: string; estado: EstadoEnvio };
type Aviso = { tipo: "ok" | "erro" | "alerta"; texto: string } | null;

let contador = 0;
const novaChave = () => `nova-${Date.now()}-${contador++}`;

// accept="image/*": no iPhone, o Safari converte HEIC para JPEG na hora de escolher.
const ACEITA = "image/*";

function paraEditor(f: FotoSalva): FotoEditor {
  return { chave: f.id, id: f.id, url_thumb: f.url_thumb, url_full: f.url_full, legenda: f.legenda ?? "" };
}

function mensagemDeErro(e: unknown) {
  if (e instanceof ErroImagem) return e.message;
  console.error(e);
  return "Falha inesperada ao processar a foto. Nada foi enviado.";
}

export function EditorPost({ inicial, cotaInicial }: { inicial: PostInicial; cotaInicial: Cota | null }) {
  const [id, setId] = useState(inicial.id);
  const [slug, setSlug] = useState(inicial.slug);
  const [chapeu, setChapeu] = useState(inicial.chapeu);
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [chamada, setChamada] = useState(inicial.chamada);
  const [corpo, setCorpo] = useState(inicial.corpo);
  const [capa, setCapa] = useState(inicial.capa);
  const [capaReducao, setCapaReducao] = useState<Reducao | null>(null);
  const [envioCapa, setEnvioCapa] = useState<Envio | null>(null);
  const [fotos, setFotos] = useState<FotoEditor[]>(inicial.fotos.map(paraEditor));
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [publicado, setPublicado] = useState(inicial.publicado);
  const [publicadoEm, setPublicadoEm] = useState(inicial.publicado_em);
  const [cota, setCota] = useState(cotaInicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<Aviso>(null);
  const [sujo, setSujo] = useState(false);
  const [aba, setAba] = useState<"editar" | "preview">("editar");
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);
  const [salvando, iniciarSalvar] = useTransition();
  const [apagando, iniciarApagar] = useTransition();

  // capa que está gravada no banco: trocar/remover uma capa NÃO salva apaga o arquivo na hora
  const capaSalva = useRef(inicial.capa?.full ?? null);

  const enviando = envios.some((e) => e.estado.etapa !== "erro") || (envioCapa !== null && envioCapa.estado.etapa !== "erro");

  useEffect(() => {
    if (!sujo && !enviando) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sujo, enviando]);

  function mudou() {
    setSujo(true);
    setAviso(null);
  }

  // ------------------------------------------------------------------ capa
  async function escolherCapa(arquivo: File | undefined) {
    if (!arquivo) return;
    const chave = novaChave();
    setEnvioCapa({ chave, nome: arquivo.name, estado: { etapa: "comprimindo", original: arquivo.size } });
    try {
      const r = await subirImagemDePost(arquivo, (estado) => setEnvioCapa({ chave, nome: arquivo.name, estado }));
      if (capa && capa.full !== capaSalva.current) void descartarImagem([capa.full, capa.thumb]);
      setCapa({ thumb: r.url_thumb, full: r.url_full });
      setCapaReducao({ original: r.original, final: r.full + r.thumb });
      setEnvioCapa(null);
      mudou();
    } catch (e) {
      setEnvioCapa({ chave, nome: arquivo.name, estado: { etapa: "erro", mensagem: mensagemDeErro(e) } });
    }
  }

  function removerCapa() {
    if (capa && capa.full !== capaSalva.current) void descartarImagem([capa.full, capa.thumb]);
    setCapa(null);
    setCapaReducao(null);
    mudou();
  }

  // ---------------------------------------------------------------- galeria
  async function adicionarFotos(lista: FileList | null) {
    if (!lista) return;
    const vagas = LIMITES_POST.fotos - fotos.length - envios.filter((e) => e.estado.etapa !== "erro").length;
    const arquivos = Array.from(lista);
    if (arquivos.length > vagas) {
      setAviso({ tipo: "alerta", texto: `A galeria aceita no máximo ${LIMITES_POST.fotos} fotos. Só as primeiras ${Math.max(0, vagas)} vão subir.` });
    }
    // uma por vez: comprimir várias fotos de 12 MP em paralelo derruba o Safari do iPhone
    for (const arquivo of arquivos.slice(0, Math.max(0, vagas))) {
      const chave = novaChave();
      const atualizar = (estado: EstadoEnvio) => setEnvios((atual) => atual.map((e) => (e.chave === chave ? { ...e, estado } : e)));
      setEnvios((atual) => [...atual, { chave, nome: arquivo.name, estado: { etapa: "comprimindo", original: arquivo.size } }]);
      try {
        const r = await subirImagemDePost(arquivo, atualizar);
        setEnvios((atual) => atual.filter((e) => e.chave !== chave));
        setFotos((atual) => [
          ...atual,
          { chave, url_thumb: r.url_thumb, url_full: r.url_full, legenda: "", reducao: { original: r.original, final: r.full + r.thumb } },
        ]);
        mudou();
      } catch (e) {
        atualizar({ etapa: "erro", mensagem: mensagemDeErro(e) });
        if (e instanceof ErroImagem && /cota/i.test(e.message)) break;
      }
    }
  }

  function removerFoto(chave: string) {
    const foto = fotos.find((f) => f.chave === chave);
    // foto ainda não salva: apaga o arquivo agora. Foto salva: o servidor apaga ao salvar.
    if (foto && !foto.id) void descartarImagem([foto.url_full, foto.url_thumb]);
    setFotos((atual) => atual.filter((f) => f.chave !== chave));
    mudou();
  }

  function moverFoto(indice: number, direcao: -1 | 1) {
    setFotos((atual) => {
      const alvo = indice + direcao;
      if (alvo < 0 || alvo >= atual.length) return atual;
      const copia = [...atual];
      [copia[indice], copia[alvo]] = [copia[alvo], copia[indice]];
      return copia;
    });
    mudou();
  }

  function mudarLegenda(chave: string, legenda: string) {
    setFotos((atual) => atual.map((f) => (f.chave === chave ? { ...f, legenda } : f)));
    mudou();
  }

  // ------------------------------------------------------------------ salvar
  function enviar(intencao: Intencao) {
    if (enviando) {
      setAviso({ tipo: "alerta", texto: "Calma que a foto ainda tá subindo. Espera terminar." });
      return;
    }
    const entrada: EntradaPost = {
      id,
      chapeu,
      titulo,
      chamada,
      corpo,
      capa,
      fotos: fotos.map((f) => ({ id: f.id, url_thumb: f.url_thumb, url_full: f.url_full, legenda: f.legenda })),
    };
    const v = esquemaPost.safeParse(entrada);
    if (!v.success) {
      setErros(errosPorCampo(v.error));
      setAviso({ tipo: "erro", texto: "Tem campo pra arrumar antes de salvar." });
      setAba("editar");
      return;
    }
    setErros({});

    iniciarSalvar(async () => {
      const r = await salvarPost(entrada, intencao);
      if (!r.ok) {
        setErros(r.erros ?? {});
        setAviso({ tipo: "erro", texto: r.mensagem });
        return;
      }
      if (!id) window.history.replaceState(null, "", `/admin/posts/${r.id}`);
      setId(r.id);
      setSlug(r.slug);
      setPublicado(r.publicado);
      setPublicadoEm(r.publicado_em);
      if (r.cota) setCota(r.cota);
      capaSalva.current = capa?.full ?? null;
      setFotos((atual) =>
        r.fotos.map((f) => {
          const local = atual.find((a) => a.url_thumb === f.url_thumb);
          return { ...paraEditor(f), chave: local?.chave ?? f.id, reducao: local?.reducao };
        }),
      );
      setSujo(false);
      setAviso({ tipo: r.alerta ? "alerta" : "ok", texto: r.mensagem });
    });
  }

  function apagar() {
    if (!id) return;
    iniciarApagar(async () => {
      const r = await apagarPost(id);
      // sucesso redireciona; só chega aqui se falhou
      if (r && !r.ok) setAviso({ tipo: "erro", texto: r.mensagem });
    });
  }

  // ------------------------------------------------------------------ render
  const dadosPreview = {
    chapeu: chapeu.trim() || null,
    titulo: titulo.trim(),
    chamada: chamada.trim() || null,
    corpo: corpo.trim() || "O texto da matéria aparece aqui.",
    capa_url_full: capa?.full ?? null,
    publicado_em: publicado ? publicadoEm : null,
  };
  const ocupado = salvando || apagando;

  return (
    <div className="pb-28">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="manchete text-4xl sm:text-5xl">{id ? "Editar matéria" : "Nova matéria"}</h1>
        {publicado ? <span className="chapeu bg-campo! text-white!">No ar</span> : <span className="chapeu bg-superficie! border-2 border-tinta">Rascunho</span>}
        {publicado && slug ? (
          <a href={`/post/${slug}`} target="_blank" className="font-rotulo font-bold uppercase underline hover:text-campo">
            Ver no site ↗
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex border-2 border-tinta lg:hidden" role="tablist">
        {(["editar", "preview"] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={aba === a}
            onClick={() => setAba(a)}
            className={`flex-1 py-2 font-rotulo font-bold uppercase ${aba === a ? "bg-tinta text-papel" : ""}`}
          >
            {a === "editar" ? "Escrever" : "Como vai ficar"}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        {/* ---------------------------------------------------- formulário */}
        <form className={`space-y-5 ${aba === "editar" ? "" : "hidden lg:block"}`} onSubmit={(e) => e.preventDefault()} noValidate>
          <Campo id="campo-chapeu" rotulo="Chapéu" dica="Em cima da manchete: ESCÂNDALO, EXCLUSIVO, URGENTE…" erro={erros.chapeu} contador={[chapeu.length, LIMITES_POST.chapeu]}>
            <input
              id="campo-chapeu"
              className="campo uppercase"
              value={chapeu}
              maxLength={LIMITES_POST.chapeu}
              onChange={(e) => {
                setChapeu(e.target.value.toUpperCase());
                mudou();
              }}
              placeholder="ESCÂNDALO"
            />
          </Campo>

          <Campo id="campo-titulo" rotulo="Manchete" erro={erros.titulo} contador={[titulo.length, LIMITES_POST.titulo]}>
            <textarea
              id="campo-titulo"
              className="campo font-manchete text-2xl uppercase"
              rows={2}
              value={titulo}
              maxLength={LIMITES_POST.titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                mudou();
              }}
              placeholder="TONHÃO MARCA CONTRA DE NOVO"
            />
          </Campo>

          <Campo id="campo-chamada" rotulo="Chamada" dica="A linha fina embaixo da manchete. Vai no preview do WhatsApp." erro={erros.chamada} contador={[chamada.length, LIMITES_POST.chamada]}>
            <textarea
              id="campo-chamada"
              className="campo"
              rows={2}
              value={chamada}
              maxLength={LIMITES_POST.chamada}
              onChange={(e) => {
                setChamada(e.target.value);
                mudou();
              }}
            />
          </Campo>

          <Campo rotulo="Capa" dica="Comprimida no teu aparelho antes de subir. O arquivo original não sai daqui." erro={erros["capa"] ?? erros["capa.full"]}>
            {capa ? (
              <div className="flex items-start gap-3">
                <div className="relative aspect-[16/10] w-40 shrink-0 overflow-hidden border-2 border-tinta">
                  <Image src={capa.thumb} alt="Capa" fill sizes="160px" quality={70} className="object-cover" />
                </div>
                <div className="space-y-2">
                  {capaReducao ? (
                    <p className="text-xs text-sutil tabular-nums">
                      {formatarBytes(capaReducao.original)} → {formatarBytes(capaReducao.final)}
                    </p>
                  ) : null}
                  <label className="botao botao-secundario botao-pequeno">
                    Trocar
                    <input type="file" accept={ACEITA} className="sr-only" disabled={envioCapa?.estado.etapa === "comprimindo" || envioCapa?.estado.etapa === "enviando"} onChange={(e) => { void escolherCapa(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  <button type="button" className="botao botao-secundario botao-pequeno ml-2" onClick={removerCapa}>
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <label className="gramado flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-tinta p-4 text-center">
                <span className="bg-papel px-2 font-rotulo text-lg font-bold uppercase text-tinta">📷 Escolher foto de capa</span>
                <span className="bg-papel/90 px-2 text-xs text-tinta">JPG, PNG, WebP ou HEIC · até 10 MB</span>
                <input type="file" accept={ACEITA} className="sr-only" onChange={(e) => { void escolherCapa(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            )}
            {envioCapa ? (
              <div className="mt-2">
                <BarraEnvio nome={envioCapa.nome} estado={envioCapa.estado} onDispensar={() => setEnvioCapa(null)} />
              </div>
            ) : null}
          </Campo>

          <Campo id="campo-corpo" rotulo="Texto" dica="Texto simples. Deixe uma linha em branco entre os parágrafos." erro={erros.corpo}>
            <textarea
              id="campo-corpo"
              className="campo font-texto text-lg leading-relaxed"
              rows={14}
              value={corpo}
              maxLength={LIMITES_POST.corpo}
              onChange={(e) => {
                setCorpo(e.target.value);
                mudou();
              }}
            />
          </Campo>

          <Campo rotulo={`Galeria (${fotos.length}/${LIMITES_POST.fotos})`} dica="Cada foto vira duas versões: thumb de 400px e full de 1600px." erro={erros.fotos}>
            {fotos.length > 0 ? (
              <ul className="space-y-2">
                {fotos.map((f, i) => (
                  <li key={f.chave} className="flex gap-2 border-2 border-tinta bg-superficie p-2">
                    <div className="relative size-20 shrink-0 overflow-hidden bg-campo">
                      <Image src={f.url_thumb} alt="" fill sizes="96px" quality={70} className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        className="campo py-1.5! text-sm"
                        value={f.legenda}
                        maxLength={LIMITES_POST.legenda}
                        onChange={(e) => mudarLegenda(f.chave, e.target.value)}
                        placeholder="Legenda (opcional)"
                        aria-label={`Legenda da foto ${i + 1}`}
                      />
                      {erros[`fotos.${i}.legenda`] ? <p className="text-sm text-vermelho">{erros[`fotos.${i}.legenda`]}</p> : null}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => moverFoto(i, -1)} disabled={i === 0} aria-label="Mover para cima">
                          ↑
                        </button>
                        <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => moverFoto(i, 1)} disabled={i === fotos.length - 1} aria-label="Mover para baixo">
                          ↓
                        </button>
                        <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => removerFoto(f.chave)}>
                          Tirar
                        </button>
                        {f.reducao ? (
                          <span className="text-xs text-sutil tabular-nums">
                            {formatarBytes(f.reducao.original)} → {formatarBytes(f.reducao.final)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-sutil">Ninguém tirou foto, que vergonha.</p>
            )}

            {envios.length > 0 ? (
              <div className="mt-2 space-y-2">
                {envios.map((e) => (
                  <BarraEnvio key={e.chave} nome={e.nome} estado={e.estado} onDispensar={() => setEnvios((atual) => atual.filter((x) => x.chave !== e.chave))} />
                ))}
              </div>
            ) : null}

            {fotos.length < LIMITES_POST.fotos ? (
              <label className="botao botao-secundario mt-3 w-full">
                + Adicionar fotos
                <input type="file" accept={ACEITA} multiple className="sr-only" onChange={(e) => { void adicionarFotos(e.target.files); e.target.value = ""; }} />
              </label>
            ) : null}
          </Campo>

          {cota ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <PlacarCota rotulo="publicadas esta semana" usado={cota.publicadas} limite={cota.limite} />
              <PlacarCota rotulo="fotos esta semana" usado={cota.fotos} limite={cota.limite_fotos} />
            </div>
          ) : null}

          {id ? (
            <div className="border-t-2 border-dashed border-tinta/40 pt-5">
              {confirmandoApagar ? (
                <div className="aviso-erro space-y-3">
                  <p>Apagar de vez? A matéria e todas as fotos somem e o link para de funcionar. Não tem volta.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="botao botao-perigo botao-pequeno" onClick={apagar} disabled={ocupado}>
                      {apagando ? "Apagando…" : "Apagar de vez"}
                    </button>
                    <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => setConfirmandoApagar(false)}>
                      Deixa quieto
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="font-rotulo font-bold uppercase text-vermelho underline" onClick={() => setConfirmandoApagar(true)}>
                  Apagar matéria
                </button>
              )}
            </div>
          ) : null}
        </form>

        {/* ------------------------------------------------------- preview */}
        <div className={aba === "preview" ? "" : "hidden lg:block"}>
          <div className="lg:sticky lg:top-4">
            <p className="mb-2 font-rotulo text-sm font-bold uppercase tracking-wider text-sutil">Como vai ficar</p>
            <div className="max-h-none overflow-auto border-2 border-tinta bg-papel p-4 lg:max-h-[calc(100dvh-2rem)]">
              <CabecalhoMateria post={dadosPreview} />
              <CapaMateria post={dadosPreview} prioridade={false} />
              <CorpoMateria corpo={dadosPreview.corpo} />
              <GaleriaPost fotos={fotos.map((f) => ({ id: f.chave, url_thumb: f.url_thumb, url_full: f.url_full, legenda: f.legenda || null }))} />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------- barra de ações */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-tinta bg-papel/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          {aviso ? (
            <p className={`mb-2 text-sm ${aviso.tipo === "ok" ? "aviso-ok" : "aviso-erro"}`} role={aviso.tipo === "ok" ? "status" : "alert"}>
              {aviso.texto}
            </p>
          ) : null}
          <div className="flex gap-3">
            {publicado ? (
              <>
                <button type="button" className="botao botao-secundario flex-1" onClick={() => enviar("despublicar")} disabled={ocupado || enviando}>
                  Recolher
                </button>
                <button type="button" className="botao botao-primario flex-[2]" onClick={() => enviar("salvar")} disabled={ocupado || enviando}>
                  {salvando ? "Salvando…" : "Salvar alterações"}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="botao botao-secundario flex-1" onClick={() => enviar("salvar")} disabled={ocupado || enviando}>
                  {salvando ? "Salvando…" : "Salvar rascunho"}
                </button>
                <button
                  type="button"
                  className="botao botao-bomba flex-[1.4]"
                  onClick={() => enviar("publicar")}
                  disabled={ocupado || enviando}
                  title={cota && cota.publicadas >= cota.limite ? "Cota da semana cheia" : undefined}
                >
                  {salvando ? "Acendendo o pavio…" : "💣 Soltar a bomba"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({
  id,
  rotulo,
  dica,
  erro,
  contador,
  children,
}: {
  id?: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  contador?: [number, number];
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        {id ? (
          <label htmlFor={id} className="rotulo">
            {rotulo}
          </label>
        ) : (
          <span className="rotulo">{rotulo}</span>
        )}
        {contador ? (
          <span className={`text-xs tabular-nums ${contador[0] > contador[1] * 0.9 ? "text-vermelho" : "text-sutil"}`}>
            {contador[0]}/{contador[1]}
          </span>
        ) : null}
      </div>
      {dica ? <p className="mb-1 text-sm text-sutil">{dica}</p> : null}
      <div className={dica ? "" : "mt-1"}>{children}</div>
      {erro ? (
        <p className="mt-1 text-sm font-bold text-vermelho" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
