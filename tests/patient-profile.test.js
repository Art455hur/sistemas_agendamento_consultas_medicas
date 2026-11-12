import test from "node:test";
import assert from "node:assert/strict";
import { loadPatientProfile, savePatientProfile } from "../src/features/profile/services/patient-profile.js";

function clientFor({ user = { id: "session-user", email: "patient@example.test" }, row = {}, error = null } = {}) {
  const calls = [];
  const query = {
    select() { return query; },
    eq(field, value) { calls.push([field, value]); return query; },
    update(value) { calls.push(value); return query; },
    async single() { return { data: row, error }; },
  };
  return { calls, auth: { async getUser() { return { data: { user } }; } }, from(table) { assert.equal(table, "profiles"); return query; } };
}

const profile = { id: "untrusted-id", name: " Paciente ", email: "other@example.test", phone: "(11) 99999-9999", cpf: "123.456.789-09", birthDate: "1995-05-20", role: "admin" };

test("perfil deriva conta e email da sessão e envia apenas campos permitidos", async () => {
  const client = clientFor({ row: { full_name: "Paciente", phone: "11999999999", cpf: "12345678909", birth_date: "1995-05-20" } });
  const result = await savePatientProfile(client, profile);
  assert.equal(result.email, "patient@example.test");
  assert.deepEqual(client.calls, [{ full_name: "Paciente", phone: "11999999999", cpf: "12345678909", birth_date: "1995-05-20" }, ["id", "session-user"]]);
});

test("sessão ausente e atualização sem linha não produzem sucesso", async () => {
  await assert.rejects(loadPatientProfile(clientFor({ user: null })), /sessão expirou/);
  await assert.rejects(savePatientProfile(clientFor({ row: null }), profile), /Não foi possível salvar/);
});

test("CPF duplicado tem mensagem útil e validações não enviam atualização", async () => {
  await assert.rejects(savePatientProfile(clientFor({ error: { code: "23505" } }), profile), /CPF já está cadastrado/);
  for (const changes of [{ name: " " }, { phone: "123" }, { cpf: "123" }, { cpf: "123.456.789-01" }, { cpf: "111.111.111-11" }, { birthDate: "2999-01-01" }, { birthDate: "2025-02-30" }]) {
    const client = clientFor();
    await assert.rejects(savePatientProfile(client, { ...profile, ...changes }));
    assert.equal(client.calls.length, 0);
  }
});
