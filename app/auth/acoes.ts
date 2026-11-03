"use server";

import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";

export async function sair() {
  const supabase = await clienteServidor();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("[sair]", error.message);
  redirect("/");
}
