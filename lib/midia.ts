import { env } from "@/lib/env";

export const BUCKET = "midia";

/** Prefixo de toda URL pública de arquivo nosso. Qualquer outra URL é recusada. */
export const PREFIXO_PUBLICO = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

export function urlPublica(caminho: string) {
  return `${PREFIXO_PUBLICO}${caminho}`;
}

/** URL pública → caminho dentro do bucket (ou null se não for do nosso bucket). */
export function caminhoDaUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(PREFIXO_PUBLICO)) return null;
  const caminho = url.slice(PREFIXO_PUBLICO.length);
  return /^[a-z]+\/[0-9a-f-]{36}\/(thumb|full)\.(webp|jpg)$/.test(caminho) ? caminho : null;
}

export function ehUrlDeMidia(url: string, pasta: "posts" | "jogadores") {
  const caminho = caminhoDaUrl(url);
  return caminho !== null && caminho.startsWith(`${pasta}/`);
}
