import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente 1 — anônimo, sem sessão. Só lê o que a RLS libera para `anon`.
 * Não toca em cookies, então as páginas públicas continuam estáticas (ISR).
 */
export function clientePublico() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
