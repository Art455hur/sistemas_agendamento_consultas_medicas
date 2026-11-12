import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Postgres descartável: executa as migrações reais sem tocar no projeto hospedado.
test("CRUD, RLS, horários e papéis no Postgres", async (t) => {
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
  for (const name of (await readdir(new URL("../supabase/migrations/", import.meta.url))).sort()) {
    if (name.endsWith(".sql")) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }
  const ids = {
    patient: "00000000-0000-4000-8000-000000000001", other: "00000000-0000-4000-8000-000000000002",
    doctor: "00000000-0000-4000-8000-000000000003", doctor2: "00000000-0000-4000-8000-000000000004",
    inactive: "00000000-0000-4000-8000-000000000005", admin: "00000000-0000-4000-8000-000000000006",
  };
  for (const id of Object.values(ids)) await db.query("insert into auth.users(id) values ($1)", [id]);
  for (const key of ["doctor", "doctor2", "inactive"]) {
    await db.query("update public.profiles set role='doctor', full_name=$1, specialty='Clínica Geral' where id=$2", [key, ids[key]]);
    await db.query("insert into public.hospital_staff(profile_id,active) values ($1,$2)", [ids[key], key !== "inactive"]);
  }
  await db.query("update public.profiles set role='admin' where id=$1", [ids.admin]);
  const tomorrow = (await db.query("select ((now() at time zone 'America/Sao_Paulo')::date + 1)::text as day")).rows[0].day;
  const at = (time) => `${tomorrow}T${time}:00-03:00`;
  const asUser = async (id) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id || ""]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  };
  const fails = async (sql, args, code) => assert.rejects(db.query(sql, args), (error) => error.code === code);
  const create = (doctor, time, reason = "Teste") => db.query(
    "select * from public.create_patient_appointment($1,$2,$3)", [doctor, at(time), reason]);

  await t.test("anônimo não executa RPCs", async () => {
    await asUser(null);
    await fails("select * from public.booking_doctors()", [], "42501");
    await fails("select * from public.create_patient_appointment($1,$2,null)", [ids.doctor, at("08:00")], "42501");
  });
  await asUser(ids.patient);
  await t.test("catálogo só lista médicos ativos sem dados privados", async () => {
    const doctors = (await db.query("select * from public.booking_doctors()")).rows;
    assert.equal(doctors.length, 2);
    assert.deepEqual(Object.keys(doctors[0]).sort(), ["full_name", "id", "specialty"]);
    assert.equal((await db.query("select * from public.profiles")).rows.length, 1);
    await fails("update public.profiles set role='admin' where id=$1", [ids.patient], "42501");
  });
  await t.test("perfil persiste entre sessões e só permite os campos cadastrais do titular", async () => {
    const updated = await db.query(
      "update public.profiles set full_name=$1, phone=$2, cpf=$3, birth_date=$4 where id=$5 returning full_name, phone, cpf, birth_date::text",
      ["Paciente atualizado", "11999999999", "12345678901", "1995-05-20", ids.patient]);
    assert.equal(updated.rows.length, 1);
    await asUser(ids.patient);
    const saved = (await db.query("select full_name, phone, cpf, birth_date::text from public.profiles where id=$1", [ids.patient])).rows[0];
    assert.deepEqual(saved, updated.rows[0]);
    await asUser(ids.other);
    assert.equal((await db.query("select * from public.profiles where id=$1", [ids.patient])).rows.length, 0);
    assert.equal((await db.query("update public.profiles set full_name='Intruso' where id=$1 returning id", [ids.patient])).rows.length, 0);
    await fails("update public.profiles set cpf='12345678901' where id=$1", [ids.other], "23505");
    await fails("update public.profiles set birth_date=current_date+1 where id=$1", [ids.other], "23514");
    await fails("update public.profiles set role='admin' where id=$1", [ids.other], "42501");
    await asUser(ids.patient);
    assert.equal((await db.query("select full_name from public.profiles where id=$1", [ids.patient])).rows[0].full_name, "Paciente atualizado");
  });
  let appointment;
  await t.test("consulta deriva paciente e profissional no servidor e fica persistida", async () => {
    appointment = (await create(ids.doctor, "08:00")).rows[0];
    assert.equal(appointment.patient_id, ids.patient);
    assert.equal(appointment.doctor_name, "doctor");
    assert.equal(appointment.specialty, "Clínica Geral");
    assert.equal((await db.query("select * from public.appointments")).rows.length, 1);
    assert.equal((await db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, tomorrow])).rows.length, 4);
  });
  await t.test("outro paciente não lê, cancela ou remarca consulta alheia", async () => {
    await asUser(ids.other);
    assert.equal((await db.query("select * from public.appointments")).rows.length, 0);
    await fails("select * from public.cancel_patient_appointment($1)", [appointment.id], "P0002");
    await fails("select * from public.reschedule_patient_appointment($1,$2)", [appointment.id, at("09:00")], "P0002");
    // Nem o parâmetro de remarcação pode revelar um horário ocupado de outra pessoa.
    assert.equal((await db.query("select * from public.booking_slots($1,$2,$3)", [ids.doctor, tomorrow, appointment.id])).rows.length, 4);
  });
  await t.test("banco rejeita reserva do mesmo médico mesmo sem consultar disponibilidade", async () => {
    await fails("select * from public.create_patient_appointment($1,$2,null)", [ids.doctor, at("08:00")], "23505");
  });
  await asUser(ids.patient);
  await t.test("paciente não reserva dois médicos no mesmo instante", async () => {
    await assert.rejects(create(ids.doctor2, "08:00"), (error) => error.code === "23505");
  });
  await t.test("rejeita passado, horário fora da grade, médico inativo e motivo excessivo", async () => {
    await fails("select * from public.create_patient_appointment($1,now()-interval '1 day',null)", [ids.doctor], "22023");
    await assert.rejects(create(ids.doctor, "08:15"), (error) => error.code === "22023");
    await assert.rejects(create(ids.inactive, "09:00"), (error) => error.code === "22023");
    await assert.rejects(create(ids.doctor, "09:00", "x".repeat(2001)), (error) => error.code === "22023");
  });
  await t.test("remarcação para horário ocupado preserva a consulta original", async () => {
    await asUser(ids.other);
    const occupied = (await create(ids.doctor, "09:00")).rows[0];
    await asUser(ids.patient);
    await fails("select * from public.reschedule_patient_appointment($1,$2)", [appointment.id, at("09:00")], "23505");
    const original = (await db.query("select scheduled_at from public.appointments where id=$1", [appointment.id])).rows[0];
    assert.equal(new Date(original.scheduled_at).toISOString(), new Date(at("08:00")).toISOString());
    await asUser(ids.other);
    await db.query("select * from public.cancel_patient_appointment($1)", [occupied.id]);
    await asUser(ids.patient);
  });
  await t.test("remarcação não permite duas consultas do paciente no mesmo horário", async () => {
    const second = (await create(ids.doctor2, "10:30")).rows[0];
    await fails("select * from public.reschedule_patient_appointment($1,$2)", [appointment.id, at("10:30")], "23505");
    await db.query("select * from public.cancel_patient_appointment($1)", [second.id]);
  });
  await t.test("médicos distintos podem atender pacientes distintos no mesmo instante", async () => {
    await asUser(ids.other);
    const parallel = (await create(ids.doctor2, "08:00")).rows[0];
    assert.equal(parallel.patient_id, ids.other);
    await db.query("select * from public.cancel_patient_appointment($1)", [parallel.id]);
    await asUser(ids.patient);
  });
  await t.test("remarcar para o próprio horário não cria conflito nem duplicata", async () => {
    const same = (await db.query("select * from public.reschedule_patient_appointment($1,$2)", [appointment.id, at("08:00")])).rows[0];
    assert.equal(same.id, appointment.id);
    assert.equal((await db.query("select id from public.appointments where status='scheduled'")).rows.length, 1);
  });
  await t.test("remarcação conserva ID, médico, paciente e motivo", async () => {
    const result = (await db.query("select * from public.reschedule_patient_appointment($1,$2)", [appointment.id, at("09:00")])).rows[0];
    for (const key of ["id", "patient_id", "doctor_id", "specialty", "reason"]) assert.equal(result[key], appointment[key]);
    assert.equal(new Date(result.scheduled_at).toISOString(), new Date(at("09:00")).toISOString());
    const free = (await db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, tomorrow])).rows;
    assert.ok(free.some((row) => new Date(row.scheduled_at).toISOString() === new Date(at("08:00")).toISOString()));
    assert.ok(!free.some((row) => new Date(row.scheduled_at).toISOString() === new Date(at("09:00")).toISOString()));
  });
  await t.test("cancelamento libera horário e não pode ser revertido por remarcação", async () => {
    await db.query("select * from public.cancel_patient_appointment($1)", [appointment.id]);
    assert.equal((await db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, tomorrow])).rows.length, 5);
    await fails("select * from public.reschedule_patient_appointment($1,$2)", [appointment.id, at("10:30")], "P0002");
    await fails("select * from public.cancel_patient_appointment($1)", [appointment.id], "P0002");
  });
  await t.test("escrita direta e troca de proprietário continuam bloqueadas", async () => {
    await fails("update public.appointments set patient_id=$1 where id=$2", [ids.other, appointment.id], "42501");
    await fails("insert into public.appointments(patient_id,doctor_id,specialty,scheduled_at) values ($1,$2,'X',$3)", [ids.patient, ids.doctor, at("10:30")], "42501");
  });
  await t.test("médico e administrador não usam o CRUD reservado ao paciente", async () => {
    for (const id of [ids.doctor, ids.admin]) {
      await asUser(id);
      await assert.rejects(create(ids.doctor2, "10:30"), (error) => error.code === "42501");
    }
  });
});
