import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server.js";
import { homeForRole } from "./features/auth/access-control.js";
import {
  canAccessPath, destinationFor, effectiveRole, isProtectedPath, loadAccess, requestedFromLoginParams,
} from "./features/auth/role-routing.js";

const guestPaths = ["/login", "/cadastro"];

// Os destinos já passaram por safeRedirect ou são rotas fixas do app.
function redirectWithCookies(request, response, destination, searchParams = {}) {
  const target = new URL(destination, request.nextUrl.origin);
  Object.entries(searchParams).forEach(([name, value]) => target.searchParams.set(name, value));
  const redirect = NextResponse.redirect(target);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" || !url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        Object.entries(headers ?? {}).forEach(([name, value]) =>
          response.headers.set(name, value)
        );
      },
    },
  });

  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const pathname = request.nextUrl.pathname;
  const protectedPath = isProtectedPath(pathname);
  const guestPath = guestPaths.includes(pathname);
  const userId = !authError && claims?.sub ? claims.sub : null;

  if (protectedPath && !userId) {
    return redirectWithCookies(request, response, "/login", {
      redirect: pathname + request.nextUrl.search,
    });
  }
  if (!userId || (!protectedPath && !guestPath)) return response;

  // Papel e vínculo vêm do banco, com a sessão do usuário e RLS.
  const access = await loadAccess(supabase, userId);
  // Falha temporária na leitura: a própria página repete a verificação e mostra o erro.
  if (access.error) return response;

  const role = effectiveRole(access);
  if (!role) {
    // Perfil desconhecido ou funcionário sem vínculo ativo: encerra a sessão
    // neste navegador para não alternar entre login e painel.
    await supabase.auth.signOut({ scope: "local" });
    if (guestPath && request.nextUrl.searchParams.get("erro") === "acesso") return response;
    return redirectWithCookies(request, response, "/login", { erro: "acesso" });
  }

  if (guestPath) {
    const requested = requestedFromLoginParams(request.nextUrl.searchParams);
    return redirectWithCookies(request, response, destinationFor(access, requested));
  }

  if (!canAccessPath(role, pathname)) {
    return redirectWithCookies(request, response, homeForRole(role));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/agendar/:path*", "/agendamentos/:path*",
    "/perfil/:path*", "/confirmacao/:path*", "/administracao/:path*", "/secretaria/:path*", "/medico/:path*", "/login", "/cadastro",
  ],
};
