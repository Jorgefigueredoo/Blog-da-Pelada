import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Protege /admin/*:
 *   sem sessão               → /login
 *   com sessão, fora de admins → página 403 ("você não é admin aqui, parça")
 * Também renova o token da sessão (cookies) a cada request do admin.
 * Roda só nas rotas do matcher: as páginas públicas não pagam esse custo.
 */
export async function middleware(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista) {
        for (const { name, value } of lista) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
      },
    },
  });

  // getUser() valida o token no servidor de auth (getSession() só leria o cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;

  if (caminho === "/login") {
    if (user) return redirecionar(request, resposta, "/admin");
    return resposta;
  }

  if (!user) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set("proximo", caminho);
    return redirecionar(request, resposta, destino);
  }

  const { data: ehAdmin, error } = await supabase.rpc("is_admin");
  if (error) console.error("[middleware] is_admin falhou:", error.message);

  if (!ehAdmin) {
    const proibido = NextResponse.rewrite(new URL("/nao-autorizado", request.url), { status: 403 });
    copiarCookies(resposta, proibido);
    return proibido;
  }

  return resposta;
}

function redirecionar(request: NextRequest, origem: NextResponse, destino: string | URL) {
  const r = NextResponse.redirect(typeof destino === "string" ? new URL(destino, request.url) : destino);
  copiarCookies(origem, r);
  return r;
}

function copiarCookies(de: NextResponse, para: NextResponse) {
  for (const c of de.cookies.getAll()) para.cookies.set(c);
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
