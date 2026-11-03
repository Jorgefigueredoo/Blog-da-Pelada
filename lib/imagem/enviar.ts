import { env } from "@/lib/env";
import { BUCKET, caminhoDaUrl, urlPublica } from "@/lib/midia";
import { clienteNavegador } from "@/lib/supabase/navegador";
import { comprimirImagem, ErroImagem } from "./comprimir";

export type EtapaEnvio =
  | { etapa: "comprimindo"; original: number }
  | { etapa: "enviando"; original: number; full: number; thumb: number; progresso: number };

export type ImagemEnviada = {
  url_thumb: string;
  url_full: string;
  original: number;
  full: number;
  thumb: number;
};

/** UUID v4 mesmo fora de contexto seguro (ex.: testando pelo IP da rede local no celular). */
function novoId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const MENSAGEM_COTA = "Cota de fotos da semana estourada. Apaga alguma foto que não vale a pena ou espera a quarta que vem.";

/**
 * Upload direto pro Storage via XHR (o supabase-js não expõe progresso).
 * cache-control de 1 ano: o arquivo nunca muda, o nome tem UUID.
 */
function enviarArquivo(caminho: string, blob: Blob, token: string, onProgresso: (fracao: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${caminho}`);
    xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("content-type", blob.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgresso(e.loaded / e.total);
    xhr.onerror = () => reject(new ErroImagem("A conexão caiu durante o envio. Tenta de novo."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      const texto = xhr.responseText || "";
      console.error("[upload]", xhr.status, texto);
      if (/row-level security/i.test(texto)) {
        return reject(new ErroImagem(`Upload barrado. ${MENSAGEM_COTA} (Ou tua sessão expirou: recarrega a página.)`));
      }
      if (xhr.status === 413) return reject(new ErroImagem("Arquivo grande demais para o bucket."));
      reject(new ErroImagem("O servidor recusou a foto. Tenta de novo em instantes."));
    };
    xhr.send(blob);
  });
}

/**
 * Valida → comprime → confere a cota → sobe full e depois thumb.
 * O original nunca sai do aparelho.
 */
export async function subirImagemDePost(arquivo: File, onEtapa: (e: EtapaEnvio) => void): Promise<ImagemEnviada> {
  const supabase = clienteNavegador();

  onEtapa({ etapa: "comprimindo", original: arquivo.size });
  const img = await comprimirImagem(arquivo);

  const [{ data: sessao }, { data: cota, error: erroCota }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from("v_cota_semanal").select("fotos, limite_fotos").single(),
  ]);
  const token = sessao.session?.access_token;
  if (!token) throw new ErroImagem("Tua sessão expirou. Entra de novo pra subir fotos.");
  if (erroCota) console.error("[upload] cota:", erroCota.message);
  if (cota && cota.fotos !== null && cota.limite_fotos !== null && cota.fotos >= cota.limite_fotos) {
    throw new ErroImagem(`${MENSAGEM_COTA} (${cota.fotos} de ${cota.limite_fotos})`);
  }

  const pasta = `posts/${novoId()}`;
  const caminhoFull = `${pasta}/full.${img.extensao}`;
  const caminhoThumb = `${pasta}/thumb.${img.extensao}`;
  const total = img.full.size + img.thumb.size;
  const base = { original: img.tamanhoOriginal, full: img.full.size, thumb: img.thumb.size };

  onEtapa({ etapa: "enviando", ...base, progresso: 0 });
  // full primeiro: é ele que conta na cota (a policy do bucket confere)
  await enviarArquivo(caminhoFull, img.full, token, (f) =>
    onEtapa({ etapa: "enviando", ...base, progresso: (f * img.full.size) / total }),
  );
  try {
    await enviarArquivo(caminhoThumb, img.thumb, token, (f) =>
      onEtapa({ etapa: "enviando", ...base, progresso: (img.full.size + f * img.thumb.size) / total }),
    );
  } catch (e) {
    await supabase.storage.from(BUCKET).remove([caminhoFull]);
    throw e;
  }

  return { url_full: urlPublica(caminhoFull), url_thumb: urlPublica(caminhoThumb), ...base };
}

/** Apaga arquivos que subiram mas nunca foram salvos num post (ex.: trocou a capa antes de salvar). */
export async function descartarImagem(urls: (string | null | undefined)[]) {
  const caminhos = urls.map(caminhoDaUrl).filter((c): c is string => c !== null);
  if (caminhos.length === 0) return;
  const { error } = await clienteNavegador().storage.from(BUCKET).remove(caminhos);
  if (error) console.error("[descartarImagem]", error.message);
}
