import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Migrações reais em memória; auth.uid() é simulado, sem rede ou contas hospedadas.
test("gestão de pacientes integrada às permissões e consultas", async (t) => {
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
    grant execute on function auth.uid() to anon, authenticated;
  `);
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  }

  const ids = {
    patient: "00000000-0000-4000-8000-000000000201",
    otherPatient: "00000000-0000-4000-8000-000000000202",
    inactivePatient: "00000000-0000-4000-8000-000000000203",
    doctor: "00000000-0000-4000-8000-000000000204",
    admin: "00000000-0000-4000-8000-000000000205",
    inactiveAdmin: "00000000-0000-4000-8000-000000000206",
    unlinkedAdmin: "00000000-0000-4000-8000-000000000207",
    receptionist: "00000000-0000-4000-8000-000000000208",
  };
  const missingId = "00000000-0000-4000-8000-000000000299";
  for (const [name, id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)", [
      id, `${name}@example.test`, { name: `Teste ${name}` },
    ]);
  }
  await db.query("update public.profiles set cpf='01234567890' where id=$1", [ids.patient]);
  await db.query("update public.profiles set cpf='12345678909' where id=$1", [ids.otherPatient]);
  await db.query("update public.profiles set patient_active=false where id=$1", [ids.inactivePatient]);
  await db.query("update public.profiles set role='doctor', specialty='Clínica Geral' where id=$1", [ids.doctor]);
  await db.query("insert into public.specialties(name) values('Clínica Geral')");
  await db.query("update public.profiles set role='receptionist' where id=$1", [ids.receptionist]);
  for (const name of ["admin", "inactiveAdmin", "unlinkedAdmin"]) {
    await db.query("update public.profiles set role='admin' where id=$1", [ids[name]]);
  }
  for (const name of ["doctor", "receptionist", "admin", "inactiveAdmin"]) {
    await db.query("insert into public.hospital_staff(profile_id,active) values($1,$2)", [
      ids[name], name !== "inactiveAdmin",
    ]);
  }
  const { rows: [days] } = await db.query(`
    select ((now() at time zone 'America/Sao_Paulo')::date + 1)::text as tomorrow,
      ((now() at time zone 'America/Sao_Paulo')::date - 1)::text as yesterday,
      (current_date + 1)::text as future_birth_date
  `);
  const at = (day, time) => `${day}T${time}:00-03:00`;
  const appointments = {};
  for (const [name, patient, day, time, status] of [
    ["future", ids.patient, days.tomorrow, "08:00", "scheduled"],
    ["secondFuture", ids.patient, days.tomorrow, "09:00", "scheduled"],
    ["past", ids.patient, days.yesterday, "08:00", "scheduled"],
    ["completed", ids.patient, days.yesterday, "09:00", "completed"],
    ["cancelled", ids.patient, days.tomorrow, "10:30", "cancelled"],
    ["other", ids.otherPatient, days.tomorrow, "14:00", "scheduled"],
  ]) {
    const { rows: [appointment] } = await db.query(`
      insert into public.appointments(patient_id,doctor_id,doctor_name,specialty,scheduled_at,status,reason)
      values($1,$2,'Médico de teste','Clínica Geral',$3,$4,'Consulta fictícia') returning id
    `, [patient, ids.doctor, at(day, time), status]);
    appointments[name] = appointment.id;
  }

  const asUser = async (id, role = id ? "authenticated" : "anon") => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || ""]);
    await db.exec(`set role ${role}`);
  };
  const update = (id, fields = {}) => db.query(
    "select public.admin_update_patient($1,$2,$3,$4,$5::date)", [id,
      fields.name ?? "Paciente atualizado", fields.phone ?? "(11) 99999-9999",
      fields.cpf ?? "012.345.678-90", fields.birthDate ?? "2000-02-29",
    ],
  );
  const setActive = (id, active) => db.query("select public.admin_set_patient_active($1,$2)", [id, active]);
  const list = async () => (await db.query("select * from public.admin_list_patients()")).rows;
  const state = async () => {
    await db.exec("reset role");
    return {
      profiles: (await db.query("select * from public.profiles order by id")).rows,
      appointments: (await db.query("select * from public.appointments order by id")).rows,
      users: (await db.query("select * from auth.users order by id")).rows,
    };
  };
  // Cada cenário volta à mesma base. Savepoints recuperam a transação após erros esperados.
  const scenario = (name, run) => t.test(name, async () => {
    await db.exec("begin");
    try { await run(); } finally { await db.exec("rollback"); }
  });
  const rejects = async (operation, code) => {
    await db.exec("savepoint expected_error");
    try {
      await assert.rejects(operation, (error) => error.code === code);
    } finally {
      await db.exec("rollback to savepoint expected_error; release savepoint expected_error");
    }
  };

  for (const [label, id, role] of [
    ["visitante", null, "anon"],
    ["sessão sem identidade", null, "authenticated"],
    ["paciente", ids.patient, "authenticated"],
    ["médico", ids.doctor, "authenticated"],
    ["secretaria", ids.receptionist, "authenticated"],
    ["administrador inativo", ids.inactiveAdmin, "authenticated"],
    ["administrador sem vínculo", ids.unlinkedAdmin, "authenticated"],
  ]) {
    await scenario(`${label} não lista, edita, desativa ou reativa pacientes`, async () => {
      const before = await state();
      await asUser(id, role);
      await rejects(() => list(), "42501");
      await rejects(() => update(ids.patient), "42501");
      await rejects(() => setActive(ids.patient, false), "42501");
      await rejects(() => setActive(ids.inactivePatient, true), "42501");
      assert.deepEqual(await state(), before);
    });
  }

  await scenario("administrador lista somente pacientes, inclusive inativos e contagem do histórico", async () => {
    await asUser(ids.admin);
    const patients = await list();
    assert.deepEqual(patients.map((patient) => patient.id).sort(), [ids.patient, ids.otherPatient, ids.inactivePatient].sort());
    assert.equal(Number(patients.find((patient) => patient.id === ids.patient).appointment_count), 5);
    const inactive = patients.find((patient) => patient.id === ids.inactivePatient);
    assert.equal(inactive.active, false);
    assert.equal(Number(inactive.appointment_count), 0);
    assert.equal(inactive.email, "inactivePatient@example.test");
  });

  await scenario("edição normaliza os dados e o titular os lê em outra sessão sem alterar conta ou consultas", async () => {
    const before = await state();
    await asUser(ids.admin);
    await update(ids.patient, { name: "  Paciente atualizado  " });
    const after = await state();
    assert.deepEqual(after.users, before.users);
    assert.deepEqual(after.appointments, before.appointments);
    assert.deepEqual(after.profiles, before.profiles.map((profile) => profile.id === ids.patient ? {
      ...profile, full_name: "Paciente atualizado", phone: "11999999999", cpf: "01234567890",
      birth_date: new Date("2000-02-29T00:00:00.000Z"),
    } : profile));
    await asUser(null);
    await asUser(ids.patient);
    assert.deepEqual((await db.query("select full_name,phone,cpf,birth_date::text from public.profiles where id=$1", [ids.patient])).rows, [{
      full_name: "Paciente atualizado", phone: "11999999999", cpf: "01234567890", birth_date: "2000-02-29",
    }]);
    await asUser(ids.otherPatient);
    assert.equal((await db.query("select id from public.profiles where id=$1", [ids.patient])).rows.length, 0);
  });

  await scenario("dados inválidos e CPF duplicado não deixam edição parcial", async () => {
    const before = await state();
    await asUser(ids.admin);
    for (const fields of [
      { name: "  " }, { name: "Ab" }, { name: "A".repeat(121) },
      { phone: "123456789" }, { phone: "123456789012" },
      { cpf: "111.111.111-11" }, { cpf: "12345678901" },
      { birthDate: days.future_birth_date },
    ]) await rejects(() => update(ids.patient, fields), "22023");
    await rejects(() => update(ids.patient, { cpf: "123.456.789-09" }), "23505");
    assert.deepEqual(await state(), before);
  });

  await scenario("ID ausente, conta de funcionário e parâmetros nulos não alteram registros", async () => {
    const before = await state();
    await asUser(ids.admin);
    for (const id of [missingId, ids.doctor, ids.receptionist, ids.admin]) {
      await rejects(() => update(id), "P0002");
      await rejects(() => setActive(id, false), "P0002");
      await rejects(() => setActive(id, true), "P0002");
    }
    await rejects(() => update(null), "22023");
    await rejects(() => setActive(null, false), "22023");
    await rejects(() => setActive(ids.patient, null), "22023");
    assert.deepEqual(await state(), before);
  });

  await scenario("desativação cancela somente consultas futuras agendadas do titular e mantém histórico e conta", async () => {
    const before = await state();
    await asUser(ids.admin);
    await setActive(ids.patient, false);
    const patients = await list();
    assert.equal(patients.find((patient) => patient.id === ids.patient).active, false);
    assert.equal(Number(patients.find((patient) => patient.id === ids.patient).appointment_count), 5);
    const after = await state();
    assert.deepEqual(after.users, before.users);
    assert.deepEqual(after.profiles, before.profiles.map((profile) => profile.id === ids.patient
      ? { ...profile, patient_active: false } : profile));
    assert.deepEqual(after.appointments, before.appointments.map((appointment) =>
      [appointments.future, appointments.secondFuture].includes(appointment.id)
        ? { ...appointment, status: "cancelled" } : appointment));
    await asUser(ids.admin);
    await setActive(ids.patient, false);
    assert.deepEqual(await state(), after);
    await asUser(ids.otherPatient);
    const slots = (await db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, days.tomorrow])).rows;
    assert.ok(slots.some((slot) => new Date(slot.scheduled_at).toISOString() === new Date(at(days.tomorrow, "08:00")).toISOString()));
  });

  await scenario("paciente desativado perde acesso aos dados e às operações e não consegue se reativar", async () => {
    await asUser(ids.admin);
    await setActive(ids.patient, false);
    const before = await state();
    await asUser(ids.patient);
    assert.deepEqual((await db.query("select id from public.profiles")).rows, []);
    assert.deepEqual((await db.query("select id from public.appointments")).rows, []);
    assert.deepEqual((await db.query("update public.profiles set full_name='Tentativa' where id=$1 returning id", [ids.patient])).rows, []);
    await rejects(() => db.query("select * from public.booking_doctors()"), "42501");
    await rejects(() => db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, days.tomorrow]), "42501");
    await rejects(() => db.query("select * from public.create_patient_appointment($1,$2,null)", [ids.doctor, at(days.tomorrow, "08:00")]), "42501");
    await rejects(() => db.query("select * from public.reschedule_patient_appointment($1,$2)", [appointments.future, at(days.tomorrow, "09:00")]), "42501");
    await rejects(() => db.query("select * from public.cancel_patient_appointment($1)", [appointments.future]), "42501");
    await rejects(() => setActive(ids.patient, true), "42501");
    await rejects(() => db.query("update public.profiles set patient_active=true where id=$1", [ids.patient]), "42501");
    assert.deepEqual(await state(), before);
  });

  await scenario("reativação recupera acesso sem restaurar canceladas e permite novo agendamento", async () => {
    await asUser(ids.admin);
    await setActive(ids.patient, false);
    const inactive = await state();
    await asUser(ids.admin);
    await setActive(ids.patient, true);
    await setActive(ids.patient, true);
    const active = await state();
    assert.deepEqual(active.users, inactive.users);
    assert.deepEqual(active.appointments, inactive.appointments);
    assert.deepEqual(active.profiles, inactive.profiles.map((profile) => profile.id === ids.patient
      ? { ...profile, patient_active: true } : profile));
    await asUser(ids.patient);
    assert.deepEqual((await db.query("select id from public.profiles")).rows, [{ id: ids.patient }]);
    const history = (await db.query("select id,status from public.appointments order by id")).rows;
    assert.equal(history.length, 5);
    assert.equal(history.find((appointment) => appointment.id === appointments.future).status, "cancelled");
    assert.equal((await db.query("select id from public.booking_doctors()")).rows[0].id, ids.doctor);
    const { rows: [created] } = await db.query("select * from public.create_patient_appointment($1,$2,$3)", [
      ids.doctor, at(days.tomorrow, "08:00"), "Novo agendamento fictício",
    ]);
    assert.equal(created.patient_id, ids.patient);
    assert.equal(created.status, "scheduled");
    assert.notEqual(created.id, appointments.future);
    await asUser(ids.otherPatient);
    assert.deepEqual((await db.query("select id from public.appointments")).rows, [{ id: appointments.other }]);
    await asUser(ids.admin);
    assert.equal(Number((await list()).find((patient) => patient.id === ids.patient).appointment_count), 6);
  });
});
