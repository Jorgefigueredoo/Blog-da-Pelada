"use server";

import { z } from "zod";
import { env } from "@/lib/env";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoLogin =
  | { status: "ocioso" }
  | { status: "enviado"; email: string }
  | { status: "erro"; mensagem: string };

const esquema = z.object({
  email: z.email("Isso aí não parece um e-mail, craque."),
});

export async function enviarLink(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const r = esquema.safeParse({ email: String(form.get("email") ?? "").trim().toLowerCase() });
  if (!r.success) return { status: "erro", mensagem: r.error.issues[0].message };

  const supabase = await clienteServidor();
  // shouldCreateUser: quem não é admin até loga no Auth, mas o middleware barra /admin.
  const { error } = await supabase.auth.signInWithOtp({
    email: r.data.email,
    options: { shouldCreateUser: true, emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });

  if (error) {
    console.error("[login] signInWithOtp:", error.status, error.message);
    if (error.status === 429) {
      return { status: "erro", mensagem: "Muito pedido de link em pouco tempo. Espera uns minutos e tenta de novo." };
    }
    return { status: "erro", mensagem: "Não consegui mandar o link agora. Tenta de novo daqui a pouco." };
  }

  return { status: "enviado", email: r.data.email };
}
