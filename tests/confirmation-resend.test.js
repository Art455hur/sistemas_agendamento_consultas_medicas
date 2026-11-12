import test from "node:test";
import assert from "node:assert/strict";
import { canResendConfirmation, createConfirmationResender, resendFeedback, RESEND_INTERVAL_MS } from "../src/features/auth/confirmation-resend.js";
import { registrationFeedback } from "../src/features/auth/registration-feedback.js";

test("oferece reenvio apenas para cadastro sem sessão ou e-mail já cadastrado", () => {
  assert.equal(canResendConfirmation({ data: { user: {}, session: null } }), true);
  assert.equal(canResendConfirmation({ error: { code: "user_already_exists" } }), true);
  assert.equal(canResendConfirmation({ data: { user: {}, session: {} } }), false);
  assert.equal(canResendConfirmation({ error: { code: "weak_password" } }), false);
  assert.equal(canResendConfirmation(), false);
});

test("aguarda após cadastro, bloqueia cliques simultâneos e permite nova tentativa ao terminar intervalo", async () => {
  let time = 0;
  let calls = 0;
  let finish;
  const sender = createConfirmationResender({ now: () => time, resend: (options) => {
    calls++;
    assert.deepEqual(options, { type: "signup", email: "paciente@example.test", options: { emailRedirectTo: "https://example.test/auth/callback" } });
    return new Promise((resolve) => { finish = resolve; });
  } });
  const send = () => sender.send("paciente@example.test", "https://example.test/auth/callback");
  assert.equal((await send()).blocked, true);
  assert.equal(calls, 0);
  time = RESEND_INTERVAL_MS;
  const first = send();
  time += RESEND_INTERVAL_MS; // Mesmo uma requisição demorada não permite outra em paralelo.
  assert.equal((await send()).blocked, true);
  assert.equal(calls, 1);
  finish({ error: null });
  assert.equal((await first).type, "success");
  const second = send();
  assert.equal(calls, 2);
  finish({ error: null });
  await second;
});

test("limite de e-mails não afirma entrega nem promete liberação após um minuto", async () => {
  let calls = 0;
  const sender = createConfirmationResender({ now: () => 0, initialDelay: 0, resend: async () => {
    calls++;
    return { error: { status: 429, code: "over_email_send_rate_limit" } };
  } });
  const result = await sender.send("paciente@example.test", "https://example.test");
  assert.equal(result.type, "info");
  assert.match(result.message, /limite de envio/);
  assert.equal((await sender.send("paciente@example.test", "https://example.test")).blocked, true);
  assert.equal(calls, 1);
  assert.match(registrationFeedback({ error: { code: "over_email_send_rate_limit" } }).message, /limite de envio/);
});

test("falha de rede e rejeição do serviço não viram sucesso e liberam nova tentativa após intervalo", async () => {
  let time = 0;
  const sender = createConfirmationResender({ now: () => time, initialDelay: 0, resend: async () => { throw new Error("offline"); } });
  assert.equal((await sender.send("test@example.test", "https://example.test")).type, "error");
  time = RESEND_INTERVAL_MS;
  assert.equal((await sender.send("test@example.test", "https://example.test")).blocked, undefined);
  assert.equal(resendFeedback({ status: 500 }).type, "error");
  assert.match(resendFeedback({ status: 429 }).message, /Muitas tentativas/);
});
