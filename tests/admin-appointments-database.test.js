import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("operações administrativas de consultas exigem papel e vínculo ativos", async (t) => {
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
  for (const name of (await readdir(new URL("../supabase/migrations/", import.meta.url))).sort()) {
    if (name.endsWith(".sql")) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }

  const ids = {
    patient: "00000000-0000-4000-8000-000000000081",
    otherPatient: "00000000-0000-4000-8000-000000000082",
    doctor: "00000000-0000-4000-8000-000000000083",
    otherDoctor: "00000000-0000-4000-8000-000000000084",
    inactiveDoctor: "00000000-0000-4000-8000-000000000085",
    receptionist: "00000000-0000-4000-8000-000000000086",
    admin: "00000000-0000-4000-8000-000000000087",
    inactiveAdmin: "00000000-0000-4000-8000-000000000088",
    unlinkedDoctor: "00000000-0000-4000-8000-000000000089",
  };
  for (const [name, id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${name}@example.test`]);
  }
  await db.query("insert into public.specialties(name) values('Clínica Geral')");
  for (const name of ["doctor", "otherDoctor", "inactiveDoctor", "unlinkedDoctor"]) {
    await db.query(
      "update public.profiles set role='doctor', full_name=$1, specialty='Clínica Geral' where id=$2",
      [name, ids[name]],
    );
  }
  await db.query("update public.profiles set role='receptionist' where id=$1", [ids.receptionist]);
  for (const name of ["admin", "inactiveAdmin"]) {
    await db.query("update public.profiles set role='admin' where id=$1", [ids[name]]);
  }
  for (const name of ["doctor", "otherDoctor", "inactiveDoctor", "receptionist", "admin", "inactiveAdmin"]) {
    await db.query("insert into public.hospital_staff(profile_id, active) values($1,$2)", [
      ids[name], !["inactiveDoctor", "inactiveAdmin"].includes(name),
    ]);
  }

  const { rows: [days] } = await db.query(`
    select
      ((now() at time zone 'America/Sao_Paulo')::date + 1)::text as tomorrow,
      ((now() at time zone 'America/Sao_Paulo')::date - 1)::text as yesterday
  `);
  const at = (day, time) => `${day}T${time}:00-03:00`;
  const asUser = async (id) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || ""]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  };
  const fails = (sql, args, code) => assert.rejects(db.query(sql, args), (error) => error.code === code);
  const create = async (patient, doctor, time) => {
    await asUser(patient);
    return (await db.query("select * from public.create_patient_appointment($1,$2,null)", [doctor, at(days.tomorrow, time)])).rows[0];
  };
  const rawAppointment = async (patient, doctor, day, time) => {
    await db.exec("reset role");
    return (await db.query(`
      insert into public.appointments(patient_id, doctor_id, doctor_name, specialty, scheduled_at)
      values ($1,$2,'Profissional de teste','Clínica Geral',$3)
      returning *
    `, [patient, doctor, at(day, time)])).rows[0];
  };
  const reschedule = (id, day, time) => db.query(
    "select public.admin_reschedule_appointment($1,$2,$3::time without time zone)", [id, day, time],
  );
  const cancel = (id) => db.query("select public.admin_cancel_appointment($1)", [id]);

  let primary;
  await t.test("paciente, médico, secretaria, anônimo e administrador inativo são negados", async () => {
    primary = await create(ids.patient, ids.doctor, "08:00");
    for (const actor of [null, ids.patient, ids.doctor, ids.receptionist, ids.inactiveAdmin]) {
      await asUser(actor);
      await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [primary.id, days.tomorrow, "10:30"], "42501");
      await fails("select public.admin_cancel_appointment($1)", [primary.id], "42501");
    }
    await db.exec("reset role");
    const saved = (await db.query("select status, scheduled_at from public.appointments where id=$1", [primary.id])).rows[0];
    assert.equal(saved.status, "scheduled");
    assert.equal(new Date(saved.scheduled_at).toISOString(), new Date(at(days.tomorrow, "08:00")).toISOString());
  });

  await t.test("administrador ativo remarca e paciente e agenda da clínica veem o novo horário", async () => {
    await asUser(ids.admin);
    await reschedule(primary.id, days.tomorrow, "10:30");

    await asUser(ids.patient);
    const patientView = (await db.query("select id, scheduled_at, status from public.appointments where id=$1", [primary.id])).rows[0];
    assert.equal(patientView.status, "scheduled");
    assert.equal(new Date(patientView.scheduled_at).toISOString(), new Date(at(days.tomorrow, "10:30")).toISOString());

    await asUser(ids.admin);
    const clinicView = (await db.query("select id, scheduled_at from public.admin_list_appointments($1)", [days.tomorrow])).rows
      .find((row) => row.id === primary.id);
    assert.ok(clinicView);
    assert.equal(new Date(clinicView.scheduled_at).toISOString(), new Date(at(days.tomorrow, "10:30")).toISOString());
  });

  await t.test("rejeita conflitos do médico e do paciente sem alterar a consulta original", async () => {
    const doctorConflict = await create(ids.otherPatient, ids.doctor, "09:00");
    const patientConflict = await create(ids.patient, ids.otherDoctor, "14:00");
    await asUser(ids.admin);
    await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [primary.id, days.tomorrow, "09:00"], "23505");
    await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [primary.id, days.tomorrow, "14:00"], "23505");
    await db.exec("reset role");
    const saved = (await db.query("select scheduled_at from public.appointments where id=$1", [primary.id])).rows[0];
    assert.equal(new Date(saved.scheduled_at).toISOString(), new Date(at(days.tomorrow, "10:30")).toISOString());
    assert.ok(doctorConflict.id);
    assert.ok(patientConflict.id);
  });

  await t.test("rejeita horário indisponível, data passada e médico inadequado", async () => {
    await asUser(ids.admin);
    await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [primary.id, days.tomorrow, "17:00"], "22023");
    await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [primary.id, days.yesterday, "10:30"], "22023");

    const inactive = await rawAppointment(ids.otherPatient, ids.inactiveDoctor, days.tomorrow, "08:00");
    await asUser(ids.admin);
    await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [inactive.id, days.tomorrow, "09:00"], "22023");
    const wrongRole = await rawAppointment(ids.patient, ids.receptionist, days.tomorrow, "15:00");
    await asUser(ids.admin);
    await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [wrongRole.id, days.tomorrow, "09:00"], "22023");
    const unlinked = await rawAppointment(ids.otherPatient, ids.unlinkedDoctor, days.tomorrow, "10:00");
    await asUser(ids.admin);
    await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [unlinked.id, days.tomorrow, "09:00"], "P0002");
  });

  await t.test("cancelamento preserva o histórico e consultas antigas não podem ser alteradas", async () => {
    const future = await create(ids.otherPatient, ids.otherDoctor, "15:30");
    await asUser(ids.admin);
    await cancel(future.id);
    await db.exec("reset role");
    const saved = (await db.query("select id, status from public.appointments where id=$1", [future.id])).rows[0];
    assert.deepEqual(saved, { id: future.id, status: "cancelled" });

    await asUser(ids.otherPatient);
    assert.equal((await db.query("select status from public.appointments where id=$1", [future.id])).rows[0].status, "cancelled");
    await asUser(ids.admin);
    const clinicView = (await db.query("select status from public.admin_list_appointments($1) where id=$2", [days.tomorrow, future.id])).rows[0];
    assert.deepEqual(clinicView, { status: "cancelled" });

    const old = await rawAppointment(ids.patient, ids.doctor, days.yesterday, "10:30");
    await asUser(ids.admin);
    await fails("select public.admin_reschedule_appointment($1,$2,$3::time)", [old.id, days.tomorrow, "11:00"], "P0002");
    await fails("select public.admin_cancel_appointment($1)", [old.id], "P0002");
    await db.exec("reset role");
    assert.equal((await db.query("select status from public.appointments where id=$1", [old.id])).rows[0].status, "scheduled");
  });
});
