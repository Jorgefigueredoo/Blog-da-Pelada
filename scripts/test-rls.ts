/**
 * Teste de RLS: com a anon key, o visitante NÃO pode
 *   1. ler post não publicado
 *   2. inserir post
 *   3. ler comentário pendente
 *   4. ler a tabela admins
 * (+ extra: enviar arquivo para o bucket `midia`)
 *
 * Para o teste ser honesto, o script primeiro cria os dados com a service
 * role (rascunho, comentário pendente, admin) e confere que eles existem.
 * Assim, "anon recebeu 0 linhas" prova bloqueio, não tabela vazia.
 * Tudo que é criado é apagado no final.
 *
 * Uso: npm run test:rls   (lê .env.local)
 * A service role aqui é usada só por este script de linha de comando.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(2);
}

const opcoes = { auth: { persistSession: false, autoRefreshToken: false } };
const servico = createClient<Database>(url, serviceKey, opcoes);
const anon = createClient<Database>(url, anonKey, opcoes);

type Resultado = { teste: string; bloqueado: boolean; detalhe: string };

const sufixo = Date.now().toString(36);
const slugRascunho = `rls-rascunho-${sufixo}`;
const emailAdmin = `rls-admin-${sufixo}@teste.local`;

async function preparar() {
  const { data: post, error: e1 } = await servico
    .from("posts")
    .insert({ slug: slugRascunho, titulo: "RASCUNHO SECRETO", corpo: "não pode vazar", publicado: false })
    .select("id")
    .single();
  if (e1 || !post) throw new Error(`fixture post: ${e1?.message}`);

  // comentário pendente precisa de um post visível, senão o teste não diferencia
  // "bloqueado por status" de "bloqueado porque o post é rascunho"
  const { data: publicado, error: e2 } = await servico
    .from("posts")
    .select("id")
    .eq("publicado", true)
    .limit(1)
    .single();
  if (e2 || !publicado) throw new Error(`precisa de ao menos um post publicado (rode o seed): ${e2?.message}`);

  const { data: comentario, error: e3 } = await servico
    .from("comentarios")
    .insert({ post_id: publicado.id, apelido: "Infiltrado", corpo: "comentário pendente", visitante_hash: "rls", status: "pendente" })
    .select("id")
    .single();
  if (e3 || !comentario) throw new Error(`fixture comentário: ${e3?.message}`);

  const { data: usuario, error: e4 } = await servico.auth.admin.createUser({ email: emailAdmin, email_confirm: true });
  if (e4 || !usuario.user) throw new Error(`fixture usuário: ${e4?.message}`);
  const { error: e5 } = await servico.from("admins").insert({ id: usuario.user.id, email: emailAdmin, nome: "Admin do Teste" });
  if (e5) throw new Error(`fixture admin: ${e5.message}`);

  // confere que os dados existem (vistos pela service role)
  const { count } = await servico.from("admins").select("id", { count: "exact", head: true });
  if (!count) throw new Error("fixture: admins vazia mesmo após insert");

  return { postId: post.id, comentarioId: comentario.id, userId: usuario.user.id };
}

async function limpar(f: { postId?: string; comentarioId?: string; userId?: string }) {
  if (f.comentarioId) await servico.from("comentarios").delete().eq("id", f.comentarioId);
  if (f.postId) await servico.from("posts").delete().eq("id", f.postId);
  await servico.from("posts").delete().like("slug", `rls-invasor-${sufixo}%`);
  if (f.userId) await servico.auth.admin.deleteUser(f.userId); // cascade apaga a linha de admins
  await servico.storage.from("midia").remove([`posts/rls-${sufixo}/full.webp`]);
}

async function testar(f: { postId: string; comentarioId: string }): Promise<Resultado[]> {
  const r: Resultado[] = [];

  {
    const { data, error } = await anon.from("posts").select("id, titulo").eq("id", f.postId);
    const bloqueado = !!error || (data?.length ?? 0) === 0;
    r.push({ teste: "1. ler post não publicado", bloqueado, detalhe: error ? error.message : `${data?.length ?? 0} linha(s)` });
  }

  {
    const { data, error } = await anon
      .from("posts")
      .insert({ slug: `rls-invasor-${sufixo}`, titulo: "INVASÃO", corpo: "x", publicado: true })
      .select("id");
    const bloqueado = !!error && !data;
    r.push({ teste: "2. inserir post", bloqueado, detalhe: error ? `${error.code}: ${error.message}` : "INSERIU!" });
  }

  {
    const { data, error } = await anon.from("comentarios").select("id, corpo").eq("id", f.comentarioId);
    const bloqueado = !!error || (data?.length ?? 0) === 0;
    r.push({ teste: "3. ler comentário pendente", bloqueado, detalhe: error ? error.message : `${data?.length ?? 0} linha(s)` });
  }

  {
    const { data, error } = await anon.from("admins").select("id, email");
    const bloqueado = !!error || (data?.length ?? 0) === 0;
    r.push({ teste: "4. ler tabela admins", bloqueado, detalhe: error ? `${error.code}: ${error.message}` : `${data?.length ?? 0} linha(s)` });
  }

  {
    const arquivo = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "image/webp" });
    const { error } = await anon.storage.from("midia").upload(`posts/rls-${sufixo}/full.webp`, arquivo);
    r.push({ teste: "extra: upload anônimo no bucket", bloqueado: !!error, detalhe: error ? error.message : "SUBIU!" });
  }

  return r;
}

async function main() {
  let fixtures: { postId?: string; comentarioId?: string; userId?: string } = {};
  let resultados: Resultado[] = [];
  try {
    const f = await preparar();
    fixtures = f;
    resultados = await testar(f);
  } finally {
    await limpar(fixtures);
  }

  console.log("\nTeste de RLS com a anon key\n");
  for (const r of resultados) {
    console.log(`${r.bloqueado ? "BLOQUEADO ✔" : "VAZOU     ✘"}  ${r.teste.padEnd(34)} → ${r.detalhe}`);
  }
  const falhas = resultados.filter((r) => !r.bloqueado);
  console.log(falhas.length === 0 ? "\nTodas as tentativas falharam, como deveriam.\n" : `\n${falhas.length} tentativa(s) passaram. RLS com furo!\n`);
  process.exit(falhas.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
