import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { registerPatient } from "../src/features/auth/register-patient.js";
import { loadPatientProfile } from "../src/features/profile/services/patient-profile.js";
import { registrationFeedback } from "../src/features/auth/registration-feedback.js";

// Dados sintéticos. O transporte Auth é simulado; os triggers, constraints,
// políticas RLS e consultas de perfil rodam em um Postgres isolado (PGlite).
const form = {
  name: " Paciente Integração ", email: " PACIENTE@EXAMPLE.TEST ",
  phone: "(11) 99999-9999", cpf: "012.345.678-90", birthDate: "2000-02-29",
  password: "senha-exclusiva-de-teste", confirmPassword: "senha-exclusiva-de-teste",
  role: "admin", hospital_id: "untrusted", id: "untrusted",
};

test("cadastro integrado ao perfil persiste os dados preenchidos e mantém isolamento", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  }
  const patient = "00000000-0000-4000-8000-000000000081";
  const second = "00000000-0000-4000-8000-000000000082";
  let signupPayload;
  const client = {
    auth: {
      async signUp(payload) {
        signupPayload = payload;
        try {
          await db.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3)", [patient, payload.email, payload.options.data]);
          return { data: { user: { id: patient, email: payload.email }, session: null }, error: null };
        } catch (error) { return { data: null, error }; }
      },
      async getUser() { return { data: { user: { id: patient, email: "paciente@example.test" } } }; },
    },
    from(table) {
      assert.equal(table, "profiles");
      let id;
      const query = {
        select() { return query; },
        eq(field, value) { assert.equal(field, "id"); id = value; return query; },
        async single() {
          const { rows } = await db.query("select full_name,phone,cpf,birth_date::text from public.profiles where id=$1", [id]);
          return { data: rows[0] || null, error: null };
        },
      };
      return query;
    },
  };
  const actor = async (id) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || ""]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  };

  await t.test("formulário envia telefone, CPF e data e o trigger preenche o perfil", async () => {
    const result = await registerPatient(client, form, "https://example.test/auth/callback");
    assert.equal(result.error, null);
    assert.equal(registrationFeedback(result).complete, true);
    assert.deepEqual(signupPayload, {
      email: "paciente@example.test", password: form.password,
      options: { data: { name: "Paciente Integração", phone: "11999999999", cpf: "01234567890", birth_date: "2000-02-29" }, emailRedirectTo: "https://example.test/auth/callback" },
    });
    const { rows } = await db.query("select raw_user_meta_data from auth.users where id=$1", [patient]);
    assert.equal(JSON.stringify(rows).includes(form.password), false);
    await actor(patient);
    assert.deepEqual(await loadPatientProfile(client), {
      name: "Paciente Integração", email: "paciente@example.test", phone: "11999999999", cpf: "01234567890", birthDate: "2000-02-29",
    });
  });

  await t.test("nova sessão lê o mesmo perfil e outro paciente não consegue lê-lo", async () => {
    await actor(null);
    await assert.rejects(db.query("select id from public.profiles where id=$1", [patient]), (error) => error.code === "42501");
    await actor(patient);
    assert.equal((await loadPatientProfile(client)).cpf, "01234567890");
    await db.exec("reset role");
    await db.query("insert into auth.users(id,email) values ($1,'outro@example.test')", [second]);
    await actor(second);
    assert.equal((await db.query("select id from public.profiles where id=$1", [patient])).rows.length, 0);
    assert.equal((await db.query("select id from public.profiles where id=$1", [second])).rows.length, 1);
  });

  await t.test("CPF duplicado reverte o cadastro e não produz mensagem de sucesso", async () => {
    await db.exec("reset role");
    const duplicate = { auth: { async signUp(payload) {
      try {
        await db.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3)", ["00000000-0000-4000-8000-000000000083", payload.email, payload.options.data]);
        return { data: { user: {} }, error: null };
      } catch (error) { return { data: null, error }; }
    } } };
    const result = await registerPatient(duplicate, { ...form, email: "duplicado@example.test" }, "https://example.test/auth/callback");
    assert.equal(result.error.code, "23505");
    assert.equal(registrationFeedback(result).complete, false);
    assert.equal((await db.query("select id from auth.users where email='duplicado@example.test'")).rows.length, 0);
  });
});
