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
  const record = (number, outcome) => db.query(
    "select public.doctor_record_appointment_outcome($1, $2)", [fixtureId(number), outcome],
  );

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

  await t.test("registra atendimento ou falta uma vez e atualiza as agendas", async () => {
    await db.exec("reset role");
    for (const [number, clinician, at, status] of [
      [21, doctor, "now() - interval '2 hours'", "scheduled"],
      [22, doctor, "now() - interval '3 hours'", "scheduled"],
      [23, doctor, "now() + interval '2 hours'", "scheduled"],
      [24, otherDoctor, "now() - interval '4 hours'", "scheduled"],
      [25, doctor, "now() - interval '5 hours'", "cancelled"],
    ]) {
      await db.query(`
        insert into public.appointments(id, patient_id, doctor_id, specialty, scheduled_at, status)
        values ($1, $2, $3, 'Clínica Geral', ${at}, $4)
      `, [fixtureId(number), patient, clinician, status]);
    }
    const { rows: dates } = await db.query(`
      select id, (scheduled_at at time zone 'America/Sao_Paulo')::date::text as day
      from public.appointments where id in ($1, $2)
    `, [fixtureId(21), fixtureId(22)]);
    await as(doctor);
    await assert.rejects(record(21, "cancelled"), { code: "22023" });
    await assert.rejects(record(21, null), { code: "22023" });
    await assert.rejects(db.query("update public.appointments set status = 'completed' where id = $1", [fixtureId(21)]),
      { code: "42501" });
    for (const number of [23, 24, 25, 99]) await assert.rejects(record(number, "completed"), { code: "P0002" });
    await record(21, "completed");
    await record(22, "no_show");
    await assert.rejects(record(21, "no_show"), { code: "P0002" });
    for (const { id, day } of dates) {
      const expected = id === fixtureId(21) ? "completed" : "no_show";
      await as(doctor);
      assert.equal((await list(day)).rows.find((row) => row.id === id)?.status, expected);
      await as(receptionist);
      const clinicAgenda = await db.query("select * from public.receptionist_list_appointments($1)", [day]);
      assert.equal(clinicAgenda.rows.find((row) => row.id === id)?.status, expected);
      await as(patient);
      const own = await db.query("select status from public.appointments where id = $1", [id]);
      assert.equal(own.rows[0]?.status, expected);
    }
  });

  await t.test("registro clínico é privado, guarda versões e não sobrescreve edição concorrente", async () => {
    const id = fixtureId(21);
    const get = (appointmentId = id) => db.query("select public.doctor_get_clinical_note($1) as note", [appointmentId]);
    const save = (revision, evolution = "Evolução fictícia", appointmentId = id) => db.query(
      "select public.doctor_save_clinical_note($1, $2, $3, $4, $5) as revision",
      [appointmentId, revision, evolution, null, "Conduta fictícia"],
    );
    await as(doctor);
    const initial = (await get()).rows[0].note;
    assert.equal(initial.revision, 0);
    assert.equal(initial.patient_name, "Paciente de Teste");
    assert.equal(initial.evolution, null);
    await assert.rejects(save(0, " \n\t "), { code: "22023" });
    await assert.rejects(save(0, "a".repeat(6001)), { code: "22023" });
    assert.equal((await save(0)).rows[0].revision, 1);
    assert.equal((await save(1, "Evolução revisada")).rows[0].revision, 2);
    await assert.rejects(save(1), { code: "40001" });
    const latest = (await get()).rows[0].note;
    assert.equal(latest.revision, 2);
    assert.equal(latest.evolution, "Evolução revisada");
    assert.equal(latest.plan, "Conduta fictícia");
    assert.equal(latest.diagnosis, null);
    for (const number of [22, 23, 24, 25, 99]) {
      await assert.rejects(get(fixtureId(number)), { code: "P0002" });
      await assert.rejects(save(0, "Anotação fictícia", fixtureId(number)), { code: "P0002" });
    }
    await assert.rejects(db.query("select * from private.doctor_clinical_note_versions"), { code: "42501" });
    for (const actor of [null, patient, receptionist, admin, inactiveDoctor, unlinkedDoctor]) {
      await as(actor);
      await assert.rejects(get(), { code: "42501" });
      await assert.rejects(save(2), { code: "42501" });
    }
    await as(otherDoctor);
    await assert.rejects(get(), { code: "P0002" });
    await assert.rejects(save(2), { code: "P0002" });
    await db.exec("reset role");
    const { rows } = await db.query(
      "select revision, evolution, author_id from private.doctor_clinical_note_versions where appointment_id = $1 order by revision", [id],
    );
    assert.deepEqual(rows, [
      { revision: 1, evolution: "Evolução fictícia", author_id: doctor },
      { revision: 2, evolution: "Evolução revisada", author_id: doctor },
    ]);
  });

  await t.test("histórico e exames ficam restritos ao médico e paciente do atendimento", async () => {
    await db.exec("reset role");
    const patientB = fixtureId(88);
    await db.query("insert into auth.users(id) values ($1)", [patientB]);
    for (const [n, d, p, year] of [[81, doctor, patient, 2010], [82, doctor, patient, 2012],
        [83, otherDoctor, patient, 2011], [84, doctor, patientB, 2011]]) {
      await db.query("insert into public.appointments(id,patient_id,doctor_id,specialty,scheduled_at,status) values ($1,$2,$3,'Teste',$4,'completed')",
        [fixtureId(n), p, d, year+"-01-01T13:00:00Z"]);
    }
    const upload = (n, slot=1, hex="255044462d31") => db.query(
      "insert into public.doctor_exam_files(appointment_id,slot,label,mime,content) values ($1,$2,'Hemograma','application/pdf',decode($3,'hex')) returning id",
      [fixtureId(n),slot,hex]);
    const history = n => db.query("select * from public.doctor_visit_history($1,0)", [fixtureId(n)]);
    await as(doctor);
    const file = (await upload(81)).rows[0].id;
    const read = () => db.query("select encode(content,'hex') as hex from public.doctor_exam_files where id=$1",[file]);
    assert.equal((await read()).rows[0].hex, "255044462d31");
    await assert.rejects(upload(81,2,"abcd"), {code:"23514"});
    await assert.rejects(upload(81,6), {code:"23514"});
    await assert.rejects(upload(83), {code:"42501"});
    await assert.rejects(upload(25), {code:"42501"});
    assert.deepEqual((await history(81)).rows, []);
    await db.query("select public.doctor_save_clinical_note($1,0,'Avaliação inicial',null,null)",[fixtureId(81)]);
    const past = (await history(82)).rows;
    assert.deepEqual(past.map(v=>v.id), [fixtureId(81)]);
    assert.equal(past[0].note.evolution, "Avaliação inicial");
    assert.deepEqual(past[0].exams, [{id:file,label:"Hemograma"}]);
    for (const actor of [otherDoctor,patient,receptionist,admin,inactiveDoctor]) {
      await as(actor);
      assert.deepEqual((await read()).rows, []);
      assert.deepEqual((await history(82)).rows, []);
      await assert.rejects(upload(81,2), {code:"42501"});
    }
    await as(null);
    await assert.rejects(read(), {code:"42501"});
  });

  await t.test("bloqueia usuários sem o papel e o vínculo e não abre leitura direta do paciente", async () => {
    for (const id of [null, patient, receptionist, admin, inactiveDoctor, unlinkedDoctor]) {
      await as(id);
      await assert.rejects(list("2026-11-25"), { code: "42501" });
      await assert.rejects(record(24, "completed"), { code: "42501" });
    }
    await as(null, "authenticated");
    await assert.rejects(list("2026-11-25"), { code: "42501" });
    await assert.rejects(record(24, "completed"), { code: "42501" });
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
