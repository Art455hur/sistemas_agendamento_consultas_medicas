import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("agenda administrativa respeita hospital, dia e papel ativo", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
    $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
  `);
  for (const name of (await readdir(new URL("../supabase/migrations/", import.meta.url))).sort()) {
    if (name.endsWith(".sql")) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }

  const ids = {
    admin: "00000000-0000-4000-8000-000000000101",
    patient: "00000000-0000-4000-8000-000000000102",
    doctor: "00000000-0000-4000-8000-000000000103",
    otherDoctor: "00000000-0000-4000-8000-000000000104",
    secretary: "00000000-0000-4000-8000-000000000105",
  };
  for (const [name, id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${name}@example.test`]);
  }
  await db.query("update public.profiles set role='admin' where id=$1", [ids.admin]);
  await db.query("update public.profiles set role='doctor',full_name='Médico da clínica' where id=$1", [ids.doctor]);
  await db.query("update public.profiles set role='doctor' where id=$1", [ids.otherDoctor]);
  await db.query("update public.profiles set role='receptionist' where id=$1", [ids.secretary]);
  await db.query("update public.profiles set full_name='Paciente da clínica' where id=$1", [ids.patient]);
  for (const id of [ids.admin, ids.doctor, ids.secretary]) {
    await db.query("insert into public.hospital_staff(profile_id) values($1)", [id]);
  }
  const insert = (doctorId, time, status = "scheduled") => db.query(`
    insert into public.appointments(patient_id,doctor_id,specialty,scheduled_at,status)
    values($1,$2,'Cardiologia',$3,$4)
    returning id
  `, [ids.patient, doctorId, time, status]);
  const inDay = (await insert(ids.doctor, "2026-11-12T03:00:00Z")).rows[0].id;
  const endDay = (await insert(ids.doctor, "2026-11-13T02:59:00Z", "cancelled")).rows[0].id;
  await insert(ids.doctor, "2026-11-12T02:59:00Z"); // Dia anterior em São Paulo.
  await insert(ids.doctor, "2026-11-13T03:00:00Z"); // Dia seguinte em São Paulo.
  await insert(ids.otherDoctor, "2026-11-12T12:00:00Z"); // Sem vínculo com o hospital.

  async function actor(name) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[name] || ""]);
    await db.exec(`set role ${name ? "authenticated" : "anon"}`);
  }
  const list = (day = "2026-11-12") => db.query("select * from public.admin_list_appointments($1::date)", [day]);
  const denied = (operation) => assert.rejects(operation, (error) => error.code === "42501");

  await t.test("anônimo, paciente, médico e secretaria não leem a agenda inteira", async () => {
    for (const name of ["", "patient", "doctor", "secretary"]) {
      await actor(name);
      await denied(list());
    }
  });
  await t.test("administrador vê só consultas do hospital no dia clínico e colunas mínimas", async () => {
    await actor("admin");
    assert.equal((await db.query("select id from public.appointments")).rows.length, 0);
    const rows = (await list()).rows;
    assert.deepEqual(rows.map((row) => row.id), [inDay, endDay]);
    assert.deepEqual(Object.keys(rows[0]), ["id", "patient_name", "doctor_name", "specialty", "scheduled_at", "status"]);
    assert.equal(rows[0].patient_name, "Paciente da clínica");
    assert.equal(rows[0].doctor_name, "Médico da clínica");
    assert.equal(rows[1].status, "cancelled");
    await assert.rejects(list(null), (error) => error.code === "22023");
  });
  await t.test("médico inativo permanece no histórico, mas admin inativo perde acesso", async () => {
    await db.exec("reset role");
    await db.query("update public.hospital_staff set active=false where profile_id=$1", [ids.doctor]);
    await actor("admin");
    assert.equal((await list()).rows.length, 2);
    await db.exec("reset role");
    await db.query("update public.hospital_staff set active=false where profile_id=$1", [ids.admin]);
    await actor("admin");
    await denied(list());
  });
});
