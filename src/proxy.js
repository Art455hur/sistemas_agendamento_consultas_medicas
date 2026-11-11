import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server.js";

const protectedPaths = [
  "/dashboard", "/agendar", "/agendamentos", "/perfil", "/confirmacao", "/administracao",
];

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
  const protectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (protectedPath && (authError || !claims?.sub)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("redirect", pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/agendar/:path*", "/agendamentos/:path*",
    "/perfil/:path*", "/confirmacao/:path*", "/administracao/:path*", "/login", "/cadastro",
  ],
};
