/**
 * Compressão no navegador, ANTES do upload.
 *
 * Por quê: no Supabase Free não existe transformação de imagem. O arquivo
 * que entra no bucket é exatamente o que vai ser servido. Toda redução
 * precisa acontecer aqui.
 *
 * ⚠️ DECISÃO IRREVERSÍVEL: o arquivo original é DESCARTADO. Ele não sobe e
 * não é guardado em lugar nenhum. Uma foto de 4 MB vira ~225 KB (thumb + full),
 * 18× menos. Não dá pra recuperar a resolução original depois.
 * Bônus: o canvas não copia metadados EXIF, então a localização GPS da foto
 * também não vai pro ar.
 *
 *   thumb  400px  WebP q70  ~25 KB   grid da galeria, cards do feed, foto do elenco
 *   full   1600px WebP q75  ~200 KB  capa do post, lightbox
 *
 * Navegador que não codifica WebP no canvas cai para JPEG (o tamanho fica parecido).
 */

export const VERSOES = {
  thumb: { largura: 400, qualidade: 0.7, alvo: 25_000 },
  full: { largura: 1600, qualidade: 0.75, alvo: 200_000 },
} as const;

export const MAX_ENTRADA = 10 * 1024 * 1024;
const TIPOS_ACEITOS = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export class ErroImagem extends Error {}

export type ImagemComprimida = {
  full: Blob;
  thumb: Blob;
  extensao: "webp" | "jpg";
  tamanhoOriginal: number;
};

function ehHeic(arquivo: File) {
  return /image\/hei[cf]/.test(arquivo.type) || /\.hei[cf]$/i.test(arquivo.name);
}

export function formatarBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

export function validarEntrada(arquivo: File) {
  // Alguns navegadores entregam HEIC com type vazio: aceita pela extensão.
  const tipoOk = TIPOS_ACEITOS.has(arquivo.type) || (arquivo.type === "" && ehHeic(arquivo));
  if (!tipoOk) throw new ErroImagem("Só aceito foto JPG, PNG, WebP ou HEIC.");
  if (arquivo.size > MAX_ENTRADA) {
    throw new ErroImagem(`Essa foto tem ${formatarBytes(arquivo.size)}. O máximo é 10 MB.`);
  }
}

type Decodificada = { fonte: CanvasImageSource; largura: number; altura: number; liberar: () => void };

async function decodificar(arquivo: File): Promise<Decodificada> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
      return { fonte: bmp, largura: bmp.width, altura: bmp.height, liberar: () => bmp.close() };
    } catch {
      // cai para o <img> abaixo
    }
  }

  const url = URL.createObjectURL(arquivo);
  const img = new Image();
  try {
    img.src = url;
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    // HEIC só é decodificado pelo Safari. Nunca subimos o arquivo cru como plano B.
    throw new ErroImagem(
      ehHeic(arquivo)
        ? "Este navegador não abre fotos HEIC. No iPhone, envie pelo Safari, ou mude em Ajustes › Câmera › Formatos › “Mais Compatível”. Nada foi enviado."
        : "Não consegui abrir essa imagem — ela pode estar corrompida. Nada foi enviado.",
    );
  }
  return { fonte: img, largura: img.naturalWidth, altura: img.naturalHeight, liberar: () => URL.revokeObjectURL(url) };
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

async function codificar(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  const webp = await paraBlob(canvas, "image/webp", qualidade);
  if (webp && webp.type === "image/webp") return webp;
  const jpg = await paraBlob(canvas, "image/jpeg", Math.min(0.85, qualidade + 0.05));
  if (!jpg) throw new ErroImagem("O navegador não conseguiu gerar a imagem comprimida. Nada foi enviado.");
  return jpg;
}

function desenhar(fonte: CanvasImageSource, largura: number, altura: number, larguraMax: number) {
  const escala = Math.min(1, larguraMax / largura);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(largura * escala));
  canvas.height = Math.max(1, Math.round(altura * escala));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ErroImagem("Teu navegador não deixou processar a imagem. Nada foi enviado.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff"; // PNG transparente não vira fundo preto
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(fonte, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Comprime até o alvo: se passar muito do tamanho esperado, uma segunda passada com qualidade menor. */
async function versao(canvas: HTMLCanvasElement, v: (typeof VERSOES)[keyof typeof VERSOES]) {
  let blob = await codificar(canvas, v.qualidade);
  if (blob.size > v.alvo * 1.3) {
    const menor = await codificar(canvas, v.qualidade - 0.1);
    if (menor.size < blob.size) blob = menor;
  }
  return blob;
}

export async function comprimirImagem(arquivo: File): Promise<ImagemComprimida> {
  validarEntrada(arquivo);
  const img = await decodificar(arquivo);
  try {
    if (!img.largura || !img.altura) throw new ErroImagem("Imagem vazia ou inválida. Nada foi enviado.");

    // full a partir do original; thumb a partir do full (redução em 2 passos = menos serrilhado)
    const canvasFull = desenhar(img.fonte, img.largura, img.altura, VERSOES.full.largura);
    const full = await versao(canvasFull, VERSOES.full);
    const canvasThumb = desenhar(canvasFull, canvasFull.width, canvasFull.height, VERSOES.thumb.largura);
    const thumb = await versao(canvasThumb, VERSOES.thumb);

    // iOS segura memória de canvas: zera na hora
    canvasFull.width = canvasFull.height = 0;
    canvasThumb.width = canvasThumb.height = 0;

    return {
      full,
      thumb,
      extensao: full.type === "image/webp" ? "webp" : "jpg",
      tamanhoOriginal: arquivo.size,
    };
  } finally {
    img.liberar();
  }
}
