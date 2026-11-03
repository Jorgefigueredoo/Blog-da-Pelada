"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente 2 (lado navegador) — anon key + sessão do admin.
 * Usado no editor para subir fotos direto pro Storage (a policy do bucket
 * exige is_admin()) sem fazer o arquivo passar pela função da Vercel.
 */
let cliente: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function clienteNavegador() {
  cliente ??= createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return cliente;
}
