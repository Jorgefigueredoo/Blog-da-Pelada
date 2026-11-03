import { NextResponse, type NextRequest } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Destino do link mágico.
 *  - ?token_hash=…&type=email  → template de e-mail do projeto (funciona em qualquer navegador)
 *  - ?code=…                   → fluxo PKCE padrão (só no mesmo navegador que pediu o link)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type");
  const codigo = url.searchParams.get("code");

  const supabase = await clienteServidor();
  let erro: string | null = "link ausente";

  if (tokenHash && tipo === "email") {
    const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash });
    erro = error?.message ?? null;
  } else if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    erro = error?.message ?? null;
  }

  if (erro) {
    console.error("[auth/callback] falhou:", erro);
    return NextResponse.redirect(new URL("/login?erro=link", url.origin));
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
