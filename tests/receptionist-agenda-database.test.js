import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("agenda da secretaria exige vínculo ativo e preserva as regras de reserva", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
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
    patient: "00000000-0000-4000-8000-000000000201",
    otherPatient: "00000000-0000-4000-8000-000000000202",
    doctor: "00000000-0000-4000-8000-000000000203",
    otherDoctor: "00000000-0000-4000-8000-000000000204",
    unlinkedDoctor: "00000000-0000-4000-8000-000000000205",
    receptionist: "00000000-0000-4000-8000-000000000206",
    inactiveReceptionist: "00000000-0000-4000-8000-000000000207",
    admin: "00000000-0000-4000-8000-000000000208",
  };
  for (const [name,id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${name}@example.test`]);
  }
  await db.query("insert into public.specialties(name) values('Clínica Geral')");
  for (const name of ["doctor","otherDoctor","unlinkedDoctor"]) {
    await db.query("update public.profiles set role='doctor',full_name=$1,specialty='Clínica Geral' where id=$2", [name,ids[name]]);
  }
  for (const name of ["receptionist","inactiveReceptionist"]) {
    await db.query("update public.profiles set role='receptionist' where id=$1", [ids[name]]);
  }
  await db.query("update public.profiles set role='admin' where id=$1", [ids.admin]);
  for (const name of ["doctor","otherDoctor","receptionist","inactiveReceptionist","admin"]) {
    await db.query("insert into public.hospital_staff(profile_id,active) values($1,$2)", [ids[name],name!=="inactiveReceptionist"]);
  }
  const { rows:[{day,tomorrow}] } = await db.query(`select
    ((now() at time zone 'America/Sao_Paulo')::date+2)::text as day,
    ((now() at time zone 'America/Sao_Paulo')::date+3)::text as tomorrow`);
  async function as(id) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || ""]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  }
  const fails = (query,args,code) => assert.rejects(db.query(query,args),(error) => error.code===code);
  const create = (patient,doctor,at="08:00",on=day) => db.query(
    "select public.receptionist_create_appointment($1,$2,$3,$4::time,null) as id",[patient,doctor,on,at],
  );
  const list = () => db.query("select * from public.receptionist_list_appointments($1)",[day]);
  const rescheduleSlots = "select * from public.receptionist_reschedule_slots($1,$2)";

  await t.test("anônimo, paciente, médico, admin e secretaria inativa não usam nenhum RPC", async () => {
    for (const id of [null,ids.patient,ids.doctor,ids.admin,ids.inactiveReceptionist]) {
      await as(id);
      await fails("select * from public.receptionist_catalog()",[],"42501");
      await fails("select * from public.receptionist_list_appointments($1)",[day],"42501");
      await fails("select * from public.receptionist_booking_slots($1,$2,$3)",[ids.patient,ids.doctor,day],"42501");
      await fails("select public.receptionist_create_appointment($1,$2,$3,$4::time,null)",[ids.patient,ids.doctor,day,"08:00"],"42501");
      await fails("select public.receptionist_reschedule_appointment($1,$2,$3::time)",[ids.patient,day,"08:00"],"42501");
      await fails(rescheduleSlots,[ids.patient,day],"42501");
      await fails("select public.receptionist_cancel_appointment($1)",[ids.patient],"42501");
    }
  });
  await t.test("catálogo mínimo sem acesso a tabela ou funções admin", async () => {
    await as(ids.receptionist);
    assert.equal((await db.query("select id from public.appointments")).rows.length,0);
    const catalog = (await db.query("select * from public.receptionist_catalog()")).rows;
    assert.deepEqual(Object.keys(catalog[0]),["id","name","kind"]);
    assert.equal(catalog.some((row) => row.id===ids.unlinkedDoctor),false);
    assert.equal(catalog.some((row) => row.id===ids.patient),true);
    assert.equal(catalog.some((row) => row.id===ids.doctor),true);
    await fails("select * from public.admin_list_appointments($1)",[day],"42501");
    await fails("select * from public.admin_list_patients()",[],"42501");
    await fails("select * from public.admin_list_staff()",[],"42501");
  });
  let booked;
  await t.test("agendar e remarcar atualiza paciente e agenda no horário local", async () => {
    await as(ids.receptionist);
    const slots=(await db.query("select * from public.receptionist_booking_slots($1,$2,$3)",[ids.patient,ids.doctor,day])).rows;
    assert.ok(slots.some((row)=>row.slot.startsWith("08:00")));
    booked=(await create(ids.patient,ids.doctor)).rows[0].id;
    assert.equal((await list()).rows[0].id,booked);
    await db.query("select public.receptionist_reschedule_appointment($1,$2,$3::time)",[booked,tomorrow,"09:00"]);
    assert.equal((await list()).rows.length,0);
    await as(ids.patient);
    const own=(await db.query("select id,scheduled_at from public.appointments where id=$1",[booked])).rows[0];
    assert.equal(new Date(own.scheduled_at).toISOString(),new Date(`${tomorrow}T09:00:00-03:00`).toISOString());
    await as(ids.receptionist);
    await fails("select public.admin_cancel_appointment($1)",[booked],"42501");
  });
  await t.test("rejeita conflitos, médico inadequado, horário fechado e passado", async () => {
    await as(ids.receptionist);
    await fails("select public.receptionist_create_appointment($1,$2,$3,$4::time,null)",[ids.otherPatient,ids.doctor,tomorrow,"09:00"],"23505");
    await fails("select public.receptionist_create_appointment($1,$2,$3,$4::time,null)",[ids.patient,ids.otherDoctor,tomorrow,"09:00"],"23505");
    await fails("select public.receptionist_create_appointment($1,$2,$3,$4::time,null)",[ids.patient,ids.unlinkedDoctor,day,"08:00"],"22023");
    await fails("select public.receptionist_create_appointment($1,$2,$3,$4::time,null)",[ids.patient,ids.doctor,day,"16:00"],"22023");
    await fails("select public.receptionist_create_appointment($1,$2,$3,$4::time,null)",[ids.patient,ids.doctor,"2020-01-01","08:00"],"22023");
    await fails("select public.receptionist_reschedule_appointment($1,$2,$3::time)",[booked,day,"16:00"],"22023");
  });
  await t.test("remarcação mostra apenas vagas configuradas sem conflitos de médico ou paciente", async () => {
    await as(ids.admin);
    await db.query("select public.admin_set_doctor_day($1,$2,ARRAY['16:00']::time[])",[ids.doctor,day]);
    await as(ids.receptionist);
    await create(ids.otherPatient,ids.doctor,"10:30",tomorrow);
    await create(ids.patient,ids.otherDoctor,"14:00",tomorrow);
    const times = async (date) => (await db.query(rescheduleSlots,[booked,date])).rows.map(({slot}) => slot.slice(0,5));
    assert.deepEqual(await times(tomorrow),["08:00","15:30"]);
    assert.deepEqual(await times(day),["16:00"]);
    await fails(rescheduleSlots,[booked,"2020-01-01"],"22023");
  });
  await t.test("horário personalizado às 16:00 aparece e pode ser reservado", async () => {
    await as(ids.admin);
    await db.query("select public.admin_set_doctor_day($1,$2,ARRAY['16:00']::time[])",[ids.otherDoctor,day]);
    await as(ids.receptionist);
    const slots=(await db.query("select * from public.receptionist_booking_slots($1,$2,$3)",
      [ids.otherPatient,ids.otherDoctor,day])).rows;
    assert.deepEqual(slots.map((row)=>row.slot.slice(0,5)),["16:00"]);
    const id=(await create(ids.otherPatient,ids.otherDoctor,"16:00")).rows[0].id;
    assert.equal((await list()).rows.some((row)=>row.id===id),true);
  });
  await t.test("cancelar preserva histórico e desativar vínculo revoga acesso", async () => {
    await as(ids.receptionist);
    await db.query("select public.receptionist_cancel_appointment($1)",[booked]);
    await fails(rescheduleSlots,[booked,day],"P0002");
    await fails("select public.receptionist_reschedule_appointment($1,$2,$3::time)",[booked,day,"08:00"],"P0002");
    await db.exec("reset role");
    assert.equal((await db.query("select status from public.appointments where id=$1",[booked])).rows[0].status,"cancelled");
    await db.query("update public.hospital_staff set active=false where profile_id=$1",[ids.receptionist]);
    await as(ids.receptionist);
    await fails("select * from public.receptionist_catalog()",[],"42501");
  });
});
