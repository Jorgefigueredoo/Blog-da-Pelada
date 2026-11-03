import { z } from "zod";
import { ehUrlDeMidia } from "@/lib/midia";

/** Mesmo esquema no navegador (feedback imediato) e na Server Action (a validação que vale). */

export const LIMITES_POST = {
  chapeu: 30,
  titulo: 140,
  chamada: 280,
  corpo: 20_000,
  legenda: 200,
  fotos: 30,
} as const;

const urlDePost = z.string().refine((u) => ehUrlDeMidia(u, "posts"), "Imagem fora do bucket do site.");

const textoOpcional = (max: number, mensagem: string) =>
  z
    .string()
    .trim()
    .max(max, mensagem)
    .nullable()
    .transform((v) => (v ? v : null));

export const esquemaFoto = z.object({
  id: z.uuid().optional(),
  url_thumb: urlDePost,
  url_full: urlDePost.nullable(),
  legenda: textoOpcional(LIMITES_POST.legenda, `Legenda com mais de ${LIMITES_POST.legenda} caracteres.`),
});

export const esquemaPost = z.object({
  id: z.uuid().optional(),
  chapeu: textoOpcional(LIMITES_POST.chapeu, `Chapéu é curtinho: no máximo ${LIMITES_POST.chapeu} caracteres.`),
  titulo: z
    .string()
    .trim()
    .min(5, "A manchete precisa de pelo menos 5 letras.")
    .max(LIMITES_POST.titulo, `Manchete com no máximo ${LIMITES_POST.titulo} caracteres. Isso é jornal, não livro.`),
  chamada: textoOpcional(LIMITES_POST.chamada, `A chamada passa de ${LIMITES_POST.chamada} caracteres.`),
  corpo: z
    .string()
    .trim()
    .min(20, "O texto tá curto demais: escreve pelo menos umas 20 letras.")
    .max(LIMITES_POST.corpo, "Texto longo demais."),
  capa: z.object({ thumb: urlDePost, full: urlDePost }).nullable(),
  fotos: z.array(esquemaFoto).max(LIMITES_POST.fotos, `No máximo ${LIMITES_POST.fotos} fotos na galeria.`),
});

export type EntradaPost = z.input<typeof esquemaPost>;
export type PostValidado = z.output<typeof esquemaPost>;

export const intencoes = z.enum(["salvar", "publicar", "despublicar"]);
export type Intencao = z.infer<typeof intencoes>;

/** Erros por campo, no formato que o formulário mostra. */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const issue of erro.issues) {
    const chave = issue.path.join(".") || "_";
    saida[chave] ??= issue.message;
  }
  return saida;
}
