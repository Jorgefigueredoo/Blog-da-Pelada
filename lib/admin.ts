import "server-only";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Toda Server Action do admin começa aqui. O middleware já barra a página,
 * mas a action é um endpoint POST por si só: confere de novo.
 * (E mesmo que isso falhasse, a RLS recusaria a escrita.)
 */
export async function exigirAdmin() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ehAdmin, error } = await supabase.rpc("is_admin");
  if (error) console.error("[exigirAdmin] is_admin:", error.message);
  if (!ehAdmin) return null;

  return { supabase, user };
}
