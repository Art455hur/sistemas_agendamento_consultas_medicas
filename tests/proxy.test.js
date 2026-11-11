import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { proxy } from "../src/proxy.js";

test("Auth habilitado sem cookie de sessão", async (t) => {
  const names = ["NEXT_PUBLIC_ENABLE_SUPABASE_AUTH", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  t.after(() => names.forEach((name, index) => {
    if (previous[index] === undefined) delete process.env[name];
    else process.env[name] = previous[index];
  }));
  process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH = "true";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";

  await t.test("login e cadastro abrem quando getClaims retorna data nulo", async () => {
    for (const path of ["/login", "/cadastro"]) {
      const response = await proxy(new NextRequest(`http://localhost:3000${path}`));
      assert.equal(response.headers.get("x-middleware-next"), "1");
      assert.equal(response.headers.get("location"), null);
    }
  });

  await t.test("páginas privadas redirecionam para o login preservando o destino", async () => {
    for (const path of ["/dashboard", "/agendar?especialidade=Cardiologia", "/administracao"]) {
      const response = await proxy(new NextRequest(`http://localhost:3000${path}`));
      assert.equal(response.status, 307);
      const location = new URL(response.headers.get("location"));
      assert.equal(location.pathname, "/login");
      assert.equal(location.searchParams.get("redirect"), path);
    }
  });
});
