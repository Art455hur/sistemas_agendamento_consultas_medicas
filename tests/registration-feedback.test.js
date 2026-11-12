import test from "node:test";
import assert from "node:assert/strict";
import { registrationFeedback, registrationConnectionFeedback } from "../src/features/auth/registration-feedback.js";

test("cadastro aguardando e-mail é sucesso, mesmo sem sessão", () => {
  const result = registrationFeedback({ data: { user: { id: "test-user" }, session: null }, error: null });
  assert.equal(result.type, "success");
  assert.equal(result.complete, true);
  assert.match(result.message, /link de confirmação/);
});

test("cadastro com sessão não pede uma confirmação adicional", () => {
  const result = registrationFeedback({ data: { user: { id: "test-user" }, session: {} } });
  assert.equal(result.type, "success");
  assert.match(result.message, /acessar sua conta/);
});

test("limite de envio e conta existente orientam confirmar ou entrar", () => {
  for (const error of [{ status: 429 }, { code: "over_email_send_rate_limit" }, { code: "user_already_exists" }]) {
    const result = registrationFeedback({ error });
    assert.equal(result.type, "info");
    assert.equal(result.complete, false);
    assert.match(result.message, /login/);
  }
});

test("falha de servidor ou conexão não afirma que a conta não foi criada", () => {
  for (const result of [registrationFeedback({ error: { status: 500 } }), registrationFeedback(), registrationConnectionFeedback()]) {
    assert.equal(result.type, "info");
    assert.equal(result.complete, false);
    assert.match(result.message, /confirmar o resultado/);
    assert.match(result.message, /Se recebeu o e-mail/);
  }
});

test("rejeição de dados continua sendo erro e não vira falso sucesso", () => {
  const result = registrationFeedback({ error: { status: 422, code: "weak_password" } });
  assert.equal(result.type, "error");
  assert.equal(result.complete, false);
  assert.match(result.message, /senha mais forte/);
});
