import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("disponibilidade diária do médico protege reservas e permissões", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  for (const name of (await readdir(new URL("../supabase/migrations/", import.meta.url))).sort()) {
    if (name.endsWith(".sql")) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }
  const ids = {
    admin: "00000000-0000-4000-8000-000000000071",
    doctor: "00000000-0000-4000-8000-000000000072",
    otherDoctor: "00000000-0000-4000-8000-000000000073",
    patient: "00000000-0000-4000-8000-000000000074",
  };
  for (const [name, id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${name}@example.test`]);
  }
  await db.query("insert into public.specialties(name) values('Clínica Geral')");
  for (const name of ["doctor", "otherDoctor"]) {
    await db.query("update public.profiles set role='doctor', full_name=$1, specialty='Clínica Geral' where id=$2", [name, ids[name]]);
    await db.query("insert into public.hospital_staff(profile_id) values($1)", [ids[name]]);
  }
  await db.query("update public.profiles set role='admin' where id=$1", [ids.admin]);
  await db.query("insert into public.hospital_staff(profile_id) values($1)", [ids.admin]);
  const day = (await db.query("select ((now() at time zone 'America/Sao_Paulo')::date + 1)::text as day")).rows[0].day;
  const at = (time) => `${day}T${time}:00-03:00`;
  const actor = async (name) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[name] || ""]);
    await db.exec(`set role ${name ? "authenticated" : "anon"}`);
  };
  const fails = (sql, args, code) => assert.rejects(db.query(sql, args), (error) => error.code === code);
  const get = (doctor = ids.doctor) => db.query("select * from public.admin_get_doctor_day($1,$2)", [doctor, day]);
  const save = (slots, doctor = ids.doctor) => db.query(
    "select public.admin_set_doctor_day($1,$2,$3::time without time zone[])", [doctor, day, slots]);

  await t.test("somente administrador ativo lê ou muda a grade; tabela não fica exposta", async () => {
    for (const role of ["", "patient", "doctor"]) {
      await actor(role);
      await fails("select * from public.admin_get_doctor_day($1,$2)", [ids.doctor, day], "42501");
      await fails("select public.admin_set_doctor_day($1,$2,ARRAY[]::time[])", [ids.doctor, day], "42501");
      await fails("select * from public.doctor_day_availability", [], "42501");
    }
  });
  await actor("admin");
  await t.test("inicia com horários padrão, valida entradas e permite fechar um dia", async () => {
    const before = (await get()).rows[0];
    assert.equal(before.customized, false);
    assert.equal(before.slots.length, 5);
    await fails("select public.admin_set_doctor_day($1,$2,ARRAY['08:00','08:00']::time[])", [ids.doctor, day], "22023");
    await fails("select public.admin_set_doctor_day($1,$2,ARRAY['08:15']::time[])", [ids.doctor, day], "22023");
    await fails("select public.admin_set_doctor_day($1,current_date - 1,ARRAY[]::time[])", [ids.doctor], "22023");
    await save([]);
    assert.deepEqual((await get()).rows[0].slots, []);
    await actor("patient");
    assert.deepEqual((await db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, day])).rows, []);
    await fails("select * from public.create_patient_appointment($1,$2,null)", [ids.doctor, at("08:00")], "22023");
  });
  await t.test("um médico e um dia não alteram os demais; restaurar reabre padrão", async () => {
    await actor("admin");
    assert.equal((await get(ids.otherDoctor)).rows[0].slots.length, 5);
    await db.query("select public.admin_reset_doctor_day($1,$2)", [ids.doctor, day]);
    assert.equal((await get()).rows[0].customized, false);
    await actor("patient");
    assert.equal((await db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, day])).rows.length, 5);
  });
  await t.test("não remove uma consulta marcada e libera somente horários escolhidos", async () => {
    const booked = (await db.query("select * from public.create_patient_appointment($1,$2,null)", [ids.doctor, at("08:00")])).rows[0];
    await actor("admin");
    await fails("select public.admin_set_doctor_day($1,$2,ARRAY['09:00']::time[])", [ids.doctor, day], "23514");
    await save(["08:00", "10:30"]);
    const configured = (await get()).rows[0];
    assert.equal(configured.customized, true);
    assert.deepEqual(configured.slots.map((slot) => slot.slice(0, 5)), ["08:00", "10:30"]);
    assert.deepEqual(configured.booked.map((slot) => slot.slice(0, 5)), ["08:00"]);
    await actor("patient");
    const slots = (await db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, day])).rows;
    assert.equal(slots.length, 1);
    assert.equal(new Date(slots[0].scheduled_at).toISOString(), new Date(at("10:30")).toISOString());
    await fails("select * from public.create_patient_appointment($1,$2,null)", [ids.doctor, at("09:00")], "22023");
    assert.equal((await db.query("select id from public.appointments where id=$1", [booked.id])).rows.length, 1);
  });
  await t.test("administrador desativado perde acesso sem afetar a disponibilidade existente", async () => {
    await db.exec("reset role");
    await db.query("update public.hospital_staff set active=false where profile_id=$1", [ids.admin]);
    await actor("admin");
    await fails("select * from public.admin_get_doctor_day($1,$2)", [ids.doctor, day], "42501");
    await fails("select public.admin_reset_doctor_day($1,$2)", [ids.doctor, day], "42501");
  });
});
