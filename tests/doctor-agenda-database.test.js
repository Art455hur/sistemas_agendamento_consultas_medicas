import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("agenda médica lista apenas consultas do médico ativo na data clínica", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
  `);
  const migrations = new URL("../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(migrations)).sort()) {
    if (name.endsWith(".sql")) await db.exec(await readFile(new URL(name, migrations), "utf8"));
  }

  const fixtureId = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
  const [doctor, otherDoctor, inactiveDoctor, unlinkedDoctor, patient, receptionist, admin] =
    Array.from({ length: 7 }, (_, i) => fixtureId(i + 1));
  const people = [
    [doctor, "doctor", true], [otherDoctor, "doctor", true], [inactiveDoctor, "doctor", false],
    [unlinkedDoctor, "doctor", null], [patient, "patient", null], [receptionist, "receptionist", true],
    [admin, "admin", true],
  ];
  for (const [id, role, active] of people) {
    await db.query("insert into auth.users(id) values ($1)", [id]);
    await db.query("update public.profiles set role = $2, full_name = $3 where id = $1",
      [id, role, role === "patient" ? "Paciente de Teste" : "Funcionário"]);
    if (active !== null) {
      await db.query("insert into public.hospital_staff(profile_id, active) values ($1, $2)", [id, active]);
    }
  }
  const seed = [
    [11, doctor, "2026-11-25T02:59:00Z", "scheduled"],
    [12, doctor, "2026-11-25T03:00:00Z", "completed"],
    [13, doctor, "2026-11-25T16:30:00Z", "scheduled"],
    [14, doctor, "2026-11-26T02:59:00Z", "cancelled"],
    [15, doctor, "2026-11-26T03:00:00Z", "scheduled"],
    [16, otherDoctor, "2026-11-25T17:00:00Z", "scheduled"],
  ];
  for (const [number, clinician, at, status] of seed) {
    await db.query(`
      insert into public.appointments(id, patient_id, doctor_id, specialty, scheduled_at, status, reason)
      values ($1, $2, $3, 'Clínica Geral', $4, $5, 'Não retornar neste painel')
    `, [fixtureId(number), patient, clinician, at, status]);
  }
  async function as(id, role = id ? "authenticated" : "anon") {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id || ""]);
    await db.exec(`set role ${role}`);
  }
  const list = (day) => db.query("select * from public.doctor_list_appointments($1)", [day]);

  await t.test("respeita a virada do dia em São Paulo, a ordem e o status gravado", async () => {
    await as(doctor);
    const { rows } = await list("2026-11-25");
    assert.deepEqual(rows.map(({ id, status }) => [id, status]), [
      [fixtureId(12), "completed"], [fixtureId(13), "scheduled"], [fixtureId(14), "cancelled"],
    ]);
    assert.deepEqual(Object.keys(rows[0]), ["id", "patient_name", "specialty", "scheduled_at", "status"]);
    assert.equal(rows[0].patient_name, "Paciente de Teste");
    assert.deepEqual((await list("2026-11-26")).rows.map(({ id }) => id), [fixtureId(15)]);
    assert.deepEqual((await list("2026-11-27")).rows, []);
    await as(otherDoctor);
    assert.deepEqual((await list("2026-11-25")).rows.map(({ id }) => id), [fixtureId(16)]);
  });

  await t.test("bloqueia usuários sem o papel e o vínculo e não abre leitura direta do paciente", async () => {
    for (const id of [null, patient, receptionist, admin, inactiveDoctor, unlinkedDoctor]) {
      await as(id);
      await assert.rejects(list("2026-11-25"), { code: "42501" });
    }
    await as(null, "authenticated");
    await assert.rejects(list("2026-11-25"), { code: "42501" });
    await as(doctor);
    const { rows } = await db.query("select id from public.profiles where id = $1", [patient]);
    assert.deepEqual(rows, []);
    for (const day of [null, "infinity", "10000-01-01"]) {
      await assert.rejects(list(day), { code: "22023" });
    }
    await db.exec("reset role");
    await db.query("update public.hospital_staff set active = false where profile_id = $1", [doctor]);
    await as(doctor);
    await assert.rejects(list("2026-11-25"), { code: "42501" });
  });
});
