import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { isValidCpf } from "../src/lib/cpf.js";

test("CPF validado no banco sem alterar cadastros antigos", async (t) => {
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
  const names = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  const migration = names.find((name) => name.endsWith("_validar_cpf_perfis.sql"));
  assert.ok(migration);
  for (const name of names.filter((name) => name !== migration)) {
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  }
  const legacy = "00000000-0000-4000-8000-000000000021";
  const patient = "00000000-0000-4000-8000-000000000022";
  await db.query("insert into auth.users(id, raw_user_meta_data) values ($1,$2),($3,'{}')", [
    legacy, { name: "Legado Teste", cpf: "12345678901" }, patient,
  ]);
  const original = (await db.query("select * from public.profiles where id=$1", [legacy])).rows[0];
  await db.exec(await readFile(new URL(migration, directory), "utf8"));
  assert.deepEqual((await db.query("select * from public.profiles where id=$1", [legacy])).rows[0], original);

  const actor = async (id) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || ""]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  };
  const updateCpf = (value) => db.query("update public.profiles set cpf=$1 where id=$2", [value, patient]);
  const rejectsCpf = (operation) => assert.rejects(operation, (error) => error.code === "23514");

  await t.test("matemática SQL concorda com o JavaScript para entradas numéricas", async () => {
    const values = ["12345678909", "01234567890", "12345678901", "12345678919", "12345678900", "123", "123456789090", "abc12345678", ""];
    for (let digit = 0; digit <= 9; digit += 1) values.push(String(digit).repeat(11));
    for (const value of values) {
      const { rows } = await db.query("select private.is_valid_cpf($1) as valid", [value]);
      assert.equal(rows[0].valid, isValidCpf(value), value);
    }
  });

  await t.test("paciente não grava CPF inválido mesmo sem passar pelo formulário", async () => {
    await actor(patient);
    for (const value of ["12345678901", "12345678919", "12345678900", "11111111111"]) {
      await rejectsCpf(updateCpf(value));
    }
    assert.equal((await db.query("select cpf from public.profiles where id=$1", [patient])).rows[0].cpf, null);
    await updateCpf("01234567890");
    assert.equal((await db.query("select cpf from public.profiles where id=$1", [patient])).rows[0].cpf, "01234567890");
    await rejectsCpf(updateCpf("11111111111"));
    assert.equal((await db.query("select cpf from public.profiles where id=$1", [patient])).rows[0].cpf, "01234567890");
  });

  await t.test("legado continua editável sem liberar novo CPF inválido", async () => {
    await actor(legacy);
    await db.query("update public.profiles set full_name='Nome atualizado',cpf=cpf where id=$1", [legacy]);
    assert.equal((await db.query("select cpf from public.profiles where id=$1", [legacy])).rows[0].cpf, "12345678901");
    await rejectsCpf(db.query("update public.profiles set cpf='11111111111' where id=$1", [legacy]));
    await db.query("update public.profiles set cpf='12345678909' where id=$1", [legacy]);
    await rejectsCpf(db.query("update public.profiles set cpf='12345678901' where id=$1", [legacy]));
  });

  await t.test("unicidade e isolamento de perfis continuam valendo", async () => {
    await actor(patient);
    await assert.rejects(updateCpf("12345678909"), (error) => error.code === "23505");
    assert.equal((await db.query("update public.profiles set cpf='11111111111' where id=$1 returning id", [legacy])).rows.length, 0);
    await db.exec("reset role");
    assert.equal((await db.query("select cpf from public.profiles where id=$1", [legacy])).rows[0].cpf, "12345678909");
  });

  await t.test("cadastro Auth com metadados inválidos é revertido pelo trigger", async () => {
    const id = "00000000-0000-4000-8000-000000000023";
    await rejectsCpf(db.query("insert into auth.users(id,raw_user_meta_data) values ($1,$2)", [id, { cpf: "111.111.111-11" }]));
    assert.equal((await db.query("select count(*)::int as n from auth.users where id=$1", [id])).rows[0].n, 0);
    await db.query("insert into auth.users(id,raw_user_meta_data) values ($1,$2)", [id, { cpf: "000.000.001-91" }]);
    assert.equal((await db.query("select cpf from public.profiles where id=$1", [id])).rows[0].cpf, "00000000191");
  });

  await t.test("CPF nulo continua opcional e funções não expõem privilégios", async () => {
    await actor(patient);
    await updateCpf(null);
    await assert.rejects(db.query("select private.validate_profile_cpf()"), (error) => error.code === "42501");
    await actor(null);
    await assert.rejects(db.query("select private.is_valid_cpf('12345678909')"), (error) => error.code === "42501");
  });
});
