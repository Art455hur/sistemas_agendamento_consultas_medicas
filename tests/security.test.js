import test from "node:test";
import assert from "node:assert/strict";
import { safeRedirect } from "../src/shared/security/redirect.js";
import config from "../next.config.mjs";

test("retorno preserva rotas internas, parâmetros e fragmentos", () => {
  for (const path of ["/dashboard", "/agendar?especialidade=Cl%C3%ADnica", "/agendamentos?aba=cancelled#consulta-123", "/administracao/horarios"]) assert.equal(safeRedirect(path), path);
});

test("retorno rejeita protocolos, domínios, escapes e controles", () => {
  for (const path of [null, undefined, 1, "", "https://evil.test", "javascript:alert(1)", "//evil.test", "/\\evil.test", "/%5cevil.test", "/%2f%2fevil.test", "/%255cevil.test", "/\tevil.test", "/\nevil.test", "/\u0000evil.test", " /dashboard"]) assert.equal(safeRedirect(path), null, String(path));
});

test("cabeçalhos bloqueiam enquadramento, sniffing e APIs desnecessárias", async () => {
  const rules = await config.headers();
  assert.equal(rules[0].source, "/:path*");
  const headers = Object.fromEntries(rules[0].headers.map(({key,value})=>[key,value]));
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "no-referrer");
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.equal(config.poweredByHeader, false);
});
