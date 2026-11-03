import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente 2 (lado servidor) — anon key + sessão do admin via cookies.
 * A escrita só passa se a RLS confirmar que o usuário está em `admins`.
 * Usar apenas em rotas do admin, Server Actions e no callback de login.
 */
export async function clienteServidor() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(lista) {
        try {
          for (const { name, value, options } of lista) cookieStore.set(name, value, options);
        } catch {
          // Chamado de um Server Component: não dá pra gravar cookie aqui.
          // O middleware já renova a sessão nas rotas /admin.
        }
      },
    },
  });
}
