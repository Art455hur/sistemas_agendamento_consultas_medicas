import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const isPasswordReset = next === "/redefinir-senha";
  const destination = isPasswordReset ? next : "/login?cadastro=sucesso";
  // O código só pode ser trocado no navegador que pediu o e-mail (PKCE).
  // Aberto em outro navegador, a conta pode já estar confirmada pelo Supabase.
  const failure = isPasswordReset ? "/login?erro=recuperacao" : "/login?erro=confirmacao";
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" || !code || !projectUrl || !key) {
    return NextResponse.redirect(new URL(failure, url.origin));
  }

  const response = NextResponse.redirect(new URL(destination, url.origin));
  const supabase = createServerClient(projectUrl, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(failure, url.origin));
  }
  return response;
}
